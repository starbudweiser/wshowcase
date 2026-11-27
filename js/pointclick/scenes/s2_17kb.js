/* Saison 2, chapitre 17, version française (2/2) : la grotte du Graal, dans une clairière de Bretagne. Le chevalier gourmand ne passe
   pas, le roi envoie le héros ; au fond, le Graal… est un seau. Le roi l'échange contre un fromage de Bretagne.
   Coordonnées logiques 480 × 270 (décor 960 × 540). */
import { zap, twinkle } from '../engine/fx2.js';
import { wabZap, nextChapter, mid, tip } from './s2_common.js';

const MOUTH = [404, 152];

export default {
  id: 's2_17kb', hd: true, bg: 's2/d_cave17.webp', music: 's2_17_table_fr', amb: ['forest', 0.35], steps: 'dirt',
  persp: [152, 0.45, 268, 0.78], walkK: 1.9, blockR: [16, 6],
  light: { tint: '#fff4dc', k: 0.06, lamps: [{ x: 418, y: 132, r: 90, col: '#ffcf60', k: 0.5 }] },
  walk: [[[4, 188], [276, 188], [300, 172], [360, 158], [432, 152], [470, 166], [476, 268], [4, 268]]],
  start: { x: 192, y: 254, dir: 'r' },
  fx: {
    lights: [{ x: 420, y: 132, r: 30, col: '#ffcf60', a: 0.7, fl: 0, breathe: 1.2 }],
    flies: [{ rect: [10, 120, 300, 230], n: 7, col: '#fff3a0' }]
  },
  hot: [
    { id: 's17cave', rect: [362, 84, 436, 150], at: MOUTH, dir: 'r' }, { id: 's17boulder', rect: [120, 144, 272, 182], at: [196, 196] },
    { id: 's17trees', rect: [0, 0, 120, 150] }
  ],
  preload: ['s2:p_spoon17'],
  ents: [
    { id: 'arthur', spr: 's2:arthur', x: 110, y: 232, hot: true, at: [150, 248], name: 'n.arthur' },
    { id: 'perceval', spr: 's2:perceval', x: 36, y: 244, hot: true, at: [76, 258], name: 'n.perceval' },
    { id: 'karadoc', spr: 's2:karadoc', x: 344, y: 184, hot: true, at: [312, 200], name: 'n.karadoc' },
    { id: 'sword17', spr: 's2:p_sword17', x: 236, y: 226, scale: 0.75, hot: true, at: [196, 238], block: [22, 5], name: 'n.sword17' },
    { id: 'grail17', spr: 's2:p_grail17', x: 420, y: 146, scale: 0.36, noShadow: true, noLight: true, hot: true, solid: false, at: MOUTH, name: 'n.grail17', aura: { col: '#ffd166', r: 0.9, a: 0.45, wisps: 4 } },
    { id: 'sheo', spr: 's2:sheo', x: 300, y: 240, hot: false, visible: false, aura: { col: '#c77dff', r: 0.6, a: 0.35, wisps: 3 } }
  ],

  async enter(g, how) {
    this.fx.lights[0].off = false;
    if (g.flag('swordEaten')) g.ent('sword17').visible = false; else if (g.flag('spoon')) g.ent('sword17').spr = 's2:p_spoon17';
    if (how.intro) g.fx.fade = { from: 1, to: 1, t0: g.now, ms: 0.01, a: 1 };
  },
  async intro(g) {
    await g.fade(0, 900); const K = g.ent('karadoc'), A = g.ent('arthur');
    g.face(MOUTH[0]); await g.say('hero', 'c17k.look.cave'); g.face(K.x); await g.say('karadoc', 'c17k.cave.1'); g.face(A.x); await g.say('arthur', 'c17k.cave.2');
  },

  async on(g, verb, id, item) {
    const F = k => g.flag(k), e = g.ent(id);
    if (verb === 'use' && (item === 'wabbajack' || (id === 'wabbajack' && item))) { await g.cut(() => this.wab(g, item === 'wabbajack' ? id : item)); return true; }
    switch (id) {
      case 'arthur': if (verb === 'look') { await g.say('hero', 'c17k.look.king'); return true; } if (verb === 'talk') { await g.say('arthur', 'c17k.cave.2'); return true; } break;
      case 'perceval': if (verb === 'look') { await g.say('hero', 'c17k.look.slow'); return true; } if (verb === 'talk') { await g.say('perceval', 'c17k.talk.slow.1'); return true; } break;
      case 'karadoc': if (verb === 'look') { await g.say('hero', 'c17k.look.greedy'); return true; } if (verb === 'talk') { await g.say('karadoc', 'c17k.cave.1'); return true; } break;
      case 'sword17':
        if (verb === 'look') { await g.say('hero', F('spoon') ? 'look.s17spoon' : 'c17k.look.sword'); return true; }
        if (verb === 'take' || (verb === 'use' && !item)) { await g.say('hero', F('spoon') ? 's17.spoon.take' : 's17.sword.take'); return true; }
        break;
      case 's17cave': if (verb === 'look') { await g.say('hero', 'c17k.look.cave'); return true; } if (verb === 'use' || verb === 'walk') { await g.cut(() => this.grail(g)); return true; } break;
      case 'grail17':
        if (verb === 'look') { await g.say('hero', 'c17k.look.grail'); return true; }
        if (verb === 'take' || (verb === 'use' && !item)) { await g.cut(() => this.grail(g)); return true; }
        break;
      case 's17boulder': if (verb === 'look') { await g.say('hero', 'look.s17boulder'); return true; } break;
      case 's17trees': if (verb === 'look') { await g.say('hero', 'look.s17trees'); return true; } break;
    }
    return false;
  },

  async wab(g, id) {
    const e = g.ent(id), K = g.ent('karadoc'), A = g.ent('arthur');
    if (id === 'hero') { await g.say('hero', 'wab.self'); return; }
    if (id === 'sword17' && !g.flag('spoon')) {   /* une cuillère dans une meule ; le chevalier gourmand la « retire » */
      await wabZap(g, e, () => { e.spr = 's2:p_spoon17'; }, ['#ffd166', '#ffffff', '#c9a46a']); g.set('spoon'); await g.say('hero', 'c17k.wk.sword.1');
      g.face(K.x); await g.say('karadoc', 'c17k.wk.sword.2'); twinkle(g, ...mid(g, e), '#ffd166'); e.visible = false; g.set('swordEaten');
      g.face(A.x); await g.say('arthur', 'c17k.wk.sword.3'); return;
    }
    await wabZap(g, e, null); await g.say('hero', 'wab.none');
  },

  /* au fond de la grotte : le Graal est un seau. Troc contre un fromage de Bretagne */
  async grail(g) {
    const G = g.ent('grail17'), A = g.ent('arthur'), K = g.ent('karadoc'), P = g.ent('perceval'), h = g.hero;
    await g.walkTo(...MOUTH); g.face(G.x); await g.say('hero', 'c17k.look.grail');
    twinkle(g, G.x, G.y - 10, '#ffd166'); g.sfx('pop'); G.visible = false; this.fx.lights[0].off = true; g.give('grail17');
    await g.walkTo(250, 236); g.face(A.x);
    await g.say('arthur', 'c17k.gag.1'); await g.say('hero', 'c17k.gag.2'); await g.say('perceval', 'c17k.gag.3'); g.face(K.x); await g.say('karadoc', 'c17k.gag.4');
    g.face(A.x); await g.say('arthur', 'c17k.trade.1'); g.drop('grail17'); twinkle(g, A.x, A.y - 60, '#ffd166'); g.sfx('pop'); g.give('cheese17k');
    await g.say('hero', 'c17k.trade.2'); await g.say('arthur', 'c17k.trade.3'); g.face(K.x); await g.say('karadoc', 'c17k.trade.4'); g.face(P.x); await g.say('perceval', 'c17k.trade.5');
    await g.say('narr', 'c17k.trade.narr'); await g.say('hero', 'c17k.end.1'); await g.say('narr', 'c17k.end.2');
    await g.fade(1, 1200); nextChapter(g, 's2_17k');
  }
};
