const { createProxyMiddleware } = require('http-proxy-middleware');
const { CONFIG } = require('../config');

// WebSocket proxy to COLLABO_SERVER
const collaboProxy = createProxyMiddleware({
    target: CONFIG.COLLABO_SERVER,
    changeOrigin: true,
    ws: true
});

// Collaboration only ever reaches the backend through the WebSocket upgrade, which the
// HTTP server hands to collaboProxy.upgrade itself. A plain HTTP request on this path
// is answered here rather than forwarded, because the backend also answers HTTP (its
// document list among it) and nothing in front of it asks who is calling.
function rejectPlainHttp(req, res) {
    res.status(426)
        .set('Upgrade', 'websocket')
        .json({ code: 'UPGRADE_REQUIRED', error: 'WebSocket upgrade required' });
}

module.exports = { collaboProxy, rejectPlainHttp };
