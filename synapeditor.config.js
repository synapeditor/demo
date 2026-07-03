// =================================================================
// GLOBAL EDITOR CONFIGURATION
// Shared editor defaults applied to every demo. This file is self-contained
// (no license here) — each demo merges the license, these defaults, and its
// own options at init time:
//     Object.assign({}, synapEditorLicense, synapEditorConfig, { ...demo... })
// =================================================================
var synapEditorConfig = {
    "editor.upload.image.api": "/uploadFile",
    "editor.upload.video.api": "/uploadFile",
    "editor.upload.file.api": "/uploadFile",
    "editor.import.api": "/importDoc",
    "editor.export.api": "/exportFile",
    "editor.lang": "en",
    "editor.menu.show": false,
    "editor.defaultStyle": {
        "Body": "font-family: Arial;"
    }
};
