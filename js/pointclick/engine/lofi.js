/* Voix de la saison 1 « façon années 90 », sur le modèle des extraits donnés par Stéphan (27/11/2026) : son de jeu CD compressé
   en ADPCM IMA 4 bits à 11 840 Hz. Calculé en temps réel à la lecture, aucun fichier réenregistré.
   Chaîne : coupe des aigus vers 4,4 kHz (anti-repliement) -> échantillonnage à 11 840 Hz + codage puis décodage ADPCM 4 bits
   (le grain propre à ce format) -> coupe des aigus vers 4,4 kHz (reconstruction). Les graves sont gardés, pas de grain 8 bits. */
let ctx = null, ready = null;
const ADPCM = `const ST=[7,8,9,10,11,12,13,14,16,17,19,21,23,25,28,31,34,37,41,45,50,55,60,66,73,80,88,97,107,118,130,143,157,173,190,209,230,253,279,307,337,371,408,449,494,544,598,658,724,796,876,963,1060,1166,1282,1411,1552,1707,1878,2066,2272,2499,2749,3024,3327,3660,4026,4428,4871,5358,5894,6484,7132,7845,8630,9493,10442,11487,12635,13899,15289,16818,18500,20350,22385,24623,27086,29794,32767];
const IX=[-1,-1,-1,-1,2,4,6,8];
class Adpcm extends AudioWorkletProcessor {
  constructor(){ super(); this.ph = 0; this.step = sampleRate / 11840; this.pred = 0; this.idx = 0; this.out = 0; }
  code(x){ let s = Math.max(-32768, Math.min(32767, Math.round(x * 32767))), st = ST[this.idx], d = s - this.pred, n = 0;
    if (d < 0) { n = 8; d = -d; } let dq = st >> 3;
    if (d >= st) { n |= 4; d -= st; dq += st; } st >>= 1; if (d >= st) { n |= 2; d -= st; dq += st; } st >>= 1; if (d >= st) { n |= 1; dq += st; }
    this.pred += (n & 8) ? -dq : dq; this.pred = Math.max(-32768, Math.min(32767, this.pred));
    this.idx = Math.max(0, Math.min(88, this.idx + IX[n & 7])); return this.pred / 32767; }
  process(inp, out){ const i = inp[0], o = out[0]; if (!i || !i[0]) return true; const a = i[0];
    for (let n = 0; n < a.length; n++) { this.ph += 1; if (this.ph >= this.step) { this.ph -= this.step; this.out = this.code(a[n]); }
      for (let c = 0; c < o.length; c++) o[c][n] = this.out; }
    return true; } }
registerProcessor('pc-adpcm', Adpcm);`;
function ensure() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
    ready = ctx.audioWorklet ? ctx.audioWorklet.addModule(URL.createObjectURL(new Blob([ADPCM], { type: 'application/javascript' }))).then(() => true, () => false) : Promise.resolve(false);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}
const lp = c => { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 4400; f.Q.value = 0.707; return f; };
/* branche l'élément audio sur la chaîne « années 90 » ; vol = volume des voix. Sans Web Audio : lecture normale. */
export function lofi(a, vol) {
  const c = ensure(); if (!c) return false;
  try {
    const src = c.createMediaElementSource(a), a1 = lp(c), a2 = lp(c), r1 = lp(c), r2 = lp(c), g = c.createGain();
    g.gain.value = vol; a.volume = 1;
    src.connect(a1); a1.connect(a2); r1.connect(r2); r2.connect(g); g.connect(c.destination);
    ready.then(ok => { if (ok) { const q = new AudioWorkletNode(c, 'pc-adpcm'); a2.connect(q); q.connect(r1); } else a2.connect(r1); });
    return true;
  } catch { return false; }
}
