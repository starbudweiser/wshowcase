/* Saison 2, chapitre 18 (1/2) : la roue de la douleur. Une plaine gelée, dans un livre qu'un enfant lit dans son grenier (son visage
   flotte dans le ciel). Le barbare pousse la roue depuis vingt ans ; pousser ne marche pas, crier la fait tourner dans le mauvais
   sens : le Wabbajack en fait une meule géante qui tourne toute seule. Ensuite, le pays du Néant (s2_18b). Coordonnées 480 × 270. */
import { zap, twinkle, shout, hit } from '../engine/fx2.js';
import { wabZap, wabSwap, mid, tip } from './s2_common.js';

const WHEEL = [250, 168], READER = [240, 40];

export default {
  id: 's2_18', hd: true, bg: 's2/d_wheel.webp', music: 's2_18_barbare', amb: ['wind', 0.35], steps: 'dirt',
  persp: [120, 0.36, 268, 0.9], walkK: 1.9, blockR: [16, 6],
  light: { tint: '#c9d6ea', k: 0.2 },
  walk: [[[4, 122], [476, 122], [476, 268], [4, 268]]],
  start: { x: 128, y: 222, dir: 'r' },
  fx: { lights: [], snow: { n: 80 }, steam: [{ x: 76, y: 42, w: 10, rate: 1.2, a: 0.55, col: '#5a5862' }] },
  hot: [
    { id: 's18sky', rect: [150, 0, 330, 70] }, { id: 's18chain', rect: [60, 228, 180, 262], at: [150, 246] }, { id: 's18mountains', rect: [0, 30, 150, 75] }
  ],
  preload: ['s2:p_wheelcheese18', 's2:poet18', 's2:p_boy18'],
  ents: [
    { id: 'reader18', spr: 's2:p_reader18', x: READER[0], y: READER[1] + 40, scale: 0.8, alpha: 0.45, noShadow: true, noLight: true, hot: false, solid: false },
    { id: 'wheel18', spr: 's2:p_wheel18', x: WHEEL[0], y: WHEEL[1], scale: 0.8, hot: true, at: [196, 186], block: [30, 9], name: 'n.wheel18' },
    { id: 'barbarian', spr: 's2:barbarian', x: 336, y: 198, hot: true, at: [300, 214], flip: true, name: 'n.barbarian' },
    { id: 'boy18', spr: 's2:p_boy18', x: 200, y: 232, scale: 0.4, hot: false, solid: false, visible: false },
    { id: 'sheo', spr: 's2:sheo', x: 300, y: 240, hot: false, visible: false, aura: { col: '#c77dff', r: 0.6, a: 0.35, wisps: 3 } }
  ],

  async enter(g, how) {
    if (g.flag('cheeseWheel')) { const W2 = g.ent('wheel18'); W2.spr = 's2:p_wheelcheese18'; W2.spin = true; }
    if (how.intro) g.fx.fade = { from: 1, to: 1, t0: g.now, ms: 0.01, a: 1 };
  },
  /* la meule tourne toute seule ; le visage du lecteur respire doucement dans le ciel */
  tick(g, dt) {
    const W2 = g.ent('wheel18'); if (W2 && W2.spin) {
      W2.rot = (W2.rot || 0) + dt * 1.4;
      if ((this._c = (this._c || 0) + dt) > 0.18) { this._c = 0; const P = g.parts = g.parts || []; P.push({ k: 'spark', x: W2.x + 34, y: W2.y - 40 + (Math.random() - 0.5) * 30, vx: 18 + Math.random() * 14, vy: -20 - Math.random() * 16, g: 70, drag: 0.2, t: 0, life: 0.9, s: 0.8, col: '#ffd166' }); }   /* miettes projetées par la rotation */
    }
    const R = g.ent('reader18'); if (R && R.visible !== false && !R.falling) R.alpha = 0.4 + 0.08 * Math.sin(g.now * 0.7);
  },
  async intro(g) {
    g.hero.front = true;
    await g.card('assets/pointclick/s2/cards/r_conan.webp', g.T('ch.s2_18'));
    const B = g.ent('barbarian'); g.face(B.x);
    await g.say('barbarian', 'c18.wake.1'); await g.say('hero', 'c18.wake.2'); await g.say('barbarian', 'c18.wake.3'); await g.say('hero', 'c18.wake.4'); await g.say('barbarian', 'c18.wake.5'); await g.say('narr', 'c18.wake.6');
  },

  async on(g, verb, id, item) {
    const F = k => g.flag(k), e = g.ent(id);
    if (verb === 'use' && (item === 'wabbajack' || (id === 'wabbajack' && item))) { await g.cut(() => this.wab(g, item === 'wabbajack' ? id : item)); return true; }
    switch (id) {
      case 'barbarian':
        if (verb === 'look') { await g.say('hero', 'c18.look.barbarian'); return true; }
        if (verb === 'talk') { await g.say('barbarian', 'c18.talk.barbarian.1'); await g.say('hero', 'c18.talk.barbarian.2'); await g.say('barbarian', 'c18.talk.barbarian.3'); return true; }
        break;
      case 'wheel18':
        if (verb === 'look') { await g.say('hero', F('cheeseWheel') ? 'look.wheelcheese18' : 'c18.look.wheel'); return true; }
        if ((verb === 'use' || verb === 'take') && !item) { if (F('cheeseWheel')) break; await g.cut(async () => { g.face(e.x); await this.shake(g, e, 0.6); await g.say('hero', 'c18.fail.push'); }); return true; }
        if (verb === 'use' && item === 'shout') { await g.cut(() => this.shoutWheel(g)); return true; }
        break;
      case 's18sky': if (verb === 'look') { await g.say('hero', 'c18.look.sky'); return true; } break;
      case 's18chain': if (verb === 'look') { await g.say('hero', 'look.s18chain'); return true; } break;
      case 's18mountains': if (verb === 'look') { await g.say('hero', 'look.s18mountains'); return true; } break;
    }
    return false;
  },

  /* la roue tremble à peine (rot en petits à-coups) */
  async shake(g, e, s) { const t0 = g.now; await g.until(() => { const u = (g.now - t0) / s; e.rot = Math.sin(u * 30) * 0.03 * (1 - Math.min(1, u)); return u >= 1; }); e.rot = 0; },
  /* FUS RO DAH : la roue fait un tour… dans le mauvais sens */
  async shoutWheel(g) {
    const e = g.ent('wheel18'), B = g.ent('barbarian'), h = g.hero; g.face(e.x);
    await g.say('hero', 'c18.fail.shout.1'); shout(g, ...mid(g, h), e.x > h.x ? 1 : -1); g.sfx('shout');
    const t0 = g.now; await g.until(() => { const u = Math.min(1, (g.now - t0) / 0.8); e.flip = u > 0.25 && u < 0.75; e.rot = Math.sin(u * Math.PI) * -0.06; return u >= 1; }); e.flip = false; e.rot = 0;
    g.face(B.x); await g.say('barbarian', 'c18.fail.shout.2'); await g.say('hero', 'c18.fail.shout.3');
  },

  async wab(g, id) {
    const e = g.ent(id), B = g.ent('barbarian');
    if (id === 'hero') { await g.say('hero', 'wab.self'); return; }
    switch (id) {
      case 'wheel18': {   /* une meule géante qui tourne toute seule : le barbare est libre */
        if (g.flag('cheeseWheel')) break;
        await wabZap(g, e, () => { e.spr = 's2:p_wheelcheese18'; e.spin = true; }, ['#ffd166', '#ffffff', '#f4b942']); g.set('cheeseWheel');
        await g.say('hero', 'c18.use.wheel.1'); g.face(B.x); await g.say('barbarian', 'c18.use.wheel.2'); await g.say('hero', 'c18.use.wheel.3'); await g.say('barbarian', 'c18.use.wheel.4');
        await g.fade(1, 1000); setTimeout(() => g.goScene('s2_18b', { intro: true }), 0); return;
      }
      case 'barbarian': await wabSwap(g, B, 's2:poet18', [['barbarian', 'c18.wk.barbarian.1'], ['hero', 'c18.wk.barbarian.2'], ['barbarian', 'c18.wk.barbarian.3']], 's18.wk.back'); return;
      case 's18sky': {   /* le lecteur tombe à son tour dans le livre */
        const R = g.ent('reader18'), Y = g.ent('boy18'); g.face(READER[0]);
        await zap(g, ...READER, { from: tip(g), peak: () => { R.visible = false; }, cols: ['#ffffff', '#ffd166', '#9ad8ff'] }); g.chk();
        const t0 = g.now; Object.assign(Y, { x: READER[0], y: READER[1], scale: 0.1, visible: true });
        await g.until(() => { const u = Math.min(1, (g.now - t0) / 1.1); Y.x = READER[0] - 40 * u; Y.y = READER[1] + (232 - READER[1]) * u * u; Y.scale = 0.1 + 0.3 * u; Y.rot = u * 6; return u >= 1; });
        Y.rot = 0; hit(g, Y.x, Y.y - 6, '#ffffff'); g.sfx('pop');
        await g.say('hero', 'c18.wk.boy.1'); await g.say('narr', 'c18.wk.boy.2');
        await zap(g, Y.x, Y.y - 20, { peak: () => { Y.visible = false; R.visible = true; } }); g.chk(); return;   /* il remonte dans son grenier */
      }
    }
    await wabZap(g, e, null); await g.say('hero', 'wab.none');
  }
};
