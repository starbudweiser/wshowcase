/* Réplique interactive de mCLEAN : l'anneau (et le pourcentage) vivent dans la barre des menus, le panneau reprend celui de l'appli (anneau « disponibles », légende, pression, swap,
   historique, applis les plus gourmandes, applis inactives avec Quitter, Nettoyer / Profond), clic droit sur l'icône pour le menu, roue pour les réglages (4 onglets).
   Les données sont fictives mais cohérentes : le nettoyage chasse le cache de fichiers, il s'arrête sous pression, le garde-fou prévient quand une appli s'emballe. */
import { S, h, brand, $, clamp, wait, sfx, toast, icon, wm, T, css } from './kit.js';
import { $$ } from '../util.js';
import { emit, on } from '../core.js';
import { lang } from '../i18n.js';
import { macMenu, macMenuOpen, closeMacMenu, aboutWin } from './mDESK.js';

const CSS = 'css/demos/mCLEAN.css';
const BRAND = '#34d399';
const GEAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></g></svg>';

/* ---------- formats (comme MemoryFormat) ---------- */
const fmtN = (v, d) => v.toLocaleString(lang() === 'fr' ? 'fr-FR' : 'en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const size = gb => (gb >= 1 ? fmtN(gb, gb >= 100 ? 0 : gb >= 10 ? 1 : 2) + ' ' + T('Go', 'GB') : fmtN(Math.round(gb * 1024), 0) + ' ' + T('Mo', 'MB'));
const pct = f => Math.round(f * 100) + T(' %', '%');
const since = min => { const d = Math.floor(min / 1440), hh = Math.floor((min % 1440) / 60), mm = Math.floor(min % 60); return (d ? [d + T(' j', 'd'), hh ? hh + T(' h', 'h') : ''] : hh ? [hh + T(' h', 'h'), mm ? mm + T(' min', 'm') : ''] : [mm + T(' min', 'm')]).filter(Boolean).join(' '); };

const APPS0 = [
  { id: 'fcp', bid: 'com.apple.FinalCut', n: 'Final Cut Pro', c: '#7c3aed', l: 'F', gb: 2.14, idle: 0 },
  { id: 'safari', bid: 'com.apple.Safari', n: 'Safari', c: '#0ea5e9', l: 'S', gb: 1.23, idle: 0 },
  { id: 'xcode', bid: 'com.apple.dt.Xcode', n: 'Xcode', c: '#2563eb', l: 'X', gb: 0.98, idle: 0 },
  { id: 'slack', bid: 'com.tinyspeck.slackmacgap', n: 'Slack', c: '#be185d', l: 'Sl', gb: 0.64, idle: 0 },
  { id: 'ps', bid: 'com.adobe.Photoshop', n: 'Photoshop', c: '#1e40af', l: 'Ps', gb: 0.56, idle: 312 },
  { id: 'spotify', bid: 'com.spotify.client', n: 'Spotify', c: '#16a34a', l: '♪', gb: 0.41, idle: 431 },
  { id: 'mail', bid: 'com.apple.mail', n: 'Mail', c: '#38bdf8', l: 'M', gb: 0.31, idle: 22 },
  { id: 'docker', bid: 'com.docker.docker', n: 'Docker Desktop', c: '#0284c7', l: 'D', gb: 0.27, idle: 3 },
  { id: 'notes', bid: 'com.apple.Notes', n: 'Notes', c: '#d97706', l: 'N', gb: 0.12, idle: 1560 }
];
let X = null;
const isLight = th => th === 'light' || (th === 'system' && document.documentElement.dataset.theme === 'light');
on('lang', () => X && X.relang());
on('theme', () => X && X.retheme());
on('extras', () => X && X.place());

export function open(app) {
  css(CSS);
  if (X) return X.toggle();
  X = start(app);
}

function start(app) {
  const set = { display: 'both', percent: true, deep: true, theme: 'dark', auto: false, threshold: 8, cooldown: 30, refresh: 2, notifyClean: true, notifyInactive: false, showInactive: true, inactiveHours: 3,
    ignored: [], autoUpdate: true, guard: true, guardCPU: true, guardAutoQuit: false, login: false };
  const m = { total: 16, apps: APPS0.map(a => ({ ...a })), wired: 2.3, comp: 1.15, cache: 3.2, alloc: 0, pushed: 0, swap: 0.4, hist: [] };
  const st = { busy: null, progress: 0, result: null, cancel: false, lastAuto: 0, dead: false, updMsg: 'idle', runaway: null, ranOnce: false };
  const timers = new Set(); let iv = 0, panel = null, settingsTab = 'general';
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!st.dead) fn(); }, ms); timers.add(t); return t; };

  /* ---------- modèle mémoire ---------- */
  const appMem = () => m.apps.reduce((a, x) => a + x.gb, 0) - m.pushed + m.alloc;
  const used = () => appMem() + m.wired + m.comp;
  const avail = () => Math.max(0, m.total - used());
  const free = () => Math.max(0, avail() - m.cache);
  const frac = () => clamp(used() / m.total, 0, 1);
  const level = () => { const f = (used() - m.alloc) / m.total; return f > .92 ? 'dg' : f > .82 ? 'wn' : 'ok'; };
  for (let i = 0; i < 48; i++) m.hist.push(.6 + Math.sin(i / 5) * .018 + Math.sin(i * 1.7) * .006);
  function tick() {
    m.apps.forEach(a => { a.gb = Math.max(.05, a.gb + (Math.random() - .5) * .03 * (a.run ? 0 : a.gb)); });
    m.wired = clamp(m.wired + (Math.random() - .5) * .02, 2.2, 2.4);
    m.pushed = Math.max(0, m.pushed - .015); m.comp = Math.max(1.1, m.comp - (m.pushed > 0 ? .01 : .004)); m.swap = Math.max(.35, m.swap - .004);
    if (!st.busy && m.cache < 3.7) m.cache = Math.min(m.cache + .04 + Math.random() * .08, 3.7);
    if (m.cache > avail() - .3) m.cache = Math.max(0, avail() - .3);
    m.hist.push(frac()); if (m.hist.length > 120) m.hist.shift();
    autoCheck(); paint();
  }
  const resched = () => { clearInterval(iv); iv = setInterval(() => { if (!st.dead) tick(); }, set.refresh * 1000); };

  /* ---------- nettoyage ---------- */
  async function clean(kind) {
    if (st.busy) return; sfx.click();
    const before = { free: free() }, target = kind === 'deep' ? m.cache + appMem() * .25 : m.cache, limit = kind === 'deep' ? 40 : 20, t0 = performance.now();
    st.busy = kind; st.progress = 0; st.result = null; st.cancel = false; paint();
    let allocated = 0, stop = 'done';
    if (kind === 'deep') await wait(900);
    while (!st.dead) {
      await wait(300); if (st.dead) return;
      if (st.cancel) { stop = 'cancelled'; break; }
      if (level() !== 'ok') { stop = 'pressure'; break; }
      if ((performance.now() - t0) / 1000 > limit) { stop = 'time'; break; }
      const remaining = target - allocated; if (remaining < .01) break;
      const room = avail() - 2; if (room <= 0) { stop = 'reserve'; break; }
      const step = Math.min(.5, remaining, room); allocated += step; m.alloc += step;
      const fromCache = Math.min(step, m.cache); m.cache -= fromCache; const fromApp = step - fromCache; if (fromApp > 0) { m.pushed += fromApp; m.comp += fromApp * .6; m.swap += fromApp * .08; }
      st.progress = target > 0 ? Math.min(1, allocated / target) : 1; paint(); sfx.tick();
    }
    m.alloc = 0; await wait(500); if (st.dead) return;
    const freed = Math.max(0, free() - before.free);
    st.busy = null; st.result = { freed, stop }; m.hist.push(frac()); paint();
    if (stop !== 'cancelled') { sfx.done(); if (set.notifyClean) toast({ icon: icon('mCLEAN'), title: T('Nettoyage terminé', 'Cleaning finished'), body: T(`${size(freed)} libérés, ${size(free())} libres`, `${size(freed)} freed, ${size(free())} free`) }); }
  }
  function autoCheck() {
    if (!set.auto || st.busy || level() !== 'ok') return;
    if (avail() >= set.threshold || Date.now() - st.lastAuto < set.cooldown * 60000) return;
    st.lastAuto = Date.now(); clean('standard');
  }

  /* ---------- applis ---------- */
  const hogs = () => [...m.apps].sort((a, b) => b.gb - a.gb).slice(0, 4);
  const inactive = () => (set.showInactive ? m.apps.filter(a => a.idle >= set.inactiveHours * 60 && !set.ignored.includes(a.bid)).sort((a, b) => b.gb - a.gb).slice(0, 4) : []);
  function quitApp(a) {
    if (a.gone) return; a.gone = true; sfx.pop();
    const row = panel && panel.el.querySelector(`[data-id="${a.id}"]`); row && row.classList.add('mc-out');
    later(() => { m.apps = m.apps.filter(x => x !== a); if (st.runaway && st.runaway.app === a) st.runaway = null; m.hist.push(frac()); paint(); }, row ? 340 : 0);
  }
  function startRunaway() {
    if (st.ranOnce) return; if (st.busy || !set.guard) return later(startRunaway, 8000); st.ranOnce = true;
    const a = m.apps.find(x => x.id === 'docker'); if (!a) return; a.run = true; st.runaway = { app: a, base: a.gb, warned: false, t: 0 };
    const stepper = () => {
      const r = st.runaway; if (!r || !a.run) return; r.t += .5;
      if (a.gb - r.base < 4.2 && r.t < 40) a.gb += .16; else if (r.t > 70) a.gb = Math.max(.3, a.gb - .3);
      if (!r.warned && a.gb - r.base >= 2.4 && set.guard) { r.warned = true; notice({ title: T(`${a.n} consomme de plus en plus de mémoire`, `${a.n} is using more and more memory`), body: T(`+${size(a.gb - r.base)} en 30 s. Quittez-la si elle ne répond plus.`, `+${size(a.gb - r.base)} in 30 s. Quit it if it stops responding.`), actions: [{ l: T('Quitter', 'Quit'), fn: () => quitApp(a) }] }); }
      if (a.gb <= r.base + .05 && r.t > 70) { a.run = false; st.runaway = null; return; }
      paint(); later(stepper, 500);
    };
    stepper();
  }
  function notice({ title, body, actions = [], ms = 20000 }) {
    const n = $$('.toast').length, el = h('div', { class: 'toast glass mclean-note', role: 'alert' }, h('img', { src: icon('mCLEAN'), alt: '' }),
      h('div', {}, h('b', {}, title), h('p', {}, body), actions.length ? h('div', { class: 'mc-na' }, actions.map(a => h('button', { class: 'btn', type: 'button', onclick: () => { a.fn(); gone(); } }, a.l))) : null));
    el.style.top = (44 + n * 100) + 'px'; $('#layer').append(el); sfx.notif();
    el.animate([{ opacity: 0, transform: 'translateX(40px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.2,.9,.3,1.1)' });
    const gone = () => { if (!el.isConnected) return; el.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateX(40px)' }], { duration: 260 }).onfinish = () => el.remove(); };
    later(gone, ms);
  }

  /* ---------- élément de la barre des menus ---------- */
  const R = 6.5, C = 2 * Math.PI * R;
  const el = h('button', { class: 'mb extra mclean-x', 'aria-label': 'mCLEAN', type: 'button' });
  el.innerHTML = `<svg viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="${R}" fill="none" stroke="currentColor" stroke-opacity=".3" stroke-width="2.5"/><circle class="arc" cx="9" cy="9" r="${R}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="0 ${C}" transform="rotate(-90 9 9)"/></svg><span class="mc-t"></span>`;
  const arc = el.querySelector('.arc'), txt = el.querySelector('.mc-t');
  function bar() {
    const f = frac(), lv = level(), spin = !!st.busy;
    el.classList.toggle('mc-wn', lv === 'wn'); el.classList.toggle('mc-dg', lv === 'dg'); el.classList.toggle('spin', spin);
    arc.setAttribute('stroke-dasharray', spin ? `${C * 110 / 360} ${C}` : `${C * f} ${C}`);
    el.querySelector('svg').style.display = set.display === 'text' ? 'none' : '';
    txt.style.display = set.display === 'icon' ? 'none' : ''; txt.textContent = set.percent ? pct(f) : size(avail());
  }

  /* ---------- panneau ---------- */
  function build() {
    const gz = h('div', { class: 'mc-gz' }), gc = h('div', { class: 'mc-gc' }), gv = h('b'), gl = h('small');
    const RR = 63, CC = 2 * Math.PI * RR;
    gz.innerHTML = `<svg viewBox="0 0 136 136" aria-hidden="true"><circle class="mc-tr" cx="68" cy="68" r="${RR}" fill="none" stroke-width="10"/><circle class="mc-ar" cx="68" cy="68" r="${RR}" fill="none" stroke-width="10" stroke-linecap="round" stroke-dasharray="0 ${CC}" transform="rotate(-90 68 68)"/></svg>`;
    gc.append(gv, gl); gz.append(gc);
    const ring = gz.querySelector('.mc-ar');
    const legend = [['app', '#0ea5e9'], ['wired', '#fbbf24'], ['comp', '#f59e0b'], ['cache', '#8f8f8f'], ['free', BRAND]].map(([k, c]) => {
      const v = h('span', { class: 'mc-mono' }); const row = h('div', { class: 'mc-lr' }, h('i', { style: { background: c } }), h('span', {}), v); return { k, row, v, lab: row.children[1] };
    });
    const pres = h('span'), swap = h('span', { class: 'mc-sw' });
    const spw = h('div', { html: '<svg class="mc-sp" viewBox="0 0 288 28" preserveAspectRatio="none" aria-hidden="true"><polyline points=""/></svg>' }), line = spw.querySelector('polyline');
    const hogBox = h('div', { class: 'mc-ls' }), inaBox = h('div', { class: 'mc-ls' });
    const rs = h('p', { class: 'mc-rs' }), bt = h('div', { class: 'mc-bt' });
    const gear = h('button', { class: 'mc-gear', type: 'button', 'aria-label': T('Réglages…', 'Settings…'), html: GEAR, onclick: () => openSettings() });
    const el2 = h('div', { class: 'mclean-pop', role: 'dialog', 'aria-label': 'mCLEAN' }, h('i', { class: 'mc-arw' }),
      h('div', { class: 'mc-hd' }, h('b', { html: brand('mCLEAN', BRAND) }), gear),
      h('div', { class: 'mc-bd' }, gz, h('div', { class: 'mc-lg' }, legend.map(x => x.row), h('div', { class: 'mc-ps' }, pres, swap)), spw, hogBox, inaBox),
      h('div', { class: 'mc-ft' }, rs, bt));
    /* listes : une ligne par appli, mise à jour sur place (le bouton Quitter ne bouge pas sous le pointeur) */
    const rows = new Map();
    const syncList = (box, title, list, quit) => {
      box.hidden = !list.length; if (!list.length) { box.querySelectorAll('.mc-ar2').forEach(r => r.remove()); return; }
      let hd = box.querySelector('h5'); if (!hd) { hd = h('h5'); box.prepend(hd); } hd.textContent = title;
      const have = new Map([...box.querySelectorAll('.mc-ar2')].map(r => [r.dataset.id, r]));
      have.forEach((r, id) => { if (!list.some(a => a.id === id) && !r.classList.contains('mc-out')) r.remove(); });
      list.forEach((a, i) => {
        let r = have.get(a.id);
        if (!r) { r = h('div', { class: 'mc-ar2', 'data-id': a.id }, h('i', { class: 'mclean-ai', style: { background: a.c } }, a.l), h('span', { class: 'mc-n' }, a.n), h('span', { class: 'mc-mono' }), quit ? h('button', { class: 'mclean-qb', type: 'button', onclick: () => quitApp(a) }, T('Quitter', 'Quit')) : null); }
        r.querySelector('.mc-n').textContent = a.n; r.querySelector('.mc-mono').textContent = size(a.gb); const q = r.querySelector('.mclean-qb'); q && (q.textContent = T('Quitter', 'Quit'), q.title = T(`Inactive depuis ${since(a.idle)}`, `Inactive for ${since(a.idle)}`));
        if (box.children[i + 1] !== r) box.insertBefore(r, box.children[i + 1] || null);
      });
    };
    function update() {
      const busy = !!st.busy, f = frac(), lv = level(), af = 1 - f;
      gz.className = 'mc-gz' + (busy ? ' mc-busy' : lv === 'wn' ? ' mc-wn' : lv === 'dg' ? ' mc-dg' : '');
      ring.setAttribute('stroke-dasharray', `${CC * (busy ? st.progress : af)} ${CC}`);
      gv.textContent = busy ? pct(st.progress) : size(avail()); gl.textContent = busy ? T('Nettoyage…', 'Cleaning…') : T('disponibles', 'available');
      const V = { app: appMem(), wired: m.wired, comp: m.comp, cache: m.cache, free: free() };
      legend.forEach(x => { x.lab.textContent = T(...({ app: ['Mémoire des applis', 'App memory'], wired: ['Mémoire résidente', 'Wired memory'], comp: ['Compressée', 'Compressed'], cache: ['Cache de fichiers', 'File cache'], free: ['Libre', 'Free'] }[x.k])); x.v.textContent = size(V[x.k]); });
      pres.textContent = lv === 'ok' ? T('Pression normale', 'Normal pressure') : lv === 'wn' ? T('Pression élevée', 'High pressure') : T('Pression critique', 'Critical pressure'); pres.className = 'mc-' + lv;
      swap.textContent = T(`Swap : ${size(m.swap)}`, `Swap: ${size(m.swap)}`);
      const n = m.hist.length, step = 288 / Math.max(n - 1, 1); line.setAttribute('points', m.hist.map((v, i) => `${(i * step).toFixed(1)},${(28 * (1 - v)).toFixed(1)}`).join(' ')); spw.hidden = n < 2;
      syncList(hogBox, T('Applis les plus gourmandes', 'Biggest apps'), hogs(), false); syncList(inaBox, T('Applis inactives', 'Inactive apps'), inactive(), true);
      const r = st.result; rs.hidden = !r || busy;
      if (r) { const fr = size(r.freed); rs.textContent = r.stop === 'cancelled' ? T(`Annulé, ${fr} libérés`, `Cancelled, ${fr} freed`) : ['pressure', 'swap', 'compression', 'reserve'].includes(r.stop) ? T(`${fr} libérés, arrêt pour ne pas ralentir le Mac`, `${fr} freed, stopped to avoid slowing down the Mac`) : T(`${fr} libérés`, `${fr} freed`); }
      const key = (busy ? 'b' : set.deep ? 'cd' : 'c') + lang(); if (bt.dataset.k !== key) {
        bt.dataset.k = key; bt.replaceChildren(...(busy ? [h('button', { class: 'mclean-b sec', type: 'button', onclick: () => { st.cancel = true; sfx.click(); } }, T('Annuler', 'Cancel'))]
          : [h('button', { class: 'mclean-b mc-pri', type: 'button', onclick: () => clean('standard') }, T('Nettoyer', 'Clean')), set.deep ? h('button', { class: 'mclean-b act', type: 'button', title: T('Vide aussi le cache disque avec purge : le mot de passe administrateur est demandé.', 'Also empties the disk cache with purge: asks for the administrator password.'), onclick: () => clean('deep') }, T('Profond', 'Deep')) : null].filter(Boolean)));
      }
      el2.dataset.th = isLight(set.theme) ? 'light' : 'dark'; gear.setAttribute('aria-label', T('Réglages…', 'Settings…'));
    }
    return { el: el2, update, arrow: el2.querySelector('.mc-arw') };
  }
  function place() {
    if (!panel) return; const r = el.getBoundingClientRect(), s = $('#stage').getBoundingClientRect(), cx = (r.left + r.width / 2 - s.left) / S.scale, left = clamp(cx - 161, 8, 1600 - 330);
    panel.el.style.left = left + 'px'; panel.arrow.style.left = (cx - left - 6) + 'px';
  }
  const away = e => { if (panel && !panel.el.contains(e.target) && !el.contains(e.target)) closePanel(); };
  const esc = e => { if (e.key === 'Escape' && panel) closePanel(); };
  function openPanel() {
    if (panel || st.dead) return; closeMacMenu(); sfx.click();
    panel = build(); $('#layer').append(panel.el); panel.update(); place(); el.classList.add('open');
    panel.el.animate([{ opacity: 0, transform: 'translateY(-6px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 160, easing: 'ease-out' });
    setTimeout(() => { addEventListener('pointerdown', away, true); addEventListener('keydown', esc, true); }, 0);
  }
  function closePanel() { if (!panel) return; panel.el.remove(); panel = null; el.classList.remove('open'); removeEventListener('pointerdown', away, true); removeEventListener('keydown', esc, true); }
  const toggle = () => (panel ? closePanel() : openPanel());
  el.addEventListener('click', toggle);
  el.addEventListener('contextmenu', e => { e.preventDefault(); closePanel(); macMenu(el, menu()); });
  const paint = () => { bar(); panel && panel.update(); };

  /* ---------- menu (clic droit), À propos ---------- */
  const menu = () => [
    { l: T('Réglages…', 'Settings…'), fn: () => openSettings() },
    { l: T('Rechercher les mises à jour…', 'Check for updates…'), fn: () => { openSettings('updates'); checkUpdates(); } },
    { sep: 1 },
    { l: T('À propos de mCLEAN', 'About mCLEAN'), fn: about },
    { l: T('Quitter', 'Quit'), fn: quit }
  ];
  function about() {
    aboutWin(app, { h: 478, version: () => T('Version 1.3.1 (10)', 'Version 1.3.1 (10)'), lines: () => [
      [T('Surveille la mémoire du Mac depuis la barre de menus et la libère en un clic.', 'Monitors your Mac’s memory from the menu bar and frees it in one click.')],
      [T('Par Starbudweiser & Claude Code (Anthropic).', 'By Starbudweiser & Claude Code (Anthropic).'), 'au'], [T('Licence MIT. © 2026 Starbudweiser.', 'MIT License. © 2026 Starbudweiser.')],
      [T('Logiciel fourni « en l’état », sans garantie d’aucune sorte.', 'Provided "as is", without warranty of any kind.'), 'mut'],
      [T('Inspiré de Memory Cleaner d’AppYogi, sans lien avec ses auteurs.', 'Inspired by AppYogi’s Memory Cleaner, not affiliated with its authors.'), 'mut']] });
  }

  /* ---------- réglages ---------- */
  function checkUpdates() { if (st.updMsg === 'checking') return; st.updMsg = 'checking'; redrawSettings(); later(() => { st.updMsg = 'ok'; redrawSettings(); }, 1400); }
  let sw = null;
  function openSettings(tab) {
    if (tab) settingsTab = tab; closePanel(); closeMacMenu();
    if (sw && wm.wins.get('app:mCLEAN')) { wm.focus('app:mCLEAN'); redrawSettings(); return; }
    const r = el.getBoundingClientRect(), s = $('#stage').getBoundingClientRect(), cx = (r.left + r.width / 2 - s.left) / S.scale;
    sw = wm.open({ id: 'app:mCLEAN', appId: 'mCLEAN', title: 'mCLEAN', w: 440, h: 546, minw: 440, minh: 546, resizable: false, bare: true, cls: 'socle mclean-win', x: Math.round(clamp(cx - 220, 8, 1600 - 448)), y: 46,
      onclose: () => { sw = null; },
      build: w => {
        const root = h('div', { class: 'mclean-set' }), body = h('div', { class: 'mc-sb' });
        w.redraw = () => draw(); sw = w;
        const draw = () => {
          root.dataset.th = isLight(set.theme) ? 'light' : 'dark'; w.el.classList.toggle('lt', root.dataset.th === 'light');
          const tabs = [['general', T('Général', 'General')], ['auto', T('Automatique', 'Automatic')], ['apps', T('Applis inactives', 'Inactive apps')], ['updates', T('Mises à jour', 'Updates')]];
          const seg = h('div', { class: 'mclean-seg', role: 'tablist' }, tabs.map(([k, l]) => h('button', { type: 'button', role: 'tab', class: settingsTab === k ? 'on' : '', 'aria-selected': settingsTab === k, onclick: () => { settingsTab = k; sfx.tick(); draw(); } }, l)));
          body.replaceChildren(seg, content());
          root.querySelector('.mc-tt').textContent = T('Réglages', 'Settings');
        };
        root.append(h('div', { class: 'mc-tb', 'data-drag': '' }, wm.lights(w), h('span', { class: 'mc-tt' })), body); draw(); return root;
      } });
  }
  const redrawSettings = () => { const w = wm.wins.get('app:mCLEAN'); w && w.redraw && w.redraw(); };
  const content = () => ({ general, auto, apps, updates }[settingsTab])();
  /* briques de formulaire : mises à jour sur place */
  const swt = (label, key, after) => { const b = h('button', { class: 'mclean-sw' + (set[key] ? ' on' : ''), type: 'button', role: 'switch', 'aria-checked': !!set[key], 'aria-label': label, onclick: () => { set[key] = !set[key]; b.classList.toggle('on', set[key]); b.setAttribute('aria-checked', set[key]); sfx.tick(); after && after(); paint(); } }); return h('div', { class: 'mc-row' }, h('span', {}, label), b); };
  const segm = (label, key, opts) => { const g = h('div', { class: 'mclean-seg' }, opts.map(([v, l]) => h('button', { type: 'button', class: set[key] === v ? 'on' : '', onclick: () => { set[key] = v; [...g.children].forEach((c, i) => c.classList.toggle('on', opts[i][0] === v)); sfx.tick(); if (key === 'theme') { const w = wm.wins.get('app:mCLEAN'); w && w.redraw(); } paint(); } }, l))); return h('div', { class: 'mc-row' }, h('span', {}, label), g); };
  const slider = (label, key, [min, max, step], fmt, after) => {
    const val = h('span', { class: 'mc-mono' }, fmt(set[key])), inp = h('input', { type: 'range', min, max, step, value: set[key], 'aria-label': label });
    const pc = () => inp.style.setProperty('--p', ((inp.value - min) / (max - min) * 100) + '%'); pc();
    inp.addEventListener('input', () => { set[key] = +inp.value; val.textContent = fmt(set[key]); pc(); after && after(); paint(); });
    return h('div', { class: 'mclean-sl' }, h('div', { class: 'mc-row' }, h('span', {}, label), val), inp);
  };
  const general = () => h('div', { class: 'mc-ct' },
    swt(T('Ouvrir à la connexion', 'Open at login'), 'login'),
    segm(T('Barre de menus', 'Menu bar'), 'display', [['both', T('Icône et texte', 'Icon and text')], ['text', T('Texte', 'Text')], ['icon', T('Icône', 'Icon')]]),
    swt(T('Afficher en pourcentage utilisé', 'Show percentage used'), 'percent'),
    swt(T('Bouton Nettoyage profond', 'Deep clean button'), 'deep'),
    segm(T('Thème', 'Theme'), 'theme', [['dark', T('Sombre', 'Dark')], ['light', T('Clair', 'Light')], ['system', T('Système', 'System')]]),
    slider(T('Fréquence du relevé', 'Refresh interval'), 'refresh', [1, 30, 1], v => v + T(' s', ' s'), resched));
  const auto = () => {
    const sub = h('div', { class: 'mc-ct' + (set.guard ? '' : ' off') }, swt(T('Ralentir les applis d’arrière-plan qui saturent le processeur', 'Slow down background apps that saturate the CPU'), 'guardCPU'), swt(T('En urgence, quitter les applis inactives', 'In an emergency, quit inactive apps'), 'guardAutoQuit'));
    return h('div', { class: 'mc-ct' },
      swt(T('Nettoyer automatiquement', 'Clean automatically'), 'auto', () => { st.lastAuto = 0; autoCheck(); }),
      h('p', { class: 'mc-help' }, T('Lance un nettoyage simple, sans mot de passe, quand la mémoire disponible passe sous le seuil. Jamais sous pression élevée : macOS libère alors la mémoire lui-même.', 'Runs a simple clean, with no password, when available memory falls below the threshold. Never under high pressure: macOS then frees memory on its own.')),
      slider(T('Seuil de mémoire disponible', 'Available memory threshold'), 'threshold', [1, Math.max(2, Math.round(m.total / 2)), 1], v => size(v), () => { st.lastAuto = 0; autoCheck(); }),
      slider(T('Délai minimal entre deux nettoyages', 'Minimum time between cleans'), 'cooldown', [5, 120, 5], v => v + ' min'),
      swt(T('Notifier à la fin d’un nettoyage', 'Notify when a clean finishes'), 'notifyClean'), h('hr'),
      swt(T('Garde-fou : éviter que le Mac se fige', 'Safeguard: keep the Mac from freezing'), 'guard', () => sub.classList.toggle('mc-off', !set.guard)),
      h('p', { class: 'mc-help' }, T('Surveille de près la mémoire et le processeur. Quand la mémoire devient critique, ou qu’une appli s’emballe, il vous prévient avec un bouton Quitter.', 'Watches memory and CPU closely. When memory gets critical or an app runs away, it alerts you with a Quit button.')), sub);
  };
  const apps = () => {
    const list = h('div', { class: 'mc-ig' }), add = h('button', { class: 'mc-btn2', type: 'button', onclick: () => { const cand = m.apps.filter(a => !set.ignored.includes(a.bid)).sort((a, b) => a.n.localeCompare(b.n)); macMenu(add, cand.length ? cand.map(a => ({ l: a.n, fn: () => { set.ignored.push(a.bid); drawIg(); paint(); } })) : [{ l: T('Aucune appli', 'No app'), dis: true }]); } }, T('Ajouter', 'Add'));
    const drawIg = () => list.replaceChildren(...set.ignored.map(id => h('div', { class: 'mc-row' }, h('span', { class: 'mc-mono' }, id), h('button', { class: 'mc-btn2 mc-t', type: 'button', onclick: () => { set.ignored = set.ignored.filter(x => x !== id); drawIg(); paint(); } }, T('Retirer', 'Remove')))));
    drawIg();
    return h('div', { class: 'mc-ct mc-grow' }, swt(T('Afficher les applis inactives', 'Show inactive apps'), 'showInactive'), swt(T('Notifier les applis inactives', 'Notify about inactive apps'), 'notifyInactive'),
      slider(T('Inactive après', 'Inactive after'), 'inactiveHours', [1, 24, 1], v => v + T(' h', ' h')), h('div', { class: 'mc-row' }, h('span', {}, T('Applis ignorées', 'Ignored apps')), add), list);
  };
  const updates = () => {
    const msg = st.updMsg === 'checking' ? T('Recherche en cours…', 'Checking…') : st.updMsg === 'ok' ? T('Vous avez la dernière version.', 'You have the latest version.') : T('Pas encore vérifié', 'Not checked yet');
    return h('div', { class: 'mc-ct' }, swt(T('Installer automatiquement', 'Install automatically'), 'autoUpdate'),
      h('p', { class: 'mc-help' }, T('Vérifie une fois par jour la dernière version publiée sur GitHub, la télécharge, contrôle sa signature puis remplace l’appli et la relance. Jamais pendant un nettoyage.', 'Checks once a day for the latest version published on GitHub, downloads it, verifies its signature, then replaces the app and relaunches it. Never during a clean.')),
      h('div', { class: 'mc-mono' }, T('Version installée : 1.3.1', 'Installed version: 1.3.1')), h('p', { class: 'mc-st' }, msg),
      h('div', { class: 'mc-row', style: { justifyContent: 'flex-start' } }, h('button', { class: 'mc-btn2', type: 'button', disabled: st.updMsg === 'checking', onclick: () => { sfx.click(); checkUpdates(); } }, T('Rechercher maintenant', 'Check now'))));
  };

  /* ---------- cycle de vie ---------- */
  function quit() {
    if (st.dead) return; st.dead = true; clearInterval(iv); timers.forEach(clearTimeout); closePanel(); closeMacMenu();
    const w = wm.wins.get('app:mCLEAN'); w && wm.close('app:mCLEAN'); const a = wm.wins.get('about:mCLEAN'); a && wm.close('about:mCLEAN');
    S.extras.delete('mCLEAN'); emit('extras'); X = null; sfx.close();
  }
  S.extras.set('mCLEAN', { el, quit }); emit('extras'); bar(); sfx.open(); resched();
  later(openPanel, 800); later(startRunaway, 42000);
  return { toggle, quit, place, relang: () => { paint(); redrawSettings(); closeMacMenu(); if (panel) { panel.el.querySelector('.mc-hd .mc-gear').setAttribute('aria-label', T('Réglages…', 'Settings…')); } },
    retheme: () => { paint(); redrawSettings(); } };
}
