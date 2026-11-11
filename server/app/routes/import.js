const express = require('express');
const multer = require('multer');
const path = require('path');
const _ = require('lodash');
const { BASE_DIR, DOC_UPLOAD_DIR, WORK_DIR } = require('../config');
const { toSlash, convertLocally } = require('../helpers');
const { sendError } = require('../errors');

const router = express.Router();
const docUploader = multer({ dest: DOC_UPLOAD_DIR });

// multer and busboy reject a malformed or unexpected multipart body with errors that have
// no `syscall`; a failure writing the upload to disk (ENOSPC, EACCES) has one. Left to
// Express, either one comes back as an HTML page carrying the stack trace.
function isClientUploadError(err) {
    return err instanceof multer.MulterError || !err.syscall;
}

function receiveFile(req, res, next) {
    docUploader.single('file')(req, res, err => {
        if (!err) {
            return next();
        }

        console.error('[importDoc] upload error:', err);

        if (isClientUploadError(err)) {
            return sendError(res, 400, 'INVALID_UPLOAD', 'Invalid upload');
        }

        sendError(res, 500, 'INTERNAL_ERROR', 'Internal error');
    });
}

router.post('/importDoc', receiveFile, async (req, res) => {
    const file = _.get(req, ['file']);
    const filename = _.get(file, 'filename');
    const originalname = _.get(req, ['file', 'originalname']) || '';
    const fileExt = path.extname(originalname).toLowerCase();

    // Without a file there is nothing to convert, and reading file.path would throw.
    if (!file) {
        return sendError(res, 400, 'FILE_REQUIRED', 'file is required');
    }

    console.log('[importDoc] file:', originalname, 'ext:', fileExt);

    try {
        const data = await convertLocally(file.path, filename);

        res.json({
            serializedData: data,
            importPath: '/' + toSlash(path.relative(BASE_DIR, WORK_DIR)) + '/' + filename
        });
    } catch (error) {
        console.error('[importDoc] error:', error);

        if (!res.headersSent) {
            sendError(res, 500, 'IMPORT_FAILED', 'Import failed');
        }
    }
});

module.exports = router;
