/* mSTAGRAM : un réseau social en version téléphone, dans un iPhone sur le Mac. Démo : défilement, double-clic pour aimer, aucun vrai compte. */
import { icon } from '../core.js';
import { h, brand } from '../util.js';
import { t, lang } from '../i18n.js';
import { sfx } from '../audio.js';
import * as wm from '../wm.js';
import { download } from '../apps.js';
import { toast } from '../system.js';

const T = (fr, en) => (lang() === 'fr' ? fr : en);
const POSTS = [
  { u: 'northern.lights', g: ['#0f2027', '#2c5364', '#30d158'], c: T('Aurore sur le fjord', 'Aurora over the fjord'), l: 1284, glyph: '❄' },
  { u: 'dune.studio', g: ['#ffb347', '#ff6f61', '#6a3093'], c: T('Heure dorée', 'Golden hour'), l: 862, glyph: '☀' },
  { u: 'mac.setup', g: ['#1a1a2e', '#16213e', '#0a84ff'], c: T('Nouveau bureau', 'New desk setup'), l: 2310, glyph: '⌘' }
];

export function open(app) {
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 410, h: 800, x: 600, y: 60, resizable: false, bare: true, cls: 'phonewin',
    build: w => {
      const feed = h('div', { class: 'pfeed' });
      POSTS.forEach(p => {
        let liked = false, n = p.l;
        const likes = h('b', {}, n.toLocaleString(lang() === 'fr' ? 'fr-FR' : 'en-US')), heart = h('i', { class: 'bigheart' }, '♥');
        const btn = h('button', { class: 'plike', 'aria-label': 'Like', onclick: () => like() }, '♥');
        const like = (force) => { if (force && liked) return; liked = force ? true : !liked; n += liked ? 1 : -1; likes.textContent = n.toLocaleString(lang() === 'fr' ? 'fr-FR' : 'en-US'); btn.classList.toggle('on', liked); if (liked) sfx.pop(); else sfx.tick(); };
        const img = h('div', { class: 'pimg', style: { background: `linear-gradient(160deg,${p.g[0]},${p.g[1]} 55%,${p.g[2]})` }, ondblclick: () => { like(true); heart.animate([{ transform: 'translate(-50%,-50%) scale(.2)', opacity: 1 }, { transform: 'translate(-50%,-50%) scale(1.3)', opacity: 1, offset: .5 }, { transform: 'translate(-50%,-50%) scale(1.5)', opacity: 0 }], { duration: 700, easing: 'ease-out' }); } }, h('span', { class: 'pgl' }, p.glyph), heart);
        feed.append(h('article', { class: 'ppost' }, h('div', { class: 'phd' }, h('i', { class: 'pav', style: { background: `linear-gradient(135deg,${p.g[2]},${p.g[0]})` } }), h('b', {}, p.u)), img, h('div', { class: 'pact' }, btn, likes, h('span', { class: 'mut' }, T(' mentions j’aime', ' likes'))), h('p', { class: 'pcap' }, h('b', {}, p.u + ' '), p.c)));
      });
      const stories = h('div', { class: 'pstories' }, POSTS.concat(POSTS).map((p, i) => h('div', { class: 'pst' }, h('i', { style: { background: `linear-gradient(135deg,${p.g[2]},${p.g[1]})` } }), h('small', {}, p.u.split('.')[0]))));
      return h('div', { class: 'phone' }, h('div', { class: 'pbtn', 'data-drag': '' }, wm.lights(w)), h('div', { class: 'pscreen' }, h('div', { class: 'pisland' }), h('div', { class: 'pstatus' }, h('span', {}, '9:41'), h('span', {}, '●●●  100 %')),
        h('div', { class: 'ptop' }, h('b', { html: brand('mSTAGRAM', app.accent) }), h('span', { class: 'mut' }, T('Version téléphone', 'Phone version'))), stories, feed,
        h('div', { class: 'ptab' }, h('span', {}, '⌂'), h('span', {}, '⌕'), h('span', {}, '＋'), h('span', {}, '♥'), h('span', {}, '☺'))),
        h('button', { class: 'pdl btn', onclick: () => download(app), disabled: !app.download }, t('f.download')));
    } });
}
