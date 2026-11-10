/* Réplique interactive de mLINKS (interface Socle) : icône dans la barre des menus (groupes en sous-menus, ⌥ pour afficher dans le Finder, raccourcis globaux)
   et fenêtre « Gérer les liens » à trois colonnes (groupes, liens, détail). Données d'exemple : rien n'est lu, rien n'est envoyé.
   Ce module exporte aussi quelques briques communes à mBACKUP, mSTICK et qNOTES (menus macOS, fenêtre « À propos », alertes, saisie de raccourcis). */
import { S, emit, appById } from '../core.js';
import { h, $, T, css, sfx, toast, wm, launch, download, bar, icon as appIcon, clamp, esc, brand } from './kit.js';

/* ====================================================================== briques communes ====================================================================== */
export const CSS = 'css/demos/mLINKS.css';
export function cssReady(...more) {
  return Promise.all([CSS, ...more].map(u => new Promise(res => {
    css(u);
    const l = document.querySelector(`link[data-k="${u}"]`);
    if (!l || l.sheet) return res();
    l.addEventListener('load', res, { once: true }); l.addEventListener('error', res, { once: true }); setTimeout(res, 1500);
  })));
}
export const SVG = {
  chev: '<svg viewBox="0 0 10 10"><path d="M3 1.5 6.5 5 3 8.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  up: '<svg viewBox="0 0 10 10"><path d="M1.8 6.5 5 3.3l3.2 3.2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  down: '<svg viewBox="0 0 10 10"><path d="M1.8 3.5 5 6.7l3.2-3.2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  plus: '<svg viewBox="0 0 16 16"><path d="M8 3v10M3 8h10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  check: '<svg viewBox="0 0 12 12"><path d="m2.5 6.3 2.4 2.4 4.6-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  x: '<svg viewBox="0 0 12 12"><path d="m3 3 6 6M9 3 3 9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  warn: '<svg viewBox="0 0 16 16"><path d="M8 2.2 14.6 13.6H1.4z" fill="none" stroke="#fbbf24" stroke-width="1.4" stroke-linejoin="round"/><path d="M8 6.4v3.3" stroke="#fbbf24" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="11.6" r=".9" fill="#fbbf24"/></svg>',
  globe: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="8" cy="8" r="6" opacity=".85"/><ellipse cx="8" cy="8" rx="2.6" ry="6" opacity=".85"/><path d="M2.3 6h11.4M2.3 10h11.4" opacity=".85"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  folder: '<svg viewBox="0 0 16 16"><path d="M1.5 4.3c0-.7.5-1.3 1.2-1.3h3.1c.4 0 .7.2 1 .5l.8.9h5.7c.7 0 1.2.6 1.2 1.3v6.3c0 .7-.5 1.3-1.2 1.3H2.7c-.7 0-1.2-.6-1.2-1.3z" fill="#3b9aee"/><path d="M1.5 6.4h13v6.2c0 .7-.5 1.3-1.2 1.3H2.7c-.7 0-1.2-.6-1.2-1.3z" fill="#68b8fa"/></svg>',
  doc: c => `<svg viewBox="0 0 16 16"><path d="M3.5 1.5h6l3 3v9.2c0 .5-.4.8-.8.8H3.5c-.5 0-.8-.3-.8-.8V2.3c0-.4.3-.8.8-.8z" fill="#e9e9ee"/><path d="M9.5 1.5v3h3z" fill="#c9c9d2"/><rect x="4.5" y="9" width="7" height="3.2" rx=".8" fill="${c}"/></svg>`,
  app: (c, l) => `<svg viewBox="0 0 16 16"><rect x="1.5" y="1.5" width="13" height="13" rx="3.4" fill="${c}"/><text x="8" y="11.2" text-anchor="middle" font-size="8.6" font-weight="700" fill="#fff" font-family="-apple-system,Helvetica,Arial,sans-serif">${esc(l)}</text></svg>`
};
/* texte courant : le nom de l'appli y prend la couleur de sa lettre minuscule (règle Socle) */
export const bhtml = (s, name, color) => esc(s).split(name).join(brand(name, color));
export const hue = s => { let n = 0; for (const c of s) n = (n * 31 + c.charCodeAt(0)) % 360; return `hsl(${n} 52% 46%)`; };

/* ---------- menus macOS : sous-menus, badges, entrées alternes (⌥), clavier ---------- */
let MENU = null;
export const closeMenus = () => MENU && MENU.close();
export const menuOpenFor = el => !!(MENU && MENU.anchor === el);
export function macMenu(anchor, items, o = {}) {
  closeMenus();
  const layer = $('#layer'), els = []; let alt = false, timer = 0;
  const pt = (cx, cy) => { const s = $('#stage').getBoundingClientRect(); return { x: (cx - s.left) / S.scale, y: (cy - s.top) / S.scale }; };
  const setAlt = v => { if (v === alt) return; alt = v; els.forEach(m => m.classList.toggle('alt', v)); };
  const cut = n => { while (els.length > n) els.pop().remove(); };
  const setOn = b => { [...b.parentElement.children].forEach(x => x.classList.remove('on')); b.classList.add('on'); };
  function make(list, depth) {
    const m = h('div', { class: 'menu mlkx-menu' + (depth ? ' sub' : ''), role: 'menu' });
    if (alt) m.classList.add('alt');
    list.forEach(it => {
      if (it.sep) return m.append(h('hr'));
      const lb = h('span', { class: 'mlkx-mlb' + (it.alt ? ' has-alt' : ''), style: it.color ? { '--mc': it.color } : null });
      if (it.alt) lb.append(h('span', { class: 'n' }, it.label), h('span', { class: 'a' }, it.alt)); else lb.textContent = it.label;
      const ic = h('span', { class: 'mlkx-mic' });
      if (typeof it.icon === 'string') ic.innerHTML = it.icon; else if (it.icon) ic.append(it.icon); else if (it.check) ic.textContent = '✓';
      const b = h('button', { class: 'mi mlkx-mi' + (it.disabled ? ' dis' : '') + (it.danger ? ' dg' : ''), role: 'menuitem', tabindex: '-1', 'aria-disabled': it.disabled ? 'true' : null }, ic, lb,
        it.badge ? h('span', { class: 'mlkx-mbd', style: { 'grid-column': '3' } }, it.badge) : null, it.key ? h('span', { class: 'ks', style: { 'grid-column': '3' } }, it.key) : null,
        it.sub ? h('span', { class: 'mlkx-mch', style: { 'grid-column': '4' }, html: SVG.chev }) : null);
      b._sub = !!it.sub;
      b.addEventListener('pointerenter', e => {
        clearTimeout(timer); setAlt(e.altKey); if (it.disabled && !it.sub) { setOn(b); cut(depth + 1); return; }
        setOn(b); if (it.sub) timer = setTimeout(() => openSub(b, it, depth), 90); else cut(depth + 1);
      });
      b.addEventListener('click', e => {
        e.stopPropagation(); if (it.disabled) return;
        if (it.sub) { openSub(b, it, depth); return; }
        sfx.click(); const a = alt || e.altKey; close(); it.fn && it.fn({ alt: a });
      });
      m.append(b);
    });
    return m;
  }
  function openSub(row, it, depth) {
    cut(depth + 1); const m = make(it.sub, depth + 1); layer.append(m); els.push(m);
    const rr = row.getBoundingClientRect(), p = pt(rr.right, rr.top), q = pt(rr.left, rr.top), w = m.offsetWidth, hh = m.offsetHeight;
    let x = p.x - 4; if (x + w > 1592) x = q.x - w + 4;
    m.style.left = x + 'px'; m.style.top = clamp(p.y - 6, 30, 892 - hh) + 'px';
  }
  const first = make(items, 0); layer.append(first); els.push(first);
  const w = first.offsetWidth, hh = first.offsetHeight; let x, y;
  if (anchor.nodeType) {
    const r = anchor.getBoundingClientRect(), a = pt(r.left, r.bottom), b = pt(r.right, r.bottom);
    y = a.y + 2; x = o.align === 'left' ? a.x : b.x - w; anchor.classList.add('open');
  } else { const p = pt(anchor.x, anchor.y); x = p.x; y = p.y; }
  first.style.left = clamp(x, 8, 1592 - w) + 'px'; first.style.top = clamp(y, 30, 892 - hh) + 'px';
  const away = e => { if (!els.some(m => m.contains(e.target)) && !(anchor.nodeType && anchor.contains(e.target))) close(); };
  const kd = e => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (e.key === 'Alt') { setAlt(true); return; }
    const m = els[els.length - 1], btns = [...m.querySelectorAll('button.mi:not(.dis)')]; if (!btns.length) return;
    const cur = btns.findIndex(b => b.classList.contains('on'));
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const d = e.key === 'ArrowDown' ? 1 : -1; setOn(btns[cur < 0 ? (d > 0 ? 0 : btns.length - 1) : (cur + d + btns.length) % btns.length]); }
    else if ((e.key === 'Enter' || e.key === ' ') && cur >= 0) { e.preventDefault(); btns[cur].click(); }
    else if (e.key === 'ArrowRight' && cur >= 0 && btns[cur]._sub) { btns[cur].click(); const s = els[els.length - 1].querySelector('button.mi:not(.dis)'); s && setOn(s); }
    else if (e.key === 'ArrowLeft' && els.length > 1) cut(els.length - 1);
  };
  const ku = e => { if (e.key === 'Alt') setAlt(false); };
  const pm = e => setAlt(e.altKey);
  function close() {
    clearTimeout(timer); cut(0); removeEventListener('pointerdown', away, true); removeEventListener('keydown', kd, true); removeEventListener('keyup', ku, true); removeEventListener('pointermove', pm, true);
    if (anchor.nodeType) anchor.classList.remove('open'); if (MENU && MENU.close === close) MENU = null; o.onClose && o.onClose();
  }
  setTimeout(() => addEventListener('pointerdown', away, true), 0);
  addEventListener('keydown', kd, true); addEventListener('keyup', ku, true); addEventListener('pointermove', pm, true);
  return (MENU = { close, anchor, el: first });
}

/* ---------- alerte système (NSAlert) au centre de l'écran ---------- */
export function alertBox({ icon, title, text, buttons }) {
  const layer = $('#layer'), scrim = h('div', { class: 'mlkx-ascrim' });
  const box = h('div', { class: 'mlkx-alert glass', role: 'alertdialog', 'aria-label': title },
    icon ? h('img', { src: icon, alt: '' }) : null, h('b', {}, title), text ? h('p', {}, text) : null,
    h('div', { class: 'mlkx-bt' }, (buttons || [{ label: 'OK' }]).map((b, i) => h('button', { class: 'btn' + (i === 0 ? ' pri' : ''), onclick: () => { gone(); b.fn && b.fn(); } }, b.label))));
  const gone = () => { scrim.remove(); box.remove(); removeEventListener('keydown', kd, true); };
  const kd = e => { if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); gone(); } };
  layer.append(scrim, box); addEventListener('keydown', kd, true); sfx.notif && sfx.notif();
  box.animate([{ opacity: 0, transform: 'translate(-50%,-50%) scale(.96)' }, { opacity: 1, transform: 'translate(-50%,-50%)' }], { duration: 180, easing: 'ease-out' });
  box.querySelector('button').focus({ preventScroll: true });
  return gone;
}

/* ---------- feuille de dialogue Socle, posée sur une fenêtre ---------- */
export function sheet(root, { icon, title, text, buttons, body, wide, html }) {
  const scrim = h('div', { class: 'mlkx-scrim', role: 'presentation' });
  const dlg = h('div', { class: 'mlkx-dlg', role: 'alertdialog', 'aria-label': title, style: wide ? { width: 'min(' + wide + 'px,100%)' } : null },
    icon ? h('img', { src: icon, alt: '' }) : null, h('h3', { class: 'mlkx-heading' }, title), text ? h('p', { class: 'mlkx-muted', style: { lineHeight: '18px' }, html: html ? text : null }, html ? null : text) : null, body || null,
    h('div', { class: 'mlkx-dbtns' }, buttons.map(b => h('button', { class: 'mlkx-btn ' + (b.kind || ''), onclick: () => { close(); b.fn && b.fn(); } }, b.label))));
  scrim.append(dlg);
  const close = () => { scrim.remove(); root.removeEventListener('keydown', kd, true); };
  const kd = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  root.addEventListener('keydown', kd, true); root.append(scrim);
  (dlg.querySelector('.mlkx-btn.pri, .mlkx-btn.tdg') || dlg.querySelector('.mlkx-btn')).focus({ preventScroll: true });
  return close;
}

/* ---------- fenêtre « À propos » (modèle Socle : colonne de 300 px, marges de 28 px) ---------- */
export function aboutWin(app, { tagline, credit, brandColor, version }) {
  const id = 'app:' + app.id + ':about', ver = version || app.version || '1.0.0';
  const title = () => T('À propos de ' + app.id, 'About ' + app.id);
  const content = () => {
    const c = h('div', { class: 'mlkx-about' },
      h('img', { src: appIcon(app.id), alt: '' }), h('div', { class: 'mlkx-nm', html: brand(app.id, brandColor || app.accent) }),
      h('div', { class: 'mlkx-vr' }, T('Version ', 'Version ') + ver + ' (1)'), h('div', { class: 'mlkx-ds' }, tagline()),
      h('b', {}, 'Starbudweiser & Claude Code (Anthropic)'), h('div', {}, T('Licence MIT. © 2026 Starbudweiser.', 'MIT License. © 2026 Starbudweiser.')),
      h('div', { class: 'mlkx-mu' }, T('Fourni en l’état, sans garantie.', 'Provided as is, without warranty.')), h('div', { class: 'mlkx-mu' }, credit()),
      app.download ? h('button', { class: 'mlkx-btn', style: { marginTop: '6px' }, onclick: () => download(app) }, T('Télécharger', 'Download')) : null);
    return c;
  };
  const fit = w => requestAnimationFrame(() => { const c = w.body.querySelector('.mlkx-about'), hh = c ? c.offsetHeight + 46 : 480; w.h = hh; w.el.style.height = hh + 'px'; });
  return wm.open({ id, appId: app.id, title: title(), w: 356, h: 500, resizable: false, cls: 'socle mlkx-win mlkx-aboutwin',
    build: w => {
      w.render = () => { w.body.innerHTML = ''; w.body.append(h('div', { class: 'mlkx-root', style: { overflow: 'visible' } }, content())); const t = w.el.querySelector('.wt'); t && (t.textContent = title()); fit(w); };
      w.body.append(h('div', { class: 'mlkx-root', style: { overflow: 'visible' } }, content())); fit(w);
      return null;
    } });
}

/* ---------- raccourcis clavier : étiquettes et saisie ---------- */
const KEYNAMES = { Space: 'Space', Enter: '↩', Tab: '⇥', Backspace: '⌫', Delete: '⌦', ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Escape: '⎋', Minus: '-', Equal: '=', Comma: ',', Period: '.', Slash: '/', Semicolon: ';', Quote: '\'', BracketLeft: '[', BracketRight: ']', Backslash: '\\', Backquote: '`' };
const keyLabel = c => (/^Key[A-Z]$/.test(c) ? c.slice(3) : /^Digit\d$/.test(c) ? c.slice(5) : KEYNAMES[c] || c);
export const hotLabel = k => (k.ctrl ? '⌃' : '') + (k.alt ? '⌥' : '') + (k.shift ? '⇧' : '') + (k.meta ? '⌘' : '') + keyLabel(k.code);
export const hotMatch = (e, k) => !!k && e.code === k.code && e.ctrlKey === !!k.ctrl && e.altKey === !!k.alt && e.shiftKey === !!k.shift && e.metaKey === !!k.meta;
export const hotFrom = (c, mods) => ({ code: c, ctrl: mods.includes('c'), alt: mods.includes('a'), shift: mods.includes('s'), meta: mods.includes('m') });
/* Saisie : done({type:'cancel'|'clear'|'need'|'key', hk}) ; renvoie la fonction qui arrête l'écoute. */
export function recordHotkey(done) {
  const f = e => {
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;
    e.preventDefault(); e.stopPropagation();
    if (e.code === 'Escape') return done({ type: 'cancel' });
    if (e.code === 'Backspace') return done({ type: 'clear' });
    const hk = { code: e.code, ctrl: e.ctrlKey, alt: e.altKey, shift: e.shiftKey, meta: e.metaKey };
    if (!(hk.ctrl || hk.alt || hk.meta) && !/^F\d+$/.test(e.code)) return done({ type: 'need' });
    done({ type: 'key', hk });
  };
  addEventListener('keydown', f, true); return () => removeEventListener('keydown', f, true);
}

/* ====================================================================== mLINKS ====================================================================== */
const BRAND = '#38bdf8', ID = 'mLINKS';
const PALETTE = ['#38BDF8', '#34D399', '#FBBF24', '#F97316', '#F87171', '#F472B6', '#A78BFA', '#A3A3A3'];
let LIB = null, MISSING = new Set(), uidN = 100, imported = 0, hotOn = null, extraEl = null;
const uid = () => 'i' + (++uidN);
const isWeb = t => t.includes('://');
const kindOf = l => (isWeb(l.target) ? 'web' : /\.app$/.test(l.target) ? 'app' : /\/[^/.]+$/.test(l.target) || l.target.endsWith('/') ? 'folder' : 'file');
const host = t => { try { return new URL(t).host; } catch { return t; } };
const baseName = t => decodeURI(t.replace(/\/$/, '').split('/').pop());
const defaultName = t => (isWeb(t) ? host(t) : baseName(t).replace(/\.app$/, ''));
const DOCCOL = { pdf: '#e5484d', xlsx: '#2f9e5b', numbers: '#2f9e5b', txt: '#7a7f8a', md: '#5b7bd5', csv: '#2f9e5b', ini: '#7a7f8a' };

function mkLib() {
  const L = (name, target, o = {}) => ({ id: uid(), name, target, visible: true, hotkey: null, ...o });
  const dl = T('Téléchargements', 'Downloads'), ss = T('Captures d’écran', 'Screenshots');
  MISSING = new Set(['/Volumes/SKYRIM/Mods']);
  return { lang: T('fr', 'en'), dirty: false, groups: [
    { id: uid(), name: T('Applis', 'Apps'), color: '#38BDF8', links: [
      L('mORTEX', '/Applications/Skyrim Tools/mORTEX.app', { app: 'mORTEX', hotkey: hotFrom('KeyM', 'ca') }),
      L('sKYCRASH', '/Applications/Skyrim Tools/sKYCRASH.app', { app: 'sKYCRASH', hotkey: hotFrom('KeyS', 'ca') }),
      L('nEXUSWATCH', '/Applications/Skyrim Tools/nEXUSWATCH.app', { app: 'nEXUSWATCH' }),
      L('qNOTES', '/Applications/qNOTES.app', { app: 'qNOTES', hotkey: hotFrom('KeyN', 'ca') }),
      L('mBACKUP', '/Applications/mBACKUP.app', { app: 'mBACKUP' })] },
    { id: uid(), name: T('Dossiers', 'Folders'), color: '#34D399', links: [
      L(T('Projets', 'Projects'), '/Users/lea/Documents/' + T('Projets', 'Projects'), { hotkey: hotFrom('KeyP', 'ca') }),
      L(dl, '/Users/lea/Downloads'), L(ss, '/Users/lea/Pictures/' + ss), L('Mods Skyrim', '/Volumes/SKYRIM/Mods')] },
    { id: uid(), name: T('Fichiers', 'Files'), color: '#F97316', links: [
      L('Budget 2026.xlsx', '/Users/lea/Documents/Budget 2026.xlsx'), L(T('Ordre de chargement', 'Load order'), '/Users/lea/Documents/loadorder.txt'),
      L('Brouillon.md', '/Users/lea/Documents/Brouillon.md', { visible: false })] },
    { id: uid(), name: T('Sites web', 'Websites'), color: '#A78BFA', links: [
      L('GitHub', 'https://github.com', { hotkey: hotFrom('KeyG', 'ca') }), L('Nexus Mods', 'https://www.nexusmods.com/skyrimspecialedition'), L('YouTube Studio', 'https://studio.youtube.com')] }
  ] };
}
const lib = () => { if (!LIB || (!LIB.dirty && LIB.lang !== T('fr', 'en'))) LIB = mkLib(); return LIB; };
const touch = () => { lib().dirty = true; };
const allLinks = () => lib().groups.flatMap(g => g.links);
const findLink = id => { for (const g of lib().groups) { const i = g.links.findIndex(l => l.id === id); if (i >= 0) return { g, i, l: g.links[i] }; } return null; };
function moveLink(id, gid, beforeId) {
  const f = findLink(id), to = lib().groups.find(g => g.id === gid); if (!f || !to) return; f.g.links.splice(f.i, 1);
  let at = beforeId == null ? to.links.length : to.links.findIndex(l => l.id === beforeId); if (at < 0) at = to.links.length; to.links.splice(at, 0, f.l); touch();
}
function moveGroup(id, beforeId) {
  const gs = lib().groups, i = gs.findIndex(g => g.id === id); if (i < 0) return; const [g] = gs.splice(i, 1);
  let at = beforeId == null ? gs.length : gs.findIndex(x => x.id === beforeId); if (at < 0) at = gs.length; gs.splice(at, 0, g); touch();
}
const shift = (arr, i, d) => { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; touch(); };

/* icônes de liens */
function iconHtml(l) {
  if (isWeb(l.target)) return SVG.globe;
  if (MISSING.has(l.target)) return SVG.warn;
  if (l.app) return `<img src="${esc(appIcon(l.app))}" alt="">`;
  const k = kindOf(l);
  if (k === 'folder') return SVG.folder;
  if (k === 'app') return SVG.app(hue(l.name), l.name[0].toUpperCase());
  return SVG.doc(DOCCOL[(l.target.split('.').pop() || '').toLowerCase()] || '#7a7f8a');
}
const linkMarkN = (() => { let n = 0; return () => ++n; })();
/* motif de l'icône : deux maillons entrelacés, une seule teinte (même géométrie que LinkMark de l'appli) */
function linkMark() {
  const n = linkMarkN(), A = '<rect x="-63" y="-105" width="390" height="210" rx="105" fill="none" stroke="#fff" stroke-width="74"/>', B = '<rect x="-327" y="-105" width="390" height="210" rx="105" fill="none" stroke="#fff" stroke-width="74"/>';
  const gA = '<rect x="-63" y="-105" width="390" height="210" rx="105" fill="none" stroke="#000" stroke-width="118"/>', gB = '<rect x="-327" y="-105" width="390" height="210" rx="105" fill="none" stroke="#000" stroke-width="118"/>';
  return `<svg viewBox="-357 -357 715 715" aria-hidden="true"><defs>
    <mask id="mlk-a${n}" maskUnits="userSpaceOnUse" x="-700" y="-700" width="1400" height="1400"><rect x="-700" y="-700" width="1400" height="1400" fill="#fff"/><g clip-path="url(#mlk-t${n})">${gB}</g></mask>
    <mask id="mlk-b${n}" maskUnits="userSpaceOnUse" x="-700" y="-700" width="1400" height="1400"><rect x="-700" y="-700" width="1400" height="1400" fill="#fff"/><g clip-path="url(#mlk-u${n})">${gA}</g></mask>
    <clipPath id="mlk-t${n}"><rect x="-700" y="-700" width="1400" height="700"/></clipPath><clipPath id="mlk-u${n}"><rect x="-700" y="0" width="1400" height="700"/></clipPath></defs>
    <g transform="rotate(-45)"><g mask="url(#mlk-a${n})">${A.replace(/#fff/g, 'currentColor')}</g><g mask="url(#mlk-b${n})">${B.replace(/#fff/g, 'currentColor')}</g></g></svg>`;
}

/* ---------- ouvrir un lien (menu, raccourci, bouton) ---------- */
function openLink(l, o = {}) {
  const nm = l.name, ic = appIcon(ID);
  if (!isWeb(l.target) && MISSING.has(l.target)) {
    alertBox({ icon: ic, title: T(`Impossible d’ouvrir « ${nm} »`, `Cannot open “${nm}”`), text: T(`${l.target} n’existe pas ou son disque n’est pas branché.`, `${l.target} does not exist or its disk is not connected.`) }); return;
  }
  sfx.pop();
  if (isWeb(l.target)) return toast({ icon: ic, title: ID, body: T(`Adresse ouverte dans le navigateur : ${host(l.target)}`, `Address opened in the browser: ${host(l.target)}`) });
  if (o.reveal) return toast({ icon: ic, title: ID, body: T(`« ${nm} » affiché dans le Finder`, `“${nm}” shown in Finder`) });
  if (l.app && appById(l.app)) { toast({ icon: ic, title: ID, body: T(`Ouverture de « ${nm} »`, `Opening “${nm}”`) }); launch(l.app); return; }
  toast({ icon: ic, title: ID, body: T(`Ouverture de « ${nm} »`, `Opening “${nm}”`) });
}

/* ---------- menu de la barre des menus ---------- */
function menuItems(app) {
  const items = [], groups = lib().groups.filter(g => g.links.some(l => l.visible));
  const linkItems = g => g.links.filter(l => l.visible).map(l => {
    const miss = !isWeb(l.target) && MISSING.has(l.target);
    return { label: l.name, icon: iconHtml(l), disabled: miss, badge: l.hotkey ? hotLabel(l.hotkey) : null, alt: isWeb(l.target) ? null : T(`Afficher « ${l.name} » dans le Finder`, `Show “${l.name}” in Finder`),
      fn: o => openLink(l, { reveal: !!(o && o.alt) }) };
  });
  if (!groups.length) items.push({ label: T('Aucun lien', 'No links'), disabled: true });
  else if (groups.length === 1) items.push(...linkItems(groups[0]));
  else groups.forEach(g => items.push({ label: g.name, color: g.color || null, sub: linkItems(g) }));
  items.push({ sep: 1 }, { label: T('Rechercher les mises à jour…', 'Check for updates…'), fn: () => toast({ icon: appIcon(ID), title: ID, body: T('mLINKS est à jour (version 1.1.1).', 'mLINKS is up to date (version 1.1.1).') }) },
    { label: T('Gérer les liens…', 'Manage links…'), color: 'var(--mlk-act,#d97706)', fn: () => openManager(app) },
    { label: T('À propos de mLINKS', 'About mLINKS'), fn: () => about(app) }, { label: T('Quitter mLINKS', 'Quit mLINKS'), fn: () => quit() });
  return items;
}
const about = app => aboutWin(app, { brandColor: BRAND, tagline: () => T('Vos applications, dossiers, fichiers et adresses web à portée de clic, depuis la barre des menus ou par un raccourci clavier.', 'Your apps, folders, files and web addresses one click away, from the menu bar or with a keyboard shortcut.'),
  credit: () => T('Inspiré de QuickLinks d’Appyogi, sans lien avec ses auteurs.', 'Inspired by QuickLinks from Appyogi, not affiliated with its authors.') });

function quit() {
  closeMenus(); [...wm.wins.values()].filter(w => w.appId === ID).forEach(w => wm.close(w.id));
  hotOn && removeEventListener('keydown', hotOn, true); hotOn = null; extraEl = null; S.extras.delete(ID); emit('extras'); sfx.close();
}
function install(app) {
  extraEl = h('button', { class: 'mb extra mlk-xicon', 'aria-label': ID, html: SVG.link });
  extraEl.onclick = () => { if (menuOpenFor(extraEl)) closeMenus(); else { sfx.click(); macMenu(extraEl, menuItems(app)); } };
  S.extras.set(ID, { el: extraEl, quit }); emit('extras'); sfx.open();
  /* raccourcis globaux : chaque lien qui en a un s'ouvre sans passer par le menu */
  hotOn = e => {
    if (e.repeat || ui.rec || !(e.ctrlKey || e.altKey || e.metaKey || /^F\d+$/.test(e.code))) return;
    const l = allLinks().find(x => hotMatch(e, x.hotkey)); if (!l) return;
    e.preventDefault(); e.stopPropagation(); openLink(l);
  };
  addEventListener('keydown', hotOn, true);
  toast({ icon: appIcon(ID), title: ID, body: T('L’appli est dans la barre des menus. Cliquez sur son icône, ou essayez ⌃⌥M.', 'The app is in the menu bar. Click its icon, or try ⌃⌥M.') });
  setTimeout(() => { const el = extraEl; if (el && el.isConnected && !MENU && !$('.mlkx-scrim')) { sfx.click(); macMenu(el, menuItems(app)); } }, 900);
}

export async function open(app) {
  await cssReady();
  if (S.extras.has(ID)) return openManager(app);
  lib(); install(app);
}

/* ====================================================================== fenêtre de gestion ====================================================================== */
const ui = { gid: null, lid: null, ren: null, notice: null, rec: false, recMsg: null, login: false, auto: true };
let dragging = null;

function openManager(app) {
  const A = { ...app, accent: BRAND };
  return wm.open({ id: 'app:' + ID, appId: ID, title: ID, w: 1040, h: 640, minw: 900, minh: 520, bare: true, cls: 'socle mlkx-win',
    onclose: w => { w.dead = true; w.stop && w.stop(); ui.rec = false; ui.ren = null; },
    build: w => {
      if (!lib().groups.some(g => g.id === ui.gid)) ui.gid = lib().groups[0] ? lib().groups[0].id : null;
      w.render = () => { w.stop && w.stop(); ui.rec = false; ui.ren = null; w.body.innerHTML = ''; w.body.append(ui_(w, A)); };
      return ui_(w, A);
    } });
}

function ui_(w, A) {
  const root = h('div', { class: 'mlkx-root mlk' });
  const side = h('aside', { class: 'mlk-side' }), main = h('main', { class: 'mlk-main' }), det = h('aside', { class: 'mlk-det' }), cols = h('div', { class: 'mlk-cols' }, side, main, det);
  const groupsEl = h('div', { class: 'mlk-groups', role: 'listbox', 'aria-label': T('Groupes', 'Groups') });
  let listEl = null, stopRec = null, suppress = false, flashId = null;
  const grp = () => lib().groups.find(g => g.id === ui.gid) || lib().groups[0] || null;
  const link = () => (ui.lid ? findLink(ui.lid) : null);
  const say = (text, bad) => { ui.notice = text ? { text, bad: !!bad } : null; drawMain(); };
  const popClose = () => { const p = root.querySelector('.mlk-pop'); p && p.remove(); removeEventListener('pointerdown', popAway, true); removeEventListener('keydown', popKey, true); };
  const popAway = e => { const p = root.querySelector('.mlk-pop'); if (p && !p.contains(e.target) && !e.target.closest('[data-pop]')) popClose(); };
  const popKey = e => { if (e.key === 'Escape') { e.stopPropagation(); popClose(); } };
  const popOpen = (anchor, node, o = {}) => {
    popClose(); const p = h('div', { class: 'mlk-pop', role: 'dialog' }, node); root.append(p);
    const rr = root.getBoundingClientRect(), ar = anchor.getBoundingClientRect(), pw = p.offsetWidth, ph = p.offsetHeight;
    let x = (ar.left - rr.left) / S.scale, y = (ar.bottom - rr.top) / S.scale + 6;
    if (o.up) y = (ar.top - rr.top) / S.scale - ph - 6;
    p.style.left = clamp(x, 8, root.clientWidth - pw - 8) + 'px'; p.style.top = clamp(y, 8, root.clientHeight - ph - 8) + 'px';
    setTimeout(() => addEventListener('pointerdown', popAway, true), 0); addEventListener('keydown', popKey, true); return p;
  };
  let dragOff = null; w.stop = () => { stopRec && stopRec(); popClose(); dragOff && dragOff(); dragOff = null; };

  /* ----- en-tête ----- */
  const webBtn = h('button', { class: 'mlkx-btn', 'data-pop': '', onclick: () => webPopover(webBtn) }, T('Adresse web…', 'Web address…'));
  const addBtn = h('button', { class: 'mlkx-btn act', onclick: () => picker({ multi: true }) }, T('Ajouter des liens…', 'Add links…'));
  root.append(bar(A, w, h('div', { class: 'mlk-acts' }, webBtn, addBtn)), cols);

  /* ----- sélecteur de fichiers simulé (NSOpenPanel) ----- */
  const FILES = [
    ['Safari.app', '/Applications/Safari.app', 'app'], ['Terminal.app', '/Applications/Utilities/Terminal.app', 'app'], ['Blender.app', '/Applications/Blender.app', 'app'], ['DaVinci Resolve.app', '/Applications/DaVinci Resolve/DaVinci Resolve.app', 'app'],
    [T('Archives', 'Archives'), '/Users/lea/Documents/Archives', 'folder'], [T('Bureau', 'Desktop'), '/Users/lea/Desktop', 'folder'], [T('Musique', 'Music'), '/Users/lea/Music', 'folder'], ['Photos', '/Volumes/NAS/Photos', 'folder'],
    ['Contrat.pdf', '/Users/lea/Documents/Contrat.pdf', 'file'], ['Planning.numbers', '/Users/lea/Documents/Planning.numbers', 'file'], ['config.ini', '/Users/lea/Documents/config.ini', 'file']];
  function picker({ multi, csv, retarget }) {
    const list = csv ? [['export-quicklinks.csv', '/Users/lea/Documents/export-quicklinks.csv', 'file'], [T('liste-de-courses.csv', 'shopping-list.csv'), '/Users/lea/Documents/liste-de-courses.csv', 'file']] : FILES;
    const sel = new Set(), btn = h('button', { class: 'mlkx-btn pri', disabled: true }, T('Ouvrir', 'Open'));
    const lst = h('div', { class: 'mlk-lst', role: 'listbox' });
    const ic = it => (it[2] === 'folder' ? SVG.folder : it[2] === 'app' ? SVG.app(hue(it[0]), it[0][0]) : SVG.doc(DOCCOL[it[0].split('.').pop()] || '#7a7f8a'));
    const paint = () => { lst.innerHTML = ''; list.forEach((it, i) => lst.append(h('button', { class: 'mlk-it' + (sel.has(i) ? ' on' : ''), role: 'option', 'aria-selected': String(sel.has(i)), onclick: () => { if (multi) sel.has(i) ? sel.delete(i) : sel.add(i); else { sel.clear(); sel.add(i); } sfx.tick(); paint(); }, ondblclick: () => { if (!multi) { sel.clear(); sel.add(i); done(); } } },
      h('span', { class: 'mlk-ic', html: ic(it) }), h('span', { class: 'mlk-tx' }, h('span', { class: 'mlk-nm' }, it[0]), h('span', { class: 'mlk-tg' }, it[1]))))); btn.disabled = !sel.size; };
    const scrim = h('div', { class: 'mlkx-scrim' }), cancel = h('button', { class: 'mlkx-btn', onclick: () => close() }, T('Annuler', 'Cancel'));
    const close = () => { scrim.remove(); root.removeEventListener('keydown', kd, true); }, kd = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    const done = () => { const picks = [...sel].map(i => list[i]); close(); if (csv) return runImport(picks[0][0].includes('quicklinks')); if (retarget) return retargetTo(picks[0]); addLinks(picks); };
    btn.onclick = done; paint();
    scrim.append(h('div', { class: 'mlk-pick', role: 'dialog', 'aria-label': T('Choisir', 'Choose') },
      h('header', {}, h('h3', { class: 'mlkx-heading' }, csv ? T('Choisir un export QuickLinks', 'Choose a QuickLinks export') : T('Choisir des applications, dossiers ou fichiers', 'Choose apps, folders or files')), h('p', { class: 'mlkx-meta', style: { marginTop: '4px' } }, T('Aucun fichier n’est modifié.', 'No file is changed.'))),
      lst, h('footer', {}, cancel, btn)));
    root.addEventListener('keydown', kd, true); root.append(scrim); btn.setAttribute('tabindex', '0'); cancel.focus({ preventScroll: true });
  }
  function addLinks(picks) {
    const g = grp(); let first = null;
    if (!lib().groups.length) { const ng = { id: uid(), name: T('Général', 'General'), color: null, links: [] }; lib().groups.push(ng); ui.gid = ng.id; }
    const tg = grp();
    picks.forEach(([nm, target, k]) => {
      if (tg.links.some(l => l.target === target)) return;
      const l = { id: uid(), name: defaultName(target), target, visible: true, hotkey: null }; if (k === 'app') l.name = nm.replace(/\.app$/, ''); tg.links.push(l); first = first || l;
    });
    touch(); if (first) { flashId = first.id; sfx.pop(); } drawGroups(); drawMain(); void g;
  }
  function retargetTo(it) { const f = link(); if (!f) return; MISSING.delete(f.l.target); f.l.target = it[1]; f.l.app = null; MISSING.delete(it[1]); touch(); sfx.pop(); drawMain(); drawDet(); }

  /* ----- import QuickLinks ----- */
  function runImport(ok) {
    if (!ok) { sfx.tick(); return say(T('Ce fichier n’est pas un export QuickLinks. Exportez vos liens depuis QuickLinks, puis réessayez.', 'This file is not a QuickLinks export. Export your links from QuickLinks, then try again.'), true); }
    const spec = [[T('Bureau', 'Work'), '#38BDF8', [['Figma', '/Applications/Figma.app', 'app', null], ['Slack', '/Applications/Slack.app', 'app', null], [T('Factures', 'Invoices'), '/Users/lea/Documents/Factures', 'folder', hotFrom('KeyG', 'ca')], ['Notion', 'https://www.notion.so', 'web', null]]],
      [T('Maison', 'Home'), '#F472B6', [[T('Recettes', 'Recipes'), '/Users/lea/Documents/Recettes', 'folder', null], [T('Météo', 'Weather'), 'https://meteo.example.com', 'web', hotFrom('KeyS', 'ca')]]]];
    let added = 0, groups = 0, present = 0, dropped = 0;
    spec.forEach(([gn, col, ls]) => {
      let g = lib().groups.find(x => x.name === gn); if (!g) { g = { id: uid(), name: gn, color: col, links: [] }; lib().groups.push(g); groups++; }
      ls.forEach(([nm, target, k, hk]) => {
        if (allLinks().some(l => l.target === target)) { present++; return; }
        const l = { id: uid(), name: nm, target, visible: true, hotkey: null }; if (hk && allLinks().some(x => hotMatch({ code: hk.code, ctrlKey: hk.ctrl, altKey: hk.alt, shiftKey: hk.shift, metaKey: hk.meta }, x.hotkey))) dropped++; else l.hotkey = hk;
        g.links.push(l); added++;
      });
    });
    touch(); if (!ui.gid) ui.gid = lib().groups[0].id; sfx.done();
    let txt = T(`Import terminé : ${added} liens ajoutés, ${groups} groupes créés, ${present} déjà présents. QuickLinks n’a pas été modifié.`, `Import finished: ${added} links added, ${groups} groups created, ${present} already present. QuickLinks was not changed.`);
    if (dropped) txt += ' ' + T(`${dropped} raccourcis déjà utilisés n’ont pas été repris.`, `${dropped} shortcuts already in use were not kept.`);
    drawGroups(); say(txt, false);
  }

  /* ----- popovers ----- */
  function webPopover(anchor) {
    const f = h('input', { class: 'mlkx-field', type: 'text', placeholder: 'https://…', 'aria-label': T('Adresse', 'Address'), style: { width: '320px' }, spellcheck: 'false', autocomplete: 'off' });
    const ok = h('button', { class: 'mlkx-btn pri', disabled: true, onclick: () => go() }, T('Ajouter', 'Add')); ok.style.alignSelf = 'flex-start';
    const go = () => { if (!isWeb(f.value.trim())) return; addLinks([[defaultName(f.value.trim()), f.value.trim(), 'web']]); popClose(); };
    f.addEventListener('input', () => { ok.disabled = !isWeb(f.value.trim()); }); f.addEventListener('keydown', e => { if (e.key === 'Enter') go(); if (e.key === 'Escape') { popClose(); anchor.focus({ preventScroll: true }); } });
    popOpen(anchor, h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px' } }, h('h4', { class: 'mlkx-title' }, T('Ajouter une adresse web', 'Add a web address')), f, ok));
    f.focus({ preventScroll: true });
  }
  function colorPopover(anchor, g) {
    const set = c => { g.color = c; touch(); popClose(); sfx.tick(); drawGroups(); drawMain(); };
    const pal = h('div', { class: 'mlk-pal' }, PALETTE.map(c => h('button', { class: g.color && g.color.toUpperCase() === c ? 'on' : '', 'aria-label': c, onclick: () => set(c) }, h('i', { style: { background: c } }))));
    popOpen(anchor, h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } }, h('b', { style: { color: 'var(--ts)', fontWeight: '500' } }, T('Couleur dans le menu', 'Color in the menu')), pal,
      h('button', { class: 'mlkx-btn sm', style: { alignSelf: 'flex-start' }, disabled: !g.color, onclick: () => set(null) }, T('Aucune couleur', 'No color'))));
  }

  /* ----- groupes ----- */
  function addGroup() {
    const g = { id: uid(), name: T('Nouveau groupe', 'New group'), color: null, links: [] }; lib().groups.push(g); touch(); ui.gid = g.id; ui.lid = null; ui.ren = g.id; sfx.pop(); drawAll();
  }
  function delGroup(g) {
    const doIt = () => { const gs = lib().groups, i = gs.indexOf(g); gs.splice(i, 1); touch(); ui.lid = null; ui.gid = (gs[Math.min(i, gs.length - 1)] || {}).id || null; sfx.close(); drawAll(); };
    if (!g.links.length) return doIt();
    sheet(root, { html: true, title: T(`Supprimer le groupe « ${g.name} » ?`, `Delete the group “${g.name}”?`), text: bhtml(T(`Les ${g.links.length} liens de ce groupe seront retirés de mLINKS. Aucun fichier n’est modifié.`, `The ${g.links.length} links in this group will be removed from mLINKS. No file is changed.`), 'mLINKS', BRAND),
      buttons: [{ label: T('Annuler', 'Cancel') }, { label: T('Supprimer', 'Delete'), kind: 'tdg', fn: doIt }] });
  }
  const gMenu = (e, g, i) => { e.preventDefault(); const gs = lib().groups;
    macMenu({ x: e.clientX, y: e.clientY }, [{ label: T('Monter', 'Move up'), disabled: i === 0, fn: () => { shift(gs, i, -1); drawGroups(); } }, { label: T('Descendre', 'Move down'), disabled: i === gs.length - 1, fn: () => { shift(gs, i, 1); drawGroups(); } },
      { label: T('Renommer', 'Rename'), fn: () => { ui.ren = g.id; drawGroups(); } }, { label: T('Supprimer', 'Delete'), danger: 1, fn: () => delGroup(g) }]); };
  function ordBtns(canUp, canDown, fn) {
    return h('span', { class: 'mlk-ord' }, h('button', { disabled: !canUp, 'aria-label': T('Monter', 'Move up'), title: T('Monter', 'Move up'), html: SVG.up, onclick: e => { e.stopPropagation(); fn(-1); } }),
      h('button', { disabled: !canDown, 'aria-label': T('Descendre', 'Move down'), title: T('Descendre', 'Move down'), html: SVG.down, onclick: e => { e.stopPropagation(); fn(1); } }));
  }
  function gRow(g, i, gs) {
    const on = g.id === ui.gid, el = h('div', { class: 'mlk-g' + (on ? ' on' : ''), role: 'option', 'aria-selected': String(on), tabindex: '0', 'data-gid': g.id });
    if (ui.ren === g.id) {
      const inp = h('input', { type: 'text', value: g.name, 'aria-label': T('Renommer', 'Rename'), spellcheck: 'false' });
      const commit = () => { if (ui.ren !== g.id) return; ui.ren = null; const v = inp.value.trim(); if (v) { g.name = v; touch(); } drawAll(); };
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { inp.value = g.name; commit(); } e.stopPropagation(); });
      inp.addEventListener('blur', commit); el.append(inp); setTimeout(() => { if (inp.isConnected) { inp.focus({ preventScroll: true }); inp.select(); } }, 20);
    } else {
      el.append(g.color ? h('i', { class: 'mlk-dotc', style: { background: g.color } }) : null, h('span', { class: 'mlk-nm' }, g.name), ordBtns(i > 0, i < gs.length - 1, d => { shift(gs, i, d); drawGroups(); }), h('span', { class: 'mlk-cnt' }, String(g.links.length)));
      el.addEventListener('click', () => { if (suppress) return; if (ui.gid !== g.id) { ui.gid = g.id; ui.lid = null; ui.notice = null; sfx.tick(); drawAll(); } });
      el.addEventListener('dblclick', () => { ui.ren = g.id; drawGroups(); }); el.addEventListener('contextmenu', e => gMenu(e, g, i));
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } });
      el.addEventListener('pointerdown', e => { if (!e.target.closest('button')) startDrag(e, { kind: 'group', id: g.id }, g.name); });
    }
    return el;
  }
  function drawGroups() {
    const keep = groupsEl.scrollTop; groupsEl.innerHTML = ''; const gs = lib().groups; gs.forEach((g, i) => groupsEl.append(gRow(g, i, gs))); groupsEl.scrollTop = keep;
  }

  /* ----- colonne centrale ----- */
  function lRow(l, i, ls) {
    const miss = !isWeb(l.target) && MISSING.has(l.target), on = l.id === ui.lid;
    const el = h('div', { class: 'mlk-row' + (on ? ' on' : '') + (flashId === l.id ? ' flash' : ''), role: 'option', 'aria-selected': String(on), tabindex: '0', 'data-id': l.id },
      h('span', { class: 'mlk-ic', html: iconHtml(l) }), h('span', { class: 'mlk-tx' }, h('span', { class: 'mlk-nm' }, l.name || ' '), h('span', { class: 'mlk-tg', title: l.target }, h('bdi', {}, l.target))),
      ordBtns(i > 0, i < ls.length - 1, d => { shift(ls, i, d); drawMain(); }),
      miss ? h('span', { class: 'mlk-st wn' }, T('Introuvable', 'Not found')) : null, !l.visible ? h('span', { class: 'mlk-st' }, T('Masqué', 'Hidden')) : null, l.hotkey ? h('span', { class: 'mlkx-chip' }, hotLabel(l.hotkey)) : null);
    el.addEventListener('click', () => { if (suppress) return; if (ui.lid !== l.id) { ui.lid = l.id; ui.rec = false; ui.recMsg = null; stopRec && stopRec(); sfx.tick(); drawMain(); drawDet(); } });
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } });
    el.addEventListener('pointerdown', e => { if (!e.target.closest('button')) startDrag(e, { kind: 'link', id: l.id }, l.name); });
    el.addEventListener('contextmenu', e => { e.preventDefault(); const g = grp(), others = lib().groups.filter(x => x !== g);
      macMenu({ x: e.clientX, y: e.clientY }, [{ label: T('Monter', 'Move up'), disabled: i === 0, fn: () => { shift(ls, i, -1); drawMain(); } }, { label: T('Descendre', 'Move down'), disabled: i === ls.length - 1, fn: () => { shift(ls, i, 1); drawMain(); } },
        ...(others.length ? [{ label: T('Déplacer vers', 'Move to'), sub: others.map(o => ({ label: o.name, fn: () => { moveLink(l.id, o.id, null); if (ui.lid === l.id) ui.lid = null; drawAll(); } })) }] : [])]); });
    return el;
  }
  function drawMain() {
    const keep = listEl ? listEl.scrollTop : 0; main.innerHTML = ''; const g = grp();
    if (!lib().groups.length) {
      main.append(h('div', { class: 'mlk-welcome' }, h('div', { class: 'mlk-mk', html: linkMark() }), h('h3', { class: 'mlkx-heading' }, T('Aucun lien pour l’instant', 'No links yet')),
        h('p', {}, T('Ajoutez vos applications, dossiers et fichiers, ou reprenez vos liens QuickLinks. QuickLinks n’est pas modifié.', 'Add your apps, folders and files, or bring in your QuickLinks. QuickLinks is not changed.')),
        h('button', { class: 'mlkx-btn pri', onclick: () => runImport(true) }, T('Importer depuis QuickLinks', 'Import from QuickLinks'))));
      return cols.classList.add('nodet');
    }
    if (ui.notice) main.append(h('div', { class: 'mlk-notice', role: 'status' }, h('span', { style: { color: ui.notice.bad ? 'var(--dg)' : 'var(--ok)' }, html: ui.notice.bad ? SVG.warn.replace(/#fbbf24/g, 'currentColor') : SVG.check, class: 'mlk-ic' }), h('p', {}, ui.notice.text),
      h('button', { 'aria-label': T('Fermer', 'Close'), html: SVG.x, onclick: () => say(null) })));
    const cb = h('button', { class: 'mlk-colorbtn', 'data-pop': '', 'aria-label': T('Couleur dans le menu', 'Color in the menu'), title: T('Couleur dans le menu', 'Color in the menu'), onclick: () => colorPopover(cb, g) }, h('i', { class: g.color ? 'has' : '', style: g.color ? { background: g.color } : null }));
    main.append(h('div', { class: 'mlk-mh' }, h('h3', { class: 'mlkx-heading' }, g.name), cb, h('span', { class: 'mlk-cnt' }, T(`${g.links.length} liens`, `${g.links.length} links`))));
    listEl = h('div', { class: 'mlk-list', role: 'listbox', 'aria-label': g.name });
    if (!g.links.length) listEl.append(h('div', { class: 'mlk-empty' }, T('Glissez ici des fichiers, des dossiers ou des applications.', 'Drag files, folders or apps here.')));
    g.links.forEach((l, i) => listEl.append(lRow(l, i, g.links)));
    main.append(listEl); listEl.scrollTop = keep; cols.classList.toggle('nodet', !link());
    if (flashId) { const id = flashId; flashId = null; const r = listEl.querySelector(`[data-id="${id}"]`); if (r) { const t = r.offsetTop; if (t > listEl.scrollTop + listEl.clientHeight - 40) listEl.scrollTop = t - 40; } }
  }

  /* ----- détail ----- */
  function drawDet() {
    const f = link(); det.innerHTML = ''; det.hidden = !f; cols.classList.toggle('nodet', !f); if (!f) return;
    const l = f.l, web = isWeb(l.target), miss = !web && MISSING.has(l.target), field = (lab, ...kids) => h('div', { class: 'mlk-f' }, h('div', { class: 'mlkx-eyebrow' }, lab), ...kids);
    const name = h('input', { class: 'mlkx-field', type: 'text', value: l.name, spellcheck: 'false', 'aria-label': T('Nom', 'Name') });
    name.addEventListener('input', () => { l.name = name.value; touch(); drawMain(); });
    det.append(field(T('Nom', 'Name'), name),
      field(web ? T('Adresse', 'Address') : T('Cible', 'Target'), h('div', { class: 'mlkx-mono mlk-tgv' }, l.target),
        miss ? h('div', { class: 'mlk-hint wn' }, T('Cette cible est introuvable. Vérifiez que son disque est branché.', 'This target cannot be found. Check that its disk is connected.')) : null,
        web ? null : h('button', { class: 'mlkx-btn', style: { alignSelf: 'flex-start' }, onclick: () => picker({ retarget: true }) }, T('Choisir une autre cible…', 'Choose another target…'))),
      field(T('Raccourci clavier', 'Keyboard shortcut'), recorder(l)),
      h('button', { class: 'mlkx-chk', role: 'checkbox', 'aria-checked': String(l.visible), onclick: e => { l.visible = !l.visible; touch(); e.currentTarget.setAttribute('aria-checked', String(l.visible)); sfx.tick(); drawMain(); } }, h('i', { html: SVG.check }), h('span', {}, T('Afficher dans le menu', 'Show in the menu'))),
      h('div', { class: 'mlk-btns' }, h('button', { class: 'mlkx-btn', onclick: () => openLink(l) }, T('Ouvrir', 'Open')), web ? null : h('button', { class: 'mlkx-btn', onclick: () => openLink(l, { reveal: true }) }, T('Afficher dans le Finder', 'Show in Finder'))),
      h('div', { class: 'mlk-btns' }, h('button', { class: 'mlkx-btn', onclick: () => { f.g.links.splice(f.i, 1); touch(); ui.lid = null; sfx.close(); drawAll(); } }, T('Supprimer ce lien', 'Delete this link'))));
  }
  function recorder(l) {
    const box = h('div', { class: 'mlk-f', style: { gap: '6px' } }); const msg = h('div', { class: 'mlk-hint' });
    const paint = () => {
      box.innerHTML = '';
      const b = h('button', { class: 'mlkx-btn' + (ui.rec ? ' mlk-recon' : ''), onclick: () => (ui.rec ? stop() : start()) }, ui.rec ? T('Saisie en cours…', 'Listening…') : l.hotkey ? hotLabel(l.hotkey) : T('Définir un raccourci', 'Set a shortcut'));
      b.style.alignSelf = 'flex-start';
      const row = h('div', { class: 'mlk-rec' }, b, l.hotkey && !ui.rec ? h('button', { class: 'mlkx-btn ter', onclick: () => { l.hotkey = null; touch(); ui.recMsg = null; sfx.tick(); drawMain(); drawDet(); } }, T('Effacer', 'Clear')) : null);
      box.append(row);
      if (ui.recMsg) box.append(h('div', { class: 'mlk-hint dg' }, ui.recMsg)); else if (ui.rec) box.append(h('div', { class: 'mlk-hint' }, T('Tapez le raccourci. Échap pour annuler.', 'Type the shortcut. Press Esc to cancel.')));
    };
    function stop() { stopRec && stopRec(); stopRec = null; ui.rec = false; paint(); }
    function start() {
      ui.rec = true; ui.recMsg = null; paint(); sfx.tick();
      stopRec = recordHotkey(r => {
        if (r.type === 'cancel') return stop();
        if (r.type === 'clear') { l.hotkey = null; touch(); ui.recMsg = null; stop(); drawMain(); return drawDet(); }
        if (r.type === 'need') { ui.recMsg = T('Ajoutez ⌘, ⌥ ou ⌃ à la touche.', 'Add ⌘, ⌥ or ⌃ to the key.'); return paint(); }
        const own = allLinks().find(x => x.id !== l.id && hotMatch({ code: r.hk.code, ctrlKey: r.hk.ctrl, altKey: r.hk.alt, shiftKey: r.hk.shift, metaKey: r.hk.meta }, x.hotkey));
        if (own) { ui.recMsg = T(`Ce raccourci est déjà utilisé par « ${own.name} ».`, `This shortcut is already used by “${own.name}”.`); return paint(); }
        l.hotkey = r.hk; touch(); ui.recMsg = null; sfx.pop(); stop(); drawMain();
      });
    }
    paint(); void msg; return box;
  }

  /* ----- glisser-déposer : réordonner, déplacer vers un autre groupe ----- */
  function startDrag(e, tok, label) {
    if (e.button !== 0) return; const sx = e.clientX, sy = e.clientY; let on = false, ghost = null, hit = null, src = null;
    const clear = () => root.querySelectorAll('.drop-t,.drop-b,.drop-in,.drop-end').forEach(n => n.classList.remove('drop-t', 'drop-b', 'drop-in', 'drop-end'));
    const locate = ev => {
      const el = document.elementFromPoint(ev.clientX, ev.clientY); if (!el) return null;
      const row = el.closest('.mlk-row'), g = el.closest('.mlk-g');
      if (tok.kind === 'link') {
        if (g && g.dataset.gid !== ui.gid) return { t: 'in', el: g, gid: g.dataset.gid };
        if (row && row.dataset.id !== tok.id) { const r = row.getBoundingClientRect(); return { t: 'pos', el: row, id: row.dataset.id, below: ev.clientY > r.top + r.height / 2 }; }
        if (el.closest('.mlk-list') && !row) return { t: 'end', el: listEl };
      } else if (g && g.dataset.gid !== tok.id) { const r = g.getBoundingClientRect(); return { t: 'gpos', el: g, id: g.dataset.gid, below: ev.clientY > r.top + r.height / 2 }; }
      else if (el.closest('.mlk-groups') && !g) return { t: 'gend', el: groupsEl };
      return null;
    };
    const show = d => { if (!d) return; if (d.t === 'in') d.el.classList.add('drop-in'); else if (d.t === 'end') d.el.classList.add('drop-end'); else if (d.t === 'gend') { const l = groupsEl.lastElementChild; l && l.classList.add('drop-b'); } else d.el.classList.add(d.below ? 'drop-b' : 'drop-t'); };
    const mv = ev => {
      if (!on) { if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return; on = true; ghost = h('div', { class: 'mlk-ghost' }, label); root.append(ghost); sfx.tick();
        src = root.querySelector(tok.kind === 'link' ? `.mlk-row[data-id="${tok.id}"]` : `.mlk-g[data-gid="${tok.id}"]`); src && src.classList.add('dragging'); dragging = tok; }
      const r = root.getBoundingClientRect(); ghost.style.left = ((ev.clientX - r.left) / S.scale + 14) + 'px'; ghost.style.top = ((ev.clientY - r.top) / S.scale + 6) + 'px';
      clear(); hit = locate(ev); show(hit);
    };
    const up = () => {
      removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); if (!on) return;
      ghost.remove(); clear(); dragging = null; suppress = true; setTimeout(() => { suppress = false; }, 0);
      if (!hit) { src && src.classList.remove('dragging'); return; }
      const g = grp(), ls = g ? g.links : [];
      if (tok.kind === 'link') {
        if (hit.t === 'in') { moveLink(tok.id, hit.gid, null); if (ui.lid === tok.id) ui.lid = null; }
        else if (hit.t === 'end') moveLink(tok.id, g.id, null);
        else { const i = ls.findIndex(x => x.id === hit.id), before = hit.below ? (ls[i + 1] ? ls[i + 1].id : null) : hit.id; if (before !== tok.id) moveLink(tok.id, g.id, before); }
        const f2 = findLink(tok.id); flashId = f2 && f2.g === g ? tok.id : null;
      } else { const gs = lib().groups, i = gs.findIndex(x => x.id === hit.id), before = hit.t === 'gend' ? null : hit.below ? (gs[i + 1] ? gs[i + 1].id : null) : hit.id; moveGroup(tok.id, before); }
      sfx.pop(); drawAll();
    };
    addEventListener('pointermove', mv); addEventListener('pointerup', up); addEventListener('pointercancel', up);
    dragOff = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); };
  }

  /* ----- colonne de gauche : groupes, import, réglages ----- */
  const imp = h('button', { class: 'mlkx-btn', 'data-pop': '', onclick: () => macMenu(imp, [{ label: T('Importer depuis QuickLinks', 'Import from QuickLinks'), fn: () => runImport(true) }, { label: T('Depuis un export .CSV…', 'From a .CSV export…'), fn: () => picker({ csv: true }) }], { align: 'left' }) }, T('Importer', 'Import'), h('span', { html: SVG.down, style: { width: '10px', height: '10px', display: 'block', opacity: '.7' } }));
  const chk = (label, key) => h('button', { class: 'mlkx-chk', role: 'checkbox', 'aria-checked': String(ui[key]), onclick: e => { ui[key] = !ui[key]; e.currentTarget.setAttribute('aria-checked', String(ui[key])); sfx.tick(); } }, h('i', { html: SVG.check }), h('span', {}, label));
  side.append(h('div', { class: 'mlk-wm', html: linkMark() }),
    h('div', { class: 'mlk-sh' }, h('span', { class: 'mlkx-eyebrow' }, T('Groupes', 'Groups')), h('button', { class: 'mlk-plus', 'aria-label': T('Ajouter un groupe', 'Add a group'), title: T('Ajouter un groupe', 'Add a group'), html: SVG.plus, onclick: addGroup })),
    groupsEl, h('div', { class: 'mlk-gfoot' }, imp, chk(T('Lancer à l’ouverture de session', 'Launch at login'), 'login'), chk(T('Mises à jour automatiques', 'Automatic updates'), 'auto')));
  const drawAll = () => { drawGroups(); drawMain(); drawDet(); };
  drawAll();
  return root;
}
