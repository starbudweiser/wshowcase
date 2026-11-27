/* Saison 2, chapitre 16 (2/2) : le cours de potions, dans un cachot voûté. Le professeur exige une potion de soin : la fleur de
   montagne bleue dans le chaudron, comme en alchimie chez nous. Quinze points pour Rivebois et la meule du banquet ; retour dans la
   grande salle pour la fin. Coordonnées logiques 480 × 270 (décor 960 × 540). */
import { zap, twinkle, hit } from '../engine/fx2.js';
import { wabZap, mid, tip } from './s2_common.js';

const RIM = [124, 146];   /* bord du chaudron */

export default {
  id: 's2_16b', hd: true, bg: 's2/d_potions.webp', music: 's2_16_sorciers', amb: ['dungeon', 0.32], steps: 'stone',
  persp: [192, 0.45, 268, 0.78], walkK: 1.9, blockR: [16, 6],
  /* cachot : teinte verdâtre et sombre, le feu du chaudron et la bougie du bureau réchauffent */
  light: { tint: '#9fb39a', k: 0.24, lamps: [{ x: 122, y: 214, r: 130, col: '#ff9a40', k: 0.75 }, { x: 405, y: 146, r: 90, col: '#ffc46a', k: 0.45 }, { x: 343, y: 52, r: 150, col: '#9dff9a', k: 0.2 }] },
  walk: [[[172, 192], [338, 192], [330, 244], [476, 250], [476, 268], [4, 268], [4, 242], [172, 236]]],
  start: { x: 392, y: 258, dir: 'l' },
  fx: {
    lights: [{ x: 122, y: 214, r: 34, col: '#ff9a40', a: 0.85, fl: 0.35 }, { x: 405, y: 140, r: 14, col: '#ffc46a', a: 0.8, fl: 0.25 }, { x: 343, y: 52, r: 42, col: '#9dff9a', a: 0.3, fl: 0, breathe: 0.7 }],
    glints: [{ rect: [100, 143, 150, 150], n: 6, col: '#a8ff8a', s: 1.6, a: 0.8 }],
    embers: [{ x: 121, y: 218, w: 12, rate: 7 }], steam: [{ x: 124, y: 144, w: 18, rate: 2.5, a: 0.3 }]
  },
  hot: [
    { id: 's16cauldron', rect: [82, 140, 168, 228], at: [178, 246], dir: 'l' }, { id: 's16desk', rect: [338, 160, 480, 240], at: [330, 250], dir: 'r' },
    { id: 's16benches', rect: [180, 140, 385, 188], at: [280, 196] },
    { id: 's16shelves', rect: [0, 55, 80, 190] }, { id: 's16shelves', rect: [182, 80, 412, 138] }, { id: 's16shelves', rect: [420, 60, 480, 160] }
  ],
  preload: ['s2:bat16', 's2:student16c'],
  ents: [
    { id: 'potions', spr: 's2:potions', x: 304, y: 214, hot: true, at: [262, 252], name: 'n.potions' },
    { id: 'student16', spr: 's2:student16', x: 44, y: 238, hot: true, at: [104, 254], name: 'n.student16' },
    { id: 'flower16', spr: 's2:i_flower16', x: 350, y: 147, scale: 0.42, noShadow: true, hot: true, solid: false, at: [330, 204], name: 'n.flower16' },
    { id: 'sheo', spr: 's2:sheo', x: 300, y: 240, hot: false, visible: false, aura: { col: '#c77dff', r: 0.6, a: 0.35, wisps: 3 } }
  ],

  async enter(g, how) {
    if (g.has('flower16') || g.flag('potion')) g.ent('flower16').visible = false;
    Object.assign(this.fx.steam[0], { col: undefined, rate: 2.5, a: 0.3 }); this.fx.glints[0].col = '#a8ff8a'; this.fx.lights = this.fx.lights.filter(L => !L.tmp);
    if (how.intro) g.fx.fade = { from: 1, to: 1, t0: g.now, ms: 0.01, a: 1 };
  },
  async intro(g) {
    await g.fade(0, 900); const P = g.ent('potions'); g.face(P.x);
    await g.say('potions', 'c16.class.1'); await g.say('potions', 'c16.class.2');
  },

  async on(g, verb, id, item) {
    const F = k => g.flag(k), e = g.ent(id);
    if (verb === 'use' && (item === 'wabbajack' || (id === 'wabbajack' && item))) { await g.cut(() => this.wab(g, item === 'wabbajack' ? id : item)); return true; }
    switch (id) {
      case 'potions':
        if (verb === 'look') { await g.say('hero', 'look.potions'); return true; }
        if (verb === 'talk') {
          if (!F('helmet')) { g.set('helmet'); await g.say('potions', 'c16.class.3'); await g.say('hero', 'c16.class.4'); await g.say('potions', 'c16.gag.1'); await g.say('hero', 'c16.gag.2'); await g.say('potions', 'c16.gag.3'); await g.say('narr', 'c16.gag.narr'); return true; }
          await g.say('potions', 'c16.class.2'); return true;
        }
        break;
      case 'student16': if (verb === 'look') { await g.say('hero', 'c16.look.students'); return true; } break;
      case 'flower16':
        if (verb === 'look') { await g.say('hero', 'c16.look.flower'); return true; }
        if (verb === 'take' || (verb === 'use' && !item)) { e.visible = false; twinkle(g, e.x, e.y - 6, '#7fb2ff'); g.sfx('pop'); g.give('flower16'); await g.say('hero', 'take.flower16'); return true; }
        break;
      case 's16cauldron':
        if (verb === 'look') { await g.say('hero', 'c16.look.cauldron'); return true; }
        if (verb === 'use' && item === 'flower16') { await g.cut(() => this.brew(g)); return true; }
        if (verb === 'use' && item && item.startsWith('cheese')) { await g.cut(() => this.fondue(g)); return true; }
        if (verb === 'use' && !item) { await g.say('hero', 's16.cauldron.empty'); return true; }
        break;
      case 's16desk': if (verb === 'look') { await g.say('hero', 'look.s16desk'); return true; } break;
      case 's16benches': if (verb === 'look') { await g.say('hero', 'look.s16benches'); return true; } break;
      case 's16shelves': if (verb === 'look') { await g.say('hero', 'look.s16shelves'); return true; } break;
    }
    return false;
  },

  async wab(g, id) {
    const e = g.ent(id);
    if (id === 'hero') { await g.say('hero', 'wab.self'); return; }
    switch (id) {
      case 'potions': {   /* une chauve-souris, même regard, même mépris */
        await wabZap(g, e, () => { e.spr = 's2:bat16'; e.float = 62; e.scale = 0.95; });
        await g.say('potions', 'c16.wk.prof.1'); await g.say('hero', 'c16.wk.prof.2'); await g.say('narr', 'c16.wk.prof.narr');
        await g.wait(300); await zap(g, ...mid(g, e), { peak: () => { e.spr = 's2:potions'; e.float = 0; e.scale = undefined; } }); g.chk(); await g.say('hero', 's16.wk.back'); return;
      }
      case 'student16': {   /* sa baguette devient une carotte : un sort, une odeur de soupe */
        await wabZap(g, e, () => { e.spr = 's2:student16c'; }, ['#ff9a3c', '#ffffff', '#7dd65a']);
        const [hx, hy] = [e.x + 18, e.y - 62]; for (let i = 0; i < 6; i++) setTimeout(() => { g.parts = g.parts || []; g.parts.push({ k: 'smoke', x: hx + (Math.random() - 0.5) * 6, y: hy, vx: 4 + Math.random() * 4, vy: -8 - Math.random() * 4, g: -2, drag: 0.5, t: 0, life: 1.8, s: 3, grow: 7, rot: Math.random() * 6, vr: 0.4, a: 0.5, tint: '#c9d98a' }); }, 500 + i * 120);
        await g.say('hero', 'c16.wk.wand'); await g.wait(400);
        await zap(g, ...mid(g, e), { peak: () => { e.spr = 's2:student16'; } }); g.chk(); await g.say('hero', 's16.wk.back'); return;
      }
    }
    await wabZap(g, e, null); await g.say('hero', 'wab.none');
  },

  /* du fromage dans le chaudron : une fondue, trop tôt dans la saison */
  async fondue(g) {
    const P = g.ent('potions'); g.face(RIM[0]); twinkle(g, ...RIM, '#ffd166'); g.sfx('fileFx', 'brew', 0.45);
    const G = this.fx.glints[0]; G.col = '#ffd166'; this.fx.steam[0].col = '#ffe2a0';
    await g.say('hero', 'c16.use.cheese.bad'); g.face(P.x); await g.say('potions', 'c16.use.cheese.bad.p'); await g.say('hero', 'c16.use.cheese.bad.hero');
    G.col = '#a8ff8a'; this.fx.steam[0].col = undefined;
  },

  /* la fleur bleue : une potion de soin de chez nous, vapeur rose, le héros goûte ; quinze points et la meule du banquet */
  async brew(g) {
    const h = g.hero, P = g.ent('potions'), S = this.fx.steam[0];
    g.face(RIM[0]); g.drop('flower16'); twinkle(g, ...RIM, '#7fb2ff'); g.sfx('fileFx', 'brew', 0.55);
    await g.wait(500); hit(g, RIM[0], RIM[1] - 4, '#ff6b8a'); this.fx.glints[0].col = '#ff8fb0'; S.col = '#ff9ab8'; S.rate = 9; S.a = 0.5;
    g.parts = g.parts || []; for (let i = 0; i < 26; i++) g.parts.push({ k: 'spark', x: RIM[0] + (Math.random() - 0.5) * 36, y: RIM[1], vx: (Math.random() - 0.5) * 10, vy: -24 - Math.random() * 30, g: -4, drag: 0.3, t: -Math.random() * 0.8, life: 1.2 + Math.random(), s: 0.8 + Math.random() * 0.8, col: i % 3 ? '#ff6b8a' : '#ffd1dc', sw: (Math.random() - 0.5) * 3, tw: true });
    this.fx.lights.push({ x: RIM[0], y: RIM[1] - 6, r: 34, col: '#ff7aa0', a: 0.65, fl: 0.2, breathe: 1.6, tmp: true });   /* lueur rose de la potion */
    await g.wait(900); S.rate = 5; S.a = 0.5;
    await g.say('hero', 'c16.use.flower.1');
    const [hx, hy] = mid(g, h); for (let i = 0; i < 3; i++) setTimeout(() => twinkle(g, hx + (Math.random() - 0.5) * 24, hy + (Math.random() - 0.5) * 40, '#ff8fb0'), i * 220);
    g.face(P.x); await g.say('potions', 'c16.use.flower.2'); await g.say('potions', 'c16.use.flower.3');
    twinkle(g, P.x - 14, P.y - 60, '#ffd166'); g.sfx('pop'); g.give('cheese16'); g.set('potion');
    await g.say('hero', 'c16.use.flower.hero');
    await g.fade(1, 1100); setTimeout(() => g.goScene('s2_16', { intro: true }), 0);
  }
};
