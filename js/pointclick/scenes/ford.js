/* Scène 7 : le gué du cavalier sans tête. Il a perdu sa tête ; une citrouille du champ fera l'affaire. */
import { BLINDS, blindEnt, blindEnter, blindTick, blindOn } from './blind.js';
const BL = BLINDS.ford;

export default {
  id: 'ford', bg: 'ford.png', persp: [190, 0.62, 268, 1.0],
  walk: [[[210, 268], [236, 248], [330, 224], [392, 198], [430, 204], [470, 226], [470, 268]]],
  fg: [],
  start: { x: 240, y: 258, dir: 'r' },
  hot: [
    { id: 'fbridge', rect: [150, 88, 386, 138], at: [380, 200] }, { id: 'fpatch', rect: [0, 132, 230, 262], at: [238, 254], dir: 'l' },
    { id: 'fwater', rect: [160, 112, 292, 182] }, { id: 'ftrees', rect: [0, 0, 130, 132] }, { id: 'fcrows', rect: [40, 78, 140, 124] }
  ],
  ambient: [
    { type: 'flock', n: 5, y0: 20, y1: 80, speed: 8, seed: 31 },
    { type: 'dragon', y: 18, period: 52, offset: 30, scale: 0.8, drop: 6 },
    { type: 'frames', id: 'ford_water', fps: 1.8 },
    { type: 'frames', id: 'ford_mist', fps: 0.9 }
  ],
  ents: [
    { id: 'horseman', spr: 'horseman', x: 340, y: 216, hot: true, at: [296, 232] },
    blindEnt(BL)
  ],

  async enter(g) {
    blindEnter(g, BL);
    if (g.flag('horsemanHappy')) g.ents = g.ents.filter(e => e.id !== 'horseman');
  },
  tick(g) {
    blindTick(g, BL);
    const h = g.ent('horseman'); if (h) h.bob = (0.5 + 0.5 * Math.sin(g.now * 1.1)) * 0.8;
  },

  async intro(g) {
    await g.fade(0, 900); await g.walkTo(262, 256); g.hero.front = true;
    await g.say('hero', 's7.intro1'); await g.say('hero', 's7.intro2'); g.hero.front = false;
  },

  async on(g, verb, id, item) {
    const F = k => g.flag(k);
    if (await blindOn(g, BL, verb, id, item)) return true;
    switch (id) {
      case 'horseman':
        if (verb === 'talk') { const n = g.count('hmTalks') - 1; await g.say('horseman', 's7.t' + (1 + Math.min(n, 2))); return true; }
        if (verb === 'use' && item === 'pumpkin') { await g.cut(() => this.give(g)); return true; }
        break;
      case 'fpatch':
        if (verb === 'take' || (verb === 'use' && !item)) {
          if (g.has('pumpkin') || F('horsemanHappy')) { await g.say('hero', 's7.take.have'); return true; }
          await g.cut(async () => { await g.say('hero', 's7.take1'); g.sfx('pop'); g.give('pumpkin'); }); return true;
        }
        break;
      case 'fbridge':
        if (verb === 'walk' || verb === 'use') {
          if (!F('horsemanHappy')) { await g.say('hero', 's7.bridge.no'); return true; }
          await g.cut(async () => { await g.say('hero', 's7.bridge.yes'); await g.walkTo(380, 200); await g.fade(1, 900); setTimeout(() => g.goScene('wood', { intro: true }), 0); }); return true;
        }
        break;
    }
    return false;
  },

  /* une citrouille en guise de tête : il galope, ravi, vers l'horizon */
  async give(g) {
    const h = g.ent('horseman'); g.face(h.x);
    await g.say('hero', 's7.give1'); g.drop('pumpkin'); h.spr = 'horseman.pumpkin'; g.sfx('jingle');
    await g.say('horseman', 's7.give2'); await g.say('horseman', 's7.give3');
    g.sfx('whoosh'); await g.walkEnt('horseman', 560, 236, 150);
    g.ents = g.ents.filter(e => e !== h); g.set('horsemanHappy'); await g.say('hero', 's7.give4');
  }
};
