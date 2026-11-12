/* Scène 9 : la longue salle. La compagne « jurée de porter vos fardeaux » bouche la porte ; une enclume lui sera confiée. */
import { BLINDS, blindEnt, blindEnter, blindTick, blindOn } from './blind.js';
const BL = BLINDS.hall, DOOR = [362, 172], AWAY = [150, 236];

export default {
  id: 'hall', interior: true, bg: 'hall.png', persp: [172, 0.75, 268, 1.45],
  walk: [[[40, 268], [130, 232], [260, 196], [330, 174], [396, 170], [432, 192], [470, 232], [470, 268]]],
  fg: [],
  start: { x: 250, y: 232, dir: 'r' },
  hot: [
    { id: 'hdoorway', rect: [328, 68, 398, 158], at: [362, 176] }, { id: 'hthrone', rect: [92, 84, 182, 212], at: [204, 228], dir: 'l' },
    { id: 'hbanner', rect: [100, 20, 262, 132] }, { id: 'htorch', rect: [28, 68, 64, 162], at: [78, 232], dir: 'l' },
    { id: 'hrug', rect: [200, 190, 410, 268], at: [300, 250] }, { id: 'hchest', rect: [22, 206, 88, 262], at: [104, 248], dir: 'l' }
  ],
  ambient: [
    { type: 'frames', id: 'hall_torch_l', fps: 7, seq: [0, 1, 2, 1] },
    { type: 'frames', id: 'hall_torch_r', fps: 7, seq: [0, 1, 2, 1], offset: 0.3 }
  ],
  ents: [
    { id: 'follower', spr: 'follower', x: DOOR[0], y: DOOR[1], hot: true, at: [DOOR[0] - 22, DOOR[1] + 10] },
    blindEnt(BL)
  ],

  async enter(g) {
    blindEnter(g, BL);
    if (g.flag('followerGone')) { const f = g.ent('follower'); f.x = AWAY[0]; f.y = AWAY[1]; f.at = [AWAY[0] + 34, AWAY[1] + 8]; }
  },
  tick(g) {
    blindTick(g, BL);
    const f = g.ent('follower'); if (f && !g.flag('followerGone')) f.rot = Math.sin(g.now * 1.4) * 0.012;
  },

  async intro(g) {
    await g.fade(0, 900); await g.walkTo(260, 226); g.hero.front = true;
    await g.say('hero', 's9.intro1'); await g.say('hero', 's9.intro2'); g.hero.front = false;
  },

  async on(g, verb, id, item) {
    const F = k => g.flag(k);
    if (await blindOn(g, BL, verb, id, item)) return true;
    switch (id) {
      case 'follower':
        if (verb === 'talk') { const n = g.count('fTalks') - 1; await g.say('follower', 's9.t' + (1 + (n % 3))); return true; }
        if (verb === 'use' && item === 'anvil') { await g.cut(() => this.give(g)); return true; }
        if (verb === 'use' && !item) { await g.say('hero', 's9.f.use'); return true; }
        break;
      case 'hchest':
        if (verb === 'take' || (verb === 'use' && !item)) {
          if (g.has('anvil') || F('followerGone')) { await g.say('hero', 's9.take.have'); return true; }
          await g.cut(async () => { await g.say('hero', 's9.take1'); g.sfx('clang'); g.give('anvil'); }); return true;
        }
        break;
      case 'hdoorway':
        if (verb === 'walk' || verb === 'use') {
          if (!F('followerGone')) { await g.say('hero', 's9.door.no'); return true; }
          await g.cut(async () => { await g.say('hero', 's9.door.yes'); await g.walkTo(362, 176); await g.fade(1, 900); setTimeout(() => g.goScene('party', { intro: true }), 0); }); return true;
        }
        break;
    }
    return false;
  },

  /* elle porte tout : l'enclume aussi, en traversant lentement la salle */
  async give(g) {
    const f = g.ent('follower'); g.face(f.x);
    await g.say('hero', 's9.give1'); g.drop('anvil'); g.sfx('clang'); g.shake(300, 3);
    await g.say('follower', 's9.give2');
    const w = g.walkEnt('follower', AWAY[0], AWAY[1], 22); await g.wait(1200); g.bark('follower', 's9.give3', 2500, true); await w;
    f.at = [AWAY[0] + 34, AWAY[1] + 8]; g.set('followerGone'); await g.say('hero', 's9.give4');
  }
};
