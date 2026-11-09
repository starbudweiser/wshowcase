/* Dock : icônes de l'espace courant, loupe, info-bulles, rebond au lancement, pastille d'appli ouverte. */
import { S, on, icon } from './core.js';
import { h, $ } from './util.js';
import { t } from './i18n.js';
import { isRunning } from './wm.js';
import { launch, openFinder, openSettings } from './apps.js';

export const FINDER_SVG = `<svg viewBox="0 0 100 100"><defs><linearGradient id="fg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fd0ff"/><stop offset="1" stop-color="#0a84ff"/></linearGradient></defs><rect width="100" height="100" rx="23" fill="#f3f5f9"/><path d="M0 23a23 23 0 0 1 23-23h30c-8 20-8 60 0 100H23A23 23 0 0 1 0 77z" fill="url(#fg1)"/><rect x="24" y="30" width="7" height="16" rx="3.5" fill="#12283d"/><rect x="67" y="30" width="7" height="16" rx="3.5" fill="#12283d"/><path d="M26 66c14 12 34 12 48 0" fill="none" stroke="#12283d" stroke-width="6" stroke-linecap="round"/></svg>`;
export const SETTINGS_SVG = `<svg viewBox="0 0 100 100"><defs><linearGradient id="sg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a7adb6"/><stop offset="1" stop-color="#5b616b"/></linearGradient></defs><rect width="100" height="100" rx="23" fill="url(#sg1)"/><circle cx="50" cy="50" r="27" fill="none" stroke="#f1f2f5" stroke-width="11" stroke-dasharray="10.6 10.6"/><circle cx="50" cy="50" r="22" fill="#f1f2f5"/><circle cx="50" cy="50" r="10" fill="#666c76"/></svg>`;

let raf = 0;
export function renderDock() {
  const d = $('#dock'); d.innerHTML = '';
  const add = (key, label, content, fn) => {
    const b = h('button', { class: 'dk', 'data-app': key, 'data-label': label, 'aria-label': label,
      onclick: () => { b.classList.remove('bounce'); void b.offsetWidth; b.classList.add('bounce'); fn(); } }, content, h('i', { class: 'dot' }));
    d.append(b); return b;
  };
  add('finder', 'Finder', h('div', { class: 'svg', html: FINDER_SVG }), () => openFinder());
  S.apps.filter(a => a.space === S.cur).forEach(a => add(a.id, a.id, h('img', { src: icon(a.id), alt: '', draggable: 'false' }), () => launch(a.id)));
  d.append(h('i', { class: 'sep' }));
  add('settings', t('s.title'), h('div', { class: 'svg', html: SETTINGS_SVG }), () => openSettings());
  refresh();
}

export function refresh() {
  document.querySelectorAll('#dock .dk').forEach(b => b.classList.toggle('run', isRunning(b.dataset.app) || S.extras.has(b.dataset.app)));
}

export function init() {
  const d = $('#dock');
  d.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => d.querySelectorAll('.dk').forEach(b => {
      const r = b.getBoundingClientRect(), dist = Math.abs(e.clientX - (r.left + r.width / 2)) / S.scale;
      b.style.setProperty('--m', (1 + 0.78 * Math.exp(-(dist * dist) / (2 * 66 * 66))).toFixed(3));
    }));
  });
  d.addEventListener('pointerleave', () => d.querySelectorAll('.dk').forEach(b => b.style.removeProperty('--m')));
  S.rectOf = appId => {
    const b = d.querySelector(`.dk[data-app="${CSS.escape(appId || 'finder')}"]`); if (!b) return null;
    const r = b.getBoundingClientRect(), s = $('#stage').getBoundingClientRect();
    return { x: (r.left - s.left) / S.scale, y: (r.top - s.top) / S.scale, w: r.width / S.scale };
  };
  on('wins', refresh); on('space', renderDock); on('lang', renderDock); on('extras', refresh);
  renderDock();
}
