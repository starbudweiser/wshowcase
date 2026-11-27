/* Saison 2, chapitre 27 : « Fus Ro Dub Dub », le seul chapitre en dessin animé (le héros aussi est redessiné). Le garage du vieux
   savant qui rote, son petit-fils anxieux, un portail vert qui tourbillonne. La boîte à bouton fait jaillir une créature bleue qui
   veut exaucer UNE demande : des fromages qui parlent, qui crient, des renforts, trente créatures paniquées… Le Wabbajack change le
   savant en cornichon : enfin écouté, le petit-fils trouve la bonne meule. Coordonnées logiques 480 × 270 (décor 960 × 540). */
import { zap, twinkle, shout, confetti } from '../engine/fx2.js';
import { wabZap, wabSwap, sheoPops, nextChapter, mid, tip } from './s2_common.js';

const PORTAL = { x: 380, y: 70, rx: 34, ry: 46 };

export default {
  id: 's2_27', hd: true, bg: 's2/d_garage27.webp', music: 's2_27_savant', amb: ['night', 0.12], steps: 'stone',
  persp: [124, 0.5, 268, 0.88], walkK: 1.9, blockR: [16, 6],
  light: { tint: '#e8f0ff', k: 0.04 },
  /* le héros en dessin animé : vues clés et boucles LTX propres, la gauche en miroir de la droite */
  hero2: { r: 's2:toon_pr', l: 's2:toon_pr', qr: 's2:toon_qr', ql: 's2:toon_qr', f: 's2:toon_f', b: 's2:toon_b' },
  heroLife: { walk: { r: 'toon_wr', f: 'toon_wf', b: 'toon_wb' }, idle: { qr: 'toon_iqr', f: 'toon_if' }, talk: { qr: 'toon_tqr', f: 'toon_tf' } },
  heroMirror: { l: 'r', ql: 'qr' },
  walk: [[[196, 150], [250, 126], [440, 126], [440, 168], [430, 240], [476, 252], [476, 268], [70, 268], [70, 244], [150, 206]]],
  start: { x: 262, y: 240, dir: 'l' },
  fx: { lights: [{ x: PORTAL.x, y: PORTAL.y, r: 120, col: '#7dff6a', a: 0.22, fl: 0.12 }] },
  hot: [
    { id: 'portal27', rect: [344, 22, 416, 120], at: [372, 140], dir: 'b' }, { id: 's27door', rect: [290, 8, 440, 112] },
    { id: 's27bench', rect: [0, 60, 200, 150] }
  ],
  preload: ['s2:toon_pr', 's2:toon_qr', 's2:toon_f', 's2:toon_b', 's2:madsci_gun27', 's2:p_pickle27', 's2:p_cart27', 's2:i_waterbucket13', 's2:p_cheesetalk27', 's2:p_cheeseshout27', 's2:hero_qr', 's2:hero_ql', 's2:hero_f'],
  ents: [
    { id: 'gun27', spr: 's2:p_gun27', x: 150, y: 150, bob: 34, scale: 0.25, noShadow: true, hot: true, solid: false, at: [196, 176], name: 'n.gun27' },
    { id: 'saucer27', spr: 's2:p_saucer27', x: 418, y: 150, scale: 0.6, hot: true, at: [400, 170], block: [36, 8], name: 'n.saucer27' },
    { id: 'pile27', spr: 's2:p_cheesepile27', x: 360, y: 150, scale: 0.2, hot: true, solid: false, at: [340, 170], visible: false, name: 'n.cheesepile27' },
    { id: 'box27', spr: 's2:p_box27', x: 252, y: 196, scale: 0.3, hot: true, solid: false, at: [230, 214], name: 'n.box27' },
    { id: 'carry27', spr: 's2:p_cheesetalk27', x: 0, y: 0, scale: 0.3, noShadow: true, hot: false, solid: false, visible: false },
    { id: 'bluegenie', spr: 's2:bluegenie', x: 252, y: 196, hot: true, solid: false, at: [230, 214], visible: false, name: 'n.bluegenie' },
    { id: 'madsci', spr: 's2:madsci', x: 128, y: 236, hot: true, at: [168, 246], name: 'n.madsci' },
    { id: 'grandson', spr: 's2:grandson', x: 352, y: 232, flip: true, hot: true, at: [316, 240], name: 'n.grandson' },
    { id: 'grandson2', spr: 's2:grandson', x: 392, y: 238, hot: false, visible: false },
    { id: 'sheo', spr: 's2:sheo', x: 300, y: 240, hot: false, visible: false, aura: { col: '#c77dff', r: 0.6, a: 0.35, wisps: 3 } }
  ],

  async enter(g, how) {
    const F = k => g.flag(k), M = g.ent('madsci');
    g.toonOff = false; this.crowd = [];
    if (F('cart')) g.ent('saucer27').spr = 's2:p_cart27';
    if (F('crowd')) { g.ent('pile27').visible = true; g.ent('pile27').scale = 0.46; }
    if (F('pickle')) Object.assign(M, { spr: 's2:p_pickle27', scale: 0.32, name: 'n.pickle27' }); else if (F('crowd')) M.spr = 's2:madsci_gun27';
    if (F('crowd') && !F('pickle')) this.fillCrowd(g, 30);
    if (how.intro) g.fx.fade = { from: 1, to: 1, t0: g.now, ms: 0.01, a: 1 };
  },
  async intro(g) {
    g.hero.front = true;
    await g.card('assets/pointclick/s2/cards/r_rick.webp', g.T('ch.s2_27'));
    const M = g.ent('madsci'), K = g.ent('grandson'); g.face(M.x);
    await g.say('madsci', 'c27.wake.1'); await g.say('madsci', 'c27.wake.2'); g.face(K.x); await g.say('grandson', 'c27.wake.3');
    g.hero.front = true; await g.say('hero', 'c27.wake.4'); await g.say('narr', 'c27.wake.narr'); g.hero.front = false;
  },

  /* le portail : un tourbillon vert dessiné par le moteur, derrière les acteurs */
  drawBack(g, c) {
    const { x, y, rx, ry } = PORTAL, t = g.now;
    c.save(); c.translate(x, y); c.scale(1, ry / rx);
    const gr = c.createRadialGradient(0, 0, 2, 0, 0, rx); gr.addColorStop(0, '#eaffd0'); gr.addColorStop(0.35, '#8dff4a'); gr.addColorStop(0.8, '#2fbf2a'); gr.addColorStop(1, 'rgba(20,90,20,0)');
    c.fillStyle = gr; c.beginPath(); c.arc(0, 0, rx, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(230,255,200,0.75)'; c.lineWidth = 1.6;
    for (let k = 0; k < 4; k++) { c.beginPath(); for (let a = 0; a < 7; a += 0.15) { const r = rx * (a / 7), an = a * 1.6 + k * Math.PI / 2 - t * 3; const px = Math.cos(an) * r, py = Math.sin(an) * r; a ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); }
    c.restore();
  },
  /* les créatures paniquées sautillent sur place */
  tick(g) {
    for (const e of this.crowd || []) { e.bob = Math.abs(Math.sin(g.now * e.sp + e.ph)) * 5; e.x = e.x0 + Math.sin(g.now * e.sp * 0.7 + e.ph) * 6; }
  },
  fillCrowd(g, n) {
    this.crowd = this.crowd || [];
    for (let i = this.crowd.length; i < n; i++) {
      const x0 = 90 + ((i * 97) % 340), y = 150 + ((i * 53) % 110), e = { id: 'genie' + i, spr: 's2:bluegenie', x: x0, x0, y, flip: i % 2 === 1, hot: false, solid: false, ph: i * 1.7, sp: 5 + (i % 5), visible: true };
      this.crowd.push(e); g.ents.push(e);
    }
  },
  clearCrowd(g) { for (const e of this.crowd || []) { const i = g.ents.indexOf(e); if (i >= 0) g.ents.splice(i, 1); } this.crowd = []; },

  async on(g, verb, id, item) {
    const F = k => g.flag(k), e = g.ent(id), M = g.ent('madsci'), K = g.ent('grandson');
    if (verb === 'use' && (item === 'wabbajack' || (id === 'wabbajack' && item))) { await g.cut(() => this.wab(g, item === 'wabbajack' ? id : item)); return true; }
    switch (id) {
      case 'madsci':
        if (verb === 'look') { await g.say('hero', F('pickle') ? 'look.pickle27' : 'look.madsci'); return true; }
        if (verb === 'talk') {
          if (F('pickle')) { await g.say('madsci', 'c27.use.wab.madsci.2'); return true; }
          if (F('crowd')) { await g.say('madsci', 'c27.cheese.madsci'); return true; }
          await g.say('madsci', 'c27.talk.madsci.1'); await g.say('hero', 'c27.talk.madsci.2'); await g.say('madsci', 'c27.talk.madsci.3'); await g.say('hero', 'c27.talk.madsci.4'); return true;
        }
        break;
      case 'grandson':
        if (verb === 'look') { await g.say('hero', 'look.grandson'); return true; }
        if (verb === 'talk') {
          if (F('crowd') && !F('pickle')) { await g.say('grandson', 'c27.cheese.grandson'); return true; }
          await g.say('grandson', 'c27.talk.grandson.1'); await g.say('hero', 'c27.talk.grandson.2'); await g.say('grandson', 'c27.talk.grandson.3'); return true;
        }
        break;
      case 'box27':
        if (verb === 'look') { await g.say('hero', 'c27.look.box'); return true; }
        if ((verb === 'use' || verb === 'take') && !item) { if (F('crowd')) { await g.say('hero', 's27.box.done'); return true; } await g.cut(() => this.genie(g)); return true; }
        break;
      case 'bluegenie': if (verb === 'look') { await g.say('hero', 'look.bluegenie'); return true; } break;
      case 'pile27':
        if (verb === 'look') { await g.say('hero', 'look.cheesepile27'); return true; }
        if ((verb === 'take' || verb === 'use') && !item) { await g.say('hero', 's27.pile.loud'); return true; }
        break;
      case 'gun27': if (verb === 'look') { await g.say('hero', 'look.gun27'); return true; } break;
      case 'saucer27': if (verb === 'look') { await g.say('hero', F('cart') ? 'look.cart27' : 'c27.look.saucer'); return true; } break;
      case 'portal27':
        if (verb === 'look') { await g.say('hero', 'c27.look.portal'); return true; }
        if (verb === 'use' || verb === 'walk') { await g.say('hero', 's27.portal.no'); return true; }
        break;
      case 's27door': if (verb === 'look') { await g.say('hero', 'look.s27door'); return true; } break;
      case 's27bench': if (verb === 'look') { await g.say('hero', 'c27.look.garage'); return true; } break;
    }
    return false;
  },

  /* aller-retour d'une créature par le portail ; elle revient avec spr dans les bras */
  async fetch(g, B, spr) {
    const C = g.ent('carry27'), x0 = B.x, y0 = B.y, t0 = g.now;
    await g.until(() => { const u = Math.min(1, (g.now - t0) / 1.1); B.x = x0 + (PORTAL.x - x0) * u; B.y = y0 + (PORTAL.y + 60 - y0) * u; B.alpha = 1 - Math.max(0, u - 0.6) / 0.4; return u >= 1; });
    g.sfx('whoosh'); await g.wait(700); C.spr = spr; g.sfx('whoosh');
    const t1 = g.now; await g.until(() => { const u = Math.min(1, (g.now - t1) / 1.1); B.x = PORTAL.x + (x0 - PORTAL.x) * u; B.y = PORTAL.y + 60 + (y0 - PORTAL.y - 60) * u; B.alpha = Math.min(1, u / 0.4); Object.assign(C, { visible: true, x: B.x + 18 * g.sc(B), y: B.y + 1, bob: g.sc(B) * 150 * 0.5 }); return u >= 1; });
  },
  /* la boîte : une demande, deux mauvais fromages, des renforts, trente créatures */
  async genie(g) {
    const B = g.ent('bluegenie'), M = g.ent('madsci'), K = g.ent('grandson'), C = g.ent('carry27'), P = g.ent('pile27');
    g.face(252); await g.say('hero', 'c27.use.box'); g.sfx('click');
    await zap(g, 252, 160, { peak: () => { Object.assign(B, { visible: true, x: 252, y: 200, alpha: 1 }); }, cols: ['#5ad8ff', '#ffffff', '#b8f0ff'] }); g.chk();
    await g.say('bluegenie', 'c27.use.box.genie'); g.face(M.x); await g.say('madsci', 'c27.use.box.madsci'); g.face(B.x); await g.say('hero', 'c27.ask.hero'); await g.say('bluegenie', 'c27.ask.genie');
    await this.fetch(g, B, 's2:p_cheesetalk27'); await g.say('bluegenie', 'c27.cheese.1'); await g.say('hero', 'c27.cheese.1.hero');
    C.visible = false; P.visible = true; P.scale = 0.2; g.sfx('pop');
    await this.fetch(g, B, 's2:p_cheeseshout27'); await g.say('bluegenie', 'c27.cheese.2'); shout(g, C.x, C.y - C.bob - 6, -1); g.sfx('shout'); await g.say('hero', 'c27.cheese.2.hero');
    C.visible = false; P.scale = 0.3; g.sfx('pop');
    await g.say('bluegenie', 'c27.cheese.3'); await g.say('bluegenie', 'c27.cheese.4'); g.sfx('click');
    for (const n of [4, 12, 30]) { this.fillCrowd(g, n); twinkle(g, 252, 170, '#5ad8ff'); g.sfx('pop'); await g.wait(500); }
    P.scale = 0.46; g.set('crowd');
    await g.say('narr', 'c27.cheese.narr'); g.face(K.x); await g.say('grandson', 'c27.cheese.grandson');
    g.ent('gun27').visible = false; M.spr = 's2:madsci_gun27'; g.face(M.x); await g.say('madsci', 'c27.cheese.madsci');
  },
  /* le savant en cornichon : enfin, on écoute le petit-fils */
  async pickle(g) {
    const M = g.ent('madsci'), K = g.ent('grandson'), B = g.ent('bluegenie'), P = g.ent('pile27');
    await wabZap(g, M, () => { Object.assign(M, { spr: 's2:p_pickle27', scale: 0.32, name: 'n.pickle27' }); }, ['#7dff6a', '#ffffff', '#3aa83a']); g.set('pickle');
    await g.say('hero', 'c27.use.wab.madsci'); await g.say('madsci', 'c27.use.wab.madsci.2');
    g.face(K.x); await g.say('grandson', 'c27.use.wab.grandson'); twinkle(g, P.x, P.y - 14, '#ffd166'); g.sfx('coin'); g.give('cheese27');
    await g.say('hero', 'c27.use.wab.hero'); await g.say('bluegenie', 'c27.use.wab.genie');
    for (const e of [...this.crowd, B]) { if (!e.visible) continue; twinkle(g, e.x, e.y - 30, '#5ad8ff'); e.visible = false; g.sfx('pop'); await g.wait(60); }
    confetti(g, 252, 120, 60); this.clearCrowd(g);
    await g.say('narr', 'c27.use.wab.narr'); g.face(M.x); await g.say('madsci', 'c27.gag.1'); await g.say('narr', 'c27.gag.narr');
    await sheoPops(g, 'c27.gag.sheo'); g.face(M.x); await g.say('madsci', 'c27.gag.madsci');
    await g.say('madsci', 'c27.end.madsci'); await g.say('hero', 'c27.end.hero'); await g.say('narr', 'c27.end.narr');
    await g.fade(1, 1200); g.toonOff = false; nextChapter(g, 's2_27');
  },

  async wab(g, id) {
    const e = g.ent(id), M = g.ent('madsci'), K = g.ent('grandson');
    if (id === 'hero') {   /* redevenu peint un instant */
      await wabZap(g, null, () => { g.toonOff = true; }, ['#ffd166', '#ffffff']); await g.say('hero', 'c27.wk.hero'); await g.say('narr', 'c27.wk.hero.narr');
      await zap(g, g.hero.x, g.hero.y - 40, { peak: () => { g.toonOff = false; } }); g.chk(); return;
    }
    switch (id) {
      case 'madsci':
        if (g.flag('pickle')) break;
        if (!g.flag('crowd')) { await wabZap(g, M, null); await g.say('hero', 's27.wab.early'); return; }
        await this.pickle(g); return;
      case 'gun27': await wabSwap(g, e, 's2:i_waterbucket13', [['hero', 'c27.wk.gun'], ['madsci', 'c27.wk.gun.madsci']], 's27.wk.back', { scale: 0.16 }); return;
      case 'saucer27': if (g.flag('cart')) break; await wabZap(g, e, () => { e.spr = 's2:p_cart27'; }, ['#9ad8ff', '#ffffff']); g.set('cart'); await g.say('hero', 'c27.wk.saucer'); return;
      case 'grandson': {   /* un deuxième petit-fils, encore plus anxieux */
        const K2 = g.ent('grandson2'); await wabZap(g, K, () => { Object.assign(K2, { visible: true, x: K.x + 38, y: K.y + 4, flip: false }); }, ['#ffe870', '#ffffff']);
        await g.say('grandson', 'c27.wk.grandson'); await g.say('grandson', 'c27.wk.grandson.2');
        await g.wait(300); await zap(g, ...mid(g, K2), { peak: () => { K2.visible = false; } }); g.chk(); await g.say('hero', 's27.wk.back'); return;
      }
    }
    await wabZap(g, e, null); await g.say('hero', 'wab.none');
  }
};
