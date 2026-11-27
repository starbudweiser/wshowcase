/* Saison 2, chapitre 20 (2/2) : la cuisine. Deux petits monstres qui ouvrent les portes ; se cacher ne sert à rien (ils savent lire).
   Le Wabbajack en fait deux brioches, qui fixent toujours le héros. La meule est au frigo. Coordonnées logiques 480 × 270. */
import { zap, twinkle } from '../engine/fx2.js';
import { wabZap, nextChapter, mid, tip } from './s2_common.js';

export default {
  id: 's2_20b', hd: true, bg: 's2/d_kitchen.webp', music: 's2_20_dinos', amb: ['house', 0.25], steps: 'stone',
  persp: [205, 0.62, 268, 0.88], walkK: 1.9, blockR: [16, 6],
  light: { tint: '#c8d0e8', k: 0.12, lamps: [{ x: 74, y: 30, r: 140, col: '#ffcf80', k: 0.5 }] },
  walk: [[[4, 206], [130, 202], [360, 210], [366, 224], [476, 228], [476, 268], [4, 268]]],
  start: { x: 96, y: 240, dir: 'r' },
  fx: { lights: [{ x: 74, y: 30, r: 22, col: '#ffcf80', a: 0.8, fl: 0.08 }, { x: 242, y: 66, r: 40, col: '#8fb0ff', a: 0.25, fl: 0 }] },
  hot: [
    { id: 's20fridge', rect: [365, 28, 478, 214], at: [350, 238], dir: 'r' }, { id: 's20door', rect: [48, 84, 126, 198], at: [96, 220] },
    { id: 's20shelves', rect: [180, 40, 360, 205] }
  ],
  preload: ['s2:p_rolls20'],
  ents: [
    { id: 'raptors20', spr: 's2:raptors20', x: 262, y: 236, scale: 0.95, hot: true, at: [196, 244], block: [40, 9], flip: false, name: 'n.raptors20' },
    { id: 'paleo', spr: 's2:paleo', x: 36, y: 250, hot: true, at: [70, 252], name: 'n.paleo' },
    { id: 'sheo', spr: 's2:sheo', x: 300, y: 240, hot: false, visible: false, aura: { col: '#c77dff', r: 0.6, a: 0.35, wisps: 3 } }
  ],

  async enter(g, how) {
    if (g.flag('rolls')) Object.assign(g.ent('raptors20'), { spr: 's2:p_rolls20', scale: 0.3, block: null, name: 'n.rolls20' });
    if (how.intro) g.fx.fade = { from: 1, to: 1, t0: g.now, ms: 0.01, a: 1 };
  },
  async intro(g) {
    await g.fade(0, 900); const R = g.ent('raptors20'), P = g.ent('paleo');
    g.face(R.x); await g.say('hero', 'c20.look.kitchen'); await g.say('hero', 'c20.look.small'); g.face(P.x); await g.say('paleo', 'c20.small.paleo');
  },

  async on(g, verb, id, item) {
    const F = k => g.flag(k), e = g.ent(id);
    if (verb === 'use' && (item === 'wabbajack' || (id === 'wabbajack' && item))) { await g.cut(() => this.wab(g, item === 'wabbajack' ? id : item)); return true; }
    if (id === 'hero' && verb === 'use' && !item) { await g.say('hero', F('rolls') ? 's20.stand' : 'c20.fail.crouch'); return true; }
    switch (id) {
      case 'raptors20': if (verb === 'look') { await g.say('hero', F('rolls') ? 'look.rolls20' : 'c20.look.small'); return true; } break;
      case 'paleo': if (verb === 'look') { await g.say('hero', 'c20.look.paleo'); return true; } if (verb === 'talk') { await g.say('paleo', 'c20.small.paleo'); return true; } break;
      case 's20fridge':
        if (verb === 'look') { await g.say('hero', 'c20.look.fridge'); return true; }
        if (verb === 'use' || verb === 'take') { if (!F('rolls')) { await g.say('hero', 's20.fridge.blocked'); return true; } await g.cut(() => this.fridge(g)); return true; }
        break;
      case 's20door': if (verb === 'look') { await g.say('hero', 'look.s20door'); return true; } break;
      case 's20shelves': if (verb === 'look') { await g.say('hero', 'look.s20shelves'); return true; } break;
    }
    return false;
  },

  async wab(g, id) {
    const e = g.ent(id), P = g.ent('paleo');
    if (id === 'raptors20' && !g.flag('rolls')) {   /* deux brioches sucrées, qui le fixent toujours */
      await wabZap(g, e, () => { Object.assign(e, { spr: 's2:p_rolls20', scale: 0.3, block: null, name: 'n.rolls20' }); }, ['#ffd166', '#ffffff', '#f4b942']); g.set('rolls');
      await g.say('hero', 'c20.use.small.1'); g.face(P.x); await g.say('paleo', 'c20.use.small.2'); await g.say('narr', 'c20.use.small.narr'); return;
    }
    if (id === 'hero') { await g.say('hero', 'wab.self'); return; }
    await wabZap(g, e, null); await g.say('hero', 'wab.none');
  },

  /* la meule, bien au frais */
  async fridge(g) {
    const P = g.ent('paleo'); g.face(420); g.sfx('clang');
    for (let i = 0; i < 6; i++) setTimeout(() => { g.parts = g.parts || []; g.parts.push({ k: 'smoke', x: 400 + Math.random() * 40, y: 150 + Math.random() * 40, vx: -10 - Math.random() * 8, vy: 4, g: 0, drag: 0.4, t: 0, life: 1.8, s: 4, grow: 8, rot: Math.random() * 6, vr: 0.3, a: 0.5, tint: '#dff2ff' }); }, i * 90);   /* souffle froid */
    twinkle(g, 410, 140, '#dff2ff'); g.give('cheese20'); await g.say('hero', 'c20.use.fridge'); g.face(P.x); await g.say('paleo', 'c20.fridge.paleo'); await g.say('hero', 'c20.fridge.hero');
    await g.say('paleo', 'c20.end.paleo'); await g.say('hero', 'c20.end.hero'); await g.say('narr', 'c20.end.narr');
    await g.fade(1, 1200); nextChapter(g, 's2_20');
  }
};
