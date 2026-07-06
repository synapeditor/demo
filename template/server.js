#!/usr/bin/env node
// =================================================================
// Static demo server — zero dependencies (Node's built-in http).
//
// Replaces `python -m http.server`: no Python, no `--bind ::` footgun.
// Binding is left to Node's default (dual-stack), so `http://localhost`
// resolves over both IPv6 (::1) and IPv4 (127.0.0.1) — the Evaluation
// license is locked to the `localhost` hostname, so always open it via
// `localhost`, not `127.0.0.1`.
//
// Usage:  npm start            (serves this folder on the first free port from 8137)
//         PORT=3000 npm start  (force a port)
// =================================================================
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
// When PORT is set we honor it exactly (no drifting). Otherwise we auto-pick,
// trying 8137 first and walking up to 8137+MAX_TRIES if the port is busy.
const EXPLICIT_PORT = process.env.PORT !== undefined && process.env.PORT !== '';
const START_PORT = EXPLICIT_PORT ? Number(process.env.PORT) : 8137;
const MAX_TRIES = 20; // auto-pick range: 8137..8157

if (EXPLICIT_PORT && (!Number.isInteger(START_PORT) || START_PORT < 0 || START_PORT > 65535)) {
    console.error('[synapeditor-demo] invalid PORT "' + process.env.PORT + '" — use an integer 0-65535.');
    process.exit(1);
}

const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.map': 'application/json; charset=utf-8'
};

const server = http.createServer((req, res) => {
    // Strip query string, decode, and normalize to block path traversal.
    let urlPath;
    try {
        urlPath = decodeURIComponent(req.url.split('?')[0]);
    } catch (e) {
        res.writeHead(400).end('Bad request');
        return;
    }
    if (urlPath === '/') urlPath = '/index.html';

    // Resolve inside ROOT only — reject anything that escapes it.
    const filePath = path.join(ROOT, path.normalize(urlPath));
    if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
        res.writeHead(403).end('Forbidden');
        return;
    }

    fs.stat(filePath, (err, stat) => {
        if (err || !stat.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Not Found: ' + urlPath);
            return;
        }
        const type = TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
        fs.createReadStream(filePath).pipe(res);
    });
});

// Try START_PORT, then the next few if it is busy — never kill another process.
let tries = 0;
function listen(port) {
    try {
        server.listen(port);
    } catch (err) {
        // e.g. RangeError for an out-of-range port throws synchronously.
        console.error('[synapeditor-demo] server error:', err.message);
        process.exit(1);
    }
}
server.on('listening', () => {
    const port = server.address().port;
    console.log('');
    console.log('  Synap Editor demo running:');
    console.log('  → http://localhost:' + port + '/   (use localhost, NOT 127.0.0.1)');
    console.log('');
    console.log('  Add your license to license.config.js if the editor loads empty.');
    console.log('  Stop with Ctrl+C.');
    console.log('');
});
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        // Auto-advance only when the user did NOT pin a port; a pinned port fails loudly.
        if (!EXPLICIT_PORT && tries < MAX_TRIES) {
            tries += 1;
            listen(START_PORT + tries);
            return;
        }
        console.error('[synapeditor-demo] port ' + (EXPLICIT_PORT ? START_PORT : START_PORT + tries) +
            ' is already in use. Free it or set a different PORT (e.g. PORT=3000 npm start).');
        process.exit(1);
    }
    console.error('[synapeditor-demo] server error:', err.message);
    process.exit(1);
});
listen(START_PORT);
