# [SynapEditor](https://www.synapeditor.com) Demo

A collection of interactive demos for **SynapEditor**, the web-based editor by [Synapsoft](https://www.synapsoft.co.kr).

Explore key features and editor modes through categorized, ready-to-run examples.

![SynapEditor Demo](https://img.shields.io/badge/SynapEditor-v3.3.0-39b6b8)


## Getting Started

No build step or server required. Just open `index.html` in your browser.

```
git clone https://github.com/synap-editor/demo.git
cd demo
```

Then double-click `index.html` or open it in any modern browser.

> The **static demos** (Features, UI Settings, Editor Modes) run entirely client-side via the `file://` protocol.



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
the same `license.config.js`. See [`server/README.md`](server/README.md) for
per-feature config, ports, and the Windows/WSL2 converter note.

> The static demos remain server-free — there is no regression.



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
└── html/
    ├── features/           # Feature demos (12)
    ├── modes/              # Editor mode demos (5)
    └── ui/                 # UI setting demos (1)
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
<!-- Include SynapEditor assets (library from CDN, license local) -->
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
