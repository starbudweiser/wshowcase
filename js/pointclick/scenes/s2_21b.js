/* Saison 2, chapitre 21 (2/2) : le sous-sol. Une partie de jeu de rôle ; le garçon, maître du jeu, annonce le héros avant qu'il entre.
   Sous Wabbajack, le héros devient une figurine en plomb, niveau un. L'escalier remonte au salon. Coordonnées logiques 480 × 270. */
import { zap } from '../engine/fx2.js';
import { mid, tip } from './s2_common.js';

export default {
  id: 's2_21b', hd: true, bg: 's2/d_basement.webp', music: 's2_21_annees80', amb: ['house', 0.2], steps: 'wood',
  persp: [200, 0.62, 268, 0.86], walkK: 1.9, blockR: [16, 6],
  light: { tint: '#ffd8a8', k: 0.14, lamps: [{ x: 164, y: 70, r: 150, col: '#ffcf80', k: 0.55 }] },
  walk: [[[372, 200], [476, 200], [476, 268], [4, 268], [4, 256], [300, 256], [372, 232]]],
  start: { x: 420, y: 236, dir: 'l' },
  fx: { lights: [{ x: 164, y: 72, r: 26, col: '#ffcf80', a: 0.8, fl: 0.05 }] },
  hot: [
    { id: 's21game', rect: [100, 115, 370, 252], at: [330, 252], dir: 'l' }, { id: 's21stairs', rect: [372, 30, 480, 198], at: [440, 214], dir: 'r' }
  ],
  preload: ['s2:hero_fig21'],
  ents: [
    { id: 'kid', spr: 's2:kid', x: 60, y: 262, hot: true, at: [110, 262], name: 'n.kid' },
    { id: 'sheo', spr: 's2:sheo', x: 300, y: 240, hot: false, visible: false, aura: { col: '#c77dff', r: 0.6, a: 0.35, wisps: 3 } }
  ],

  async enter(g, how) { if (how.intro) g.fx.fade = { from: 1, to: 1, t0: g.now, ms: 0.01, a: 1 }; },
  async intro(g) {
    const K = g.ent('kid'); if (g.flag('basement')) { await g.fade(0, 600); return; } g.set('basement'); await g.say('kid', 'c21.gag.1'); await g.fade(0, 700); g.face(K.x);
    await g.say('hero', 'c21.gag.2'); await g.say('kid', 'c21.gag.3'); await g.say('hero', 'c21.gag.4'); await g.say('kid', 'c21.gag.5'); await g.say('hero', 'c21.gag.6'); await g.say('narr', 'c21.gag.narr');
  },

  async on(g, verb, id, item) {
    const e = g.ent(id), h = g.hero, K = g.ent('kid');
    if (verb === 'use' && (item === 'wabbajack' || (id === 'wabbajack' && item))) {
      const t = item === 'wabbajack' ? id : item;
      if (t === 's21game') {   /* le héros devient une figurine, niveau un */
        await g.cut(async () => {
          g.face(160); await zap(g, 160, 196, { from: tip(g), cols: ['#c0c8d0', '#ffffff', '#ffd166'] }); g.chk();
          await zap(g, h.x, h.y - 40, { peak: () => { h.forceSpr = 's2:hero_fig21'; } }); g.chk();
          await g.say('hero', 'c21.wk.game'); g.face(K.x); await g.say('kid', 'c21.wk.game.kid'); await g.say('hero', 'c21.wk.game.hero');
          await zap(g, h.x, h.y - 40, { peak: () => { h.forceSpr = null; } }); g.chk();
        }); return true;
      }
      return false;
    }
    switch (id) {
      case 'kid': if (verb === 'talk') { await g.say('kid', 'c21.talk.kid.1'); await g.say('hero', 'c21.talk.kid.2'); return true; } if (verb === 'look') { await g.say('hero', 'c21.look.walkie'); return true; } break;
      case 's21game': if (verb === 'look') { await g.say('hero', 'look.s21game'); return true; } break;
      case 's21stairs':
        if (verb === 'look') { await g.say('hero', 'look.s21stairs'); return true; }
        if (verb === 'use' || verb === 'walk') { await g.fade(1, 600); setTimeout(() => g.goScene('s2_21', { back: true }), 0); return true; }
        break;
    }
    return false;
  }
};
