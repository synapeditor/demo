/* Synap Editor Demo — shared app-shell (left sidebar + top utility bar).
   The navigation is NOT hardcoded here: it is extracted from index.html's category
   list (the single source of truth). This script fetches /index.html, reads its
   `.toc .cat` groups, and builds the sidebar from them — so editing index.html's
   list is enough; the sidebar follows. index.html itself does NOT load this script.
   Pure vanilla, no deps. Fixed positioning + body padding → never moves editor DOM. */
(function () {
    'use strict';

    var HOME = '/index.html';
    var ICON = '/assets/synapeditor-icon.png';

    var LINKS = [
        { key: 'npm', href: 'https://www.npmjs.com/package/@synapeditor/demo', label: 'npm',
          svg: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z"/></svg>' },
        { key: 'github', href: 'https://github.com/synapeditor/demo', label: 'GitHub',
          svg: '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>' },
        { key: 'home', href: 'https://www.synapeditor.com', label: 'Homepage',
          svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z"/></svg>' }
    ];

    function el(tag, cls, html) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (html != null) e.innerHTML = html;
        return e;
    }

    var here = location.pathname;
    if (here.charAt(here.length - 1) === '/') here += 'index.html';
    function isActive(href) { return here.length >= href.length && here.slice(-href.length) === href; }

    function norm(href) {
        if (!href) return '';
        href = href.replace(/^\.\//, '');
        if (href.charAt(0) !== '/') href = '/' + href;
        return href;
    }

    function parseGroups(html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var groups = [];
        doc.querySelectorAll('.toc .cat').forEach(function (cat) {
            var h2 = cat.querySelector('.cat-head h2');
            var req = !!cat.querySelector('.cat-head .req');
            var items = [];
            cat.querySelectorAll('ul li a').forEach(function (a) {
                var labelNode = a.querySelector('.kr') || a;
                items.push({ href: norm(a.getAttribute('href')), label: labelNode.textContent.trim() });
            });
            if (items.length) groups.push({ title: h2 ? h2.textContent.trim() : '', req: req, items: items });
        });
        return groups;
    }

    function buildShell(groups) {
        if (document.body.classList.contains('has-sidebar')) return;

        var aside = el('aside', 'app-sidebar');
        aside.setAttribute('aria-label', 'Demo navigation');

        var brand = el('a', 'sb-brand');
        brand.href = HOME;
        var icon = el('img', 'sb-icon');
        icon.src = ICON; icon.alt = ''; icon.setAttribute('aria-hidden', 'true');
        brand.appendChild(icon);
        brand.appendChild(el('span', 'sb-name', 'Synap <span class="brand-accent">Editor</span>'));
        brand.appendChild(el('span', 'sb-tag', 'DEMO'));
        aside.appendChild(brand);

        var nav = el('nav', 'sb-nav');
        groups.forEach(function (g) {
            var group = el('div', 'sb-group');
            var t = el('div', 'sb-group-title', g.title);
            if (g.req) t.appendChild(el('span', 'sb-req', 'server'));
            group.appendChild(t);
            var list = el('div', 'sb-items');
            g.items.forEach(function (it) {
                var a = el('a', 'sb-item' + (isActive(it.href) ? ' active' : ''));
                a.href = it.href;
                a.textContent = it.label;
                a.title = it.label;
                list.appendChild(a);
            });
            group.appendChild(list);
            nav.appendChild(group);
        });
        aside.appendChild(nav);

        var topbar = el('header', 'app-topbar');
        var toggle = el('button', 'sidebar-toggle', '<span></span><span></span><span></span>');
        toggle.type = 'button';
        toggle.setAttribute('aria-label', 'Toggle navigation');
        topbar.appendChild(toggle);

        var tbrand = el('a', 'tb-brand');
        tbrand.href = HOME;
        var tbicon = el('img', 'tb-icon');
        tbicon.src = ICON; tbicon.alt = ''; tbicon.setAttribute('aria-hidden', 'true');
        tbrand.appendChild(tbicon);
        tbrand.appendChild(el('span', 'tb-name', 'Synap <span class="brand-accent">Editor</span>'));
        tbrand.appendChild(el('span', 'sb-tag', 'DEMO'));
        topbar.appendChild(tbrand);

        var links = el('div', 'topbar-links');
        LINKS.forEach(function (l) {
            var a = el('a', 'topbar-link tl-' + l.key, l.svg);
            a.href = l.href; a.target = '_blank'; a.rel = 'noopener';
            a.title = l.label; a.setAttribute('aria-label', l.label);
            links.appendChild(a);
        });
        topbar.appendChild(links);

        var scrim = el('div', 'sidebar-scrim');
        function isMobile() { return window.matchMedia('(max-width: 860px)').matches; }
        toggle.addEventListener('click', function () {
            if (isMobile()) {
                document.body.classList.toggle('sidebar-open');
            } else {
                var collapsed = document.body.classList.toggle('sidebar-collapsed');
                try { localStorage.setItem('seSidebarCollapsed', collapsed ? '1' : '0'); } catch (e) {}
            }
        });
        scrim.addEventListener('click', function () { document.body.classList.remove('sidebar-open'); });
        aside.addEventListener('click', function (e) { if (e.target.closest('.sb-item')) document.body.classList.remove('sidebar-open'); });

        document.body.appendChild(aside);
        document.body.appendChild(topbar);
        document.body.appendChild(scrim);
        document.body.classList.add('has-sidebar');
        try { if (localStorage.getItem('seSidebarCollapsed') === '1') document.body.classList.add('sidebar-collapsed'); } catch (e) {}

        // Match the sidebar's bottom + content padding to the (now fixed) footer's real height.
        var foot = document.querySelector('.site-footer');
        if (foot) {
            var fh = Math.ceil(foot.getBoundingClientRect().height);
            if (fh) document.documentElement.style.setProperty('--footer-h', fh + 'px');
        }

        var active = aside.querySelector('.sb-item.active');
        if (active && active.scrollIntoView) active.scrollIntoView({ block: 'center' });
    }

    function init() {
        if (document.body.classList.contains('has-sidebar')) return;
        fetch(HOME, { cache: 'no-store' })
            .then(function (r) { return r.ok ? r.text() : null; })
            .then(function (html) {
                if (!html) return;
                var groups = parseGroups(html);
                if (groups.length) buildShell(groups);
            })
            .catch(function () { /* offline / file:// — no sidebar, page still works */ });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
