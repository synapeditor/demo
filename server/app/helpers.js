const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const request = require('request');
const _ = require('lodash');
const { CONFIG, WORK_DIR } = require('./config');

// Converts backslashes to forward slashes for URL-safe paths
function toSlash(value) {
    return String(value || '').replace(/\\/g, '/');
}

// Extracts file extension from original name, falls back to mimetype
function resolveExtension(originalName, mimetype) {
    const fromName = path.extname(originalName || '').trim();
    if (fromName) {
        return fromName;
    }

    const fromMime = String(mimetype || '').split('/')[1] || 'bin';
    return '.' + fromMime.replace(/[^a-z0-9]+/gi, '');
}

// Reads pb file, skips 16-byte header, decompresses, returns byte array
function serializePbData(pbFilePath) {
    return new Promise((resolve, reject) => {
        const serializedData = [];

        fs.createReadStream(pbFilePath, { start: 16 })
            .pipe(zlib.createUnzip())
            .on('data', (data) => {
                for (let i = 0, len = data.length; i < len; i++) {
                    serializedData.push(data[i] & 0xFF);
                }
            })
            .on('error', reject)
            .on('end', () => resolve(serializedData));
    });
}

// Creates a pb file from serializedData array
function createPbFile(serializedData, outputPath) {
    return new Promise((resolve, reject) => {
        const protobufBuffer = Buffer.from(serializedData);

        zlib.gzip(protobufBuffer, (err, compressedBuffer) => {
            if (err) return reject(err);

            // 16-byte header: [2,0,0,0, 1,0,0,0, 0,0,0,0, 0,0,0,0]
            const header = Buffer.alloc(16);
            header.writeUInt32LE(2, 0);
            header.writeUInt32LE(1, 4);

            const pbFileBuffer = Buffer.concat([header, compressedBuffer]);

            fs.writeFile(outputPath, pbFileBuffer, (err) => {
                if (err) return reject(err);
                resolve(outputPath);
            });
        });
    });
}

/**
 * Converts a document file to .pb format via the converter-api container.
 * @param {string} filePath - Absolute path to the uploaded document file
 * @param {string} filename - Original filename (used for output naming)
 * @returns {Promise<number[]>} Deserialized pb data as a byte array
 */
async function convertLocally(filePath, filename) {
    const pbFilePath = path.resolve(WORK_DIR, filename + '.pb');
    // Pass filename as outputId so the converter writes the extracted media into
    // WORK_DIR/<filename>/ (shared volume), which the runner serves at the importPath.
    await requestConverterApi(filePath, pbFilePath, filename);

    console.log('[importDoc] pb file:', pbFilePath);

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    return serializePbData(pbFilePath);
}

/**
 * Sends a document file to the converter-api Docker container via HTTP POST
 * and saves the returned .pb file to disk.
 * @param {string} filePath - Absolute path to the input document file
 * @param {string} pbFilePath - Absolute path where the .pb response will be saved
 * @returns {Promise<void>}
 */
function requestConverterApi(filePath, pbFilePath, outputId) {
    const url = CONFIG.CONVERTER_SERVER + '/convert';

    return new Promise((resolve, reject) => {
        console.log('[executeConverter] converter-api:', url, '| outputId:', outputId);

        const wstream = fs.createWriteStream(pbFilePath);

        request.post({ url, formData: { file: fs.createReadStream(filePath), outputId: String(outputId || '') } })
            .on('error', reject)
            .on('response', response => {
                if (_.get(response, 'statusCode') === 200) {
                    response.pipe(wstream)
                        .on('error', reject)
                        .on('close', resolve);
                } else {
                    reject(new Error('Conversion failed (converter-api): status ' + _.get(response, 'statusCode')));
                }
            });
    });
}

module.exports = {
    toSlash,
    resolveExtension,
    serializePbData,
    createPbFile,
    convertLocally
};
