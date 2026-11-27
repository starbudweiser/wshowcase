/* Saison 2, chapitre 16 (1/2) : le Choixseau. Grande salle d'un château de sorciers, la nuit, bougies flottantes, plafond étoilé,
   élèves aux tables. Le chapeau parlant refuse le casque à cornes : le Wabbajack en fait un seau, qui se pose sans difficulté et
   répartit le héros à « RIVEBOIS ». Après le cours de potions (s2_16b), retour dans la salle pour la fin du chapitre.
   Coordonnées logiques 480 × 270 (décor 960 × 540). */
import { zap, twinkle, fireworks, confetti } from '../engine/fx2.js';
import { wabZap, sheoPops, nextChapter, mid, tip } from './s2_common.js';

const STOOL = [240, 196];
/* bougies flottantes : [x, y à l'écran (pied de la bougie), échelle] ; deux rangées au-dessus des tables, quelques-unes plus haut */
const CANDLES = [
  [30, 40, 0.46], [70, 52, 0.38], [104, 62, 0.32], [132, 71, 0.27], [156, 78, 0.23], [176, 84, 0.2], [193, 89, 0.17],
  [450, 38, 0.46], [410, 50, 0.38], [376, 61, 0.32], [348, 70, 0.27], [324, 77, 0.23], [304, 83, 0.2], [287, 88, 0.17],
  [205, 32, 0.22], [275, 28, 0.22], [240, 50, 0.18], [122, 20, 0.3], [360, 18, 0.3]
];
const CH = 40;   /* hauteur logique d'une bougie à l'échelle 1 (sprite de 80 px en densité 2) */

export default {
  id: 's2_16', hd: true, bg: 's2/d_hall.webp', music: 's2_16_sorciers', amb: ['greathall', 0.3], steps: 'wood',
  persp: [178, 0.47, 266, 0.78], walkK: 1.9, blockR: [16, 6],
  light: { tint: '#ffd49a', k: 0.14, lamps: [{ x: 240, y: 70, r: 260, col: '#ffcf80', k: 0.3 }] },
  walk: [[[165, 178], [312, 178], [405, 266], [55, 266]]],
  start: { x: 196, y: 244, dir: 'r' },
  /* élèves du premier plan, vivants (bandes du décor en boucle LTX) */
  video: [{ src: 'assets/pointclick/s2/v_hall_l.mp4', rect: [0, 84, 216, 120], feather: 9, edges: 'rtb', low: { id: 'hall_l', n: 24, fps: 6 } },
    { src: 'assets/pointclick/s2/v_hall_r.mp4', rect: [264, 84, 216, 120], feather: 9, edges: 'ltb', low: { id: 'hall_r', n: 24, fps: 6 } }],
  fx: { lights: [], glints: [{ rect: [150, 0, 340, 36], n: 14, col: '#dfe8ff', s: 2.2, a: 0.8 }] },
  hot: [
    { id: 's16ceiling', rect: [150, 0, 340, 36] }, { id: 's16window', rect: [214, 30, 262, 92] }, { id: 's16high', rect: [214, 94, 268, 118] },
    { id: 's16candles', poly: [[8, 14], [205, 70], [205, 96], [8, 50]] }, { id: 's16candles', poly: [[472, 14], [275, 70], [275, 96], [472, 50]] },
    { id: 's16tables', poly: [[0, 88], [215, 108], [215, 124], [120, 150], [0, 176]], at: [175, 200], dir: 'l' },
    { id: 's16tables', poly: [[265, 108], [480, 86], [480, 176], [360, 150], [265, 124]], at: [305, 200], dir: 'r' }
  ],
  preload: ['s2:bucket16', 's2:hero_sort16', 's2:chicken16', 's2:p_fcheese16', 's2:p_candle16'],
  ents: [
    { id: 'stool16', spr: 's2:p_stool16', x: STOOL[0], y: STOOL[1], hot: true, at: [214, 214], block: [12, 4], name: 'n.stool16' },
    { id: 'hat', spr: 's2:hat16', x: STOOL[0], y: STOOL[1] + 0.5, bob: 24, noShadow: true, hot: true, at: [214, 214], solid: false, name: 'n.hat16' },
    { id: 'owl16', spr: 's2:owl16', x: 324, y: 194, hot: true, at: [286, 226], block: [10, 4], name: 'n.owl16' },
    { id: 'sheo', spr: 's2:sheo', x: 300, y: 240, hot: false, visible: false, aura: { col: '#c77dff', r: 0.6, a: 0.35, wisps: 3 } },
    ...CANDLES.map(([x, y, s], i) => ({ id: 'cd' + i, spr: 's2:p_candle16', x, y, scale: s, noShadow: true, noLight: true, hot: false, solid: false, ph: i * 1.7 }))
  ],

  async enter(g, how) {
    const F = k => g.flag(k), fx = this.fx;
    /* lueur de chaque bougie, attachée à la bougie (elle flotte) */
    fx.lights = CANDLES.map(([, , s], i) => ({ ent: g.ent('cd' + i), dy: CH * s * 0.97, r: 34 * s + 6, col: '#ffc46a', a: 0.75, fl: 0.25 }));
    if (F('snow')) fx.snow = { n: 140 }; else delete fx.snow;
    if (F('sorted')) { const h = g.ent('hat'); h.spr = 's2:bucket16'; h.name = 'n.bucket16'; }
    if (F('potion') && how.restored) g.run(() => g.cut(() => this.ending(g)));
    if (how.intro) g.fx.fade = { from: 1, to: 1, t0: g.now, ms: 0.01, a: 1 };
  },
  /* les bougies montent et descendent doucement, chacune à son rythme */
  tick(g) { for (let i = 0; i < CANDLES.length; i++) { const e = g.ent('cd' + i); if (e) e.bob = Math.sin(g.now * 1.25 + e.ph) * 1.8 * (e.scale / 0.3); } },

  async intro(g) {
    if (g.flag('potion')) { g.face(g.ent('hat').x); await g.fade(0, 900); await this.ending(g); return; }
    g.hero.front = true;
    await g.card('assets/pointclick/s2/cards/r_potter.webp', g.T('ch.s2_16'));
    const H = g.ent('hat'); g.face(H.x);
    await g.say('hat', 'c16.wake.1'); await g.say('hero', 'c16.wake.2'); await g.say('narr', 'c16.wake.3'); await g.say('hat', 'c16.wake.4');
  },

  async on(g, verb, id, item) {
    const F = k => g.flag(k);
    if (verb === 'use' && (item === 'wabbajack' || (id === 'wabbajack' && item))) { await g.cut(() => this.wab(g, item === 'wabbajack' ? id : item)); return true; }
    switch (id) {
      case 'hat':
        if (F('sorted')) { if (verb === 'look') { await g.say('hero', 'look.bucket16'); return true; } break; }
        if (verb === 'look') { await g.say('hero', 'c16.look.hat'); return true; }
        if (verb === 'talk') { await g.say('hat', 'c16.wake.4'); return true; }
        if (verb === 'take') { await g.say('hat', 'c16.take.hat.bad'); return true; }
        if (verb === 'use' && !item) { await g.say('hat', 'c16.use.hat.bad'); await g.say('hero', 'c16.use.hat.bad.hero'); return true; }
        break;
      case 'stool16':
        if (verb === 'look') { await g.say('hero', 'look.stool16'); return true; }
        if (verb === 'use' && !item && !F('sorted')) { await g.say('hat', 'c16.use.hat.bad'); await g.say('hero', 'c16.use.hat.bad.hero'); return true; }
        break;
      case 'owl16':
        if (verb === 'look') { await g.say('hero', 'look.owl16'); return true; }
        if (verb === 'talk') { await g.say('hero', 's16.owl.talk'); return true; }
        break;
      case 's16candles': if (verb === 'look') { await g.say('hero', 'c16.look.candles'); return true; } break;
      case 's16ceiling': if (verb === 'look') { await g.say('hero', 'c16.look.ceiling'); return true; } break;
      case 's16tables': if (verb === 'look') { await g.say('hero', 'c16.look.students'); return true; } break;
      case 's16high': if (verb === 'look') { await g.say('hero', 'look.s16high'); return true; } break;
      case 's16window': if (verb === 'look') { await g.say('hero', 'look.s16window'); return true; } break;
    }
    return false;
  },

  async wab(g, id) {
    const e = g.ent(id), h = g.hero;
    if (id === 'hero') { await g.say('hero', 'wab.self'); return; }
    switch (id) {
      case 'hat': if (!g.flag('sorted')) { await this.sort(g); return; } break;
      case 's16candles': {   /* les bougies deviennent des fromages flottants, puis reviennent */
        const cs = CANDLES.map((_, i) => g.ent('cd' + i));
        g.face(240); await zap(g, 240, 60, { from: tip(g), peak: () => cs.forEach(c => { c.spr = 's2:p_fcheese16'; c.lightOff = true; c.noLight = false; twinkle(g, c.x, c.y - 6, '#ffd166'); }), cols: ['#ffd166', '#ffffff', '#f4b942'] }); g.chk();
        await g.say('hero', 'c16.wk.candles'); await g.wait(500);
        await zap(g, 240, 60, { peak: () => cs.forEach(c => { c.spr = 's2:p_candle16'; c.lightOff = false; c.noLight = true; }) }); g.chk(); await g.say('hero', 's16.wk.back'); return;
      }
      case 's16ceiling': {   /* il neige dans la grande salle */
        if (g.flag('snow')) break;
        g.face(240); await zap(g, 240, 18, { from: tip(g), cols: ['#dff2ff', '#ffffff', '#9ad8ff'] }); g.chk();
        this.fx.snow = { n: 140, t0: g.now }; g.set('snow'); await g.wait(900); await g.say('hero', 'c16.wk.ceiling'); return;
      }
      case 'owl16': {   /* une poule postale, une lettre au bec */
        await wabZap(g, e, () => { e.spr = 's2:chicken16'; }); await g.say('hero', 'c16.wk.owl');
        await sheoPops(g, 'c16.wk.owl.sheo');
        await zap(g, ...mid(g, e), { peak: () => { e.spr = 's2:owl16'; } }); g.chk(); await g.say('hero', 's16.wk.back'); return;
      }
    }
    await wabZap(g, e, null); await g.say('hero', 'wab.none');
  },

  /* le chapeau devient seau ; posé sur le casque, il répartit le héros */
  async sort(g) {
    const H = g.ent('hat'), S = g.ent('stool16'), h = g.hero;
    await wabZap(g, H, () => { H.spr = 's2:bucket16'; H.name = 'n.bucket16'; }, ['#c9a46a', '#ffffff', '#ffd166']);
    await g.say('hero', 'c16.wab.hat.1');
    await g.walkTo(STOOL[0] - 22, STOOL[1] + 14);
    await g.fade(1, 300); H.visible = false; S.visible = false; Object.assign(h, { x: STOOL[0], y: STOOL[1] + 0.6, forceSpr: 's2:hero_sort16', front: true });
    g.cinePos = { hat: [STOOL[0], STOOL[1] - 106] }; await g.fade(0, 400);
    await g.say('hat', 'c16.wab.hat.2'); await g.say('hat', 'c16.wab.hat.3'); await g.say('hero', 'c16.wab.hat.4'); await g.say('hat', 'c16.wab.hat.5');
    await g.say('hat', 'c16.wab.hat.6');
    g.sfx('fileFx', 'applause', 0.5); fireworks(g, 240, 70, 3, ['#ffd166', '#c9a46a', '#ffffff', '#f4b942']); confetti(g, 150, 100, 30); confetti(g, 330, 100, 30);
    await g.say('hero', 'c16.wab.hat.hero'); await g.say('narr', 'c16.wab.hat.narr'); g.set('sorted');
    await g.fade(1, 1000); g.cinePos = null; h.forceSpr = null;
    setTimeout(() => g.goScene('s2_16b', { intro: true }), 0);
  },

  /* retour après la potion : la meule du banquet gagnée, le seau a le dernier mot */
  async ending(g) {
    const H = g.ent('hat'); g.face(H.x);
    twinkle(g, H.x, H.y - 30, '#ffd166');
    await g.say('hat', 'c16.end.hat'); await g.say('hero', 'c16.end.hero'); await g.say('narr', 'c16.end.narr');
    await g.fade(1, 1200); nextChapter(g, 's2_16');
  }
};
