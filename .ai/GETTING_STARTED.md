# Running the SynapEditor Demo locally

**SynapEditor** is a web-based WYSIWYG HTML editor by Synapsoft — it brings
word-processor-grade editing (tables, images, styles, document mode, and more)
to the browser. Learn more at **https://www.synapeditor.com**.

This package contains the interactive feature and mode demos.

## Install

> Prerequisites: Node.js 18+ (`node -v`) · an internet connection (the editor
> core, `synapeditor.min.js` / `.css`, loads from `cdn.synapeditor.com`).

```bash
# 1) Create a project folder and enter it
mkdir my-synapeditor-app && cd my-synapeditor-app

# 2) Install the demo package
npm init -y
npm install @synapeditor/demo

# 3) Move into the installed demo (all HTML/assets and license.config.js live here)
cd node_modules/@synapeditor/demo
```

The demo files and `license.config.js` live in this folder — this is the directory you
serve in Quick start below. (Editing `license.config.js` here is fine for evaluation;
note a re-`npm install` would overwrite it. If you plan to customize the demo,
copy this folder out: `cp -r node_modules/@synapeditor/demo ../../my-demo`.)

## Quick start

```bash
# macOS / Linux — from inside node_modules/@synapeditor/demo
# Start a static server on a FREE port (macOS: --bind :: is required)
python3 -m http.server 8137 --bind :: --directory .

# Then open it in your browser — use `localhost`, NOT 127.0.0.1
open http://localhost:8137/
```

```powershell
# Windows (PowerShell) — from inside node_modules\@synapeditor\demo
# Omit --bind :: on Windows (binding IPv6-only can refuse IPv4 `localhost`),
# and open the URL manually — there is no `open` command.
python -m http.server 8137 --directory .
# then browse to http://localhost:8137/  (use localhost, NOT 127.0.0.1)
```

Once the server is running, open:

- **Demo index (all examples):** http://localhost:8137/
- **Editor (classic mode):** http://localhost:8137/html/modes/classic.html

> Using a different port? Replace `8137` everywhere with your port.

## 3 things to know (or you'll get stuck)

1. **The license is locked to the `localhost` hostname.** Opening via
   `127.0.0.1`, another IP, or `file://` makes the editor **fail silently** — no
   console error, just an empty editor box where `window.editor.isLoaded` stays
   `false`. Always open `http://localhost:<port>` — the license checks the hostname,
   not the port, so any free port works. Quick reference:
   `http://localhost:<port>` ✅ · `http://127.0.0.1:<port>` ❌ · other IP/hostname ❌ · `file://` ❌.

2. **Pick a free port.** Port `8080` is often already taken. Check with
   `lsof -ti tcp:<port>` (Windows: `netstat -ano | findstr :<port>` or
   `Get-NetTCPConnection -LocalPort <port>`); if it's busy, **don't kill the
   other process** — just use a different port. The license only checks the
   hostname, not the port.

3. **macOS needs `--bind ::`.** `localhost` resolves to IPv6 (`::1`) first, so a
   server bound only to `127.0.0.1` won't accept `localhost` connections.
   `--bind ::` serves both `localhost` and `127.0.0.1`.

## License setup

The license lives in `license.config.js` (in this folder); every demo loads it.
Edit the `'editor.license'` and `'editor.license.load.api'` values inside
`synapEditorConfig`:

```javascript
var synapEditorConfig = {

    // REQUIRED: fill in company and key
    'editor.license': {
        company: 'Evaluation',
        key: [
            'YOUR_LICENSE_KEY'
        ]
    },

    // editor.license.load.api — keep whatever your issued config provides:
    //  • If load.api.url has a value (a load-metered / trial license, e.g. from
    //    the homepage AI quickstart): paste it AS-IS — do NOT blank it, or the
    //    editor fails to load silently.
    //  • If load.api.url is empty (an offline / domain-validated license): leave
    //    both '' — no load-check server is contacted.
    'editor.license.load.api': {
        url: '',      // keep the issued url here if your config provides one
        apiKey: ''    // keep the issued apiKey here if your config provides one
    }
};
```

> When a config object supplies both keys, map them directly into `synapEditorConfig`:
> - `editor.license` → `synapEditorConfig['editor.license']`
> - `editor.license.load.api` → `synapEditorConfig['editor.license.load.api']`

Every demo's config merges `synapEditorConfig` at runtime with only runtime-specific
options (e.g. `editor.lang`):

```javascript
var config = Object.assign(synapEditorConfig, {
    'editor.lang': 'en'
});
```

## Success checklist

- [ ] Opened via `http://localhost:<port>` (not 127.0.0.1)
- [ ] Top menu bar (File / Edit / View …) and toolbar buttons are visible
- [ ] The body is editable
- [ ] `window.editor.isLoaded === true` in the console
- [ ] If your issued config included a `load.api.url`, you kept it — clearing it makes the editor fail to load silently

---

Product: https://www.synapeditor.com
