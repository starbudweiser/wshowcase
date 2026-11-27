/* Saison 2, chapitre 20 (1/2) : le seau qui tremble. Nuit, pluie, clôture cassée ; le monstre ne voit que ce qui bouge. Le héros
   s'accroupit (l'indicateur « Caché » s'affiche au-dessus de lui, comme chez nous), puis le Wabbajack change le monstre en poule
   géante… rancunière, qui le poursuit jusqu'à la cuisine (s2_20b). Coordonnées logiques 480 × 270 (décor 960 × 540). */
import { zap, twinkle, shout } from '../engine/fx2.js';
import { wabZap, wabSwap, sheoPops, mid, tip } from './s2_common.js';

export default {
  id: 's2_20', hd: true, bg: 's2/d_paddock.webp', music: 's2_20_dinos', amb: ['storm', 0.4], steps: 'dirt',
  persp: [160, 0.45, 268, 0.85], walkK: 1.9, blockR: [16, 6],
  light: { tint: '#8094c0', k: 0.36 },
  walk: [[[4, 176], [476, 176], [476, 268], [4, 268]]],
  start: { x: 236, y: 238, dir: 'r' },
  fx: { rain: { n: 150 }, storm: true, lights: [{ x: 362, y: 20, r: 22, col: '#e8f0ff', a: 0.5, fl: 0, breathe: 0.6 }] },
  hot: [
    { id: 's20fence', rect: [160, 60, 470, 160] }, { id: 's20hut', rect: [28, 84, 160, 160], at: [100, 190] }
  ],
  preload: ['s2:chicken20', 's2:hero_crouch20', 's2:mammoth20', 's2:p_garland20', 's2:p_amberfly20'],
  ents: [
    { id: 'trex', spr: 's2:trex', x: 392, y: 202, scale: 0.98, hot: true, at: [300, 226], block: [50, 10], flip: true, name: 'n.trex' },
    { id: 'goat20', spr: 's2:p_goat20', x: 206, y: 208, scale: 0.32, hot: true, at: [214, 226], block: [12, 4], name: 'n.goat20' },
    { id: 'amber20', spr: 's2:p_amber20', x: 132, y: 144, scale: 0.16, noShadow: true, hot: true, solid: false, at: [120, 192], name: 'n.amber20' },
    { id: 'garland20', spr: 's2:p_garland20', x: 312, y: 136, scale: 0.9, noShadow: true, noLight: true, hot: false, solid: false, visible: false },
    { id: 'paleo', spr: 's2:paleo', x: 150, y: 232, hot: true, at: [190, 240], name: 'n.paleo' },
    { id: 'sheo', spr: 's2:sheo', x: 300, y: 240, hot: false, visible: false, aura: { col: '#c77dff', r: 0.6, a: 0.35, wisps: 3 } }
  ],

  async enter(g, how) {
    const F = k => g.flag(k);
    if (F('garland')) { g.ent('garland20').visible = true; this.fx.glints = [{ rect: [170, 100, 460, 150], n: 18, col: '#ffd166', s: 2, a: 1 }]; } else this.fx.glints = [];
    if (F('butterfly')) g.ent('amber20').spr = 's2:p_amberfly20';
    if (F('goatRoof')) Object.assign(g.ent('goat20'), { x: 96, y: 96, scale: 0.18, noShadow: true, block: null });
    this.crouch = false;
    if (how.intro) g.fx.fade = { from: 1, to: 1, t0: g.now, ms: 0.01, a: 1 };
  },
  /* « [ CACHÉ ] » au-dessus du héros accroupi, à la manière de chez nous */
  draw(g, c) {
    if (!this.crouch || !g.hero.visible) return;
    const [x, y] = g.headPos(g.hero), t = g.T('s20.hidden');
    c.save(); c.font = 'bold 8px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'bottom';
    c.globalAlpha = 0.75 + 0.25 * Math.sin(g.now * 3); c.fillStyle = 'rgba(0,0,0,.6)'; c.fillText(t, x + 0.6, y - 2.4); c.fillStyle = '#f2ead6'; c.fillText(t, x, y - 3);
    c.restore();
  },
  async intro(g) {
    g.hero.front = true;
    await g.card('assets/pointclick/s2/cards/r_jurassic.webp', g.T('ch.s2_20'));
    const P = g.ent('paleo'), T = g.ent('trex');
    g.face(P.x); await g.say('paleo', 'c20.wake.1'); await g.say('hero', 'c20.wake.2');
    const rip = setInterval(() => { if (!g.alive) return clearInterval(rip); const h = g.hero, [x, y] = mid(g, h); twinkle(g, x + 10, y - 10, '#9ad8ff'); }, 300);   /* l'eau du seau tremble */
    await g.say('hero', 'c20.wake.3'); clearInterval(rip); g.face(T.x); await g.say('trex', 'c20.wake.4'); await g.say('narr', 'c20.wake.5'); g.face(P.x); await g.say('paleo', 'c20.crouch.1');
  },

  async on(g, verb, id, item) {
    const F = k => g.flag(k), e = g.ent(id);
    if (verb === 'use' && (item === 'wabbajack' || (id === 'wabbajack' && item))) { await g.cut(() => this.wab(g, item === 'wabbajack' ? id : item)); return true; }
    if (id === 'hero' && verb === 'use' && !item) { await g.cut(() => this.toggleCrouch(g)); return true; }
    if (this.crouch && verb !== 'look') { await g.say('paleo', 'c20.fail.walk'); this.crouch = false; g.hero.forceSpr = null; }
    switch (id) {
      case 'paleo':
        if (verb === 'look') { await g.say('hero', 'c20.look.paleo'); return true; }
        if (verb === 'talk') { await g.say('hero', 'c20.gag.1'); await g.say('paleo', 'c20.gag.2'); await g.say('hero', 'c20.gag.3'); await g.say('paleo', 'c20.gag.4'); return true; }
        break;
      case 'trex':
        if (verb === 'look') { await g.say('hero', 'c20.look.monster'); return true; }
        if (verb === 'use' && item === 'shout') { await g.cut(() => this.shoutBack(g)); return true; }
        break;
      case 'goat20': if (verb === 'look') { await g.say('hero', 'c20.look.goat'); return true; } break;
      case 'amber20': if (verb === 'look') { await g.say('hero', F('butterfly') ? 'look.butterfly20' : 'c20.look.amber'); return true; } break;
      case 's20fence': if (verb === 'look') { await g.say('hero', F('garland') ? 'look.s20garland' : 'c20.look.fence'); return true; } break;
      case 's20hut': if (verb === 'look') { await g.say('hero', 'look.s20hut'); return true; } break;
    }
    return false;
  },

  /* s'accroupir / se relever */
  async toggleCrouch(g) {
    const h = g.hero;
    if (this.crouch) { this.crouch = false; h.forceSpr = null; await g.say('hero', 's20.stand'); return; }
    this.crouch = true; h.forceSpr = 's2:hero_crouch20'; g.sfx('step');
    if (!g.flag('crouched')) { g.set('crouched'); const P = g.ent('paleo'); await g.say('hero', 'c20.crouch.2'); await g.say('paleo', 'c20.crouch.3'); await g.say('hero', 'c20.crouch.4'); }
  },
  /* FUS RO DAH : il répond, plus fort */
  async shoutBack(g) {
    const T = g.ent('trex'), h = g.hero; g.face(T.x); this.crouch = false; h.forceSpr = null;
    await g.say('hero', 'c20.fail.shout.1'); shout(g, ...mid(g, h), 1); g.sfx('shout'); await g.wait(400);
    shout(g, ...mid(g, T), -1); g.sfx('thunder'); await g.say('trex', 'c20.fail.shout.2'); await g.say('hero', 'c20.fail.shout.3');
  },

  async wab(g, id) {
    const e = g.ent(id), P = g.ent('paleo');
    if (id === 'hero') { await this.toggleCrouch(g); return; }
    switch (id) {
      case 'trex': {   /* une poule géante, rancunière : elle poursuit le héros */
        await wabZap(g, e, () => { e.spr = 's2:chicken20'; e.name = 'n.chicken20'; e.flip = false; }, ['#ffffff', '#ffd166', '#ff8a8a']); this.crouch = false; g.hero.forceSpr = null;
        await g.say('trex', 'c20.use.monster.1'); g.face(P.x); await g.say('paleo', 'c20.use.monster.2'); await g.say('hero', 'c20.use.monster.3');
        await sheoPops(g, 'c20.use.monster.sheo');
        await g.say('hero', 'c20.chase.1'); await g.say('paleo', 'c20.chase.2');
        g.walkTo(10, 250); const t0 = g.now, x0 = e.x;   /* il file à gauche, la poule le suit */
        await g.until(() => { const u = Math.min(1, (g.now - t0) / 2.2); e.x = x0 - 260 * u; e.bob = Math.abs(Math.sin(u * 18)) * 6; return u >= 1; });
        await g.say('narr', 'c20.chase.narr'); g.set('chase');
        await g.fade(1, 700); setTimeout(() => g.goScene('s2_20b', { intro: true }), 0); return;
      }
      case 'goat20': {   /* elle disparaît… et réapparaît sur le toit de l'abri */
        if (g.flag('goatRoof')) break;
        await wabZap(g, e, () => { e.visible = false; }); await g.say('hero', 'c20.wk.goat.1');
        await zap(g, 96, 82, { peak: () => { Object.assign(e, { x: 96, y: 96, scale: 0.18, noShadow: true, block: null, visible: true }); }, cols: ['#ffffff', '#e8dcc0'] }); g.chk();
        g.set('goatRoof'); g.face(96); await g.say('hero', 'c20.wk.goat.2'); return;
      }
      case 's20fence': {   /* des guirlandes */
        if (g.flag('garland')) break;
        const G = g.ent('garland20'); g.face(312);
        await zap(g, 312, 120, { from: tip(g), peak: () => { G.visible = true; this.fx.glints = [{ rect: [170, 100, 460, 150], n: 18, col: '#ffd166', s: 2, a: 1 }]; }, cols: ['#ffd166', '#ff8fd8', '#7dffb6'] }); g.chk();
        g.set('garland'); await g.say('hero', 'c20.wk.fence.1'); g.face(P.x); await g.say('paleo', 'c20.wk.fence.2'); return;
      }
      case 'amber20': {   /* un papillon de chez nous : un ingrédient */
        if (g.flag('butterfly')) break;
        await wabZap(g, e, () => { e.spr = 's2:p_amberfly20'; }, ['#9ad8ff', '#ffffff', '#ffd166']); g.set('butterfly'); twinkle(g, e.x, e.y - 8, '#9ad8ff'); g.give('butterfly20');
        await g.say('hero', 'c20.wk.amber.1'); g.face(P.x); await g.say('paleo', 'c20.wk.amber.2'); await g.say('hero', 'c20.wk.amber.3'); return;
      }
      case 'paleo': await wabSwap(g, P, 's2:mammoth20', [['hero', 'c20.wk.paleo.1'], ['paleo', 'c20.wk.paleo.2']], 's20.wk.back'); return;
    }
    await wabZap(g, e, null); await g.say('hero', 'wab.none');
  }
};
