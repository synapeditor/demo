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
    DELETE_DOC_INTERVAL, MAX_PAY_LOAD, EXPIRATION_TIME, SERVER, REDIS, TYPE, SUB_DOC_PREFIX
} = require('./consts');
const {
    getRoot, yMapGet, updateIsAlone, updateConnectionEpoch,
    getDocName, setServerInfo, isSubDoc
} = require('./utils');

// Express 앱 생성
const app = express();

app.get('/', (req, res) => {
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
            subDocPrefix: SUB_DOC_PREFIX
        },
        runtime: {
            deployDate: new Date().toLocaleDateString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            connections: wss.clients.size,
            documents: docs.size
        }
    };

    res.send(getTemplateHTML(data));
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
    const docKey = `server:${SERVER.PUBLISH_ADDRESS}:doc:${doc.name}`;
    if (doc.awareness.getStates().size === 0) {
        doc.destroy();
        docs.delete(doc.name);
        if (!isSubDoc(doc.name)) {
            lastUserIdMap.delete(doc.name);

            if (redisClient) {
                redisClient.del(`doc:${doc.name}`);  // Redis에서 채널 정보 제거
                redisClient.del(`doc:${SUB_DOC_PREFIX + doc.name}`);  // Redis에서 채널 정보 제거
                redisClient.del(docKey);
            }
        }
        logger.info(`Document deleted | docName: ${doc.name}`);
    } else if (redisClient) {
        redisClient.expire(`doc:${doc.name}`, EXPIRATION_TIME);
        redisClient.expire(`doc:${SUB_DOC_PREFIX + doc.name}`, EXPIRATION_TIME);
        redisClient.expire(docKey, EXPIRATION_TIME);
    }
}

setInterval(() => docs.forEach(destroyDoc), DELETE_DOC_INTERVAL);

wss.on('connection', async (ws, request) => {
    const docName = getDocName(request);

    if (redisClient) {
        const serverAddress = await redisClient.get(docName);

        // 채널이 다른 서버에서 관리 중이면 연결 종료
        if (serverAddress && serverAddress !== SERVER.PUBLISH_ADDRESS) {
            ws.close();
            return;
        }

        // 새로운 채널이면 현재 서버를 Redis에 등록
        if (!serverAddress) {
            if (!isSubDoc(docName)) {
                logger.info(`Redis set info for docName: ${docName}`);
                await redisClient.set(`doc:${docName}`, SERVER.PUBLISH_ADDRESS);
                await redisClient.set(`doc:${SUB_DOC_PREFIX + docName}`, SERVER.PUBLISH_ADDRESS);
                redisClient.expire(`doc:${docName}`, EXPIRATION_TIME);
                redisClient.expire(`doc:${SUB_DOC_PREFIX + docName}`, EXPIRATION_TIME);
            }
        }
    }

    const isNewDoc = !docs.has(docName);
    logger.info(`Document connected | docName: ${docName}, newDocument?: ${isNewDoc}`);


    ws.on('error', (error) => {
        logger.error(`${error} | docName: ${docName}, newDocument?: ${isNewDoc}`);
    });

    setupWSConnection(ws, request, { docName: docName });

    // Track the awareness clients this connection announces (origin === ws), so they
    // can be removed immediately on close. Upstream relies on the ~30s outdated
    // timeout because its per-connection controlled set comes up empty here.
    const closingDoc = getYDoc(docName);
    const ownedClientIds = new Set();
    const awarenessUpdateHandler = (changes, origin) => {
        if (origin !== ws) {
            return;
        }
        (changes.added || []).forEach((id) => ownedClientIds.add(id));
        (changes.updated || []).forEach((id) => ownedClientIds.add(id));
        (changes.removed || []).forEach((id) => ownedClientIds.delete(id));
    };
    closingDoc.awareness.on('update', awarenessUpdateHandler);

    ws.on('close', async () => {
        logger.info(`close | docName: ${docName}, owned: ${ownedClientIds.size}`);
        closingDoc.awareness.off('update', awarenessUpdateHandler);
        if (ownedClientIds.size > 0) {
            awarenessProtocol.removeAwarenessStates(closingDoc.awareness, Array.from(ownedClientIds), null);
        }
        destroyDoc(closingDoc);
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

server.listen(SERVER.PORT, SERVER.HOST, () => {
    logger.info(`Collabo Server running at '${SERVER.HOST}' on port ${SERVER.PORT}! and publishAddress: ${SERVER.PUBLISH_ADDRESS}`);
});
