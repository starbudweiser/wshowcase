/* Saison 2, chapitre 28 (1/3), finale : « Le gâteau est un mensonge ». La salle de test numéro dix-neuf, une voix sucrée au plafond
   (la caméra), une tourelle trop gentille, un cube à cœur. Le tube crache une meule lestée (la dix-huitième, compte Sheogorath) ; posée
   sur le gros bouton, elle tient la porte ouverte. Coordonnées logiques 480 × 270 (décor 960 × 540). */
import { zap, twinkle, hit } from '../engine/fx2.js';
import { wabZap, wabSwap, sheoPops, mid, tip } from './s2_common.js';

const DOOR = [396, 58, 446, 186], SIGN = [256, 85];

/* la caméra du plafond (ou la pomme de terre) parle ; ses bulles partent d'elle */
export function aiSpot(g) { const A = g.ent('ai28'); if (A) g.cinePos = { ...(g.cinePos || {}), ai: [A.x, A.y - (A.bob || 0) - 24] }; }

export default {
  id: 's2_28', hd: true, bg: 's2/d_test28.webp', music: 's2_28_labo', amb: ['hall', 0.08], steps: 'stone',
  persp: [176, 0.62, 268, 0.86], walkK: 1.9, blockR: [16, 6],
  light: { tint: '#e8f2ff', k: 0.03 },
  walk: [[[4, 268], [4, 200], [60, 186], [150, 178], [330, 178], [380, 190], [470, 198], [476, 268]]],
  start: { x: 150, y: 244, dir: 'r' },
  fx: { lights: [{ x: 112, y: 120, r: 60, col: '#bfe4ff', a: 0.14, fl: 0 }] },
  hot: [
    { id: 'door28', rect: [384, 45, 462, 190], at: [416, 204], dir: 'r' }, { id: 'dispenser28', rect: [90, 0, 132, 152], at: [118, 196], dir: 'b' },
    { id: 'button28', rect: [172, 186, 272, 240], at: [222, 252], dir: 'b' }, { id: 'sign28', rect: [232, 62, 280, 108] }, { id: 'graffiti28', rect: [342, 136, 368, 168], at: [350, 192], dir: 'b' }
  ],
  preload: ['s2:p_potato28', 's2:p_cheese28'],
  ents: [
    { id: 'ai28', spr: 's2:p_camera28', x: 44, y: 64, bob: 0, scale: 0.5, noShadow: true, noLight: true, hot: true, solid: false, at: [70, 214], name: 'n.ai28' },
    { id: 'cube28', spr: 's2:p_cube28', x: 58, y: 234, scale: 0.33, hot: true, at: [96, 244], block: [14, 5], name: 'n.cube28' },
    { id: 'turret', spr: 's2:turret', x: 342, y: 214, flip: true, hot: true, at: [306, 226], block: [12, 5], name: 'n.turret' },
    { id: 'cheese28', spr: 's2:p_cheese28', x: 114, y: 198, scale: 0.28, hot: true, solid: false, at: [126, 214], visible: false, name: 'n.cheese28' },
    { id: 'sheo', spr: 's2:sheo', x: 300, y: 240, hot: false, visible: false, aura: { col: '#c77dff', r: 0.6, a: 0.35, wisps: 3 } }
  ],

  async enter(g, how) {
    const F = k => g.flag(k), C = g.ent('cheese28');
    if (!g.has('portalbucket')) g.give('portalbucket');
    if (F('potato')) Object.assign(g.ent('ai28'), { spr: 's2:p_potato28', scale: 0.5 });
    if (F('doorOpen28')) Object.assign(C, { visible: true, x: 222, y: 214, bob: 12, hot: true });
    else if (F('dispensed') && !g.has('cheese28')) C.visible = true;
    aiSpot(g);
    if (how.intro) g.fx.fade = { from: 1, to: 1, t0: g.now, ms: 0.01, a: 1 };
  },
  async intro(g) {
    g.hero.front = true;
    await g.card('assets/pointclick/s2/cards/r_portal.webp', g.T('ch.s2_28'));
    await g.say('ai', 'c28.wake.1'); await g.say('hero', 'c28.wake.2'); await g.say('ai', 'c28.wake.3'); await g.say('narr', 'c28.wake.narr'); await g.say('ai', 'c28.wake.4');
  },

  /* la porte ouverte (un passage bleuté) et le numéro de la salle, peint par le moteur */
  drawBack(g, c) {
    c.save();
    if (g.flag('doorOpen28') || this.sitOpen) {
      const [x0, y0, x1, y1] = DOOR, gr = c.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, '#0d1824'); gr.addColorStop(1, '#2a4a66');
      c.fillStyle = gr; c.fillRect(x0, y0, x1 - x0, y1 - y0); c.fillStyle = 'rgba(160,210,255,0.18)'; c.fillRect(x0 + 4, y0 + 4, x1 - x0 - 8, 6);
    }
    c.font = 'bold 22px "Arial Black", Impact, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = 'rgba(40,46,56,0.85)';
    c.fillText(g.flag('sign15') ? '15' : '19', SIGN[0], SIGN[1]); c.restore();
  },
  draw(g, c) {
    if (!this.notes) return; const T = g.ent('turret'), t = g.now;
    c.save(); c.font = 'bold 11px Georgia, serif'; c.textAlign = 'center';
    for (let i = 0; i < 5; i++) { const u = ((t * 0.5 + i / 5) % 1); c.globalAlpha = Math.sin(u * Math.PI) * 0.9; c.fillStyle = i % 2 ? '#ffe9a8' : '#ffb0b0'; c.fillText(i % 2 ? '♪' : '♫', T.x + Math.sin(u * 6 + i) * 10, T.y - 60 - u * 40); }
    c.restore();
  },

  async on(g, verb, id, item) {
    const F = k => g.flag(k), e = g.ent(id), C = g.ent('cheese28');
    if (verb === 'use' && (item === 'wabbajack' || (id === 'wabbajack' && item))) { await g.cut(() => this.wab(g, item === 'wabbajack' ? id : item)); return true; }
    switch (id) {
      case 'ai28':
        if (verb === 'look') { await g.say('hero', F('potato') ? 'look.potato28' : 'look.ai28'); return true; }
        if (verb === 'talk') { aiSpot(g); await g.say('ai', F('potato') ? 'c28.wk.ai' : 'c28.wake.3'); return true; }
        break;
      case 'turret':
        if (verb === 'look') { await g.say('hero', 'c28.look.turret'); return true; }
        if (verb === 'talk') { await g.say('turret', 'c28.talk.turret'); return true; }
        break;
      case 'cube28': if (verb === 'look') { await g.say('hero', 'look.cube28'); return true; } break;
      case 'dispenser28':
        if (verb === 'look') { await g.say('hero', 'look.dispenser28'); return true; }
        if ((verb === 'use' || verb === 'take') && !item) { if (F('dispensed')) { await g.say('hero', 's28.dispenser.empty'); return true; } await g.cut(() => this.dispense(g)); return true; }
        break;
      case 'cheese28':
        if (verb === 'look') { await g.say('hero', 'look.cheese28'); return true; }
        if (verb === 'take' || (verb === 'use' && !item)) {
          if (F('doorOpen28')) { await g.say('hero', 's28.button.keep'); return true; }
          twinkle(g, C.x, C.y - 8, '#ffd166'); C.visible = false; g.give('cheese28'); return true;
        }
        break;
      case 'button28':
        if (verb === 'look') { await g.say('hero', 'c28.look.button'); return true; }
        if (verb === 'use' && item === 'cheese28') { await g.cut(() => this.weigh(g)); return true; }
        if ((verb === 'use' || verb === 'walk') && !item && !F('doorOpen28')) { await g.cut(() => this.sit(g)); return true; }
        break;
      case 'door28':
        if (verb === 'look') { await g.say('hero', F('doorOpen28') ? 'look.door28o' : 'look.door28'); return true; }
        if (verb === 'use' || verb === 'walk') {
          if (!F('doorOpen28')) { await g.say('hero', 's28.door.closed'); return true; }
          await g.fade(1, 700); setTimeout(() => g.goScene('s2_28b', { intro: true }), 0); return true;
        }
        break;
      case 'sign28': if (verb === 'look') { await g.say('hero', 'c28.look.sign'); return true; } break;
      case 'graffiti28': if (verb === 'look' || verb === 'use') { await g.say('hero', 'c28.look.graffiti'); return true; } break;
    }
    return false;
  },

  /* le tube crache la dix-huitième meule */
  async dispense(g) {
    const C = g.ent('cheese28'); g.face(114); g.sfx('whoosh'); Object.assign(C, { visible: true, x: 114, y: 198, bob: 50 });
    const t0 = g.now; await g.until(() => { const u = Math.min(1, (g.now - t0) / 0.5); C.bob = 50 * (1 - u * u); return u >= 1; });
    g.sfx('clang'); hit(g, C.x, C.y - 4, '#cfe4ff'); g.set('dispensed');
    await g.say('hero', 'c28.use.dispenser'); await sheoPops(g, 'c28.use.dispenser.sheo');
  },
  /* assis sur le bouton : ouvert ; debout : fermé */
  async sit(g) {
    const h = g.hero; h.front = true; g.sfx('click'); this.sitOpen = true; h.bob = -4;
    await g.say('hero', 'c28.use.hero.button'); aiSpot(g); await g.say('ai', 'c28.use.hero.button.ai');
    h.bob = 0; this.sitOpen = false; g.sfx('clang'); h.front = false;
  },
  /* la meule sur le bouton : la porte reste ouverte, Sheogorath proteste */
  async weigh(g) {
    const C = g.ent('cheese28'); g.drop('cheese28'); Object.assign(C, { visible: true, x: 222, y: 214, bob: 12 }); g.sfx('click');
    await sheoPops(g, 'c28.use.cheese.button.sheo'); g.set('doorOpen28'); g.sfx('whoosh'); twinkle(g, 421, 120, '#bfe4ff');
    aiSpot(g); await g.say('ai', 'c28.use.cheese.button.ai'); await g.say('hero', 'c28.use.cheese.button.hero');
  },

  async wab(g, id) {
    const e = g.ent(id);
    if (id === 'hero') { await g.say('hero', 'wab.self'); return; }
    switch (id) {
      case 'ai28': {   /* une pomme de terre, rancunière pour l'éternité */
        if (g.flag('potato')) break;
        await wabZap(g, e, () => { Object.assign(e, { spr: 's2:p_potato28', scale: 0.5 }); }, ['#ffd166', '#8a5a2a', '#ffffff']); g.set('potato');
        aiSpot(g); await g.say('ai', 'c28.wk.ai'); await g.say('hero', 'c28.wk.ai.hero'); return;
      }
      case 'cube28': {   /* le cube parle (voix de la tourelle) */
        await wabZap(g, e, null, ['#ff8fd8', '#ffffff']); g.cinePos = { ...(g.cinePos || {}), turret: [e.x, e.y - 30] };
        await g.say('turret', 'c28.wk.cube'); g.cinePos.turret = null; delete g.cinePos.turret; await g.say('hero', 'c28.wk.cube.hero'); return;
      }
      case 'turret': { await wabZap(g, e, null, ['#ffe9a8', '#ffffff']); this.notes = true; g.sfx('jingle'); await g.say('turret', 'c28.wk.turret'); this.notes = null; await g.say('hero', 'c28.wk.turret.hero'); return; }
      case 'sign28': { if (g.flag('sign15')) break; g.face(SIGN[0]); await zap(g, SIGN[0], SIGN[1], { from: tip(g), peak: () => g.set('sign15'), cols: ['#ffd166', '#ffffff'] }); g.chk(); await g.say('hero', 'c28.wk.sign'); return; }
    }
    await wabZap(g, e, null); await g.say('hero', 'wab.none');
  }
};
