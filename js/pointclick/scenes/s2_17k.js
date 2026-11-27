/* Saison 2, chapitre 17, version française (1/2) : la Table ronde. Le roi cherche le Graal avec ses deux chevaliers les plus lents,
   qui ne retiennent qu'un mot : « fromage ». Ils refusent de partir le ventre vide : le Wabbajack sur la table fait apparaître un
   banquet. Ensuite, la porte mène à la grotte (s2_17kb). Coordonnées logiques 480 × 270 (décor 960 × 540). */
import { zap, twinkle, confetti } from '../engine/fx2.js';
import { wabZap, wabSwap, sheoPops, mid, tip } from './s2_common.js';

const TABLE = [230, 176];

export default {
  id: 's2_17k', hd: true, bg: 's2/d_round.webp', music: 's2_17_table_fr', amb: ['hall', 0.25], steps: 'stone',
  persp: [186, 0.6, 268, 0.84], walkK: 1.9, blockR: [16, 6],
  light: { tint: '#ffcf9a', k: 0.18, lamps: [{ x: 392, y: 160, r: 170, col: '#ff9a40', k: 0.6 }, { x: 18, y: 50, r: 120, col: '#ffb050', k: 0.45 }, { x: 460, y: 48, r: 110, col: '#ffb050', k: 0.4 }] },
  walk: [[[4, 186], [118, 186], [118, 252], [352, 256], [352, 192], [476, 194], [476, 268], [4, 268]]],
  start: { x: 236, y: 262, dir: 'l' },
  fx: {
    lights: [{ x: 19, y: 48, r: 22, col: '#ffb050', a: 0.85, fl: 0.3 }, { x: 461, y: 46, r: 22, col: '#ffb050', a: 0.85, fl: 0.3 }, { x: 254, y: 64, r: 14, col: '#ffb050', a: 0.8, fl: 0.3 },
      { x: 338, y: 62, r: 14, col: '#ffb050', a: 0.8, fl: 0.3 }, { x: 400, y: 160, r: 40, col: '#ff8a30', a: 0.7, fl: 0.35 }],
    embers: [{ x: 398, y: 166, w: 16, rate: 5 }]
  },
  hot: [
    { id: 's17table', poly: [[140, 160], [180, 147], [290, 147], [322, 162], [300, 192], [170, 194]], at: [146, 262], dir: 'r' },
    { id: 's17door', rect: [86, 72, 134, 172], at: [110, 190], dir: 'l' }, { id: 's17fire', rect: [348, 110, 422, 192], at: [380, 206] },
    { id: 's17banners', rect: [128, 0, 168, 92] }, { id: 's17banners', rect: [372, 0, 412, 60] }
  ],
  preload: ['s2:p_banquet17', 's2:p_ham17', 's2:p_dicecheese17'],
  ents: [
    { id: 'arthur', spr: 's2:arthur', x: 66, y: 222, hot: true, at: [104, 236], name: 'n.arthur' },
    { id: 'perceval', spr: 's2:perceval', x: 366, y: 222, hot: true, at: [330, 258], flip: true, name: 'n.perceval' },
    { id: 'karadoc', spr: 's2:karadoc', x: 452, y: 252, hot: true, at: [400, 262], flip: true, name: 'n.karadoc' },
    { id: 'dice17', spr: 's2:p_dice17', x: 268, y: 168, scale: 0.55, noShadow: true, hot: true, solid: false, at: [270, 258], name: 'n.dice17' },
    { id: 'banquet', spr: 's2:p_banquet17', x: TABLE[0], y: TABLE[1], scale: 1.12, noShadow: true, hot: false, solid: false, visible: false },
    { id: 'roll17', spr: 's2:i_sweetroll', x: 424, y: 89, scale: 0.4, noShadow: true, hot: true, solid: false, at: [424, 206], name: 'n.sweetroll' },
    { id: 'sheo', spr: 's2:sheo', x: 300, y: 240, hot: false, visible: false, aura: { col: '#c77dff', r: 0.6, a: 0.35, wisps: 3 } }
  ],

  async enter(g, how) {
    const F = k => g.flag(k);
    if (F('banquet')) { const B = g.ent('banquet'); B.visible = true; this.fx.steam = [{ x: TABLE[0], y: TABLE[1] - 22, w: 26, rate: 2, a: 0.25 }]; } else delete this.fx.steam;
    if (F('rollTaken') || F('rollEaten')) g.ent('roll17').visible = false;
    if (how.intro) g.fx.fade = { from: 1, to: 1, t0: g.now, ms: 0.01, a: 1 };
  },
  async intro(g) {
    g.hero.front = true;
    await g.card('assets/pointclick/s2/cards/r_kaamelott.webp', g.T('ch.s2_17k'));
    const P = g.ent('perceval'), A = g.ent('arthur'), K = g.ent('karadoc');
    g.face(P.x); await g.say('perceval', 'c17k.wake.1'); await g.say('hero', 'c17k.wake.2'); await g.say('narr', 'c17k.wake.3');
    g.face(A.x); await g.say('arthur', 'c17k.wake.4'); await g.say('hero', 'c17k.wake.5'); g.face(K.x); await g.say('karadoc', 'c17k.wake.6');
  },

  async on(g, verb, id, item) {
    const F = k => g.flag(k), e = g.ent(id);
    if (verb === 'use' && (item === 'wabbajack' || (id === 'wabbajack' && item))) { await g.cut(() => this.wab(g, item === 'wabbajack' ? id : item)); return true; }
    switch (id) {
      case 'arthur':
        if (verb === 'look') { await g.say('hero', 'c17k.look.king'); return true; }
        if (verb === 'talk') {
          await g.say('arthur', 'c17k.talk.king.1'); if (F('cri')) return true; g.set('cri');
          await g.say('hero', 'c17k.talk.king.2'); await g.say('perceval', 'c17k.cri.1'); await g.say('hero', 'c17k.cri.2'); await g.say('karadoc', 'c17k.cri.3');
          await g.say('hero', 'c17k.cri.4'); await g.say('perceval', 'c17k.cri.5'); await g.say('arthur', 'c17k.cri.6'); await g.say('narr', 'c17k.cri.narr'); return true;
        }
        break;
      case 'perceval':
        if (verb === 'look') { await g.say('hero', 'c17k.look.slow'); return true; }
        if (verb === 'talk') { await g.say('perceval', 'c17k.talk.slow.1'); await g.say('hero', 'c17k.talk.slow.2'); return true; }
        break;
      case 'karadoc':
        if (verb === 'look') { await g.say('hero', 'c17k.look.greedy'); return true; }
        if (verb === 'talk') { await g.say('karadoc', 'c17k.talk.greedy'); return true; }
        if (verb === 'use' && item === 'sweetroll') {
          await g.say('hero', 'c17k.fail.sweetroll.1'); g.drop('sweetroll'); g.set('rollEaten'); twinkle(g, e.x - 20, e.y - 70, '#ffd166');
          await g.say('karadoc', 'c17k.fail.sweetroll.2'); await g.say('hero', 'c17k.fail.sweetroll.3'); return true;
        }
        break;
      case 's17table': if (verb === 'look') { await g.say('hero', F('banquet') ? 'look.s17banquet' : 'c17k.look.table'); return true; } break;
      case 'dice17': if (verb === 'look') { await g.say('hero', 'c17k.look.dice'); return true; } break;
      case 'roll17':
        if (verb === 'look') { await g.say('hero', 'look.sweetroll'); return true; }
        if (verb === 'take' || (verb === 'use' && !item)) { e.visible = false; twinkle(g, e.x, e.y - 4, '#ffd166'); g.sfx('pop'); g.give('sweetroll'); g.set('rollTaken'); await g.say('hero', 'take.s17roll'); return true; }
        break;
      case 's17door':
        if (verb === 'look') { await g.say('hero', 'look.s17door'); return true; }
        if (verb === 'use' || verb === 'walk' || verb === 'take') {
          if (!F('banquet')) { await g.cut(async () => { await g.say('hero', 'c17k.leave.1'); g.face(g.ent('karadoc').x); await g.say('karadoc', 'c17k.leave.2'); await g.say('perceval', 'c17k.leave.3'); }); return true; }
          await g.fade(1, 700); setTimeout(() => g.goScene('s2_17kb', { intro: true }), 0); return true;
        }
        break;
      case 's17fire': if (verb === 'look') { await g.say('hero', 'look.s17fire'); return true; } break;
      case 's17banners': if (verb === 'look') { await g.say('hero', 'look.s17banners'); return true; } break;
    }
    return false;
  },

  async wab(g, id) {
    const e = g.ent(id), A = g.ent('arthur'), K = g.ent('karadoc'), P = g.ent('perceval');
    if (id === 'hero') { await g.say('hero', 'wab.self'); return; }
    switch (id) {
      case 's17table': {   /* un banquet : le gras, c'est la vie */
        if (g.flag('banquet')) break;
        const B = g.ent('banquet'); g.face(TABLE[0]);
        await zap(g, TABLE[0], TABLE[1] - 14, { from: tip(g), peak: () => { B.visible = true; confetti(g, TABLE[0], TABLE[1] - 30, 24); this.fx.steam = [{ x: TABLE[0], y: TABLE[1] - 22, w: 26, rate: 2, a: 0.25 }]; }, cols: ['#ffd166', '#ffffff', '#ff9a3c'] }); g.chk();
        g.set('banquet'); await g.say('hero', 'c17k.use.table.1'); g.face(K.x); await g.say('karadoc', 'c17k.use.table.2'); await g.say('perceval', 'c17k.use.table.3');
        await g.fade(1, 500); await g.wait(500); await g.fade(0, 500);   /* une heure plus tard */
        g.face(A.x); await g.say('arthur', 'c17k.use.table.4'); g.face(K.x); await g.say('karadoc', 'c17k.use.table.5'); await g.say('hero', 'c17k.use.table.6'); return;
      }
      case 'perceval': {   /* brillant trois secondes */
        await wabZap(g, P, () => { P.aura = { col: '#ffd166', r: 0.75, a: 0.55, wisps: 7 }; }, ['#ffd166', '#ffffff', '#9ad8ff']);
        const tw = setInterval(() => { if (!g.alive) return clearInterval(tw); const [x, y] = mid(g, P); twinkle(g, x + (Math.random() - 0.5) * 30, y - 20 + (Math.random() - 0.5) * 30, '#fff3b0'); }, 260);
        await g.say('perceval', 'c17k.wk.slow.1'); clearInterval(tw); P.aura = null; await g.say('perceval', 'c17k.wk.slow.2'); g.face(A.x); await g.say('arthur', 'c17k.wk.slow.3'); return;
      }
      case 'karadoc': {   /* une tranche de jambon qui se trouve appétissante */
        await wabZap(g, K, () => { K.spr = 's2:p_ham17'; }); await g.say('karadoc', 'c17k.wk.greedy.1'); await g.say('hero', 'c17k.wk.greedy.2');
        await sheoPops(g, 'c17k.wk.greedy.sheo');
        await zap(g, ...mid(g, K), { peak: () => { K.spr = 's2:karadoc'; } }); g.chk(); await g.say('hero', 's17.wk.back'); return;
      }
      case 'dice17': await wabSwap(g, e, 's2:p_dicecheese17', [['hero', 'c17k.wk.dice.1'], ['perceval', 'c17k.wk.dice.2']], 's17.wk.back'); return;
    }
    await wabZap(g, e, null); await g.say('hero', 'wab.none');
  }
};
