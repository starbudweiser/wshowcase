/* Réplique interactive de mDESK : l'icône de la barre des menus ouvre le vrai menu de l'appli (en-têtes, sous-menus Applications / Arrangements / Restauration automatique,
   variante ⌥). Mémoriser et restaurer agissent pour de bon sur les icônes du Bureau et les fenêtres de ce faux Mac. Un petit simulateur d'écrans (hors appli) permet de voir
   la restauration automatique quand la combinaison d'écrans change.
   Ce fichier porte aussi les briques communes à mSPACES et mCLEAN : menu macOS (NSMenu), alerte (NSAlert), fenêtre « À propos », mémoire des aides. */
import { S, h, brand, $, clamp, sfx, toast, icon, wm, T, css } from './kit.js';
import { emit, on } from '../core.js';
import { store } from '../util.js';
import { lang } from '../i18n.js';
import { renderDesk } from '../spaces.js';

const CSS = 'css/demos/mDESK.css';

/* ======================================================================== */
/*  Briques communes                                                        */
/* ======================================================================== */

const sv = d => `<svg viewBox="0 0 16 16" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${d}</g></svg>`;
/** Équivalents des symboles SF utilisés par les menus. */
export const SF = {
  save: sv('<path d="M8 2v7M5.2 6.4 8 9.2l2.8-2.8M3 9.5v2.7c0 .8.6 1.3 1.3 1.3h7.4c.7 0 1.3-.5 1.3-1.3V9.5"/>'),
  restore: sv('<path d="M3.2 8a4.8 4.8 0 1 0 1.5-3.5M3 2.6v2.3h2.3"/>'),
  eye: sv('<path d="M1.5 8S3.8 3.8 8 3.8 14.5 8 14.5 8 12.2 12.2 8 12.2 1.5 8 1.5 8Z"/><circle cx="8" cy="8" r="1.9"/>'),
  eyeOff: sv('<path d="M2.2 4.2C1.8 5 1.5 5.6 1.5 8c0 0 2.3 4.2 6.5 4.2 1.1 0 2-.3 2.8-.7M6.2 3.9c.6-.1 1.2-.2 1.8-.2C12.2 3.7 14.5 8 14.5 8s-.5.9-1.4 1.8M2 2l12 12"/>'),
  windows: sv('<rect x="1.8" y="3.4" width="9" height="7" rx="1.3"/><path d="M5 12.4h7.4c.8 0 1.3-.5 1.3-1.3V6.4"/>')
};

/* ---------- menu macOS (NSMenu) ---------- */
let live = null;
export const closeMacMenu = () => live && live.close();
export const macMenuOpen = anchor => !!live && live.anchor === anchor;
/**
 * Ouvre un menu sous `anchor`. Éléments : { l, k, icon, check, dis, info, tip, sub:[…], fn, alt:{…} } | { sep:1 } | { head:'…' }.
 * `alt` remplace l'élément tant que la touche ⌥ est enfoncée ; `sub` ouvre un sous-menu au survol.
 */
export function macMenu(anchor, items, { onclose } = {}) {
  if (live) live.close();
  css(CSS);
  const layer = $('#layer'), stack = []; let alt = false, dead = false;
  const st = r => { const s = $('#stage').getBoundingClientRect(); return { l: (r.left - s.left) / S.scale, t: (r.top - s.top) / S.scale, r: (r.right - s.left) / S.scale, b: (r.bottom - s.top) / S.scale }; };
  const paint = r => {
    const it = r.it.alt && alt ? { ...r.it, ...r.it.alt } : r.it, hot = r.el.classList.contains('hot'); r.cur = it;
    r.el.className = 'mi' + (it.dis ? ' dis' : '') + (it.info ? ' info' : '') + (it.sub ? ' sub' : '') + (hot ? ' hot' : '');
    r.el.disabled = !!it.dis;
    r.el.replaceChildren(h('span', { class: 'ck', html: it.icon || '' }, it.icon ? null : it.check ? (it.check === 'mixed' ? '–' : '✓') : ''),
      h('span', { class: 'lb', title: it.tip || false }, it.l), h('span', { class: 'ks' }, it.sub ? '›' : it.k || ''));
  };
  const trim = d => { while (stack.length > d) stack.pop().m.remove(); };
  const pick = r => { sfx.click(); const fn = r.cur.fn; close(); fn && fn(); };
  function build(list, d) {
    const m = h('div', { class: 'menu mdesk-menu' + (d ? ' sub' : ''), role: 'menu' }), rows = [];
    list.filter(Boolean).forEach(it => {
      if (it.sep) return m.append(h('hr'));
      if (it.head) return m.append(h('div', { class: 'mdesk-hd' }, it.head));
      const r = { it, el: h('button', { type: 'button', role: 'menuitem' }) }; rows.push(r); paint(r); m.append(r.el);
      r.el.addEventListener('pointerenter', () => {
        trim(d + 1); rows.forEach(x => x.el.classList.remove('hot')); if (r.cur.dis) return;
        r.el.classList.add('hot'); if (r.cur.sub) openSub(r, d);
      });
      r.el.addEventListener('click', e => { e.stopPropagation(); if (!r.cur.dis && !r.cur.sub) pick(r); });
    });
    return { m, rows };
  }
  function openSub(r, d) {
    trim(d + 1); const s = build(r.cur.sub, d + 1); stack[d + 1] = s; layer.append(s.m);
    const a = st(r.el.getBoundingClientRect()), pl = st(stack[d].m.getBoundingClientRect()).l, mw = s.m.offsetWidth, mh = s.m.offsetHeight;
    let left = !!stack[d].left, x = left ? pl - mw + 2 : a.r - 2;     /* un sous-menu replié à gauche continue vers la gauche */
    if (!left && x + mw > 1594) { x = pl - mw + 2; left = true; } else if (left && x < 6) { x = a.r - 2; left = false; }
    s.left = left; s.m.style.left = x + 'px'; s.m.style.top = clamp(a.t - 7, 32, 894 - mh) + 'px';
    return s;
  }
  const setAlt = v => { if (v === alt) return; alt = v; stack.forEach(s => s.rows.forEach(paint)); };
  const key = e => {
    if (e.key === 'Alt') return setAlt(e.type === 'keydown');
    if (e.type !== 'keydown') return;
    const d = stack.length - 1, deep = stack[d], rows = deep.rows.filter(x => !x.cur.dis), i = rows.findIndex(x => x.el.classList.contains('hot'));
    const go = j => { deep.rows.forEach(x => x.el.classList.remove('hot')); const r = rows[(j + rows.length) % rows.length]; r && r.el.classList.add('hot'); };
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); go(i + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); go(i < 0 ? -1 : i - 1); }
    else if (e.key === 'ArrowRight' && i >= 0 && rows[i].cur.sub) { e.preventDefault(); const s = openSub(rows[i], d), f = s.rows.find(x => !x.cur.dis); f && f.el.classList.add('hot'); }
    else if (e.key === 'ArrowLeft' && d > 0) { e.preventDefault(); trim(d); }
    else if ((e.key === 'Enter' || e.key === ' ') && i >= 0 && !rows[i].cur.sub) { e.preventDefault(); pick(rows[i]); }
  };
  const away = e => { if (stack.some(s => s.m.contains(e.target)) || anchor.contains(e.target)) return; close(); };
  const move = e => setAlt(e.altKey);
  function close() {
    if (dead) return; dead = true; trim(0); live = null; anchor.classList.remove('open'); onclose && onclose();
    removeEventListener('pointerdown', away, true); removeEventListener('keydown', key, true); removeEventListener('keyup', key, true); removeEventListener('pointermove', move, true);
  }
  stack[0] = build(items, 0); layer.append(stack[0].m);
  if (stack[0].rows.some(r => r.it.alt)) { setAlt(true); const wd = stack[0].m.offsetWidth; setAlt(false); stack[0].m.style.minWidth = wd + 'px'; }   /* la largeur tient compte de la variante ⌥ */
  const a = st(anchor.getBoundingClientRect());
  stack[0].m.style.left = clamp(a.l, 6, 1594 - stack[0].m.offsetWidth) + 'px'; stack[0].m.style.top = (a.b + 2) + 'px';
  anchor.classList.add('open'); live = { anchor, close };
  addEventListener('pointerdown', away, true); addEventListener('keydown', key, true); addEventListener('keyup', key, true); addEventListener('pointermove', move, true);
  return live;
}

/* ---------- alerte (NSAlert) ---------- */
/** Alerte modale : le premier bouton est le bouton par défaut (à droite) ; renvoie { i, value }. `cancel` : indice du bouton lié à Échap. */
export function macAlert({ app, title, text, buttons = ['OK'], field = null, cancel, danger = -1 }) {
  css(CSS);
  return new Promise(res => {
    const layer = $('#layer'), cx = cancel ?? (buttons.length > 1 ? buttons.length - 1 : 0);
    const inp = field ? h('input', { type: 'text', value: field.value || '', placeholder: field.placeholder || '', maxlength: 60, spellcheck: 'false', 'aria-label': field.placeholder || title }) : null;
    const scrim = h('div', { class: 'mdesk-scrim' });
    const bts = buttons.map((b, i) => h('button', { type: 'button', class: 'b' + (i === 0 ? ' def' : '') + (i === danger ? ' dg' : ''), onclick: () => end(i) }, b));
    const box = h('div', { class: 'mdesk-alert glass', role: 'alertdialog', 'aria-label': title },
      h('img', { src: icon(app.id), alt: '' }), h('div', {}, h('h4', {}, title), text ? h('p', {}, text) : null, inp), h('div', { class: 'mdesk-bt' }, [...bts].reverse()));
    const end = i => { removeEventListener('keydown', kd, true); box.remove(); scrim.remove(); sfx.close(); res({ i, value: inp ? inp.value : '' }); };
    const kd = e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); end(cx); }
      else if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); end(0); }
    };
    layer.append(scrim, box); sfx.open(); addEventListener('keydown', kd, true);
    (inp || bts[0]).focus({ preventScroll: true }); inp && inp.select();
  });
}

/* ---------- fenêtre « À propos » (modèle des applis : icône, nom, version, textes centrés) ---------- */
export function aboutWin(app, { version, lines, h: height = 440 }) {
  css(CSS);
  return wm.open({ id: 'about:' + app.id, appId: app.id, title: T('À propos de ', 'About ') + app.id, w: 356, h: height, resizable: false, cls: 'about', x: 622, y: 130,
    build: w => {
      const ab = h('div', { class: 'ab mdesk-ab' });
      const draw = () => {
        ab.replaceChildren(h('img', { class: 'abi', src: icon(app.id), alt: '' }), h('h2', { html: brand(app.id, app.accent) }), h('p', { class: 'mut' }, version()),
          ...lines().map(([t, c]) => h('p', { class: c || false }, t)));
      };
      const fit = () => { const hh = Math.round(ab.scrollHeight + 48); w.h = hh; w.el.style.height = hh + 'px'; };   /* la fenêtre épouse son texte, quelle que soit la langue */
      w.redraw = () => { w.el.setAttribute('aria-label', T('À propos de ', 'About ') + app.id); const tt = w.el.querySelector('.wt'); tt && (tt.textContent = T('À propos de ', 'About ') + app.id); draw(); fit(); };
      draw(); requestAnimationFrame(fit); return ab;
    } });
}

/* ======================================================================== */
/*  mDESK                                                                   */
/* ======================================================================== */

const GX = 20, GY = 52, CW = 120, CH = 124;
const cellOf = (x, y) => [clamp(Math.round((x - GX) / CW), 0, 12), clamp(Math.round((y - GY) / CH), 0, 5)];
const posOf = (c, r) => ({ x: GX + c * CW, y: GY + r * CH });
const dis = () => [...document.querySelectorAll('#sps .di')];
const isOwn = w => w.id === 'about' || w.id.startsWith('about:');
const appName = w => (w.appId === 'finder' ? 'Finder' : w.appId === 'settings' ? w.title : w.appId);
const MONITOR = '<svg viewBox="0 0 16 16" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><rect x="1.8" y="2.4" width="12.4" height="8.4" rx="1.3"/><path d="M5.6 13.6h4.8M8 10.8v2.8"/></g></svg>';
const BARICON = '<svg viewBox="0 0 20 20" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2.5" y="4" width="7" height="12" rx="1.8"/><rect x="11.5" y="4" width="6" height="5.2" rx="1.6"/><rect x="11.5" y="10.8" width="6" height="5.2" rx="1.6"/></g></svg>';
const clip = t => { const n = 36; if (t.length <= n) return t; const k = n - 1, a = Math.floor(k * 2 / 3); return t.slice(0, a) + '…' + t.slice(t.length - (k - a)); };
const fmtTime = () => new Date().toLocaleTimeString(lang() === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' });
let X = null;
on('lang', () => X && X.relang());

export function open(app) {
  css(CSS);
  if (X) return X.toggle();
  X = start(app);
}

function start(app) {
  const st = { displays: 2, arr: [], active: null, status: T('Prêt', 'Ready'), hidden: false, onDisplays: false, onWake: false, onLaunch: false, login: false, excluded: new Set() };
  const desk0 = JSON.stringify(store.get('desk', {})); let lastWrite = null;   /* disposition d'origine des icônes, rétablie à la fin si l'internaute n'y a pas touché */
  const resetDesk = () => { if (lastWrite !== null && JSON.stringify(store.get('desk', {})) === lastWrite) store.set('desk', JSON.parse(desk0)); };
  addEventListener('pagehide', resetDesk);
  const key = () => String(st.displays);
  const byId = id => st.arr.find(a => a.id === id);
  const activeArr = () => byId(st.active);
  let uid = 0, timers = new Set(), auto = 0, gone = false, seeding = true;
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!gone) fn(); }, ms); timers.add(t); return t; };

  /* ---------- captures ---------- */
  const capIcons = () => dis().map(d => ({ k: d.getAttribute('aria-label'), x: parseFloat(d.style.left), y: parseFloat(d.style.top) }));
  const capWins = () => [...wm.wins.values()].filter(w => !isOwn(w)).map(w => ({ id: w.id, appId: w.appId, title: w.title, name: appName(w), x: Math.round(w.x), y: Math.round(w.y), w: Math.round(w.w), h: Math.round(w.h), fin: w.appId === 'finder', max: w.max }));

  /* ---------- déplacements animés ---------- */
  function moveIcons(list) {
    let moved = 0, same = 0; const saved = store.get('desk', {}); let i = 0;
    dis().forEach(d => {
      const s = list.find(o => o.k === d.getAttribute('aria-label')); if (!s) return;
      const x = parseFloat(d.style.left), y = parseFloat(d.style.top);
      if (Math.hypot(x - s.x, y - s.y) < 3) { same++; return; }
      moved++; d.classList.remove('snap'); d.style.transition = 'left .75s cubic-bezier(.25,.9,.3,1.04),top .75s cubic-bezier(.25,.9,.3,1.04)'; d.style.transitionDelay = (i++ * 45) + 'ms';
      d.style.left = s.x + 'px'; d.style.top = s.y + 'px'; saved[d.getAttribute('aria-label')] = cellOf(s.x, s.y);
      later(() => { d.style.transition = ''; d.style.transitionDelay = ''; }, 900 + i * 45);
    });
    if (moved) { store.set('desk', saved); lastWrite = JSON.stringify(saved); later(function tidy() { if (document.querySelector('.di.drag')) return later(tidy, 400); renderDesk(); }, 1000 + i * 45); }
    return { moved, same };
  }
  function moveWins(list) {
    let moved = 0, missing = 0, full = 0;
    list.forEach(s => {
      const w = wm.wins.get(s.id); if (!w) { missing++; return; } if (w.max) { full++; return; }
      const el = w.el; el.classList.add('anim'); Object.assign(w, { x: s.x, y: s.y, w: s.w, h: s.h });
      Object.assign(el.style, { left: s.x + 'px', top: s.y + 'px', width: s.w + 'px', height: s.h + 'px' }); later(() => el.classList.remove('anim'), 450); moved++;
    });
    return { moved, missing, full };
  }

  /* ---------- mémoriser / restaurer ---------- */
  const count = a => [a.icons.length, a.wins.filter(x => x.fin).length, a.wins.filter(x => !x.fin).length];
  function memorize(arr, { name, parts = 'all', only = null, purge = false } = {}) {
    const fresh = !arr, done = [];
    if (fresh) arr = { id: ++uid, name: name || T('Arrangement ', 'Arrangement ') + new Date().toLocaleString(lang() === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }), key: '', icons: [], wins: [], at: 0 };
    if (parts === 'all' || parts === 'icons') {
      const ic = capIcons(); arr.icons = purge ? ic : [...ic, ...arr.icons.filter(o => !ic.some(n => n.k === o.k))];
      done.push(T(`${ic.length} icônes`, `${ic.length} icons`));
    }
    const cw = capWins();
    if ((parts === 'all' || parts === 'windows') && !only) {
      const f = cw.filter(x => x.fin); arr.wins = [...arr.wins.filter(x => !x.fin), ...f]; done.push(T(`${f.length} fenêtres Finder`, `${f.length} Finder windows`));
    }
    if (parts === 'all' || parts === 'windows' || parts === 'apps') {
      const nw = cw.filter(x => !x.fin && (only ? x.appId === only : !st.excluded.has(x.appId)));
      if (only) arr.wins = arr.wins.filter(x => x.fin || x.appId !== only).concat(nw);
      else { const keep = purge ? [] : arr.wins.filter(x => !x.fin && !nw.some(n => n.appId === x.appId)); arr.wins = [...arr.wins.filter(x => x.fin), ...nw, ...keep]; }
      done.push(T(`${nw.length} fenêtres d’apps`, `${nw.length} app windows`));
    }
    arr.key = key(); arr.at = Date.now(); if (fresh) st.arr.push(arr);
    if (fresh || !st.active) st.active = arr.id;
    status(T('Mémorisé : ', 'Saved: ') + done.join(', ')); if (!seeding) { sfx.done(); pulse(); }
  }
  function restore(arr, { parts = 'all', only = null } = {}) {
    const done = [];
    if ((parts === 'all' || parts === 'windows') && !only) {
      const f = arr.wins.filter(x => x.fin);
      if (f.length) { const r = moveWins(f); done.push(r.missing ? T(`${r.moved} fenêtres Finder (${r.missing} fermées, ignorées)`, `${r.moved} Finder windows (${r.missing} closed, skipped)`) : T(`${r.moved} fenêtres Finder`, `${r.moved} Finder windows`)); }
    }
    if (parts === 'all' || parts === 'icons') {
      if (arr.icons.length) {
        const here = new Set(dis().map(d => d.getAttribute('aria-label'))), r = moveIcons(arr.icons.filter(o => here.has(o.k)));
        done.push(T(`${r.moved} icônes replacées, ${r.same} en place`, `${r.moved} icons moved back, ${r.same} already in place`));
      }
    }
    if (parts === 'all' || parts === 'windows' || parts === 'apps') {
      const saved = arr.wins.filter(x => !x.fin && (only ? x.appId === only : !st.excluded.has(x.appId)));
      if (saved.length) {
        const r = moveWins(saved); let t = T(`${r.moved} fenêtres d’apps`, `${r.moved} app windows`);
        if (r.missing) t += T(` (${r.missing} absentes)`, ` (${r.missing} missing)`);
        if (r.full) t += T(` (${r.full} en plein écran, laissées)`, ` (${r.full} full screen, left alone)`);
        done.push(t);
      }
    }
    status(T('Restauré : ', 'Restored: ') + (done.length ? done.join(', ') : T('rien à restaurer', 'nothing to restore'))); sfx.swap(); pulse();
  }
  const status = t => { st.status = fmtTime() + ' — ' + t; };

  /* ---------- le Mac « réarrangé » par macOS quand les écrans changent ---------- */
  function shuffle() {
    const SC = [[4, 1], [8, 3], [3, 4], [10, 0], [6, 5], [11, 2], [2, 2], [7, 1], [9, 4], [5, 3], [1, 5], [12, 4]];
    const bySp = {}; dis().forEach(d => { const sp = d.closest('.space').id; (bySp[sp] = bySp[sp] || []).push(d.getAttribute('aria-label')); });
    const list = []; Object.values(bySp).forEach(ls => ls.forEach((k, i) => list.push({ k, ...posOf(...SC[(i * 5 + 1) % SC.length]) })));
    moveIcons(list);
    moveWins(capWins().map((o, i) => ({ ...o, x: clamp(70 + (i * 263) % 520, 0, 1500 - o.w), y: clamp(54 + (i * 137) % 160, 32, 860 - o.h) })));
    sfx.swap();
  }
  function setDisplays(n) {
    if (n === st.displays) return; st.displays = n; drawChip(); shuffle();
    status(T('Écrans changés : ', 'Displays changed: ') + T(`${n} écran(s)`, `${n} display(s)`));
    if (st.onDisplays) { clearTimeout(auto); auto = later(() => autoRestore(T('écrans', 'displays')), 2500); }
  }
  function autoRestore(reason) {
    const a = byId(st.active), same = a && a.key === key() ? a : st.arr.filter(x => x.key === key()).sort((p, q) => q.at - p.at)[0] || a;
    if (!same) { status(T(`Auto (${reason}) : aucun arrangement`, `Auto (${reason}): no arrangement`)); return; }
    restore(same);
  }

  /* ---------- simulateur d'écrans ---------- */
  const chip = h('div', { class: 'mdesk-sim', role: 'group' }); $('#layer').append(chip);
  function drawChip() {
    chip.replaceChildren(h('span', { html: MONITOR }), h('span', {}, T('ÉCRANS (SIMULATION)', 'DISPLAYS (SIMULATION)')),
      h('div', { class: 'seg2' }, [1, 2].map(n => h('button', { type: 'button', class: st.displays === n ? 'on' : '', 'aria-pressed': st.displays === n, title: T('Simule le branchement ou le débranchement d’un écran', 'Simulates plugging or unplugging a display'), onclick: () => setDisplays(n) }, String(n)))));
  }
  drawChip();

  /* ---------- barre des menus ---------- */
  const el = h('button', { class: 'mb extra mdesk-x', 'aria-label': 'mDESK', html: BARICON });
  const pulse = () => { el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); };
  const toggle = () => (macMenuOpen(el) ? closeMacMenu() : (sfx.click(), macMenu(el, items(), { onclose: hint })));
  let hinted = false;
  const hint = () => { if (hinted || gone) return; hinted = true; later(() => toast({ icon: icon('mDESK'), title: 'mDESK', body: T('Déplacez des icônes et des fenêtres, puis choisissez « Tout restaurer » dans le menu.', 'Move some icons and windows around, then choose “Restore everything” in the menu.'), ms: 8000 }), 350); };
  el.onclick = toggle;
  const info = l => ({ l: clip(l), tip: l.length > 36 ? l : false, dis: true, info: true });
  function items() {
    const a = activeArr(), known = st.arr.some(x => x.key === key());
    const apps = new Map(); [...wm.wins.values()].filter(w => !isOwn(w) && w.appId !== 'finder').forEach(w => apps.set(w.appId, appName(w)));
    const sorted = [...st.arr].sort((p, q) => p.name.localeCompare(q.name, lang(), { numeric: true }));
    return [
      info(T(`${st.displays} écran(s), ${known ? 'mémorisés' : 'non mémorisés'}`, `${st.displays} display(s), ${known ? 'saved' : 'not saved'}`)),
      info(st.status), { sep: 1 },
      info(a ? T(`« ${a.name} »`, `“${a.name}”`) : T('Aucun arrangement actif', 'No active arrangement')), { sep: 1 },
      { head: T('Icônes du Bureau', 'Desktop icons') },
      { l: T('Mémoriser les icônes', 'Save icons'), icon: SF.save, fn: () => memorize(a, { parts: 'icons' }) },
      a && { l: T('Restaurer les icônes', 'Restore icons'), icon: SF.restore, fn: () => restore(a, { parts: 'icons' }) },
      { l: st.hidden ? T('Afficher les icônes du Bureau', 'Show desktop icons') : T('Masquer les icônes du Bureau', 'Hide desktop icons'), k: '⌘H', icon: st.hidden ? SF.eye : SF.eyeOff, fn: toggleHide },
      { sep: 1 }, { head: T('Fenêtres', 'Windows') },
      { l: T('Mémoriser toutes les fenêtres', 'Save all windows'), icon: SF.save, fn: () => memorize(a, { parts: 'windows' }) },
      a && { l: T('Restaurer toutes les fenêtres', 'Restore all windows'), icon: SF.restore, fn: () => restore(a, { parts: 'windows' }) },
      { l: T('Applications', 'Applications'), icon: SF.windows, sub: apps.size ? [...apps].sort((p, q) => p[1].localeCompare(q[1])).map(([id, name]) => {
        const n = a ? a.wins.filter(x => x.appId === id).length : 0, ex = st.excluded.has(id);
        return { l: ex ? T(`${name} — ne pas déplacer`, `${name} — do not move`) : name, sub: [
          info(n > 0 ? T(`${n} fenêtre(s) mémorisée(s)`, `${n} window(s) saved`) : T('Aucune fenêtre mémorisée', 'No window saved')), { sep: 1 },
          { l: T('Mémoriser ses fenêtres', 'Save its windows'), fn: () => memorize(a, { parts: 'apps', only: id }) },
          n > 0 && { l: T('Restaurer ses fenêtres', 'Restore its windows'), fn: () => restore(a, { parts: 'apps', only: id }) },
          { l: T('Ne pas déplacer', 'Do not move'), check: ex, fn: () => (ex ? st.excluded.delete(id) : st.excluded.add(id)) }] };
      }) : [info(T('Aucune application ouverte', 'No open application'))] },
      { sep: 1 },
      a && { l: T('Tout restaurer', 'Restore everything'), k: '⌘R', fn: () => restore(a) },
      { l: T('Tout mémoriser', 'Save everything'), k: '⌘M', fn: () => memorize(a), alt: { l: T('Tout mémoriser et oublier les absents', 'Save everything and forget missing items'), k: '⌥⌘M', fn: () => memorize(a, { purge: true }) } },
      { l: T('Nouvel arrangement…', 'New arrangement…'), k: '⌘N', fn: newArr },
      { l: T('Arrangements', 'Arrangements'), sub: sorted.length ? sorted.map(r => {
        const [ni, nf, na] = count(r);
        return { l: r.name, check: r.id === st.active, sub: [
          info(T(`${ni} icônes · ${nf} Finder · ${na} fenêtres`, `${ni} icons · ${nf} Finder · ${na} windows`) + (r.key === key() ? T(' · ces écrans', ' · these displays') : '')), { sep: 1 },
          { l: T('Tout restaurer', 'Restore everything'), fn: () => restore(r) },
          { l: T('Restaurer les icônes', 'Restore icons'), fn: () => restore(r, { parts: 'icons' }) },
          { l: T('Restaurer les fenêtres', 'Restore windows'), fn: () => restore(r, { parts: 'windows' }) }, { sep: 1 },
          { l: T('Tout mémoriser ici', 'Save everything here'), fn: () => memorize(r) },
          { l: T('Mémoriser les icônes ici', 'Save icons here'), fn: () => memorize(r, { parts: 'icons' }) },
          { l: T('Mémoriser les fenêtres ici', 'Save windows here'), fn: () => memorize(r, { parts: 'windows' }) }, { sep: 1 },
          { l: T('Définir comme actif', 'Set as active'), fn: () => { st.active = r.id; } },
          { l: T('Renommer…', 'Rename…'), fn: () => rename(r) },
          { l: T('Supprimer…', 'Delete…'), fn: () => remove(r) }] };
      }) : [info(T('Aucun', 'None'))] },
      { sep: 1 },
      { l: T('Restauration automatique', 'Automatic restore'), sub: [
        { l: T('Quand les écrans changent', 'When displays change'), check: st.onDisplays, fn: () => { st.onDisplays = !st.onDisplays; } },
        { l: T('Au réveil et au déverrouillage', 'On wake and unlock'), check: st.onWake, fn: () => { st.onWake = !st.onWake; } },
        { l: T('À l’ouverture de mDESK', 'When mDESK opens'), check: st.onLaunch, fn: () => { st.onLaunch = !st.onLaunch; } }] },
      { l: T('Ouvrir à l’ouverture de session', 'Open at login'), check: st.login, fn: () => { st.login = !st.login; } },
      { l: T('Ouvrir le dossier des données', 'Open the data folder'), fn: () => toast({ icon: icon('mDESK'), title: 'mDESK', body: '~/Library/Application Support/mDESK/arrangements.json' }) },
      { sep: 1 },
      { l: T('À propos de mDESK', 'About mDESK'), fn: about },
      { l: T('Quitter mDESK', 'Quit mDESK'), k: '⌘Q', fn: quit }
    ];
  }
  function toggleHide() { st.hidden = !st.hidden; $('#sps').classList.toggle('mdesk-hide', st.hidden); sfx.swap(); }
  async function newArr() {
    const r = await macAlert({ app, title: T('Nouvel arrangement', 'New arrangement'), text: T('Mémorise la disposition actuelle sous ce nom.', 'Saves the current layout under this name.'), buttons: ['OK', T('Annuler', 'Cancel')], field: { placeholder: T('Nom de l’arrangement', 'Arrangement name') } });
    if (gone || r.i !== 0) return; const n = r.value.replace(/\s+/g, ' ').trim().slice(0, 60);
    if (!n) return invalid(); memorize(null, { name: n });
  }
  async function rename(a) {
    const r = await macAlert({ app, title: T('Renommer', 'Rename'), buttons: ['OK', T('Annuler', 'Cancel')], field: { value: a.name, placeholder: T('Nom de l’arrangement', 'Arrangement name') } });
    if (gone || r.i !== 0) return; const n = r.value.replace(/\s+/g, ' ').trim().slice(0, 60); if (!n) return invalid(); a.name = n;
  }
  const invalid = () => macAlert({ app, title: T('Nom invalide', 'Invalid name'), text: T('Le nom ne peut pas être vide.', 'The name cannot be empty.') });
  async function remove(a) {
    const r = await macAlert({ app, title: T(`Supprimer « ${a.name} » ?`, `Delete “${a.name}”?`), text: T('Cette action est définitive (une copie de l’état précédent reste dans arrangements.json.bak).', 'This cannot be undone (a copy of the previous state stays in arrangements.json.bak).'), buttons: [T('Supprimer', 'Delete'), T('Annuler', 'Cancel')], danger: 0 });
    if (gone || r.i !== 0) return; st.arr = st.arr.filter(x => x.id !== a.id); if (st.active === a.id) st.active = null; sfx.close();
  }
  function about() {
    aboutWin(app, { h: 450, version: () => T('Version 1.0 (1)', 'Version 1.0 (1)'), lines: () => [
      [T('Mémorise et restaure la position des icônes du Bureau et des fenêtres, par combinaison d’écrans.', 'Remembers and restores the position of desktop icons and windows, for each combination of displays.')],
      [T('Par Starbudweiser & Claude Code (Anthropic).', 'By Starbudweiser & Claude Code (Anthropic).'), 'au'], [T('Licence MIT. © 2026 Starbudweiser.', 'MIT License. © 2026 Starbudweiser.')],
      [T('Logiciel fourni « en l’état », sans garantie d’aucune sorte.', 'Provided "as is", without warranty of any kind.'), 'mut'],
      [T('Inspiré de Desktop Icon Manager et de Stay, sans lien avec leurs auteurs.', 'Inspired by Desktop Icon Manager and Stay, not affiliated with their authors.'), 'mut']] });
  }

  /* ---------- arrangements d'exemple : « Studio » (2 écrans, la disposition actuelle) et « Portable » (1 écran, tout au bord) ---------- */
  function seed() {
    memorize(null, { name: 'Studio' });
    const s = st.arr[0], bySp = {}; s.icons.forEach(o => { const d = dis().find(x => x.getAttribute('aria-label') === o.k), sp = d ? d.closest('.space').id : 'x'; (bySp[sp] = bySp[sp] || []).push(o); });
    const icons = []; Object.values(bySp).forEach(ls => ls.forEach((o, i) => icons.push({ k: o.k, ...posOf(i % 2, Math.floor(i / 2) % 6) })));
    const wins = s.wins.map((o, i) => { const w = Math.round(o.w * .86), hh = Math.round(o.h * .86); return { ...o, w, h: hh, x: 200 + i * 40, y: 60 + i * 36 }; });
    st.arr.push({ id: ++uid, name: 'Portable', key: '1', icons, wins, at: Date.now() - 864e5 });
    st.active = s.id; st.status = T('Prêt', 'Ready');
  }
  seed(); seeding = false;

  /* ---------- cycle de vie ---------- */
  function quit() {
    if (gone) return; gone = true; closeMacMenu(); timers.forEach(clearTimeout); clearTimeout(auto); chip.remove();
    if (st.hidden) $('#sps').classList.remove('mdesk-hide');
    resetDesk(); removeEventListener('pagehide', resetDesk); renderDesk();
    S.extras.delete('mDESK'); emit('extras'); X = null; sfx.close();
  }
  S.extras.set('mDESK', { el, quit }); emit('extras'); sfx.open();
  later(() => { if (!macMenuOpen(el)) toggle(); }, 900);
  return { toggle, quit, relang: () => { drawChip(); closeMacMenu(); } };
}
