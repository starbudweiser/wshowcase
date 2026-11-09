/* Parcours guidé : les vraies captures de l'appli, étape par étape, avec lecture automatique. */
import { icon } from './core.js';
import { h, brand, reduced } from './util.js';
import { t, lang, tag } from './i18n.js';
import { sfx } from './audio.js';
import * as wm from './wm.js';
import { download, repoUrl } from './apps.js';

export function open(app) {
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 1000, h: 690, minw: 640, minh: 460, cls: 'tourwin',
    onclose: w => clearInterval(w.timer),
    build: w => {
      let k = 0, playing = !reduced();
      const root = h('div', { class: 'tour' });
      const stage = h('div', { class: 'tstage' });
      const set = lang() === 'fr' ? 'fr' : 'en', n = app.shots || 0;
      const imgs = [];
      for (let i = 1; i <= n; i++) { const im = h('img', { src: `assets/shots/${set}/${app.id}_${i}.jpg`, alt: `${app.id} ${i}`, draggable: 'false' }); imgs.push(im); stage.append(im); }
      if (!n) stage.append(h('div', { class: 'art', style: { '--c': app.accent } }, h('img', { src: icon(app.id), alt: '' }), h('div', { class: 'at', html: brand(app.id, app.accent) }), h('p', {}, tag(app)), h('small', {}, t('t.noshots'))));
      const dots = h('div', { class: 'tdots' });
      const prev = h('button', { class: 'btn', 'aria-label': t('t.prev'), onclick: () => go(k - 1, true) }, '‹'), next = h('button', { class: 'btn', 'aria-label': t('t.next'), onclick: () => go(k + 1, true) }, '›');
      const play = h('button', { class: 'btn', onclick: () => { playing = !playing; play.textContent = playing ? t('t.pause') : t('t.play'); if (playing) loop(); else clearInterval(w.timer); } }, playing ? t('t.pause') : t('t.play'));
      const cap = h('div', { class: 'tcap' }, h('b', {}, n ? t('t.step', { i: 1, n }) : t('t.tour')), h('span', {}, tag(app)));
      for (let i = 0; i < n; i++) dots.append(h('button', { class: 'd' + (i ? '' : ' on'), 'aria-label': t('t.step', { i: i + 1, n }), onclick: () => go(i, true) }, h('i')));
      function go(i, manual) {
        if (!n) return; k = (i + n) % n;
        imgs.forEach((im, j) => im.classList.toggle('on', j === k)); [...dots.children].forEach((d, j) => d.classList.toggle('on', j === k));
        cap.firstChild.textContent = t('t.step', { i: k + 1, n }); if (manual) { sfx.tick(); if (playing) loop(); }
      }
      function loop() { clearInterval(w.timer); w.timer = setInterval(() => go(k + 1), 4200); }
      const bar = h('div', { class: 'tbar' }, h('img', { src: icon(app.id), alt: '', draggable: 'false' }), cap, n > 1 ? h('div', { class: 'tctl' }, prev, dots, next, play) : null,
        h('div', { class: 'tact' },
          h('a', { class: 'lnk', href: repoUrl(app), target: '_blank', rel: 'noopener' }, 'GitHub'),
          app.download ? h('button', { class: 'btn pri', onclick: () => download(app) }, t('f.download')) : h('button', { class: 'btn', disabled: true }, t('f.soon'))));
      root.append(stage, bar); go(0); if (playing && n > 1) loop();
      return root;
    } });
}
