/* Lecteur vidéo du bureau Skyrim : la présentation du kit (1 min, fichier local sous-titré) puis la playlist de la chaîne YouTube. */
import { h, $ } from './util.js';
import * as wm from './wm.js';
import { lang } from './i18n.js';
import { S } from './core.js';

let LIST = null;
const T = (fr, en) => (lang() === 'fr' ? fr : en);
const thumb = v => v.poster || `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`;

export async function open() {
  if (!LIST) LIST = await (await fetch('data/videos.json')).json();
  let cur = 0, root;
  const w = wm.open({
    id: 'player', appId: 'player', title: T('Vidéos', 'Videos'), w: 980, h: 560, cls: 'vplayer', space: 'skyrim',
    build: () => { root = h('div', { class: 'vp' }); draw(); return root; },
    onclose: () => { if (root) root.innerHTML = ''; }
  });
  function stage(v) {
    if (v.local) {
      const vid = h('video', { src: v.local, poster: v.poster, controls: '', playsinline: '', preload: 'metadata', crossorigin: 'anonymous' });
      ['fr', 'en'].forEach(l => vid.append(h('track', { kind: 'subtitles', src: `assets/video/kit.${l}.vtt`, srclang: l, label: l === 'fr' ? 'Français' : 'English', default: l === lang() ? '' : null })));
      vid.addEventListener('ended', () => go(cur + 1));
      vid.play().catch(() => {});
      return vid;
    }
    return h('iframe', { src: `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0&hl=${lang()}&cc_lang_pref=${lang()}`, allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen', allowfullscreen: '', title: v.title, referrerpolicy: 'strict-origin-when-cross-origin' });
  }
  function go(i) { if (i >= LIST.length) return; cur = i; draw(); }
  function draw() {
    root.innerHTML = ''; const v = LIST[cur];
    root.append(
      h('div', { class: 'vp-main' }, h('div', { class: 'vp-stage' }, stage(v)),
        h('div', { class: 'vp-info' }, h('b', {}, v.title), h('span', {}, `${v.dur}${v.local ? ' · ' + T('présentation du kit', 'kit presentation') : ''}`),
          h('a', { href: `https://youtu.be/${v.yt || v.id}`, target: '_blank', rel: 'noopener', 'data-nodrag': '' }, T('Ouvrir sur YouTube', 'Open on YouTube') + ' ↗'))),
      h('aside', { class: 'vp-side' }, h('div', { class: 'vp-h' }, T('Playlist', 'Playlist'), h('i', {}, `${LIST.length}`)),
        h('div', { class: 'vp-list' }, LIST.map((x, i) => h('button', { class: 'vp-it' + (i === cur ? ' on' : ''), onclick: () => go(i), 'data-nodrag': '' },
          h('span', { class: 'vp-th', style: { backgroundImage: `url(${thumb(x)})` } }, h('em', {}, x.dur)), h('span', { class: 'vp-t' }, x.title))))));
  }
  w.render = draw;
  return w;
}
