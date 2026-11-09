/* Deux bureaux virtuels : glissement horizontal, pastilles, ⌥← ⌥→, balayage, icônes de bureau. */
import { S, emit, on, icon } from './core.js';
import { h, $, brand } from './util.js';
import { sname } from './i18n.js';
import { sfx } from './audio.js';
import { launch } from './apps.js';

const idx = () => Math.max(0, S.spaces.findIndex(s => s.id === S.cur));
const step = d => { const n = idx() + d; if (n >= 0 && n < S.spaces.length) go(S.spaces[n].id); };
const all = (r, s) => [...r.querySelectorAll(s)];

export function init() {
  const host = $('#sps'); host.innerHTML = '';
  S.spaces.forEach((sp, i) => {
    const el = h('section', { class: 'space', id: 'sp-' + sp.id, 'data-i': i });
    el.style.transform = `translateX(${(i - idx()) * 100}%)`;
    host.append(el);
    el.addEventListener('pointerdown', e => { if (e.target === el) all(el, '.di.sel').forEach(x => x.classList.remove('sel')); });
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
    el.style.transform = `translateX(${(+el.dataset.i - i) * 100}%)`;
  });
  $('#wp').style.setProperty('--px', `${-i * 46}px`);
  if (!instant) sfx.swap();
  renderBar(); emit('space', id);
  return new Promise(r => setTimeout(r, instant ? 0 : 560));
}

export function renderBar() {
  const bar = $('#spacebar'); if (!bar) return; bar.innerHTML = '';
  S.spaces.forEach(sp => bar.append(h('button', { class: sp.id === S.cur ? 'on' : '', 'aria-label': sname(sp), onclick: () => go(sp.id) },
    h('i', { style: { background: `linear-gradient(135deg,${sp.tint[0]},${sp.tint[1]})` } }), sname(sp))));
}

export function renderDesk() {
  S.spaces.forEach(sp => {
    const el = $('#sp-' + sp.id); if (!el) return;
    all(el, '.di').forEach(x => x.remove());
    const coarse = matchMedia('(pointer:coarse)').matches;
    S.apps.filter(a => a.space === sp.id && a.desk).forEach((a, i) => {
      const d = h('button', { class: 'di', style: { top: 52 + i * 124 + 'px' }, 'aria-label': a.id },
        h('img', { src: icon(a.id), alt: '', draggable: 'false' }), h('span', { html: brand(a.id, a.accent) }));
      d.addEventListener('click', e => {
        e.stopPropagation(); all(el, '.di.sel').forEach(x => x.classList.remove('sel')); d.classList.add('sel'); sfx.tick();
        if (coarse) launch(a.id);
      });
      d.addEventListener('dblclick', () => launch(a.id));
      el.append(d);
    });
  });
}
