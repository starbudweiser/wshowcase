/* Deux bureaux virtuels : glissement horizontal, pastilles, ⌥← ⌥→, balayage, icônes de bureau. */
import { S, emit, on, icon } from './core.js';
import { h, $, brand, store } from './util.js';
import { sname, t, lang } from './i18n.js';
const T = (fr, en) => (lang() === 'fr' ? fr : en);
import { sfx } from './audio.js';
import { launch } from './apps.js';
import { EGGS } from './eggs.js';

const idx = () => Math.max(0, S.spaces.findIndex(s => s.id === S.cur));
const step = d => { const n = idx() + d; if (n >= 0 && n < S.spaces.length) go(S.spaces[n].id); };
const all = (r, s) => [...r.querySelectorAll(s)];

export function init() {
  const host = $('#sps'); host.innerHTML = '';
  S.spaces.forEach((sp, i) => {
    const el = h('section', { class: 'space', id: 'sp-' + sp.id, 'data-idx': i });
    el.style.transform = `translateX(${(i - idx()) * 100}%)`;
    el.append(h('div', { class: 'swp' }, h('div', { class: 'wl' }), h('div', { class: 'wl' })));
    host.append(el);
    const bare = e => e.target === el || !!e.target.closest('.swp');
    el.addEventListener('pointerdown', e => { if (bare(e)) all(el, '.di.sel').forEach(x => x.classList.remove('sel')); });
    el.addEventListener('contextmenu', e => { if (bare(e)) deskMenu(e, el); });
  });
  renderDesk(); renderBar();
  addEventListener('keydown', e => {
    if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); step(e.key === 'ArrowRight' ? 1 : -1); }
  });
  let cool = 0; const st = $('#stage');
  st.addEventListener('wheel', e => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.4 && Math.abs(e.deltaX) > 30 && Date.now() > cool) { cool = Date.now() + 800; step(e.deltaX > 0 ? 1 : -1); }
  }, { passive: true });
  let tx = null;
  st.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  st.addEventListener('touchend', e => {
    if (tx == null) return; const dx = e.changedTouches[0].clientX - tx; tx = null;
    if (Math.abs(dx) > 90) step(dx < 0 ? 1 : -1);
  }, { passive: true });
  on('lang', () => { renderBar(); renderDesk(); });
}

export function go(id, { instant = false } = {}) {
  if (id === S.cur || !S.spaces.some(s => s.id === id)) return Promise.resolve();
  S.cur = id; const i = idx();
  document.querySelectorAll('.space').forEach(el => {
    el.style.transitionDuration = instant ? '0s' : '';
    el.style.transform = `translateX(${(+el.dataset.idx - i) * 100}%)`;
  });
  if (!instant) sfx.swap();
  renderBar(); emit('space', id);
  return new Promise(r => setTimeout(r, instant ? 0 : 560));
}

export function renderBar() {
  const bar = $('#spacebar'); if (!bar) return; bar.innerHTML = '';
  S.spaces.forEach(sp => bar.append(h('button', { class: sp.id === S.cur ? 'on' : '', 'aria-label': sname(sp), onclick: () => go(sp.id) },
    h('i', { style: { background: `linear-gradient(135deg,${sp.tint[0]},${sp.tint[1]})` } }), sname(sp))));
}

/* Icônes du bureau : grille de cases, glisser-déposer avec aimantation, positions mémorisées. */
const CW = 120, CH = 124, X0 = 20, Y0 = 52, COLS = 13, ROWS = 6;
const cell = (c, r) => ({ left: X0 + c * CW, top: Y0 + r * CH });
const key = p => p[0] + ',' + p[1];
function layout(spaceId, reset) {
  const saved = reset ? {} : store.get('desk', {});
  const apps = deskList(spaceId), taken = new Set(), out = {};
  apps.forEach(a => { const p = saved[a.id]; if (p && p[0] >= 0 && p[0] < COLS && p[1] >= 0 && p[1] < ROWS && !taken.has(key(p))) { out[a.id] = p; taken.add(key(p)); } });
  let c = COLS - 1, r = 0;
  apps.forEach(a => { if (out[a.id]) return; while (taken.has(key([c, r]))) { r++; if (r >= ROWS) { r = 0; c--; } } out[a.id] = [c, r]; taken.add(key([c, r])); });
  return out;
}
const savePos = (id, p) => { const d = store.get('desk', {}); d[id] = p; store.set('desk', d); };
let suppress = false;
const EXTRA = { id: 'Videos', space: 'skyrim', desk: true, video: true, src: 'assets/icons/videos.png' };
const deskList = sp => [...S.apps.filter(a => a.space === sp && a.desk), ...(sp === EXTRA.space ? [EXTRA] : []), ...EGGS.filter(e => e.space === sp)];
const run = a => { if (a.video) import('./player.js').then(m => m.open()); else if (a.load) a.load(); else launch(a.id); };
export function renderDesk(reset) {
  if (reset) { const d = store.get('desk', {}); S.apps.forEach(a => delete d[a.id]); delete d[EXTRA.id]; EGGS.forEach(e => delete d[e.id]); store.set('desk', d); }
  S.spaces.forEach(sp => {
    const el = $('#sp-' + sp.id); if (!el) return;
    all(el, '.di').forEach(x => x.remove());
    const coarse = matchMedia('(pointer:coarse)').matches, pos = layout(sp.id);
    deskList(sp.id).forEach(a => {
      const d = h('button', { class: 'di' + (reset ? ' snap' : ''), 'aria-label': a.id, style: cell(...pos[a.id]) },
        h('img', { src: a.src || icon(a.id), alt: '', draggable: 'false' }), a.video ? h('span', {}, T('Vidéos', 'Videos')) : a.label ? h('span', {}, a.label()) : h('span', { html: brand(a.id, a.accent) }));
      d.style.left = cell(...pos[a.id]).left + 'px'; d.style.top = cell(...pos[a.id]).top + 'px';
      d.addEventListener('click', e => {
        e.stopPropagation(); if (suppress) return;
        all(el, '.di.sel').forEach(x => x.classList.remove('sel')); d.classList.add('sel'); sfx.tick();
        if (coarse) run(a, d);
      });
      d.addEventListener('dblclick', () => run(a, d));
      d.addEventListener('keydown', e => { if (e.key === 'Enter') run(a, d); });
      if (!coarse) d.addEventListener('pointerdown', e => dragIcon(e, d, a, el, pos));
      el.append(d);
    });
  });
}
function dragIcon(e, d, a, el, pos) {
  if (e.button !== 0) return;
  const sx = e.clientX, sy = e.clientY, ol = parseFloat(d.style.left), ot = parseFloat(d.style.top); let moved = false, ghost = null, tgt = null;
  /* case visée : la plus proche, libre (comme le Finder, qui aimante l'icône sur la grille) */
  const target = () => {
    let c = Math.max(0, Math.min(COLS - 1, Math.round((parseFloat(d.style.left) - X0) / CW))), r = Math.max(0, Math.min(ROWS - 1, Math.round((parseFloat(d.style.top) - Y0) / CH)));
    const taken = new Set(Object.entries(pos).filter(([id]) => id !== a.id).map(([, p]) => key(p)));
    if (taken.has(key([c, r]))) {
      let best = null, bd = 1e9;
      for (let cc = 0; cc < COLS; cc++) for (let rr = 0; rr < ROWS; rr++) if (!taken.has(key([cc, rr]))) { const dd = (cc - c) ** 2 + (rr - r) ** 2; if (dd < bd) { bd = dd; best = [cc, rr]; } }
      if (best) [c, r] = best;
    }
    return [c, r];
  };
  const mv = ev => {
    const dx = (ev.clientX - sx) / S.scale, dy = (ev.clientY - sy) / S.scale;
    if (!moved) {
      if (Math.hypot(dx, dy) < 5) return; moved = true; d.classList.remove('snap'); d.classList.add('drag');
      all(el, '.di.sel').forEach(x => x.classList.remove('sel')); d.classList.add('sel'); sfx.tick();
      ghost = h('i', { class: 'dghost' }); el.insertBefore(ghost, d);
    }
    d.style.left = Math.max(0, Math.min(1600 - 112, ol + dx)) + 'px'; d.style.top = Math.max(34, Math.min(780, ot + dy)) + 'px';
    const t2 = target(); if (!tgt || t2[0] !== tgt[0] || t2[1] !== tgt[1]) { tgt = t2; const p = cell(...t2); ghost.style.left = p.left + 'px'; ghost.style.top = p.top + 'px'; }
  };
  const up = () => {
    removeEventListener('pointermove', mv);
    if (!moved) return;
    d.classList.remove('drag'); ghost && ghost.remove(); suppress = true; setTimeout(() => { suppress = false; }, 50);
    const [c, r] = target(); pos[a.id] = [c, r]; Object.entries(pos).forEach(([id, p]) => savePos(id, p));
    d.classList.add('snap'); const p = cell(c, r); d.style.left = p.left + 'px'; d.style.top = p.top + 'px'; sfx.click();
  };
  addEventListener('pointermove', mv); addEventListener('pointerup', up, { once: true });
}
/* « Ranger par nom » : les icônes glissent à leur nouvelle case, de haut en bas à droite */
function tidy(spaceEl) {
  const els = all(spaceEl, '.di').sort((a, b) => a.getAttribute('aria-label').toLowerCase().localeCompare(b.getAttribute('aria-label').toLowerCase()));
  els.forEach((d, i) => { const p = cell(COLS - 1, i % ROWS - 0), c = COLS - 1 - Math.floor(i / ROWS); const q = cell(c, i % ROWS); d.classList.add('snap'); d.style.left = q.left + 'px'; d.style.top = q.top + 'px'; savePos(d.getAttribute('aria-label'), [c, i % ROWS]); });
  sfx.swap(); setTimeout(() => renderDesk(), 360);
}
/* clic droit sur le bureau */
export function deskMenu(e, spaceEl) {
  e.preventDefault();
  const s = $('#stage').getBoundingClientRect(), x = (e.clientX - s.left) / S.scale, y = (e.clientY - s.top) / S.scale;
  const anchor = h('i', { style: { position: 'absolute', left: x + 'px', top: y + 'px', width: '1px', height: '1px' } }); $('#layer').append(anchor);
  import('./menubar.js').then(m => { m.showMenu(anchor, [
    { l: t('m.cleanup'), fn: () => tidy(spaceEl) },
    { l: t('m.resetDesk'), fn: () => { renderDesk(true); sfx.swap(); } },
    { sep: 1 },
    { l: t('m.changeWall'), fn: () => import('./system.js').then(sy => sy.openSettings('wall')) },
    { sep: 1 },
    { l: t('m.aboutApp'), fn: () => import('./system.js').then(sy => sy.openAbout()) }
  ]); anchor.remove(); });
}
