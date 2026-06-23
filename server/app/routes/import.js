const express = require('express');
const multer = require('multer');
const path = require('path');
const _ = require('lodash');
const { BASE_DIR, DOC_UPLOAD_DIR, WORK_DIR } = require('../config');
const { toSlash, convertLocally } = require('../helpers');

const router = express.Router();
const docUploader = multer({ dest: DOC_UPLOAD_DIR });

router.post('/importDoc', docUploader.single('file'), async (req, res) => {
    const file = _.get(req, ['file']);
    const filename = _.get(file, 'filename');
    const originalname = _.get(req, ['file', 'originalname']) || '';
    const fileExt = path.extname(originalname).toLowerCase();

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
            res.status(500).json({ success: false, message: 'Import failed', error: error.message });
        }
    }
});

module.exports = router;
