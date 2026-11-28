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
/* branche l'élément audio sur la chaîne « années 90 » ; vol = volume des voix. Sans Web Audio : lecture normale. */
export function lofi(a, vol) {
  const c = ensure(); if (!c) return false;
  try {
    const src = c.createMediaElementSource(a), ch = lofiChain(c), g = c.createGain();
    g.gain.value = vol; a.volume = 1;
    src.connect(ch.input); ch.output.connect(g); g.connect(c.destination);
    return true;
  } catch { return false; }
}
