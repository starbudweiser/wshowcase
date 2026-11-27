/* Saison 2, chapitre 21 (1/2) : le mur des mots. Un salon des années 80 ; l'alphabet peint sur le papier peint, une ampoule par lettre
   (dessinés par le moteur : lettres justes et mots dans la langue du jeu). Les ampoules épellent un mot de pouvoir, puis « FRIGO » ;
   une créature sort du mur (jonquille sous Wabbajack) ; la fille aux pouvoirs, nourrie d'une brioche, soulève le frigo par la pensée :
   la meule était dessous. L'escalier mène au sous-sol (s2_21b). Coordonnées logiques 480 × 270 (décor 960 × 540). */
import { zap, twinkle } from '../engine/fx2.js';
import { wabZap, wabSwap, sheoPops, nextChapter, mid, tip } from './s2_common.js';

/* alphabet du mur : trois rangées comme dans la série (A-H, I-Q, R-Z) */
const ROWS = ['ABCDEFGH', 'IJKLMNOPQ', 'RSTUVWXYZ'];
const WALL = { x0: 198, x1: 356, y0: 30, dy: 28 };   /* zone du papier peint (réglée sur le décor) */
const BULB = ['#ff4d4d', '#ffd23d', '#4dd2ff', '#7dff6a', '#ff8fd8', '#ff9a3c'];
const WORDS = { fr: ['COURS', 'FRIGO', 'SHEOGORATH ETAIT LA'], en: ['RUN', 'FRIDGE', 'SHEOGORATH WAS HERE'] };
const FRIDGE = [44, 264];

function letterPos(ch) {
  for (let r = 0; r < ROWS.length; r++) { const i = ROWS[r].indexOf(ch); if (i >= 0) { const n = ROWS[r].length, w = (WALL.x1 - WALL.x0) / n; return [WALL.x0 + w * (i + 0.5), WALL.y0 + r * WALL.dy, r * 9 + i]; } }
  return null;
}

export default {
  id: 's2_21', hd: true, bg: 's2/d_living.webp', music: 's2_21_annees80', amb: ['house', 0.2], steps: 'wood',
  persp: [184, 0.55, 268, 0.85], walkK: 1.9, blockR: [16, 6],
  light: { tint: '#ffd8a8', k: 0.12, lamps: [{ x: 104, y: 72, r: 130, col: '#ffcf80', k: 0.5 }] },
  walk: [[[194, 184], [366, 184], [374, 226], [440, 228], [440, 268], [4, 268], [4, 262], [262, 262], [262, 210], [194, 200]]],
  start: { x: 300, y: 254, dir: 'r' },
  fx: { lights: [] },
  hot: [
    { id: 's21wall', rect: [WALL.x0 - 8, WALL.y0 - 16, WALL.x1 + 8, WALL.y0 + 2 * WALL.dy + 12], at: [260, 206] },
    { id: 's21stairs', rect: [452, 110, 480, 268], at: [432, 248], dir: 'r' }, { id: 's21tv', rect: [366, 130, 446, 220], at: [360, 232] }, { id: 's21sofa', rect: [0, 115, 185, 230] }
  ],
  preload: ['s2:p_daffodil21', 's2:p_wafflesrolls21'],
  ents: [
    { id: 'fridge21', spr: 's2:p_fridge21', x: FRIDGE[0], y: FRIDGE[1], hot: true, at: [104, 262], block: [26, 6], name: 'n.fridge21' },
    { id: 'cheese21', spr: 's2:i_cheese21', x: FRIDGE[0], y: FRIDGE[1], scale: 0.32, noShadow: true, hot: false, solid: false, visible: false },
    { id: 'waffles21', spr: 's2:p_waffles21', x: 236, y: 196, scale: 0.2, noShadow: true, hot: true, solid: false, at: [270, 214], name: 'n.waffles21' },
    { id: 'walkie21', spr: 's2:p_walkie21', x: 212, y: 190, scale: 0.12, noShadow: true, hot: true, solid: false, at: [268, 216], name: 'n.walkie21' },
    { id: 'kid', spr: 's2:kid', x: 432, y: 260, hot: true, at: [388, 258], flip: true, name: 'n.kid' },
    { id: 'girl', spr: 's2:girl', x: 398, y: 232, hot: true, at: [356, 244], flip: true, name: 'n.girl' },
    { id: 'flower', spr: 's2:flower', x: 286, y: 192, hot: true, at: [262, 236], visible: false, name: 'n.flower' },
    { id: 'sheo', spr: 's2:sheo', x: 300, y: 240, hot: false, visible: false, aura: { col: '#c77dff', r: 0.6, a: 0.35, wisps: 3 } }
  ],

  async enter(g, how) {
    const F = k => g.flag(k);
    if (F('lights') && !F('daffodil')) g.ent('flower').visible = true;
    if (F('daffodil')) Object.assign(g.ent('flower'), { visible: true, spr: 's2:p_daffodil21', name: 'n.daffodil21', scale: 0.55 });
    if (F('wafflesRolls')) g.ent('waffles21').spr = 's2:p_wafflesrolls21';
    if (F('lifted')) Object.assign(g.ent('fridge21'), { bob: 64, block: null });
    this.lit = []; this.seq = null; this.float = false;
    if (how.back) { Object.assign(g.hero, { x: 430, y: 248, dir: 'l' }); g.fade(0, 600); }   /* retour du sous-sol */
    if (how.intro) g.fx.fade = { from: 1, to: 1, t0: g.now, ms: 0.01, a: 1 };
  },
  /* l'alphabet peint et sa guirlande, sur le papier peint, derrière les acteurs */
  drawBack(g, c) {
    const t = g.now; c.save();
    for (let r = 0; r < ROWS.length; r++) {
      const n = ROWS[r].length, w = (WALL.x1 - WALL.x0) / n, yb = WALL.y0 + r * WALL.dy - 14;
      c.strokeStyle = 'rgba(30,24,18,.8)'; c.lineWidth = 0.6; c.beginPath();   /* fil de la guirlande, qui pend entre les ampoules */
      for (let i = 0; i <= n; i++) { const x = WALL.x0 + w * i, y = yb + (i % 2 ? 2.2 : 0); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
      for (let i = 0; i < n; i++) {
        const ch = ROWS[r][i], x = WALL.x0 + w * (i + 0.5), y = WALL.y0 + r * WALL.dy, k = r * 9 + i;
        c.save(); c.translate(x, y + 6); c.rotate(Math.sin(k * 7.3) * 0.08); c.font = 'bold 15px "Arial Black", Impact, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.globalAlpha = 0.82; c.fillStyle = '#1c1612'; c.fillText(ch, 0, 0); c.globalAlpha = 0.25; c.fillText(ch, 0.6, 0.5); c.restore();   /* peinture noire un peu irrégulière */
        const on = (this.lit || []).includes(ch) || (this.flick && Math.sin(t * 13 + k * 3.1) > 0.97), col = BULB[k % BULB.length];
        c.globalAlpha = on ? 1 : 0.55; c.fillStyle = col; c.beginPath(); c.arc(x, yb + 3.5, 1.8, 0, Math.PI * 2); c.fill();
        if (on) { c.globalCompositeOperation = 'lighter'; const gr = c.createRadialGradient(x, yb + 3.5, 0, x, yb + 3.5, 14); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = 0.85; c.fillStyle = gr; c.fillRect(x - 14, yb - 10, 28, 28); c.globalCompositeOperation = 'source-over'; }
      }
    }
    c.restore();
  },
  /* les ampoules épellent un mot, lettre par lettre */
  async spell(g, word) {
    for (const ch of word) { if (ch === ' ') { await g.wait(500); continue; } this.lit = [ch]; g.sfx('click'); await g.wait(520); this.lit = []; await g.wait(120); }
  },
  tick(g) { if (this.float || g.flag('lifted')) { const Fr = g.ent('fridge21'); if (Fr) Fr.bob = 64 + Math.sin(g.now * 1.8) * 2.5; } },
  async intro(g) {
    g.hero.front = true;
    await g.card('assets/pointclick/s2/cards/r_stranger.webp', g.T('ch.s2_21'));
    const K = g.ent('kid'); g.face(K.x);
    await g.say('kid', 'c21.wake.1'); await g.say('hero', 'c21.wake.2'); await g.say('narr', 'c21.wake.3');
    this.flick = true; await g.say('kid', 'c21.wake.4'); this.flick = false; await g.say('hero', 'c21.wake.5');
  },

  async on(g, verb, id, item) {
    const F = k => g.flag(k), e = g.ent(id), W = WORDS[g.lang === 'fr' ? 'fr' : 'en'];
    if (verb === 'use' && (item === 'wabbajack' || (id === 'wabbajack' && item))) { await g.cut(() => this.wab(g, item === 'wabbajack' ? id : item)); return true; }
    switch (id) {
      case 's21wall':
        if (verb === 'look') {
          if (F('lights')) { await g.say('hero', 'c21.look.wall'); return true; }
          await g.cut(async () => {
            await g.say('hero', 'c21.look.wall'); g.face(260); await this.spell(g, W[0]); await g.say('hero', 'c21.lights.1');
            await this.spell(g, W[1]); await g.say('hero', 'c21.lights.2'); await g.say('narr', 'c21.lights.narr'); g.set('lights');
            await this.flowerOut(g);
          }); return true;
        }
        break;
      case 'kid':
        if (verb === 'look') { await g.say('hero', 'c21.look.walkie'); return true; }
        if (verb === 'talk') { await g.say('kid', 'c21.talk.kid.1'); await g.say('hero', 'c21.talk.kid.2'); await g.say('kid', 'c21.talk.kid.3'); return true; }
        break;
      case 'girl':
        if (verb === 'look') { await g.say('hero', 'c21.look.girl'); return true; }
        if (verb === 'talk') { await g.say('girl', 'c21.talk.girl.1'); await g.say('hero', 'c21.talk.girl.2'); await g.say('girl', 'c21.talk.girl.3'); await g.say('hero', 'c21.talk.girl.4'); return true; }
        if (verb === 'use' && item === 'sweetroll') {
          if (F('lights') && !F('daffodil')) { await g.say('hero', 's21.monster.first'); return true; }
          await g.cut(() => this.lift(g)); return true;
        }
        break;
      case 'flower':
        if (verb === 'look') { await g.say('hero', F('daffodil') ? 'look.daffodil21' : 'c21.flower.hero'); return true; }
        if (verb === 'use' && item === 'sweetroll' && !F('daffodil')) { await g.say('flower', 'c21.use.sweetroll.flower'); await g.say('hero', 'c21.use.sweetroll.flower.hero'); return true; }
        break;
      case 'fridge21':
        if (verb === 'look') { await g.say('hero', 'c21.look.fridge'); return true; }
        if ((verb === 'use' || verb === 'take') && !item) { await g.say('hero', 's21.fridge.heavy'); return true; }
        if (verb === 'use' && item === 'shout') {   /* le Cri « Frigo » : il refroidit d'un cran */
          await g.cut(async () => { g.face(e.x); await g.say('hero', 'c21.use.shout.fridge'); for (let i = 0; i < 8; i++) twinkle(g, e.x + (Math.random() - 0.5) * 40, e.y - 20 - Math.random() * 30, '#dff2ff'); g.sfx('shout'); await g.say('hero', 'c21.use.shout.fridge.2'); }); return true;
        }
        break;
      case 'waffles21': if (verb === 'look') { await g.say('hero', 'c21.look.waffles'); return true; } break;
      case 'walkie21': if (verb === 'look') { await g.say('hero', 'c21.look.walkie'); return true; } break;
      case 's21stairs':
        if (verb === 'look') { await g.say('hero', 'look.s21stairs'); return true; }
        if (verb === 'use' || verb === 'walk') { await g.fade(1, 600); setTimeout(() => g.goScene('s2_21b', { intro: true }), 0); return true; }
        break;
      case 's21tv': if (verb === 'look') { await g.say('hero', 'look.s21tv'); return true; } break;
      case 's21sofa': if (verb === 'look') { await g.say('hero', 'look.s21sofa'); return true; } break;
    }
    return false;
  },

  /* la créature sort du mur, qui s'ouvre */
  async flowerOut(g) {
    const Fl = g.ent('flower'), K = g.ent('kid'); this.flick = true;
    await zap(g, Fl.x, Fl.y - 40, { peak: () => { Fl.visible = true; }, cols: ['#ff3b3b', '#2a0f1a', '#ffffff'] }); g.chk(); g.sfx('thunder');
    await g.say('flower', 'c21.flower.1'); g.face(K.x); await g.say('kid', 'c21.flower.kid'); g.face(Fl.x); await g.say('hero', 'c21.flower.hero'); this.flick = false;
  },
  /* une brioche, et la fille soulève le frigo par la pensée */
  async lift(g) {
    const Gi = g.ent('girl'), Fr = g.ent('fridge21'), C = g.ent('cheese21'); g.face(Gi.x);
    await g.say('hero', 'c21.use.sweetroll.girl'); await g.say('girl', 'c21.use.sweetroll.girl.2'); await g.say('hero', 'c21.use.sweetroll.girl.3');
    g.drop('sweetroll'); twinkle(g, Gi.x, Gi.y - 70, '#ffd166'); await g.say('girl', 'c21.use.sweetroll.girl.4'); await g.say('hero', 'c21.use.sweetroll.girl.5');
    await g.say('girl', 'c21.lift.1'); Gi.aura = { col: '#9ad8ff', r: 0.7, a: 0.45, wisps: 6 }; this.flick = true;
    const t0 = g.now; await g.until(() => { const u = Math.min(1, (g.now - t0) / 1.6); Fr.bob = 64 * u + Math.sin(g.now * 40) * 1.5; return u >= 1; });
    C.visible = true; Fr.block = null; this.float = true;   /* le frigo reste suspendu au-dessus de la meule */ Gi.aura = null; this.flick = false; g.set('lifted');
    await g.say('narr', 'c21.lift.narr'); twinkle(g, C.x, C.y - 6, '#ffd166'); g.sfx('pop'); C.visible = false; g.give('cheese21'); await g.say('hero', 'c21.lift.hero');
    g.face(Gi.x); await g.say('girl', 'c21.end.girl'); await g.say('hero', 'c21.end.girl.hero'); await g.say('hero', 'c21.end.hero'); await g.say('narr', 'c21.end.narr');
    await g.fade(1, 1200); nextChapter(g, 's2_21');
  },

  async wab(g, id) {
    const e = g.ent(id), K = g.ent('kid'), Gi = g.ent('girl'), W = WORDS[g.lang === 'fr' ? 'fr' : 'en'];
    if (id === 'hero') { await g.say('hero', 'wab.self'); return; }
    switch (id) {
      case 'flower': {   /* une jonquille géante */
        if (g.flag('daffodil')) break;
        await wabZap(g, e, () => { e.spr = 's2:p_daffodil21'; e.name = 'n.daffodil21'; e.scale = 0.55; }, ['#ffd23d', '#ffffff', '#7dff6a']); g.set('daffodil');
        await g.say('hero', 'c21.use.wab.flower'); g.face(Gi.x); await g.say('girl', 'c21.use.wab.flower.girl'); return;
      }
      case 'waffles21': {   /* la boîte de gaufres pleine de brioches */
        if (g.flag('wafflesRolls')) break;
        await wabZap(g, e, () => { e.spr = 's2:p_wafflesrolls21'; }, ['#ffd166', '#ffffff']); g.set('wafflesRolls');
        await g.say('hero', 'c21.wk.waffles'); g.face(Gi.x); await g.say('girl', 'c21.wk.waffles.girl'); return;
      }
      case 'walkie21': case 'kid': {   /* la radio de chez nous et ses trois chansons */
        await wabZap(g, g.ent('walkie21'), null, ['#9ad8ff', '#ffffff']); const tw = setInterval(() => { if (!g.alive) return clearInterval(tw); twinkle(g, 300 + (Math.random() - 0.5) * 20, 180 - Math.random() * 20, '#ffd166'); }, 250);
        await g.say('kid', 'c21.wk.walkie'); await g.say('hero', 'c21.wk.walkie.hero'); clearInterval(tw); return;
      }
      case 's21wall': {   /* la guirlande signe « SHEOGORATH ÉTAIT LÀ » */
        g.face(260); await zap(g, 260, 60, { from: tip(g), cols: ['#c77dff', '#ffd166', '#ffffff'] }); g.chk();
        await this.spell(g, W[2]); await g.say('hero', 'c21.wk.lights'); await sheoPops(g, 'c21.wk.lights.sheo'); return;
      }
    }
    await wabZap(g, e, null); await g.say('hero', 'wab.none');
  }
};
