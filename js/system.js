/* Fonds d'écran, Réglages système, À propos, notifications. */
import { S, WALLS, applyTheme, themeMode, on, spaceById } from './core.js';
import { h, $, store, brand } from './util.js';
import { t, lang, setLang, LANGS, sname } from './i18n.js';
import { sfx } from './audio.js';
import * as wm from './wm.js';

export const VERSION = '1.0.0';
export const logoSvg = (id = 'lg' + Math.random().toString(36).slice(2, 7)) => `<svg viewBox="0 0 100 100"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2d9bff"/><stop offset="1" stop-color="#7a5af8"/></linearGradient></defs><rect width="100" height="100" rx="23" fill="url(#${id})"/><rect x="17" y="21" width="66" height="42" rx="7" fill="#fff"/><rect x="17" y="21" width="66" height="9" rx="4" fill="#dfe6f5"/><circle cx="24" cy="25.5" r="2" fill="#ff5f57"/><circle cx="30" cy="25.5" r="2" fill="#febc2e"/><circle cx="36" cy="25.5" r="2" fill="#28c840"/><rect x="29" y="72" width="42" height="11" rx="5.5" fill="rgba(255,255,255,.55)"/></svg>`;

/* ---- fonds d'écran : un par bureau, qui glisse avec lui ---- */
const walls = () => store.get('walls', {});
const toneCache = {};
const DEFAULTS = { skyrim: 'dragon' };
export function curWall(space = S.cur) {
  const w = walls()[space]; if (w) return w;
  if (DEFAULTS[space]) return DEFAULTS[space];
  return document.documentElement.dataset.theme === 'dark' ? 'nuit' : 'aurore';
}
function toneOf(id) {
  if (toneCache[id]) return Promise.resolve(toneCache[id]);
  return new Promise(res => {
    const im = new Image();
    im.onload = () => {
      const c = document.createElement('canvas'); c.width = 64; c.height = 36; const x = c.getContext('2d'); x.drawImage(im, 0, 0, 64, 36);
      const d = x.getImageData(0, 0, 64, 3).data; let sum = 0; for (let i = 0; i < d.length; i += 4) sum += .2126 * d[i] + .7152 * d[i + 1] + .0722 * d[i + 2];
      res(toneCache[id] = sum / (d.length / 4) / 255 < .5 ? 'dark' : 'light');
    };
    im.onerror = () => res('dark'); im.src = `assets/wallpapers/${id}.jpg`;
  });
}
export function setWall(id, { user = false, instant = false, space = S.cur } = {}) {
  const w = WALLS.find(x => x.id === id) || WALLS[0], sp = document.getElementById('sp-' + space); if (!sp) return;
  if (user) { store.set('wallUser', true); const m = walls(); m[space] = w.id; store.set('walls', m); }
  const layers = sp.querySelectorAll('.swp .wl'), a = layers[0], b = layers[1];
  const top = a.classList.contains('front') ? b : a, old = top === a ? b : a;
  const img = new Image();
  img.onload = async () => {
    top.style.backgroundImage = `url(assets/wallpapers/${w.id}.jpg)`; top.style.transitionDuration = instant ? '0s' : '';
    top.classList.add('front'); old.classList.remove('front'); top.style.opacity = 1;
    setTimeout(() => { old.style.opacity = 0; }, instant ? 0 : 900);
    sp.dataset.tone = await toneOf(w.id); sp.dataset.wall = w.id; syncBar();
  };
  img.onerror = () => { top.style.opacity = 1; };
  img.src = `assets/wallpapers/${w.id}.jpg`;
  if (!instant && user) sfx.wall();
}
/* La barre des menus suit la luminosité du fond du bureau affiché (comme macOS) et le thème. */
export function syncBar() {
  const sp = document.getElementById('sp-' + S.cur), dark = (sp && sp.dataset.tone === 'dark') || document.documentElement.dataset.theme === 'dark';
  $('#stage').dataset.bar = dark ? 'dark' : 'light';
}
export function initWall() {
  S.spaces.forEach(sp => setWall(curWall(sp.id), { instant: true, space: sp.id }));
  on('space', syncBar);
  on('theme', ({ dark }) => {
    S.spaces.forEach(sp => { if (!walls()[sp.id] && !DEFAULTS[sp.id]) setWall(dark ? 'nuit' : 'aurore', { space: sp.id }); });
    syncBar();
  });
}

/* ---- notifications ---- */
export function toast({ icon, title, body, ms = 6000, onclick }) {
  const el = h('div', { class: 'toast glass', role: 'status' },
    icon ? h('img', { src: icon, alt: '' }) : null, h('div', {}, h('b', {}, title), h('p', {}, body)));
  if (onclick) { el.style.cursor = 'pointer'; el.onclick = () => { onclick(); gone(); }; }
  $('#layer').append(el); sfx.notif();
  el.animate([{ opacity: 0, transform: 'translateX(40px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.2,.9,.3,1.1)' });
  const gone = () => { el.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateX(40px)' }], { duration: 260 }).onfinish = () => el.remove(); };
  setTimeout(gone, ms);
}

/* ---- À propos (modèle Socle : colonne de 300 px, 28 px de marge) ---- */
export function openAbout() {
  wm.open({ id: 'about', appId: 'about', title: t('m.aboutApp'), w: 356, h: 470, resizable: false, cls: 'about', x: 622, y: 150,
    build: () => h('div', { class: 'ab' },
      h('div', { class: 'abi', html: logoSvg() }),
      h('h2', { html: brand('wSHOWCASE', 'var(--accent)') }),
      h('p', { class: 'mut' }, t('a.ver', { v: VERSION })),
      h('p', { class: 'ds' }, t('a.desc')),
      h('p', { class: 'au' }, 'Starbudweiser & Claude Code (Anthropic)'),
      h('p', {}, t('a.license')),
      h('p', { class: 'mut' }, t('a.asis')),
      h('p', { class: 'mut' }, t('a.note'))) });
}

/* ---- Réglages système ---- */
export function openSettings(tab = 'wall') {
  const tabs = [['wall', t('s.wall')], ['look', t('s.look')], ['sound', t('s.sound')], ['lang', t('s.lang')]];
  const w = wm.open({ id: 'settings', appId: 'settings', title: t('s.title'), w: 900, h: 590, minw: 640, minh: 440, cls: 'settings', bare: true,
    build: w => {
      const main = h('div', { class: 'sm' }), side = h('div', { class: 'ss' });
      const draw = id => {
        side.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.id === id)); main.innerHTML = '';
        if (id === 'wall') {
          const sec = (title, cat) => [h('h4', {}, title), h('div', { class: 'wg' }, WALLS.filter(x => x.cat === cat).map(x => h('button', { class: 'wc' + (curWall() === x.id ? ' on' : ''), onclick: () => { setWall(x.id, { user: true }); draw('wall'); } },
            h('i', { style: { backgroundImage: `url(assets/wallpapers/thumbs/${x.id}.jpg)` } }), h('span', {}, x.n[lang()]))))];
          main.append(h('h3', {}, t('s.wall')), h('p', { class: 'hint' }, t('s.wallFor', { s: sname(spaceById(S.cur)) })), ...sec(t('s.wallTes'), 'tes'), ...sec(t('s.wallGen'), 'gen'));
        } else if (id === 'look') {
          main.append(h('h3', {}, t('s.look')), h('div', { class: 'lg' }, [['light', t('cc.light')], ['dark', t('cc.dark')], ['auto', t('cc.auto')]].map(([v, l]) =>
            h('button', { class: 'lk lk-' + v + (themeMode() === v ? ' on' : ''), onclick: () => { applyTheme(v); sfx.click(); draw('look'); } }, h('i'), h('span', {}, l)))));
        } else if (id === 'sound') {
          main.append(h('h3', {}, t('s.sound')),
            h('label', { class: 'row' }, h('span', {}, t('s.soundOn')), h('button', { class: 'sw' + (sfx.on ? ' on' : ''), role: 'switch', 'aria-checked': sfx.on, onclick: () => { sfx.set(!sfx.on); draw('sound'); } }, h('i'))),
            h('label', { class: 'row' }, h('span', {}, t('s.volume')), h('input', { type: 'range', min: 0, max: 1, step: .05, value: sfx.vol, oninput: e => sfx.setVol(+e.target.value), onchange: () => sfx.click() })),
            h('div', { class: 'row' }, h('span', {}, t('s.chime')), h('button', { class: 'btn', onclick: () => sfx.chime() }, t('s.play'))));
        } else {
          main.append(h('h3', {}, t('s.lang')), h('div', { class: 'lgl' }, LANGS.map(l => h('button', { class: 'lgb' + (lang() === l ? ' on' : ''), onclick: () => setLang(l) }, ({ fr: 'Français', en: 'English', es: 'Español', it: 'Italiano' })[l]))));
        }
      };
      tabs.forEach(([id, l]) => side.append(h('button', { 'data-id': id, onclick: () => { draw(id); sfx.tick(); } }, l)));
      w.redraw = draw; draw(tab);
      return h('div', { class: 'sw-wrap' }, h('div', { class: 'stb', 'data-drag': '' }, wm.lights(w), h('b', {}, t('s.title'))), side, main);
    } });
  if (w && w.redraw) w.redraw(tab);
}
