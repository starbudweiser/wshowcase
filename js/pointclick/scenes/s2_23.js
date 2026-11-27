/* Saison 2, chapitre 23 : projections. Un appartement ensoleillé ; l'expert, très poli, analyse la confiture sur l'armure du héros et
   en déduit tout. Sa petite pièce fermée (« Silence, mon frère ») est tapissée de plastique : une aire de pique-nique sous Wabbajack.
   Dedans, la boîte de beignets du commissariat : une meule. Aucun crime : seulement la confiture, le plastique et les beignets.
   Coordonnées logiques 480 × 270 (décor 960 × 540). */
import { zap, twinkle } from '../engine/fx2.js';
import { wabZap, wabSwap, sheoPops, nextChapter, mid, tip } from './s2_common.js';

const DOOR = [[378, 40], [445, 40], [445, 200], [378, 200]];

export default {
  id: 's2_23', hd: true, bg: 's2/d_miami.webp', music: 's2_23_miami', amb: ['house', 0.15], steps: 'wood',
  persp: [200, 0.62, 268, 0.86], walkK: 1.9, blockR: [16, 6],
  light: { tint: '#fff4e0', k: 0.04 },
  walk: [[[200, 202], [476, 206], [476, 268], [4, 268], [4, 254], [200, 252]]],
  start: { x: 360, y: 258, dir: 'l' },
  fx: { lights: [{ x: 70, y: 70, r: 90, col: '#fff2c0', a: 0.2, fl: 0 }], flies: [{ rect: [10, 20, 130, 110], n: 0 }] },
  hot: [
    { id: 's23door', poly: DOOR, at: [404, 214], dir: 'r' }, { id: 'slides23', rect: [252, 118, 340, 138], at: [290, 214] },
    { id: 's23sofa', rect: [0, 125, 195, 250], at: [210, 256] }, { id: 's23window', rect: [0, 0, 130, 120] }
  ],
  preload: ['s2:p_plastic23', 's2:p_picnic23', 's2:p_dexdonuts23', 's2:p_photorow23', 's2:p_slides23'],
  ents: [
    { id: 'room23', spr: 's2:p_plastic23', x: 412, y: 150, bob: -50, scale: 1.0, clip: DOOR, noShadow: true, noLight: true, hot: false, solid: false, visible: false },
    { id: 'donuts23', spr: 's2:p_donuts23', x: 412, y: 196, scale: 0.22, noShadow: true, hot: true, solid: false, at: [404, 214], visible: false, name: 'n.donuts23' },
    { id: 'photo23', spr: 's2:p_photo23', x: 263, y: 84, scale: 0.18, noShadow: true, hot: true, solid: false, at: [270, 214], name: 'n.photo23' },
    { id: 'slidesC', spr: 's2:p_slides23', x: 296, y: 136, scale: 0.18, noShadow: true, hot: false, solid: false, visible: false },
    { id: 'dexter', spr: 's2:dexter', x: 304, y: 226, hot: true, at: [264, 238], name: 'n.dexter' },
    { id: 'sister', spr: 's2:sister', x: 218, y: 258, hot: true, at: [262, 260], name: 'n.sister' },
    { id: 'sheo', spr: 's2:sheo', x: 300, y: 240, hot: false, visible: false, aura: { col: '#c77dff', r: 0.6, a: 0.35, wisps: 3 } }
  ],

  async enter(g, how) {
    const F = k => g.flag(k);
    if (F('doorOpen')) { g.ent('room23').visible = true; g.ent('donuts23').visible = true; }
    if (F('picnic')) g.ent('room23').spr = 's2:p_picnic23';
    if (F('rowboat')) g.ent('photo23').spr = 's2:p_photorow23';
    if (F('slides')) g.ent('slidesC').visible = true;
    if (how.intro) g.fx.fade = { from: 1, to: 1, t0: g.now, ms: 0.01, a: 1 };
  },
  async intro(g) {
    g.hero.front = true;
    await g.card('assets/pointclick/s2/cards/r_dexter.webp', g.T('ch.s2_23'));
    const D = g.ent('dexter'); g.face(D.x);
    await g.say('dexter', 'c23.wake.1'); await g.say('hero', 'c23.wake.2'); await g.say('narr', 'c23.wake.3'); await g.say('dexter', 'c23.wake.4');
  },

  async on(g, verb, id, item) {
    const F = k => g.flag(k), e = g.ent(id), D = g.ent('dexter'), Z = g.ent('sister');
    if (verb === 'use' && (item === 'wabbajack' || (id === 'wabbajack' && item))) { await g.cut(() => this.wab(g, item === 'wabbajack' ? id : item)); return true; }
    if (id === 'hero' && verb === 'look') { await g.say('hero', 'c23.look.armour'); return true; }
    switch (id) {
      case 'dexter':
        if (verb === 'look') { await g.say('hero', 'look.dexter'); return true; }
        if (verb === 'talk') {
          if (F('analysed')) { await g.say('dexter', 'c23.talk.dexter.door'); return true; }
          g.set('analysed'); await g.say('dexter', 'c23.talk.dexter.1'); await g.say('dexter', 'c23.talk.dexter.2'); await g.say('dexter', 'c23.talk.dexter.3');
          await g.say('hero', 'c23.talk.dexter.4'); await g.say('dexter', 'c23.talk.dexter.5'); await g.say('dexter', 'c23.talk.dexter.6'); return true;
        }
        break;
      case 'sister':
        if (verb === 'look') { await g.say('hero', 'look.sister'); return true; }
        if (verb === 'talk') { await g.say('sister', 'c23.talk.sister.1'); g.face(D.x); await g.say('dexter', 'c23.talk.dexter.7'); g.face(Z.x); await g.say('hero', 'c23.talk.sister.2'); await g.say('sister', 'c23.talk.sister.3'); await g.say('sister', 'c23.talk.sister.4'); return true; }
        if (verb === 'use' && item === 'sweetroll') { await g.say('sister', 'c23.use.sweetroll.sister'); await g.say('hero', 'c23.use.sweetroll.hero'); return true; }
        break;
      case 's23door':
        if (verb === 'look') { await g.say('hero', F('doorOpen') ? (F('picnic') ? 'look.picnic23' : 'c23.look.room') : 'c23.look.door'); return true; }
        if ((verb === 'use' || verb === 'walk') && !F('doorOpen')) {
          if (!F('doorAsked')) { g.set('doorAsked'); g.face(D.x); await g.say('dexter', 'c23.talk.dexter.door'); return true; }
          await g.cut(() => this.openDoor(g)); return true;
        }
        break;
      case 'donuts23':
        if (verb === 'look' || verb === 'take' || (verb === 'use' && !item)) { await g.say('hero', 'c23.use.box'); return true; }
        break;
      case 'photo23': if (verb === 'look') { await g.say('hero', 'c23.look.boat'); return true; } break;
      case 'slides23': if (verb === 'look') { await g.say('hero', F('slides') ? 'look.slidescheese23' : 'c23.look.microscope'); return true; } break;
      case 's23sofa': if (verb === 'look') { await g.say('hero', 'look.s23sofa'); return true; } break;
      case 's23window': if (verb === 'look') { await g.say('hero', 'look.s23window'); return true; } break;
    }
    return false;
  },

  /* « Silence, mon frère » : ce n'est pas un club, c'est une pièce. Il ouvre quand même */
  async openDoor(g) {
    const D = g.ent('dexter'), R = g.ent('room23'), B = g.ent('donuts23');
    g.face(412); await g.say('hero', 'c23.use.password'); g.face(D.x); await g.say('dexter', 'c23.use.password.dexter');
    g.sfx('click'); R.visible = true; B.visible = true; g.set('doorOpen'); g.face(412);
    await g.say('hero', 'c23.look.room'); g.face(D.x); await g.say('dexter', 'c23.look.room.dexter'); await g.say('narr', 'c23.gag.narr');
  },

  async wab(g, id) {
    const e = g.ent(id), D = g.ent('dexter'), Z = g.ent('sister');
    if (id === 'hero') { await g.say('hero', 'wab.self'); return; }
    switch (id) {
      case 's23door': {   /* une aire de pique-nique */
        if (!g.flag('doorOpen')) break; if (g.flag('picnic')) break;
        const R = g.ent('room23'); g.face(412); await zap(g, 412, 120, { from: tip(g), peak: () => { R.spr = 's2:p_picnic23'; }, cols: ['#7dff6a', '#ffffff', '#ff6b6b'] }); g.chk(); g.set('picnic');
        await g.say('hero', 'c23.use.wab.room'); g.face(D.x); await g.say('dexter', 'c23.use.wab.room.dexter'); return;
      }
      case 'donuts23': {   /* une meule : les collègues sont déçus */
        if (!g.flag('doorOpen')) break;
        await wabZap(g, e, () => { e.visible = false; twinkle(g, e.x, e.y - 8, '#ffd166'); }, ['#ffd166', '#ffffff', '#ff8fd8']); g.give('cheese23');
        await g.say('hero', 'c23.use.wab.donuts'); await g.say('narr', 'c23.use.wab.donuts.narr');
        g.face(Z.x); await g.say('sister', 'c23.station.sister'); g.face(D.x); await g.say('dexter', 'c23.station.dexter'); await g.say('hero', 'c23.station.hero');
        await sheoPops(g, 'c23.end.sheo', false); g.face(D.x); await g.say('dexter', 'c23.end.dexter'); await g.say('sheo', 'c23.end.sheo.2'); await g.say('narr', 'c23.end.narr'); await g.say('hero', 'c23.end.hero');
        await g.fade(1, 1200); nextChapter(g, 's2_23'); return;
      }
      case 'slides23': {   /* des tranches de fromage */
        if (g.flag('slides')) break;
        const C = g.ent('slidesC'); g.face(296); await zap(g, 296, 128, { from: tip(g), peak: () => { C.visible = true; }, cols: ['#ffd166', '#ffffff'] }); g.chk(); g.set('slides');
        g.face(D.x); await g.say('dexter', 'c23.wk.slides'); await g.say('hero', 'c23.wk.slides.hero'); return;
      }
      case 'dexter': await wabSwap(g, D, 's2:p_dexdonuts23', [['hero', 'c23.wk.dexter'], ['sister', 'c23.wk.dexter.sister']], 's23.wk.back', { scale: 0.62 }); return;
      case 'sister': { await wabZap(g, Z, null, ['#ff5d5d', '#ffffff']); await g.say('sister', 'c23.wk.sister'); await g.say('hero', 'c23.wk.sister.hero'); return; }
      case 'photo23': {   /* une barque nordique */
        if (g.flag('rowboat')) break;
        await wabZap(g, e, () => { e.spr = 's2:p_photorow23'; }, ['#9ad8ff', '#ffffff']); g.set('rowboat'); g.face(D.x); await g.say('dexter', 'c23.wk.boat'); await g.say('hero', 'c23.wk.boat.hero'); return;
      }
    }
    await wabZap(g, e, null); await g.say('hero', 'wab.none');
  }
};
