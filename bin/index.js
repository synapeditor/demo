#!/usr/bin/env node
// =================================================================
// @synapeditor/create-demo — project scaffolder
//
// Invoked by:  npm create @synapeditor/demo[@latest] [dir] [--force]
//              npm init @synapeditor/demo [dir]
//              npx @synapeditor/create-demo [dir]
//
// Copies template/ into a new folder in the user's cwd (NOT node_modules),
// so license.config.js and the demo files are theirs to edit and survive
// reinstalls.
// =================================================================
const fs = require('fs');
const path = require('path');

const TEMPLATE_DIR = path.join(__dirname, '..', 'template');

function main() {
    const args = process.argv.slice(2);
    const force = args.includes('--force');
    const positional = args.filter((a) => !a.startsWith('-'));
    const targetName = positional[0] || 'my-synapeditor-app';
    const targetDir = path.resolve(process.cwd(), targetName);

    if (fs.existsSync(targetDir)) {
        const entries = fs.readdirSync(targetDir);
        if (entries.length > 0 && !force) {
            console.error('');
            console.error('  ✖ Target folder "' + targetName + '" already exists and is not empty.');
            console.error('    Choose another name, or re-run with --force to write into it.');
            console.error('');
            process.exit(1);
        }
    }

    if (!fs.existsSync(TEMPLATE_DIR)) {
        console.error('  ✖ Internal error: template folder not found at ' + TEMPLATE_DIR);
        process.exit(1);
    }

    fs.mkdirSync(targetDir, { recursive: true });
    fs.cpSync(TEMPLATE_DIR, targetDir, { recursive: true });

    console.log('');
    console.log('  ✔ Created Synap Editor demo in ./' + targetName);
    console.log('');
    console.log('  Next steps:');
    console.log('    1. cd ' + targetName);
    console.log('    2. Add your license to license.config.js');
    console.log('       (get a free Evaluation license at https://www.synapeditor.com)');
    console.log('    3. npm start        →  http://localhost:8137/');
    console.log('');
    console.log('  Open it with "localhost" (NOT 127.0.0.1) — an Evaluation license');
    console.log('  is locked to the localhost hostname.');
    console.log('');
    console.log('  Server-dependent demos (Import/Export/Upload/Collaboration/AI) need the');
    console.log('  Docker backend from https://github.com/synapeditor/demo (see server/).');
    console.log('');
}

main();
