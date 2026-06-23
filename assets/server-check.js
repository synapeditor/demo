/* SynapEditor demo — server-feature guard.
 *
 * Gates a server-dependent demo page when the server/backend it needs isn't available,
 * showing a short dialog whose message names the exact missing piece. The static
 * feature/mode/UI demos do NOT load this script, so they are never gated.
 *
 * Detection asks the demo server at /__demo/health which backends/keys are up. A
 * localStorage override (`seSimHealth`) can fake that for testing without Docker —
 * see /_server-test.html. The reason strings here MUST match index.html's. */
(function () {
    'use strict';

    var GITHUB_URL = 'https://github.com/synapeditor/demo';
    var NO_SERVER = 'Demo server not running — get the server stack from GitHub (not included in the npm package).';
    var WARN_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ' +
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>' +
        '<line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';

    // Returns Promise<health|null>. null = no demo server. Honors the sim override.
    function getHealth() {
        var sim = null;
        try { sim = localStorage.getItem('seSimHealth'); } catch (e) {}
        if (sim === 'off') return Promise.resolve(null);
        if (sim) { try { return Promise.resolve(JSON.parse(sim)); } catch (e) {} }
        if (location.protocol === 'file:') return Promise.resolve(null);
        var ctrl = ('AbortController' in window) ? new AbortController() : null;
        var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 4000) : null;
        return fetch('/__demo/health', { cache: 'no-store', signal: ctrl ? ctrl.signal : undefined })
            .then(function (r) { if (timer) clearTimeout(timer); return r.ok ? r.json() : null; })
            .then(function (h) { return (h && h.ok === true) ? h : null; })
            .catch(function () { if (timer) clearTimeout(timer); return null; });
    }

    // Why this page can't run right now, or null if it can. Mirrors index.html.
    function reasonFor(file, h) {
        if (!h) return NO_SERVER;
        var b = h.backends || {}, k = h.keys || {};
        switch (file) {
            case 'import.html':        return b.converter ? null : 'Import needs the converter-api backend, which is not running.';
            case 'export.html':        return (b.converter && b['export']) ? null : (!b.converter && !b['export']) ? 'Export needs converter-api + export-api, which are not running.' : !b.converter ? 'Export needs the converter-api backend, which is not running.' : 'Export needs the export-api backend, which is not running.';
            case 'collaboration.html': return b.collabo ? null : 'Collaboration needs the collabo-ws backend, which is not running.';
            case 'ai_assistant.html':  return (k.gpt || k.gemini) ? null : 'No AI key set in server/.env (GPT_API_KEY or GEMINI_URL).';
            case 'ocr.html':           return k.ocr ? null : 'No OCR key set in server/.env (OCR_API_KEY).';
            default:                   return null; // image-upload needs only the demo server (covered by !h)
        }
    }

    function currentFile() { return (location.pathname.split('/').pop() || '').toLowerCase(); }

    function run() {
        getHealth().then(function (h) {
            var reason = reasonFor(currentFile(), h);
            if (reason) showDialog(reason);
        });
    }

    function showDialog(reason) {
        if (document.getElementById('se-server-guard')) return;
        injectStyles();

        var overlay = document.createElement('div');
        overlay.id = 'se-server-guard';
        overlay.className = 'se-guard-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'se-guard-title');
        overlay.innerHTML =
            '<div class="se-guard-box">' +
                '<h2 class="se-guard-title" id="se-guard-title">' + WARN_SVG + ' Server required</h2>' +
                '<p class="se-guard-msg">' + escapeHtml(reason) + '</p>' +
                '<p class="se-guard-sub">Get the server from GitHub and follow <code>server/README.md</code>.</p>' +
                '<div class="se-guard-actions">' +
                    '<a class="se-guard-btn primary" href="' + GITHUB_URL + '" target="_blank" rel="noopener">Get it on GitHub &rarr;</a>' +
                    '<button class="se-guard-btn" type="button" id="se-guard-dismiss">Dismiss</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        function onEsc(e) { if (e.key === 'Escape') dismiss(); }
        var dismiss = function () { overlay.remove(); document.removeEventListener('keydown', onEsc); };
        document.getElementById('se-guard-dismiss').addEventListener('click', dismiss);
        overlay.addEventListener('click', function (e) { if (e.target === overlay) dismiss(); });
        document.addEventListener('keydown', onEsc);
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function injectStyles() {
        if (document.getElementById('se-guard-style')) return;
        var css =
            '.se-guard-overlay{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;' +
            'justify-content:center;padding:20px;background:rgba(17,24,28,.5);}' +
            '.se-guard-box{max-width:430px;width:100%;background:#fff;border-radius:14px;padding:24px 24px 22px;' +
            'box-shadow:0 18px 50px rgba(0,0,0,.28);font:14px/1.55 system-ui,-apple-system,Segoe UI,sans-serif;color:#1b2227;}' +
            '.se-guard-title{margin:0 0 10px;font-size:17px;font-weight:700;display:flex;align-items:center;gap:8px;}' +
            '.se-guard-title svg{width:19px;height:19px;color:#e0a400;flex:none;}' +
            '.se-guard-msg{margin:0 0 8px;color:#39444b;}' +
            '.se-guard-sub{margin:0;color:#7b858c;font-size:13px;}' +
            '.se-guard-sub code,.se-guard-msg code{background:#eef2f4;padding:1px 5px;border-radius:4px;font-size:12px;}' +
            '.se-guard-actions{display:flex;gap:9px;margin-top:18px;}' +
            '.se-guard-btn{appearance:none;border:1px solid #d3dade;background:#fff;color:#1b2227;' +
            'padding:9px 15px;border-radius:9px;font:inherit;font-weight:600;cursor:pointer;text-decoration:none;display:inline-block;}' +
            '.se-guard-btn.primary{background:#2a9a9c;border-color:#2a9a9c;color:#fff;}' +
            '.se-guard-btn:hover{filter:brightness(.97);}';
        var st = document.createElement('style');
        st.id = 'se-guard-style';
        st.textContent = css;
        document.head.appendChild(st);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
