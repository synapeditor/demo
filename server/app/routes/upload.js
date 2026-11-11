const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { BASE_DIR, UPLOAD_DIR, UPLOAD_ALLOWED_EXTENSIONS } = require('../config');
const { resolveExtension, toSlash } = require('../helpers');
const { sendError } = require('../errors');

const router = express.Router();
const fileUploader = multer({ dest: UPLOAD_DIR });

// Handles file upload (images, videos, attachments) and returns the upload path
router.post('/uploadFile', fileUploader.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'The file field is required.' });
    }

    const ext = resolveExtension(req.file.originalname, req.file.mimetype);

    // The stored file is served straight back from this origin, so the extension
    // decides what it can become: .html would be a page on the demo's own origin,
    // .exe a program the demo hands out. Anything not on the list is refused and the
    // file multer already wrote is removed. (.svg stays allowed because documents use
    // it; the headers set on /tmp are what keep it from running.)
    if (UPLOAD_ALLOWED_EXTENSIONS.indexOf(ext.toLowerCase()) === -1) {
        console.warn('[uploadFile] rejected extension:', ext, 'from:', String(req.file.originalname));
        try {
            fs.unlinkSync(req.file.path);
        } catch (e) {
            console.error('[uploadFile] could not remove rejected upload:', e);
        }

        return sendError(res, 400, 'UNSUPPORTED_FILE_TYPE', 'Unsupported file type');
    }

    const nextPath = req.file.path + ext;
    fs.renameSync(req.file.path, nextPath);

    return res.json({
        uploadPath: '/' + toSlash(path.relative(BASE_DIR, nextPath))
    });
});

module.exports = router;
