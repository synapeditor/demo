const express = require('express');
const request = require('request');
const { CONFIG } = require('../config');

const router = express.Router();

// POST /requestGPT
// The AI Write Supporter plugin (text channel) posts { model, messages, stream, ... }.
// We add the OpenAI key from server/.env and stream the SSE response straight back, so
// the key never reaches the browser. OpenAI emits `data: {...}` / `data: [DONE]`, which
// the plugin's worker parses directly.
router.post('/requestGPT', (req, res) => {
    if (!CONFIG.GPT_API_KEY) {
        return res.status(500).json({ message: 'GPT_API_KEY is not set in server/.env' });
    }

    // Force streaming so the plugin worker always receives an event stream.
    const body = Object.assign({}, req.body, { stream: true });

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
            res.status(502).json({ message: 'Upstream request failed', detail: String(err) });
        } else {
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
    if (!CONFIG.GPT_IMAGE_API_KEY) {
        return res.status(500).json({ message: 'GPT_IMAGE_API_KEY (or GPT_API_KEY) is not set in server/.env' });
    }

    request.post({
        url: CONFIG.GPT_IMAGE_URL,
        headers: { 'Authorization': 'Bearer ' + CONFIG.GPT_IMAGE_API_KEY },
        json: true,
        body: req.body
    }, (err, upstreamRes, data) => {
        if (err) {
            return res.status(502).json({ message: 'Upstream request failed', detail: String(err) });
        }
        res.status(upstreamRes.statusCode).json(data);
    });
});

// POST /requestGemini
// The text channel with `ai:'gemini'` posts { contents:[{role,parts:[{text}]}], ... }.
// The Gemini streaming URL (server/.env GEMINI_URL) already embeds the key, so we just
// forward the body and stream the SSE response back (Gemini emits `data: {...}` lines).
router.post('/requestGemini', (req, res) => {
    if (!CONFIG.GEMINI_URL) {
        return res.status(500).json({ message: 'GEMINI_URL is not set in server/.env' });
    }

    const upstream = request.post({
        url: CONFIG.GEMINI_URL,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
    });

    upstream.on('error', (err) => {
        if (!res.headersSent) {
            res.status(502).json({ message: 'Upstream request failed', detail: String(err) });
        } else {
            res.end();
        }
    });

    upstream.pipe(res);
    req.on('close', () => upstream.abort());
});

module.exports = router;
