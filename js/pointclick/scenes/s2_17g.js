/* Saison 2, chapitre 17, version anglaise (1/2) : la route des chevaliers qui disent « Ni ! ». Un chevalier galope à pied en tapant
   des noix de coco ; les géants exigent un buisson : la lavande de Blancherive, puis le Wabbajack le taille en mammouth. Le château
   au loin lance des vaches (des chèvres sous Wabbajack). Ensuite, la route mène au pont (s2_17gb). Coordonnées logiques 480 × 270. */
import { zap, twinkle, hit } from '../engine/fx2.js';
import { wabZap, wabSwap, mid, tip } from './s2_common.js';

const CASTLE = [156, 70], SHRUB = [238, 152];
const GOATS = [[176, 236], [250, 206], [214, 252]], RAMP = [[132, 66], [163, 60], [192, 65]];   /* chèvres : atterrissage, puis sur les remparts */

export default {
  id: 's2_17g', hd: true, bg: 's2/d_road17.webp', music: 's2_17_table_en', amb: ['forest', 0.35], steps: 'dirt',
  persp: [110, 0.32, 268, 0.85], walkK: 1.9, blockR: [16, 6],
  light: { tint: '#fff2dc', k: 0.05 },
  walk: [[[4, 180], [150, 178], [300, 150], [360, 126], [400, 112], [410, 118], [384, 140], [476, 178], [476, 268], [4, 268]]],
  start: { x: 92, y: 242, dir: 'r' },
  fx: { lights: [], flies: [{ rect: [0, 150, 300, 260], n: 6, col: '#fff3a0' }] },
  hot: [
    { id: 's17castle', rect: [104, 46, 208, 96] }, { id: 's17road', rect: [380, 96, 422, 126], at: [398, 118], dir: 'r' }
  ],
  preload: ['s2:p_shrub17', 's2:p_topiary17', 's2:p_grenadecheese17', 's2:p_horses17', 's2:p_goat17'],
  ents: [
    { id: 'coconut', spr: 's2:coconut', x: 200, y: 216, hot: true, at: [160, 230], name: 'n.coconut' },
    { id: 'ni', spr: 's2:ni', x: 346, y: 152, scale: 0.72, hot: true, at: [300, 176], block: [30, 9], name: 'n.ni' },
    { id: 'ni2', spr: 's2:ni', x: 392, y: 140, scale: 0.66, hot: true, at: [300, 176], block: [26, 8], flip: true, name: 'n.ni2' },
    { id: 'grenade17', spr: 's2:p_grenade17', x: 440, y: 222, scale: 0.6, hot: true, at: [404, 236], block: [16, 5], name: 'n.grenade17' },
    { id: 'shrub17', spr: 's2:p_shrub17', x: SHRUB[0], y: SHRUB[1], scale: 0.42, hot: true, solid: false, at: [238, 180], visible: false, name: 'n.shrub17' },
    { id: 'horses', spr: 's2:p_horses17', x: 260, y: 222, scale: 0.55, hot: false, solid: false, visible: false },
    ...GOATS.map((p, i) => ({ id: 'goat' + i, spr: 's2:p_goat17', x: p[0], y: p[1], scale: 0.32, hot: false, solid: false, visible: false })),
    { id: 'sheo', spr: 's2:sheo', x: 300, y: 240, hot: false, visible: false, aura: { col: '#c77dff', r: 0.6, a: 0.35, wisps: 3 } }
  ],

  async enter(g, how) {
    const F = k => g.flag(k);
    if (F('shrub')) g.ent('shrub17').visible = true;
    if (F('goatsUp')) RAMP.forEach((p, i) => Object.assign(g.ent('goat' + i), { x: p[0], y: p[1], scale: 0.1, noShadow: true, visible: true }));
    if (F('topiary')) { const S = g.ent('shrub17'); S.spr = 's2:p_topiary17'; S.scale = 0.5; S.name = 'n.topiary17'; this.stepAside(g); }
    if (how.intro) g.fx.fade = { from: 1, to: 1, t0: g.now, ms: 0.01, a: 1 };
  },
  /* les chevaliers « Ni ! » s'écartent de la route */
  stepAside(g) { Object.assign(g.ent('ni'), { x: 300, y: 150, scale: 0.6, block: null }); Object.assign(g.ent('ni2'), { x: 450, y: 178, scale: 0.7, block: null }); },
  async intro(g) {
    g.hero.front = true;
    await g.card('assets/pointclick/s2/cards/r_graal.webp', g.T('ch.s2_17g'));
    const C = g.ent('coconut'); g.face(C.x);
    await g.say('coconut', 'c17g.wake.1'); await g.say('hero', 'c17g.wake.2'); await g.say('coconut', 'c17g.wake.3'); await g.say('narr', 'c17g.wake.4');
    await g.say('coconut', 'c17g.wake.5'); await g.say('hero', 'c17g.wake.6');
  },

  async on(g, verb, id, item) {
    const F = k => g.flag(k), e = g.ent(id);
    if (verb === 'use' && (item === 'wabbajack' || (id === 'wabbajack' && item))) { await g.cut(() => this.wab(g, item === 'wabbajack' ? id : item)); return true; }
    switch (id) {
      case 'coconut':
        if (verb === 'look') { if (!F('lookedKnight')) { g.set('lookedKnight'); await g.say('hero', 'c17g.look.knight'); } else await g.say('hero', 'c17g.look.coconuts'); return true; }
        if (verb === 'talk') { await g.say('coconut', 'c17g.wake.5'); return true; }
        break;
      case 'ni': case 'ni2':
        if (verb === 'look') { await g.say('hero', 'c17g.look.ni'); return true; }
        if (verb === 'talk') { await g.cut(() => this.ni(g)); return true; }
        if (verb === 'use' && item === 'sweetroll') { await g.say('hero', 'c17g.fail.ni.1'); await g.say('ni', 'c17g.fail.ni.2'); return true; }
        if (verb === 'use' && item === 'lavender') { await g.cut(() => this.plant(g)); return true; }
        break;
      case 'shrub17': if (verb === 'look') { await g.say('hero', F('topiary') ? 'look.topiary17' : 'look.shrub17'); return true; } break;
      case 'grenade17': if (verb === 'look') { await g.say('hero', 'look.grenade17'); return true; } break;
      case 's17castle': if (verb === 'look') { await g.say('hero', 'look.s17castle'); return true; } break;
      case 's17road':
        if (verb === 'look') { await g.say('hero', 'look.s17road'); return true; }
        if (verb === 'use' || verb === 'walk') {
          if (!F('topiary')) { if (!F('niMet')) await g.cut(() => this.ni(g)); else await g.say('hero', 's17g.road.blocked'); return true; }
          await g.fade(1, 700); setTimeout(() => g.goScene('s2_17gb', { intro: true }), 0); return true;
        }
        break;
    }
    return false;
  },

  /* « Ni ! » : un buisson */
  async ni(g) {
    g.set('niMet'); const N = g.ent('ni'); g.face(N.x);
    await g.say('ni', 'c17g.ni.1'); await g.say('hero', 'c17g.ni.2'); await g.say('ni', 'c17g.ni.3'); g.face(g.ent('coconut').x); await g.say('coconut', 'c17g.ni.4');
  },
  /* la lavande de Blancherive : un petit buisson, pas assez joli */
  async plant(g) {
    const S = g.ent('shrub17'); g.face(S.x); await g.say('hero', 'c17g.use.plant.1'); g.drop('lavender');
    await zap(g, S.x, S.y - 12, { peak: () => { S.visible = true; g.set('shrub'); }, cols: ['#b48cff', '#7dd65a', '#ffffff'] }); g.chk();
    await g.say('ni', 'c17g.use.plant.2'); await g.say('hero', 'c17g.use.plant.3');
  },

  async wab(g, id) {
    const e = g.ent(id), C = g.ent('coconut');
    if (id === 'hero') { await g.say('hero', 'wab.self'); return; }
    switch (id) {
      case 'shrub17': {   /* taillé en mammouth, avec un petit chemin */
        if (g.flag('topiary')) break;
        await wabZap(g, e, () => { e.spr = 's2:p_topiary17'; e.scale = 0.5; e.name = 'n.topiary17'; }, ['#7dd65a', '#ffffff', '#b48cff']); g.set('topiary');
        await g.say('hero', 'c17g.use.shrub.1'); await g.say('ni', 'c17g.use.shrub.2');
        await g.fade(1, 300); this.stepAside(g); await g.fade(0, 300); await g.say('narr', 'c17g.use.shrub.narr'); return;
      }
      case 'coconut': {   /* de vrais chevaux… qui repartent sans lui */
        const H = g.ent('horses'); g.face(C.x);
        await zap(g, ...mid(g, C), { from: tip(g), peak: () => { Object.assign(H, { x: C.x + 62, y: C.y + 4, visible: true }); }, cols: ['#c9a46a', '#ffffff', '#ffd166'] }); g.chk();
        await g.wait(500); await zap(g, H.x, H.y - 30, { peak: () => { H.visible = false; }, cols: ['#d8c8a8', '#ffffff'] }); g.chk();   /* pouf : partis au galop */
        await g.say('coconut', 'c17g.wk.coconuts.1'); await g.say('hero', 'c17g.wk.coconuts.2'); return;
      }
      case 'grenade17': await wabSwap(g, e, 's2:p_grenadecheese17', [['coconut', 'c17g.wk.grenade.1'], ['hero', 'c17g.wk.grenade.2']], 's17g.wk.back'); return;
      case 's17castle': {   /* les vaches lancées du rempart retombent en chèvres */
        if (g.flag('goatsUp')) break;
        g.face(CASTLE[0]); await zap(g, ...CASTLE, { from: tip(g), cols: ['#ffffff', '#ffd166'] }); g.chk();
        for (let i = 0; i < GOATS.length; i++) {
          const G = g.ent('goat' + i), [tx, ty] = GOATS[i], t0 = g.now, d = 0.9;
          Object.assign(G, { x: CASTLE[0], y: CASTLE[1], visible: true, scale: 0.08 });
          await g.until(() => { const u = Math.min(1, (g.now - t0) / d); G.x = CASTLE[0] + (tx - CASTLE[0]) * u; G.y = CASTLE[1] + (ty - CASTLE[1]) * u; G.bob = Math.sin(u * Math.PI) * 60; G.scale = 0.08 + 0.24 * u; G.rot = u * 5; return u >= 1; });
          G.bob = 0; G.rot = 0; hit(g, tx, ty - 6, '#e8dcc0'); g.sfx('pop');
        }
        await g.wait(400);
        for (let i = 0; i < GOATS.length; i++) { const G = g.ent('goat' + i); await zap(g, G.x, G.y - 10, { peak: () => { Object.assign(G, { x: RAMP[i][0], y: RAMP[i][1], scale: 0.1, noShadow: true }); }, cols: ['#e8dcc0', '#ffffff'] }); }   /* elles grimpent sur ses remparts */
        g.chk(); g.set('goatsUp'); await g.say('hero', 'c17g.wk.cows.1'); g.face(C.x); await g.say('coconut', 'c17g.wk.cows.2'); return;
      }
    }
    await wabZap(g, e, null); await g.say('hero', 'wab.none');
  }
};
