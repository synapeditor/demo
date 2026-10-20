# [Synap Editor](https://www.synapeditor.com) Demo

A collection of interactive demos for **Synap Editor**, the web-based WYSIWYG HTML editor by [Synapsoft](https://www.synapsoft.co.kr).

This package is **not the editor library itself** — it is a set of categorized, ready-to-run examples that show how to use Synap Editor's features and editor modes.

![npm version](https://img.shields.io/npm/v/@synapeditor/create-demo?color=39b6b8&label=npm)


## Contents

- [Getting Started](#getting-started)
- [Server-Dependent Demos](#server-dependent-demos)
- [License Setup](#license-setup) · [Editor Config](#editor-config)
- [Project Structure](#project-structure)
- [Feature Demos](#feature-demos) · [Editor Modes](#editor-modes) · [UI Settings](#ui-settings)
- [Basic Usage](#basic-usage) · [Language](#language) · [Resources](#resources)

## Getting Started

Scaffold the demos into a folder of your own with the npm initializer
**[`@synapeditor/create-demo`](https://www.npmjs.com/package/@synapeditor/create-demo)** — the
files land in your project, **not** in `node_modules`, so `license.config.js` is yours to edit
and survives reinstalls:

```bash
npm create @synapeditor/demo@latest my-synapeditor-app
cd my-synapeditor-app
```

> No npm? The same files are available via `npx degit synapeditor/demo/template my-synapeditor-app`, or
> `git clone https://github.com/synapeditor/demo.git` (the demo lives under
> [`template/`](template/); this repo root is the scaffolder, so run `npm start` from inside `template/`).

There is **no build step** — the Synap Editor library loads from the CDN (`https://cdn.synapeditor.com/latest/`). `license.config.js` ships **empty**: get a free **Evaluation** license at **[synapeditor.com](https://www.synapeditor.com/)**, add it to `license.config.js` (see [License Setup](#license-setup)), then `npm start` and try the demos.

> **Important — an Evaluation / Issue license is locked to the `localhost` hostname.** Once
> you've added your license, opening a file directly (`file://`), or via `127.0.0.1` or any other
> IP, makes the editor pop an **`Invalid License.`** alert and not appear. Always open
> `http://localhost:<port>`. (A **Production** license is bound to your registered domain
> instead — serve this demo from that domain and it works there too.) For the full walkthrough
> and troubleshooting, see **[`.ai/GETTING_STARTED.md`](.ai/GETTING_STARTED.md)**.

Start the bundled static server (a small zero-dependency Node server — no Python needed):

```bash
npm start          # → prints http://localhost:8137/  (auto-picks a free port if 8137 is busy)
```

Then open the printed URL with `localhost`, **not** `127.0.0.1` (any free port works — an
Evaluation license checks the hostname, not the port; force one with `PORT=3000 npm start`). This
static server runs the **Features, Editor Modes, and UI Settings** demos only. The **Server
Features** (Import / Export / Image & File Upload / Collaboration / AI Assistant) are **not**
served here — they need the demo server on a **separate port, `http://localhost:3080`** (see
[Server-Dependent Demos](#server-dependent-demos) below).

**Which URL works?** (with an Evaluation / Issue license, which is locked to the `localhost` hostname)

| You open… | Editor loads? |
|---|---|
| `http://localhost:<any free port>` | ✅ Yes |
| `http://127.0.0.1:<port>` | ❌ No — Evaluation license is hostname-locked |
| any other IP or hostname | ❌ No (unless a Production license covers that domain) |
| `file:///…/index.html` (double-click) | ❌ No |



## Server-Dependent Demos

**Import**, **export**, **image upload**, and **collaboration** need Synap Editor's server
modules, provided under [`server/`](server/) as a Docker Compose stack (images pulled from
GHCR) plus a small Node.js demo server:

```bash
cd server

# 1) Start the backends — first run pulls the base images from GHCR
#    (public; no docker login) and builds the patched collabo/converter images
docker compose up -d

# 2) Start the demo server
npm install && npm start          # → http://localhost:3080
```

Then connect to the demo server in a **new browser tab at [http://localhost:3080](http://localhost:3080)** —
this is a **separate port from the static `:8137` server above**, and the Server Features only work here.
Choose **Server Features**. The demo server serves the whole site at the same origin and proxies each
feature to its backend, using the same `license.config.js`. See [`server/README.md`](server/README.md)
for per-feature config and ports. It runs on **macOS, Linux, and Windows** — only the converter (Import)
needs one extra WSL2 line on Windows, noted there.

> Only the **Server Features** above need this backend. The other demos — Features, Editor Modes,
> UI Settings — run on just the static server from [Getting Started](#getting-started): any OS, no Docker.

### AI Assistant

The **AI Assistant** demo (`html/server-features/ai_assistant.html`) uses the demo
server (no Docker backend) — it proxies AI calls. The page posts to same-origin
endpoints; the server reads the key from `server/.env` and forwards the request, so the
key never reaches the browser. A **text-provider toggle** (GPT-4o / Gemini)
re-initializes the editor with the chosen provider and shows that provider's config
live. Image generation always uses OpenAI `gpt-image-1`.

```bash
# server/.env  (KEY=value form — no quotes, no trailing comma)
GPT_API_KEY=sk-...           # GPT-4o text + gpt-image-1 images (required for GPT)
# GPT_IMAGE_API_KEY=sk-...   # optional; falls back to GPT_API_KEY
# Gemini: full streaming URL with a CURRENT model + the key (gemini-1.5-flash is retired/404)
GEMINI_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=...
```

Endpoints: `/requestGPT`, `/requestGemini` (text), `/requestGPTImage` (image),
`/uploadFile` (image hosting). Generated/inserted images are uploaded via
`editor.upload.image.api: '/uploadFile'`, so they are server-hosted (not base64).

Then `cd server && npm start` and open the AI Assistant page. Get keys at
[platform.openai.com](https://platform.openai.com/api-keys) (OpenAI) and
[aistudio.google.com](https://aistudio.google.com/apikey) (Gemini).

## License Setup

`license.config.js` ships **empty** — obtain a license and add it before the demos will run. Get an **Evaluation / Issue** license (for local testing on `localhost`) or a **Production** license (bound to your domain) at [synapeditor.com](https://www.synapeditor.com), then edit `license.config.js` at the project root:

```javascript
var synapEditorLicense = {
    'editor.license': {
        company: 'Your Company Name',
        key: ['YOUR-LICENSE-KEY']
    },
    // REQUIRED for an Evaluation / Issue license (LOAD-type key, verified online on
    // every load). Leaving url empty lets the editor show for about 5 seconds, then
    // it alerts "Invalid License." and disappears. Paste both values exactly as the dashboard printed them.
    // A Production license verifies offline, so it may leave these empty.
    'editor.license.load.api': {
        url: 'https://www.synapeditor.com/api/v1/load-check',
        apiKey: 'se_test_...'
    }
};
```

> To obtain a license, contact [Synapsoft](https://www.synapeditor.com) or email support@synapeditor.co.kr.
>
> **Evaluation / Issue** licenses are locked to the `localhost` hostname; **Production** licenses are bound to a registered domain. Serve the demo from the host your license covers.
>
> **What an `Invalid License.` alert means.** The alert is the only signal: the released editor logs nothing about the license to the console. (The demo index is the one exception: with an empty `license.config.js` it shows "Add your license to `license.config.js`" in place of the editor instead of the alert.)
>
> | When the alert appears | Cause |
> |---|---|
> | Right after the page opens | `license.config.js` is still empty, the key was not pasted exactly, or you opened the demo over `127.0.0.1`, another IP, or `file://` instead of `localhost` |
> | About 5 seconds later, and the editor disappears | `editor.license.load.api` was left empty on an Evaluation / Issue license |



## Editor Config

Shared editor defaults (e.g. the UI language and default font) live in `synapeditor.config.js`
as a self-contained `synapEditorConfig` object — no license inside it. You normally don't
need to edit it to run the demos.

```javascript
// synapeditor.config.js — global editor defaults, license-free
var synapEditorConfig = {
    'editor.lang': 'en',                // UI language shared by every demo
    'editor.menu.show': false,          // hide menu bar by default; Classic/Document/Table re-enable it per page
    'editor.defaultStyle': {
        'Body': 'font-family: Arial;'   // global default font
    }
};
```

Each demo composes the license, these defaults, and its own options at editor init — later
sources win:

```javascript
var config = Object.assign({}, synapEditorLicense, synapEditorConfig, {
    'editor.type': 'document'   // demo-specific options
});
var editor = new SynapEditor('synapEditor', config);
```



## Project Structure

```
demo/                       # repo root = the @synapeditor/create-demo scaffolder
├── bin/
│   └── index.js            # scaffolder CLI — copies template/ into the user's folder
├── template/               # what a user gets from `npm create` (published to npm)
│   ├── index.html          # Main page with categorized example list
│   ├── license.config.js   # Your Synap Editor license (edit this) — ships empty
│   ├── synapeditor.config.js   # Global editor config — shared defaults
│   ├── server.js           # bundled zero-dependency static server (`npm start`)
│   ├── package.json        # scaffolded project manifest ("start": node server.js)
│   ├── assets/             # shared design system + icons
│   └── html/               # all demo pages
│       ├── features/       # Feature demos (12)
│       ├── modes/          # Editor mode demos (5)
│       ├── ui/             # UI setting demos (1)
│       └── server-features/    # Server-dependent demo pages (5) — need the server/ backend
└── server/                 # Node demo server + Docker backends — source repo only, not on npm
```

The Synap Editor library itself is loaded from the CDN (`https://cdn.synapeditor.com/latest/`), so only `license.config.js` and `synapeditor.config.js` need to live locally at the project root.



## Feature Demos

| Demo | Description | Key Toolbar Buttons |
|------|-------------|---------------------|
| **Bullets** | Bullet points, multi-level numbered lists, and list indentation | `bulletList` `numberedList` `multiLevelList` `decreaseIndent` `increaseIndent` |
| **Case Conversion** | Convert selected text to UPPERCASE, lowercase, Title Case, or Toggle Case | `conversion` |
| **Fullscreen** | Expand the editor to fill the entire browser window | `fullScreen` |
| **Preview** | Preview final output in print layout; print or save as PDF | `codeBlock` `preview` |
| **Source View** | View and edit content directly as HTML source code | `source` |
| **Ruler** | Precisely adjust indentation, tab positions, and margins | `ruler` |
| **Find & Replace** | Search text and replace individually or all at once | `find` |
| **Table** | Insert and style tables — templates, captions, cell fills, borders, alignment, merge/split, and conditional formatting | `table` `tableStyle` `tableProperties` `conditionalFormatting` `fill` `mergeCell` |
| **Format Painter** | Copy formatting (font, color, alignment) and apply it to other text | `copyRunStyle` `pasteRunStyle` |
| **Clear Formatting** | Remove all inline formatting and revert to default style | `removeRunStyle` |
| **Font Size Up/Down** | Increase or decrease font size one step at a time | `growFont` `shrinkFont` |
| **Keyboard Shortcuts** | Reference list of keyboard shortcuts supported by the editor | `keyboard` |



## Editor Modes

| Mode | Description | Config |
|------|-------------|--------|
| **Classic** | Fixed toolbar at the top — the most common editor layout | Default |
| **Inline** | No fixed toolbar; a floating context toolbar appears on text selection | `'editor.type': 'inline'` |
| **Document** | A4 paginated editing with headers, footers, margins, and page numbers | `'editor.type': 'document'` |
| **Preview** | Read-only mode that displays content without editing tools | `'editor.type': 'preview'` |
| **Iframe** | Editor content isolated in an iframe, preventing host page CSS/script interference | `'editor.mode.iframe': { 'enable': true }` |



## UI Settings

| Demo | Description | Config |
|------|-------------|--------|
| **Table Handle** | Configure row/column handles that appear when hovering over a table | `'editor.table.handle': true` |



## Basic Usage

```html
<!-- Add your license to license.config.js first (get one at synapeditor.com). An Evaluation /
     Issue license is bound to the localhost hostname (file:// and 127.0.0.1 show an "Invalid License." alert);
     a Production license is bound to your domain instead. The editor core loads from the CDN. -->
<script src="license.config.js"></script>
<script src="synapeditor.config.js"></script>
<script src="https://cdn.synapeditor.com/latest/synapeditor.min.js"></script>
<!-- Optional color icon set the demos use — load after the core script -->
<script src="https://cdn.synapeditor.com/latest/plugins/icons/basicColorIcons.js"></script>
<link rel="stylesheet" href="https://cdn.synapeditor.com/latest/synapeditor.min.css">

<!-- Create editor container -->
<div id="synapEditor">
    <p>Hello, Synap Editor!</p>
</div>

<!-- Initialize -->
<script>
    // synapEditorConfig already carries the shared defaults (language, default font, menu visibility);
    // pass only demo-specific options as the last argument.
    var config = Object.assign({}, synapEditorLicense, synapEditorConfig, {
        'editor.type': 'document'
    });
    var editor = new SynapEditor('synapEditor', config);
</script>
```



## Language

The UI language is set with `'editor.lang'`. All demos share `'en'`, so it lives once in the
global `synapeditor.config.js` — change it there to switch every demo at once.

```javascript
// synapeditor.config.js
var synapEditorConfig = {
    'editor.lang': 'en',
    // ...
};
```

Supported languages:

| Code | Language |
|------|----------|
| `en` | English |
| `ko` | Korean |
| `ja` | Japanese |
| `vi` | Vietnamese |
| `zh` | Chinese (Simplified) |
| `zh-tw` | Chinese (Traditional) |



## Resources

- Product: [www.synapeditor.com](https://www.synapeditor.com)
- Company: [www.synapsoft.co.kr](https://www.synapsoft.co.kr)



## License

Synap Editor is a commercial product. A valid license is required for use.
For pricing and licensing options, please visit [synapeditor.com](https://www.synapeditor.com) or contact support@synapeditor.co.kr.
