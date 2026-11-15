/* Dock : icônes de l'espace courant, loupe, info-bulles, rebond au lancement, pastille d'appli ouverte. */
import { S, on, icon } from './core.js';
import { h, $ } from './util.js';
import { t } from './i18n.js';
import { isRunning } from './wm.js';
import { launch, openFinder, openSettings } from './apps.js';

export const FINDER_SVG = `<svg viewBox="0 0 100 100"><defs><linearGradient id="fg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fd0ff"/><stop offset="1" stop-color="#0a84ff"/></linearGradient></defs><rect width="100" height="100" rx="23" fill="#f3f5f9"/><path d="M0 23a23 23 0 0 1 23-23h30c-8 20-8 60 0 100H23A23 23 0 0 1 0 77z" fill="url(#fg1)"/><rect x="24" y="30" width="7" height="16" rx="3.5" fill="#12283d"/><rect x="67" y="30" width="7" height="16" rx="3.5" fill="#12283d"/><path d="M26 66c14 12 34 12 48 0" fill="none" stroke="#12283d" stroke-width="6" stroke-linecap="round"/></svg>`;
export const SETTINGS_SVG = `<svg viewBox="0 0 100 100"><defs><linearGradient id="sg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9bec7"/><stop offset="1" stop-color="#6a707a"/></linearGradient><linearGradient id="sg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#c9ced6"/></linearGradient></defs><rect width="100" height="100" rx="23" fill="url(#sg1)"/><path d="M45.5,21.4 L46.7,13.1 L53.3,13.1 L54.5,21.4 L60.4,22.9 L65.6,16.4 L71.3,19.7 L68.3,27.5 L72.5,31.7 L80.3,28.7 L83.6,34.4 L77.1,39.6 L78.6,45.5 L86.9,46.7 L86.9,53.3 L78.6,54.5 L77.1,60.4 L83.6,65.6 L80.3,71.3 L72.5,68.3 L68.3,72.5 L71.3,80.3 L65.6,83.6 L60.4,77.1 L54.5,78.6 L53.3,86.9 L46.7,86.9 L45.5,78.6 L39.6,77.1 L34.4,83.6 L28.7,80.3 L31.7,72.5 L27.5,68.3 L19.7,71.3 L16.4,65.6 L22.9,60.4 L21.4,54.5 L13.1,53.3 L13.1,46.7 L21.4,45.5 L22.9,39.6 L16.4,34.4 L19.7,28.7 L27.5,31.7 L31.7,27.5 L28.7,19.7 L34.4,16.4 L39.6,22.9Z" fill="url(#sg2)" stroke="#4a4f58" stroke-opacity=".35" stroke-width="1" stroke-linejoin="round"/><circle cx="50" cy="50" r="14" fill="#7c828c"/><circle cx="50" cy="50" r="10.5" fill="#565b64"/></svg>`;

let raf = 0;
export function renderDock() {
  const d = $('#dock'); d.innerHTML = '';
  const track = h('div', { class: 'dkt' }), view = h('div', { class: 'dkv' }, track); d.append(view);
  const add = (key, label, content, fn) => {
    const b = h('button', { class: 'dk', 'data-app': key, 'data-label': label, 'aria-label': label,
      onclick: () => { b.classList.remove('bounce'); void b.offsetWidth; b.classList.add('bounce'); fn(); } }, content, h('i', { class: 'dot' }));
    track.append(b); return b;
  };
  add('finder', 'Finder', h('div', { class: 'svg', html: FINDER_SVG }), () => openFinder());
  S.apps.filter(a => a.space === S.cur).forEach(a => add(a.id, a.id, h('img', { src: icon(a.id), alt: '', draggable: 'false' }), () => launch(a.id)));
  track.append(h('i', { class: 'sep' }));
  add('settings', t('s.title'), h('div', { class: 'svg', html: SETTINGS_SVG }), () => openSettings());
  off = 0; refresh(); requestAnimationFrame(() => scrollTo(0));
}

/* Défilement du Dock quand il y a plus d'icônes que de place : molette, flèches, Début/Fin, toucher. */
let off = 0;
function scrollTo(x) {
  const view = $('#dock .dkv'), track = $('#dock .dkt'); if (!view) return;
  const max = Math.max(0, track.scrollWidth - view.clientWidth); off = Math.max(0, Math.min(max, x));
  track.style.transform = `translateX(${-off}px)`;
  view.classList.toggle('ovl', off > 1 && max > 0); view.classList.toggle('ovr', off < max - 1);
}
function reveal(b) {
  const view = $('#dock .dkv'), vr = view.getBoundingClientRect(), r = b.getBoundingClientRect(), k = S.scale || 1, pad = 56;
  if (r.left < vr.left + pad * k) scrollTo(off - (vr.left + pad * k - r.left) / k);
  else if (r.right > vr.right - pad * k) scrollTo(off + (r.right - (vr.right - pad * k)) / k);
}
function step(dir, d) {
  const all = [...d.querySelectorAll('.dk')], cur = all.indexOf(document.activeElement);
  const i = cur < 0 ? (dir > 0 ? 0 : all.length - 1) : Math.max(0, Math.min(all.length - 1, cur + dir));
  all[i].focus({ preventScroll: true }); reveal(all[i]);
}

export function refresh() {
  document.querySelectorAll('#dock .dk').forEach(b => b.classList.toggle('run', isRunning(b.dataset.app) || S.extras.has(b.dataset.app)));
}

export function init() {
  const d = $('#dock');
  let lastX = null, tm = 0;
  const magnify = x => d.querySelectorAll('.dk').forEach(b => {
    const r = b.getBoundingClientRect(), dist = Math.abs(x - (r.left + r.width / 2)) / S.scale;
    const m = 1 + 0.78 * Math.exp(-(dist * dist) / (2 * 66 * 66)); b.style.setProperty('--m', m.toFixed(3)); b.style.zIndex = Math.round(m * 100);
  });
  const calm = () => d.querySelectorAll('.dk').forEach(b => { b.style.removeProperty('--m'); b.style.zIndex = ''; });
  d.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    lastX = e.clientX; cancelAnimationFrame(raf); raf = requestAnimationFrame(() => magnify(e.clientX));
  });
  /* pendant le défilement la loupe est coupée, puis recalculée sous le pointeur une fois l'animation finie */
  const afterScroll = () => { calm(); clearTimeout(tm); tm = setTimeout(() => { if (over && lastX != null) magnify(lastX); }, 300); };
  d.addEventListener('wheel', e => {
    const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY, view = $('#dock .dkv'), track = $('#dock .dkt');
    if (!dx || track.scrollWidth <= view.clientWidth + 1) return;
    e.preventDefault(); scrollTo(off + dx * (e.deltaMode === 1 ? 24 : 1.1)); afterScroll();
  }, { passive: false });
  /* flèches : actives quand le pointeur est sur le Dock ou qu'une de ses icônes a le focus (sans modificateur : ⌥← ⌥→ changent de bureau) */
  var over = false; d.addEventListener('pointerenter', () => { over = true; }); d.addEventListener('pointerleave', () => { over = false; });
  addEventListener('keydown', e => {
    if (e.altKey || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const inDock = d.contains(document.activeElement), t = e.target;
    if (!inDock && (!over || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
    const all = [...d.querySelectorAll('.dk')]; if (!all.length) return;
    if (e.key === 'ArrowRight') step(1, d); else if (e.key === 'ArrowLeft') step(-1, d);
    else if (e.key === 'Home') { all[0].focus({ preventScroll: true }); reveal(all[0]); } else if (e.key === 'End') { const l = all[all.length - 1]; l.focus({ preventScroll: true }); reveal(l); }
    else return;
    e.preventDefault(); e.stopPropagation();
  }, true);
  d.addEventListener('focusin', e => { const b = e.target.closest && e.target.closest('.dk'); if (b) reveal(b); });
  addEventListener('resize', () => scrollTo(off));
  d.addEventListener('pointerleave', calm);
  S.rectOf = appId => {
    const b = d.querySelector(`.dk[data-app="${CSS.escape(appId || 'finder')}"]`); if (!b) return null;
    const r = b.getBoundingClientRect(), s = $('#stage').getBoundingClientRect();
    return { x: (r.left - s.left) / S.scale, y: (r.top - s.top) / S.scale, w: r.width / S.scale };
  };
  on('wins', refresh); on('space', renderDock); on('lang', renderDock); on('extras', refresh);
  renderDock();
}
