/* Saison 2, chapitre 13 (2/2) : en haut de la tour. Le héros arrive en cubes et redevient rond ; il prend la meule cubique et redescend
   en sautant, le seau d'eau versé pendant la chute (atterrissage dans s2_13). Coordonnées logiques 480 × 270 (décor 960 × 540). */
import { zap, twinkle } from '../engine/fx2.js';
import { wabZap, sheoPops } from './s2_common.js';

export default {
  id: 's2_13b', hd: true, bg: 's2/d_mine_b.webp', music: 's2_13_blocs', amb: ['forest', 0.25], steps: 'dirt',
  persp: [186, 0.26, 268, 0.5], walkK: 2.2,   /* le héros à la taille des créneaux */ blockR: [16, 6],
  light: { tint: '#fff0c8', k: 0.1 },
  walk: [[[128, 186], [405, 186], [412, 226], [374, 232], [372, 268], [282, 268], [280, 232], [210, 232], [208, 268], [180, 268], [176, 232], [126, 228]]],
  /* le socle de pierre cache ce qui est derrière lui */
  fg: [{ y: 258, polys: [[[212, 200], [277, 200], [277, 259], [212, 259]]] }],
  start: { x: 320, y: 246, dir: 'l' },
  fx: { lights: [{ x: 175, y: 25, r: 40, col: '#fff2a0', a: 0.35, fl: 0, breathe: 1.1 }] },
  hot: [{ id: 's13view', rect: [0, 90, 480, 132] }, { id: 's13edge', rect: [125, 134, 420, 186], at: [268, 192] }, { id: 's13sun', rect: [158, 10, 196, 40] }],
  ents: [
    { id: 'cheesecube', spr: 's2:i_cheesecube', x: 244, y: 206, z: 80, scale: 0.58, hot: true, solid: false, noShadow: true, at: [292, 240], name: 'n.cheesecube' },
    { id: 'sheo', spr: 's2:sheo', x: 300, y: 230, hot: false, visible: false, aura: { col: '#c77dff', r: 0.6, a: 0.35, wisps: 3 } }
  ],

  async enter(g, how) {
    if (g.has('cheesecube')) g.ents = g.ents.filter(e => e.id !== 'cheesecube');
    if (how.cube) { g.hero.forceSpr = 's2:hero_cube'; g.hero.alpha = 0; }
    if (how.intro) g.fx.fade = { from: 1, to: 1, t0: g.now, ms: 0.01, a: 1 };
  },
  async intro(g, how) {
    const h = g.hero; await g.fade(0, 500);
    if (how.cube) {   /* il émerge de l'escalier, toujours cubique, puis redevient rond */
      const t0 = g.now; await g.until(() => { const u = (g.now - t0) / 0.8; h.alpha = Math.min(1, u); return u >= 1; });
      await zap(g, h.x, h.y - 45, { peak: () => { h.forceSpr = null; } }); g.chk();
      await g.say('hero', 'c13.wab.hero.2'); await sheoPops(g, 'c13.wab.hero.sheo');
    }
  },

  async on(g, verb, id, item) {
    if (verb === 'use' && (item === 'wabbajack' || (id === 'wabbajack' && item))) { const e = g.ent(item === 'wabbajack' ? id : item); await g.cut(async () => { await wabZap(g, e, null); await g.say('hero', 'wab.none'); }); return true; }
    switch (id) {
      case 'cheesecube':
        if (verb === 'look') { await g.say('hero', 'c13.look.cheese'); return true; }
        if (verb === 'take' || (verb === 'use' && !item)) { const c = g.ent('cheesecube'); twinkle(g, c.x, c.y - 10, '#ffd166'); g.ents = g.ents.filter(x => x !== c); g.sfx('pop'); g.give('cheesecube'); await g.say('hero', 'take.cheesecube'); return true; }
        break;
      case 's13view': if (verb === 'look') { await g.say('hero', 'c13.look.ground'); return true; } break;
      case 's13edge':
        if (verb === 'look') { await g.say('hero', 'c13.look.ground'); return true; }
        if (verb === 'use' && item === 'waterbucket13') {
          if (!g.has('cheesecube')) { await g.say('hero', 's13.cheese.first'); return true; }
          await g.cut(() => this.jump(g)); return true;
        }
        if (verb === 'walk' || (verb === 'use' && !item)) { await g.say('hero', 'c13.jump.bad'); return true; }
        break;
    }
    return false;
  },

  /* il enjambe les créneaux et saute, le seau à la main */
  async jump(g) {
    const h = g.hero; await g.walkTo(268, 190); h.back = true; await g.wait(300);
    await g.say('narr', 'c13.jump.narr'); g.sfx('whoosh');
    const t0 = g.now, x0 = h.x, y0 = h.y; await g.until(() => { const u = (g.now - t0) / 0.7; h.y = y0 - 40 * Math.sin(Math.min(1, u) * Math.PI * 0.6) + (u > 0.6 ? (u - 0.6) * 160 : 0); h.alpha = Math.max(0, 1 - Math.max(0, u - 0.5) * 2); return u >= 1; }); g.chk();
    await g.fade(1, 400); setTimeout(() => g.goScene('s2_13', { intro: true, fall: true }), 0);
  }
};
