# Synap Editor Demo

`npm create @synapeditor/demo` copies the interactive demos for **Synap Editor**, the web-based
WYSIWYG HTML editor by [Synapsoft](https://www.synapsoft.co.kr), into a folder of your own (not
`node_modules`), so `license.config.js` is yours to edit and survives reinstalls. The editor loads
from the CDN; there is no build step.

## Quick start

Requires Node.js 18+.

```bash
npm create @synapeditor/demo@latest my-synapeditor-app
cd my-synapeditor-app
# add your license to license.config.js (see License below)
npm start        # → http://localhost:8137/
```

`npm start` runs a small bundled Node server with no dependencies. It prints the exact
`http://localhost:<port>` it bound to (the next free port if 8137 is busy).

> No npm? `npx degit synapeditor/demo/template my-synapeditor-app` copies the same files.

## License

`license.config.js` ships **empty**. Get a free **Evaluation** license (or a **Production** license)
at [synapeditor.com](https://www.synapeditor.com), then paste **both blocks** the dashboard gives
you into `license.config.js`:

```javascript
var synapEditorLicense = {
    'editor.license': {
        company: 'Your Company Name',
        key: ['YOUR-LICENSE-KEY']
    },
    // Required for an Evaluation license: the editor checks it online every time it loads.
    'editor.license.load.api': {
        url: 'https://www.synapeditor.com/api/v1/load-check',
        apiKey: 'se_test_...'
    }
};
```

| License | Where it runs | `editor.license.load.api` |
|---|---|---|
| Evaluation | `http://localhost` only (any port) | Required |
| Production | Your registered domain | May be left empty |

### If you see an `Invalid License.` alert

The alert is the only signal; the editor logs nothing about the license to the console. The demo
index (`http://localhost:8137/`) is the one exception: while `license.config.js` is empty it shows
"Add your license to `license.config.js`" in place of the editor instead of the alert.

| When the alert appears | Cause | Fix |
|---|---|---|
| Right after the page opens | `license.config.js` is still empty, or the key was not pasted exactly | Paste the license from the dashboard as-is |
| Right after the page opens | You opened `127.0.0.1`, another IP, or the file directly (`file://`) | Open `http://localhost:<port>` |
| About 5 seconds later, and the editor disappears | `editor.license.load.api` is empty | Paste the `load.api` block too |

Questions: [synapeditor.com](https://www.synapeditor.com) or support@synapeditor.co.kr.

## What you get

- **Features (12)**: bullets, case conversion, clear formatting, find & replace, font size,
  format painter, fullscreen, preview, ruler, shortcuts, source view, table
- **Editor Modes (5)**: classic, inline, document, preview, iframe
- **UI Settings (1)**: table handle
- **Server Features (5)**: AI assistant, import, export, image/file upload, collaboration

Features, Editor Modes, and UI Settings run entirely from `npm start`.

> **Server Features need a backend that is not in this package.** Their pages are included, but
> under `npm start` alone they show a "Server required" notice. To run them, clone
> **https://github.com/synapeditor/demo** and follow `server/README.md` (Node demo server +
> Docker).

## More

Full guide, server setup, and source: **https://github.com/synapeditor/demo**

Synap Editor is a commercial product by Synapsoft Corp.
