/* Réplique interactive de mSILENCE : pare-feu par appli (Applications bloquées, Moniteur réseau en direct, Réglages), en-tête avec état du filtre et interrupteur général, installation
   du filtre (invite d'autorisation comme macOS), ajout par feuille de choix ou par glisser-déposer d'une vraie appli (.app), « Bloquer » en un clic depuis le moniteur : les connexions
   suivantes de l'appli sont coupées. Les connexions sont inventées. */
import { S, h, brand, $, reduced, sfx, toast, icon, wm, T, css } from './kit.js';
import { macAlert } from './mDESK.js';

const CSS = 'css/demos/mSILENCE.css';
const sv = d => `<svg viewBox="0 0 16 16" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${d}</g></svg>`;
const ICONS = {
  blocked: sv('<circle cx="8" cy="8" r="6"/><path d="M3.8 12.2 12.2 3.8"/>'),
  monitor: sv('<path d="M1.4 8.4h3l1.6-4.4 2.6 8.2 1.8-5.4 1 1.6h3.2"/>'),
  settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></g></svg>',
  none: '<svg viewBox="0 0 34 34" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 20.5a2 2 0 1 0 0-.01M10.8 14.4a8.6 8.6 0 0 1 12.4 0M6.4 10a14.8 14.8 0 0 1 21.2 0M4 30 30 4"/></g></svg>'
};
const WATERMARK = '<svg class="msil-wm" viewBox="0 0 1024 1024" aria-hidden="true"><defs><mask id="msil-mk"><rect width="1024" height="1024" fill="#fff"/><path d="M270 264 754 754" stroke="#000" stroke-width="150" stroke-linecap="round"/></mask></defs><g mask="url(#msil-mk)" fill="none" stroke="currentColor" stroke-width="70" stroke-linecap="round"><path d="M427.2 624A110 110 0 0 1 596.8 624"/><path d="M315.3 531.7A255 255 0 0 1 708.7 531.7"/><path d="M203.5 439.4A400 400 0 0 1 820.5 439.4"/><circle cx="512" cy="694" r="26" fill="currentColor" stroke-width="52"/></g><path d="M270 264 754 754" fill="none" stroke="currentColor" stroke-width="66" stroke-linecap="round"/></svg>';

const enclosing = p => { const m = /^(.*?\.app)(\/|$)/.exec(p); return m ? m[1] : p; };
const base = p => p.split('/').pop().replace(/\.app$/, '');
const COLORS = { Safari: '#0ea5e9', Mail: '#38bdf8', Spotify: '#16a34a', 'Creative Cloud': '#dc2626', Dropbox: '#2563eb', 'zoom.us': '#2563eb', Steam: '#1e3a5f', Slack: '#9d174d', Notion: '#3f3f46', 'Google Chrome': '#ea580c', MacKeeper: '#475569' };
const tint = n => COLORS[n] || `hsl(${[...n].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7)} 50% 40%)`;
const tile = (p, cls = 'msil-ic') => /^\/(usr|System\/Library|sbin|bin)\//.test(p) && !/\.app/.test(p) ? h('i', { class: cls + ' exec' }, 'exec') : h('i', { class: cls, style: { background: tint(base(p)) } }, base(p)[0].toUpperCase());
const CATALOG = ['/Applications/Safari.app', '/Applications/Google Chrome.app', '/Applications/Firefox.app', '/Applications/Spotify.app', '/Applications/Slack.app', '/Applications/zoom.us.app', '/Applications/Dropbox.app',
  '/Applications/Steam.app', '/Applications/Discord.app', '/Applications/Notion.app', '/Applications/Docker.app', '/Applications/Microsoft Teams.app', '/Applications/Adobe Photoshop 2026/Adobe Photoshop 2026.app', '/Applications/VLC.app', '/Applications/1Password.app', '/Applications/Telegram.app'];
const SRC = [
  { p: '/Applications/Safari.app/Contents/MacOS/Safari', w: 6, hosts: [['17.253.144.10', 443, 'TCP'], ['142.250.74.14', 443, 'TCP'], ['151.101.1.140', 443, 'TCP'], ['23.55.37.12', 443, 'TCP']] },
  { p: '/System/Applications/Mail.app/Contents/MacOS/Mail', w: 2, hosts: [['142.250.74.109', 993, 'TCP'], ['17.57.144.19', 993, 'TCP']] },
  { p: '/Applications/Spotify.app/Contents/MacOS/Spotify', w: 4, hosts: [['35.186.224.25', 443, 'TCP'], ['104.199.65.124', 4070, 'TCP']] },
  { p: '/Applications/Utilities/Adobe Creative Cloud/ACC/Creative Cloud.app/Contents/MacOS/Creative Cloud', w: 3, hosts: [['52.84.12.9', 443, 'TCP'], ['18.66.112.40', 443, 'TCP']] },
  { p: '/Applications/Dropbox.app/Contents/MacOS/Dropbox', w: 2, hosts: [['162.125.19.131', 443, 'TCP'], ['162.125.18.133', 443, 'TCP']] },
  { p: '/Applications/zoom.us.app/Contents/MacOS/zoom.us', w: 2, hosts: [['3.235.82.55', 443, 'TCP'], ['170.114.52.2', 8801, 'UDP']] },
  { p: '/Applications/Steam.app/Contents/MacOS/steam_osx', w: 2, hosts: [['155.133.248.34', 27017, 'UDP'], ['162.254.197.40', 443, 'TCP']] },
  { p: '/Applications/Slack.app/Contents/Frameworks/Slack Helper.app/Contents/MacOS/Slack Helper', w: 2, hosts: [['3.123.45.67', 443, 'TCP'], ['52.94.236.248', 443, 'TCP']] },
  { p: '/Applications/Google Chrome.app/Contents/Frameworks/Google Chrome Framework.framework/Helpers/Google Chrome Helper', w: 3, hosts: [['142.250.74.78', 443, 'TCP'], ['172.217.19.234', 443, 'TCP']] },
  { p: '/usr/sbin/mDNSResponder', w: 2, hosts: [['224.0.0.251', 5353, 'UDP'], ['192.168.1.1', 53, 'UDP']] },
  { p: '/usr/libexec/softwareupdated', w: 1, hosts: [['17.253.144.10', 443, 'TCP']] }
];
const MISSING = new Set(['/Applications/MacKeeper.app']);

export function open(app) {
  css(CSS);
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 960, h: 664, x: 320, y: 92, minw: 860, minh: 560, bare: true, cls: 'socle msil-win', onclose: w => { w.dead = true; w.stop && w.stop(); },
    build: w => {
      const st = { tab: 'blocked', fw: 'active', global: true, auto: true,
        apps: ['/Applications/Utilities/Adobe Creative Cloud/ACC/Creative Cloud.app', '/Applications/Dropbox.app', '/Applications/Spotify.app', '/Applications/zoom.us.app', '/Applications/Steam.app', '/Applications/MacKeeper.app'].map(p => ({ path: p, enabled: p !== '/Applications/Dropbox.app' })),
        groups: new Map(), flash: new Set(), picker: null };
      const isBlocked = p => { const b = enclosing(p); return st.apps.some(a => a.path === b && a.enabled); };
      const sortApps = () => st.apps.sort((a, b) => base(a.path).localeCompare(base(b.path), undefined, { sensitivity: 'base' }));
      sortApps();
      const timers = new Set(); const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!w.dead && w.el.isConnected) fn(); }, ms); timers.add(t); return t; };
      w.stop = () => { timers.forEach(clearTimeout); st.pickerEnd && st.pickerEnd(); };

      /* ---------- connexions inventées ---------- */
      function event(src, host) {
        const key = enclosing(src.p), cut = st.fw === 'active' && st.global && isBlocked(src.p);
        const g = st.groups.get(key) || { path: key, count: 0, cut: 0, last: null }; g.count++; if (cut) g.cut++; g.last = { host: host[0], port: host[1], proto: host[2], at: performance.now() + Math.random() };
        st.groups.set(key, g); return key;
      }
      const pickSrc = () => { const tot = SRC.reduce((a, s) => a + s.w, 0); let r = Math.random() * tot; return SRC.find(s => (r -= s.w) < 0) || SRC[0]; };
      function tick() {
        if (w.dead || !w.el.isConnected) return;
        if (st.fw === 'active') { const s = pickSrc(), key = event(s, s.hosts[Math.floor(Math.random() * s.hosts.length)]); st.flash.add(key); if (st.tab === 'monitor') paintMonitor(); }
        later(tick, reduced() ? 2400 : 900 + Math.random() * 1500);
      }
      [0, 1, 2, 9, 3, 0, 4].forEach(i => { const s = SRC[i]; event(s, s.hosts[0]); });   // déjà du trafic à l'ouverture
      later(tick, 1200);

      /* ---------- structure ---------- */
      const root = h('div', { class: 'msil' }), badge = h('div', { class: 'msil-badge' }), swH = h('button', { class: 'msil-sw', type: 'button', role: 'switch' });
      const sd = h('nav', { class: 'msil-sd', 'aria-label': 'mSILENCE' }), mn = h('main', { class: 'msil-mn' });
      const hd = h('div', { class: 'msil-hd' }, h('h1', { html: brand('mSILENCE', app.accent) }), badge, h('label', {}, h('span', { class: 'fwl' }), swH));
      root.append(h('div', { class: 'msil-tb', 'data-drag': '' }, wm.lights(w), h('span', { class: 'msil-tt' }, 'mSILENCE')), hd, h('div', { class: 'msil-bdy' }, sd, mn));
      sd.innerHTML = WATERMARK;
      swH.onclick = () => { st.global = !st.global; sfx.tick(); paintHead(); paintTab(); };

      const badgeOf = () => (st.fw === 'active' ? (st.global ? ['ok', T('Pare-feu actif', 'Firewall on')] : ['wn', T('Pare-feu désactivé', 'Firewall paused')])
        : st.fw === 'installing' ? ['wn', T('Installation…', 'Installing…')] : st.fw === 'approval' ? ['wn', T('Autorisation requise', 'Approval needed')] : ['off', T('Pare-feu inactif', 'Firewall off')]);
      function paintHead() {
        const [k, t] = badgeOf(); badge.className = 'msil-badge ' + k; badge.replaceChildren(h('i'), t);
        hd.querySelector('.fwl').textContent = T('Pare-feu', 'Firewall'); swH.classList.toggle('on', st.global); swH.setAttribute('aria-checked', st.global); swH.setAttribute('aria-label', T('Pare-feu', 'Firewall'));
      }
      function paintSide() {
        [...sd.querySelectorAll('button')].forEach(b => b.remove());
        [['blocked', T('Applications', 'Applications')], ['monitor', T('Moniteur', 'Monitor')], ['settings', T('Réglages', 'Settings')]].forEach(([k, l]) =>
          sd.append(h('button', { type: 'button', class: st.tab === k ? 'on' : '', 'aria-current': st.tab === k ? 'page' : false, html: ICONS[k], onclick: () => { if (st.tab === k) return; st.tab = k; sfx.tick(); paintSide(); paintTab(); } }, h('span', {}, l))));
      }

      /* ---------- encart quand le filtre n'est pas actif ---------- */
      function notice() {
        if (st.fw === 'active') return null;
        const msg = st.fw === 'installing' ? T('Installation du filtre réseau en cours…', 'Installing the network filter…')
          : st.fw === 'approval' ? T('macOS attend votre autorisation. Ouvrez Réglages Système › Général › Ouverture et extensions › Extensions réseau, puis activez mSILENCE.', 'macOS is waiting for your approval. Open System Settings › General › Login Items & Extensions › Network Extensions, then turn on mSILENCE.')
            : T('Le pare-feu n’est pas actif : rien n’est bloqué pour l’instant. Installez le filtre réseau pour appliquer la liste.', 'The firewall is off: nothing is blocked right now. Install the network filter to apply the list.');
        return h('div', { class: 'msil-note', role: 'status' }, h('p', {}, msg),
          st.fw === 'approval' ? h('button', { class: 'msil-b', type: 'button', onclick: approve }, T('Ouvrir Réglages Système', 'Open System Settings'))
            : st.fw === 'off' ? h('button', { class: 'msil-b pri', type: 'button', onclick: install }, T('Installer le filtre réseau', 'Install the network filter')) : null);
      }
      function install() { st.fw = 'installing'; sfx.click(); paintHead(); paintTab(); later(() => { st.fw = 'approval'; sfx.notif(); paintHead(); paintTab(); }, 1600); }
      async function approve() {
        sfx.click();
        const r = await macAlert({ app, title: T('« mSILENCE » souhaite filtrer le contenu réseau', '“mSILENCE” Would Like to Filter Network Content'), text: T('Toute l’activité réseau de ce Mac pourra être filtrée ou surveillée par mSILENCE.', 'All network activity on this Mac may be filtered or monitored by mSILENCE.'), buttons: [T('Autoriser', 'Allow'), T('Ne pas autoriser', 'Don’t Allow')] });
        if (w.dead || r.i !== 0) return; st.fw = 'active'; sfx.done(); paintHead(); paintTab();
      }

      /* ---------- onglet Applications ---------- */
      let box = null;
      function blockedTab() {
        const add = h('button', { class: 'msil-b act', type: 'button', onclick: choose }, T('Ajouter une application…', 'Add an application…'));
        const cnt = h('p', { class: 'msil-cnt' });
        box = h('div', { class: 'msil-box' });
        const draw = () => {
          box.replaceChildren(...(st.apps.length ? st.apps.map(a => blockedRow(a, draw)) : [h('div', { class: 'msil-empty', html: ICONS.none }, h('span', {}, T('Aucune application bloquée.\nGlissez-déposez une appli ici, ou utilisez « Ajouter une application… ».', 'No blocked applications.\nDrag and drop an app here, or use “Add an application…”.')))]));
          cnt.textContent = T(`${st.apps.length} application(s) bloquée(s). Les processus enfants d’une appli bloquée le sont aussi.`, `${st.apps.length} blocked application(s). Child processes of a blocked app are blocked too.`);
        };
        draw(); blockedTab.redraw = draw;
        ['dragenter', 'dragover'].forEach(ev => box.addEventListener(ev, e => { if (![...e.dataTransfer.types].includes('Files')) return; e.preventDefault(); box.classList.add('drop'); }));
        box.addEventListener('dragleave', e => { if (!box.contains(e.relatedTarget)) box.classList.remove('drop'); });
        box.addEventListener('drop', e => {
          e.preventDefault(); box.classList.remove('drop'); const names = [];
          [...e.dataTransfer.items].forEach(it => { const en = it.webkitGetAsEntry && it.webkitGetAsEntry(), n = en ? en.name : (it.getAsFile() || {}).name; if (n && /\.app$/i.test(n)) names.push('/Applications/' + n); });
          if (names.length) addApps(names); else toast({ icon: icon('mSILENCE'), title: 'mSILENCE', body: T('Déposez une application (.app) pour la bloquer.', 'Drop an application (.app) to block it.') });
        });
        return [h('div', { class: 'msil-top' }, h('div', {}, h('h2', {}, T('Applications bloquées', 'Blocked applications')), h('p', { class: 'msil-sub' }, T('Ces applis ne peuvent plus se connecter à Internet. Les échanges avec ce Mac restent permis.', 'These apps can no longer reach the Internet. Traffic to and from this Mac stays allowed.'))), add),
          notice(), box, cnt].filter(Boolean);
      }
      function blockedRow(a, redraw) {
        const exists = !MISSING.has(a.path), paused = !st.global;
        const sw = h('button', { class: 'msil-sw' + (a.enabled ? ' on' : ''), type: 'button', role: 'switch', 'aria-checked': a.enabled, 'aria-label': base(a.path), onclick: () => { a.enabled = !a.enabled; sw.classList.toggle('on', a.enabled); sw.setAttribute('aria-checked', a.enabled); row.classList.toggle('dim', !(a.enabled && st.global)); sfx.tick(); } });
        const row = h('div', { class: 'msil-row' + (a.enabled && !paused ? '' : ' dim') + (st.flash.has('add:' + a.path) ? ' msil-fl' : ''), 'data-p': a.path }, sw, tile(a.path, 'msil-ic'),
          h('div', { class: 'msil-tx' }, h('span', { class: 'msil-nm' }, base(a.path)), h('span', { class: 'msil-pa' + (exists ? '' : ' msil-miss'), title: a.path }, exists ? a.path : T('Introuvable sur ce Mac', 'Not found on this Mac') + ' · ' + a.path)),
          h('button', { class: 'msil-b', type: 'button', onclick: () => { sfx.close(); row.style.transition = 'opacity .2s'; row.style.opacity = '0'; later(() => { st.apps = st.apps.filter(x => x !== a); redraw(); }, 200); } }, T('Supprimer', 'Delete')));
        st.flash.delete('add:' + a.path); return row;
      }
      function addApps(paths) {
        let n = 0; paths.map(enclosing).forEach(p => { const e = st.apps.find(a => a.path === p); if (e) { e.enabled = true; } else { st.apps.push({ path: p, enabled: true }); n++; } st.flash.add('add:' + p); });
        sortApps(); sfx.pop(); st.tab !== 'blocked' ? (st.tab = 'blocked', paintSide(), paintTab()) : (blockedTab.redraw && blockedTab.redraw());
      }
      /* feuille de choix (NSOpenPanel) */
      function choose() {
        if (st.picker) return; sfx.open();
        const sel = new Set(), scrim = h('div', { class: 'mdesk-scrim' }), list = h('div', { class: 'msil-ls' }), ok = h('button', { type: 'button', class: 'def', disabled: true }, T('Ouvrir', 'Open'));
        const draw = () => { list.replaceChildren(...CATALOG.map(p => h('button', { type: 'button', class: 'msil-it' + (sel.has(p) ? ' on' : ''), onclick: () => { sel.has(p) ? sel.delete(p) : sel.add(p); sfx.tick(); draw(); ok.disabled = !sel.size; } }, tile(p, 'msil-ic2'), h('span', {}, base(p)), h('small', {}, p.replace(/\/[^/]+$/, ''))))); };
        const sheet = h('div', { class: 'msil-open glass', role: 'dialog', 'aria-label': T('Choisir les applications à bloquer', 'Choose the applications to block') }, h('h4', {}, T('Choisir les applications à bloquer', 'Choose the applications to block')), list,
          h('div', { class: 'msil-bt' }, h('button', { type: 'button', onclick: end }, T('Annuler', 'Cancel')), ok));
        function end() { removeEventListener('keydown', kd, true); sheet.remove(); scrim.remove(); st.picker = null; st.pickerEnd = null; }
        const kd = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); end(); } };
        ok.onclick = () => { const l = [...sel]; end(); addApps(l); };
        draw(); st.picker = sheet; st.pickerEnd = end; $('#layer').append(scrim, sheet); addEventListener('keydown', kd, true);
      }

      /* ---------- onglet Moniteur ---------- */
      const rows = new Map(); let mbox = null;
      function monitorTab() {
        rows.clear(); mbox = h('div', { class: 'msil-box' }); const n = notice();
        const page = [h('div', {}, h('h2', {}, T('Moniteur réseau', 'Network monitor')), h('p', { class: 'msil-sub' }, T('Les connexions sortantes des applis, en direct. Un clic bloque l’appli.', 'Outgoing connections of your apps, live. One click blocks an app.'))), n, mbox];
        later(paintMonitor, 0); return page.filter(Boolean);
      }
      function paintMonitor() {
        if (!mbox || !mbox.isConnected) return;
        const gs = [...st.groups.values()].sort((a, b) => b.last.at - a.last.at);
        if (!gs.length || st.fw !== 'active') { rows.clear(); mbox.replaceChildren(h('div', { class: 'msil-empty' }, h('span', {}, T('Aucune connexion vue pour l’instant.\nElles apparaissent ici dès qu’une appli se connecte.', 'No connection seen yet.\nThey show up here as soon as an app connects.')))); return; }
        mbox.querySelector('.msil-empty') && mbox.replaceChildren();
        const frozen = mbox.matches(':hover');   /* le pointeur est sur la liste : l'ordre ne bouge pas, pour ne pas dérober le bouton qu'on vise */
        const first = new Map([...rows].map(([k, r]) => [k, r.el.getBoundingClientRect().top]));
        gs.forEach((g, i) => {
          let r = rows.get(g.path);
          if (!r) {
            const nm = h('span', { class: 'msil-nm' }, base(g.path)), pa = h('span', { class: 'msil-pa' }), cn = h('span', {}), cu = h('span', { class: 'msil-cut' }), btn = h('button', { class: 'msil-b', type: 'button' });
            const el = h('div', { class: 'msil-row' }, tile(g.path), h('div', { class: 'msil-tx' }, nm, pa), h('div', { class: 'msil-rt' }, cn, cu), btn);
            btn.onclick = () => { const a = st.apps.find(x => x.path === g.path || x.path === enclosing(g.path)); sfx.click();
              if (isBlocked(g.path)) { a.enabled = false; } else if (a) { a.enabled = true; } else { st.apps.push({ path: g.path, enabled: true }); sortApps(); } paintMonitor(); };
            r = { el, pa, cn, cu, btn }; rows.set(g.path, r);
          }
          r.pa.textContent = T('Dernière : ', 'Last: ') + `${g.last.host}:${g.last.port} (${g.last.proto})`;
          r.cn.textContent = T(`${g.count} connexion(s)`, `${g.count} connection(s)`); r.cu.textContent = g.cut ? T(`${g.cut} coupée(s)`, `${g.cut} cut`) : ''; r.cu.hidden = !g.cut;
          const b = isBlocked(g.path); r.btn.className = 'msil-b' + (b ? '' : ' pri'); r.btn.textContent = b ? T('Débloquer', 'Unblock') : T('Bloquer', 'Block');
          if (!r.el.isConnected) mbox.append(r.el); else if (!frozen && mbox.children[i] !== r.el) mbox.insertBefore(r.el, mbox.children[i] || null);
          if (st.flash.has(g.path)) { st.flash.delete(g.path); r.el.classList.remove('msil-fl'); void r.el.offsetWidth; r.el.classList.add('msil-fl'); }
        });
        rows.forEach((r, k) => { if (!st.groups.has(k)) { r.el.remove(); rows.delete(k); return; } const d = (first.get(k) ?? r.el.getBoundingClientRect().top) - r.el.getBoundingClientRect().top; if (d && !reduced()) r.el.animate([{ transform: `translateY(${d / S.scale}px)` }, { transform: 'none' }], { duration: 260, easing: 'ease-out' }); });
      }

      /* ---------- onglet Réglages ---------- */
      function settingsTab() {
        const active = st.fw === 'active';
        const fw = h('div', { class: 'msil-card' }, h('h2', {}, T('Pare-feu', 'Firewall')),
          h('div', { class: 'msil-rw' }, (() => { const [k, t] = badgeOf(); return h('div', { class: 'msil-badge ' + k }, h('i'), t); })(),
            active ? h('button', { class: 'msil-b', type: 'button', onclick: () => { st.fw = 'off'; sfx.close(); paintHead(); paintTab(); } }, T('Désactiver le filtre réseau', 'Turn the network filter off'))
              : st.fw !== 'installing' ? h('button', { class: 'msil-b pri', type: 'button', onclick: install }, T('Installer le filtre réseau', 'Install the network filter')) : null),
          h('p', { class: 'msil-hint' }, T('Le filtre tourne en arrière-plan, sans fenêtre ni notification, même quand mSILENCE est fermé. Aucune donnée ne quitte ce Mac.', 'The filter runs in the background, with no window or notification, even when mSILENCE is closed. No data leaves this Mac.')));
        const ck = h('button', { class: 'msil-ck' + (st.auto ? ' on' : ''), type: 'button', role: 'checkbox', 'aria-checked': st.auto, onclick: () => { st.auto = !st.auto; ck.classList.toggle('on', st.auto); ck.setAttribute('aria-checked', st.auto); ck.firstChild.textContent = st.auto ? '✓' : ''; sfx.tick(); } }, h('i', {}, st.auto ? '✓' : ''), T('Installer automatiquement les mises à jour', 'Install updates automatically'));
        const up = h('div', { class: 'msil-card' }, h('h2', {}, T('Mises à jour', 'Updates')), ck,
          h('div', { class: 'msil-rw', style: { justifyContent: 'flex-start' } }, h('button', { class: 'msil-b', type: 'button', onclick: () => macAlert({ app, title: T('mSILENCE est à jour.', 'mSILENCE is up to date.') }) }, T('Rechercher les mises à jour…', 'Check for Updates…'))));
        return [fw, up];
      }

      /* ---------- assemblage ---------- */
      function paintTab() {
        const keep = mn.scrollTop; mbox = null; rows.clear();
        mn.replaceChildren(...({ blocked: blockedTab, monitor: monitorTab, settings: settingsTab }[st.tab])()); mn.scrollTop = keep;
      }
      w.redraw = () => { paintHead(); paintSide(); paintTab(); };
      paintHead(); paintSide(); paintTab();
      return root;
    } });
}
