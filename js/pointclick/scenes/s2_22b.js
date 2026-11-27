/* Saison 2, chapitre 22 (2/2) : le café de la ville. Un agent fédéral juge le café « sacrément bon » et offre café et tarte ; la dame
   à la bûche, les hiboux qui ne sont pas ce qu'ils semblent (des poules), le magnétophone qui dicte à Sheogorath, la tarte qui parle
   à l'envers. Le passage ramène à la chambre rouge. Coordonnées logiques 480 × 270 (décor 960 × 540). */
import { zap, twinkle } from '../engine/fx2.js';
import { wabZap, wabSwap, mid, tip } from './s2_common.js';

export default {
  id: 's2_22b', hd: true, bg: 's2/d_diner.webp', music: 's2_22_foret', amb: ['house', 0.2], steps: 'stone',
  persp: [190, 0.58, 268, 0.86], walkK: 1.9, blockR: [16, 6],
  light: { tint: '#fff0d8', k: 0.05 },
  walk: [[[236, 196], [476, 214], [476, 268], [4, 268], [4, 252], [200, 236], [236, 214]]],
  start: { x: 120, y: 258, dir: 'r' },
  fx: { lights: [], steam: [{ x: 410, y: 100, w: 6, rate: 1.2, a: 0.25 }] },
  hot: [
    { id: 's22pies', rect: [56, 102, 190, 148], at: [150, 252] }, { id: 's22counter', rect: [0, 140, 232, 220], at: [150, 252] },
    { id: 's22door', rect: [0, 150, 22, 268], at: [18, 258], dir: 'l' }
  ],
  preload: ['s2:loglady_cheese22', 's2:p_chickens22'],
  ents: [
    { id: 'owls22', spr: 's2:p_owls22', x: 432, y: 44, scale: 0.24, noShadow: true, hot: true, solid: false, at: [420, 232], name: 'n.owls22' },
    { id: 'recorder22', spr: 's2:p_recorder22', x: 218, y: 142, scale: 0.12, noShadow: true, hot: true, solid: false, at: [230, 236], name: 'n.recorder22' },
    { id: 'agent', spr: 's2:agent', x: 262, y: 234, hot: true, at: [224, 246], flip: true, name: 'n.agent' },
    { id: 'loglady', spr: 's2:loglady', x: 424, y: 242, hot: true, at: [380, 250], flip: true, name: 'n.loglady' },
    { id: 'sheo', spr: 's2:sheo', x: 300, y: 240, hot: false, visible: false, aura: { col: '#c77dff', r: 0.6, a: 0.35, wisps: 3 } }
  ],

  async enter(g, how) {
    if (g.flag('chickens')) g.ent('owls22').spr = 's2:p_chickens22';
    if (how.intro) g.fx.fade = { from: 1, to: 1, t0: g.now, ms: 0.01, a: 1 };
  },
  async intro(g) { await g.fade(0, 700); if (!g.flag('diner')) { g.set('diner'); await g.say('hero', 'c22.look.diner'); } },

  async on(g, verb, id, item) {
    const F = k => g.flag(k), e = g.ent(id);
    if (verb === 'use' && (item === 'wabbajack' || (id === 'wabbajack' && item))) { await g.cut(() => this.wab(g, item === 'wabbajack' ? id : item)); return true; }
    switch (id) {
      case 'agent':
        if (verb === 'look') { await g.say('hero', 'look.agent'); return true; }
        if (verb === 'talk') {
          if (F('order')) { await g.say('agent', 'c22.talk.agent.3'); return true; }
          await g.cut(async () => {
            await g.say('agent', 'c22.talk.agent.1'); await g.say('hero', 'c22.talk.agent.2'); await g.say('agent', 'c22.talk.agent.3'); await g.say('agent', 'c22.talk.agent.4'); await g.say('hero', 'c22.talk.agent.5');
            await g.say('agent', 'c22.use.agent.order'); twinkle(g, 140, 140, '#ffd166'); g.sfx('pop'); g.give('coffee22'); g.give('pie22'); g.set('order'); await g.say('hero', 'c22.use.agent.order.hero');
          }); return true;
        }
        break;
      case 'loglady':
        if (verb === 'look') { await g.say('hero', 'look.loglady'); return true; }
        if (verb === 'talk') { await g.say('loglady', 'c22.talk.loglady.1'); await g.say('hero', 'c22.talk.loglady.2'); await g.say('loglady', 'c22.talk.loglady.3'); await g.say('hero', 'c22.talk.loglady.4'); return true; }
        break;
      case 'owls22': if (verb === 'look') { await g.say('hero', F('chickens') ? 'look.chickens22' : 'look.owls22'); return true; } break;
      case 'recorder22': if (verb === 'look') { await g.say('hero', 'look.recorder22'); return true; } break;
      case 's22pies': if (verb === 'look') { await g.say('hero', 'look.s22pies'); return true; } break;
      case 's22counter': if (verb === 'look') { await g.say('hero', 'look.s22counter'); return true; } break;
      case 's22door':
        if (verb === 'look') { await g.say('hero', 'look.s22door'); return true; }
        if (verb === 'use' || verb === 'walk') { await g.fade(1, 600); setTimeout(() => g.goScene('s2_22', { back: true }), 0); return true; }
        break;
    }
    return false;
  },

  async wab(g, id) {
    const e = g.ent(id), A = g.ent('agent'), L = g.ent('loglady');
    if (id === 'hero') { await g.say('hero', 'wab.self'); return; }
    switch (id) {
      case 'loglady': await wabSwap(g, L, 's2:loglady_cheese22', [['loglady', 'c22.wk.log'], ['hero', 'c22.wk.log.hero']], 's22.wk.back'); return;
      case 'owls22': {   /* des poules : elle avait raison */
        if (g.flag('chickens')) break;
        g.face(e.x); await zap(g, e.x, e.y - 14, { from: tip(g), peak: () => { e.spr = 's2:p_chickens22'; }, cols: ['#ffffff', '#ffd166'] }); g.chk(); g.set('chickens');
        await g.say('hero', 'c22.wk.owls'); g.face(L.x); await g.say('loglady', 'c22.wk.owls.loglady'); return;
      }
      case 'recorder22': case 'agent': {   /* il dicte son rapport à Sheogorath */
        await wabZap(g, g.ent('recorder22'), null, ['#c77dff', '#ffd166']); g.face(A.x); await g.say('agent', 'c22.wk.recorder'); await g.say('hero', 'c22.wk.recorder.hero'); return;
      }
      case 'pie22': case 's22pies': {   /* la tarte parle à l'envers */
        await wabZap(g, null, null, ['#ff6b6b', '#ffffff']); g.face(A.x); await g.say('agent', 'c22.wk.pie'); await g.say('hero', 'c22.wk.pie.hero'); return;
      }
    }
    await wabZap(g, e, null); await g.say('hero', 'wab.none');
  }
};
