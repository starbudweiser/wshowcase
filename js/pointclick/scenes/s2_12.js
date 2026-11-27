/* Saison 2, chapitre 12 (1/2) : la route du désert. Le duo de détectives (un chien en costume, un lapin surexcité) enquête sur le vol
   de la plus grosse meule du monde ; le lapin a mangé les clés de la voiture : le Wabbajack en fait une charrette, et en route pour
   l'attraction (s2_12b). Coordonnées logiques 480 × 270 (décor 960 × 540). */
import { zap } from '../engine/fx2.js';
import { wabZap, wabSwap, sheoPops, tip } from './s2_common.js';

export default {
  id: 's2_12', hd: true, bg: 's2/d_sammax_a.webp', music: 's2_12_detectives', amb: ['desert', 0.35], steps: 'dirt',
  persp: [150, 0.36, 270, 0.62], walkK: 1.9, blockR: [16, 6],
  /* plein soleil d'après-midi : légère teinte chaude */
  light: { tint: '#ffe2b8', k: 0.14 },
  walk: [[[8, 150], [300, 146], [478, 172], [478, 268], [8, 268]]],
  start: { x: 150, y: 240, dir: 'r' },
  hot: [{ id: 's12board', rect: [370, 8, 472, 92] }, { id: 's12hills', rect: [0, 78, 370, 106] }, { id: 's12light', rect: [362, 133, 386, 150], at: [330, 228] }],
  preload: ['s2:p_cart12', 's2:max_calm', 's2:sam_wolf'],
  ents: [
    { id: 's12car', spr: 's2:p_car12', x: 370, y: 214, hot: true, at: [300, 228], block: [96, 8], name: 'n.s12car' },
    { id: 'max', spr: 's2:max', x: 232, y: 234, hot: true, at: [196, 240] },
    { id: 'sam', spr: 's2:sam', x: 286, y: 224, hot: true, at: [252, 238] },
    { id: 'sheo', spr: 's2:sheo', x: 300, y: 230, hot: false, visible: false, aura: { col: '#c77dff', r: 0.6, a: 0.35, wisps: 3 } }
  ],

  async enter(g, how) {
    if (g.flag('carWab')) { const c = g.ent('s12car'); c.spr = 's2:p_cart12'; c.name = 'n.s12cart'; }
    if (how.intro) g.fx.fade = { from: 1, to: 1, t0: g.now, ms: 0.01, a: 1 };
  },
  async intro(g) {
    g.hero.front = true;
    await g.card('assets/pointclick/s2/cards/r_sammax.webp', g.T('ch.s2_12'));
    const max = g.ent('max'), sam = g.ent('sam'); g.shake(250, 2);
    await g.say('max', 'c12.wake.1'); await g.say('hero', 'c12.wake.2'); g.face(sam.x); await g.say('sam', 'c12.wake.3');
    await g.say('max', 'c12.wake.4'); g.face(max.x); await g.say('hero', 'c12.wake.5'); await g.say('narr', 'c12.wake.6');
    g.face(sam.x); await g.say('sam', 'c12.wake.7'); await g.say('hero', 'c12.wake.8');
  },

  async on(g, verb, id, item) {
    const F = k => g.flag(k), e = g.ent(id);
    if (verb === 'use' && (item === 'wabbajack' || (id === 'wabbajack' && item))) { await g.cut(() => this.wab(g, item === 'wabbajack' ? id : item)); return true; }
    switch (id) {
      case 'max':
        if (verb === 'talk') {
          if (!F('maxTalked')) { g.set('maxTalked'); await g.say('max', 'c12.talk.max.1'); await g.say('hero', 'c12.talk.max.2'); return true; }
          if (!F('gagDone')) { await g.cut(() => this.gag(g)); return true; }
          await g.say('max', 'c12.talk.max.1'); return true;
        }
        break;
      case 'sam':
        if (verb === 'talk') { await g.say('hero', 'c12.talk.sam.1'); await g.say('sam', 'c12.talk.sam.2'); return true; }
        break;
      case 's12car':
        if (F('carWab')) { if (verb === 'look') { await g.say('hero', 'look.s12cart'); return true; } if (verb === 'use' || verb === 'walk') { await g.cut(() => this.ride(g)); return true; } break; }
        if (verb === 'look') {
          await g.say('hero', 'c12.look.car.1');
          if (!F('keys')) { g.set('keys'); await g.say('max', 'c12.look.car.2'); await g.say('sam', 'c12.look.car.3'); }
          return true;
        }
        if (verb === 'use' && !item) { await g.say('hero', 'c12.use.car.bad'); return true; }
        break;
    }
    return false;
  },

  /* le lapin attrape le Wabbajack ; Sheogorath passe une tête */
  async gag(g) {
    g.set('gagDone'); const max = g.ent('max'); g.face(max.x);
    await g.say('max', 'c12.gag.1'); g.sfx('whoosh'); await g.say('sam', 'c12.gag.2'); await g.say('max', 'c12.gag.3');
    await g.say('hero', 'c12.gag.4'); await g.say('max', 'c12.gag.5'); await sheoPops(g, 'c12.gag.sheo');
  },

  async wab(g, id) {
    const e = g.ent(id);
    if (id === 'hero') { await g.say('hero', 'wab.self'); return; }
    switch (id) {
      case 's12car': {   /* la voiture devient une charrette : en route pour l'attraction */
        if (g.flag('carWab')) break;
        await wabZap(g, e, () => { e.spr = 's2:p_cart12'; e.name = 'n.s12cart'; }); g.set('carWab');
        await g.say('hero', 'c12.wab.car.1'); await g.say('sam', 'c12.wab.car.2'); await g.say('max', 'c12.wab.car.3');
        await this.ride(g); return;
      }
      case 's12light': {   /* le gyrophare joue l'air de chez le héros */
        if (g.flag('carWab')) break;
        g.face(374); await zap(g, 374, 142, { from: tip(g), cols: ['#ff5050', '#5aa0ff', '#ffffff'] }); g.chk(); g.sfx('jingle');
        g.musicOverride('title'); await g.say('hero', 'c12.wk.light.1'); await g.say('narr', 'c12.wk.light.2'); g.musicOverride(null); return;
      }
      case 'max': await wabSwap(g, e, 's2:max_calm', [['max', 'c12.wk.rabbit.1'], ['sam', 'c12.wk.rabbit.2'], ['hero', 'c12.wk.rabbit.3']], 's12.wk.back'); return;
      case 'sam': await wabSwap(g, e, 's2:sam_wolf', [['sam', 'c12.wk.dog.1'], ['hero', 'c12.wk.dog.2']], 's12.wk.back'); return;
    }
    await wabZap(g, e, null); await g.say('hero', 'wab.none');
  },

  /* trois heures de charrette, en fondu : la charrette traverse un rocher, personne ne s'en étonne */
  async ride(g) {
    await g.say('hero', 's12.ride.go'); g.sfx('whoosh'); await g.fade(1, 900);
    await g.say('narr', 'c12.road.narr');
    setTimeout(() => g.goScene('s2_12b', { intro: true }), 0);
  }
};
