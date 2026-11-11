/* Sons et musique du jeu, entièrement synthétisés (Web Audio) : aucun fichier audio, composition originale. Respecte le réglage de son du site. */
import { sfx } from '../../audio.js';

let ctx = null, master = null, musicTimer = null, musicOn = true;
const ensure = () => {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
    master = ctx.createGain(); master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  master.gain.value = sfx.vol * 0.9;
  return ctx;
};
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
function tone({ f, to, t = 0, d = 0.15, type = 'square', g = 0.1, a = 0.004 }) {
  const c = ensure(); if (!c || !sfx.on) return;
  const o = c.createOscillator(), e = c.createGain(), t0 = c.currentTime + t;
  o.type = type; o.frequency.setValueAtTime(f, t0); if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + d);
  e.gain.setValueAtTime(0.0001, t0); e.gain.exponentialRampToValueAtTime(g, t0 + a); e.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  o.connect(e); e.connect(master); o.start(t0); o.stop(t0 + d + 0.03);
}
function noise({ d = 0.2, f = 1200, q = 1, g = 0.1, t = 0, type = 'bandpass' }) {
  const c = ensure(); if (!c || !sfx.on) return;
  const n = Math.floor(c.sampleRate * d), b = c.createBuffer(1, n, c.sampleRate), x = b.getChannelData(0);
  for (let i = 0; i < n; i++) x[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource(); s.buffer = b; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
  const e = c.createGain(), t0 = c.currentTime + t; e.gain.setValueAtTime(g, t0); e.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  s.connect(fl).connect(e).connect(master); s.start(t0);
}


/* ───────── musique : instruments synthétisés, pistes originales d'esprit nordique (chœurs d'hommes, cuivres graves, cordes, tambours de guerre) ───────── */
let musicIn = null, wanted = 'rue', cur = null;
const impulse = (c, sec, decay) => { const n = Math.floor(c.sampleRate * sec), b = c.createBuffer(2, n, c.sampleRate); for (let k = 0; k < 2; k++) { const d = b.getChannelData(k); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); } return b; };
function musicBus() {
  const c = ensure(); if (musicIn || !c) return;
  musicIn = c.createGain(); musicIn.gain.value = 1;
  const dry = c.createGain(), wet = c.createGain(), cv = c.createConvolver(); dry.gain.value = 0.85; wet.gain.value = 0.55; cv.buffer = impulse(c, 3.2, 2.4);
  musicIn.connect(dry).connect(master); musicIn.connect(cv).connect(wet).connect(master);
}
const envG = (c, out, t, a, d, g) => { const e = c.createGain(); e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(g, t + Math.min(a, d * 0.45)); e.gain.setValueAtTime(g, t + Math.max(d - 0.35, d * 0.55)); e.gain.exponentialRampToValueAtTime(0.0001, t + d); e.connect(out); return e; };
const osc = (c, type, f, t, d, det = 0) => { const o = c.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = det; o.start(t); o.stop(t + d + 0.1); return o; };
const vib = (c, o, f, t, d, depth = 0.005, rate = 5.4) => { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = rate; lg.gain.value = f * depth; l.connect(lg).connect(o.frequency); l.start(t); l.stop(t + d + 0.1); };
const INSTR = out => { const c = ctx; return {
  /* cordes / bourdon : scies désaccordées filtrées, attaque lente */
  pad(f, t, d, g, a = 0.8, type = 'sawtooth', lp = 1500) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; fl.connect(envG(c, out, t, a, d, g)); [-8, 0, 8].forEach(dt => osc(c, type, f, t, d, dt).connect(fl)); },
  /* chœur d'hommes : scies + deux formants « a » + vibrato */
  choir(f, t, d, g) { const mix = envG(c, out, t, 0.7, d, g); [[650, 5], [1080, 7], [2600, 8]].forEach(([fq, q], k) => { const b = c.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = fq; b.Q.value = q; const gg = c.createGain(); gg.gain.value = [1, 0.7, 0.25][k]; b.connect(gg).connect(mix); [-9, 0, 9].forEach(dt => { const o = osc(c, 'sawtooth', f, t, d, dt); vib(c, o, f, t, d, 0.004, 5.2); o.connect(b); }); }); },
  /* cuivre grave : scie dont le filtre s'ouvre en nappe */
  brass(f, t, d, g) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.Q.value = 2; fl.frequency.setValueAtTime(300, t); fl.frequency.exponentialRampToValueAtTime(1500, t + d * 0.35); fl.frequency.exponentialRampToValueAtTime(500, t + d); fl.connect(envG(c, out, t, 0.12, d, g)); [-5, 5].forEach(dt => osc(c, 'sawtooth', f, t, d, dt).connect(fl)); },
  /* luth : pincement bref */
  pluck(f, t, d, g) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.setValueAtTime(3200, t); fl.frequency.exponentialRampToValueAtTime(500, t + d); const e = c.createGain(); e.gain.setValueAtTime(g, t); e.gain.exponentialRampToValueAtTime(0.0001, t + d); fl.connect(e).connect(out); osc(c, 'triangle', f, t, d).connect(fl); osc(c, 'square', f * 2, t, d * 0.5).connect(fl); },
  /* flûte : sinus + harmonique, souffle et vibrato */
  flute(f, t, d, g) { const e = envG(c, out, t, 0.12, d, g); const o = osc(c, 'sine', f, t, d); vib(c, o, f, t + 0.25, d, 0.006, 5); o.connect(e); osc(c, 'triangle', f * 2, t, d).connect(e); },
  /* violon : scie filtrée, vibrato */
  fiddle(f, t, d, g) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 2600; fl.connect(envG(c, out, t, 0.04, d, g)); [-6, 6].forEach(dt => { const o = osc(c, 'sawtooth', f, t, d, dt); vib(c, o, f, t + 0.1, d, 0.007, 5.8); o.connect(fl); }); },
  /* tambour (grand = tambour de guerre) */
  drum(t, g, big) { const o = osc(c, 'sine', big ? 100 : 150, t, 0.7); o.frequency.exponentialRampToValueAtTime(big ? 34 : 55, t + (big ? 0.55 : 0.3)); const e = c.createGain(); e.gain.setValueAtTime(g, t); e.gain.exponentialRampToValueAtTime(0.0001, t + (big ? 0.7 : 0.35)); o.connect(e).connect(out);
    const n = Math.floor(c.sampleRate * 0.2), b = c.createBuffer(1, n, c.sampleRate), x = b.getChannelData(0); for (let i = 0; i < n; i++) x[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(); s.buffer = b; const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = big ? 260 : 600; const ne = c.createGain(); ne.gain.setValueAtTime(g * 0.8, t); ne.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); s.connect(fl).connect(ne).connect(out); s.start(t); }
}; };
const F = mtof;
/* Rivebois : calme et large, ré dorien — cordes, luth, flûte, bourdon grave */
const RUE_R = [50, 48, 46, 50, 50, 53, 48, 50], RUE_T = [3, 4, 4, 3, 3, 4, 4, 3];
const RUE_M = [[[0, 0, 2], [2, 2, 1], [3, 3, 1]], [[5, 0, 3], [3, 3, 1]], [[2, 0, 2], [0, 2, 1], [-2, 3, 1]], [[0, 0, 4]], [[7, 0, 2], [5, 2, 1], [3, 3, 1]], [[5, 0, 2], [7, 2, 2]], [[10, 0, 2], [9, 2, 1], [7, 3, 1]], [[5, 0, 2], [0, 2, 2]]];
const RUE_M2 = [[[7, 0, 2], [9, 2, 1], [10, 3, 1]], [[12, 0, 3], [10, 3, 1]], [[9, 0, 2], [7, 2, 1], [5, 3, 1]], [[7, 0, 4]], [[5, 0, 2], [3, 2, 1], [2, 3, 1]], [[3, 0, 2], [5, 2, 2]], [[7, 0, 2], [5, 2, 1], [3, 3, 1]], [[2, 0, 2], [0, 2, 2]]];
/* Chemin du moulin : gigue de voyage, la dorien — violon, luth, bodhrán, bourdon */
const MIL_R = [45, 50, 45, 43, 45, 50, 43, 45], MIL_T = [3, 4, 3, 4, 3, 4, 4, 3];
const MIL_M = [[0, 3, 7, 5, 3, 0], [2, 5, 9, 7, 5, 2], [3, 7, 10, 9, 7, 3], [7, 7, 5, 3, 2, 0], [0, 3, 7, 10, 9, 7], [5, 7, 9, 10, 12, 10], [9, 7, 5, 3, 5, 7], [3, 2, 0, 0, 0, null]];
const MIL_M2 = [[12, 10, 9, 7, 9, 10], [12, 12, 10, 9, 7, 5], [7, 9, 10, 12, 10, 9], [7, 5, 3, 2, 0, null], [0, 3, 7, 12, 10, 7], [9, 10, 12, 14, 12, 10], [9, 7, 5, 7, 9, 10], [7, 3, 2, 0, 0, null]];
/* Prairie des géants : marche épique, ré éolien — chœur d'hommes, cuivres graves, tambours de guerre */
const GEA_R = [38, 34, 41, 36, 38, 34, 36, 33];
const GEA_M = [[[62, 0, 3], [65, 3, 1]], [[69, 0, 4]], [[67, 0, 3], [65, 3, 1]], [[64, 0, 4]], [[62, 0, 2], [65, 2, 2]], [[70, 0, 3], [69, 3, 1]], [[67, 0, 2], [64, 2, 2]], [[62, 0, 4]]];
const GEA_M2 = [[[69, 0, 3], [72, 3, 1]], [[74, 0, 4]], [[72, 0, 3], [70, 3, 1]], [[69, 0, 4]], [[65, 0, 2], [69, 2, 2]], [[74, 0, 3], [72, 3, 1]], [[70, 0, 2], [67, 2, 2]], [[69, 0, 4]]];
const TRACKS = {
  rue: { bar: 3.8, play(i, t, I) {
    const q = i % 16, b = q & 7, B = 0.95, r = RUE_R[b], th = RUE_T[b], d = B * 4.2, A = q < 8;
    I.pad(F(r), t, d, 0.03); I.pad(F(r + 7), t, d, 0.026); I.pad(F(r + 12 + th), t, d, 0.02); I.pad(F(r - 12), t, d, 0.06, 0.6, 'sine');
    [0, 7, 12, th + 12, 12, 7, th + 12, 7].forEach((s, k) => I.pluck(F(r + 12 + s), t + k * B / 2, 0.55, 0.05));
    (A ? RUE_M : RUE_M2)[b].forEach(([n, s, l]) => I.flute(F(62 + n), t + s * B, l * B * 0.95, A ? 0.07 : 0.075));
    if (A ? (b === 3 || b === 7) : true) I.choir(F(r + 12), t, d, A ? 0.03 : 0.05);
    if (!A) { I.choir(F(r), t, d, 0.04); I.pad(F(r + 19), t, d, 0.02, 1.4); }
  } },
  mill: { bar: 1.62, play(i, t, I) {
    const q = i % 16, b = q & 7, E = 0.27, r = MIL_R[b], th = MIL_T[b], A = q < 8;
    I.pad(F(45), t, E * 6.2, 0.045, 0.3, 'sawtooth', 500); I.pad(F(52), t, E * 6.2, 0.032, 0.3, 'sawtooth', 500);
    I.drum(t, 0.26); I.drum(t + 3 * E, 0.2); I.drum(t + 2 * E, 0.07); I.drum(t + 5 * E, 0.07);
    [0, 3].forEach(k => [r + 12, r + 12 + th, r + 19].forEach((n, q) => I.pluck(F(n), t + k * E + q * 0.03, 0.4, 0.085)));
    (A ? MIL_M : MIL_M2)[b].forEach((s, k) => { if (s !== null) I.fiddle(F(69 + s), t + k * E, E * 0.95, 0.09); });
    if (!A && b % 2 === 0) I.fiddle(F(57 + [0, 3, 0, -2][b >> 1]), t, E * 5.5, 0.04);
  } },
  meadow: { bar: 3.76, play(i, t, I) {
    const q = i % 16, b = q & 7, B = 0.94, r = GEA_R[b], d = B * 4.1, A = q < 8;
    I.pad(F(26), t, d, 0.07, 0.8, 'sawtooth', 450); I.pad(F(r + 12), t, d, 0.04, 1.2, 'sawtooth', 700); I.pad(F(r + 19), t, d, 0.03, 1.2, 'sawtooth', 700);
    I.brass(F(r + 12), t, B * 1.8, 0.07); I.brass(F(r + 12), t + 2 * B, B * 1.8, 0.07);
    (A ? GEA_M : GEA_M2)[b].forEach(([n, s, l]) => { I.choir(F(n - 12), t + s * B, l * B, 0.16); I.choir(F(n - 24), t + s * B, l * B, 0.13); if (!A) I.choir(F(n - 5), t + s * B, l * B, 0.07); });
    if (!A) { I.brass(F(r + 24), t, B * 1.4, 0.06); I.brass(F(r + 24), t + 1.5 * B, B * 0.9, 0.05); I.brass(F(r + 31), t + 2.5 * B, B * 1.4, 0.05); }
    I.drum(t, 0.26, true); I.drum(t + 2 * B, 0.22, true); I.drum(t + 3 * B, 0.09); I.drum(t + 3.5 * B, 0.09);
    if (b === 7 || (!A && b === 3)) [0, 0.25, 0.5, 0.75].forEach((x, k) => I.drum(t + 3 * B + x * B, 0.1 + k * 0.05, true));
  } }
};
function stopTrack() {
  if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  if (cur && ctx) { const o = cur; try { o.bus.gain.cancelScheduledValues(ctx.currentTime); o.bus.gain.setValueAtTime(o.bus.gain.value, ctx.currentTime); o.bus.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5); } catch {} setTimeout(() => { try { o.bus.disconnect(); } catch {} }, 1500); }
  cur = null;
}
function startTrack(id) {
  if (!TRACKS[id]) id = 'rue';
  if (cur && cur.id === id && musicTimer) return;
  stopTrack(); musicBus(); const c = ctx; if (!c) return;
  const bus = c.createGain(); bus.gain.setValueAtTime(0.0001, c.currentTime); bus.gain.linearRampToValueAtTime(1, c.currentTime + 1.2); bus.connect(musicIn);
  cur = { id, bus, i: 0, tnext: c.currentTime + 0.35, I: INSTR(bus) };
  const sched = () => {
    if (!cur || !sfx.on || !musicOn) { if (cur) cur.tnext = Math.max(cur.tnext, ctx.currentTime + 0.1); return; }
    const T = TRACKS[cur.id];
    while (cur.tnext < ctx.currentTime + 1.5) { T.play(cur.i, cur.tnext, cur.I); cur.tnext += T.bar; cur.i++; }
  };
  musicTimer = setInterval(sched, 250); sched();
}

export const snd = {
  unlock: ensure,
  blip(who = 'hero') { const base = { hero: 330, merchant: 190, guard: 150, hen: 520, giant: 85, nazim: 300, narr: 260 }[who] || 260; tone({ f: base * (0.9 + Math.random() * 0.3), d: 0.045, g: 0.05, type: 'square' }); },
  step() { noise({ d: 0.06, f: 500 + Math.random() * 300, q: 0.8, g: 0.07, type: 'lowpass' }); },
  click() { tone({ f: 900, to: 600, d: 0.04, g: 0.05, type: 'triangle' }); },
  pop() { tone({ f: 420, to: 1100, d: 0.12, g: 0.1, type: 'triangle' }); tone({ f: 1320, d: 0.16, t: 0.1, g: 0.06, type: 'sine' }); },
  clang() { [196, 311, 523, 831].forEach((f, i) => tone({ f, d: 0.7 - i * 0.1, g: 0.09 / (i + 1), type: 'triangle' })); noise({ d: 0.12, f: 3000, q: 4, g: 0.12, type: 'highpass' }); },
  whoosh() { noise({ d: 0.4, f: 700, q: 0.6, g: 0.1 }); tone({ f: 200, to: 900, d: 0.35, g: 0.04, type: 'sawtooth' }); },
  shout() { [110, 164, 220].forEach(f => tone({ f, to: f * 0.5, d: 1.1, g: 0.12, type: 'sawtooth' })); noise({ d: 0.9, f: 200, q: 0.5, g: 0.18, type: 'lowpass' }); },
  coin() { tone({ f: 1320, d: 0.08, g: 0.07 }); tone({ f: 1760, d: 0.22, t: 0.07, g: 0.07 }); },
  cluck() { tone({ f: 620, to: 380, d: 0.09, g: 0.06 }); tone({ f: 560, to: 340, d: 0.09, t: 0.12, g: 0.05 }); },
  jingle() { [523, 659, 784, 1047].forEach((f, i) => tone({ f, d: 0.3, t: i * 0.11, g: 0.08, type: 'triangle' })); },
  /* musique : une piste par scène (voir TRACKS), fondu enchaîné au changement de scène */
  music(on, id) {
    if (id) wanted = id;
    musicOn = on;
    if (!on) { stopTrack(); return; }
    if (!ensure()) return;
    startTrack(wanted);
  },
  stop() { stopTrack(); },
  _master: () => master
};
