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

[WORK_ROOT, FONT_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const app = express();
const upload = multer({ dest: path.resolve(WORK_ROOT, 'uploads') });

app.post('/convert', upload.single('file'), async (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).json({ error: 'file is required' });
    }

    // The demo runner passes outputId so the extracted media lands in a directory it
    // can serve (WORK_ROOT is a volume shared with the runner). Falls back to the
    // upload's own name. The output dir (pb + media/) is kept so images resolve.
    const rawId = (req.body && req.body.outputId) ? String(req.body.outputId) : file.filename;
    const outputId = rawId.replace(/[^\w.-]/g, '') || file.filename;
    const outputDir = path.resolve(WORK_ROOT, outputId);
    const tempDir = path.resolve(WORK_ROOT, 'temp');

    try {
        [outputDir, tempDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });

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
            try { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); } catch (e) {}
        });
    } catch (error) {
        console.error('[converter] error:', error.message);
        try { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); } catch (e) {}
        try { if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true }); } catch (e) {}
        res.status(500).json({ error: error.message });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log('[converter-api] started on port ' + PORT);
});
