/* Scène 2 : le chemin du moulin. Énigme de l'équitation verticale : carotte → cheval → falaise à 90 degrés → meule de fromage dorée. */
import { BLINDS, blindEnt, blindEnter, blindTick, blindOn } from './blind.js';
const BL = BLINDS.mill;
const LEDGE = { x: 326, y: 56, poly: [[300, 53], [352, 53], [352, 59], [300, 59]] };
const BASE = [326, 207];
const UP = -Math.PI / 2, DOWN = Math.PI / 2;

export default {
  id: 'mill', bg: 'mill.png', persp: [205, 0.62, 268, 1.0],
  walk: [[[100, 267], [106, 232], [135, 212], [200, 205], [300, 205], [352, 214], [352, 248], [320, 268]]],
  fg: [],
  start: { x: 112, y: 262, dir: 'r' },
  hot: [
    { id: 'mountain', rect: [236, 50, 322, 96] }, { id: 'mill', rect: [20, 45, 130, 175] },
    { id: 'wheel', rect: [128, 118, 196, 182], at: [200, 212], dir: 'l' },
    { id: 'cliff', rect: [308, 60, 480, 182], at: [BASE[0], BASE[1]] }, { id: 'ledge', rect: [300, 40, 352, 60] },
    { id: 'river', rect: [270, 178, 480, 232], at: [338, 222] },
    { id: 'garden', rect: [0, 184, 116, 214], at: [114, 234], dir: 'l' },
    { id: 'signpost', rect: [30, 122, 100, 183], at: [112, 232], dir: 'l' },
    { id: 'path', rect: [250, 238, 350, 268], at: [300, 262] }
  ],
  ambient: [
    { type: 'dragon', y: 10, period: 40, offset: 14, scale: 0.9, drop: 6 },
    { type: 'flock', n: 4, y0: 20, y1: 90, speed: 11, seed: 8 },
    { type: 'frames', id: 'mill_wheel', fps: 1.6, seq: [0, 1, 2, -1] },
    { type: 'frames', id: 'mill_river', fps: 2.2 },
    { type: 'puffs', x: 103, y: 50, h: 32, wind: 12, n: 7 },
    { type: 'frames', id: 'mill_garden', fps: 1.2 }, { type: 'frames', id: 'mill_grass', fps: 1.1, offset: 0.8 }
  ],
  ents: [
    { id: 'horse', spr: 'horse', x: 252, y: 226, hot: true, at: [214, 236] },
    { id: 'cheese', spr: 'cheese', x: LEDGE.x, y: LEDGE.y + 2, scale: 0.8, hot: true, at: [BASE[0], BASE[1] + 4], z: -2 },
    blindEnt(BL)
  ],

  async enter(g) {
    blindEnter(g, BL);
    const F = k => g.flag(k);
    if (F('cheese')) g.ents = g.ents.filter(e => e.id !== 'cheese');
    if (F('onLedge') && !F('cheese')) { const h = g.hero; h.x = LEDGE.x - 14; h.y = LEDGE.y; h.scale = 0.5; g.addWalk(LEDGE.poly); const hs = g.ent('horse'); hs.x = LEDGE.x + 18; hs.y = LEDGE.y; hs.scale = 0.45; }
  },
  tick(g) {
    blindTick(g, BL);
    const h = g.ent('horse'); if (h && h.visible) h.bob = Math.max(0, Math.sin(g.now * 1.7)) * 0.8;
    const r = g.ent('rider'); if (r) r.bob = Math.abs(Math.sin(g.now * 14)) * 1.5;
  },

  async intro(g) {
    await g.fade(0, 900); const h = g.hero; await g.walkTo(152, 244); h.front = true;
    await g.say('hero', 's2.intro1'); await g.say('hero', 's2.intro2'); h.front = false;
  },

  async on(g, verb, id, item) {
    const F = k => g.flag(k);
    if (await blindOn(g, BL, verb, id, item)) return true;
    if (F('onLedge') && !F('cheese') && id !== 'cheese' && verb !== 'look') { if (id === 'hero' || id === 'ledge') return false; await g.say('hero', 's2.ledge.stuck'); return true; }
    switch (id) {
      case 'horse':
        if (verb === 'use' && !item) {
          if (!F('friend')) { await g.say('hero', 'use.horse.nocarrot'); return true; }
          await g.cut(() => this.rideUp(g)); return true;
        }
        if (verb === 'use' && item === 'carrot') { if (F('friend')) { await g.say('hero', 'use.horse.friend2'); return true; } await g.cut(() => this.feedHorse(g)); return true; }
        break;
      case 'garden':
        if (verb === 'take' || verb === 'use') { if (F('hasCarrot')) { await g.say('hero', 'take.garden.done'); return true; } await g.cut(async () => { await g.say('hero', 's2.carrot.take'); g.sfx('pop'); g.set('hasCarrot'); g.give('carrot'); }); return true; }
        break;
      case 'cheese':
        if (verb === 'take' || verb === 'use') {
          if (!F('onLedge')) { await g.say('hero', 'take.cheese.far'); return true; }
          await g.cut(() => this.takeCheese(g)); return true;
        }
        break;
      case 'cliff': case 'ledge':
        if (verb === 'walk') { if (id === 'cliff') { await g.say('hero', 'use.cliff'); return true; } }
        break;
      case 'path':
        if (verb === 'walk' || verb === 'use') { if (!F('cheese')) { await g.say('hero', 's2.exit.no'); return true; } await g.cut(async () => { await g.say('hero', 's2.exit.yes'); await g.walkTo(300, 270); await g.fade(1, 900); setTimeout(() => g.goScene('meadow', { intro: true }), 0); }); return true; }
        break;
    }
    return false;
  },

  async feedHorse(g) {
    await g.say('hero', 's2.horse.c1'); g.drop('carrot'); g.sfx('coin'); await g.wait(300);
    await g.say('horse', 's2.horse.c2'); g.sfx('cluck'); g.set('friend'); await g.say('hero', 's2.horse.c3');
  },

  /* le cheval gravit la falaise à 90 degrés */
  async rideUp(g) {
    const h = g.hero, horse = g.ent('horse');
    await g.say('hero', 's2.ride1'); h.visible = false; horse.visible = false;
    const r = { id: 'rider', spr: 'horse.ride', x: horse.x, y: horse.y, visible: true, noHot: true, scale: 0.7, z: 300 }; g.ents.push(r);
    await g.walkEnt('rider', BASE[0] - 6, BASE[1] + 4, 80); r.y = BASE[1] + 4;
    await g.say('horse', 's2.ride2'); await g.say('rider', 's2.ride3');
    g.sfx('whoosh'); r.rot = UP; g.shake(2600, 1.4);
    const climb = g.walkEnt('rider', LEDGE.x - 6, LEDGE.y + 18, 34);
    setTimeout(() => g.sfx('step'), 200); setTimeout(() => g.sfx('step'), 700);
    g.say('rider', 's2.ride4'); await climb; g.sfx('clang');
    g.ents = g.ents.filter(e => e !== r);
    h.visible = true; h.x = LEDGE.x - 14; h.y = LEDGE.y; h.scale = 0.5; h.dir = 'r'; horse.visible = true; horse.x = LEDGE.x + 18; horse.y = LEDGE.y; horse.scale = 0.45;
    g.set('onLedge'); g.addWalk(LEDGE.poly); await g.wait(400); await g.say('hero', 's2.ride5');
  },
  async takeCheese(g) {
    const h = g.hero, horse = g.ent('horse');
    await g.say('hero', 's2.cheese1'); g.sfx('pop'); g.ents = g.ents.filter(e => e.id !== 'cheese'); g.set('cheese'); g.give('cheese');
    await g.say('hero', 's2.cheese2'); await g.say('horse', 's2.cheese3'); await g.say('hero', 's2.cheese4');
    h.visible = false; horse.visible = false;
    const r = { id: 'rider', spr: 'horse.ride', x: LEDGE.x - 6, y: LEDGE.y + 18, visible: true, noHot: true, scale: 0.7, z: 300, rot: DOWN }; g.ents.push(r);
    g.sfx('whoosh'); g.shake(1800, 1.6); await g.walkEnt('rider', BASE[0] - 6, BASE[1] + 2, 80); g.sfx('clang'); g.shake(300, 3);
    g.ents = g.ents.filter(e => e !== r); delete h.scale; h.x = BASE[0] - 12; h.y = BASE[1] + 14; h.visible = true; h.dir = 'l';
    delete horse.scale; horse.x = 252; horse.y = 226; horse.visible = true;
    g.set('onLedge', false); await g.say('hero', 's2.down1');
  }
};
