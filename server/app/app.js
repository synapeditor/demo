const express = require('express');
const path = require('path');
const { CONFIG, REPO_ROOT, TEMP_ROOT } = require('./config');

const uploadRoutes = require('./routes/upload');
const importRoutes = require('./routes/import');
const { router: exportRoutes, exportFileProxy, exportPbProxy } = require('./routes/export');
const { collaboProxy } = require('./routes/collabo');
const aiRoutes = require('./routes/ai');
const ocrRoutes = require('./routes/ocr');

const app = express();

// =============================================================================
// Proxy middleware (MUST be registered BEFORE bodyParser)
// =============================================================================

app.post('/exportFile', exportFileProxy);
app.post('/exportPb', exportPbProxy);
app.use('/collabo_ws', collaboProxy);

// =============================================================================
// Body parsers (after proxy)
// =============================================================================

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true }));

// =============================================================================
// Demo-server health probe
// =============================================================================
// A path that ONLY the demo server answers — a plain static file server (e.g. a
// page opened from the npm package) returns 404 here. It also reports which
// backends are reachable (TCP) and which AI/OCR keys are set, so index.html can
// flag the exact features whose server isn't running. Server-feature pages use it
// (assets/server-check.js) to gate with a "get the server from GitHub" dialog.

const net = require('net');

// Resolve "is this backend accepting TCP connections?" — fast, protocol-agnostic
// (works for http export/converter and the collabo WebSocket alike).
function backendUp(urlStr, timeout) {
    return new Promise((resolve) => {
        let host, port;
        try {
            const u = new URL(urlStr);
            host = u.hostname;
            port = Number(u.port) || ((u.protocol === 'https:' || u.protocol === 'wss:') ? 443 : 80);
        } catch (e) { return resolve(false); }
        const sock = new net.Socket();
        let done = false;
        const finish = (v) => { if (done) return; done = true; try { sock.destroy(); } catch (e) {} resolve(v); };
        sock.setTimeout(timeout || 1200);
        sock.once('connect', () => finish(true));
        sock.once('timeout', () => finish(false));
        sock.once('error', () => finish(false));
        sock.connect(port, host);
    });
}

// Intentional: localhost-only demo introspection. Exposes backend up/down + AI/OCR key
// PRESENCE (booleans only, never values) so the index can hint which features are runnable.
app.get('/__demo/health', async (req, res) => {
    const [converter, exportApi, collabo] = await Promise.all([
        backendUp(CONFIG.CONVERTER_SERVER),
        backendUp(CONFIG.EXPORT_SERVER),
        backendUp(CONFIG.COLLABO_SERVER)
    ]);
    res.json({
        ok: true,
        server: 'editor-demo',
        backends: { converter, export: exportApi, collabo },
        keys: {
            gpt: !!CONFIG.GPT_API_KEY,
            gemini: !!CONFIG.GEMINI_URL,
            ocr: !!CONFIG.OCR_API_KEY
        }
    });
});

// =============================================================================
// API routes
// =============================================================================

app.use(uploadRoutes);
app.use(importRoutes);
app.use(exportRoutes);
app.use(aiRoutes);
app.use(ocrRoutes);

// =============================================================================
// Static serving
// =============================================================================

// Uploaded / imported media
app.use('/tmp', express.static(TEMP_ROOT));

// The main site at the SAME origin, so server-feature pages reuse the existing
// assets and call same-origin APIs. Only known-safe paths are exposed — never the
// repo root — so server-demo/.env, .git and node_modules stay private.
app.use('/assets', express.static(path.join(REPO_ROOT, 'assets')));
app.use('/html', express.static(path.join(REPO_ROOT, 'html')));
app.get('/license.config.js', (req, res) => res.sendFile(path.join(REPO_ROOT, 'license.config.js')));
app.get(['/', '/index.html'], (req, res) => res.sendFile(path.join(REPO_ROOT, 'index.html')));

// =============================================================================
// Start server
// =============================================================================

const server = app.listen(CONFIG.PORT, () => {
    console.log('[editor-demo] server started');
    console.log('[editor-demo] url: http://localhost:' + CONFIG.PORT);
    console.log('[editor-demo] CONVERTER_SERVER:', CONFIG.CONVERTER_SERVER);
    console.log('[editor-demo] EXPORT_SERVER:', CONFIG.EXPORT_SERVER);
    console.log('[editor-demo] COLLABO_SERVER:', CONFIG.COLLABO_SERVER);
});

// Attach WebSocket upgrade handler for collabo proxy
server.on('upgrade', (req, socket, head) => {
    if (req.url && req.url.startsWith('/collabo_ws')) {
        collaboProxy.upgrade(req, socket, head);
    }
});
