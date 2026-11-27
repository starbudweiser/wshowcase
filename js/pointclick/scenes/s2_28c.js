/* Saison 2, chapitre 28 (3/3), épilogue : retour à Rivebois. La fête des quinze ans, une marmite géante où fondent les dix-huit
   meules. Sheogorath rend le vrai seau (le héros le met sur la tête, par réflexe) et garde le casque à cornes. Le médecin boiteux
   débarque : « C'est le lupus. » Toute la fête : « C'est jamais le lupus ! » Après le générique, une tourelle passe la tête par le
   portail orange. Scène sans action du joueur. Coordonnées logiques 480 × 270 (décor 960 × 540). */
import { zap, twinkle, confetti, fireworks } from '../engine/fx2.js';
import { sheoPops } from './s2_common.js';

const PORT = { x: 420, y: 150, rx: 26, ry: 40 };

export default {
  id: 's2_28c', hd: true, bg: 's2/d_party28.webp', music: 's2_28_labo', amb: ['party', 0.3], steps: 'dirt',
  persp: [186, 0.66, 268, 0.88], walkK: 1.9, blockR: [16, 6],
  light: { tint: '#ffd8a8', k: 0.12, lamps: [{ x: 248, y: 190, r: 180, col: '#ffb060', a: 0.35 }] },
  walk: [[[4, 268], [4, 226], [200, 222], [300, 222], [476, 228], [476, 268]]],
  start: { x: 316, y: 248, dir: 'l' },
  fx: {
    lights: [{ x: 248, y: 196, r: 140, col: '#ff9a40', a: 0.3, fl: 0.2 }],
    embers: [{ x: 248, y: 206, w: 26, rate: 7 }], steam: [{ x: 248, y: 160, w: 22, rate: 4, a: 0.3, col: '#fff2c0' }], snow: { n: 50 }
  },
  hot: [],
  preload: ['s2:hero_bucket', 's2:sheo_helmet28', 's2:turret'],
  ents: [
    { id: 'sheo', spr: 's2:sheo', x: 168, y: 238, hot: false, aura: { col: '#c77dff', r: 0.6, a: 0.3, wisps: 3 } },
    /* les invités des autres mondes, venus pour la fondue */
    { id: 'guest1', spr: 's2:guybrush', x: 54, y: 216, hot: false, ph: 0.7 }, { id: 'guest2', spr: 's2:halfling', x: 104, y: 250, hot: false, ph: 1.4 },
    { id: 'guest3', spr: 's2:wizard', x: 452, y: 216, flip: true, hot: false, ph: 2.1 }, { id: 'guest4', spr: 's2:charmer', x: 20, y: 240, hot: false, ph: 2.8 },
    { id: 'house', spr: 's2:house', x: 520, y: 246, flip: true, hot: false },
    { id: 'turret', spr: 's2:turret', x: PORT.x, y: PORT.y + 34, scale: 0.5, noShadow: true, hot: false, visible: false, clip: null }
  ],

  async enter(g, how) { g.hero.forceSpr = null; g.hero.forceLife = null; this.port = 0; if (how.intro) g.fx.fade = { from: 1, to: 1, t0: g.now, ms: 0.01, a: 1 }; },
  /* le portail orange de l'après-générique, qui s'ouvre puis se referme (this.port : 0 → 1) */
  drawBack(g, c) {
    if (!this.port) return; const k = this.port, t = g.now; c.save(); c.translate(PORT.x, PORT.y); c.scale(k, k * PORT.ry / PORT.rx);
    const gr = c.createRadialGradient(0, 0, 2, 0, 0, PORT.rx); gr.addColorStop(0, '#fff4e0'); gr.addColorStop(0.5, '#ffb050'); gr.addColorStop(1, '#ff7a10');
    c.fillStyle = gr; c.beginPath(); c.arc(0, 0, PORT.rx, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#ff8a1a'; c.lineWidth = 3; c.shadowColor = '#ffd08a'; c.shadowBlur = 10 + Math.sin(t * 6) * 3; c.stroke(); c.restore();
  },

  async intro(g) {
    const h = g.hero, S = g.ent('sheo'), H = g.ent('house'), V = ['guest1', 'guest2', 'guest3', 'guest4'].map(i => g.ent(i)), T = g.ent('turret');
    await g.fade(0, 1400); g.face(248);
    await g.say('narr', 'c28.fondue.narr'); g.face(S.x); await g.say('sheo', 'c28.fondue.sheo'); await g.say('hero', 'c28.fondue.hero');
    await g.say('sheo', 'c28.fondue.sheo.2');
    await zap(g, h.x, h.y - 70, { peak: () => { h.forceSpr = 's2:hero_bucket'; h.forceLife = { idle: 'hero_bucket_i', talk: 'hero_bucket_t' }; }, cols: ['#c77dff', '#ffd166', '#ffffff'] }); g.chk();   /* le vrai seau, sur la tête, par réflexe */
    await g.say('hero', 'c28.fondue.hero.2');
    await zap(g, S.x, S.y - 70, { peak: () => { S.spr = 's2:sheo_helmet28'; }, cols: ['#c77dff', '#ffd166'] }); g.chk();
    await g.say('sheo', 'c28.fondue.sheo.3'); await g.say('hero', 'c28.fondue.hero.3');
    /* le médecin boiteux débarque, appuyé sur sa canne */
    const t0 = g.now; await g.until(() => { const u = Math.min(1, (g.now - t0) / 2.4); H.x = 520 - 136 * u; H.bob = Math.abs(Math.sin(u * 9)) * 1.5; return u >= 1; });
    await g.say('house', 'c28.house.1'); await g.say('narr', 'c28.house.narr'); g.face(S.x); await g.say('sheo', 'c28.house.sheo');
    await g.say('house', 'c28.house.2');
    for (const v of V) v.bob = 6; confetti(g, 248, 150, 60); g.sfx('fileFx', 'applause', 0.4);
    await g.say('hero', 'c28.house.all'); for (const v of V) v.bob = 0;
    await g.say('house', 'c28.house.3'); await g.say('sheo', 'c28.house.sheo.2');
    fireworks(g, 150, 60); setTimeout(() => fireworks(g, 330, 50), 500); setTimeout(() => fireworks(g, 240, 40), 1000);
    await g.say('narr', 'c28.end.narr'); await g.say('hero', 'c28.end.hero');
    /* après le générique : la tourelle par le portail orange */
    await g.fade(1, 1200); await g.wait(1500); await g.fade(0, 800);
    g.sfx('whoosh'); const t1 = g.now; await g.until(() => { this.port = Math.min(1, (g.now - t1) / 0.6); return this.port >= 1; });
    Object.assign(T, { visible: true, clip: null }); await g.say('turret', 'c28.end.turret');
    T.visible = false; const t2 = g.now; await g.until(() => { this.port = Math.max(0, 1 - (g.now - t2) / 0.5); return this.port <= 0; }); g.sfx('whoosh');
    g.hero.forceSpr = null; g.hero.forceLife = null; g.end('s2fin');
  },

  async on() { return false; }
};
