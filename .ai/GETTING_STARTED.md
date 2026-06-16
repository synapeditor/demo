# Running the SynapEditor Demo locally

**SynapEditor** is a web-based WYSIWYG HTML editor by Synapsoft — it brings
word-processor-grade editing (tables, images, styles, document mode, and more)
to the browser. Learn more at **https://www.synapeditor.com**.

This package contains the interactive feature and mode demos.

## Install

> Prerequisite: Node.js 18+ (`node -v`).

```bash
# 1) Create a project folder and enter it
mkdir my-synapeditor-app && cd my-synapeditor-app

# 2) Install the demo package
npm init -y
npm install @synapeditor/demo

# 3) Move into the installed demo (all HTML/assets and license.js live here)
cd node_modules/@synapeditor/demo
```

The demo files and `license.js` live in this folder — this is the directory you
serve in Quick start below. (Editing `license.js` here is fine for evaluation;
note a re-`npm install` would overwrite it. If you plan to customize the demo,
copy this folder out: `cp -r node_modules/@synapeditor/demo ../../my-demo`.)

## Quick start

```bash
# From inside node_modules/@synapeditor/demo
# Start a static server on a FREE port (macOS: --bind :: is required)
python3 -m http.server 8137 --bind :: --directory .

# Then open it in your browser — use `localhost`, NOT 127.0.0.1
open http://localhost:8137/
```

Once the server is running, open:

- **Demo index (all examples):** http://localhost:8137/
- **Editor (classic mode):** http://localhost:8137/html/modes/classic.html

> Using a different port? Replace `8137` everywhere with your port.

## 3 things to know (or you'll get stuck)

1. **The license is locked to the `localhost` hostname.** Opening via
   `127.0.0.1`, another IP, or `file://` makes the editor **fail silently** — no
   console error, just an empty editor box where `window.editor.isLoaded` stays
   `false`. Always open `http://localhost:<port>`. (Ignore the README's "just
   open index.html" line — that uses `file://` and won't work with this license.)

2. **Pick a free port.** Port `8080` is often already taken. Check with
   `lsof -ti tcp:<port>`; if it's busy, **don't kill the other process** — just
   use a different port. The license only checks the hostname, not the port.

3. **macOS needs `--bind ::`.** `localhost` resolves to IPv6 (`::1`) first, so a
   server bound only to `127.0.0.1` won't accept `localhost` connections.
   `--bind ::` serves both `localhost` and `127.0.0.1`.

## License setup

The license lives in `license.js` (in this folder); every demo loads it.

```javascript
var synapEditorLicense = {
    company: 'Evaluation',
    key: ['...']
};

// Optional online license check. It does NOT block the editor from loading —
// the offline key (company + key) above is enough on its own.
var synapEditorLicenseLoadApi = {
    url: 'http://localhost:12530/api/v1/load-check',
    apiKey: '...'
};
```

Each demo's config injects them:

```javascript
var config = Object.assign(synapEditorConfig, {
    'editor.license': synapEditorLicense,
    'editor.license.load.api': synapEditorLicenseLoadApi,  // optional
    'editor.lang': 'en'
});
```

> Note: the demo HTML files use **CRLF** line endings. If you batch-edit them
> with a script, account for the trailing `\r`.

## Success checklist

- [ ] Opened via `http://localhost:<port>` (not 127.0.0.1)
- [ ] Top menu bar (File / Edit / View …) and toolbar buttons are visible
- [ ] The body is editable
- [ ] `window.editor.isLoaded === true` in the console

---

Product: https://www.synapeditor.com
