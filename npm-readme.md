<!-- This file is the npm-facing README. The publish workflow
     (.github/workflows/publish.yml) renames it to README.md right before `npm publish`,
     so npm shows this page while the full README.md stays GitHub-only. Keep it concise. -->

# [SynapEditor](https://www.synapeditor.com) Demo

Interactive demos for **SynapEditor**, the web-based WYSIWYG HTML editor by
[Synapsoft](https://www.synapsoft.co.kr). The editor core loads from the CDN; this package
ships the runnable demo pages. No build step — "running" just means serving the files.

> ### ⚠️ Server-dependent demos need a backend that is **not** in this npm package
> **Import, Export, Image/File Upload, Collaboration, and AI Assistant** require the demo
> server + Docker backends (~359 MB of Docker images — too large for npm). The demo **pages**
> are included here, but to actually run them, clone the GitHub repository and follow its
> `server/` setup:
>
> **→ https://github.com/synapeditor/demo** (see `server/README.md`)
>
> The **static demos** — Features, Editor Modes, UI Settings — run entirely from this package.

## Quick start

> **Serve over `http://localhost`.** The bundled license is locked to the `localhost` hostname,
> so `file://`, `127.0.0.1`, or any other IP make the editor **fail silently** (empty box, no error).

```bash
npm install @synapeditor/demo
cd node_modules/@synapeditor/demo

# macOS / Linux  (--bind :: lets `localhost` resolve over IPv6)
python3 -m http.server 8137 --bind :: --directory .

# Windows (PowerShell) — omit --bind ::
python -m http.server 8137 --directory .
```

Then open **http://localhost:8137/** — use `localhost`, **not** `127.0.0.1`. Any free port works
(the license checks the hostname, not the port).

| You open… | Editor loads? |
|---|---|
| `http://localhost:<any free port>` | ✅ Yes |
| `http://127.0.0.1:<port>` | ❌ No — the license is hostname-locked |
| `file:///…/index.html` (double-click) | ❌ No |

## License

A valid SynapEditor license is required — get one at **<https://www.synapeditor.com/>**, then edit
`license.config.js` at the package root: set `'editor.license'` → `company` + `key` (array). Leave
`'editor.license.load.api'` `url`/`apiKey` empty unless you run a self-hosted load-check server.

> To obtain a license, visit [synapeditor.com](https://www.synapeditor.com) or email
> editorglobal@synapsoft.co.kr.

## Editor config

Shared editor defaults (such as the UI language and default font) live in `synapeditor.config.js`
at the package root — you don't normally need to touch it to run the demos.

## What's inside

- **Features (12)** — bullets, case conversion, clear formatting, find & replace, font size,
  format painter, fullscreen, preview, ruler, shortcuts, source view, table
- **Editor Modes (5)** — classic, inline, document, preview, iframe
- **UI Settings (1)** — table handle
- **Server Features (5)** — AI assistant, import, export, image/file upload, collaboration
  *(pages included; backend required — see the notice above)*

## Full docs & server stack

This is the npm landing page. For the complete guide, the **server backend**, Docker setup, and
the accurate step-by-step walkthrough, see the GitHub repository:
**https://github.com/synapeditor/demo**

---

© Synapsoft Corp. · SynapEditor is a commercial product; a valid license is required for use.
