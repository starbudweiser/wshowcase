/* Dock : icônes de l'espace courant, loupe, info-bulles, rebond au lancement, pastille d'appli ouverte. */
import { S, on, icon } from './core.js';
import { h, $, reduced } from './util.js';
import { t, lang } from './i18n.js';
import { isRunning } from './wm.js';
import { launch, openFinder, openSettings } from './apps.js';

export const FINDER_SVG = `<svg viewBox="0 0 100 100"><defs><linearGradient id="fg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fd0ff"/><stop offset="1" stop-color="#0a84ff"/></linearGradient></defs><rect width="100" height="100" rx="23" fill="#f3f5f9"/><path d="M0 23a23 23 0 0 1 23-23h30c-8 20-8 60 0 100H23A23 23 0 0 1 0 77z" fill="url(#fg1)"/><rect x="24" y="30" width="7" height="16" rx="3.5" fill="#12283d"/><rect x="67" y="30" width="7" height="16" rx="3.5" fill="#12283d"/><path d="M26 66c14 12 34 12 48 0" fill="none" stroke="#12283d" stroke-width="6" stroke-linecap="round"/></svg>`;
export const SETTINGS_SVG = `<svg viewBox="0 0 100 100"><defs><linearGradient id="sg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9bec7"/><stop offset="1" stop-color="#6a707a"/></linearGradient><linearGradient id="sg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#c9ced6"/></linearGradient></defs><rect width="100" height="100" rx="23" fill="url(#sg1)"/><path d="M45.5,21.4 L46.7,13.1 L53.3,13.1 L54.5,21.4 L60.4,22.9 L65.6,16.4 L71.3,19.7 L68.3,27.5 L72.5,31.7 L80.3,28.7 L83.6,34.4 L77.1,39.6 L78.6,45.5 L86.9,46.7 L86.9,53.3 L78.6,54.5 L77.1,60.4 L83.6,65.6 L80.3,71.3 L72.5,68.3 L68.3,72.5 L71.3,80.3 L65.6,83.6 L60.4,77.1 L54.5,78.6 L53.3,86.9 L46.7,86.9 L45.5,78.6 L39.6,77.1 L34.4,83.6 L28.7,80.3 L31.7,72.5 L27.5,68.3 L19.7,71.3 L16.4,65.6 L22.9,60.4 L21.4,54.5 L13.1,53.3 L13.1,46.7 L21.4,45.5 L22.9,39.6 L16.4,34.4 L19.7,28.7 L27.5,31.7 L31.7,27.5 L28.7,19.7 L34.4,16.4 L39.6,22.9Z" fill="url(#sg2)" stroke="#4a4f58" stroke-opacity=".35" stroke-width="1" stroke-linejoin="round"/><circle cx="50" cy="50" r="14" fill="#7c828c"/><circle cx="50" cy="50" r="10.5" fill="#565b64"/></svg>`;

/* ---- Dock refondu : ressorts physiques, les voisins s'écartent au lieu de se chevaucher, dossiers en éventail ---- */
const BASE = 64, GAIN = 0.62, SIGMA = 72, FOCUS_M = 1.45;
const mem = new WeakMap();
let raf = 0, ptr = null, last = 0, pop = null, over = false;
const kids = () => [...document.querySelectorAll('#dock .dkt > *')];
const isDk = el => el.classList.contains('dk');

export function renderDock(enter = true) {
  const d = $('#dock'); d.innerHTML = ''; closePop(false);
  const track = h('div', { class: 'dkt' }); d.append(track);
  const add = (key, label, content, fn) => {
    const b = h('button', { class: 'dk', 'data-app': key, 'data-label': label, 'aria-label': label, onclick: () => { bounce(b); fn(); } }, content, h('i', { class: 'dot' }));
    track.append(b); return b;
  };
  const mine = S.apps.filter(a => a.space === S.cur), sp = S.spaces.find(x => x.id === S.cur), seen = new Set();
  add('finder', 'Finder', h('div', { class: 'svg', html: FINDER_SVG }), () => openFinder());
  ((sp && sp.folders) || []).forEach(f => {
    const list = f.apps.map(id => mine.find(a => a.id === id)).filter(Boolean); if (!list.length) return; list.forEach(a => seen.add(a.id));
    const label = f.name[lang()] || f.name.en;
    const b = add('folder:' + f.id, label, h('div', { class: 'fi' }, list.slice(0, 4).map(a => h('img', { src: icon(a.id), alt: '', draggable: 'false' }))), () => {});
    b.classList.add('fold'); b.dataset.apps = list.map(a => a.id).join('|'); b.setAttribute('aria-haspopup', 'dialog');
    b.onclick = e => { bounce(b); pop && pop.dataset.f === f.id ? closePop() : openPop(b, f, label, list, e.detail === 0); };
  });
  mine.filter(a => !seen.has(a.id)).forEach(a => add(a.id, a.id, h('img', { src: icon(a.id), alt: '', draggable: 'false' }), () => launch(a.id)));
  track.append(h('i', { class: 'sep' }));
  add('settings', t('s.title'), h('div', { class: 'svg', html: SETTINGS_SVG }), () => openSettings());
  refresh();
  if (enter && !reduced()) [...track.querySelectorAll('.dk')].forEach((b, i) => b.firstElementChild.animate(
    [{ translate: '0 30px', scale: '.45', opacity: 0 }, { translate: '0 0', scale: '1', opacity: 1 }],
    { duration: 560, delay: 60 + i * 55, easing: 'cubic-bezier(.2,1.25,.3,1)', fill: 'backwards' }));
  kick();
}

/* rebond de lancement : deux sauts qui s'amortissent */
function bounce(b) {
  if (reduced()) return;
  b.animate([{ translate: '0 0' }, { translate: '0 -26px', offset: .24 }, { translate: '0 0', offset: .48 }, { translate: '0 -11px', offset: .68 }, { translate: '0 0', offset: .86 }, { translate: '0 -3px', offset: .94 }, { translate: '0 0' }],
    { duration: 760, easing: 'cubic-bezier(.3,.1,.3,1)' });
}

export function refresh() {
  const on = id => isRunning(id) || S.extras.has(id);
  document.querySelectorAll('#dock .dk').forEach(b => b.classList.toggle('run', b.dataset.apps ? b.dataset.apps.split('|').some(on) : on(b.dataset.app)));
}

/* ---- loupe : un ressort par icône, les voisins sont poussés de la largeur gagnée ---- */
function targetOf(b, rest, kbd) {
  if (!isDk(b)) return 1;
  if (ptr != null) { const dist = Math.abs(ptr - rest) / (S.scale || 1); return 1 + GAIN * Math.exp(-(dist * dist) / (2 * SIGMA * SIGMA)); }
  return kbd && b === document.activeElement ? FOCUS_M : 1;
}
function frame(ts) {
  const dt = Math.min(0.032, (ts - (last || ts)) / 1000); last = ts;
  const d = $('#dock'), ch = kids(), k = S.scale || 1, kbd = d.classList.contains('kbd'); let moving = false;
  const st = ch.map(b => { let s = mem.get(b); if (!s) { s = { m: 1, v: 0, off: 0 }; mem.set(b, s); } return s; });
  ch.forEach((b, i) => {
    const s = st[i], r = b.getBoundingClientRect(), rest = r.left + r.width / 2 - s.off * k, tg = targetOf(b, rest, kbd);
    s.v += ((tg - s.m) * 430 - s.v * 27) * dt; s.m += s.v * dt;
    if (Math.abs(tg - s.m) > 0.002 || Math.abs(s.v) > 0.02) moving = true; else { s.m = tg; s.v = 0; }
  });
  const del = ch.map((b, i) => (isDk(b) ? BASE * (st[i].m - 1) : 0)), total = del.reduce((a, c) => a + c, 0); let acc = 0;
  ch.forEach((b, i) => {
    const s = st[i]; s.off = acc + del[i] / 2 - total / 2; acc += del[i];
    b.style.transform = s.off ? `translateX(${s.off.toFixed(2)}px)` : '';
    if (isDk(b)) { b.style.setProperty('--m', st[i].m.toFixed(3)); b.style.zIndex = Math.round(st[i].m * 100); }
  });
  d.style.setProperty('--ex', total.toFixed(1) + 'px');
  if (moving || ptr != null) raf = requestAnimationFrame(frame); else { raf = 0; last = 0; }
}
const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

/* ---- dossiers : la grille jaillit du dossier, icône par icône ---- */
function closePop(anim = true) {
  document.querySelectorAll('#dock .dk.fold.open').forEach(b => b.classList.remove('open'));
  if (!pop) return;
  const p = pop; pop = null;
  if (anim && !reduced()) p.animate([{ opacity: 1, scale: '1' }, { opacity: 0, scale: '.6' }], { duration: 170, easing: 'cubic-bezier(.5,0,.8,.4)' }).finished.then(() => p.remove(), () => p.remove());
  else p.remove();
}
function openPop(btn, f, label, list, byKey) {
  closePop(false); btn.classList.add('open');
  const cols = Math.min(list.length, 4);
  const p = h('div', { class: 'dkpop', role: 'dialog', 'aria-label': label, 'data-f': f.id },
    h('div', { class: 'dkph' }, label),
    h('div', { class: 'dkpg', style: { '--c': cols } }, list.map(a => h('button', { class: 'dkpi', 'data-app': a.id, onclick: () => { closePop(); launch(a.id); } },
      h('img', { src: icon(a.id), alt: '', draggable: 'false' }), h('span', {}, a.id)))));
  $('#stage').append(p); pop = p;
  const st = $('#stage').getBoundingClientRect(), k = S.scale || 1, br = btn.getBoundingClientRect(), dr = $('#dock').getBoundingClientRect(), w = p.offsetWidth;
  const bx = (br.left + br.width / 2 - st.left) / k, left = Math.max(w / 2 + 16, Math.min(S.W - w / 2 - 16, bx));
  p.style.left = left + 'px'; p.style.bottom = ((st.bottom - dr.top) / k + 16) + 'px';
  p.style.transformOrigin = `${(bx - left) + w / 2}px 100%`;
  if (!reduced()) {
    p.animate([{ opacity: 0, scale: '.55' }, { opacity: 1, scale: '1' }], { duration: 380, easing: 'cubic-bezier(.2,1.15,.3,1)' });
    const fc = { x: br.left + br.width / 2, y: br.top + br.height / 2 };
    [...p.querySelectorAll('.dkpi img')].forEach((im, i) => {
      const r = im.getBoundingClientRect();
      im.animate([{ translate: `${(fc.x - (r.left + r.width / 2)) / k}px ${(fc.y - (r.top + r.height / 2)) / k}px`, scale: '.3', opacity: 0 }, { translate: '0 0', scale: '1', opacity: 1 }],
        { duration: 470, delay: 25 + i * 26, easing: 'cubic-bezier(.2,1.2,.3,1)', fill: 'backwards' });
    });
  }
  if (byKey) p.querySelector('.dkpi').focus();
  p.addEventListener('keydown', e => {
    const all = [...p.querySelectorAll('.dkpi')], i = all.indexOf(document.activeElement);
    const mv = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[e.key];
    if (mv !== undefined) { all[Math.max(0, Math.min(all.length - 1, i < 0 ? 0 : i + mv))].focus(); e.preventDefault(); e.stopPropagation(); }
    else if (e.key === 'Escape') { closePop(); btn.focus({ preventScroll: true }); $('#dock').classList.add('kbd'); kick(); e.preventDefault(); e.stopPropagation(); }
  });
}

/* ---- clavier et molette : on parcourt les icônes ---- */
function step(dir, d) {
  closePop(); d.classList.add('kbd');
  const all = [...d.querySelectorAll('.dk')], cur = all.indexOf(document.activeElement);
  const i = cur < 0 ? (dir > 0 ? 0 : all.length - 1) : Math.max(0, Math.min(all.length - 1, cur + dir));
  all[i].focus({ preventScroll: true }); kick();
}

export function init() {
  const d = $('#dock');
  d.addEventListener('pointermove', e => { if (e.pointerType === 'touch') return; ptr = e.clientX; if (d.classList.contains('kbd')) d.classList.remove('kbd'); kick(); });
  d.addEventListener('pointerenter', () => { over = true; });
  d.addEventListener('pointerleave', () => { over = false; ptr = null; kick(); });
  let wl = 0;
  d.addEventListener('wheel', e => {
    const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY; if (Math.abs(dx) < 4) return;
    e.preventDefault(); const now = performance.now(); if (now - wl < 120) return; wl = now; ptr = null; step(dx > 0 ? 1 : -1, d);
  }, { passive: false });
  /* flèches : actives quand le pointeur est sur le Dock ou qu'une de ses icônes a le focus (⌥← ⌥→ changent de bureau) */
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && pop) { closePop(); return; }
    if (e.altKey || e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (pop && pop.contains(document.activeElement)) return;
    const inDock = d.contains(document.activeElement), t = e.target;
    if (!inDock && (!over || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
    const all = [...d.querySelectorAll('.dk')]; if (!all.length) return;
    if (e.key === 'ArrowRight') step(1, d); else if (e.key === 'ArrowLeft') step(-1, d);
    else if (e.key === 'Home') { closePop(); d.classList.add('kbd'); all[0].focus({ preventScroll: true }); kick(); }
    else if (e.key === 'End') { closePop(); d.classList.add('kbd'); all[all.length - 1].focus({ preventScroll: true }); kick(); }
    else return;
    e.preventDefault(); e.stopPropagation();
  }, true);
  d.addEventListener('focusout', () => kick());
  addEventListener('pointerdown', e => { if (pop && !pop.contains(e.target) && !e.target.closest('#dock .dk.fold')) closePop(); }, true);
  addEventListener('resize', () => closePop(false));
  S.rectOf = appId => {
    const b = d.querySelector(`.dk[data-app="${CSS.escape(appId || 'finder')}"]`) || [...d.querySelectorAll('.dk.fold')].find(x => x.dataset.apps.split('|').includes(appId)); if (!b) return null;
    const r = b.getBoundingClientRect(), s = $('#stage').getBoundingClientRect(), k = S.scale || 1;
    return { x: (r.left - s.left) / k, y: (r.top - s.top) / k, w: BASE };
  };
  on('wins', refresh); on('space', () => renderDock()); on('lang', () => renderDock(false)); on('extras', refresh);
  renderDock();
}
