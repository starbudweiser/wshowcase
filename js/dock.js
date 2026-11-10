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
      const m = 1 + 0.78 * Math.exp(-(dist * dist) / (2 * 66 * 66)); b.style.setProperty('--m', m.toFixed(3)); b.style.zIndex = Math.round(m * 100);
    }));
  });
  d.addEventListener('pointerleave', () => d.querySelectorAll('.dk').forEach(b => { b.style.removeProperty('--m'); b.style.zIndex = ''; }));
  S.rectOf = appId => {
    const b = d.querySelector(`.dk[data-app="${CSS.escape(appId || 'finder')}"]`); if (!b) return null;
    const r = b.getBoundingClientRect(), s = $('#stage').getBoundingClientRect();
    return { x: (r.left - s.left) / S.scale, y: (r.top - s.top) / S.scale, w: r.width / S.scale };
  };
  on('wins', refresh); on('space', renderDock); on('lang', renderDock); on('extras', refresh);
  renderDock();
}
