require('dotenv').config();
const path = require('path');
const fs = require('fs');

const CONFIG = {
    PORT: process.env.PORT || 3080,
    EXPORT_SERVER: process.env.EXPORT_SERVER || 'http://localhost:9090',
    COLLABO_SERVER: process.env.COLLABO_SERVER || 'ws://localhost:1234',
    CONVERTER_SERVER: process.env.CONVERTER_SERVER || 'http://localhost:8080'
};

const BASE_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(BASE_DIR, '..'); // synap-editor-demo root (static site lives here)

const TEMP_ROOT = path.resolve(BASE_DIR, 'tmp');
const UPLOAD_DIR = path.resolve(TEMP_ROOT, 'files');
const DOC_UPLOAD_DIR = path.resolve(TEMP_ROOT, 'docs');
const WORK_DIR = path.resolve(TEMP_ROOT, 'work');

// Ensure runtime directories exist
[TEMP_ROOT, UPLOAD_DIR, DOC_UPLOAD_DIR, WORK_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

module.exports = {
    CONFIG,
    BASE_DIR,
    REPO_ROOT,
    TEMP_ROOT,
    UPLOAD_DIR,
    DOC_UPLOAD_DIR,
    WORK_DIR
};
