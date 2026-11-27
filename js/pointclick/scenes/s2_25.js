/* Saison 2, chapitre 25 (1/2) : « Vous ne passerez pas ! ». Un pont de pierre sur un abîme de feu ; le vieux magicien gris attend
   son grand moment, le héros lui coupe la parole d'un Cri. Le démon remonte toujours : le Wabbajack en fait un crabe de vase, qui
   passe quand même, de côté. Un anneau traîne sur le pont (Wabbajack : le héros devient invisible, sauf son casque).
   Coordonnées logiques 480 × 270 (décor 960 × 540). */
import { zap, twinkle, hit, shout } from '../engine/fx2.js';
import { wabZap, wabSwap, mid, tip } from './s2_common.js';

/* le démon monte de l'abîme derrière le pont : visible seulement au-dessus du bord lointain du tablier */
const ABOVE = [[0, 0], [480, 0], [480, 174], [380, 186], [250, 202], [120, 220], [0, 238]];
const UP = 298, DOWN = 592, HIT = [300, 60, 450, 176];
/* y : pieds réels (sous le pont) ; z le range derrière le héros ; hit : seulement le buste visible */
const put = (D, y) => { D.y = y; D.z = 120 - y; D.hit = y < UP + 40 ? HIT : [0, 0, 0, 0]; };

export default {
  id: 's2_25', hd: true, bg: 's2/d_bridge25.webp', music: 's2_25_comte', amb: ['dungeon', 0.35], steps: 'stone',
  persp: [176, 0.56, 268, 0.88], walkK: 1.9, blockR: [16, 6],
  light: { tint: '#ffb27a', k: 0.2 },
  walk: [[[4, 238], [120, 220], [250, 204], [380, 188], [476, 178], [476, 194], [400, 210], [330, 224], [250, 242], [170, 260], [130, 268], [4, 268]]],
  start: { x: 60, y: 252, dir: 'r' },
  fx: {
    lights: [{ x: 180, y: 190, r: 150, col: '#ff7a2a', a: 0.2, fl: 0.18 }, { x: 420, y: 230, r: 120, col: '#ff8a3a', a: 0.22, fl: 0.2 }],
    embers: [{ x: 170, y: 214, w: 60, rate: 4 }, { x: 330, y: 196, w: 50, rate: 3 }, { x: 440, y: 262, w: 40, rate: 5, col: '#ffd070' }]
  },
  hot: [
    { id: 's25exit', rect: [440, 150, 480, 194], at: [462, 186], dir: 'r' },
    { id: 's25chasm', rect: [110, 110, 480, 176] },
    { id: 's25bridge', poly: [[4, 238], [476, 178], [476, 196], [130, 268], [4, 268]] }
  ],
  preload: ['s2:p_crab25', 's2:wizard_bucket25', 's2:p_helmet25'],
  ents: [
    { id: 'demon', spr: 's2:demon', x: 362, y: UP, z: 120 - UP, hit: HIT, scale: 0.7, clip: ABOVE, noShadow: true, noLight: true, hot: true, solid: false, at: [330, 228], name: 'n.demon',
      light: { col: '#ff6a20', r: 160, a: 0.28 } },
    { id: 'ring25', spr: 's2:p_ring25', x: 300, y: 218, scale: 0.2, noShadow: true, hot: true, solid: false, at: [268, 236], name: 'n.ring25' },
    { id: 'crab25', spr: 's2:p_crab25', x: 392, y: 196, kz: 1.3, noShadow: false, hot: false, solid: false, visible: false },
    { id: 'helmet25', spr: 's2:p_helmet25', x: 0, y: 0, noShadow: true, hot: false, solid: false, visible: false },
    { id: 'wizard', spr: 's2:wizard', x: 196, y: 236, flip: true, hot: true, at: [150, 248], block: [20, 6], name: 'n.wizard' }
  ],

  async enter(g, how) {
    const F = k => g.flag(k), D = g.ent('demon');
    if (F('taken25')) g.ent('ring25').visible = false;
    D.visible = !F('crab'); put(D, F('risen') ? UP : DOWN);
    if (how.intro) { put(D, UP); g.fx.fade = { from: 1, to: 1, t0: g.now, ms: 0.01, a: 1 }; }
  },
  async intro(g) {
    g.hero.front = true;
    await g.card('assets/pointclick/s2/cards/r_anneaux.webp', g.T('ch.s2_25'));
    const W = g.ent('wizard'), D = g.ent('demon'); g.face(W.x);
    await g.say('wizard', 'c25.wake.1'); g.sfx('rumble'); this.burst(g); await g.say('demon', 'c25.wake.2');
    g.face(D.x); await g.say('hero', 'c25.wake.3'); await this.cry(g); await this.fall(g);
    g.face(W.x); await g.say('wizard', 'c25.wake.4'); await g.say('hero', 'c25.wake.5'); await g.say('narr', 'c25.wake.narr');
  },
  /* brasier : gerbe d'étincelles qui monte de l'abîme */
  burst(g) { const D = g.ent('demon'); for (let i = 0; i < 6; i++) setTimeout(() => g.alive !== false && twinkle(g, D.x + (Math.random() - 0.5) * 120, 150 + Math.random() * 30, '#ffb050'), i * 90); },
  async cry(g) { const h = g.hero, [x, y] = mid(g, h); g.sfx('shout'); shout(g, x + 14, y - 18, 1); await g.wait(500); },
  async fall(g) {
    const D = g.ent('demon'), y0 = D.y, t0 = g.now; g.sfx('rumble'); hit(g, D.x, 160, '#ffb050');
    await g.until(() => { const u = Math.min(1, (g.now - t0) / 0.9); put(D, y0 + (DOWN - y0) * u * u); return u >= 1; });
  },
  async rise(g) {
    const D = g.ent('demon'), t0 = g.now; D.visible = true; g.sfx('rumble'); this.burst(g);
    await g.until(() => { const u = Math.min(1, (g.now - t0) / 1.5); put(D, DOWN + (UP - DOWN) * (1 - Math.pow(1 - u, 3))); return u >= 1; });
  },
  /* il remonte, ils remontent toujours */
  async demonBack(g) {
    const D = g.ent('demon'), W = g.ent('wizard'); g.set('risen'); g.face(D.x);
    await this.rise(g); await g.say('demon', 'c25.demon.1'); await g.say('hero', 'c25.demon.hero'); g.face(W.x); await g.say('wizard', 'c25.demon.wizard');
  },

  /* le crabe de vase marche de côté, du démon jusqu'au bout gauche du pont : il passe à côté du magicien */
  tick(g) {
    const C = g.ent('crab25'); if (!C || !this.crabT0) return;
    const u = Math.min(1, (g.now - this.crabT0) / 7.5); C.x = 392 - 450 * u; C.y = 196 + 58 * u; C.bob = Math.abs(Math.sin(u * 60)) * 1.4;
    if (u >= 1) { this.crabT0 = 0; C.visible = false; }
  },

  async on(g, verb, id, item) {
    const F = k => g.flag(k), e = g.ent(id), W = g.ent('wizard'), D = g.ent('demon');
    if (verb === 'use' && (item === 'wabbajack' || (id === 'wabbajack' && item))) { await g.cut(() => this.wab(g, item === 'wabbajack' ? id : item)); return true; }
    if (verb === 'use' && item === 'ring25' && (id === 'hero' || !id)) { await g.say('hero', 'c25.use.ring'); return true; }
    switch (id) {
      case 'wizard':
        if (verb === 'look') { await g.say('hero', 'c25.look.wizard'); return true; }
        if (verb === 'talk') { await g.say('hero', 'c25.talk.wizard.1'); await g.say('wizard', 'c25.talk.wizard.2'); return true; }
        break;
      case 'demon':
        if (verb === 'look') { await g.say('hero', 'look.demon25'); return true; }
        if (verb === 'talk') { g.sfx('rumble'); await g.say('demon', 'c25.demon.1'); return true; }
        if (verb === 'use' && item === 'shout') { await g.cut(() => this.shoutAgain(g)); return true; }
        if (verb === 'use' && item && item.startsWith('cheese')) { await g.cut(() => this.melt(g)); return true; }
        break;
      case 'ring25':
        if (verb === 'look') { await g.say('hero', 'c25.look.ring'); return true; }
        if (verb === 'take' || (verb === 'use' && !item)) {
          twinkle(g, e.x, e.y - 4, '#ffd166'); g.sfx('coin'); e.visible = false; g.give('ring25'); g.set('taken25'); await g.say('hero', 'c25.look.ring');
          if (!F('risen')) await g.cut(() => this.demonBack(g)); return true;
        }
        break;
      case 's25exit':
        if (verb === 'look') { await g.say('hero', F('crab') ? 'look.s25exit' : 's25.demon.block'); return true; }
        if (verb === 'use' || verb === 'walk') {
          if (!F('risen')) { await g.cut(() => this.demonBack(g)); return true; }
          if (!F('crab')) { await g.say('hero', 's25.demon.block'); return true; }
          await g.fade(1, 700); setTimeout(() => g.goScene('s2_25b', { intro: true }), 0); return true;
        }
        break;
      case 's25chasm': if (verb === 'look') { await g.say('hero', 'c25.look.chasm'); return true; } break;
      case 's25bridge': if (verb === 'look') { await g.say('hero', 'look.s25bridge'); return true; } break;
    }
    return false;
  },

  /* le Cri le renvoie dans l'abîme… d'où il remonte aussitôt */
  async shoutAgain(g) {
    const D = g.ent('demon'); g.face(D.x); await this.cry(g); await this.fall(g); await g.wait(1200); await this.rise(g); g.sfx('rumble');
    await g.say('hero', 's25.shout.again');
  },
  /* une meule dans les flammes : fondue sans le héros */
  async melt(g) {
    const D = g.ent('demon'), x = D.x, y = 110; g.face(D.x); g.sfx('splat');
    for (let i = 0; i < 5; i++) setTimeout(() => twinkle(g, x - 20 + Math.random() * 40, y + 10 + Math.random() * 30, '#ffd166'), i * 120);
    this.fx.steam = [{ x, y: y + 30, w: 16, rate: 6, a: 0.4, col: '#ffe9a0' }]; setTimeout(() => { delete this.fx.steam; }, 2600);
    await g.say('hero', 'c25.use.cheese.demon');
  },

  async wab(g, id) {
    const e = g.ent(id), W = g.ent('wizard'), D = g.ent('demon'), h = g.hero;
    if (id === 'hero') { await g.say('hero', 'wab.self'); return; }
    switch (id) {
      case 'demon': {   /* un crabe de vase : le magicien a enfin sa réplique, le crabe passe quand même */
        if (!g.flag('risen') || g.flag('crab')) break;
        const C = g.ent('crab25');
        g.face(D.x); await zap(g, D.x, 120, { from: tip(g), peak: () => { D.visible = false; C.visible = true; Object.assign(C, { x: 392, y: 196 }); }, cols: ['#ff7a2a', '#ffffff', '#8a5a2a'] }); g.chk(); g.set('crab');
        delete this.fx.lights; this.fx.lights = [{ x: 180, y: 190, r: 150, col: '#ff7a2a', a: 0.14, fl: 0.18 }];
        await g.say('hero', 'c25.use.wab.demon'); this.crabT0 = g.now; g.face(W.x);
        await g.until(() => C.x < 300); await g.say('wizard', 'c25.use.wab.demon.wizard');
        await g.until(() => C.x < 170 || !this.crabT0); g.face(C.x); await g.say('hero', 'c25.use.wab.demon.hero');
        await g.until(() => !this.crabT0); g.face(W.x); await g.say('wizard', 'c25.use.wab.demon.wizard.2'); await g.say('narr', 'c25.use.wab.demon.narr'); return;
      }
      case 'ring25': await ringWab(g); return;
      case 'wizard': await wabSwap(g, W, 's2:wizard_bucket25', [['wizard', 'c25.wk.staff'], ['hero', 'c25.wk.staff.hero']], 's25.wk.back'); return;
    }
    await wabZap(g, e, null); await g.say('hero', 'wab.none');
  },
};

/* Wabbajack + anneau (pont ou colline) : le héros devient invisible, le casque reste là où était la tête */
export async function ringWab(g) {
  const h = g.hero, Hm = g.ent('helmet25'), W = g.ent('wizard');
  await wabZap(g, null, () => {
    const r = g.entRect(h), w = r ? r[2] - r[0] : 60, top = r ? r[1] : h.y - 150, hh = r ? r[3] - r[1] : 150;
    Object.assign(Hm, { scale: (hh * 0.2) / 80, flip: h.dir === 'l', x: h.x + (h.dir === 'l' ? -1 : 1) * w * 0.02, y: h.y + 1, bob: h.y + 1 - (top + hh * 0.17) - 2, float: 2, visible: true });   /* float : il flotte un peu, tout seul */
    h.alpha = 0.07;
  }, ['#ffd166', '#ffffff']);
  await g.say('hero', 'c25.wk.ring'); if (W) g.face(W.x); await g.say('wizard', 'c25.wk.ring.wizard');
  await g.wait(300); await zap(g, h.x, h.y - 50, { peak: () => { h.alpha = 1; Hm.visible = false; } }); g.chk(); await g.say('hero', 's25.wk.back');
}
