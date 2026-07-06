# Running the Synap Editor Demo locally

**Synap Editor** is a web-based WYSIWYG HTML editor by Synapsoft — it brings
word-processor-grade editing (tables, images, styles, document mode, and more)
to the browser. Learn more at **https://www.synapeditor.com**.

This package scaffolds the interactive feature and mode demos into a folder of
your own — **not** into `node_modules` — so `license.config.js` and the demo
files are yours to edit and survive reinstalls.

## Create the demo

> Prerequisites: Node.js 18+ (`node -v`) · an internet connection (the editor
> core, `synapeditor.min.js` / `.css`, loads from `cdn.synapeditor.com`).

```bash
# Scaffold the demo into ./my-synapeditor-app (pick any folder name)
npm create @synapeditor/demo@latest my-synapeditor-app

cd my-synapeditor-app
```

This copies `index.html`, the demo pages, assets, and `license.config.js` into
your folder. `license.config.js` ships **empty**: get a license at
**https://www.synapeditor.com** and add it before the demos will run (see License
setup below). Because the files are in your own folder, your license edit is never
overwritten by a reinstall.

> No npm? Two alternatives copy the same files: `npx degit synapeditor/demo my-synapeditor-app`,
> or `git clone https://github.com/synapeditor/demo.git` (the demo lives under `template/`).

## Quick start

```bash
# From inside your project folder — starts a static server (no Python needed).
npm start
# → http://localhost:8137/   (use localhost, NOT 127.0.0.1)
```

`npm start` runs a small bundled Node server (`server.js`, zero dependencies). It
binds so that `http://localhost` works on macOS, Linux, and Windows alike, and if
port `8137` is busy it automatically picks the next free port — it never kills
another process. Watch the console for the exact URL.

Once the server is running, open:

- **Demo index (all examples):** http://localhost:8137/
- **Editor (classic mode):** http://localhost:8137/html/modes/classic.html

> **"Server required" demos won't run under this static flow.** Demos tagged *Server required*
> on the index (Collaboration, Import, Export, AI Assistant, Image upload) talk to a separate
> demo server, so they stay blank when served by `npm start` alone. Everything else
> works as-is. To run those, follow the demo-server setup in the project **README** — it is not
> part of this static quick-start.

## 2 things to know (or you'll get stuck)

1. **You must add a license — `license.config.js` ships empty.** Get a license at
   **https://www.synapeditor.com** and paste it into `license.config.js`; until then the editor
   loads to an empty box. An **Evaluation / Issue** license is locked to the `localhost` hostname:
   opening via `127.0.0.1`, another IP, or `file://` makes the editor **fail silently** — no
   console error, just an empty editor box where `window.editor.isLoaded` stays
   `false`. Always open `http://localhost:<port>` — the license checks the hostname,
   not the port, so any free port works. Quick reference:
   `http://localhost:<port>` ✅ · `http://127.0.0.1:<port>` ❌ · other IP/hostname ❌ · `file://` ❌.
   (A **Production** license is bound to a **registered domain** instead, so serving the demo from
   that same domain works there too.)

2. **The port auto-picks; open the URL from the console.** `npm start` prints the
   exact `http://localhost:<port>` it bound to. Use a different port with
   `PORT=3000 npm start`. The license only checks the hostname, not the port.

## License setup

The license lives in `license.config.js` (at your project root); every demo loads it. It ships
**empty** — get a license at **https://www.synapeditor.com** and fill in the `'editor.license'`
values inside `synapEditorLicense` before the demos will run. Use an **Evaluation / Issue**
license for local testing on `localhost`, or a **Production** license bound to your registered
domain:

```javascript
var synapEditorLicense = {

    // Empty by default — paste the license you obtained at synapeditor.com here.
    // An Evaluation / Issue key is localhost-locked; a Production key is bound to your domain.
    'editor.license': {
        company: 'Your Company Name',
        key: [
            'YOUR_LICENSE_KEY'
        ]
    },

    // OPTIONAL: self-hosted load-check server only. Fill `url` ONLY if you run one —
    // pointing it at a dead address blocks the editor from loading. Leave both
    // empty ('') to skip (the default).
    'editor.license.load.api': {
        url: '',
        apiKey: ''
    }

};
```

> When a config object supplies both keys, map them directly into `synapEditorLicense`:
> - `editor.license` → `synapEditorLicense['editor.license']`
> - `editor.license.load.api` → `synapEditorLicense['editor.license.load.api']`

## Editor config

Shared editor defaults (e.g. the UI language and default font) live in `synapeditor.config.js`
as a self-contained `synapEditorConfig` object — no license inside it:

```javascript
// synapeditor.config.js
var synapEditorConfig = {
    'editor.lang': 'en',                // UI language shared by every demo
    'editor.menu.show': false,          // hide menu bar by default; some demos re-enable it per page
    'editor.defaultStyle': {
        'Body': 'font-family: Arial;'   // global default font
    }
};
```

Every demo composes the license, these defaults, and its own demo-specific options
(e.g. `editor.type`) at editor init — later sources win:

```javascript
var config = Object.assign({}, synapEditorLicense, synapEditorConfig, {
    'editor.type': 'document'
});
```

## Success checklist

- [ ] Scaffolded with `npm create @synapeditor/demo` and `cd`'d into the folder
- [ ] Added your license (from synapeditor.com) to `license.config.js`
- [ ] Ran `npm start` and opened the printed `http://localhost:<port>` (not 127.0.0.1)
- [ ] Top menu bar (File / Edit / View …) and toolbar buttons are visible
- [ ] The body is editable
- [ ] `window.editor.isLoaded === true` in the console

---

Product: https://www.synapeditor.com
