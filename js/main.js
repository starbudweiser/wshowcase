/* Point d'entrée : page d'accueil, démarrage du Mac (son compris), bureau, extinction. */
import { S, loadData, applyTheme, on, emit, spaceById, appById } from './core.js';
import { $, h, store, wait, reduced, APPLE, brand } from './util.js';
import { initLang, t, applyStatic, tag, sname, lang } from './i18n.js';
import { sfx } from './audio.js';
import * as wm from './wm.js';
import * as spaces from './spaces.js';
import * as dock from './dock.js';
import * as menubar from './menubar.js';
import { initWall, toast, logoSvg } from './system.js';
import { openFinder, launch } from './apps.js';
import './spotlight.js';
import './cc.js';

let macReady = false, powered = false;

/* ---------- échelle 16:9 ---------- */
function fit() {
  const s = Math.min(innerWidth / 1600, innerHeight / 900); S.scale = s;
  S.W = Math.round(innerWidth / s); S.H = Math.round(innerHeight / s);
  const st = $('#stage'); st.style.width = S.W + 'px'; st.style.height = S.H + 'px'; st.style.transform = `scale(${s})`;
  emit('fit');
  document.body.classList.toggle('portrait', innerHeight > innerWidth);
}
const stageRect = () => ({ left: 0, top: 0, width: innerWidth, height: innerHeight });

/* ---------- liens profonds : #skyrim, #util, #skyrim/mTRANSLATOR ---------- */
function parseHash() {
  const [a, b] = decodeURIComponent(location.hash.slice(1)).split('/');
  const sp = ({ skyrim: 'skyrim', toolkit: 'skyrim', util: 'util', pro: 'pro', desktop: 'util', utilitaires: 'util', utilities: 'util' })[(a || '').toLowerCase()];
  const app = S.apps.find(x => x.id.toLowerCase() === (b || a || '').toLowerCase());
  return { space: sp || (app && app.space) || null, app: app && (b || !sp) ? app.id : null };
}

/* ---------- page d'accueil ---------- */
function buildIntro() {
  const pv = $('#pvscreen'); pv.querySelectorAll('.pvgen').forEach(x => x.remove());
  const dk = [{ svg: dock.FINDER_SVG }, { id: 'mCLEAN' }, { id: 'mPDF' }, { svg: dock.SETTINGS_SVG }];
  pv.prepend(h('div', { class: 'pvwp pvgen' }), h('div', { class: 'pvmb pvgen' }, h('i', { html: APPLE }), h('b', {}, 'Finder'), h('span', {}, '9:41')),
    h('div', { class: 'pvdock pvgen' }, dk.map(a => a.svg ? h('span', { html: a.svg }) : h('img', { src: `assets/icons/${a.id}.png`, alt: '', draggable: 'false' }))));
  $('#intro .eyebrow').textContent = t('l.eyebrow', { n: S.apps.length });
}
function powerOn(spaceId) {
  if (powered) return; powered = true; sfx.unlock();
  const hs = parseHash(); if (spaceId) S.cur = spaceId; else if (hs.space) S.cur = hs.space; else S.cur = 'util';
  /* transition franche : un iris noir jaillit du bouton et couvre la page, puis l'écran de démarrage */
  const btn = $('#cta').getBoundingClientRect(), bt = $('#boot');
  const ox = Math.round(btn.left + btn.width / 2) + 'px', oy = Math.round(btn.top + btn.height / 2) + 'px';
  $('#mac').hidden = false; $('#mac').classList.add('off');
  $('#boot .blogo').style.opacity = 0; $('#boot .bbar i').style.width = '0%';
  bt.hidden = false; bt.classList.remove('out'); bt.style.clipPath = `circle(0px at ${ox} ${oy})`;
  const R = Math.ceil(Math.hypot(Math.max(+ox.slice(0, -2), innerWidth - +ox.slice(0, -2)), Math.max(+oy.slice(0, -2), innerHeight - +oy.slice(0, -2)))) + 8;
  const anim = reduced() ? null : bt.animate([{ clipPath: `circle(0px at ${ox} ${oy})` }, { clipPath: `circle(${R}px at ${ox} ${oy})` }], { duration: 520, easing: 'cubic-bezier(.75,0,.25,1)', fill: 'forwards' });
  (anim ? anim.finished : Promise.resolve()).then(async () => {
    bt.style.clipPath = ''; if (anim) anim.cancel(); $('#intro').hidden = true; document.body.classList.add('mac-on');
    await boot(); arrive(hs);
  });
}
async function boot() {
  const logo = $('#boot .blogo'), bar = $('#boot .bbar i'); bar.style.width = '0%'; logo.style.opacity = 0;
  let skip = false; const sk = () => { skip = true; }; addEventListener('keydown', sk, { once: true }); $('#boot').addEventListener('pointerdown', sk, { once: true });
  const w = ms => skip ? Promise.resolve() : wait(reduced() ? ms / 4 : ms);
  await w(500); sfx.chime(); await w(700); logo.style.transition = 'opacity 1s'; logo.style.opacity = 1; await w(1000);
  const steps = [8, 19, 31, 44, 52, 66, 78, 91, 100];
  for (const p of steps) { bar.style.width = p + '%'; await w(p < 60 ? 340 : 280); }
  await w(450); removeEventListener('keydown', sk);
  if (!macReady) await prepareMac();
}
async function prepareMac() {
  spaces.init(); initWall(); dock.init(); menubar.init(); macReady = true;
  const hs = parseHash(); if (hs.space) await spaces.go(hs.space, { instant: true });
}
async function arrive(hs) {
  const mac = $('#mac'); mac.classList.remove('off'); $('#boot').classList.add('out'); await wait(reduced() ? 50 : 900); $('#boot').hidden = true;
  openFinder();
  setTimeout(() => toast({ icon: 'assets/icons/' + (S.cur === 'skyrim' ? 'sKYCRASH' : 'mCLEAN') + '.png', title: t('n.welcome'), body: t('n.body'), onclick: () => hs.app && launch(hs.app) }), 1400);
  if (hs.app) setTimeout(() => launch(hs.app), 900);
  visited.clear(); visited.add(S.cur);
  if (!hashBound) {
    hashBound = true;
    addEventListener('hashchange', async () => { const x = parseHash(); if (x.space) await spaces.go(x.space); if (x.app) launch(x.app); });
    /* première visite d'un bureau : un Finder s'y ouvre pour accueillir le visiteur */
    on('space', id => { if (visited.has(id)) return; visited.add(id); setTimeout(() => openFinder(), 650); });
  }
}
const visited = new Set(); let hashBound = false;

/* ---------- alimentation ---------- */
async function power(what) {
  if (!macReady) return;
  S.extras.forEach(x => x.quit && x.quit());
  [...wm.wins.keys()].forEach(id => { const w = wm.wins.get(id); try { w.o.onclose && w.o.onclose(w); } catch (e) {} w.el.remove(); wm.wins.delete(id); });
  emit('wins', null);
  const mac = $('#mac'), cover = $('#boot');
  cover.hidden = false; cover.classList.add('out'); cover.getBoundingClientRect(); cover.classList.remove('out');
  if (what === 'off') {
    sfx.off(); await wait(1700);
    mac.hidden = true; cover.hidden = true; $('#intro').hidden = false; document.body.classList.remove('mac-on'); powered = false; macReady = false; scrollTo(0, 0);
    $('#sps').innerHTML = ''; $('#dock').innerHTML = '';
  } else {
    await wait(700); await boot(); arrive({});
  }
}
on('power', power);

/* ---------- changement de langue : reconstruit ce qui est affiché ---------- */
on('lang', async () => {
  applyStatic(); buildIntro();
  if (!macReady) return;
  const reopen = []; wm.wins.forEach(w => { if (w.render) w.render(); else if (w.redraw) w.redraw(); else if (S.apps.some(a => a.id === w.appId)) reopen.push(w.appId); });
  reopen.forEach(id => { [...wm.wins.values()].filter(w => w.appId === id).forEach(w => { try { w.o.onclose && w.o.onclose(w); } catch (e) {} w.el.remove(); wm.wins.delete(w.id); }); launch(id); });
});

/* ---------- démarrage ---------- */
(async function start() {
  initLang(); applyTheme(store.get('theme', 'auto'));
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (document.documentElement.dataset.mode === 'auto') applyTheme('auto'); });
  await loadData(); applyStatic(); buildIntro(); fit(); addEventListener('resize', fit);
  ['#mac', '#stage', '#sps'].forEach(q => $(q).addEventListener('scroll', e => { e.target.scrollLeft = 0; e.target.scrollTop = 0; })); /* garde-fou */
  $('#cta').addEventListener('click', () => powerOn());
  $('#ilogo').innerHTML = logoSvg(); $('#boot .blogo').innerHTML = APPLE;
  document.querySelectorAll('#intro [data-go]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); powerOn(a.dataset.go); }));
  document.body.classList.add('ready');
  /* lien direct (#skyrim, #skyrim/mORTEX…, depuis skyrimtools.com) : le Mac démarre tout seul, sans passer par l'accueil */
  if (parseHash().space) powerOn();
})();
