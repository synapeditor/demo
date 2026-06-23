const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const request = require('request');
const _ = require('lodash');
const { CONFIG, UPLOAD_DIR, WORK_DIR, BASE_DIR } = require('../config');

const router = express.Router();
const fileUploader = multer({ dest: UPLOAD_DIR });

// Options forwarded to the Synap OCR SDK (same set the product dev server uses).
const OCR_OPTION = {
    coord: 'origin',
    skew: 'image',
    boxes_type: 'all',
    save_mask: 'true',
    textout: 'true',
    recog_form: 'true',
    extract_table: 'true'
};

// The plugin's server-proxy path sends the file under `file`; the apiKey path uses `image`.
function getUploadedFile(req) {
    return _.get(req, ['file']) ||
        _.get(req, ['files', 'file', 0]) ||
        _.get(req, ['files', 'image', 0]);
}

// POST /ocr — proxy an image to the Synap OCR SDK and return { result, imagePath }.
// The OCR_API_KEY stays on the server, so the browser never sees it.
router.post('/ocr', fileUploader.fields([{ name: 'file', maxCount: 1 }, { name: 'image', maxCount: 1 }]), async (req, res) => {
    if (!CONFIG.OCR_API_KEY) {
        return res.status(500).json({ message: 'OCR_API_KEY is not set in server/.env' });
    }

    const file = getUploadedFile(req);
    const page = _.get(req.body, ['page']) || _.get(req.body, ['page_index']) || 0;
    const fid = _.get(req.body, ['fid']);
    if (!file && !fid) {
        return res.status(400).send('OCR upload file is required.');
    }

    let filePathWithExt = _.get(file, 'path');
    if (file && !fid) {
        const originalName = _.get(file, 'originalname') || '';
        const mimeType = _.get(file, 'mimetype') || '';
        const extension = path.extname(originalName).split('.')[1] || mimeType.split('/')[1] || 'png';
        filePathWithExt = file.path + '.' + extension;
        fs.renameSync(file.path, filePathWithExt);
    }

    try {
        const ocrResult = await requestOCR(filePathWithExt, page, fid);
        const result = _.get(ocrResult, 'result', ocrResult);
        const masked = _.get(result, 'masked_image');
        const imagePath = masked ? await downloadImage(masked) : null;

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ result, imagePath }));
    } catch (error) {
        res.status(error.status || 500).send(error.message || 'OCR failed');
    }
});

// POST /ocr/out/:filename — proxy an OCR output image (used by the apiKey client path).
router.post('/ocr/out/:filename', fileUploader.none(), (req, res) => {
    const filename = _.get(req, ['params', 'filename']);
    if (!filename) {
        return res.status(400).send('OCR output filename is required.');
    }

    request.post({ url: `${CONFIG.OCR_SDK_URL}/out/${filename}`, formData: { api_key: CONFIG.OCR_API_KEY } })
        .on('response', response => {
            if (_.get(response, 'statusCode') === 200) {
                res.setHeader('Content-Type', _.get(response, ['headers', 'content-type']) || 'image/png');
                response.pipe(res);
            } else {
                res.status(_.get(response, 'statusCode', 500)).send(_.get(response, 'statusMessage'));
            }
        })
        .on('error', error => res.status(500).send(String(error)));
});

// Calls the OCR SDK with the uploaded image (type: upload) or a page reference (type: page).
function requestOCR(imgPath, page, fid) {
    return new Promise((resolve, reject) => {
        const typeOption = fid
            ? { type: 'page', fid }
            : { type: 'upload', image: fs.createReadStream(imgPath) };

        request.post({
            url: `${CONFIG.OCR_SDK_URL}/ocr`,
            formData: { api_key: CONFIG.OCR_API_KEY, page_index: page, ...typeOption, ...OCR_OPTION }
        })
            .on('response', response => {
                const statusCode = _.get(response, 'statusCode');
                if (statusCode === 200) {
                    const body = [];
                    response.on('data', c => body.push(c))
                        .on('end', () => {
                            try { resolve(JSON.parse(Buffer.concat(body).toString())); }
                            catch (e) { reject(e); }
                        })
                        .on('error', reject);
                } else {
                    const err = new Error(_.get(response, 'statusMessage') || 'OCR request failed');
                    err.status = statusCode;
                    reject(err);
                }
            })
            .on('error', reject);
    });
}

// Downloads the masked result image into tmp/work, served back at /tmp/work/<name>.
function downloadImage(fileName) {
    return new Promise((resolve, reject) => {
        const imagePath = path.resolve(WORK_DIR, fileName);

        request.post({ url: `${CONFIG.OCR_SDK_URL}/out/${fileName}`, formData: { api_key: CONFIG.OCR_API_KEY } })
            .on('response', response => {
                if (_.get(response, 'statusCode') === 200) {
                    let data = Buffer.from([]);
                    response.on('data', c => { data = Buffer.concat([data, c]); })
                        .on('end', () => {
                            fs.writeFileSync(imagePath, data);
                            resolve('/' + path.relative(BASE_DIR, imagePath).replace(/\\/g, '/'));
                        })
                        .on('error', reject);
                } else {
                    const err = new Error(_.get(response, 'statusMessage') || 'OCR image download failed');
                    err.status = _.get(response, 'statusCode');
                    reject(err);
                }
            })
            .on('error', reject);
    });
}

module.exports = router;
