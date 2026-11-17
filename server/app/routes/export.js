const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { CONFIG } = require('../config');

const router = express.Router();

// Proxy middleware for /exportFile — forwards to EXPORT_SERVER (registered before bodyParser in app.js)
const exportFileProxy = createProxyMiddleware({
    target: CONFIG.EXPORT_SERVER,
    changeOrigin: true
});

// Proxy middleware for /exportPb — forwards to EXPORT_SERVER
const exportPbProxy = createProxyMiddleware({
    target: CONFIG.EXPORT_SERVER,
    changeOrigin: true
});

module.exports = { router, exportFileProxy, exportPbProxy };
