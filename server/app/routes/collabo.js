const { createProxyMiddleware } = require('http-proxy-middleware');
const { CONFIG } = require('../config');

// WebSocket proxy to COLLABO_SERVER
const collaboProxy = createProxyMiddleware({
    target: CONFIG.COLLABO_SERVER,
    changeOrigin: true,
    ws: true
});

module.exports = { collaboProxy };
