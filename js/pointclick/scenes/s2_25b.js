/* Saison 2, chapitre 25 (2/2) : la colline au trou rond. Le petit être aux pieds poilus lance un défi : quarante meules sur sa table,
   le plus gros mangeur gagne la dernière. Le héros mange comme chez lui, menu ouvert, le temps arrêté : trente-neuf meules.
   Les aigles du rocher (Wabbajack : des poules), le petit être qui grandit, le bâton du magicien en seau.
   Coordonnées logiques 480 × 270 (décor 960 × 540). */
import { zap, twinkle } from '../engine/fx2.js';
import { wabZap, wabSwap, sheoPops, nextChapter, mid } from './s2_common.js';
import { ringWab } from './s2_25.js';

export default {
  id: 's2_25b', hd: true, bg: 's2/d_shire25.webp', music: 's2_25_comte', amb: ['forest', 0.3], steps: 'dirt',
  persp: [184, 0.62, 268, 0.9], walkK: 1.9, blockR: [16, 6],
  light: { tint: '#fff6e0', k: 0.03 },
  walk: [[[4, 198], [150, 186], [176, 190], [176, 216], [356, 216], [356, 188], [476, 194], [476, 268], [4, 268]]],
  start: { x: 40, y: 248, dir: 'r' },
  fx: { flies: [{ rect: [10, 120, 170, 200], n: 3 }, { rect: [380, 130, 470, 190], n: 3 }] },
  hot: [
    { id: 's25door', rect: [180, 98, 264, 160], at: [222, 196], dir: 'r' },
    { id: 'cheeses25', rect: [182, 160, 350, 212], at: [266, 226] }
  ],
  preload: ['s2:p_hens25', 's2:wizard_bucket25', 's2:p_helmet25'],
  ents: [
    { id: 'cheeses25', spr: 's2:p_cheeses25', x: 266, y: 212, bob: 31, scale: 0.5, noShadow: true, hot: true, solid: false, at: [266, 226], name: 'n.cheeses25' },
    { id: 'cheeseLast', spr: 's2:i_cheese25', x: 266, y: 212, bob: 33, scale: 0.28, noShadow: true, hot: false, solid: false, visible: false },
    { id: 'eagles25', spr: 's2:p_eagles25', x: 432, y: 112, scale: 0.46, noShadow: true, noLight: true, hot: true, solid: false, at: [420, 214], name: 'n.eagles25' },
    { id: 'helmet25', spr: 's2:p_helmet25', x: 0, y: 0, noShadow: true, hot: false, solid: false, visible: false },
    { id: 'wizard', spr: 's2:wizard', x: 132, y: 222, flip: true, hot: true, at: [170, 236], block: [20, 6], name: 'n.wizard' },
    { id: 'halfling', spr: 's2:halfling', x: 398, y: 230, flip: true, hot: true, at: [366, 238], block: [16, 6], name: 'n.halfling' },
    { id: 'sheo', spr: 's2:sheo', x: 300, y: 240, hot: false, visible: false, aura: { col: '#c77dff', r: 0.6, a: 0.35, wisps: 3 } }
  ],

  async enter(g, how) {
    const F = k => g.flag(k);
    if (F('hens')) { const E = g.ent('eagles25'); E.spr = 's2:p_hens25'; E.name = 'n.hens25'; }
    if (F('ate')) g.ent('cheeses25').visible = false;
    if (how.intro) g.fx.fade = { from: 1, to: 1, t0: g.now, ms: 0.01, a: 1 };
  },
  async intro(g) {
    await g.fade(0, 900); const H = g.ent('halfling'); g.face(H.x);
    await g.say('halfling', 'c25.talk.halfling.0');
  },

  /* le menu ouvert, le temps arrêté : un voile, l'icône de la meule et le compte */
  draw(g, c) {
    const E = this.eat; if (!E || !E.open) return;
    c.save(); c.fillStyle = 'rgba(8,10,18,0.5)'; c.fillRect(0, 0, 480, 270);
    c.fillStyle = 'rgba(20,24,36,0.85)'; c.strokeStyle = '#d8c48a'; c.lineWidth = 1.5; c.beginPath(); c.roundRect(196, 92, 88, 70, 6); c.fill(); c.stroke();
    const im = g.spr('s2:i_cheese25'); if (im) { const w = 44, h = w * (im.height / im.width); c.drawImage(im, 240 - w / 2, 98, w, h); }
    c.font = 'bold 16px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'bottom'; c.fillStyle = '#ffe9a8'; c.fillText(String(E.n), 240, 158);
    c.restore();
  },

  async on(g, verb, id, item) {
    const F = k => g.flag(k), e = g.ent(id), H = g.ent('halfling'), W = g.ent('wizard');
    if (verb === 'use' && (item === 'wabbajack' || (id === 'wabbajack' && item))) { await g.cut(() => this.wab(g, item === 'wabbajack' ? id : item)); return true; }
    if (verb === 'use' && item === 'ring25' && (id === 'hero' || !id)) { await g.say('hero', 'c25.use.ring'); return true; }
    switch (id) {
      case 'halfling':
        if (verb === 'look') { await g.say('hero', 'c25.look.halfling'); return true; }
        if (verb === 'talk') {
          if (F('ate')) { await g.say('halfling', 'c25.use.eat.halfling'); return true; }
          if (!F('challenge')) { g.set('challenge'); await g.say('halfling', 'c25.talk.halfling.1'); await g.say('hero', 'c25.talk.halfling.2'); }
          await g.say('halfling', 'c25.talk.halfling.3'); return true;
        }
        break;
      case 'cheeses25':
        if (verb === 'look') { await g.say('hero', F('ate') ? 'look.cheese25' : 'c25.look.table'); return true; }
        if ((verb === 'take' || verb === 'use') && !item && !F('ate')) {
          if (!F('challenge')) { await g.say('hero', 'c25.look.table'); g.face(H.x); await g.say('halfling', 'c25.talk.halfling.3'); g.set('challenge'); return true; }
          await g.cut(() => this.feast(g)); return true;
        }
        break;
      case 'wizard':
        if (verb === 'look') { await g.say('hero', 'c25.look.wizard'); return true; }
        if (verb === 'talk') { if (!F('gag')) { await g.cut(() => this.gag(g)); return true; } await g.say('hero', 'c25.talk.wizard.1'); await g.say('wizard', 'c25.talk.wizard.2'); return true; }
        break;
      case 'eagles25':
        if (verb === 'look') { await g.say('hero', F('hens') ? 'look.hens25' : 'look.eagles25'); if (!F('gag') && !F('hens')) await g.cut(() => this.gag(g)); return true; }
        break;
      case 's25door': if (verb === 'look') { await g.say('hero', 'look.s25door'); return true; } break;
    }
    return false;
  },

  /* « Pourquoi pas les aigles ? » */
  async gag(g) {
    const H = g.ent('halfling'), W = g.ent('wizard'); g.set('gag');
    g.face(H.x); await g.say('halfling', 'c25.gag.1'); await g.say('hero', 'c25.gag.2'); g.face(W.x); await g.say('wizard', 'c25.gag.3');
  },

  /* trente-neuf meules, le menu ouvert entre chaque bouchée */
  async feast(g) {
    const h = g.hero, P = g.ent('cheeses25'), L = g.ent('cheeseLast'), H = g.ent('halfling'), W = g.ent('wizard'), s0 = P.scale;
    h.back = true; await g.say('hero', 'c25.use.eat');
    this.eat = { n: 0, open: false };
    for (let i = 1; i <= 39; i++) {
      this.eat.open = true; this.eat.n = i; if (i % 3 === 1) g.sfx('click'); await g.wait(i < 6 ? 140 : 60);
      this.eat.open = false; P.scale = s0 * (1 - 0.7 * i / 39); const [x, y] = mid(g, h); if (i % 2) twinkle(g, x + (Math.random() - 0.5) * 16, y - 34, '#ffd166');
      if (i % 4 === 0) g.sfx('pop'); await g.wait(i < 6 ? 110 : 40);
    }
    this.eat = null; P.visible = false; L.visible = true; g.set('ate'); h.back = false;
    g.face(H.x); await g.say('halfling', 'c25.use.eat.halfling'); await g.say('hero', 'c25.use.eat.hero');
    twinkle(g, L.x, L.y - L.bob - 4, '#ffd166'); g.sfx('coin'); L.visible = false; g.give('cheese25');
    await sheoPops(g, 'c25.use.eat.sheo'); await g.say('narr', 'c25.use.eat.narr');
    if (!g.flag('gag')) await this.gag(g);
    g.face(W.x); await g.say('wizard', 'c25.end.wizard'); await g.say('hero', 'c25.end.hero'); await g.say('narr', 'c25.end.narr');
    await g.fade(1, 1200); nextChapter(g, 's2_25');
  },

  async wab(g, id) {
    const e = g.ent(id), W = g.ent('wizard'), H = g.ent('halfling');
    if (id === 'hero') { await g.say('hero', 'wab.self'); return; }
    switch (id) {
      case 'eagles25': {   /* des poules : voilà pourquoi on ne les prend jamais */
        if (g.flag('hens')) break;
        await wabZap(g, e, () => { e.spr = 's2:p_hens25'; e.name = 'n.hens25'; }, ['#ffffff', '#ffd166', '#c8a060']); g.set('hens');
        g.face(W.x); await g.say('wizard', 'c25.wk.eagles'); await g.say('hero', 'c25.wk.eagles.hero'); return;
      }
      case 'halfling': {   /* il grandit d'un mètre : enfin, il voit la table */
        const s = g.sc(H); await wabZap(g, H, () => { H.scale = s * 1.55; }, ['#7dff6a', '#ffffff']);
        await g.say('halfling', 'c25.wk.halfling'); await g.say('hero', 'c25.wk.halfling.hero');
        await g.wait(300); await zap(g, ...mid(g, H), { peak: () => { delete H.scale; } }); g.chk(); await g.say('hero', 's25.wk.back'); return;
      }
      case 'wizard': await wabSwap(g, W, 's2:wizard_bucket25', [['wizard', 'c25.wk.staff'], ['hero', 'c25.wk.staff.hero']], 's25.wk.back'); return;
      case 'ring25': await ringWab(g); return;
    }
    await wabZap(g, e, null); await g.say('hero', 'wab.none');
  }
};
