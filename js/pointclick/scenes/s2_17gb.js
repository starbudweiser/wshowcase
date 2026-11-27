/* Saison 2, chapitre 17, version anglaise (2/2) : le pont du chevalier noir et la grotte du lapin. Le Cri ne fait que le baigner ;
   le Wabbajack en fait un garde de chez nous, qui s'assoit pour raconter sa vie. Le lapin, changé en dragon, est pire ; une brioche
   règle l'affaire. Au fond de la grotte, le Graal est un seau, et dedans, un stilton. Coordonnées logiques 480 × 270 (décor 960 × 540). */
import { zap, twinkle, shout, splash, confetti, hit } from '../engine/fx2.js';
import { wabZap, sheoPops, nextChapter, mid, tip } from './s2_common.js';

const CAVE = [440, 176], CRAG = [36, 26];

export default {
  id: 's2_17gb', hd: true, bg: 's2/d_gorge17.webp', music: 's2_17_table_en', amb: ['forest', 0.35], steps: 'dirt',
  persp: [146, 0.42, 268, 0.85], walkK: 1.9, blockR: [16, 6],
  light: { tint: '#fff2dc', k: 0.06 },
  /* le pont (en diagonale depuis le premier plan) puis la clairière ; le chevalier noir bouche le bout du pont */
  walk: [[[4, 214], [148, 146], [236, 146], [300, 152], [430, 166], [476, 178], [476, 268], [236, 268], [236, 166], [96, 234], [4, 246]]],
  start: { x: 96, y: 226, dir: 'r' },
  fx: { lights: [], flies: [{ rect: [240, 150, 470, 250], n: 6, col: '#fff3a0' }] },
  hot: [
    { id: 'cave17', rect: [424, 78, 478, 150], at: CAVE, dir: 'r' }, { id: 's17bones', rect: [300, 132, 422, 186], at: [360, 196] },
    { id: 's17stream', rect: [0, 138, 128, 198] }, { id: 's17flames', rect: [0, 0, 78, 128] },
    { id: 's17bridge', poly: [[4, 214], [148, 146], [236, 146], [236, 160], [96, 234], [4, 246]] }
  ],
  preload: ['s2:p_guard17', 's2:p_dragon17'],
  ents: [
    { id: 'coconut', spr: 's2:coconut', x: 34, y: 240, hot: true, solid: false, at: [80, 236], name: 'n.coconut' },
    { id: 'bk', spr: 's2:bk', x: 214, y: 156, hot: true, at: [176, 178], block: [24, 9], flip: true, name: 'n.bk' },
    { id: 'guard17', spr: 's2:p_guard17', x: 266, y: 174, hot: true, at: [246, 192], visible: false, name: 'n.guard17' },
    { id: 'rabbit17', spr: 's2:rabbit17', x: 412, y: 182, hot: true, at: [370, 200], flip: true, name: 'n.rabbit17' },
    { id: 'grail17', spr: 's2:p_grail17', x: 452, y: 148, scale: 0.34, noShadow: true, noLight: true, hot: true, solid: false, at: CAVE, visible: false, name: 'n.grail17', aura: { col: '#ffd166', r: 0.9, a: 0.45, wisps: 4 } },
    { id: 'sheo', spr: 's2:sheo', x: 300, y: 240, hot: false, visible: false, aura: { col: '#c77dff', r: 0.6, a: 0.35, wisps: 3 } }
  ],

  async enter(g, how) {
    const F = k => g.flag(k);
    if (F('bkSat')) { g.ent('bk').visible = false; g.ent('guard17').visible = true; }
    if (F('rabbitFed')) { g.ent('rabbit17').visible = false; if (!F('grailTaken')) g.ent('grail17').visible = true; }
    this.flameT = g.now + 2;
    if (how.intro) g.fx.fade = { from: 1, to: 1, t0: g.now, ms: 0.01, a: 1 };
  },
  /* l'enchanteur, invisible derrière son rocher : un jet de flammes de temps en temps (des confettis après le Wabbajack) */
  tick(g) {
    if (g.now < (this.flameT || 0)) return; this.flameT = g.now + 4 + Math.random() * 4;
    const P = g.parts = g.parts || [], conf = g.flag('flamesConf');
    if (conf) { confetti(g, CRAG[0], CRAG[1], 26); return; }
    for (let i = 0; i < 34; i++) P.push({ k: 'spark', x: CRAG[0] + (Math.random() - 0.5) * 10, y: CRAG[1], vx: (Math.random() - 0.5) * 30, vy: -40 - Math.random() * 50, g: 30, drag: 0.6, t: -Math.random() * 0.25, life: 0.6 + Math.random() * 0.6, s: 1.2 + Math.random() * 1.4, col: i % 3 ? '#ff9a30' : '#ffe08a', sw: (Math.random() - 0.5) * 2 });
    for (let i = 0; i < 5; i++) P.push({ k: 'smoke', x: CRAG[0] + (Math.random() - 0.5) * 12, y: CRAG[1] - 10, vx: (Math.random() - 0.5) * 6, vy: -14 - Math.random() * 8, g: -2, drag: 0.4, t: 0.2, life: 2, s: 4, grow: 8, rot: Math.random() * 6, vr: 0.3, a: 0.5 });
    hit(g, CRAG[0], CRAG[1] - 6, '#ff9a30');
  },
  async intro(g) {
    await g.fade(0, 900); const B = g.ent('bk');
    g.face(B.x); await g.say('bk', 'c17g.bk.1'); await g.say('hero', 'c17g.bk.2'); await g.say('bk', 'c17g.bk.3'); await g.say('hero', 'c17g.bk.4'); await g.say('bk', 'c17g.bk.5');
  },

  async on(g, verb, id, item) {
    const F = k => g.flag(k), e = g.ent(id);
    if (verb === 'use' && (item === 'wabbajack' || (id === 'wabbajack' && item))) { await g.cut(() => this.wab(g, item === 'wabbajack' ? id : item)); return true; }
    switch (id) {
      case 'coconut': if (verb === 'look') { await g.say('hero', 'c17g.look.knight'); return true; } if (verb === 'talk') { await g.say('coconut', F('bkSat') ? 'c17g.rabbit.1' : 'c17g.wake.5'); return true; } break;
      case 'bk':
        if (verb === 'look') { await g.say('hero', 'c17g.look.bk'); return true; }
        if (verb === 'talk') { await g.say('bk', 'c17g.bk.1'); await g.say('hero', 'c17g.bk.2'); await g.say('bk', 'c17g.bk.3'); return true; }
        if (verb === 'use' && item === 'shout') { await g.cut(() => this.bath(g)); return true; }
        break;
      case 'guard17': if (verb === 'look') { await g.say('hero', 'look.guard17'); return true; } if (verb === 'talk') { g.cinePos = { bk: g.headPos(e) }; await g.say('bk', 'c17g.use.bk.1'); g.cinePos = null; return true; } break;
      case 'rabbit17':
        if (verb === 'look') { await g.say('hero', 'c17g.look.rabbit'); if (!F('warned')) { g.set('warned'); g.face(g.ent('coconut').x); await g.say('coconut', 'c17g.rabbit.1'); } return true; }
        if (verb === 'use' && item === 'sweetroll') { await g.cut(() => this.feed(g)); return true; }
        break;
      case 'cave17': case 'grail17':
        if (verb === 'look') { await g.say('hero', F('rabbitFed') ? 'c17g.look.grail' : 'c17g.look.rabbit'); return true; }
        if (verb === 'use' || verb === 'take' || verb === 'walk') {
          if (!F('rabbitFed')) { await g.say('hero', 's17g.cave.blocked'); return true; }
          await g.cut(() => this.grail(g)); return true;
        }
        break;
      case 's17bones': if (verb === 'look') { await g.say('hero', 'look.s17bones'); return true; } break;
      case 's17stream': if (verb === 'look') { await g.say('hero', 'look.s17stream'); return true; } break;
      case 's17flames': if (verb === 'look') { await g.say('hero', 'look.s17flames'); return true; } break;
      case 's17bridge': if (verb === 'look') { await g.say('hero', 'look.s17bridge'); return true; } break;
    }
    return false;
  },

  async wab(g, id) {
    const e = g.ent(id), C = g.ent('coconut');
    if (id === 'hero') { await g.say('hero', 'wab.self'); return; }
    switch (id) {
      case 'bk': {   /* un garde de chez nous, qui s'assoit pour raconter sa vie : le pont est libre */
        const G = g.ent('guard17');
        await wabZap(g, e, () => { e.visible = false; G.visible = true; }, ['#ffd166', '#ffffff', '#c9a46a']); g.set('bkSat'); g.cinePos = { bk: g.headPos(G) };
        await g.say('bk', 'c17g.use.bk.1'); await g.say('narr', 'c17g.use.bk.narr'); await g.say('bk', 'c17g.use.bk.2'); g.cinePos = null; await g.say('hero', 'c17g.use.bk.3'); return;
      }
      case 'rabbit17': {   /* un dragon : pire */
        if (g.flag('rabbitFed')) break;
        await wabZap(g, e, () => { e.spr = 's2:p_dragon17'; }, ['#ff5d5d', '#ffffff', '#ffd166']); g.sfx('thunder', true);
        await g.say('hero', 'c17g.use.rabbit.1'); g.face(C.x); await g.say('coconut', 'c17g.use.rabbit.2');
        await sheoPops(g, 'c17g.use.rabbit.sheo');
        await zap(g, ...mid(g, e), { peak: () => { e.spr = 's2:rabbit17'; } }); g.chk(); await g.say('hero', 's17g.wk.back'); return;
      }
      case 's17flames': {   /* l'enchanteur voulait nous terrifier : des confettis */
        if (g.flag('flamesConf')) break;
        g.face(CRAG[0]); await zap(g, ...CRAG, { from: tip(g), peak: () => { g.set('flamesConf'); confetti(g, ...CRAG, 40); }, cols: ['#ff8fd8', '#ffd166', '#7dffb6', '#9ad8ff'] }); g.chk();
        await g.say('hero', 'c17g.wk.flames.1'); g.face(C.x); await g.say('coconut', 'c17g.wk.flames.2'); return;
      }
    }
    await wabZap(g, e, null); await g.say('hero', 'wab.none');
  },

  /* le Cri : il vole dans le torrent, en ressort aussitôt */
  async bath(g) {
    const B = g.ent('bk'), h = g.hero, x0 = B.x, y0 = B.y;
    await g.say('hero', 'c17g.fail.bk.1'); shout(g, ...mid(g, h), B.x > h.x ? 1 : -1); g.sfx('shout');
    const t0 = g.now; await g.until(() => { const u = Math.min(1, (g.now - t0) / 0.7); B.x = x0 + (70 - x0) * u; B.y = y0 + (176 - y0) * u; B.bob = Math.sin(u * Math.PI) * 40; return u >= 1; });
    B.visible = false; B.bob = 0; splash(g, 70, 176); await g.wait(700);
    Object.assign(B, { x: x0, y: y0 }); await zap(g, x0, y0 - 30, { peak: () => { B.visible = true; }, cols: ['#9ad8ff', '#ffffff'] }); g.chk();
    await g.say('bk', 'c17g.fail.bk.2');
  },

  /* une brioche : le monstre qu'on sait vaincre. Le lapin part avec ; la grotte s'éclaire */
  async feed(g) {
    const R = g.ent('rabbit17'), G = g.ent('grail17');
    g.drop('sweetroll'); twinkle(g, R.x, R.y - 10, '#ffd166'); await g.say('hero', 'c17g.use.rabbit.3');
    await zap(g, ...mid(g, R), { peak: () => { R.visible = false; }, cols: ['#ffffff', '#ffd166'] }); g.chk(); g.set('rabbitFed');
    G.visible = true; twinkle(g, G.x, G.y - 8, '#ffd166');
  },

  /* le Graal est un seau ; dedans, un stilton */
  async grail(g) {
    const G = g.ent('grail17'), C = g.ent('coconut');
    await g.walkTo(...CAVE); g.face(G.x); await g.say('hero', 'c17g.look.grail');
    twinkle(g, G.x, G.y - 8, '#ffd166'); g.sfx('pop'); G.visible = false; g.set('grailTaken');
    g.face(C.x); await g.say('coconut', 'c17g.gag.1'); await g.say('hero', 'c17g.gag.2'); g.give('cheese17g'); await g.say('hero', 'c17g.gag.3'); await g.say('coconut', 'c17g.gag.4');
    await g.say('hero', 'c17g.end.1'); await g.say('narr', 'c17g.end.2');
    await g.fade(1, 1200); nextChapter(g, 's2_17g');
  }
};
