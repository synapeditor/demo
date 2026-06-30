<!-- This file is the npm-facing README. The publish workflow
     (.github/workflows/publish.yml) renames it to README.md right before `npm publish`,
     so npm shows this page while the full README.md stays GitHub-only. Keep it concise. -->

# [Synap Editor](https://www.synapeditor.com) Demo

Interactive demos for **Synap Editor**, the web-based WYSIWYG HTML editor by
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

> **Get a license, then serve over `http://localhost`.** `license.config.js` ships **empty** — get
> a free **Evaluation** license at [synapeditor.com](https://www.synapeditor.com) and add it (see
> [License](#license)). An Evaluation / Issue license is locked to the `localhost` hostname, so
> `file://`, `127.0.0.1`, or any other IP make the editor **fail silently** (empty box, no error).

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
| `http://127.0.0.1:<port>` | ❌ No — Evaluation / Issue licenses are hostname-locked |
| `file:///…/index.html` (double-click) | ❌ No |

## License

`license.config.js` ships **empty** — add a license before the demos will run. Get a free
**Evaluation** license (or a Production license) at [synapeditor.com](https://www.synapeditor.com),
then edit `license.config.js` at the package root: set `'editor.license'` → `company` + `key`
(array). The `localhost` hostname lock applies to **Evaluation / Issue** licenses, so serve over
`http://localhost`; a **Production** license is bound to a **registered domain** instead, so serve
from that domain. Leave `'editor.license.load.api'` `url`/`apiKey` empty unless you run a
self-hosted load-check server.

> To obtain your own license, visit [synapeditor.com](https://www.synapeditor.com) or email
> support@synapeditor.co.kr.

## Editor config

Shared editor defaults (such as the UI language and default font) live in `synapeditor.config.js`
at the package root — you don't normally need to touch it to run the demos.

## What's inside

- **Features (12)** — bullets (bullet points, multi-level numbered lists, and list indentation),
  case conversion (UPPERCASE, lowercase, Title Case, Toggle Case), clear formatting, find & replace,
  font size, format painter, fullscreen, preview, ruler, shortcuts, source view, table
- **Editor Modes (5)** — classic, inline, document, preview, iframe
- **UI Settings (1)** — table handle
- **Server Features (5)** — AI assistant, import, export, image/file upload, collaboration
  *(pages included; backend required — see the notice above)*

## Full docs & server stack

This is the npm landing page. For the complete guide, the **server backend**, Docker setup, and
the accurate step-by-step walkthrough, see the GitHub repository:
**https://github.com/synapeditor/demo**

---

© Synapsoft Corp. · Synap Editor is a commercial product. Add a license (free **Evaluation** available
at synapeditor.com) to `license.config.js`; Evaluation / Issue licenses run on `http://localhost`,
Production licenses on your registered domain.
