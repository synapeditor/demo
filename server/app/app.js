const express = require('express');
const path = require('path');
const { CONFIG, REPO_ROOT, TEMP_ROOT } = require('./config');

const uploadRoutes = require('./routes/upload');
const importRoutes = require('./routes/import');
const { router: exportRoutes, exportFileProxy, exportPbProxy } = require('./routes/export');
const { collaboProxy } = require('./routes/collabo');

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
// API routes
// =============================================================================

app.use(uploadRoutes);
app.use(importRoutes);
app.use(exportRoutes);

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
