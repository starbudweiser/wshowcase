/* Saison 2, chapitre 28 (2/3) : la salle suivante. La voix du plafond et le narrateur se disputent le sarcasme. Le seau de Sheogorath
   fait des portails : un bleu sur le grand mur blanc, un orange là-haut, près de la corniche au gâteau. Le gâteau est en carton ; le
   Wabbajack le rend vrai. Par le portail orange, on voit Rivebois. Coordonnées logiques 480 × 270 (décor 960 × 540). */
import { zap, twinkle } from '../engine/fx2.js';
import { wabZap, sheoPops, mid, tip } from './s2_common.js';
import { aiSpot } from './s2_28.js';

const BLUE = { x: 126, y: 128, rx: 30, ry: 48 }, ORANGE = { x: 288, y: 44, rx: 22, ry: 34 };

/* un portail : anneau lumineux, fond qui tourbillonne (ou une autre image vue à travers) */
function portal(g, c, P, col, glow, img) {
  const t = g.now; c.save(); c.translate(P.x, P.y);
  c.save(); c.scale(1, P.ry / P.rx); c.beginPath(); c.arc(0, 0, P.rx, 0, Math.PI * 2); c.clip();
  if (img) { c.scale(1, P.rx / P.ry); c.drawImage(img, 120, 40, 280, 280 * P.ry / P.rx, -P.rx, -P.ry, P.rx * 2, P.ry * 2); }
  else { const gr = c.createRadialGradient(0, 0, 2, 0, 0, P.rx); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.5, glow); gr.addColorStop(1, col); c.fillStyle = gr; c.fillRect(-P.rx, -P.rx, P.rx * 2, P.rx * 2);
    c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 1.2; for (let k = 0; k < 3; k++) { c.beginPath(); for (let a = 0; a < 6; a += 0.2) { const r = P.rx * a / 6, an = a * 1.5 + k * 2.1 + t * 2.4; a ? c.lineTo(Math.cos(an) * r, Math.sin(an) * r) : c.moveTo(Math.cos(an) * r, Math.sin(an) * r); } c.stroke(); } }
  c.restore();
  c.scale(1, P.ry / P.rx); c.strokeStyle = col; c.lineWidth = 3; c.shadowColor = glow; c.shadowBlur = 10; c.beginPath(); c.arc(0, 0, P.rx, 0, Math.PI * 2); c.stroke(); c.restore();
}

export default {
  id: 's2_28b', hd: true, bg: 's2/d_test28b.webp', music: 's2_28_labo', amb: ['hall', 0.08], steps: 'stone',
  persp: [186, 0.64, 268, 0.86], walkK: 1.9, blockR: [16, 6],
  light: { tint: '#e8f2ff', k: 0.03 },
  walk: [[[4, 268], [4, 206], [60, 198], [230, 192], [300, 186], [476, 190], [476, 268]]],
  start: { x: 380, y: 236, dir: 'l' },
  fx: { lights: [] },
  hot: [
    { id: 'portalorange28', rect: [262, 6, 314, 82], at: [290, 200], dir: 'b' }, { id: 'portalblue28', rect: [94, 78, 158, 178], at: [130, 204], dir: 'b' },
    { id: 'ledge28', rect: [232, 78, 480, 100] }, { id: 'wall28', rect: [30, 40, 220, 196], at: [130, 210], dir: 'b' }
  ],
  preload: ['s2:p_cakereal28', 's2:p_potato28'],
  ents: [
    { id: 'ai28', spr: 's2:p_camera28', x: 20, y: 70, scale: 0.45, noShadow: true, noLight: true, hot: true, solid: false, at: [60, 214], name: 'n.ai28' },
    { id: 'cake28', spr: 's2:p_cake28', x: 378, y: 38, scale: 0.28, noShadow: true, hot: true, solid: false, at: [360, 200], name: 'n.cake28' },
    { id: 'sheo', spr: 's2:sheo', x: 300, y: 240, hot: false, visible: false, aura: { col: '#c77dff', r: 0.6, a: 0.35, wisps: 3 } }
  ],

  async enter(g, how) {
    const F = k => g.flag(k), K = g.ent('cake28');
    if (F('potato')) Object.assign(g.ent('ai28'), { spr: 's2:p_potato28', scale: 0.45 });
    if (F('gotCake')) Object.assign(K, { x: 170, y: 232, scale: 0.4, noShadow: false });
    if (F('realCake')) K.spr = 's2:p_cakereal28';
    this.party = null; aiSpot(g);
    this.partyImg = new Image(); this.partyImg.src = g.s2low ? 'assets/pointclick/s2/90/d_party28.png' : 'assets/pointclick/s2/d_party28.webp';   /* Rivebois, vu à travers le portail orange */
    if (how.intro) g.fx.fade = { from: 1, to: 1, t0: g.now, ms: 0.01, a: 1 };
  },
  async intro(g) {
    await g.fade(0, 800); aiSpot(g);
    await g.say('narr', 'c28.gag.1'); await g.say('ai', 'c28.gag.2'); await g.say('narr', 'c28.gag.3'); await g.say('ai', 'c28.gag.4'); await g.say('hero', 'c28.gag.5');
  },

  drawBack(g, c) {
    if (!g.flag('portals')) return;
    portal(g, c, BLUE, '#2a8cff', '#9ad8ff');
    portal(g, c, ORANGE, '#ff8a1a', '#ffd08a', this.party && this.partyImg && this.partyImg.complete ? this.partyImg : null);
  },

  async on(g, verb, id, item) {
    const F = k => g.flag(k), K = g.ent('cake28');
    if (verb === 'use' && (item === 'wabbajack' || (id === 'wabbajack' && item))) { await g.cut(() => this.wab(g, item === 'wabbajack' ? id : item)); return true; }
    switch (id) {
      case 'ai28':
        if (verb === 'look') { await g.say('hero', F('potato') ? 'look.potato28' : 'look.ai28'); return true; }
        if (verb === 'talk') { aiSpot(g); await g.say('ai', 'c28.gag.4'); return true; }
        break;
      case 'wall28':
        if (verb === 'look') { await g.say('hero', 'look.wall28'); return true; }
        if (verb === 'use' && item === 'portalbucket' && !F('portals')) { await g.cut(() => this.portals(g)); return true; }
        break;
      case 'ledge28': if (verb === 'look') { await g.say('hero', 'look.ledge28'); return true; } break;
      case 'cake28':
        if (verb === 'look') { if (F('realCake')) { await g.say('hero', 'look.cakereal28'); return true; } await g.say('hero', 'c28.look.cake'); aiSpot(g); await g.say('ai', 'c28.look.cake.ai'); return true; }
        if (!F('gotCake')) { if (verb === 'take' || verb === 'use') { await g.say('hero', 's28.ledge.far'); return true; } break; }
        if ((verb === 'take' || verb === 'use') && !item && !F('realCake')) { await g.say('hero', 'c28.use.eat.cake'); return true; }
        break;
      case 'portalblue28':
        if (verb === 'look') { await g.say('hero', F('portals') ? 'look.portalblue28' : 'look.wall28'); return true; }
        if ((verb === 'use' || verb === 'walk') && F('portals') && !F('gotCake')) { await g.cut(() => this.fetchCake(g)); return true; }
        break;
      case 'portalorange28':
        if (!F('portals')) break;
        if (verb === 'look') { await g.say('hero', 'look.portalorange28'); return true; }
        if (verb === 'use' || verb === 'walk') {
          if (!F('realCake')) { await g.say('hero', 's28.cake.first'); return true; }
          await g.cut(() => this.home(g)); return true;
        }
        break;
    }
    return false;
  },

  /* le seau fait des trous dans les murs : bleu ici, orange là-haut */
  async portals(g) {
    g.face(BLUE.x); g.sfx('whoosh'); await zap(g, BLUE.x, BLUE.y, { from: tip(g), peak: () => g.set('portals'), cols: ['#2a8cff', '#ffffff', '#ff8a1a'] }); g.chk(); twinkle(g, ORANGE.x, ORANGE.y, '#ff8a1a');
    await g.say('hero', 'c28.use.bucket.wall'); await g.say('hero', 'c28.use.bucket.wall.2'); aiSpot(g); await g.say('ai', 'c28.use.bucket.ai'); await sheoPops(g, 'c28.use.bucket.sheo');
  },
  /* par les portails, jusqu'au gâteau… et retour, gâteau sous le bras */
  async fetchCake(g) {
    const K = g.ent('cake28'), h = g.hero; g.sfx('whoosh'); await g.fade(1, 400); h.alpha = 0; await g.wait(400);
    Object.assign(K, { x: 170, y: 232, scale: 0.4, noShadow: false }); Object.assign(h, { x: 138, y: 228, alpha: 1, dir: 'r' }); g.set('gotCake');
    g.sfx('whoosh'); await g.fade(0, 400); await g.say('hero', 'c28.look.cake'); aiSpot(g); await g.say('ai', 'c28.look.cake.ai');
  },
  /* par le portail orange : Rivebois ; la meule reprise sur le bouton, au passage */
  async home(g) {
    this.party = true; g.face(ORANGE.x); await g.say('hero', 'c28.use.portal.home');
    twinkle(g, ORANGE.x, ORANGE.y, '#ffd166'); g.sfx('coin'); g.give('cheese28'); await g.say('hero', 'c28.use.portal.cheese');
    aiSpot(g); await g.say('ai', 'c28.use.portal.ai');
    g.sfx('whoosh'); await g.fade(1, 1000); setTimeout(() => g.goScene('s2_28c', { intro: true }), 0);
  },

  async wab(g, id) {
    const e = g.ent(id);
    if (id === 'hero') { await g.say('hero', 'wab.self'); return; }
    switch (id) {
      case 'cake28': {   /* il devient vrai : trois étages, quinze bougies */
        if (g.flag('realCake')) break;
        if (!g.flag('gotCake')) { await g.say('hero', 's28.ledge.far'); return; }
        await wabZap(g, e, () => { e.spr = 's2:p_cakereal28'; }, ['#ff6b6b', '#ffd166', '#ffffff']); g.set('realCake');
        for (let i = 0; i < 6; i++) setTimeout(() => twinkle(g, e.x - 10 + Math.random() * 20, e.y - 40 - Math.random() * 10, '#ffd166'), i * 120);
        await g.say('hero', 'c28.use.wab.cake'); aiSpot(g); await g.say('ai', 'c28.use.wab.cake.ai'); return;
      }
      case 'ai28': {
        if (g.flag('potato')) break;
        await wabZap(g, e, () => { Object.assign(e, { spr: 's2:p_potato28', scale: 0.45 }); }, ['#ffd166', '#8a5a2a', '#ffffff']); g.set('potato');
        aiSpot(g); await g.say('ai', 'c28.wk.ai'); await g.say('hero', 'c28.wk.ai.hero'); return;
      }
    }
    await wabZap(g, e, null); await g.say('hero', 'wab.none');
  }
};
