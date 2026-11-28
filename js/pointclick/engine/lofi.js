/* Voix de la saison 1 « façon années 90 », sur le modèle des extraits donnés par Stéphan (27/11/2026) : son de jeu CD compressé
   en ADPCM IMA 4 bits à 11 840 Hz. Calculé en temps réel à la lecture, aucun fichier réenregistré.
   Chaîne : coupe des aigus vers 4,4 kHz (anti-repliement) -> échantillonnage à 11 840 Hz + codage puis décodage ADPCM 4 bits
   (le grain propre à ce format) -> coupe des aigus vers 4,4 kHz (reconstruction). Les graves sont gardés, pas de grain 8 bits.
   27/11 : même chaîne sur les musiques de la saison 1 (sound.js), canal par canal pour garder la stéréo. */
let ctx = null, ready = null;
const ADPCM = `const ST=[7,8,9,10,11,12,13,14,16,17,19,21,23,25,28,31,34,37,41,45,50,55,60,66,73,80,88,97,107,118,130,143,157,173,190,209,230,253,279,307,337,371,408,449,494,544,598,658,724,796,876,963,1060,1166,1282,1411,1552,1707,1878,2066,2272,2499,2749,3024,3327,3660,4026,4428,4871,5358,5894,6484,7132,7845,8630,9493,10442,11487,12635,13899,15289,16818,18500,20350,22385,24623,27086,29794,32767];
const IX=[-1,-1,-1,-1,2,4,6,8];
class Adpcm extends AudioWorkletProcessor {
  constructor(){ super(); this.ph = 0; this.step = sampleRate / 11840; this.ch = []; }
  code(k, x){ const C = this.ch[k] || (this.ch[k] = { pred: 0, idx: 0 }); let s = Math.max(-32768, Math.min(32767, Math.round(x * 32767))), st = ST[C.idx], d = s - C.pred, n = 0;
    if (d < 0) { n = 8; d = -d; } let dq = st >> 3;
    if (d >= st) { n |= 4; d -= st; dq += st; } st >>= 1; if (d >= st) { n |= 2; d -= st; dq += st; } st >>= 1; if (d >= st) { n |= 1; dq += st; }
    C.pred += (n & 8) ? -dq : dq; C.pred = Math.max(-32768, Math.min(32767, C.pred));
    C.idx = Math.max(0, Math.min(88, C.idx + IX[n & 7])); C.out = C.pred / 32767; }
  process(inp, out){ const i = inp[0], o = out[0]; if (!i || !i[0]) return true; const L = i[0].length;
    for (let n = 0; n < L; n++) { this.ph += 1; const hit = this.ph >= this.step; if (hit) this.ph -= this.step;
      for (let c = 0; c < o.length; c++) { const a = i[Math.min(c, i.length - 1)]; if (hit) this.code(c, a[n]); o[c][n] = this.ch[c] ? this.ch[c].out : 0; } }
    return true; } }
registerProcessor('pc-adpcm', Adpcm);`;
const mods = new WeakMap();   /* module de la chaîne chargé une fois par contexte audio */
const load = c => { if (!mods.has(c)) mods.set(c, c.audioWorklet ? c.audioWorklet.addModule(URL.createObjectURL(new Blob([ADPCM], { type: 'application/javascript' }))).then(() => true, () => false) : Promise.resolve(false)); return mods.get(c); };
function ensure() {
  if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}
const lp = c => { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 4400; f.Q.value = 0.707; return f; };
/* chaîne « années 90 » dans le contexte c : { input, output } (sans AudioWorklet : seulement la coupe des aigus) */
export function lofiChain(c) {
  const a1 = lp(c), a2 = lp(c), r1 = lp(c), r2 = lp(c);
  a1.connect(a2); r1.connect(r2);
  load(c).then(ok => { if (ok) { const q = new AudioWorkletNode(c, 'pc-adpcm', { outputChannelCount: [2] }); a2.connect(q); q.connect(r1); } else a2.connect(r1); });
  return { input: a1, output: r2 };
}
/* voix étouffée d'un aveugle, selon ce qu'il a sur la tête (28/11, Stéphan) : coupe des aigus, résonance de l'objet
   et, pour les objets durs et creux, petit écho en peigne (la voix qui tourne dans la marmite, le casque, la botte…) */
const MUFFLE = {
  pot:      { lp: 1100, pk: [650, 9, 4],   comb: [[0.006, 0.6, 0.55], [0.019, 0.35, 0.3]], g: 1.0 },   /* marmite en fonte : caverneuse, écho métallique */
  helmet:   { hp: 300, lp: 3000, pk: [1800, 8, 5], comb: [[0.004, 0.55, 0.5]], g: 0.95 },          /* casque de fer : métal fin, nasillard */
  boot:     { lp: 900,  pk: [350, 8, 3],   comb: [[0.005, 0.45, 0.4]], g: 1.0 },                     /* vieille botte : tube de cuir */
  cabbage:  { lp: 900,  pk: [400, 4, 2],   comb: [[0.002, 0.2, 0.2]], g: 0.95 },                     /* chou : feuilles épaisses, humides */
  basket:   { lp: 2400, pk: [1200, 3, 2],  comb: [[0.003, 0.3, 0.25]], g: 1.0 },                     /* panier d'osier : ajouré, à peine étouffé */
  partyhat: { lp: 2000, pk: [1400, 6, 4],  comb: [[0.0025, 0.35, 0.3]], g: 1.0 },                    /* cône de tissu peint : petit son de cornet */
  mushroom: { lp: 1000, pk: [280, 6, 2],   g: 0.95 },                                                /* chapeau de champignon : mou, sourd */
  sack:     { lp: 700,  g: 0.85 },                                                                   /* sac de toile : très étouffé, sans écho */
  hat:      { lp: 550,  g: 0.8 },                                                                    /* toque de fourrure : la plus sourde */
  banner:   { lp: 1600, g: 0.95 },                                                                   /* bannière de tissu : léger voile */
};
export function muffleChain(c, kind) {
  const m = MUFFLE[kind]; if (!m) return null;
  const input = c.createGain(), output = c.createGain(); output.gain.value = m.g; let last = input;
  const f = (type, freq, gain = 0, q = 0.707) => { const b = c.createBiquadFilter(); b.type = type; b.frequency.value = freq; b.gain.value = gain; b.Q.value = q; last.connect(b); last = b; };
  if (m.hp) f('highpass', m.hp); f('lowpass', m.lp); f('lowpass', m.lp); if (m.pk) f('peaking', m.pk[0], m.pk[1], m.pk[2]);
  last.connect(output);
  for (const [t, fb, wet] of m.comb || []) {   /* écho en peigne : retard court rebouclé */
    const d = c.createDelay(0.1), k = c.createGain(), w = c.createGain(); d.delayTime.value = t; k.gain.value = fb; w.gain.value = wet;
    last.connect(d); d.connect(k); k.connect(d); d.connect(w); w.connect(output);
  }
  return { input, output };
}
/* branche l'élément audio sur la chaîne « années 90 » (sauf noLofi : saison 2) et, pour un aveugle, sur son étouffement ;
   vol = volume des voix. Sans Web Audio : lecture normale. */
export function lofi(a, vol, kind, noLofi) {
  const c = ensure(); if (!c) return false;
  try {
    const src = c.createMediaElementSource(a), g = c.createGain(), mu = kind ? muffleChain(c, kind) : null;
    g.gain.value = vol; a.volume = 1; let last = src;
    if (mu) { last.connect(mu.input); last = mu.output; }
    if (!noLofi) { const ch = lofiChain(c); last.connect(ch.input); last = ch.output; }
    last.connect(g); g.connect(c.destination);
    return true;
  } catch { return false; }
}
