<!-- This file is the npm-facing README. The publish workflow
     (.github/workflows/publish.yml) renames it to README.md right before `npm publish`,
     so npm shows this page while the full README.md stays GitHub-only. Keep it concise. -->

# create-demo — [Synap Editor](https://www.synapeditor.com) Demo scaffolder

Scaffold the interactive demos for **Synap Editor**, the web-based WYSIWYG HTML editor by
[Synapsoft](https://www.synapsoft.co.kr). One command copies the runnable demo pages into a
folder of your own — **not** `node_modules` — so `license.config.js` is yours to edit and
survives reinstalls. The editor core loads from the CDN; there is no build step.

## Quick start

```bash
npm create @synapeditor/demo@latest my-synapeditor-app
cd my-synapeditor-app
# add your license to license.config.js (see below)
npm start        # → http://localhost:8137/
```

`npm start` runs a small bundled Node server (zero dependencies) — no Python, no `--bind`
footguns. It prints the exact `http://localhost:<port>` it bound to; open it with `localhost`,
**not** `127.0.0.1`.

> **Get a license first.** `license.config.js` ships **empty** — get a free **Evaluation** license
> at [synapeditor.com](https://www.synapeditor.com) and add it. An Evaluation / Issue license is
> locked to the `localhost` hostname, so `file://`, `127.0.0.1`, or any other IP make the editor
> **fail silently** (empty box, no error).

| You open… | Editor loads? |
|---|---|
| `http://localhost:<any free port>` | ✅ Yes |
| `http://127.0.0.1:<port>` | ❌ No — Evaluation / Issue licenses are hostname-locked |
| `file:///…/index.html` (double-click) | ❌ No |

> No npm? The same files are available via `npx degit synapeditor/demo my-synapeditor-app` or
> `git clone https://github.com/synapeditor/demo.git` (demo under `template/`).

## License

`license.config.js` ships **empty** — add a license before the demos will run. Get a free
**Evaluation** license (or a Production license) at [synapeditor.com](https://www.synapeditor.com),
then edit `license.config.js` in your project: set `'editor.license'` → `company` + `key`
(array). The `localhost` hostname lock applies to **Evaluation / Issue** licenses, so serve over
`http://localhost`; a **Production** license is bound to a **registered domain** instead.

**Also fill in `'editor.license.load.api'` (`url` + `apiKey`) exactly as the dashboard gives it
to you.** Evaluation / Issue licenses are LOAD-type keys that are verified online on every load,
so leaving those empty makes the editor alert `Invalid License.` and refuse to start. Only a
Production license bound to your own domain verifies offline and may leave them empty.

> To obtain your own license, visit [synapeditor.com](https://www.synapeditor.com) or email
> support@synapeditor.co.kr.

## What you get

- **Features (12)** — bullets, case conversion, clear formatting, find & replace, font size,
  format painter, fullscreen, preview, ruler, shortcuts, source view, table
- **Editor Modes (5)** — classic, inline, document, preview, iframe
- **UI Settings (1)** — table handle
- **Server Features (5)** — AI assistant, import, export, image/file upload, collaboration
  *(pages included; backend required — see below)*

> ### ⚠️ Server-dependent demos need a backend that is **not** in this package
> **Import, Export, Image/File Upload, Collaboration, and AI Assistant** require the demo
> server + Docker backends (too large for npm). The demo **pages** are scaffolded, but to run
> them, clone the GitHub repository and follow its `server/` setup:
>
> **→ https://github.com/synapeditor/demo** (see `server/README.md`)
>
> The **static demos** — Features, Editor Modes, UI Settings — run entirely from `npm start`.

## Full docs & server stack

This is the npm landing page. For the complete guide, the **server backend**, Docker setup, and
the step-by-step walkthrough, see the GitHub repository:
**https://github.com/synapeditor/demo**

---

© Synapsoft Corp. · Synap Editor is a commercial product. Add a license (free **Evaluation** available
at synapeditor.com) to `license.config.js`; Evaluation / Issue licenses run on `http://localhost`,
Production licenses on your registered domain.
