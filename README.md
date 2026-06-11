# [SynapEditor](https://www.synapeditor.com) Demo

A collection of interactive demos for **SynapEditor**, the web-based editor by [Synapsoft](https://www.synapsoft.co.kr).

Explore key features and editor modes through categorized, ready-to-run examples.

![SynapEditor Demo](https://img.shields.io/badge/SynapEditor-v3.3.0-39b6b8)


## Getting Started

No build step or server required. Just open `index.html` in your browser.

```
git clone https://github.com/synap-editor/synap-editor-demo.git
cd synap-editor-demo
```

Then double-click `index.html` or open it in any modern browser.

> All demos run entirely client-side via the `file://` protocol.



## License Setup

A valid SynapEditor license is required to run the demos. Place your license file at the project root:

```
license.js
```

The file should export a license object as a global variable:

```javascript
var synapEditorLicense = {
    company: 'Your Company Name',
    key: ['YOUR-LICENSE-KEY']
};
```

> To obtain a license, contact [Synapsoft](https://www.synapeditor.com) or email editorglobal@synapsoft.co.kr.



## Project Structure

```
synap-editor-demo/
├── index.html              # Main page with categorized example list
├── license.js              # Your SynapEditor license
├── assets/
│   └── styles.css          # Shared design system
└── html/
    ├── features/           # Feature demos (12)
    ├── modes/              # Editor mode demos (5)
    └── ui/                 # UI setting demos (1)
```

The SynapEditor library itself is loaded from the CDN (`https://cdn.synapeditor.com/latest/`), so only your `license.js` needs to live locally at the project root.



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
<script src="license.js"></script>
<script src="https://cdn.synapeditor.com/latest/synapeditor.config.js"></script>
<script src="https://cdn.synapeditor.com/latest/synapeditor.min.js"></script>
<link rel="stylesheet" href="https://cdn.synapeditor.com/latest/synapeditor.min.css">

<!-- Create editor container -->
<div id="synapEditor">
    <p>Hello, SynapEditor!</p>
</div>

<!-- Initialize -->
<script>
    var config = Object.assign(synapEditorConfig, {
        'editor.license': synapEditorLicense
    });
    var editor = new SynapEditor('synapEditor', config);
</script>
```



## Language

Set the editor UI language with `'editor.lang'` in the config. The demos in this repo use `'en'`.

```javascript
var config = Object.assign(synapEditorConfig, {
    'editor.license': synapEditorLicense,
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
