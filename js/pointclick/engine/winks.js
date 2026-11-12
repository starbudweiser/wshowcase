/* Clins d'œil aléatoires : petites scènes animées (personnages qui traversent, poursuites, apparitions) avec dialogues doublés, puis commentaire du narrateur.
   Une scénette = des acteurs (entités temporaires) qui suivent des points de passage [temps, x, y, pose?], des répliques à date fixe, des bruitages. */
import { snd } from './sound.js';
const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };

/* points de passage : [t, x, y] ; `pose` : [t, nom de sprite] ; `bob` : rebond (saut) ; `scale` : échelle absolue ; `z` : profondeur */
const V = {
  indy: { dur: 11, cast: [
    { id: 'ex', spr: 'wk.explorer', wp: [[0.2, -40, 256], [6.5, 520, 256]] },
    { id: 'bo', spr: 'wk.boulder', wp: [[1.4, -90, 250], [8.2, 560, 250]], spin: 1 }], lines: [[2.4, 'ex', 'wink.indy.ex'], [7, 'hero', 'wink.indy.h']], sfx: [[0.6, 'rumble']], shake: [[1, 6500, 1.2]], after: 'wink.indy.n' },
  ghostb: { dur: 14, cast: [
    { id: 'gh', fly: true, spr: 'wk.ghost', wp: [[0.2, 520, 150], [3, 380, 120], [6, 250, 150], [9, 100, 110], [11, -50, 130]], bob: 4, dir: -1 },
    { id: 'b1', spr: 'wk.buster', wp: [[1, 540, 256], [4, 330, 256], [8.4, 330, 256], [12.6, -50, 256]], dir: -1 },
    { id: 'b2', spr: 'wk.buster', wp: [[1.6, 590, 258], [4.6, 380, 258], [8.8, 380, 258], [13.2, -50, 258]], dir: -1 }], lines: [[4.2, 'b1', 'wink.ghostb.bu'], [5.6, 'b2', 'wink.ghostb.bu2'], [7, 'b1', 'wink.ghostb.bu3'], [7.8, 'b2', 'wink.ghostb.bu4']], sfx: [[2.8, 'ghost']], after: 'wink.ghostb.n' },
  racer: { fly: true, ext: true, dur: 7, cast: [{ id: 'ra', spr: 'wk.racer', wp: [[0.2, 530, 50], [2.5, 330, 80], [5, 120, 66], [6.6, -60, 90]], bob: 3, dir: -1 }], sfx: [[1.4, 'screech']], after: 'wink.racer.n' },
  tentacle: { dur: 13, cast: [{ id: 'te', spr: 'wk.tentacle', wp: [[0.2, 540, 256], [3.4, 300, 256], [8.4, 300, 256], [11.8, -60, 256]], hop: 14, dir: -1 }], lines: [[4, 'te', 'wink.tentacle.te'], [5.8, 'te', 'wink.tentacle.te2'], [9, 'hero', 'wink.tentacle.h']], sfx: [[3.6, 'pop']], after: 'wink.tentacle.n' },
  owl: { fly: true, ext: true, dur: 10, cast: [{ id: 'ow', spr: 'wk.owl', wp: [[0.2, -50, 70], [3.6, 230, 78], [6.4, 230, 78], [9.8, 540, 70]], bob: 3, poses: [[3.7, 'wk.owl.f'], [6.3, 'wk.owl']] }], sfx: [[3.7, 'owl']], after: 'wink.owl.n' },
  goonies: { dur: 9, cast: [{ id: 'ki', spr: 'wk.kids', wp: [[0.2, -60, 258], [3.5, 250, 258], [4.5, 250, 258], [7.8, 560, 258]] }], lines: [[3.6, 'ki', 'wink.goonies.ki']], after: 'wink.goonies.n' },
  conan: { dur: 20, cast: [{ id: 'ba', spr: 'wk.barbarian', wp: [[0.2, -60, 256], [4, 240, 256], [15, 240, 256], [18.6, 560, 256]] }], lines: [[4.4, 'ba', 'wink.conan.ba'], [5.6, 'ba', 'wink.conan.ba2'], [7.4, 'ba', 'wink.conan.ba3'], [9.6, 'ba', 'wink.conan.ba4']], after: 'wink.conan.n' },
  lotr: { ext: true, dur: 15, cast: [
    { id: 'wi', spr: 'wk.wizard', wp: [[0.2, -60, 256], [4.5, 260, 256], [9.5, 260, 256], [13.5, 560, 256]] },
    { id: 'ha', spr: 'wk.halfling', wp: [[8.4, -60, 258], [11.2, 150, 258], [13.4, 150, 258], [14.6, 560, 258]] }], lines: [[5, 'wi', 'wink.lotr.wi'], [10, 'ha', 'wink.lotr.ha']], after: 'wink.lotr.n' },
  macgyver: { dur: 16, cast: [{ id: 'ma', spr: 'wk.handyman', wp: [[0.2, 540, 256], [3.6, 300, 256], [11.6, 300, 256], [14.6, -60, 256]], dir: -1 }], lines: [[4, 'ma', 'wink.macgyver.ma'], [5.6, 'ma', 'wink.macgyver.ma2'], [7.4, 'ma', 'wink.macgyver.ma3'], [10.2, 'ma', 'wink.macgyver.ma4']], sfx: [[8.4, 'click'], [8.8, 'click'], [9.2, 'click'], [9.6, 'boom']], shake: [[9.6, 500, 4]], puff: [[9.6, 300, 230]], after: 'wink.macgyver.n' },
  simon: { dur: 13, cast: [{ id: 'si', spr: 'wk.simon', wp: [[0.2, -50, 258], [12, 540, 258]] }], lines: [[2.2, 'si', 'wink.simon.si'], [5.4, 'si', 'wink.simon.si2']], after: 'wink.simon.n' },
  monkey: { far: false, dur: 12, cast: [{ id: 'pi', spr: 'wk.pirate', wp: [[0.2, 540, 258], [3.6, 'hx+70', 258], [9.4, 'hx+70', 258], [11.4, 560, 258]], dir: -1 }], lines: [[4.2, 'pi', 'wink.monkey.pi'], [7, 'hero', 'wink.monkey.h'], [9.6, 'pi', 'wink.monkey.pi2']], after: 'wink.monkey.n' },
  kings: { dur: 12, cast: [{ id: 'gr', spr: 'wk.graham', wp: [[0.2, 540, 256], [4, 300, 256], [8, 300, 256], [11, -60, 256]], dir: -1 }], lines: [[4.6, 'gr', 'wink.kings.gr']], after: 'wink.kings.n' },
  twin: { dur: 15, cast: [{ id: 'ag', spr: 'wk.agent', wp: [[0.2, -60, 256], [4, 250, 256], [11.4, 250, 256], [14, 560, 256]] }], lines: [[4.5, 'ag', 'wink.twin.ag'], [6.4, 'ag', 'wink.twin.ag2'], [8.4, 'ag', 'wink.twin.ag3']], after: 'wink.twin.n' },
  trollb: { far: false, only: ['rue'], dur: 9, cast: [{ id: 'tr', spr: 'wk.troll', wp: [[0.2, 372, 205], [8.5, 372, 205]], z: -60, rise: [0.4, 2.2, 6.8, 8.4, 14], bounce: 1 }], lines: [[2.8, 'tr', 'wink.trollb.tr']], after: 'wink.trollb.n' },
  oblivion: { far: false, only: ['mill'], dur: 9, horse: true, lines: [[1.4, 'horse', 'wink.oblivion.ho']], after: 'wink.oblivion.n' },
  kaamtable: { dur: 16.0, cast: [
    { id: 'ar', spr: 'wk.arthur', wp: [[0.2, -60, 256], [3.6, 300, 256], [11.4, 300, 256], [14.8, 580, 256]] },
    { id: 'pe', spr: 'wk.perceval', wp: [[0.6, -60, 258], [4.0, 240, 258], [11.8, 240, 258], [15.2, 580, 258]] },
    { id: 'ka', spr: 'wk.karadoc', wp: [[1.0, -60, 257], [4.4, 180, 257], [12.2, 180, 257], [15.6, 580, 257]] }], lines: [[4.0, 'ar', 'wink.kaamtable.ar'], [5.8, 'pe', 'wink.kaamtable.pe'], [7.2, 'ka', 'wink.kaamtable.ka'], [8.8, 'ar', 'wink.kaamtable.ar2'], [10.2, 'pe', 'wink.kaamtable.pe2']], after: 'wink.kaamtable.n' },
  kaamgraal: { dur: 13.8, cast: [
    { id: 'la', spr: 'wk.lancelot', wp: [[0.2, -60, 256], [3.6, 290, 256], [9.6, 290, 256], [13.0, 580, 256]] },
    { id: 'me', spr: 'wk.merlin', wp: [[1.0, -60, 258], [4.4, 220, 258], [10.0, 220, 258], [13.4, 580, 258]] }], lines: [[4.0, 'la', 'wink.kaamgraal.la'], [5.6, 'me', 'wink.kaamgraal.me'], [7.4, 'me', 'wink.kaamgraal.me2']], sfx: [[8.6, 'boom']], shake: [[8.6, 400, 3]], puff: [[8.6, 220, 232]], after: 'wink.kaamgraal.n' },
  kaamcour: { dur: 17.4, cast: [
    { id: 'le', spr: 'wk.leodagan', wp: [[0.2, -60, 256], [3.6, 320, 256], [12.4, 320, 256], [15.8, 580, 256]] },
    { id: 'se', spr: 'wk.seli', wp: [[0.6, -60, 258], [4.0, 265, 258], [12.8, 265, 258], [16.2, 580, 258]] },
    { id: 'gu', spr: 'wk.guenievre', wp: [[1.0, -60, 257], [4.4, 215, 257], [13.2, 215, 257], [16.6, 580, 257]] },
    { id: 'mv', spr: 'wk.mevanwi', wp: [[1.4, -60, 259], [4.8, 165, 259], [13.6, 165, 259], [17.0, 580, 259]] }], lines: [[4.6, 'se', 'wink.kaamcour.se'], [6.0, 'le', 'wink.kaamcour.le'], [7.0, 'gu', 'wink.kaamcour.gu'], [8.4, 'mv', 'wink.kaamcour.mv'], [10.2, 'le', 'wink.kaamcour.le2']], after: 'wink.kaamcour.n' },
  kaampaysans: { dur: 15.4, cast: [
    { id: 'gt', spr: 'wk.guethenoc', wp: [[0.2, -60, 256], [3.6, 300, 256], [10.8, 300, 256], [14.2, 580, 256]] },
    { id: 'ro', spr: 'wk.roparzh', wp: [[0.5, -60, 258], [3.9, 250, 258], [11.2, 250, 258], [14.6, 580, 258]] },
    { id: 'ta', spr: 'wk.tavernier', wp: [[1.6, -60, 257], [5.0, 190, 257], [11.6, 190, 257], [15.0, 580, 257]] }], lines: [[3.9, 'gt', 'wink.kaampaysans.gt'], [5.2, 'ro', 'wink.kaampaysans.ro'], [7.0, 'ta', 'wink.kaampaysans.ta'], [9.0, 'ro', 'wink.kaampaysans.ro2']], after: 'wink.kaampaysans.n' },
  dexter: { dur: 0, after: 'wink.dexter' }
};
const IDS = Object.keys(V);
/* voies d'arrière-plan : chemins réels du décor (gauche -> droite) où les figurants lointains marchent, à l'échelle de leur profondeur */
const LANES = {
  rue: [[250, 150], [300, 158], [350, 172], [400, 180], [440, 190], [480, 200]], mill: [[120, 188], [170, 186], [220, 190], [270, 196], [310, 200]],
  meadow: [[330, 185], [350, 172], [372, 160], [392, 138], [420, 112]], market: [[200, 205], [260, 190], [320, 178], [345, 170], [360, 165]],
  gate: [[200, 84], [240, 84], [280, 84], [320, 84]], house: [[110, 212], [200, 210], [300, 210], [380, 212]], ford: [[165, 112], [220, 106], [300, 104], [370, 108], [390, 114]],
  wood: [[140, 160], [200, 140], [260, 128], [330, 110], [380, 100]], hall: [[120, 200], [200, 190], [270, 180], [330, 172], [390, 170]], party: [[90, 110], [200, 102], [300, 100], [400, 106], [470, 112]]
};
function lanePt(L, u) { const n = L.length - 1, f = Math.min(Math.max(u, 0), 1) * n, i = Math.min(n - 1, Math.floor(f)), k = f - i; return [L[i][0] + (L[i + 1][0] - L[i][0]) * k, L[i][1] + (L[i + 1][1] - L[i][1]) * k]; }

export function updateWinks(g, dt) {
  const w = g.wk || (g.wk = { run: null, recent: [] }); if (g.wkAt === undefined) g.wkAt = g.now + 110 + Math.random() * 80;
  if (g.night || !g.started || g.titleEl) { if (w.run) endRun(g, w); return; }
  if (w.run) return run(g, w, dt);
  if (g.now < g.wkAt || (g.gl && g.gl.run) || g.locked || g.bubbles.length || g.barks.length || g.narr || g.nq.length || g.hiBusy() || g.lowBusy()) return;
  const ok = IDS.filter(id => { const d = V[id]; return !w.recent.includes(id) && (!d.only || d.only.includes(g.st.scene)) && (!d.ext || g.sky); });
  if (!ok.length) { w.recent.length = 0; g.wkAt = g.now + 30; return; }
  const seen = store.get('pc.winks', {}), pick = ok.sort((a, b) => (seen[a] || 0) - (seen[b] || 0) + (Math.random() - 0.5) * 1.5)[0];
  seen[pick] = (seen[pick] || 0) + 1; store.set('pc.winks', seen); w.recent.push(pick); if (w.recent.length > 8) w.recent.shift();
  start(g, w, pick);
}

function start(g, w, id, force) {
  const d = V[id]; if (!d.dur) { g.narrate(d.after, { force: true }); g.wkAt = g.now + 200 + Math.random() * 160; return; }
  const lane = LANES[g.st.scene], far = !!lane && d.far !== false && !d.fly && (force === 'far' ? true : force === 'fg' ? false : Math.random() < 0.55), r = { id, d, t0: g.now, ents: [], lineI: 0, sfxI: 0, shakeI: 0, puffI: 0, done: false, hero: g.hero ? g.hero.x : 240, saved: null, lane: far ? lane : null };
  for (const c of d.cast || []) { const e = { id: 'wk_' + c.id, spr: c.spr, x: -999, y: 256, noHot: true, hot: false, visible: true, z: far && !c.fly ? 0 : (c.z ?? 300), animState: 'idle', ph: Math.random() * 5, alpha: far && !c.fly ? 0.92 : undefined }; g.ents.push(e); r.ents.push({ e, c }); }
  if (d.horse) { const h = g.ent('horse'); if (h) r.saved = [h, h.spr]; }
  w.run = r;
}

const at = (v, hx) => (typeof v === 'string' ? hx + parseFloat(v.slice(3)) : v);
function run(g, w, dt) {
  const r = w.run, d = r.d, t = g.now - r.t0;
  for (const { e, c } of r.ents) {
    const wp = c.wp; let x = -999, y = wp[0][2], moving = false;
    if (t >= wp[0][0] && t <= wp[wp.length - 1][0]) for (let i = 0; i < wp.length - 1; i++) {
      const [t0, x0, y0] = wp[i], [t1, x1, y1] = wp[i + 1];
      if (t >= t0 && t <= t1) { const k = t1 > t0 ? (t - t0) / (t1 - t0) : 1, ax = at(x0, r.hero), bx = at(x1, r.hero); x = ax + (bx - ax) * k; y = y0 + (y1 - y0) * k; moving = Math.abs(bx - ax) > 0.5; if (moving) e.flip = (c.dir ?? 1) * (bx - ax) < 0 ? c.dir === -1 ? false : true : c.dir === -1; break; }
    }
    if (r.lane && !c.fly && x > -900) { const u = (x + 60) / 620, p = lanePt(r.lane, u); x = p[0]; y = p[1]; }
    e.x = x; e.y = y; e.animState = moving ? 'walk' : 'idle'; e.visible = x > -900;
    if (c.hop) e.bob = Math.abs(Math.sin(t * 6)) * (moving ? c.hop : 3); else if (c.bob) e.bob = Math.sin(t * 3) * c.bob; else e.bob = 0;
    if (c.spin) e.rot = (t * 4.5) % (Math.PI * 2);
    if (c.poses) for (const [pt, ps] of c.poses) if (t >= pt) e.spr = ps;
    if (c.rise) { const [a, b, cc, dd, h] = c.rise, k = t < a ? 0 : t < b ? (t - a) / (b - a) : t < cc ? 1 : t < dd ? 1 - (t - cc) / (dd - cc) : 0; e.y = c.wp[0][2] + (1 - k) * h; e.visible = k > 0; }
    if (d.id === 'dexter') e.visible = false;
  }
  if (d.horse && r.saved) { const [h] = r.saved; h.spr = t > 0.3 && t < d.dur - 1 ? 'wk.horsearmor' : r.saved[1]; }
  for (; r.sfxI < (d.sfx || []).length && t >= d.sfx[r.sfxI][0]; r.sfxI++) wsfx(g, d.sfx[r.sfxI][1]);
  for (; r.shakeI < (d.shake || []).length && t >= d.shake[r.shakeI][0]; r.shakeI++) g.shake(d.shake[r.shakeI][1], d.shake[r.shakeI][2]);
  for (; r.puffI < (d.puff || []).length && t >= d.puff[r.puffI][0]; r.puffI++) (r.puffs = r.puffs || []).push({ t0: g.now, x: d.puff[r.puffI][1], y: d.puff[r.puffI][2] });
  /* répliques : une seule voix à la fois, on attend le silence */
  const L = (d.lines || [])[r.lineI];
  if (L && t >= L[0] && !g.hiBusy() && !g.lowBusy() && !g.narr && !g.bubbles.length && !g.barks.length) {
    const who = L[1] === 'horse' ? 'horse' : L[1] === 'hero' ? 'hero' : 'wk_' + L[1];
    if (g.ent(who)) { g.vvol = r.lane ? 0.5 : undefined; g.bark(who, L[2], 3600, true); g.vvol = undefined; } r.lineI++;
  }
  if (t >= d.dur && !g.hiBusy() && !g.lowBusy() && !g.barks.length) endRun(g, w);
}

function endRun(g, w) {
  const r = w.run; if (!r) return; w.run = null;
  g.ents = g.ents.filter(e => !r.ents.some(x => x.e === e));
  if (r.saved) r.saved[0].spr = r.saved[1];
  if (r.d.after && !g.night) g.narrate(r.d.after, { force: false, delay: 1.2 });
  g.wkAt = g.now + 200 + Math.random() * 160;
}

function wsfx(g, n) {
  if (n === 'rumble') snd.rumble && snd.rumble(); else if (n === 'ghost') snd.ghost && snd.ghost(); else if (n === 'screech') snd.screech && snd.screech();
  else if (n === 'owl') snd.owl && snd.owl(); else if (n === 'click') g.sfx('step'); else if (n === 'boom') g.sfx('clang'); else g.sfx(n);
}

/* fumée de la scénette de bricolage */
export function drawWinks(g, c) {
  const r = g.wk && g.wk.run; if (!r || !r.puffs) return;
  c.save(); for (const p of r.puffs) { const a = g.now - p.t0; if (a > 3) continue; for (let i = 0; i < 9; i++) { const k = a / 3, ang = i * 0.7 + 1; c.globalAlpha = (1 - k) * 0.6; c.fillStyle = i % 2 ? '#d8d8d8' : '#8d8d8d'; c.beginPath(); c.arc(p.x + Math.cos(ang) * (6 + a * 18), p.y - a * 10 + Math.sin(ang) * (4 + a * 8), 4 + a * 5, 0, 7); c.fill(); } } c.restore();
}

/* lance une scénette précise (essais) */
export function playWink(g, id, force) { g.clearBarks(); g.hushNarr(); const w = g.wk || (g.wk = { next: g.now + 40, run: null, recent: [] }); if (w.run) endRun(g, w); start(g, w, id, force); return V[id] && V[id].dur; }
export const WINK_IDS = IDS;
