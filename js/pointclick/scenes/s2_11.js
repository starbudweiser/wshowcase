/* Saison 2, chapitre 11 : le quai des pirates (combat d'insultes). Maquette jouable (27/11/2026) : décor vide FLUX, personnages
   en poses fixes détourées des fiches ; parole et marche LTX à venir. Coordonnées logiques 480 × 270 (décor 960 × 540).
   Déroulé : réveil -> biscuit au perroquet (il récite les réparties) -> duel d'insultes -> carte -> caisse à la croix : le fromage ->
   le capitaine fantôme le confisque -> Wabbajack sur le grog : bière de racine -> bière au fantôme : feu d'artifice -> Sheogorath. */
import { zap, fireworks } from '../engine/fx2.js';
import { HERO2 } from '../data/sheets_s2.js';
import { CHAPTERS2 } from './index.js';

const GAG = [['guybrush', 'c11.gag.1'], ['hero', 'c11.gag.2'], ['guybrush', 'c11.gag.3'], ['hero', 'c11.gag.4'], ['guybrush', 'c11.gag.5'], ['narr', 'c11.gag.6']];

export default {
  id: 's2_11', hd: true, bg: 's2/d_monkey.webp', music: 's2_11_pirates', amb: ['night', 0.35],
  persp: [160, 0.34, 270, 0.635], walkK: 1.9, blockR: [16, 6],
  walk: [[[24, 180], [150, 170], [200, 164], [320, 161], [332, 172], [436, 174], [440, 210], [480, 214], [480, 270], [133, 270], [131, 246], [70, 244], [62, 212], [24, 206]]],
  /* avant-plans : tonneau en bas à gauche, tonneau de droite, caisse en bas */
  fg: [
    { y: 268, polys: [[[0, 213], [12, 208], [46, 208], [57, 214], [57, 270], [0, 270]]] },
    { y: 206, polys: [[[441, 151], [452, 146], [476, 146], [480, 150], [480, 207], [442, 206]]] },
    { y: 270, polys: [[[75, 249], [124, 246], [126, 270], [75, 270]]] }
  ],
  start: { x: 132, y: 234, dir: 'r' },
  hot: [
    { id: 's11ship', rect: [0, 12, 88, 116] }, { id: 's11moon', rect: [200, 8, 250, 40] }, { id: 's11sea', rect: [90, 100, 320, 150] },
    { id: 's11tavern', rect: [372, 0, 480, 140], at: [420, 177] },
    { id: 's11barrel', rect: [0, 208, 57, 270], at: [72, 232], dir: 'l' },
    { id: 's11crate', rect: [75, 245, 126, 270], at: [144, 254], dir: 'l' }
  ],
  preload: ['s2:i_rootbeer'],
  ents: [
    { id: 'guybrush', spr: 's2:guybrush', x: 232, y: 212, hot: true, at: [196, 222] },
    { id: 'swordmaster', spr: 's2:swordmaster', x: 395, y: 188, hot: true, at: [356, 196], flip: true },
    { id: 'parrot', spr: 's2:parrot', x: 350, y: 103, scale: 0.3, hot: true, at: [345, 172], hit: [338, 80, 364, 106], solid: false },
    { id: 'statue', spr: 's2:i_statue', x: 201, y: 143, scale: 0.27, hot: true, at: [205, 168], solid: false },
    { id: 'grog', spr: 's2:i_grog', x: 461, y: 151, z: 60, scale: 0.29, hot: true, at: [430, 214], solid: false },
    { id: 'lechuck', spr: 's2:lechuck', x: 150, y: 206, hot: false, visible: false, float: 8, alpha: 0.88, at: [196, 214] },
    { id: 'sheo', spr: 's2:sheo', x: 300, y: 214, hot: false, visible: false }
  ],

  async enter(g, how) {
    const F = k => g.flag(k);
    if (F('grogTaken') || F('grogDone')) g.ents = g.ents.filter(e => e.id !== 'grog');
    else if (F('grogWab')) { const e = g.ent('grog'); e.id = 'rootbeer'; e.spr = 's2:i_rootbeer'; }
    if (F('ghostCame') && !F('ghostGone')) { const e = g.ent('lechuck'); e.visible = true; e.hot = true; }
    if (how.intro) g.fx.fade = { from: 1, to: 1, t0: g.now, ms: 0.01, a: 1 };   /* écran noir sous la vignette */
  },

  async intro(g) {
    await g.card('assets/pointclick/s2/cards/r_monkey.webp', g.T('ch.s2_11'));
    g.hero.front = true; await g.fade(0, 900);
    const guy = g.ent('guybrush');
    await g.say('guybrush', 'c11.wake.1'); g.face(guy.x); await g.say('hero', 'c11.wake.2'); await g.say('narr', 'c11.wake.3');
    await g.say('guybrush', 'c11.wake.4'); await g.say('hero', 'c11.wake.5');
  },

  /* centre d'un personnage ou d'un objet, pour l'éclair du Wabbajack */
  mid(g, e) { const r = g.entRect(e); return r ? [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2 - (e.float || 0)] : [e.x, e.y - 20]; },

  async on(g, verb, id, item) {
    const F = k => g.flag(k), e = g.ent(id);
    if (verb === 'use' && (item === 'wabbajack' || (id === 'wabbajack' && item))) { await g.cut(() => this.wab(g, item === 'wabbajack' ? id : item)); return true; }   /* Wabbajack sur X, ou X sur le Wabbajack */
    switch (id) {
      case 'guybrush':
        if (verb === 'talk') {
          if (!F('gagDone')) { g.set('gagDone'); for (const [w, k] of GAG) { if (k === 'c11.gag.4') { g.hero.back = false; g.face(g.hero.x - 40); } await g.say(w, k); if (k === 'c11.gag.4') g.face(e.x); } return true; }
          await g.say('guybrush', F('duelLost') && !F('learned') ? 'c11.duel.hint' : 'c11.wake.4'); return true;
        }
        if (verb === 'look') { await g.say('hero', 'c11.look.apprentice'); return true; }
        break;
      case 'swordmaster':
        if (verb === 'talk') {
          if (F('duelWon')) { await g.say('swordmaster', 'c11.duel.win'); return true; }
          if (!F('smMet')) { g.set('smMet'); await g.say('swordmaster', 'c11.sm.intro'); return true; }
          await g.cut(() => this.duel(g)); return true;
        }
        if (verb === 'use' && item === 'cracker') { await g.cut(async () => { g.shake(500, 2); await g.say('swordmaster', 'c11.sm.cracker'); await g.say('hero', 'c11.sm.cracker.hero'); }); return true; }
        break;
      case 'parrot':
        if (verb === 'talk') { await g.say('parrot', 'c11.parrot.talk'); return true; }
        if (verb === 'look') { await g.say('hero', 'c11.look.parrot'); return true; }
        if (verb === 'use' && item === 'cracker') {
          await g.cut(async () => { g.drop('cracker'); g.sfx('pop'); await g.say('parrot', 'c11.parrot.cracker'); await g.say('hero', 'c11.parrot.cracker.hero'); g.set('learned'); }); return true;
        }
        break;
      case 's11barrel':
        if (verb === 'take' || verb === 'use') {
          if (item) break;
          if (g.has('cracker')) { await g.say('hero', 'take.s11barrel.more'); return true; }
          g.sfx('pop'); g.give('cracker'); await g.say('hero', 'take.s11barrel'); return true;
        }
        break;
      case 's11crate':
        if ((verb === 'use' && (!item || item === 'map')) || verb === 'take') {
          if (F('crateOpen')) { await g.say('hero', 'def.take'); return true; }
          if (!g.has('map')) { await g.say('hero', 'use.s11crate'); return true; }
          await g.cut(() => this.crate(g)); return true;
        }
        break;
      case 'grog':
        if (verb === 'look') { await g.say('hero', 'c11.look.grog'); return true; }
        if (verb === 'take' || (verb === 'use' && !item)) { g.ents = g.ents.filter(x => x !== e); g.set('grogTaken'); g.sfx('pop'); g.give('grog'); return true; }
        break;
      case 'rootbeer':
        if (verb === 'take' || (verb === 'use' && !item)) { if (e) { g.ents = g.ents.filter(x => x !== e); g.set('grogDone'); g.sfx('pop'); g.give('rootbeer'); return true; } }
        break;
      case 'map':
        if (verb === 'look') { await g.say('hero', 'c11.look.map'); return true; }
        break;
      case 'lechuck':
        if (verb === 'talk') { await g.say('lechuck', 'c11.ghost.5'); return true; }
        if (verb === 'use' && item === 'rootbeer') { await g.cut(() => this.finale(g)); return true; }
        if (verb === 'use' && item === 'grog') { await g.say('hero', 'c11.look.grog'); return true; }
        break;
    }
    return false;
  },

  /* le Wabbajack sur n'importe quoi : éclair, puis métamorphose (souvent passagère) */
  async wab(g, id) {
    const h = g.hero, e = g.ent(id);
    if (id === 'hero') { await g.say('hero', 'wab.self'); return; }
    const at = e ? this.mid(g, e) : id === 'grog' || id === 'rootbeer' || g.has(id) ? [h.x, h.y - 40] : [h.x + (h.dir === 'l' ? -40 : 40), h.y - 50];
    if (e) g.face(e.x);
    await zap(g, ...at); g.chk();
    switch (id) {
      case 'grog':
        if (e) { e.id = 'rootbeer'; e.spr = 's2:i_rootbeer'; g.set('grogWab'); } else { g.drop('grog'); g.give('rootbeer'); }
        await g.say('hero', 'c11.wab.grog'); return;
      case 'lechuck': if (!e || !e.visible) break;
        e.visible = false; await g.say('hero', 'c11.wk.ghost'); await g.wait(500); await zap(g, ...at); e.visible = true; await g.say('hero', 's11.wk.ghost.back'); return;
      case 'guybrush': {
        const spr = e.spr, fl = e.flip; e.spr = h.x < e.x ? HERO2.ql : HERO2.qr; e.flip = false;
        await g.say('narr', 'c11.wk.apprentice'); await g.wait(700); await zap(g, ...this.mid(g, e)); e.spr = spr; e.flip = fl; return;
      }
      case 'parrot': g.shake(450, 3); await g.say('parrot', 'c11.wk.parrot'); await g.say('hero', 'c11.wk.parrot.hero'); return;
      case 'statue': e.visible = false; await g.say('guybrush', 'c11.wk.statue'); await g.wait(400); await zap(g, ...at); e.visible = true; await g.say('hero', 's11.wk.statue.back'); return;
    }
    await g.say('hero', 'wab.none');
  },

  /* duel d'insultes : chaque insulte ratée revient plus tard ; trois touches et c'est perdu ; sans le perroquet, le héros
     ne connaît que les répliques des gardes, et l'apprenti lui souffle la solution */
  async duel(g) {
    const sm = g.ent('swordmaster'), guy = g.ent('guybrush'); g.face(sm.x);
    await g.say('swordmaster', 'c11.duel.start');
    const q = [1, 2, 3]; let touch = 0, hinted = false;
    while (q.length) {
      const i = q.shift(), k = 'c11.duel.i' + i; await g.say('swordmaster', k);
      const opts = g.flag('learned') ? (Math.random() < 0.5 ? ['good', 'bad'] : ['bad', 'good']) : ['bad'];
      const pick = opts[await g.ask(opts.map(o => k + '.' + o))];
      await g.say('hero', k + '.' + pick);
      if (pick === 'good') { if (g.T.has(k + '.good.sm')) await g.say('swordmaster', k + '.good.sm'); continue; }
      g.sfx('clang'); g.shake(250, 2); await g.say('swordmaster', k + '.bad.sm'); touch++; q.push(i);
      if (touch >= 3) { await g.say('swordmaster', 'c11.duel.lose'); g.set('duelLost'); if (!g.flag('learned')) { g.face(guy.x); await g.say('guybrush', 'c11.duel.hint'); } return; }
      if (!g.flag('learned') && !hinted) { hinted = true; g.face(guy.x); await g.say('guybrush', 'c11.duel.hint'); g.face(sm.x); }
    }
    await g.say('swordmaster', 'c11.duel.win'); g.set('duelWon');
    await g.say('swordmaster', 'c11.duel.map'); g.sfx('pop'); g.give('map'); await g.say('hero', 'c11.duel.map.hero'); await g.say('narr', 'c11.duel.map.narr');
  },

  /* la caisse à la croix : le fromage de Hollande… aussitôt confisqué par le capitaine fantôme */
  async crate(g) {
    await g.say('hero', 'use.s11crate.map'); g.sfx('clang'); await g.wait(300); g.set('crateOpen'); g.sfx('pop'); g.give('cheese_nl'); await g.say('hero', 's11.crate.open');
    const L = g.ent('lechuck'), h = g.hero; L.x = 40; L.y = 150; L.alpha = 0; L.visible = true; L.rawSpeed = true; g.shake(600, 2); g.sfx('whoosh');
    const t0 = g.now; const fadeIn = g.until(() => { L.alpha = Math.min(0.88, (g.now - t0) * 0.6); return L.alpha >= 0.88; });
    g.face(L.x); await g.walkEnt('lechuck', Math.max(60, h.x - 70), Math.min(214, Math.max(186, h.y - 10)), 70); await fadeIn; g.face(L.x);
    await g.say('lechuck', 'c11.ghost.1'); await g.say('hero', 'c11.ghost.2'); await g.say('lechuck', 'c11.ghost.3'); await g.say('hero', 'c11.ghost.4');
    await g.say('lechuck', 'c11.ghost.5'); g.sfx('whoosh'); g.drop('cheese_nl'); L.hot = true; L.at = [Math.min(440, L.x + 46), Math.max(176, Math.min(262, L.y + 8))]; g.set('ghostCame');
    await g.say('narr', 'c11.ghost.narr'); await g.say('hero', 's11.ghost.cheese');
  },

  /* bière de racine au capitaine : feu d'artifice vert, le fromage revient, Sheogorath passe une tête */
  async finale(g) {
    const L = g.ent('lechuck'), h = g.hero; g.face(L.x); g.drop('rootbeer');
    await g.say('lechuck', 'c11.ghost.beer'); const [fx, fy] = this.mid(g, L);
    g.shake(500, 3); L.visible = false; L.hot = false; await fireworks(g, fx, fy - 10, 3); g.set('ghostGone');
    g.sfx('pop'); g.give('cheese_nl'); await g.say('hero', 'c11.ghost.beer.hero'); await g.say('narr', 'c11.ghost.beer.narr');
    const S = g.ent('sheo'); S.x = Math.max(70, Math.min(420, h.x + (h.x < 240 ? 80 : -80))); S.y = Math.max(190, Math.min(250, h.y)); S.flip = S.x > h.x;
    await zap(g, S.x, S.y - 45); S.visible = true; g.face(S.x); await g.say('sheo', 'c11.ghost.beer.sheo');
    await g.say('hero', 'c11.end.hero'); await g.say('narr', 'c11.end.narr');
    await g.fade(1, 1200); this.next(g);
  },
  next(g) {
    const i = CHAPTERS2.findIndex(c => c.id === 's2_11'), nx = CHAPTERS2.slice(i + 1).find(c => c.built && (!c.lang || c.lang === (g.lang === 'fr' ? 'fr' : 'en')));
    setTimeout(() => (nx ? g.goScene(nx.id, { intro: true }) : g.end('s2end')), 0);
  }
};
