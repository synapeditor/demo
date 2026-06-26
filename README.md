# [SynapEditor](https://www.synapeditor.com) Demo

A collection of interactive demos for **SynapEditor**, the web-based WYSIWYG HTML editor by [Synapsoft](https://www.synapsoft.co.kr).

This package is **not the editor library itself** — it is a set of categorized, ready-to-run examples that show how to use SynapEditor's features and editor modes.

![npm version](https://img.shields.io/npm/v/@synapeditor/demo?color=39b6b8&label=npm)


## Contents

- [Getting Started](#getting-started)
- [Server-Dependent Demos](#server-dependent-demos)
- [License Setup](#license-setup)
- [Project Structure](#project-structure)
- [Feature Demos](#feature-demos) · [Editor Modes](#editor-modes) · [UI Settings](#ui-settings)
- [Basic Usage](#basic-usage) · [Language](#language)

## Getting Started

The demos are published to npm as **[`@synapeditor/demo`](https://www.npmjs.com/package/@synapeditor/demo)**. Install the package, or clone the repository to work on the demos themselves:

```bash
# Install the published package…
npm i @synapeditor/demo            # → node_modules/@synapeditor/demo/

# …or clone the repo to develop the demos
git clone https://github.com/synapeditor/demo.git
cd demo
```

Either way there is **no build step** — the SynapEditor library loads from the CDN (`https://cdn.synapeditor.com/latest/`). You only need to add your license and serve the files over `http://localhost`.

> **Important — serve over `http://localhost`.** The bundled license is locked to the
> `localhost` hostname, so opening a file directly (`file://`), or via `127.0.0.1` or any
> other IP, makes the editor **fail silently** — an empty box with no console error. Always
> open `http://localhost:<port>`. There is no build step; "running" just means serving the
> files. For the full step-by-step walkthrough and troubleshooting, see
> **[`.ai/GETTING_STARTED.md`](.ai/GETTING_STARTED.md)**.

> 🔑 A valid SynapEditor **license is required** to run the demos — get one at
> **<https://www.synapeditor.com/>**, then add it to `license.config.js` (see [License Setup](#license-setup)).

Serve the folder over HTTP, then open it with `localhost` (any free port works — the license
checks the hostname, not the port):

```bash
# macOS / Linux  (--bind :: lets `localhost` resolve over IPv6)
python3 -m http.server 8137 --bind :: --directory .

# Windows (PowerShell) — omit --bind ::
python -m http.server 8137 --directory .
```

Then open **http://localhost:8137/** — use `localhost`, **not** `127.0.0.1`.

**Which URL works?**

| You open… | Editor loads? |
|---|---|
| `http://localhost:<any free port>` | ✅ Yes |
| `http://127.0.0.1:<port>` | ❌ No — the license is hostname-locked |
| any other IP or hostname | ❌ No |
| `file:///…/index.html` (double-click) | ❌ No |



## Server-Dependent Demos

**Import**, **export**, **image upload**, and **collaboration** need SynapEditor's server
modules, bundled under [`server/`](server/) as Docker images plus a small Node.js
demo server:

```bash
# 1) Load the backend images (first time only)
docker load -i server/docker/export-api.tar
docker load -i server/docker/converter-api.tar
docker load -i server/docker/collabo-ws.tar

# 2) Start the backends (all at once, or one: docker compose up -d export-api)
cd server && docker compose up -d

# 3) Start the demo server
npm install && npm start          # → http://localhost:3080
```

Open [http://localhost:3080](http://localhost:3080) and choose **Server Features**. The demo
server serves the whole site at the same origin and proxies each feature to its backend, using
the same `license.config.js`. See [`server/README.md`](server/README.md) for per-feature config
and ports. It runs on **macOS, Linux, and Windows** — only the converter (Import) needs one extra
WSL2 line on Windows, noted there.

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

A valid SynapEditor license is required to run the demos. Edit `license.config.js` at the project root:

```javascript
var synapEditorConfig = {
    'editor.license': {
        company: 'Your Company Name',
        key: ['YOUR-LICENSE-KEY']
    },
    // Optional: online load-check API (leave url empty to skip)
    'editor.license.load.api': {
        url: '',
        apiKey: ''
    }
};
```

> To obtain a license, contact [Synapsoft](https://www.synapeditor.com) or email editorglobal@synapsoft.co.kr.



## Project Structure

```
demo/
├── index.html              # Main page with categorized example list
├── license.config.js       # Your SynapEditor license (edit this)
├── assets/
│   └── styles.css          # Shared design system
├── html/                   # all demo pages — included in the npm package
│   ├── features/           # Feature demos (12)
│   ├── modes/              # Editor mode demos (5)
│   ├── ui/                 # UI setting demos (1)
│   └── server-features/    # Server-dependent demo pages (5) — on npm; need the server/ backend running
└── server/                 # Node demo server + Docker backends — source repo only, not in the npm package
```

The SynapEditor library itself is loaded from the CDN (`https://cdn.synapeditor.com/latest/`), so only `license.config.js` needs to live locally at the project root.



## Feature Demos

| Demo | Description | Key Toolbar Buttons |
|------|-------------|---------------------|
| **Bullets** | Bullet points, multi-level numbered lists, and custom start numbers | `bulletList` `numberedList` `multiLevelList` |
| **Case Conversion** | Convert selected text to uppercase, lowercase, capitalize, or sentence case | `conversion` |
| **Fullscreen** | Expand the editor to fill the entire browser window | `fullScreen` |
| **Preview** | Preview final output in print layout; print or save as PDF | `preview` |
| **Source View** | View and edit content directly as HTML source code | `source` |
| **Ruler** | Precisely adjust indentation, tab positions, and margins | `ruler` |
| **Find & Replace** | Search text and replace individually or all at once | `find` |
| **Table** | Insert tables, merge/split cells, edit borders, add/delete rows and columns | `table` |
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
<!-- Serve over http://localhost — the license is bound to the localhost hostname
     (file:// and 127.0.0.1 fail silently). The editor core loads from the CDN. -->
<script src="license.config.js"></script>
<script src="https://cdn.synapeditor.com/latest/synapeditor.min.js"></script>
<link rel="stylesheet" href="https://cdn.synapeditor.com/latest/synapeditor.min.css">

<!-- Create editor container -->
<div id="synapEditor">
    <p>Hello, SynapEditor!</p>
</div>

<!-- Initialize -->
<script>
    var config = Object.assign(synapEditorConfig, {
        'editor.lang': 'en'
    });
    var editor = new SynapEditor('synapEditor', config);
</script>
```



## Language

Set the editor UI language with `'editor.lang'` in the config. The demos in this repo use `'en'`.

```javascript
var config = Object.assign(synapEditorConfig, {
    'editor.lang': 'en'
});
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

SynapEditor is a commercial product. A valid license is required for use.
For pricing and licensing options, please visit [synapeditor.com](https://www.synapeditor.com) or contact editorglobal@synapsoft.co.kr.
