const express = require('express');
const multer = require('multer');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const CONVERTER_PATH = process.env.CONVERTER_PATH || './sedocConverter_exe';
const FONT_DIR = process.env.FONT_DIR || './fonts';
const WORK_ROOT = process.env.WORK_ROOT || './workspaces';
const CONVERTER_TIMEOUT = parseInt(process.env.CONVERTER_TIMEOUT) || 30000;
// Upload cap in bytes, unset = no cap (local use). Set it on a public server, where one
// huge upload can fill the disk and tie up the converter. Keep it at or above the
// editor's editor.import.maxSize, or imports the editor allows fail here.
// Number(), not parseInt: parseInt('32MB') is 32, which would reject every import.
const rawMaxFileSize = process.env.MAX_FILE_SIZE;
const MAX_FILE_SIZE = rawMaxFileSize ? Number(rawMaxFileSize) : Infinity;
if (!(MAX_FILE_SIZE === Infinity || (Number.isInteger(MAX_FILE_SIZE) && MAX_FILE_SIZE > 0))) {
    throw new Error('MAX_FILE_SIZE must be a positive integer in bytes, got: ' + rawMaxFileSize);
}

[WORK_ROOT, FONT_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const app = express();
const upload = multer({
    dest: path.resolve(WORK_ROOT, 'uploads'),
    // One document plus outputId. The field limits stop a body of thousands of small parts.
    limits: { fileSize: MAX_FILE_SIZE, files: 1, fields: 10, fieldSize: 1024, parts: 11 }
});

// Directories the server itself keeps under WORK_ROOT. A request must not write its
// output into them.
const RESERVED_OUTPUT_IDS = ['uploads', 'temp'];

// outputId names one directory directly under WORK_ROOT. Returns null when the field
// is not a single text value (multer turns `outputId[a]` into an object and a repeated
// field into an array), the name is empty after stripping, is reserved, ends with a
// dot (Windows drops trailing dots, so "temp." would open temp/), or does not stay
// inside WORK_ROOT ("." is WORK_ROOT itself, ".." its parent).
function resolveOutputDir(rawId) {
    if (typeof rawId !== 'string') {
        return null;
    }

    const outputId = rawId.replace(/[^\w.-]/g, '');
    const workRoot = path.resolve(WORK_ROOT);
    const outputDir = path.resolve(workRoot, outputId);

    if (!outputId || outputId.endsWith('.') || RESERVED_OUTPUT_IDS.includes(outputId.toLowerCase())) {
        return null;
    }

    if (path.dirname(outputDir) !== workRoot) {
        return null;
    }

    return { outputId, outputDir };
}

// Creates dir and tells whether this call made it. An existing entry is left as is.
function mkdirIfMissing(dir) {
    try {
        fs.mkdirSync(dir);
        return true;
    } catch (e) {
        if (e.code === 'EEXIST') {
            return false;
        }

        throw e;
    }
}

function removeQuietly(target) {
    try {
        fs.rmSync(target, { recursive: true, force: true });
    } catch (e) {}
}

// Error bodies carry only a fixed code and a short message. The underlying error
// (the converter command line, work paths, stack traces) goes to the server log only.
function sendError(res, status, code, message, extra) {
    res.status(status).json(Object.assign({ code, error: message }, extra));
}

// multer has already removed the partial upload when it reports a limit error.
function sendMulterError(res, err) {
    if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') {
        return sendError(res, 400, 'INVALID_UPLOAD', 'send exactly one file, in the file field');
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
        return sendError(res, 413, 'FILE_TOO_LARGE', 'file too large', { maxSize: MAX_FILE_SIZE });
    }
    sendError(res, 413, 'FIELDS_TOO_LARGE', 'too many or too large form fields');
}

// Multer/busboy reject malformed multipart input with errors that have no `syscall`;
// a failure writing the upload to disk (ENOSPC, EACCES) has one.
function receiveFile(req, res, next) {
    upload.single('file')(req, res, err => {
        if (!err) return next();
        console.error('[converter] upload error:', err);
        if (err instanceof multer.MulterError) return sendMulterError(res, err);
        if (!err.syscall) return sendError(res, 400, 'INVALID_UPLOAD', 'Invalid upload');
        sendError(res, 500, 'INTERNAL_ERROR', 'Internal error');
    });
}

app.post('/convert', receiveFile, async (req, res) => {
    const file = req.file;
    if (!file) {
        return sendError(res, 400, 'FILE_REQUIRED', 'file is required');
    }

    // The demo runner passes outputId so the extracted media lands in a directory it
    // can serve (WORK_ROOT is a volume shared with the runner). Falls back to the
    // upload's own name. The output dir (pb + media/) is kept so images resolve.
    const rawId = (req.body && req.body.outputId) ? req.body.outputId : file.filename;
    const resolved = resolveOutputDir(rawId);

    if (!resolved) {
        console.warn('[converter] rejected outputId:', JSON.stringify(rawId));
        removeQuietly(file.path);
        return sendError(res, 400, 'INVALID_OUTPUT_ID', 'Invalid outputId');
    }

    const { outputId, outputDir } = resolved;
    const tempDir = path.resolve(WORK_ROOT, 'temp');
    // Only a directory this request created is removed when the conversion fails. An
    // outputId that already exists (an earlier request's output, or a file on the shared
    // volume) is left untouched.
    let createdOutputDir = false;

    try {
        fs.mkdirSync(tempDir, { recursive: true });
        createdOutputDir = mkdirIfMissing(outputDir);

        await new Promise((resolve, reject) => {
            const args = ['-f', FONT_DIR, file.path, outputDir, tempDir];
            console.log('[converter] converting:', file.originalname, '-> outputId:', outputId);

            execFile(CONVERTER_PATH, args, { timeout: CONVERTER_TIMEOUT }, (error, stdout, stderr) => {
                if (stdout) console.log('[converter stdout]', stdout);
                if (stderr) console.error('[converter stderr]', stderr);
                if (error) return reject(error);
                resolve();
            });
        });

        const files = fs.readdirSync(outputDir);
        const pbFileName = files.find(f => f.endsWith('.pb'));

        if (!pbFileName) {
            throw new Error('.pb file not found in output');
        }

        const pbFilePath = path.resolve(outputDir, pbFileName);
        console.log('[converter] done:', pbFileName, '| media kept in:', outputDir);

        // Keep outputDir (pb + extracted media) on the shared volume so the runner can
        // serve the images. Only remove the upload temp.
        res.sendFile(pbFilePath, () => {
            removeQuietly(file.path);
        });
    } catch (error) {
        console.error('[converter] error:', error);
        removeQuietly(file.path);

        if (createdOutputDir) {
            removeQuietly(outputDir);
        }

        sendError(res, 500, 'CONVERSION_FAILED', 'Conversion failed');
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Replace Express's default 404 page and error handler, which answer in HTML and
// print the stack trace.
app.use((req, res) => {
    sendError(res, 404, 'NOT_FOUND', 'Not found');
});

app.use((err, req, res, next) => {
    console.error('[converter] unhandled error:', err);
    if (res.headersSent) return next(err);
    const status = err.status || err.statusCode;
    if (status >= 400 && status < 500) {
        return sendError(res, status, 'BAD_REQUEST', 'Bad request');
    }
    sendError(res, 500, 'INTERNAL_ERROR', 'Internal error');
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log('[converter-api] started on port ' + PORT);
    });
}

module.exports = app;
