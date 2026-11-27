/* Saison 2, chapitre 18 (2/2) : le pays dévoré par le Néant. Le dragon porte-bonheur ne vole pas tant que personne n'a crié un nom
   du fond du cœur : « Lydia » (non), le nom d'un dragon (un vrai passe, vexé), puis « SHEOGORATH ! » (de la rancune, ça vient aussi du
   cœur). En vol jusqu'au Néant : le Wabbajack en fait un gruyère. Coordonnées logiques 480 × 270 (décor 960 × 540). */
import { zap, twinkle, confetti } from '../engine/fx2.js';
import { wabZap, wabSwap, sheoPops, nextChapter, mid, tip } from './s2_common.js';

const NOTHING = [410, 188];
const SWAMP = [[0, 100], [60, 98], [120, 104], [160, 110], [182, 122], [186, 146], [160, 162], [100, 172], [0, 178]];

export default {
  id: 's2_18b', hd: true, bg: 's2/d_nothing.webp', music: 's2_18_barbare', amb: ['swamp', 0.3], steps: 'dirt',
  persp: [150, 0.42, 268, 0.88], walkK: 1.9, blockR: [16, 6],
  light: { tint: '#ffe6d0', k: 0.08, lamps: [{ x: 380, y: 60, r: 200, col: '#ffc070', k: 0.35 }] },
  walk: [[[4, 196], [200, 184], [300, 172], [476, 168], [476, 268], [4, 268]]],
  start: { x: 120, y: 236, dir: 'r' },
  fx: { lights: [], glints: [] },
  hot: [
    { id: 's18swamp', poly: SWAMP, at: [150, 200] }, { id: 's18hill', rect: [150, 40, 320, 168] }
  ],
  preload: ['s2:p_gruyere18', 's2:p_dog18', 's2:p_skydragon18', 's2:p_ride18', 's2:p_fondue18'],
  ents: [
    { id: 'nothing18', spr: 's2:p_nothing18', x: NOTHING[0], y: NOTHING[1], scale: 0.8, noShadow: true, noLight: true, hot: true, solid: false, at: [380, 232], name: 'n.nothing18' },
    { id: 'fondue18', spr: 's2:p_fondue18', x: 104, y: 150, bob: -150, scale: 3.6, alpha: 0.58, clip: SWAMP, noShadow: true, hot: false, solid: false, visible: false },
    { id: 'luckdragon', spr: 's2:luckdragon', x: 296, y: 226, float: 10, hot: true, at: [236, 236], flip: true, name: 'n.luckdragon' },
    { id: 'skydragon', spr: 's2:p_skydragon18', x: -60, y: 60, scale: 0.42, noShadow: true, hot: false, solid: false, visible: false },
    { id: 'ride', spr: 's2:p_ride18', x: -80, y: 90, scale: 0.6, noShadow: true, hot: false, solid: false, visible: false },
    { id: 'sheo', spr: 's2:sheo', x: 300, y: 240, hot: false, visible: false, aura: { col: '#c77dff', r: 0.6, a: 0.35, wisps: 3 } }
  ],

  async enter(g, how) {
    const F = k => g.flag(k);
    this.fx.glints = F('fondue') ? [{ rect: [10, 108, 180, 170], n: 14, col: '#ffe08a', s: 1.8, a: 0.9 }] : []; this.fx.steam = F('fondue') ? [{ x: 90, y: 140, w: 70, rate: 2.5, a: 0.3, col: '#ffe9a8' }] : [];
    if (F('fondue')) g.ent('fondue18').visible = true;
    if (F('flight')) { Object.assign(g.ent('luckdragon'), { x: 250, y: 226 }); g.hero.x = 352; g.hero.y = 236; }
    if (F('gruyere')) Object.assign(g.ent('nothing18'), { spr: 's2:p_gruyere18', spin: false, rot: 0, scale: 1.02 });
    if (how.intro) g.fx.fade = { from: 1, to: 1, t0: g.now, ms: 0.01, a: 1 };
  },
  /* le Néant tourne lentement et aspire des lambeaux de paysage */
  tick(g, dt) {
    const N = g.ent('nothing18'); if (!N || g.flag('gruyere')) return;
    N.rot = (N.rot || 0) + dt * 0.25;
    if ((this._w = (this._w || 0) + dt) < 0.12) return; this._w = 0;
    const a = Math.random() * Math.PI * 2, r = 70 + Math.random() * 30, P = g.parts = g.parts || [];
    const x = NOTHING[0] + Math.cos(a) * r, y = NOTHING[1] - 70 + Math.sin(a) * r * 0.7;
    P.push({ k: 'smoke', x, y, vx: (NOTHING[0] - x) * 0.6, vy: (NOTHING[1] - 70 - y) * 0.6, g: 0, drag: 0, t: 0, life: 1.4, s: 3, grow: -1.5, rot: a, vr: 1.5, a: 0.6, tint: '#3a2a4a' });
  },
  async intro(g) {
    await g.fade(0, 900); const D = g.ent('luckdragon');
    g.face(NOTHING[0]); await g.say('hero', 'c18.look.nothing'); await g.say('narr', 'c18.nothing.narr');
    g.face(D.x); await g.say('luckdragon', 'c18.dragon.1'); await g.say('hero', 'c18.look.dragon'); await g.say('luckdragon', 'c18.dragon.2'); await g.say('hero', 'c18.dragon.3');
  },

  async on(g, verb, id, item) {
    const F = k => g.flag(k), e = g.ent(id);
    if (verb === 'use' && (item === 'wabbajack' || (id === 'wabbajack' && item))) { await g.cut(() => this.wab(g, item === 'wabbajack' ? id : item)); return true; }
    switch (id) {
      case 'luckdragon':
        if (verb === 'look') { await g.say('hero', 'c18.look.dragon'); return true; }
        if (verb === 'talk') { await g.say('luckdragon', F('flight') ? 'c18.flight.1' : 'c18.dragon.2'); return true; }
        if (verb === 'use' && item === 'shout') { if (F('flight')) { await g.say('hero', 'wab.none'); return true; } await g.cut(() => this.names(g)); return true; }
        break;
      case 'nothing18': if (verb === 'look') { await g.say('hero', F('gruyere') ? 'look.gruyere18' : 'c18.look.nothing'); return true; } break;
      case 's18swamp': if (verb === 'look') { await g.say('hero', 'c18.look.swamp'); return true; } break;
      case 's18hill': if (verb === 'look') { await g.say('hero', 'look.s18hill'); return true; } break;
    }
    return false;
  },

  /* les noms criés au dragon blanc, un par Cri */
  async names(g) {
    const D = g.ent('luckdragon'), n = (g.flag('names') || 0) + 1; g.set('names', n); g.face(D.x);
    if (n === 1) { await g.say('hero', 'c18.name.1'); await g.say('luckdragon', 'c18.name.2'); await g.say('hero', 's18.shout.again'); return; }
    if (n === 2) {   /* le nom d'un dragon : un vrai dragon passe, vexé ; chacun croit que l'autre n'en est pas un */
      await g.say('hero', 'c18.name.3'); const S = g.ent('skydragon'), t0 = g.now; Object.assign(S, { x: -60, y: 64, visible: true }); g.sfx('whoosh');
      const fly = setInterval(() => { if (!g.alive) return clearInterval(fly); const u = (g.now - t0) / 6; S.x = -60 + 620 * Math.min(1, u); S.bob = Math.sin(g.now * 3) * 4; if (u >= 1) { S.visible = false; clearInterval(fly); } }, 30);
      await g.say('luckdragon', 'c18.gag.1'); await g.say('hero', 'c18.gag.2'); await g.say('luckdragon', 'c18.gag.3'); await g.say('hero', 'c18.gag.4'); await g.say('hero', 's18.shout.again'); return;
    }
    await g.say('hero', 'c18.name.4'); await g.say('luckdragon', 'c18.name.5');
    await sheoPops(g, 'c18.name.sheo'); await g.say('hero', 'c18.name.6');
    /* l'envol : le dragon blanc emporte le héros jusqu'au Néant */
    const R = g.ent('ride'), h = g.hero; await g.fade(1, 400); D.visible = false; h.visible = false; Object.assign(R, { x: -80, y: 110, visible: true }); await g.fade(0, 400);
    const t0 = g.now; g.cinePos = { luckdragon: [240, 40], hero: [240, 40] };
    const tw = setInterval(() => { if (!g.alive || !R.visible) return clearInterval(tw); twinkle(g, R.x - 50, R.y - 20, '#fff3f8'); }, 180);
    const fl = setInterval(() => { if (!g.alive) return clearInterval(fl); const u = Math.min(1, (g.now - t0) / 5); R.x = -80 + 420 * u; R.y = 110 - Math.sin(u * Math.PI) * 30; R.bob = Math.sin(g.now * 2.4) * 5; if (u >= 1) clearInterval(fl); }, 30);
    await g.say('luckdragon', 'c18.flight.1'); await g.say('hero', 'c18.flight.2'); await g.wait(600);
    clearInterval(tw); clearInterval(fl); await g.fade(1, 400); R.visible = false; g.cinePos = null;
    Object.assign(D, { x: 250, y: 226, visible: true }); Object.assign(h, { x: 352, y: 236, visible: true }); g.set('flight'); await g.fade(0, 500); g.face(NOTHING[0]);
  },

  async wab(g, id) {
    const e = g.ent(id), D = g.ent('luckdragon');
    if (id === 'hero') { await g.say('hero', 'wab.self'); return; }
    switch (id) {
      case 'nothing18': {   /* un gruyère : le Néant n'était qu'une collection de trous */
        if (g.flag('gruyere')) break;
        if (!g.flag('flight')) { await g.say('hero', 's18.nothing.far'); return; }
        await wabZap(g, e, () => { e.spr = 's2:p_gruyere18'; e.rot = 0; e.scale = 1.02; confetti(g, NOTHING[0], NOTHING[1] - 60, 40); }, ['#ffd166', '#ffffff', '#f4b942']); g.set('gruyere');
        await g.say('hero', 'c18.use.nothing.1'); g.face(D.x); await g.say('luckdragon', 'c18.use.nothing.2'); await g.say('narr', 'c18.use.nothing.narr');
        twinkle(g, NOTHING[0], NOTHING[1] - 40, '#ffd166'); g.sfx('pop'); g.give('cheese18'); await g.say('hero', 'c18.use.nothing.3');
        await g.say('hero', 'c18.end.1'); await g.say('narr', 'c18.end.2'); await g.fade(1, 1200); nextChapter(g, 's2_18'); return;
      }
      case 'luckdragon': await wabSwap(g, D, 's2:p_dog18', [['luckdragon', 'c18.wk.dragon.1'], ['hero', 'c18.wk.dragon.2']], 's18.wk.back'); return;
      case 's18swamp': {   /* un marais de fondue */
        if (g.flag('fondue')) break;
        const Fo = g.ent('fondue18'); g.face(120);
        await zap(g, 120, 140, { from: tip(g), peak: () => { Fo.visible = true; this.fx.glints = [{ rect: [10, 108, 180, 170], n: 14, col: '#ffe08a', s: 1.8, a: 0.9 }]; this.fx.steam = [{ x: 90, y: 140, w: 70, rate: 2.5, a: 0.3, col: '#ffe9a8' }]; }, cols: ['#ffd166', '#ffffff', '#f4b942'] }); g.chk();
        g.set('fondue'); await g.say('hero', 'c18.wk.swamp'); return;
      }
    }
    await wabZap(g, e, null); await g.say('hero', 'wab.none');
  }
};
