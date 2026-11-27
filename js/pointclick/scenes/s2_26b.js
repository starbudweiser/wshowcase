/* Saison 2, chapitre 26 (2/3) : la cage d'escalier de l'immeuble d'en face. Un canapé coincé en travers des marches, le
   paléontologue en haut qui hurle « pivot » à chaque marche, le blagueur en bas. Le Cri : « FUS… RO… PIVOT ! », le canapé passe.
   Coordonnées logiques 480 × 270 (décor 960 × 540). */
import { zap, twinkle, shout } from '../engine/fx2.js';
import { wabZap, wabSwap, mid } from './s2_common.js';
import { laugh } from './s2_26.js';

export default {
  id: 's2_26b', hd: true, bg: 's2/d_stairs26.webp', music: 's2_26_cafe', amb: ['house', 0.15], steps: 'stone',
  persp: [196, 0.66, 268, 0.86], walkK: 1.9, blockR: [16, 6],
  light: { tint: '#fff0d0', k: 0.08 },
  walk: [[[4, 268], [4, 250], [80, 216], [170, 202], [170, 240], [324, 240], [324, 202], [400, 216], [476, 250], [476, 268]]],
  start: { x: 40, y: 256, dir: 'r' },
  fx: { lights: [{ x: 244, y: 22, r: 70, col: '#fff2c0', a: 0.25, fl: 0.04 }] },
  hot: [
    { id: 's26out', rect: [0, 20, 40, 250], at: [24, 258], dir: 'l' },
    { id: 's26stairs', rect: [176, 60, 320, 236], at: [247, 248], dir: 'b' }
  ],
  preload: ['s2:p_guard17', 's2:nervpaleo_dragon26'],
  ents: [
    { id: 'nervpaleo', spr: 's2:nervpaleo', x: 262, y: 120, scale: 0.42, noShadow: true, hot: true, solid: false, at: [247, 248], name: 'n.nervpaleo' },
    { id: 'couch26', spr: 's2:p_couch26', x: 248, y: 182, z: 26, scale: 0.66, rot: -0.18, noShadow: true, hot: true, solid: false, at: [247, 248], name: 'n.couch26' },
    { id: 'joker', spr: 's2:joker', x: 212, y: 204, scale: 0.6, hot: true, solid: false, at: [200, 248], name: 'n.joker' }
  ],

  async enter(g, how) {
    const piv = g.flag('pivot'); ['nervpaleo', 'couch26', 'joker'].forEach(i => { g.ent(i).visible = !piv; });
    if (how.back) { Object.assign(g.hero, { x: 247, y: 250, dir: 'l' }); g.fade(0, 600); }
    if (how.intro) g.fx.fade = { from: 1, to: 1, t0: g.now, ms: 0.01, a: 1 };
  },
  async intro(g) {
    await g.fade(0, 800); if (g.flag('pivot')) return;
    const P = g.ent('nervpaleo'), J = g.ent('joker'); g.face(P.x);
    this.heave = true; await g.say('nervpaleo', 'c26.stairs.paleo'); laugh(g); this.heave = false;
    await g.say('narr', 'c26.gag.narr'); g.face(J.x); await g.say('joker', 'c26.stairs.joker'); laugh(g);
  },
  /* le canapé tremble quand on force (« pivot ! ») */
  tick(g) { const C = g.ent('couch26'); if (!C || this.flying) return; C.rot = -0.18 + (this.heave ? Math.sin(g.now * 22) * 0.03 : 0); },

  async on(g, verb, id, item) {
    const F = k => g.flag(k), P = g.ent('nervpaleo'), J = g.ent('joker');
    if (verb === 'use' && (item === 'wabbajack' || (id === 'wabbajack' && item))) { await g.cut(() => this.wab(g, item === 'wabbajack' ? id : item)); return true; }
    if (verb === 'use' && item === 'shout' && (id === 'couch26' || id === 's26stairs' || id === 'nervpaleo' || id === 'joker') && !F('pivot')) { await g.cut(() => this.pivot(g)); return true; }
    switch (id) {
      case 'nervpaleo':
        if (verb === 'look') { await g.say('hero', 'look.nervpaleo'); return true; }
        if (verb === 'talk') { await g.say('nervpaleo', 'c26.talk.paleo.1'); await g.say('hero', 'c26.talk.paleo.2'); await g.say('nervpaleo', 'c26.talk.paleo.3'); laugh(g); return true; }
        break;
      case 'joker':
        if (verb === 'look') { await g.say('hero', 'look.joker'); return true; }
        if (verb === 'talk') { await g.say('joker', 'c26.stairs.joker'); laugh(g); return true; }
        break;
      case 'couch26':
        if (verb === 'look') { await g.say('hero', 'c26.look.stairs'); return true; }
        if (verb === 'use' && !item) { this.heave = true; await g.say('nervpaleo', 'c26.stairs.paleo'); this.heave = false; return true; }
        break;
      case 's26stairs':
        if (verb === 'look') { await g.say('hero', F('pivot') ? 'look.s26flatdoor' : 'c26.look.stairs'); return true; }
        if (verb === 'use' || verb === 'walk') {
          if (!F('pivot')) { await g.say('hero', 's26.stairs.block'); return true; }
          await g.fade(1, 600); setTimeout(() => g.goScene('s2_26c', { intro: true }), 0); return true;
        }
        break;
      case 's26out':
        if (verb === 'look') { await g.say('hero', 'look.s26door'); return true; }
        if (verb === 'use' || verb === 'walk') { await g.fade(1, 600); setTimeout(() => g.goScene('s2_26', { back: true }), 0); return true; }
        break;
    }
    return false;
  },

  /* « FUS… RO… PIVOT ! » : le canapé file en haut des marches, ses porteurs derrière lui */
  async pivot(g) {
    const C = g.ent('couch26'), P = g.ent('nervpaleo'), J = g.ent('joker'), h = g.hero, [x, y] = mid(g, h);
    g.face(C.x); h.back = true; await g.say('hero', 'c26.use.shout'); g.sfx('shout'); shout(g, x, y - 30, 1);
    this.flying = true; const t0 = g.now, c0 = { y: C.y, s: C.scale, r: C.rot };
    await g.until(() => {
      const u = Math.min(1, (g.now - t0) / 1.3), k = 1 - Math.pow(1 - u, 2);
      C.y = c0.y - 92 * k; C.scale = c0.s * (1 - 0.5 * k); C.rot = c0.r + 6.28 * k; P.y = 120 - 30 * k; P.alpha = 1 - k; J.alpha = 1 - u * 0.4;
      return u >= 1;
    });
    C.visible = false; P.visible = false; g.sfx('crash'); twinkle(g, 247, 70, '#ffe9a8');
    const t1 = g.now; await g.until(() => { const u = Math.min(1, (g.now - t1) / 0.8); J.y = 204 - 70 * u; J.scale = 0.6 - 0.2 * u; J.alpha = 0.6 * (1 - u); return u >= 1; });
    J.visible = false; h.back = false; g.set('pivot'); this.flying = false;
    await g.say('nervpaleo', 'c26.use.shout.paleo'); laugh(g); await g.say('narr', 'c26.use.shout.narr');
  },

  async wab(g, id) {
    const e = g.ent(id);
    if (id === 'hero') { await g.say('hero', 'wab.self'); return; }
    switch (id) {
      case 'joker': await wabSwap(g, e, 's2:p_guard17', [['joker', 'c26.wk.joker']], 's26.wk.back', { flip: false }); laugh(g); return;
      case 'nervpaleo': await wabSwap(g, e, 's2:nervpaleo_dragon26', [['hero', 'c26.wk.dino'], ['nervpaleo', 'c26.wk.dino.paleo']], 's26.wk.back'); laugh(g); return;
    }
    await wabZap(g, e, null); await g.say('hero', 'wab.none');
  }
};
