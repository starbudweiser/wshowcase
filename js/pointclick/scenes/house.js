/* Scène 6 : la maison de la veuve. Le mannequin d'armure bloque la porte et ne bouge que lorsqu'on lui tourne le dos. */
import { BLINDS, blindEnt, blindEnter, blindTick, blindOn } from './blind.js';
const BL = BLINDS.house, MAN = [392, 240], AWAY = [146, 250];

export default {
  id: 'house', bg: 'house.png', persp: [200, 0.72, 268, 1.0],
  walk: [[[96, 268], [124, 226], [200, 208], [340, 208], [404, 226], [432, 268]]],
  fg: [],
  start: { x: 120, y: 256, dir: 'r' },
  hot: [
    { id: 'hhearth', rect: [0, 40, 128, 214], at: [142, 236], dir: 'l' }, { id: 'htable', rect: [138, 138, 202, 202], at: [190, 214] },
    { id: 'hbed', rect: [188, 124, 312, 186], at: [250, 208] }, { id: 'hwindow', rect: [212, 82, 260, 124], at: [236, 208] },
    { id: 'hshelf', rect: [326, 78, 382, 210], at: [352, 224] }, { id: 'hdoor', rect: [384, 56, 456, 232], at: [414, 240] }
  ],
  ambient: [],
  ents: [
    { id: 'mannequin', spr: 'mannequin', x: MAN[0], y: MAN[1], hot: true, at: [MAN[0] - 40, MAN[1] + 8] },
    blindEnt(BL)
  ],

  async enter(g) {
    blindEnter(g, BL);
    if (g.flag('armorMoved')) { const m = g.ent('mannequin'); m.x = AWAY[0]; m.y = AWAY[1]; m.at = [AWAY[0] + 40, AWAY[1] + 8]; }
  },
  tick(g) { blindTick(g, BL); },

  async intro(g) {
    await g.fade(0, 900); await g.walkTo(170, 250); g.hero.front = true;
    await g.say('hero', 's6.intro1'); await g.say('hero', 's6.intro2'); g.hero.front = false;
  },

  async on(g, verb, id, item) {
    const F = k => g.flag(k);
    if (await blindOn(g, BL, verb, id, item)) return true;
    switch (id) {
      case 'mannequin':
        if (verb === 'use' || verb === 'take') { await g.say('hero', 's6.man.use'); return true; }
        break;
      case 'hwindow':
        if (verb === 'look') { await g.cut(() => this.lookWindow(g)); return true; }
        break;
      case 'hdoor':
        if (verb === 'walk' || verb === 'use') {
          if (!F('armorMoved')) { await g.say('hero', 's6.door.no'); return true; }
          await g.cut(async () => { await g.say('hero', 's6.door.yes'); await g.walkTo(414, 240); await g.fade(1, 900); setTimeout(() => g.goScene('ford', { intro: true }), 0); }); return true;
        }
        break;
    }
    return false;
  },

  /* on tourne le dos à l'armure : elle se déplace */
  async lookWindow(g) {
    if (g.flag('armorMoved')) { await g.say('hero', 's6.win.again'); return; }
    await g.walkTo(236, 210); g.face(236); g.hero.dir = 'r';
    await g.say('hero', 's6.win.1'); g.sfx('clang'); await g.wait(400); g.sfx('clang'); g.sfx('step');
    await g.say('hero', 's6.win.2');
    const m = g.ent('mannequin'); m.x = AWAY[0]; m.y = AWAY[1]; m.at = [AWAY[0] + 40, AWAY[1] + 8]; g.sfx('clang'); g.set('armorMoved');
    await g.wait(500); g.hero.front = true; await g.say('hero', 's6.win.3'); g.hero.front = false;
  }
};
