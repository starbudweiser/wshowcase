/* Saison 2, chapitre 15 : quatre-vingt-huit lieues à l'heure. Place d'une petite ville des années 50, la nuit, sous l'orage. Le savant
   veut un véhicule : le Wabbajack couvre la charrette d'inox ; le cheval plafonne à douze lieues : changé en cheval nordique, il grimpe
   le clocher à la verticale ; le câble accroché à l'aiguille, le Cri de tempête appelle la foudre, la charrette disparaît dans deux
   traînées de feu et revient fumante. Coordonnées logiques 480 × 270 (décor 960 × 540). */
import { zap, twinkle, lightning, fireTrails, hit } from '../engine/fx2.js';
import { wabZap, wabSwap, sheoPops, nextChapter, mid, tip } from './s2_common.js';

const CLOCK = [277, 35];

export default {
  id: 's2_15', hd: true, bg: 's2/d_square.webp', music: 's2_15_voyage', amb: ['storm', 0.45], steps: 'stone',
  persp: [205, 0.37, 268, 0.62], walkK: 1.9, blockR: [16, 6],
  /* nuit d'orage : teinte froide, le réverbère et les fenêtres réchauffent */
  light: { tint: '#7d8fb8', k: 0.42, lamps: [{ x: 107, y: 90, r: 170, col: '#ffbf60', k: 0.9 }, { x: 288, y: 150, r: 120, col: '#ffb050', k: 0.4 }] },
  walk: [[[4, 214], [100, 214], [110, 206], [330, 204], [476, 212], [476, 268], [4, 268]]],
  start: { x: 150, y: 240, dir: 'r' },
  fx: { rain: { n: 170 }, storm: true, lights: [{ x: 107, y: 99, r: 26, col: '#ffbf60', a: 0.8, fl: 0.15 }, { x: 277, y: 35, r: 20, col: '#fff0b0', a: 0.45, fl: 0, breathe: 0.9 }, { x: 276, y: 147, r: 18, col: '#ffb050', a: 0.5, fl: 0.2 }] },
  hot: [
    { id: 's15tower', rect: [256, 8, 304, 62] }, { id: 's15cable', poly: [[100, 74], [262, 20], [268, 34], [108, 92]], at: [118, 216] },
    { id: 's15bench', rect: [32, 172, 97, 210], at: [64, 220] }, { id: 's15lamp', rect: [100, 80, 114, 206], at: [118, 216] },
    { id: 's15shops', rect: [0, 120, 205, 172] }, { id: 's15shops', rect: [372, 100, 480, 190] }
  ],
  preload: ['s2:p_cart15s', 's2:p_cart15n', 's2:doc_hair', 's2:hero_kid', 's2:hero_bucket'],
  ents: [
    { id: 's15cart', spr: 's2:p_cart15', x: 336, y: 234, kz: 1.2, hot: true, at: [236, 246], block: [92, 7], name: 'n.s15cart' },
    { id: 'doc', spr: 's2:doc', x: 196, y: 228, hot: true, at: [166, 238] },
    { id: 'boy', spr: 's2:boy15', x: 456, y: 218, hot: true, at: [440, 236], flip: false },   /* dégagé de la charrette : aucun membre caché */
    { id: 'board', spr: 's2:p_board15', x: 466, y: 221, scale: 0.36, hot: true, solid: false, noShadow: false, at: [440, 236] },
    { id: 'photo15', spr: 's2:p_photo15', x: 72, y: 186, z: 40, scale: 0.26, hot: true, solid: false, noShadow: true, at: [64, 220] },
    { id: 'sheo', spr: 's2:sheo', x: 300, y: 240, hot: false, visible: false, aura: { col: '#c77dff', r: 0.6, a: 0.35, wisps: 3 } }
  ],

  async enter(g, how) {
    const F = k => g.flag(k), c = g.ent('s15cart');
    if (F('cartSteel')) c.spr = 's2:p_cart15s';
    if (F('cartUp')) { c.spr = 's2:p_cart15n'; Object.assign(c, { x: 281, y: 104, rot: Math.PI / 2, scale: 0.34, kz: undefined, hot: false, block: null }); }
    if (F('boardUp')) Object.assign(g.ent('board'), { float: 14 });
    if (how.intro) g.fx.fade = { from: 1, to: 1, t0: g.now, ms: 0.01, a: 1 };
  },
  async intro(g) {
    g.hero.front = true;
    await g.card('assets/pointclick/s2/cards/r_retour.webp', g.T('ch.s2_15'));
    const d = g.ent('doc');
    await g.say('doc', 'c15.wake.1'); g.face(d.x); await g.say('hero', 'c15.wake.2'); await g.say('doc', 'c15.wake.3');
    g.face(g.ent('s15cart').x); await g.say('hero', 'c15.look.cart'); await g.say('narr', 'c15.look.cart.narr'); g.face(d.x); await g.say('doc', 'c15.wake.4');
  },

  async on(g, verb, id, item) {
    const F = k => g.flag(k), e = g.ent(id);
    if (verb === 'use' && (item === 'wabbajack' || (id === 'wabbajack' && item))) { await g.cut(() => this.wab(g, item === 'wabbajack' ? id : item)); return true; }
    switch (id) {
      case 'doc':
        if (verb === 'talk') { await g.say('hero', 'c15.talk.doc.1'); await g.say('doc', 'c15.talk.doc.2'); await g.say('hero', 'c15.talk.doc.3'); await g.say('doc', 'c15.talk.doc.4'); return true; }
        break;
      case 'boy': case 'board':
        if (verb === 'look') { await g.say('hero', id === 'board' ? 'look.board' : 'c15.look.boy'); return true; }
        break;
      case 's15cart':
        if (verb === 'look') {
          if (F('cartSteel')) { await g.say('hero', 'c15.look.speedo'); return true; }
          await g.say('hero', 'c15.look.cart'); if (!F('cartGag')) { g.set('cartGag'); await g.say('doc', 'c15.gag.1'); await g.say('hero', 'c15.gag.2'); } return true;
        }
        if ((verb === 'use' || verb === 'walk') && !item) {
          if (!F('cartSteel')) { await g.say('hero', 's15.horse.first'); return true; }
          await g.cut(async () => { g.sfx('step'); await g.say('hero', 'c15.use.horse.bad'); await g.say('doc', 'c15.use.horse.bad.doc'); await g.say('narr', 'c15.use.horse.bad.narr'); }); return true;
        }
        break;
      case 's15tower':
        if (verb === 'look') { await g.say('hero', 'c15.look.tower'); return true; }
        if (verb === 'use' && item === 'cable15') {
          if (!F('cartUp')) { await g.say('hero', 's15.cable.top'); return true; }
          await g.cut(async () => { g.face(...CLOCK); await zap(g, ...CLOCK, { from: tip(g), cols: ['#ffd27a', '#ffffff', '#9ad8ff'] }); g.chk(); hit(g, ...CLOCK, '#ffd27a'); g.drop('cable15'); g.set('cableOn'); await g.say('hero', 'c15.use.cable'); });
          return true;
        }
        if (verb === 'use' && item === 'shout') { await g.cut(() => this.storm(g)); return true; }
        break;
      case 's15cable':
        if (verb === 'look') { await g.say('hero', 'c15.look.cable'); await g.say('doc', 'c15.look.cable.doc'); return true; }
        if ((verb === 'take' || verb === 'use') && !item) {
          if (g.has('cable15') || F('cableOn')) { await g.say('hero', 's15.cable.done'); return true; }
          twinkle(g, 107, 92, '#ffd27a'); g.sfx('pop'); g.give('cable15'); await g.say('hero', 'take.s15cable'); return true;
        }
        break;
    }
    return false;
  },

  /* Cri de tempête : sans le câble, la foudre tombe sur le banc ; avec, sur l'horloge : la charrette part et revient fumante */
  async storm(g) {
    const h = g.hero, d = g.ent('doc'), c = g.ent('s15cart');
    g.face(...CLOCK); await g.say('hero', g.flag('cableOn') ? 'c15.use.shout.1' : 'c15.use.shout.bad');
    if (!g.flag('cableOn')) { lightning(g, 60, -10, 64, 192); await g.wait(600); await g.say('doc', 'c15.use.shout.bad.doc'); return; }
    lightning(g, CLOCK[0] + 30, -10, ...CLOCK); await g.wait(250);
    await zap(g, c.x, c.y - 10, { peak: () => { c.visible = false; }, cols: ['#bcd8ff', '#ffffff', '#ffd27a'] }); g.chk();
    fireTrails(g, 120, 420, 238); g.sfx('whoosh'); g.face(d.x); await g.say('doc', 'c15.use.shout.2');
    Object.assign(c, { x: 336, y: 234, rot: 0, scale: undefined, kz: 1.2, smoke: true });
    await zap(g, 336, 214, { peak: () => { c.visible = true; c.hot = false; }, cols: ['#bcd8ff', '#ffffff'] }); g.chk();
    const sm = setInterval(() => { if (!g.alive || !c.visible) return clearInterval(sm); g.parts = g.parts || []; for (let i = 0; i < 2; i++) g.parts.push({ k: 'smoke', x: c.x + (Math.random() - 0.5) * 60, y: c.y - 30 - Math.random() * 20, vx: (Math.random() - 0.5) * 6, vy: -8 - Math.random() * 6, g: -2, drag: 0.5, t: 0, life: 1.6, s: 4, grow: 10, rot: Math.random() * 6, vr: 0.4 }); }, 160);
    await g.say('narr', 'c15.use.shout.narr');
    await g.say('doc', 'c15.reward.1'); await g.say('doc', 'c15.reward.2'); twinkle(g, d.x, d.y - 40, '#ffd166'); g.give('cheese15'); await g.say('hero', 'c15.reward.hero');
    await sheoPops(g, 'c15.reward.sheo');
    await g.say('doc', 'c15.end.doc'); await g.say('hero', 'c15.end.hero'); await g.say('narr', 'c15.end.narr');
    clearInterval(sm); await g.fade(1, 1200); nextChapter(g, 's2_15');
  },

  async wab(g, id) {
    const e = g.ent(id), h = g.hero, d = g.ent('doc');
    switch (id) {
      case 's15cart': {
        if (!g.flag('cartSteel')) {   /* la charrette se couvre d'inox */
          await wabZap(g, e, () => { e.spr = 's2:p_cart15s'; }, ['#bcd8ff', '#ffffff', '#5aa0ff']); g.set('cartSteel');
          await g.say('hero', 'c15.wab.cart.1'); await g.say('doc', 'c15.wab.cart.2'); await g.say('doc', 'c15.wab.cart.3'); return;
        }
        if (!g.flag('cartUp')) {   /* un cheval nordique : il grimpe le clocher à la verticale en tirant la charrette */
          await wabZap(g, e, () => { e.spr = 's2:p_cart15n'; }); await g.say('hero', 'c15.wab.horse.1');
          e.hot = false; e.block = null; const x0 = e.x, y0 = e.y, t0 = g.now;
          await g.until(() => { const u = Math.min(1, (g.now - t0) / 1.6); e.x = x0 + (281 - x0) * u; e.y = y0 + (196 - y0) * u; return u >= 1; });
          e.scale = g.sc(e); e.kz = undefined; const s0 = e.scale, t1 = g.now;
          await g.until(() => { const u = Math.min(1, (g.now - t1) / 0.5); e.rot = Math.PI / 2 * u; return u >= 1; });
          const t2 = g.now; await g.until(() => { const u = Math.min(1, (g.now - t2) / 2.2); e.y = 196 - 92 * u; e.scale = s0 * (1 - 0.15 * u); return u >= 1; });
          g.set('cartUp'); await g.say('narr', 'c15.wab.horse.narr'); g.face(d.x); await g.say('doc', 'c15.wab.horse.doc'); return;
        }
        break;
      }
      case 'doc': await wabSwap(g, d, 's2:doc_hair', [['doc', 'c15.wk.doc.1'], ['hero', 'c15.wk.doc.2']], 's15.wk.back'); return;
      case 's15tower': {   /* l'horloge tourne à l'envers : le héros redevient enfant trois secondes */
        g.face(...CLOCK); await zap(g, ...CLOCK, { from: tip(g), cols: ['#fff0b0', '#ffffff'] }); g.chk();
        await zap(g, h.x, h.y - 40, { peak: () => { h.forceSpr = 's2:hero_kid'; } }); g.chk(); await g.say('hero', 'c15.wk.clock.1'); await g.wait(600);
        await zap(g, h.x, h.y - 40, { peak: () => { h.forceSpr = null; } }); g.chk(); await g.say('hero', 'c15.wk.clock.2'); return;
      }
      case 'board': case 'boy': {   /* la planche flotte */
        const B = g.ent('board'); await wabZap(g, B, () => { B.float = 14; }, ['#9ad8ff', '#ffffff', '#c77dff']); g.set('boardUp'); await g.say('hero', 'c15.wk.board'); return;
      }
      case 'photo15': {   /* il s'efface de la photo… et revient, un seau sur la tête */
        await wabZap(g, e, null); const t0 = g.now; await g.until(() => { h.alpha = Math.max(0.05, 1 - (g.now - t0) / 1.2); return g.now - t0 >= 1.2; });
        await g.say('hero', 'c15.wk.photo.1'); h.forceSpr = 's2:hero_bucket'; const t1 = g.now; await g.until(() => { h.alpha = Math.min(1, (g.now - t1) / 0.8); return h.alpha >= 1; });
        await g.say('hero', 'c15.wk.photo.2'); g.face(d.x); await g.say('doc', 'c15.wk.photo.doc');
        await zap(g, h.x, h.y - 40, { peak: () => { h.forceSpr = null; } }); g.chk(); return;
      }
    }
    await wabZap(g, e, null); await g.say('hero', 'wab.none');
  }
};
