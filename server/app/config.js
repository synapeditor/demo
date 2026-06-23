require('dotenv').config();
const path = require('path');
const fs = require('fs');

// Some .env values get pasted in JS-object syntax (e.g. KEY: 'sk-...',), which
// leaves stray quotes/commas in the value. Strip them so the key is usable as-is.
function envClean(v) {
    if (typeof v !== 'string') return v;
    return v.trim().replace(/^['"]+/, '').replace(/['",\s]+$/, '');
}

const CONFIG = {
    PORT: process.env.PORT || 3080,
    EXPORT_SERVER: process.env.EXPORT_SERVER || 'http://localhost:9090',
    COLLABO_SERVER: process.env.COLLABO_SERVER || 'ws://localhost:1234',
    CONVERTER_SERVER: process.env.CONVERTER_SERVER || 'http://localhost:8080',

    // AI (OpenAI) — keys come from server/.env and never reach the browser.
    GPT_API_KEY: envClean(process.env.GPT_API_KEY),
    GPT_URL: envClean(process.env.GPT_URL) || 'https://api.openai.com/v1/chat/completions',
    GPT_IMAGE_API_KEY: envClean(process.env.GPT_IMAGE_API_KEY) || envClean(process.env.GPT_API_KEY),
    GPT_IMAGE_URL: envClean(process.env.GPT_IMAGE_URL) || 'https://api.openai.com/v1/images/generations',

    // Gemini — full streaming URL from server/.env; it already embeds both the model
    // and the key (…/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=…).
    // Use a current model in the URL; gemini-1.5-flash is retired (404).
    GEMINI_URL: envClean(process.env.GEMINI_URL),

    // OCR (Synap AI Lab) — key stays on the server; the page calls /ocr.
    OCR_API_KEY: envClean(process.env.OCR_API_KEY),
    OCR_SDK_URL: envClean(process.env.OCR_SDK_URL) || 'https://ailab.synap.co.kr/sdk'
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
