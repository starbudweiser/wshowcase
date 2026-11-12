/* Scène 4 : le marché aux choux. Anomalie physique : cinquante choux dans une petite charrette → envol de la charrette. */
import { BLINDS, blindEnt, blindEnter, blindTick, blindOn } from './blind.js';
const BL = BLINDS.market;
const CART = [316, 198], LOAD = 10;

export default {
  id: 'market', bg: 'market.png', persp: [170, 0.55, 268, 1.0],
  walk: [[[175, 268], [175, 238], [200, 216], [250, 206], [320, 192], [350, 184], [392, 196], [470, 232], [470, 268]]],
  fg: [],
  start: { x: 192, y: 258, dir: 'r' },
  hot: [
    { id: 'crate', rect: [38, 168, 162, 258], at: [176, 244], dir: 'l' }, { id: 'mstalls', rect: [150, 108, 330, 190] },
    { id: 'mhouses', rect: [0, 0, 150, 165] }, { id: 'mmount', rect: [268, 34, 400, 76] },
    { id: 'mroad', rect: [326, 150, 410, 196], at: [352, 186] }
  ],
  ambient: [
    { type: 'dragon', y: 14, period: 44, offset: 18, scale: 0.8, drop: 6 },
    { type: 'flock', n: 4, y0: 14, y1: 70, speed: 10, seed: 14 },
    { type: 'puffs', x: 54, y: 16, h: 30, wind: 9, n: 6 }
  ],
  ents: [
    { id: 'farmer', spr: 'farmer', x: 258, y: 224, hot: true, at: [236, 230] },
    { id: 'handcart', spr: 'cart', x: CART[0], y: CART[1], hot: true, at: [CART[0] - 34, CART[1] + 10], z: 1 },
    blindEnt(BL)
  ],

  async enter(g) {
    blindEnter(g, BL);
    if (g.flag('cartGone')) g.ents = g.ents.filter(e => e.id !== 'handcart');
  },
  tick(g) {
    blindTick(g, BL);
    const c = g.ent('handcart'), n = (g.flag('cartLoad') || 0) / LOAD; if (!c || g.flag('cartGone')) return;
    c.bob = n >= 3 ? Math.abs(Math.sin(g.now * (30 + n * 8))) * (n - 2) * 1.6 : 0; c.rot = n >= 3 ? Math.sin(g.now * 40) * 0.02 * (n - 2) : 0;
  },

  async intro(g) {
    await g.fade(0, 900); await g.walkTo(214, 252); g.hero.front = true;
    await g.say('hero', 's4.intro1'); await g.say('hero', 's4.intro2'); g.hero.front = false;
  },

  async on(g, verb, id, item) {
    const F = k => g.flag(k);
    if (await blindOn(g, BL, verb, id, item)) return true;
    switch (id) {
      case 'farmer':
        if (verb === 'talk') { const n = g.count('farmerTalks') - 1; await g.say('farmer', 's4.farmer.t' + (1 + Math.min(n, 3))); return true; }
        if (verb === 'use' && item === 'cabbage') { await g.say('farmer', 's4.cabbage.farmer'); return true; }
        break;
      case 'crate':
        if (verb === 'take' || (verb === 'use' && !item)) {
          if (g.has('cabbage')) { await g.say('hero', 's4.take.have'); return true; }
          await g.cut(async () => { await g.say('hero', 's4.take1'); g.sfx('pop'); g.give('cabbage'); }); return true;
        }
        if (verb === 'use' && item === 'cabbage') { await g.say('hero', 's4.crate.back'); return true; }
        break;
      case 'handcart':
        if (verb === 'use' && item === 'cabbage') { if (F('cartGone')) return false; await g.cut(() => this.load(g)); return true; }
        if (verb === 'talk') { await g.say('hero', 'talk.handcart'); return true; }
        break;
      case 'mroad':
        if (verb === 'walk' || verb === 'use') {
          if (!F('cartGone')) { await g.say('hero', 's4.road.no'); return true; }
          await g.cut(async () => { await g.say('hero', 's4.exit'); await g.walkTo(352, 184); await g.fade(1, 900); setTimeout(() => g.goScene('gate', { intro: true }), 0); }); return true;
        }
        break;
    }
    return false;
  },

  /* dix choux de plus dans la charrette : tout va bien… jusqu'au cinquantième */
  async load(g) {
    g.drop('cabbage'); g.sfx('pop'); const n = g.count('cartLoad', LOAD) / LOAD;
    if (n < 5) { await g.say('hero', 's4.load.' + n); await g.say('farmer', 's4.farmer.l' + n); return; }
    await g.say('hero', 's4.boom1'); const c = g.ent('handcart');
    await g.say('hero', 's4.boom2'); await g.say('farmer', 's4.farmer.boom');
    g.sfx('whoosh'); g.shake(1800, 5);
    for (let i = 0; i < 5; i++) { g.sfx('clang'); await g.wait(260); }
    g.ents = g.ents.filter(e => e !== c);
    g.fly('cart', [c.x, c.y], [c.x + 40, -160], 1500, 0, 7, 1);
    for (let i = 0; i < 12; i++) { g.fly('cabbage', [c.x, c.y - 20], [c.x + (i - 6) * 36, -60 - (i % 4) * 30], 1300 + (i % 3) * 200, 0, 6 + (i % 5), 0.8); await g.wait(70); }
    await g.wait(1500); g.sfx('clang'); g.shake(700, 4);
    g.set('cartGone'); await g.say('hero', 's4.boom3'); await g.say('farmer', 's4.farmer.after'); await g.say('hero', 's4.after');
  }
};
