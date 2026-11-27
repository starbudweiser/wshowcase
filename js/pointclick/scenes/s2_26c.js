/* Saison 2, chapitre 26 (3/3) : l'appartement du paléontologue. L'acteur garde le frigo (« ici, on ne partage pas ») ; une brioche
   sucrée, c'est un échange, pas un partage. Le héros ne prend que le fromage du sandwich… et le paléontologue s'en aperçoit.
   Coordonnées logiques 480 × 270 (décor 960 × 540). */
import { twinkle } from '../engine/fx2.js';
import { wabZap, wabSwap } from './s2_common.js';
import { laugh } from './s2_26.js';

const TABLE = [[148, 146], [286, 146], [286, 228], [148, 228]];

export default {
  id: 's2_26c', hd: true, bg: 's2/d_flat26.webp', music: 's2_26_cafe', amb: ['house', 0.12], steps: 'wood',
  persp: [196, 0.64, 268, 0.86], walkK: 1.9, blockR: [16, 6],
  light: { tint: '#fff2e0', k: 0.05 },
  walk: [[[4, 268], [4, 198], [146, 198], [146, 232], [290, 232], [290, 204], [420, 208], [476, 242], [476, 268]]],
  fg: [{ y: 226, polys: [TABLE] }],
  start: { x: 104, y: 214, dir: 'r' },
  fx: { lights: [{ x: 246, y: 120, r: 110, col: '#fff6d8', a: 0.16, fl: 0 }] },
  hot: [
    { id: 's26flatdoor', rect: [66, 44, 140, 190], at: [104, 206], dir: 'l' },
    { id: 'fridge26', rect: [334, 56, 426, 206], at: [356, 222], dir: 'r' }
  ],
  preload: ['s2:p_guard17', 's2:nervpaleo_dragon26'],
  ents: [
    { id: 'charmer', spr: 's2:charmer', x: 392, y: 226, flip: true, hot: true, at: [340, 236], name: 'n.charmer' },
    { id: 'nervpaleo', spr: 's2:nervpaleo', x: 40, y: 246, hot: true, at: [84, 252], name: 'n.nervpaleo' },
    { id: 'joker', spr: 's2:joker', x: 312, y: 250, flip: true, hot: true, at: [270, 256], name: 'n.joker' }
  ],

  async enter(g, how) {
    if (g.flag('fed')) Object.assign(g.ent('charmer'), { x: 446, y: 244 });
    if (how.intro) g.fx.fade = { from: 1, to: 1, t0: g.now, ms: 0.01, a: 1 };
  },
  async intro(g) {
    await g.fade(0, 800); if (g.flag('guardSeen')) return; g.set('guardSeen');
    const C = g.ent('charmer'); g.face(C.x); await g.say('charmer', 'c26.fridge.charmer'); await g.say('hero', 'c26.fridge.hero'); laugh(g);
  },

  async on(g, verb, id, item) {
    const F = k => g.flag(k), C = g.ent('charmer'), P = g.ent('nervpaleo');
    if (verb === 'use' && (item === 'wabbajack' || (id === 'wabbajack' && item))) { await g.cut(() => this.wab(g, item === 'wabbajack' ? id : item)); return true; }
    switch (id) {
      case 'charmer':
        if (verb === 'look') { await g.say('hero', 'look.charmer'); return true; }
        if (verb === 'talk') { await g.say('charmer', 'c26.fridge.charmer'); await g.say('hero', 'c26.fridge.hero'); return true; }
        if (verb === 'use' && (item === 'mug26' || item === 'bucket26')) { await g.say('hero', 'c26.use.mug.charmer'); return true; }
        if (verb === 'use' && item === 'sweetroll' && !F('fed')) { await g.cut(() => this.trade(g)); return true; }
        break;
      case 'fridge26':
        if (verb === 'look') { await g.say('hero', F('theft') ? 'look.fridge26' : 'c26.look.note'); return true; }
        if ((verb === 'use' || verb === 'take') && !item) {
          if (!F('fed')) { g.face(C.x); await g.say('charmer', 'c26.fridge.charmer'); await g.say('hero', 'c26.fridge.hero'); return true; }
          if (!F('theft')) { await g.cut(() => this.theft(g)); return true; }
          await g.say('hero', 'look.fridge26'); return true;
        }
        break;
      case 'nervpaleo':
        if (verb === 'look') { await g.say('hero', 'look.nervpaleo'); return true; }
        if (verb === 'talk') { await g.say('nervpaleo', 'c26.talk.paleo.1'); await g.say('hero', 'c26.talk.paleo.2'); await g.say('nervpaleo', 'c26.talk.paleo.3'); laugh(g); return true; }
        break;
      case 'joker':
        if (verb === 'look') { await g.say('hero', 'look.joker'); return true; }
        if (verb === 'talk') { await g.say('joker', 'c26.gag.1'); laugh(g); await g.say('hero', 'c26.gag.2'); return true; }
        break;
      case 's26flatdoor':
        if (verb === 'look') { await g.say('hero', 'look.s26flatdoor'); return true; }
        if (verb === 'use' || verb === 'walk') { await g.fade(1, 600); setTimeout(() => g.goScene('s2_26b', { back: true }), 0); return true; }
        break;
    }
    return false;
  },

  /* une brioche, c'est de la nourriture : un échange, pas un partage */
  async trade(g) {
    const C = g.ent('charmer'); g.face(C.x);
    await g.say('hero', 'c26.use.sweetroll'); g.drop('sweetroll'); twinkle(g, C.x - 10, C.y - 70, '#ffd166'); g.sfx('pop');
    await g.say('charmer', 'c26.use.sweetroll.charmer'); laugh(g); g.set('fed');
    const t0 = g.now; await g.until(() => { const u = Math.min(1, (g.now - t0) / 0.9); C.x = 392 + 54 * u; C.y = 226 + 18 * u; return u >= 1; });
  },
  /* seulement le fromage… et le paléontologue a tout vu */
  async theft(g) {
    const P = g.ent('nervpaleo'), h = g.hero; h.back = true; g.sfx('click'); await g.wait(600);
    twinkle(g, 380, 130, '#ffd166'); g.sfx('pop'); g.give('cheese26'); h.back = false; g.set('theft');
    g.face(P.x); await g.say('nervpaleo', 'c26.theft.paleo'); await g.say('hero', 'c26.theft.hero'); laugh(g);
    await g.fade(1, 1000); setTimeout(() => g.goScene('s2_26', { intro: true }), 0);
  },

  async wab(g, id) {
    const e = g.ent(id);
    if (id === 'hero') { await g.say('hero', 'wab.self'); return; }
    switch (id) {
      case 'joker': await wabSwap(g, e, 's2:p_guard17', [['joker', 'c26.wk.joker']], 's26.wk.back', { flip: true }); laugh(g); return;
      case 'nervpaleo': await wabSwap(g, e, 's2:nervpaleo_dragon26', [['hero', 'c26.wk.dino'], ['nervpaleo', 'c26.wk.dino.paleo']], 's26.wk.back'); laugh(g); return;
      case 'mug26': { if (!g.has('mug26')) break; await wabZap(g, null, null, ['#ffffff', '#c8a060']); g.drop('mug26'); g.give('bucket26'); await g.say('hero', 'c26.wk.mug'); return; }
    }
    await wabZap(g, e, null); await g.say('hero', 'wab.none');
  }
};
