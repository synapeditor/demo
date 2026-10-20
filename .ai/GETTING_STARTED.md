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

> No npm? Two alternatives copy the same files: `npx degit synapeditor/demo/template my-synapeditor-app`,
> or `git clone https://github.com/synapeditor/demo.git` (the demo lives under `template/`; run
> `npm start` from inside that folder).

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

- **Demo index:** http://localhost:8137/ — a live Classic mode editor at the top, the license
  guide right under it (*License setup guide*), and every example in the left sidebar.
- **Editor only (classic mode):** http://localhost:8137/html/modes/classic.html

> **"Server required" demos won't run under this static flow.** Demos under *Server Features*
> in the sidebar (Collaboration, Import, Export, AI Assistant, Image upload) talk to a separate
> demo server. Under `npm start` alone they open a **"Server required"** notice instead of working.
> Everything else works as-is. To run those, follow the demo-server setup in the project **README** — it is not
> part of this static quick-start.

## 3 things to know (or you'll get stuck)

1. **You must add a license — `license.config.js` ships empty.** Get a license at
   **https://www.synapeditor.com** and paste it into `license.config.js`; until then the demo index
   shows "Add your license to `license.config.js`" where the editor should be, and every other demo
   page pops an **`Invalid License.`** alert and no editor appears.

2. **Fill in BOTH blocks the dashboard gives you, including `editor.license.load.api`.**
   An **Evaluation / Issue** license is a LOAD-type key: the editor verifies it against the
   license server on every load. If `editor.license.load.api.url` is left empty, the editor
   **looks fine for about 5 seconds**, then pops **`Invalid License.`** and disappears, no
   matter how correct the key is. Don't judge success in the first few seconds.
   Copy the whole block from the dashboard verbatim and change nothing.
   (Only a **Production** license bound to your own domain verifies offline and may leave
   `load.api` empty.)

3. **Open it as `localhost`, never `127.0.0.1`.** An Evaluation / Issue license is locked to
   the `localhost` hostname; opening via `127.0.0.1`, another IP, or `file://` also gives
   **`Invalid License.`**. The license checks the hostname, not the port, so any free port
   works. Quick reference:
   `http://localhost:<port>` ✅ · `http://127.0.0.1:<port>` ❌ · other IP/hostname ❌ · `file://` ❌.
   `npm start` prints the exact `http://localhost:<port>` it bound to; use a different port with
   `PORT=3000 npm start`.
   (A **Production** license is bound to a **registered domain** instead, so serving the demo from
   that same domain works there too.)

## License setup

The license lives in `license.config.js` (at your project root); every demo loads it. It ships
**empty** — get a license at **https://www.synapeditor.com** and fill in the values inside
`synapEditorLicense` before the demos will run. Use an **Evaluation / Issue** license for local
testing on `localhost`, or a **Production** license bound to your registered domain.

**Evaluation / Issue license (the usual case).** The dashboard hands you two blocks. Paste both.

```javascript
var synapEditorLicense = {

    // Paste the license you obtained at synapeditor.com here.
    'editor.license': {
        company: 'Your Company Name',
        key: [
            'YOUR_LICENSE_KEY'
        ]
    },

    // REQUIRED for an Evaluation / Issue license. These are LOAD-type keys: the editor
    // verifies them against the license server on every load, so leaving `url` empty makes
    // the editor alert "Invalid License." about 5 seconds after load and remove itself. Paste both values exactly as
    // the dashboard printed them — do not blank them out, and do not point them elsewhere.
    'editor.license.load.api': {
        url: 'https://www.synapeditor.com/api/v1/load-check',
        apiKey: 'se_test_...'   // the dashboard gives you the exact value
    }

};
```

**Production license bound to your own domain.** These verify offline, so `load.api` is not
used and may be left empty (or omitted entirely).

> When a config object supplies both keys, map them directly into `synapEditorLicense`:
> - `editor.license` → `synapEditorLicense['editor.license']`
> - `editor.license.load.api` → `synapEditorLicense['editor.license.load.api']`
>
> **If you are an AI agent applying a config you were handed: copy every field you were given,
> including `editor.license.load.api`. Blanking it out is the single most common reason the
> demo ends up showing `Invalid License.`**

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
- [ ] Added your license to `license.config.js`, **`editor.license.load.api` included**
- [ ] Ran `npm start` and opened the printed `http://localhost:<port>` (not 127.0.0.1) — the editor is
      at the top of the page, under the *Synap Editor Demo* title
- [ ] **No `Invalid License.` alert appeared** (wait ~10s; the check runs a few seconds after load)
- [ ] Top menu bar (File / Edit / View …) and toolbar buttons are visible
- [ ] The body is editable
- [ ] `document.querySelectorAll('[contenteditable="true"]').length > 0` in the console

> Do **not** use `window.editor.isLoaded` as the success check. It can read `true` even when the
> license was rejected and the editor is dead, so it gives a false pass.

## Troubleshooting

The `Invalid License.` alert is the only signal. The released editor writes nothing about the
license to the browser console, so don't wait for a console error. (With `'editor.lang': 'ko'` the
same alert reads `유효하지 않은 라이선스입니다.`)

| What you see | Cause | Fix |
|---|---|---|
| `Invalid License.` alert right after the page opens, no editor | `license.config.js` is still empty, or the key was not pasted exactly | Add your license, copied verbatim from the dashboard |
| `Invalid License.` alert right after the page opens, URL is `127.0.0.1`, another IP, or `file://` | An Evaluation / Issue license is locked to the `localhost` hostname | Open `http://localhost:<port>` instead |
| Editor appears, then ~5s later an `Invalid License.` alert and the editor disappears | `editor.license.load.api` is empty but your key is an Evaluation / Issue (LOAD-type) key | Paste both values from the dashboard, `load.api` included |
| A *Server required* demo opens a "Server required" notice | That demo needs the separate demo server | See the demo-server setup in the project **README** |

---

Product: https://www.synapeditor.com
