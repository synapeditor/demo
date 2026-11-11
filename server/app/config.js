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
    // Backends are reached by IP, not 'localhost': on Node 20+ 'localhost' tries ::1 and
    // 127.0.0.1 with a 250ms attempt each, and under concurrent load that times out (504).
    EXPORT_SERVER: process.env.EXPORT_SERVER || 'http://127.0.0.1:9090',
    COLLABO_SERVER: process.env.COLLABO_SERVER || 'ws://127.0.0.1:1234',
    CONVERTER_SERVER: process.env.CONVERTER_SERVER || 'http://127.0.0.1:8080',

    // AI (OpenAI) — keys come from server/.env and never reach the browser.
    GPT_API_KEY: envClean(process.env.GPT_API_KEY),
    GPT_URL: envClean(process.env.GPT_URL) || 'https://api.openai.com/v1/chat/completions',
    GPT_IMAGE_API_KEY: envClean(process.env.GPT_IMAGE_API_KEY) || envClean(process.env.GPT_API_KEY),
    GPT_IMAGE_URL: envClean(process.env.GPT_IMAGE_URL) || 'https://api.openai.com/v1/images/generations',

    // Extensions /uploadFile accepts. The uploaded file is served back from this
    // same origin under /tmp, so anything the browser would run as a page (.html,
    // .hta) or the user would run as a program (.exe, .bat) must not be stored.
    // Deny by default: set UPLOAD_ALLOWED_EXT in server/.env to a comma separated
    // list to replace the list below.
    UPLOAD_ALLOWED_EXT: envClean(process.env.UPLOAD_ALLOWED_EXT),

    // Gemini — full streaming URL from server/.env; it already embeds both the model
    // and the key (…/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=…).
    // Use a current model in the URL; gemini-1.5-flash is retired (404).
    GEMINI_URL: envClean(process.env.GEMINI_URL)
};

// Images, video, audio and the document/archive kinds a demo attachment can be.
const DEFAULT_UPLOAD_EXTENSIONS = [
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.ico', '.avif', '.svg', '.tif', '.tiff',
    '.mp4', '.webm', '.ogv', '.mov', '.avi', '.mkv',
    '.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac',
    '.pdf', '.txt', '.csv', '.rtf', '.md',
    '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.hwp', '.hwpx', '.odt', '.ods', '.odp',
    '.zip', '.7z', '.rar', '.tar', '.gz'
];

// A caller supplied list replaces the default outright, so a demo that really needs
// another kind can widen it without the file having to be edited.
const UPLOAD_ALLOWED_EXTENSIONS = CONFIG.UPLOAD_ALLOWED_EXT
    ? CONFIG.UPLOAD_ALLOWED_EXT.split(',')
        .map(ext => ext.trim().toLowerCase())
        .filter(ext => ext)
        .map(ext => ext.charAt(0) === '.' ? ext : '.' + ext)
    : DEFAULT_UPLOAD_EXTENSIONS;

const BASE_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(BASE_DIR, '..'); // synap-editor-demo root
const STATIC_ROOT = path.resolve(REPO_ROOT, 'template'); // scaffolded static site lives here

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
    UPLOAD_ALLOWED_EXTENSIONS,
    BASE_DIR,
    REPO_ROOT,
    STATIC_ROOT,
    TEMP_ROOT,
    UPLOAD_DIR,
    DOC_UPLOAD_DIR,
    WORK_DIR
};
