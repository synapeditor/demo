const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const logger = require('./logger');
const packageJson = require('../package.json');
const { getSupportEditorVersion } = require('./utils');
const { docs, getYDoc, setupWSConnection } = require('../node_modules/y-websocket/bin/utils.cjs');
const awarenessProtocol = require('y-protocols/awareness');
const { getTemplateHTML } = require('./utils/serverTemplate');
const { initializeMonitoringApi } = require('./monitoring/monitoringApi');
const { connectRedis } = require('./redis/connectRedis');
const {
    DELETE_DOC_INTERVAL, MAX_PAY_LOAD, EXPIRATION_TIME, SERVER, REDIS, TYPE, SUB_DOC_PREFIX, PERSISTENCE
} = require('./consts');
const { RESTORE_RESULT, initPersistence, restoreDoc, saveDoc, saveDocAsync, removeDoc, cleanupSnapshots, getStorageStatus } = require('./persistence');
const { collectAlarms, getExpectedMemoryBytes } = require('./monitoring/alarms');
const { collectDocuments } = require('./documentStatus');
const { probeConnections, closeStaleConnections, shouldProbe } = require('./livenessProbe');
const {
    getRoot, yMapGet, updateIsAlone, updateConnectionEpoch, resetRoomState,
    getDocName, getDocKey, setServerInfo, isSubDoc
} = require('./utils');

/**
 * 고아 스냅샷을 정리하는 주기입니다.
 * 수명(ORPHAN_TTL)보다 드물게 돌면 만료된 스냅샷이 그만큼 더 남으므로 같은 주기로 돕니다.
 */
const SNAPSHOT_CLEANUP_INTERVAL = PERSISTENCE.ORPHAN_TTL;

// Express 앱 생성
const app = express();

app.get('/', (req, res) => {
    const documentList = collectDocuments(docs, dirtyDocs);
    const storage = getStorageStatus();
    const data = {
        server: {
            name: packageJson.name,
            version: packageJson.version,
            editorVersion: getSupportEditorVersion(),
            patchDate: new Date(packageJson.date).toLocaleDateString(),
            description: packageJson.description,
            host: SERVER.HOST,
            port: SERVER.PORT,
            publishAddress: SERVER.PUBLISH_ADDRESS
        },
        redis: {
            host: REDIS.HOST,
            port: REDIS.PORT,
            enabled: REDIS.ENABLE,
            url: REDIS.URL,
            isOpen: !!redisClient && redisClient.isOpen
        },
        constants: {
            deleteDocInterval: DELETE_DOC_INTERVAL,
            maxPayload: MAX_PAY_LOAD,
            expirationTime: EXPIRATION_TIME,
            subDocPrefix: SUB_DOC_PREFIX,
            persistenceEnabled: PERSISTENCE.ENABLE,
            persistenceDir: PERSISTENCE.DIR,
            persistenceSaveInterval: PERSISTENCE.SAVE_INTERVAL,
            persistenceOrphanTtl: PERSISTENCE.ORPHAN_TTL
        },
        runtime: {
            deployDate: new Date().toLocaleDateString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            connections: wss.clients.size,
            documents: docs.size
        },
        documents: documentList,
        // 디스크가 차면 저장이 실패하고, 실패하는 동안 문서가 메모리에 쌓여 서버가 죽는다.
        // 그 과정을 볼 수 있어야 한다. (EDITOR-13276)
        storage,
        expectedMemory: getExpectedMemoryBytes(documentList.length),
        alarms: collectAlarms({ storage, documentCount: documentList.length, heapUsed: process.memoryUsage().heapUsed })
    };

    res.send(getTemplateHTML(data));
});

// 모니터링 도구용. 문서 방에 접속하지 않고 상태를 볼 수 있어야 계측이 접속자 수를 흔들지 않는다.
app.get('/documents.json', (req, res) => {
    const documentList = collectDocuments(docs, dirtyDocs);
    const storage = getStorageStatus();
    const heapUsed = process.memoryUsage().heapUsed;
    res.json({
        connections: wss.clients.size,
        documents: docs.size,
        // 도구가 "언제 정리되는지" 를 알아야 정리 확인을 기다릴 수 있다.
        deleteDocInterval: DELETE_DOC_INTERVAL,
        // 대시보드의 런타임 값도 1초 갱신에 실어 보낸다. 페이지를 새로 읽지 않아도 최신이어야 한다.
        uptime: process.uptime(),
        heapUsed,
        list: documentList,
        // 디스크 여유·저장 실패·상주 문서 대비 메모리. 알람은 여기서 판정해 내려보낸다. (EDITOR-13276)
        storage,
        expectedMemory: getExpectedMemoryBytes(documentList.length),
        alarms: collectAlarms({ storage, documentCount: documentList.length, heapUsed })
    });
});

const wss = new WebSocket.Server({ noServer: true, maxPayload: MAX_PAY_LOAD });
const server = http.createServer(app);

let redisClient = null;
if (REDIS.ENABLE) {
    // Redis 클라이언트 연결
    redisClient = connectRedis();

    // redis에 서버 정보 등록 및 주기적으로 상태 업데이트
    initializeMonitoringApi(redisClient, SERVER.PUBLISH_ADDRESS, wss);
}


/**
 * 문서의 마지막 유저 아이디를 저장하는 맵입니다.
 * { [docName] : userId }
 */
const lastUserIdMap = new Map();

/**
 * 스냅샷 복원에 실패한 문서 이름입니다.
 * 복원이 실패한 문서를 그대로 저장하면 빈 상태가 마지막 정상본을 덮어씁니다. 저장을 건너뜁니다.
 */
const restoreFailedDocs = new Set();

/**
 * 마지막 저장 이후 편집이 있었던 문서 이름입니다.
 */
const dirtyDocs = new Set();

/**
 * 디스크 쓰기가 아직 끝나지 않은 문서 이름입니다. 같은 문서를 겹쳐 쓰면 임시 파일이 서로를 덮습니다.
 */
const savingDocs = new Set();

/**
 * 편집이 있었던 문서를 저장합니다.
 *
 * 스냅샷은 서버가 비정상 종료됐을 때 세션을 이어가기 위한 것이므로 세션이 살아 있는 동안 저장합니다.
 * (문서를 정리하는 시점에 저장하면, 세션이 끝난 뒤에도 스냅샷이 남아
 *  나중에 그 문서를 열 때 낡은 서버본이 호스트의 최신본을 덮습니다)
 */
const saveDirtyDocs = () => {
    const startedAt = Date.now();
    let encoded = 0;

    for (const docName of Array.from(dirtyDocs)) {
        // 인코딩은 동기라 회차가 길어지면 그만큼 전원의 편집 전달이 밀린다.
        // 예산을 넘기면 남은 문서는 다음 회차로 넘긴다.
        if (encoded > 0 && Date.now() - startedAt >= PERSISTENCE.SAVE_TIME_BUDGET) {
            break;
        }

        const doc = docs.get(docName);
        if (!doc) {
            dirtyDocs.delete(docName);
            continue;
        }

        // 복원에 실패한 문서를 저장하면 빈 상태가 마지막 정상본을 덮어씁니다.
        if (restoreFailedDocs.has(docName)) {
            continue;
        }

        // 앞 회차의 쓰기가 아직 안 끝난 문서는 건너뜁니다. 겹쳐 쓰면 임시 파일이 서로를 덮습니다.
        if (savingDocs.has(docName)) {
            continue;
        }

        // 인코딩 시점의 상태를 저장하므로, 표시는 지금 지웁니다.
        // 쓰기가 끝난 뒤에 지우면 그 사이의 편집이 저장되지 않은 채 표시만 사라집니다.
        savingDocs.add(docName);
        dirtyDocs.delete(docName);
        encoded++;

        saveDocAsync(docName, doc)
            .then((saved) => {
                // 저장에 실패하면 표시를 되살려 다음 주기에 다시 시도합니다.
                if (!saved) {
                    dirtyDocs.add(docName);
                    return;
                }

                // 쓰는 사이에 세션이 끝났다면 방금 쓴 파일을 지웁니다.
                // 남겨 두면 다음에 이 문서를 열 때 낡은 서버본이 복원되어 같은 방으로 보입니다.
                if (!docs.has(docName)) {
                    removeDoc(docName);
                }
            })
            .finally(() => savingDocs.delete(docName));
    }

    const elapsed = Date.now() - startedAt;
    if (encoded && (elapsed >= PERSISTENCE.SAVE_TIME_BUDGET || dirtyDocs.size)) {
        // 관측 수단이 없으면 이 비용은 "가끔 편집이 튄다" 로만 드러난다.
        logger.info(`Snapshot round | encoded: ${encoded}, elapsed: ${elapsed}ms, deferred: ${dirtyDocs.size}`);
    }
};

/**
 * 남은 문서를 전부 동기로 저장합니다. 종료 신호에서만 씁니다.
 *
 * 주기 저장은 쓰기를 기다리지 않지만, 종료 경로에서는 기다려야 합니다.
 * 기다리지 않으면 쓰기가 끝나기 전에 프로세스가 죽어 편집이 사라집니다.
 */
const saveAllDirtySync = () => {
    dirtyDocs.forEach((docName) => {
        const doc = docs.get(docName);
        if (doc && !restoreFailedDocs.has(docName)) {
            saveDoc(docName, doc);
        }
        dirtyDocs.delete(docName);
    });
};

/**
 * yDoc의 lastUserId를 서버의 lastUserId로 설정합니다.
 * @param {YDoc} yDoc
 */
const updateLastUserId = (yDoc) => {
    const docName = yDoc.name;
    const root = getRoot(yDoc);
    const lastUserId = root.get(TYPE.LAST_USER_ID);
    const userId = lastUserIdMap.get(docName);

    lastUserId !== userId && root.set(TYPE.LAST_USER_ID, userId)
};

/**
 * 공동편집중 연결이 모두 끊긴 문서를 찾아 제거합니다.
 * @param {WSSharedDoc} doc
 */
const destroyDoc = async (doc) => {
    if (!doc) {
        return;
    }

    // 저장이 진행 중이면 다음 주기로 미룬다. 지금 지우면 뒤늦게 끝난 쓰기가 스냅샷을 되살리고,
    // 그 파일로 복원된 방이 "같은 방" 으로 보여 낡은 사본을 밀어넣는 판정이 무력해진다.
    if (savingDocs.has(doc.name)) {
        return;
    }

    const docKey = `server:${SERVER.PUBLISH_ADDRESS}:doc:${doc.name}`;
    // awareness 는 접속 직후 별도 메시지로 오므로, 그것만 보면 살아 있는 연결이 있는 문서를 지울 수 있다.
    if (doc.awareness.getStates().size === 0 && doc.conns.size === 0) {
        // 세션이 여기서 끝난다. 스냅샷은 비정상 종료 대비용이므로 함께 지운다.
        // 남겨 두면 나중에 이 문서를 열 때 낡은 서버본이 복원되어 호스트의 최신본을 덮는다.
        // (짧은 끊김은 DELETE_DOC_INTERVAL 유예가 담당하므로 여기까지 오지 않는다)
        removeDoc(doc.name);
        doc.destroy();
        docs.delete(doc.name);
        dirtyDocs.delete(doc.name);
        restoreFailedDocs.delete(doc.name);
        if (!isSubDoc(doc.name)) {
            lastUserIdMap.delete(doc.name);

            if (redisClient) {
                redisClient.del(getDocKey(doc.name)).catch((error) => logger.error(`Redis del failed | error: ${error}`));  // Redis에서 채널 정보 제거
                redisClient.del(getDocKey(SUB_DOC_PREFIX + doc.name)).catch((error) => logger.error(`Redis del failed | error: ${error}`));  // Redis에서 채널 정보 제거
                redisClient.del(docKey).catch((error) => logger.error(`Redis del failed | error: ${error}`));
            }
        }
        logger.info(`Document deleted | docName: ${doc.name}`);
    } else if (redisClient) {
        redisClient.expire(getDocKey(doc.name), EXPIRATION_TIME).catch((error) => logger.error(`Redis expire failed | error: ${error}`));
        redisClient.expire(getDocKey(SUB_DOC_PREFIX + doc.name), EXPIRATION_TIME).catch((error) => logger.error(`Redis expire failed | error: ${error}`));
        redisClient.expire(docKey, EXPIRATION_TIME).catch((error) => logger.error(`Redis expire failed | error: ${error}`));
    }
}

setInterval(() => docs.forEach(destroyDoc), DELETE_DOC_INTERVAL);

if (initPersistence()) {
    logger.info(`Persisting documents to '${PERSISTENCE.DIR}'`);
    const removed = cleanupSnapshots(docs.keys());
    logger.info(`Orphan snapshot cleanup on start | removed: ${removed}`);
    setInterval(() => cleanupSnapshots(docs.keys()), SNAPSHOT_CLEANUP_INTERVAL);
    setInterval(saveDirtyDocs, PERSISTENCE.SAVE_INTERVAL);
}

wss.on('connection', async (ws, request) => {
    const docName = getDocName(request);

    // 리스너 없는 'error' 는 프로세스를 종료시킨다. Redis 조회 전에 먼저 건다.
    ws.on('error', (error) => {
        logger.error(`${error} | docName: ${docName}`);
    });

    if (redisClient) {
        // 저장할 때 쓰는 키(`doc:<문서명>`)와 같은 키로 조회해야 한다.
        // 키가 어긋나면 항상 "등록된 서버 없음"이 되어, 같은 문서가 여러 서버에 각각 열린다.
        // Redis 장애가 프로세스 종료로 번지지 않도록 여기서 흡수한다.
        // 조회에 실패하면 매핑을 모르는 것으로 보고 진행한다(단일 서버에서는 영향 없음).
        const serverAddress = await redisClient.get(getDocKey(docName))
            .catch((error) => { logger.error(`Redis get failed | docName: ${docName}, error: ${error}`); return null; });

        // 채널이 다른 서버에서 관리 중이면 연결 종료
        if (serverAddress && serverAddress !== SERVER.PUBLISH_ADDRESS) {
            logger.warn(`Rejected, served by another server | docName: ${docName}, server: ${serverAddress}`);
            ws.close(1013, 'served by another server');
            return;
        }

        // 새로운 채널이면 현재 서버를 Redis에 등록
        if (!serverAddress) {
            if (!isSubDoc(docName)) {
                logger.info(`Redis set info for docName: ${docName}`);
                // set 과 expire 를 나눠 부르면 그 사이에 죽었을 때 TTL 없는 매핑이 남아
                // 그 문서를 아무도 열 수 없게 된다. 한 번에 설정한다.
                await Promise.all([
                    redisClient.set(getDocKey(docName), SERVER.PUBLISH_ADDRESS, 'EX', EXPIRATION_TIME),
                    redisClient.set(getDocKey(SUB_DOC_PREFIX + docName), SERVER.PUBLISH_ADDRESS, 'EX', EXPIRATION_TIME)
                ]).catch((error) => logger.error(`Redis set failed | docName: ${docName}, error: ${error}`));
            }
        }
    }

    const isNewDoc = !docs.has(docName);
    logger.info(`Document connected | docName: ${docName}, newDocument?: ${isNewDoc}`);

    if (!isSubDoc(docName)) {
        // 본문이 아직 서버에 없는 문서에 새 사용자가 들어왔다면, 먼저 있던 사람이 살아 있는지
        // 지금 확인한다. 죽은 연결을 붙들고 있으면 소유권이 넘어가지 않아, 새 사용자의 편집이
        // 나중에 복귀한 소유자의 사본에 덮인다. (EDITOR-13183)
        const existing = docs.get(docName);
        const isPublished = existing ? !!yMapGet(getRoot(existing), [TYPE.SUB]) : false;
        if (shouldProbe(existing, isPublished)) {
            // 하트비트가 멈춘 접속자는 즉시 정리한다(애플리케이션 생존 판정).
            const closed = closeStaleConnections(existing);
            // 소켓 자체가 죽은 경우는 pong 이 오지 않는다(기기 잠듦 등). 이쪽은 응답을 기다린다.
            const probed = probeConnections(existing);
            logger.info(`Liveness check | docName: ${docName}, closed: ${closed}, probed: ${probed}`);
        }
    }


    ws.on('close', async () => {
        logger.info(`close | docName: ${docName}, newDocument?: ${isNewDoc}`);
        // 여기서 문서를 지우지 않는다. 짧게 끊긴 사용자가 같은 방으로 돌아오게 하는 것이
        // 정리 유예(DELETE_DOC_INTERVAL)의 목적이고, 정리는 그 주기 스윕이 소유한다.
        //
        // 지금까지 이 자리에 destroyDoc 호출이 있었지만, "닫히는 연결이 아직 conns 에 남아
        // 있어 조건이 거짓이 된다" 는 실행 순서에 기대어 조용히 실패해 왔다. 그 우연이 깨지면
        // (예: 이 핸들러 안에서 문서에 무언가를 쓰면) 마지막 접속자가 나가는 즉시 방이 지워져
        // 유예가 통째로 사라진다. 의도를 코드로 못 박는다.
    });

    if (isNewDoc) {
        // 클라이언트와 sync를 시작하기 전에 저장해 둔 편집 이력을 복원한다.
        const yDoc = getYDoc(docName);
        if (restoreDoc(docName, yDoc) === RESTORE_RESULT.FAILED) {
            // 복원 실패를 무시하고 빈 문서로 열면, 그 빈 상태가 다시 스냅샷을 덮어써
            // 마지막 정상본이 사라진다. 이 문서는 이번 수명 동안 저장하지 않는다.
            restoreFailedDocs.add(docName);
        }

        // 접속 상태 정리와 방 식별자는 루트 방의 것이다. 서브 방에서 같은 자리는 본문 Map 이라
        // 건드리면 안 된다. (복원과 저장 표시는 서브 방에도 필요하므로 그대로 둔다)
        resetRoomState(yDoc, docName);

        // 편집이 있었음을 표시한다. 주기 저장이 이 표시만 보고 저장한다.
        // 복원·접속상태 정리로 표시가 서지 않도록 그 뒤에 건다.
        yDoc.on('update', () => dirtyDocs.add(docName));
    }

    setupWSConnection(ws, request, { docName: docName });

    // [데모 패치] 이 연결이 알린 접속 상태(커서, 이름 표시)를 모아 두었다가, 연결이 닫히면 바로 지운다.
    // 원본은 연결별 목록이 이 경로에서 비어 있어 약 30초 뒤 시간 초과로만 지워진다.
    // 방(문서)은 지우지 않는다. 잠깐 끊긴 사용자가 돌아오도록 원본의 정리 유예를 그대로 둔다.
    const presenceDoc = getYDoc(docName);
    const ownedClientIds = new Set();
    const trackOwnedClients = (changes, origin) => {
        if (origin !== ws) {
            return;
        }
        (changes.added || []).forEach((id) => ownedClientIds.add(id));
        (changes.updated || []).forEach((id) => ownedClientIds.add(id));
        (changes.removed || []).forEach((id) => ownedClientIds.delete(id));
    };
    presenceDoc.awareness.on('update', trackOwnedClients);
    ws.on('close', () => {
        presenceDoc.awareness.off('update', trackOwnedClients);
        if (ownedClientIds.size > 0) {
            awarenessProtocol.removeAwarenessStates(presenceDoc.awareness, Array.from(ownedClientIds), null);
        }
    });

    if (!isNewDoc || isSubDoc(docName)) {
        return;
    }

    const yDoc = getYDoc(docName);
    const awareness = yDoc.awareness;

    let prevUserKey = '';
    awareness.on('change', async () => {
        const states = awareness.getStates();
        const userKey = Array.from(states.keys()).sort().join(',');

        if (userKey === prevUserKey) {
            return;
        }
        prevUserKey = userKey;

        let userId = lastUserIdMap.get(docName);
        if (!userId || !states.has(userId)) {
            userId = states.keys().next().value;
            if (userId) {
                lastUserIdMap.set(docName, userId);
                logger.info(`update last userId, lastUserId: ${getRoot(yDoc).get(TYPE.LAST_USER_ID)}, selectedUserId: ${userId} | docName: ${docName}`);
            }
        }

        const isAlone = yMapGet(getRoot(yDoc), [TYPE.IS_ALONE]) ?? true;
        const connectionCount = states.size;

        if (!isAlone && connectionCount === 1) {
            logger.info(`be alone, lastUserId: ${getRoot(yDoc).get(TYPE.LAST_USER_ID)}, selectedUserId: ${userId} | docName: ${docName}`);
        } else if (isAlone && connectionCount > 1) {
            logger.info(`be together, lastUserId: ${getRoot(yDoc).get(TYPE.LAST_USER_ID)}, selectedUserId: ${userId} | docName: ${docName}`);
        }

        yDoc.transact(() => {
            updateConnectionEpoch(yDoc);
            updateIsAlone(yDoc);
            if (userId) {
                updateLastUserId(yDoc);
            }
        });
    });
    setServerInfo(yDoc);
});

server.on('upgrade', (request, socket, head) => {
    // You may check auth of request here..
    // See https://github.com/websockets/ws#client-authentication
    /**
     * @param {any} ws
     */
    const handleAuth = ws => {
        wss.emit('connection', ws, request);
    }
    wss.handleUpgrade(request, socket, head, handleAuth);
})

/**
 * 종료 신호를 받으면 편집분을 저장한 뒤 끝냅니다.
 * 저장하지 않으면 마지막 주기 저장 이후의 편집이 사라지고, 재시작 후 복원의 기준이 낡습니다.
 * 신호 핸들러를 걸면 기본 동작(종료)이 없어지므로 직접 종료해야 합니다.
 * @param {string} signal
 */
const saveAndExit = (signal) => {
    logger.info(`${signal} received, saving documents | dirty: ${dirtyDocs.size}`);
    saveAllDirtySync();
    process.exit(0);
};

process.on('SIGTERM', () => saveAndExit('SIGTERM'));
process.on('SIGINT', () => saveAndExit('SIGINT'));

process.on('unhandledRejection', (error) => {
    // 처리되지 않은 거부는 기본적으로 프로세스를 종료시킨다. 공동편집 서버가 죽으면
    // 아직 저장되지 않은 모든 문서가 사라지므로 로그만 남기고 살려 둔다.
    logger.error(`Unhandled rejection | error: ${error}`);
});

server.listen(SERVER.PORT, SERVER.HOST, () => {
    logger.info(`Collabo Server running at '${SERVER.HOST}' on port ${SERVER.PORT}! and publishAddress: ${SERVER.PUBLISH_ADDRESS}`);
});
