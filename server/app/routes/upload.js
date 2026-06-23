const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { BASE_DIR, UPLOAD_DIR } = require('../config');
const { resolveExtension, toSlash } = require('../helpers');

const router = express.Router();
const fileUploader = multer({ dest: UPLOAD_DIR });

// Handles file upload (images, videos, attachments) and returns the upload path
router.post('/uploadFile', fileUploader.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'The file field is required.' });
    }

    const ext = resolveExtension(req.file.originalname, req.file.mimetype);
    const nextPath = req.file.path + ext;
    fs.renameSync(req.file.path, nextPath);

    return res.json({
        uploadPath: '/' + toSlash(path.relative(BASE_DIR, nextPath))
    });
});

module.exports = router;
