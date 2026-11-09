/* Barre des menus : menu pomme, menus de l'appli active, extras (applis de barre des menus), centre de contrôle, Spotlight, horloge. */
import { S, on, appById } from './core.js';
import { h, $, APPLE } from './util.js';
import { t, lang } from './i18n.js';
import { sfx } from './audio.js';
import * as wm from './wm.js';
import { go } from './spaces.js';
import { openFinder, openSettings, openAbout, power, download } from './apps.js';
import * as finder from './finder.js';
import { toggleCC } from './cc.js';
import { toggleSpot } from './spotlight.js';

let ctx = null, open = null;
const ICON_CC = '<svg viewBox="0 0 16 16"><rect x="1.5" y="3" width="13" height="4" rx="2" fill="none" stroke="currentColor"/><circle cx="5" cy="5" r="1.3" fill="currentColor"/><rect x="1.5" y="9" width="13" height="4" rx="2" fill="none" stroke="currentColor"/><circle cx="11" cy="11" r="1.3" fill="currentColor"/></svg>';
const ICON_SP = '<svg viewBox="0 0 16 16"><circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10.5 10.5 14 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

function menus() {
  const app = ctx ? appById(ctx) : null, name = app ? app.id : ctx === 'settings' ? t('s.title') : ctx === 'about' ? 'wSHOWCASE' : 'Finder';
  const w = S.active, closeW = () => w && wm.close(w.id);
  const sys = ctx === 'settings' || ctx === 'about';
  const appMenu = app ? [
    { l: t('m.about', { app: name }), fn: () => finder.open({ select: app.id }) }, { sep: 1 },
    { l: t('m.download', { app: name }), fn: () => download(app), dis: !app.download }, { sep: 1 },
    { l: t('m.quit', { app: name }), fn: () => wm.byApp(ctx).forEach(x => wm.close(x.id)) }
  ] : [{ l: t('m.aboutFinder'), fn: openAbout }, { sep: 1 }, { l: t('m.settings'), fn: () => openSettings() }];
  const list = [{ l: name, bold: 1, items: appMenu }];
  list.push({ l: t('m.file'), items: [
    { l: t('m.newFinder'), fn: () => openFinder({ fresh: true }) },
    { l: t('m.close'), fn: closeW, dis: !w }
  ] });
  if (ctx === 'finder' || !ctx) list.push({ l: t('m.view'), items: ['icons', 'list', 'gallery'].map(v => ({ l: t('f.' + v), check: finder.view() === v, fn: () => finder.setView(v) })) });
  list.push({ l: t('m.go'), items: [
    ...S.spaces.map((sp, i) => ({ l: sp.name[lang()] || sp.name.fr, k: i ? '⌥→' : '⌥←', fn: () => go(sp.id), check: S.cur === sp.id })),
    { sep: 1 }, { l: t('m.search'), k: '⌘K', fn: () => toggleSpot() }
  ] });
  list.push({ l: t('m.window'), items: [
    { l: t('m.minimize'), fn: () => w && wm.minimize(w.id), dis: !w }, { l: t('m.zoom'), fn: () => w && wm.toggleMax(w.id), dis: !w }
  ] });
  list.push({ l: t('m.help'), items: [
    { l: t('m.helpSite'), fn: () => window.open('https://skyrimtools.com', '_blank', 'noopener') },
    { l: t('m.helpGh'), fn: () => window.open(`https://github.com/${S.owner}`, '_blank', 'noopener') }
  ] });
  return list;
}
const appleItems = () => [
  { l: t('m.aboutApp'), fn: openAbout }, { sep: 1 },
  { l: t('m.settings'), fn: () => openSettings() }, { l: t('m.wallpaper'), fn: () => openSettings('wall') }, { sep: 1 },
  { l: t('m.restart'), fn: () => power('restart') }, { l: t('m.shutdown'), fn: () => power('off') }
];

export function showMenu(anchor, items, align = 'left') {
  closeMenu();
  const m = h('div', { class: 'menu', role: 'menu' });
  items.forEach(i => {
    if (i.sep) return m.append(h('hr'));
    const el = h('button', { class: 'mi' + (i.dis ? ' dis' : ''), role: 'menuitem', disabled: i.dis },
      h('span', { class: 'ck' }, i.check ? '✓' : ''), h('span', { class: 'lb' }, i.l), h('span', { class: 'ks' }, i.k || ''));
    el.addEventListener('click', () => { sfx.click(); closeMenu(); i.fn && i.fn(); });
    m.append(el);
  });
  $('#layer').append(m);
  const r = anchor.getBoundingClientRect(), s = $('#stage').getBoundingClientRect();
  const x = (r.left - s.left) / S.scale, y = (r.bottom - s.top) / S.scale + 2, mw = m.offsetWidth;
  m.style.left = (align === 'right' ? Math.min(1600 - mw - 8, x + r.width / S.scale - mw) : x) + 'px'; m.style.top = y + 'px';
  anchor.classList.add('open'); open = { anchor, m };
  setTimeout(() => addEventListener('pointerdown', away, { once: true, capture: true }), 0);
}
const away = e => { if (open && !open.m.contains(e.target)) closeMenu(); };
export function closeMenu() { if (open) { open.m.remove(); open.anchor.classList.remove('open'); open = null; } }

function clock() {
  const el = $('#clock'); if (!el) return;
  el.textContent = new Date().toLocaleString(lang(), { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).replace(',', '');
}
export function render() {
  const bar = $('#menubar'); bar.innerHTML = '';
  const apple = h('button', { class: 'mb apple', 'aria-label': 'Menu', html: APPLE });
  apple.onclick = () => (open && open.anchor === apple ? closeMenu() : showMenu(apple, appleItems()));
  const left = h('div', { class: 'mbl' }, apple);
  menus().forEach(m => {
    const b = h('button', { class: 'mb' + (m.bold ? ' bold' : '') }, m.l);
    b.onclick = () => (open && open.anchor === b ? closeMenu() : showMenu(b, m.items));
    b.onpointerenter = () => { if (open && open.anchor !== b) showMenu(b, m.items); };
    left.append(b);
  });
  apple.onpointerenter = () => { if (open && open.anchor !== apple) showMenu(apple, appleItems()); };
  const right = h('div', { class: 'mbr' });
  S.extras.forEach(x => right.append(x.el));
  right.append(h('button', { class: 'mb ico', 'aria-label': t('cc.title'), html: ICON_CC, onclick: e => toggleCC(e.currentTarget) }),
    h('button', { class: 'mb ico', 'aria-label': t('sp.ph'), html: ICON_SP, onclick: () => toggleSpot() }),
    h('span', { class: 'mb clock', id: 'clock' }));
  bar.append(left, right); clock();
}
export function init() {
  render(); setInterval(clock, 20000);
  on('focus', w => { ctx = w ? w.appId : null; closeMenu(); render(); });
  on('lang', render); on('extras', render); on('space', render);
  addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
}
