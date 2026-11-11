const express = require('express');
const request = require('request');
const { CONFIG } = require('../config');
const { sendError } = require('../errors');

const router = express.Router();

// These three routes take a body from anyone who can reach the demo and hand it to a paid
// upstream under the server's own key, so what the body may contain is decided here.

// Fields a caller has no business setting: each one either carries a credential or says
// where the request should go. The key comes from server/.env and the URL from CONFIG.
const REJECTED_FIELDS = [
    'apiKey', 'api_key', 'key', 'authorization', 'Authorization',
    'headers', 'url', 'baseURL', 'base_url', 'endpoint'
];

function isPlainObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isFilledString(value) {
    return typeof value === 'string' && value.trim() !== '';
}

// Says what was wrong with the body and nothing about the server.
function invalidRequest(res, detail) {
    sendError(res, 400, 'INVALID_REQUEST', detail);
}

// The missing variable's name tells an unauthenticated caller how the demo is wired, so it
// goes to the server log and the caller gets a fixed code.
function notConfigured(res, variable) {
    console.error('[editor-demo] ' + variable + ' is not set in server/.env');
    sendError(res, 503, 'AI_NOT_CONFIGURED', 'AI is not configured');
}

// String(err) carries the upstream host and port, and for a URL parse error the whole
// address - GEMINI_URL embeds the key. Log it, answer with the code alone.
function upstreamFailed(res, err) {
    console.error('[editor-demo] AI upstream failed:', err);
    sendError(res, 502, 'UPSTREAM_FAILED', 'Upstream request failed');
}

function forwardableBody(body) {
    const next = Object.assign({}, body);
    REJECTED_FIELDS.forEach(field => delete next[field]);

    return next;
}

// POST /requestGPT
// The AI Write Supporter plugin (text channel) posts { model, messages, stream, ... }.
// We add the OpenAI key from server/.env and stream the SSE response straight back, so
// the key never reaches the browser. OpenAI emits `data: {...}` / `data: [DONE]`, which
// the plugin's worker parses directly.
router.post('/requestGPT', (req, res) => {
    if (!isPlainObject(req.body)) {
        return invalidRequest(res, 'a JSON object body is required');
    }

    const messages = req.body.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
        return invalidRequest(res, 'messages must be a non-empty array');
    }

    // content is a string in the text channel and an array in the vision one, so only its
    // presence is checked here; the upstream rejects a shape it cannot read.
    const malformed = messages.some(message => {
        return !isPlainObject(message) || !isFilledString(message.role) || message.content === undefined;
    });

    if (malformed) {
        return invalidRequest(res, 'each message needs a role and a content');
    }

    if (req.body.model !== undefined && !isFilledString(req.body.model)) {
        return invalidRequest(res, 'model must be a non-empty string');
    }

    // Chat Completions bills n completions per request, so only a single one is allowed.
    // The plugin never sends n for chat.
    if (req.body.n !== undefined && req.body.n !== 1) {
        return invalidRequest(res, 'n must be 1');
    }

    if (!CONFIG.GPT_API_KEY) {
        return notConfigured(res, 'GPT_API_KEY');
    }

    // Force streaming so the plugin worker always receives an event stream.
    const body = Object.assign(forwardableBody(req.body), { stream: true });

    const upstream = request.post({
        url: CONFIG.GPT_URL,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + CONFIG.GPT_API_KEY
        },
        body: JSON.stringify(body)
    });

    upstream.on('error', (err) => {
        if (!res.headersSent) {
            upstreamFailed(res, err);
        } else {
            console.error('[editor-demo] AI upstream failed mid-stream:', err);
            res.end();
        }
    });

    // Forwards the upstream status, headers (text/event-stream) and body to the client.
    upstream.pipe(res);

    // Abort the upstream call if the browser disconnects (e.g. user hits Esc).
    req.on('close', () => upstream.abort());
});

// POST /requestGPTImage
// The image channel posts { model, prompt, n, size, quality, ... }. We add the key and
// return OpenAI's JSON response (image data) as-is.
router.post('/requestGPTImage', (req, res) => {
    if (!isPlainObject(req.body)) {
        return invalidRequest(res, 'a JSON object body is required');
    }

    if (!isFilledString(req.body.prompt)) {
        return invalidRequest(res, 'prompt must be a non-empty string');
    }

    if (req.body.model !== undefined && !isFilledString(req.body.model)) {
        return invalidRequest(res, 'model must be a non-empty string');
    }

    // n is what the upstream bills, so an unbounded value is the one worth stopping here.
    if (req.body.n !== undefined && (!Number.isInteger(req.body.n) || req.body.n < 1 || req.body.n > 10)) {
        return invalidRequest(res, 'n must be a whole number from 1 to 10');
    }

    if (!CONFIG.GPT_IMAGE_API_KEY) {
        return notConfigured(res, 'GPT_IMAGE_API_KEY (or GPT_API_KEY)');
    }

    request.post({
        url: CONFIG.GPT_IMAGE_URL,
        headers: { 'Authorization': 'Bearer ' + CONFIG.GPT_IMAGE_API_KEY },
        json: true,
        body: forwardableBody(req.body)
    }, (err, upstreamRes, data) => {
        if (err) {
            return upstreamFailed(res, err);
        }
        res.status(upstreamRes.statusCode).json(data);
    });
});

// POST /requestGemini
// The text channel with `ai:'gemini'` posts { contents:[{role,parts:[{text}]}], ... }.
// The Gemini streaming URL (server/.env GEMINI_URL) already embeds the key, so we just
// forward the body and stream the SSE response back (Gemini emits `data: {...}` lines).
router.post('/requestGemini', (req, res) => {
    if (!isPlainObject(req.body)) {
        return invalidRequest(res, 'a JSON object body is required');
    }

    const contents = req.body.contents;

    if (!Array.isArray(contents) || contents.length === 0) {
        return invalidRequest(res, 'contents must be a non-empty array');
    }

    const malformed = contents.some(entry => {
        return !isPlainObject(entry) || !Array.isArray(entry.parts);
    });

    if (malformed) {
        return invalidRequest(res, 'each contents entry needs a parts array');
    }

    if (!CONFIG.GEMINI_URL) {
        return notConfigured(res, 'GEMINI_URL');
    }

    const upstream = request.post({
        url: CONFIG.GEMINI_URL,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(forwardableBody(req.body))
    });

    upstream.on('error', (err) => {
        if (!res.headersSent) {
            upstreamFailed(res, err);
        } else {
            console.error('[editor-demo] AI upstream failed mid-stream:', err);
            res.end();
        }
    });

    upstream.pipe(res);
    req.on('close', () => upstream.abort());
});

module.exports = router;
