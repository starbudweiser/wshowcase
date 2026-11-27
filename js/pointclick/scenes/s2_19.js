/* Saison 2, chapitre 19 : c'est jamais le lupus (intermède). Une salle de diagnostic la nuit. Le médecin à canne (avec la voix du
   narrateur) ; le héros écrit ses symptômes au tableau (l'équipe propose le lupus), l'IRM lui arrache son casque, rien ne se résout.
   Sous Wabbajack le médecin devient aimable : l'équipe déclenche l'alerte, et le héros « ramasse » le sandwich volé. En partant,
   le médecin note le nom de Sheogorath au tableau. Coordonnées logiques 480 × 270 (décor 960 × 540). */
import { zap, twinkle, hit } from '../engine/fx2.js';
import { wabZap, wabSwap, sheoPops, nextChapter, mid, tip } from './s2_common.js';

const MRI = [392, 178];

export default {
  id: 's2_19', hd: true, bg: 's2/d_hospital.webp', music: 's2_19_hopital', amb: ['house', 0.2], steps: 'stone',
  persp: [146, 0.42, 268, 0.86], walkK: 1.9, blockR: [16, 6],
  light: { tint: '#c8d8ff', k: 0.12, lamps: [{ x: 446, y: 104, r: 90, col: '#ffcf80', k: 0.5 }] },
  walk: [[[4, 224], [100, 220], [216, 218], [216, 150], [300, 146], [410, 150], [410, 202], [476, 206], [476, 268], [4, 268]]],
  start: { x: 176, y: 246, dir: 'r' },
  fx: { lights: [{ x: 446, y: 100, r: 18, col: '#ffcf80', a: 0.8, fl: 0.1 }, { x: 330, y: 18, r: 50, col: '#cfe4ff', a: 0.3, fl: 0.04 }, { x: 232, y: 98, r: 22, col: '#e8f4ff', a: 0.45, fl: 0.03, breathe: 0.5 }] },
  hot: [
    { id: 's19bed', rect: [30, 110, 214, 214], at: [200, 230] }, { id: 's19desk', rect: [415, 122, 480, 198], at: [400, 214], dir: 'r' }
  ],
  preload: ['s2:p_board19s', 's2:p_board19l', 's2:p_board19h', 's2:p_sarco19', 's2:hero_nohelm19', 's2:house_wab19', 's2:p_xrayknee19'],
  ents: [
    { id: 'xray19', spr: 's2:p_xray19', x: 232, y: 112, scale: 0.36, noShadow: true, noLight: true, hot: true, solid: false, at: [236, 226], name: 'n.xray19' },
    { id: 'board19', spr: 's2:p_board19', x: 270, y: 172, scale: 0.78, hot: true, at: [252, 198], block: [24, 6], name: 'n.board19' },
    { id: 'mri19', spr: 's2:p_mri19', x: MRI[0], y: MRI[1], scale: 0.82, hot: true, at: [352, 204], block: [52, 9], name: 'n.mri19' },
    { id: 'helmet19', spr: 's2:p_helmet19', x: 372, y: 182, bob: 36, scale: 0.3, noShadow: true, hot: true, solid: false, at: [352, 204], visible: false, name: 'n.helmet19' },
    { id: 'sandwich19', spr: 's2:p_sandwich19', x: 452, y: 124, scale: 0.3, noShadow: true, hot: true, solid: false, at: [400, 214], name: 'n.sandwich19' },
    { id: 'marker19', spr: 's2:i_marker19', x: 430, y: 123, scale: 0.22, noShadow: true, hot: true, solid: false, at: [400, 214], name: 'n.marker19' },
    { id: 'house', spr: 's2:house', x: 318, y: 238, hot: true, at: [276, 246], flip: true, name: 'n.house' },
    { id: 'sheo', spr: 's2:sheo', x: 300, y: 240, hot: false, visible: false, aura: { col: '#c77dff', r: 0.6, a: 0.35, wisps: 3 } }
  ],

  async enter(g, how) {
    const F = k => g.flag(k);
    if (F('symptoms')) g.ent('board19').spr = 's2:p_board19s';
    if (g.has('marker19') || F('symptoms')) g.ent('marker19').visible = false;
    if (F('sandwich')) g.ent('sandwich19').visible = false;
    if (F('cane')) g.ent('house').spr = 's2:house_wab19';
    if (F('helmetOff') && !F('helmetBack')) { g.ent('helmet19').visible = true; g.hero.forceSpr = 's2:hero_nohelm19'; }
    this.alertT = 0;
    if (how.intro) g.fx.fade = { from: 1, to: 1, t0: g.now, ms: 0.01, a: 1 };
  },
  /* alerte : un gyrophare rouge balaie la salle pendant que l'équipe panique */
  tick(g) {
    const on = this.alertT && g.now < this.alertT, L = this.fx.lights;
    if (on && !L.some(l => l.alert)) L.push({ x: 300, y: 30, r: 160, col: '#ff3030', a: 0, fl: 0, alert: true });
    const A = L.find(l => l.alert); if (A) { if (on) A.a = 0.25 + 0.25 * Math.sin(g.now * 9); else L.splice(L.indexOf(A), 1); }
  },
  async intro(g) {
    g.hero.front = true;
    await g.card('assets/pointclick/s2/cards/r_house.webp', g.T('ch.s2_19'));
    const H = g.ent('house'); g.face(H.x);
    await g.say('house', 'c19.wake.1'); await g.say('house', 'c19.wake.2'); await g.say('narr', 'c19.wake.3'); await g.say('hero', 'c19.wake.4'); await g.say('hero', 'c19.wake.5');
  },

  async on(g, verb, id, item) {
    const F = k => g.flag(k), e = g.ent(id);
    if (verb === 'use' && (item === 'wabbajack' || (id === 'wabbajack' && item))) { await g.cut(() => this.wab(g, item === 'wabbajack' ? id : item)); return true; }
    if (verb === 'use' && item === 'potion19') { await g.say('hero', 'c19.fail.potion.1'); await g.say('house', 'c19.fail.potion.2'); return true; }
    switch (id) {
      case 'house':
        if (verb === 'look') { if (!F('lookedDoc')) { g.set('lookedDoc'); await g.say('hero', 'c19.look.doctor'); } else await g.say('hero', 'c19.look.cane'); return true; }
        if (verb === 'talk') { await g.say('hero', 'c19.talk.1'); await g.say('house', 'c19.talk.2'); await g.say('hero', 'c19.talk.3'); return true; }
        break;
      case 'board19':
        if (verb === 'look') { await g.say('hero', 'c19.look.board'); return true; }
        if (verb === 'use' && item === 'marker19') { await g.cut(() => this.symptoms(g)); return true; }
        break;
      case 'marker19':
        if (verb === 'look') { await g.say('hero', 'look.marker19'); return true; }
        if (verb === 'take' || (verb === 'use' && !item)) { e.visible = false; g.sfx('pop'); g.give('marker19'); await g.say('hero', 'take.marker19'); return true; }
        break;
      case 'mri19':
        if (verb === 'look') { await g.say('hero', 'c19.look.mri'); return true; }
        if ((verb === 'use' || verb === 'walk') && !item) { if (F('helmetOff')) { await g.say('hero', 's19.mri.again'); return true; } await g.cut(() => this.mri(g)); return true; }
        break;
      case 'helmet19':
        if (verb === 'look') { await g.say('hero', 'look.helmet19'); return true; }
        if (verb === 'take' || (verb === 'use' && !item)) { e.visible = false; g.hero.forceSpr = null; g.set('helmetBack'); twinkle(g, g.hero.x, g.hero.y - 90, '#e8f4ff'); await g.say('hero', 'take.helmet19'); return true; }
        break;
      case 'xray19': if (verb === 'look') { await g.say('hero', 'c19.look.xray'); return true; } break;
      case 'sandwich19':
        if (verb === 'look') { await g.say('hero', 'c19.look.sandwich'); return true; }
        if (verb === 'take' || (verb === 'use' && !item)) {
          if (!(this.alertT && g.now < this.alertT)) { await g.say('hero', 's19.sandwich.watched'); return true; }
          await g.cut(() => this.sandwich(g)); return true;
        }
        break;
      case 's19bed': if (verb === 'look') { await g.say('hero', 'look.s19bed'); return true; } break;
      case 's19desk': if (verb === 'look') { await g.say('hero', 'look.s19desk'); return true; } break;
    }
    return false;
  },

  /* le tableau : trois symptômes de chez nous ; l'équipe écrit « lupus » */
  async symptoms(g) {
    const B = g.ent('board19'), H = g.ent('house'); g.face(B.x); g.drop('marker19');
    await g.say('hero', 'c19.use.board.1'); await g.say('hero', 'c19.use.board.2'); await g.say('hero', 'c19.use.board.3');
    B.spr = 's2:p_board19s'; twinkle(g, B.x, B.y - 50, '#ff6060'); g.set('symptoms');
    await g.say('hero', 'c19.use.board.4'); g.face(H.x); await g.say('house', 'c19.use.board.5');
  },
  /* l'IRM : l'aimant arrache le casque ; tête nue pour la première fois. Ça ne résout rien */
  async mri(g) {
    const h = g.hero, Hm = g.ent('helmet19'), H = g.ent('house'); g.face(MRI[0]);
    await g.walkTo(352, 204); g.sfx('whoosh'); const x0 = h.x, y0 = h.y - 96, t0 = g.now;
    Object.assign(Hm, { x: x0, y: 182, bob: 182 - y0 - 8, visible: true }); h.forceSpr = 's2:hero_nohelm19';
    const b0 = Hm.bob; await g.until(() => { const u = Math.min(1, (g.now - t0) / 0.35); Hm.x = x0 + (372 - x0) * u; Hm.bob = b0 + (36 - b0) * u; return u >= 1; });
    hit(g, 372, 140, '#cfe4ff'); g.sfx('clang'); g.set('helmetOff');
    await g.say('hero', 'c19.use.mri.1'); g.face(H.x); await g.say('house', 'c19.use.mri.2'); await g.say('hero', 'c19.use.mri.3');
  },
  /* le sandwich « ramassé » pendant l'alerte ; le médecin aperçoit Sheogorath et le note au tableau */
  async sandwich(g) {
    const S = g.ent('sandwich19'), H = g.ent('house'), B = g.ent('board19');
    S.visible = false; g.sfx('pop'); g.set('sandwich'); await g.say('hero', 'c19.use.sandwich.1');
    g.face(H.x); await g.say('house', 'c19.use.sandwich.2'); await g.say('hero', 'c19.use.sandwich.3'); g.give('cheese19'); await g.say('hero', 'c19.use.sandwich.4');
    this.alertT = 0; await sheoPops(g, 'c19.end.sheo');
    g.face(H.x); await g.say('house', 'c19.end.house'); await zap(g, B.x, B.y - 50, { peak: () => { B.spr = 's2:p_board19h'; }, cols: ['#c77dff', '#ffffff'] }); g.chk();
    await g.say('hero', 'c19.end.hero.1'); await g.say('hero', 'c19.end.hero.2'); await g.say('narr', 'c19.end.narr');
    await g.fade(1, 1200); g.hero.forceSpr = null; nextChapter(g, 's2_19');
  },

  async wab(g, id) {
    const e = g.ent(id), H = g.ent('house');
    if (id === 'hero') { await g.say('hero', 'wab.self'); return; }
    switch (id) {
      case 'house': {
        if (g.flag('kind')) {   /* la canne devient un Wabbajack de poche, qu'il garde */
          if (g.flag('cane')) break;
          await wabZap(g, H, () => { H.spr = 's2:house_wab19'; }, ['#c77dff', '#ffd166', '#ffffff']); g.set('cane');
          await g.say('hero', 'c19.wk.cane.1'); await g.say('house', 'c19.wk.cane.2'); await g.say('hero', 'c19.wk.cane.3'); return;
        }
        /* aimable trois secondes : code rouge. Le sandwich est sans surveillance */
        g.set('kind');
        await wabZap(g, H, () => { H.aura = { col: '#ffd6ea', r: 0.75, a: 0.5, wisps: 6 }; }, ['#ffd6ea', '#ffffff', '#ffd166']);
        await g.say('house', 'c19.use.wab.1'); this.alertT = g.now + 30; g.sfx('clang');
        await g.say('hero', 'c19.use.wab.2'); await g.say('narr', 'c19.use.wab.narr');
        await zap(g, ...mid(g, H), { peak: () => { H.aura = null; } }); g.chk(); await g.say('house', 'c19.use.wab.3'); return;
      }
      case 'board19': {   /* couvert de « LUPUS » */
        const old = e.spr; await wabZap(g, e, () => { e.spr = 's2:p_board19l'; }); await g.say('hero', 'c19.wk.board.1'); g.face(H.x); await g.say('house', 'c19.wk.board.2');
        await zap(g, ...mid(g, e), { peak: () => { e.spr = old; } }); g.chk(); return;
      }
      case 'mri19': {   /* un sarcophage de draugr qui s'ouvre et se referme */
        await wabZap(g, e, () => { e.spr = 's2:p_sarco19'; e.scale = 0.62; }, ['#9ad8ff', '#ffffff', '#6fa8ff']);
        const sh = setInterval(() => { if (!g.alive) return clearInterval(sh); e.rot = (Math.random() - 0.5) * 0.04; }, 90);
        await g.say('hero', 'c19.wk.mri'); clearInterval(sh); e.rot = 0;
        await zap(g, ...mid(g, e), { peak: () => { e.spr = 's2:p_mri19'; e.scale = 0.82; } }); g.chk(); await g.say('hero', 's19.wk.back'); return;
      }
      case 'xray19': {   /* une radio de genou, avec une flèche dedans */
        const old = e.spr; await wabZap(g, e, () => { e.spr = 's2:p_xrayknee19'; }, ['#e8f4ff', '#ffffff']);
        await g.say('hero', 'c19.wk.xray'); await g.say('narr', 'c19.gag.1'); await g.say('house', 'c19.gag.2'); await g.say('narr', 'c19.gag.3'); await g.say('hero', 'c19.gag.4');
        await zap(g, ...mid(g, e), { peak: () => { e.spr = old; } }); g.chk(); return;
      }
    }
    await wabZap(g, e, null); await g.say('hero', 'wab.none');
  }
};
