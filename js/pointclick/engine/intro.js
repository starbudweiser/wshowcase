/* Intro « Quinze ans plus tard » (parodie du réveil dans la charrette), jouée au lancement d'une nouvelle partie.
   Plans 1 à 5 dessinés ici sur le canevas du jeu ; le plan 6 (arrivée à Rivebois) se joue dans la vraie scène de la rue (rue.js, intro 'cart').
   Clic ou Échap : passe toute l'intro. Espace ou Entrée : passe une réplique. Images : assets/pointclick/intro/ (tools/intro_build.py). */
import { snd } from './sound.js';

const W = 480, H = 270;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = t => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const DIR = 'assets/pointclick/intro/';
/* fichiers de l'intro ; les portraits du héros sont ceux du jeu (spr/hero_p*.png) */
const FILES = ['p1', 'p2', 'rail', 'prop_grass', 'prop_rock', 'prop_fence', 'prop_pine', 'comp_s', 'thief_s',
  'comp_back1', 'comp_back2', 'comp_back3', 'comp_back4', 'thief_cu1', 'thief_cu2', 'thief_cu3', 'thief_cu4', 'thief_cu5'];

/* flou : réduction puis agrandissement lissé (marche partout, sans ctx.filter) */
function blurred(im, k = 4) {
  const s = document.createElement('canvas'); s.width = Math.max(1, Math.round(im.width / k)); s.height = Math.max(1, Math.round(im.height / k));
  const x = s.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(im, 0, 0, s.width, s.height);
  const o = document.createElement('canvas'); o.width = im.width; o.height = im.height; const y = o.getContext('2d'); y.imageSmoothingEnabled = true; y.imageSmoothingQuality = 'high'; y.drawImage(s, 0, 0, o.width, o.height);
  return o;
}

/* précharge toutes les images de l'intro (appelé pendant l'écran titre : « Nouvelle partie » démarre aussitôt) */
export function preloadIntro(g) {
  const cyc = d => fetch(DIR + d + '/index.json').then(r => r.json()).then(j => Promise.all(Array.from({ length: j.n }, (_, i) => g.img(`${DIR}${d}/${String(i).padStart(2, '0')}.png`)))).catch(() => {});
  const p = [...FILES.map(n => g.img(DIR + n + '.png')), cyc('cart'), cyc('cart3')];
  return Promise.all(p).catch(() => {});
}

export class Intro {
  constructor(g) { this.g = g; this.im = {}; this.t = 0; this.shot = null; this.cap = null; this.skipped = false; }
  async load() {
    const g = this.g;
    await Promise.all(FILES.map(async n => { this.im[n] = await g.img(DIR + n + '.png'); }));
    /* cycle de la charrette : cart3 = passagers assis dedans (24/11/2026) ; sinon l'ancienne charrette vide + passagers en sprites */
    for (const d of ['cart3', 'cart']) { try { this.cartN = (await (await fetch(DIR + d + '/index.json')).json()).n; this.cartDir = d; break; } catch { this.cartN = 0; } }
    this.cart = await Promise.all(Array.from({ length: this.cartN }, (_, i) => g.img(`${DIR}${this.cartDir}/${String(i).padStart(2, '0')}.png`)));
    this.inCart = this.cartDir === 'cart3';
    if (this.im.p2) this.p2blur = blurred(this.im.p2, 5);
    ['comp_back1', 'comp_back2', 'comp_back3', 'comp_back4'].forEach(n => { if (this.im[n]) this.im[n + 'b'] = blurred(this.im[n], 3); });
  }
  hero(n) { return this.g.spr('hero.' + n); }
  update(dt) { this.t += dt; }
  draw(c) {
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    if (this.shot) { c.save(); this.shot(c, this.t); c.restore(); }
  }
  /* carton (texte HTML par-dessus le jeu, même police que les bulles) */
  caption(text) {
    const g = this.g; this.uncaption();
    const d = document.createElement('div'); d.className = 'pc-cap'; d.innerHTML = text; g.ov.append(d); this.cap = d;
    requestAnimationFrame(() => d.classList.add('on'));
  }
  uncaption() { if (this.cap) { const d = this.cap; this.cap = null; d.classList.remove('on'); setTimeout(() => d.remove(), 700); } }
  hint() {
    const g = this.g, d = document.createElement('div'); d.className = 'pc-skip'; d.textContent = g.T('intro.skip'); g.ov.append(d); this.hintEl = d;
    setTimeout(() => d.classList.add('out'), 4500); setTimeout(() => d.remove(), 5200);
  }
  begin(fn) { this.t = 0; this.shot = fn; }
  /* une réplique : bulle à la position (x, y) du canevas, voix, attente de la fin (ou passage par Espace) */
  async say(who, key, x, y) { this.g.cinePos = { [who]: [x, y] }; this.talker = who; try { await this.g.say(who, key); } finally { this.talker = null; } }

  /* cheval et charrette : cycle de pas (cart/NN.png), x au centre, y au sol */
  drawCart(c, x, y, k, t, moving = true) {
    const n = this.cartN; if (!n) return 0;
    const i = moving ? Math.floor(t * 12) % n : 0, im = this.cart[i]; if (!im) return 0;
    const w = Math.round(im.width * k), h = Math.round(im.height * k);
    c.drawImage(im, Math.round(x - w / 2), Math.round(y - h), w, h); return h;
  }
  /* passagers vus de profil au-dessus du bord de la charrette (dessinés avant elle : le bord cache le bas du corps) */
  drawRiders(c, x, y, k, t, heroImg) {
    if (this.inCart) return;   /* passagers déjà dans l'image de la charrette */
    const bob = (ph) => Math.round(Math.abs(Math.sin(t * 6.2 + ph)) * 1.4 * k);
    const put = (im, dx, dy, ph, kk = k) => { if (!im) return; const w = Math.round(im.width * kk), h = Math.round(im.height * kk); c.drawImage(im, Math.round(x + dx * k - w / 2), Math.round(y - dy * k - h - bob(ph)), w, h); };
    put(this.im.thief_s, -52, 22, 0.4); put(this.im.comp_s, -80, 22, 1.3);
    if (heroImg) put(heroImg, -108, 58, 2.1, k * 0.17);
  }

  async play() {
    const g = this.g;
    await this.load();
    snd.music(snd.musicOn !== false, 'intro'); this.hint();
    await this.p1(); await this.p2(); await this.p3(); await this.p4(); await this.p5();
  }

  /* P1 · très grand plan d'ensemble · descente (grue simulée) de la Gorge du Monde jusqu'à la route ; dragon ; carton */
  async p1() {
    const g = this.g, bg = this.im.p1, D = ['dragon.up', 'dragon.mid1', 'dragon.down', 'dragon.mid2'].map(n => g.spr(n));
    const dh = bg ? bg.height - H : 0;
    this.begin((c, t) => {
      const y = -Math.round(ease(clamp((t - 2.2) / 6.2, 0, 1)) * dh);
      if (bg) c.drawImage(bg, 0, y);
      const dt = (t - 0.6) / 6.5;
      if (dt > 0 && dt < 1) { const im = D[Math.floor(t * 7) % 4]; if (im) { const k = 0.55, x = -40 + dt * 560, yy = 40 + Math.sin(dt * 5) * 6 + y * 0.6; c.save(); c.translate(Math.round(x), Math.round(yy)); c.scale(-1, 1); /* vole vers la droite, tête en avant (l'image regarde à gauche) */ c.drawImage(im, -im.width * k / 2, -im.height * k / 2, im.width * k, im.height * k); c.restore(); } }
      const ct = t - 4.6; if (ct > 0 && bg) { const x = 30 + ct * 24; this.drawCart(c, x, y + 457 - Math.max(0, x - 200) * 0.05, 0.16, t); }   /* sur la route du bas du décor */
    });
    await g.fade(0, 1200);
    await g.wait(900); this.caption(g.T('intro.card').replace('. ', '.<br>')); g.voicePlay('intro.card', -1);
    await g.wait(3600); this.uncaption(); await g.wait(4300);
  }

  /* P2 · plan d'ensemble · travelling latéral : la charrette au centre, le décor défile (panorama + accessoires du premier plan plus rapides) */
  async p2() {
    const g = this.g, bg = this.im.p2, props = ['prop_grass', 'prop_rock', 'prop_fence', 'prop_pine', 'prop_grass'].map(n => this.im[n]);
    const spd = 46, near = 120;
    this.begin((c, t) => {
      if (bg) { const sx = Math.min(bg.width - W, t * spd); c.drawImage(bg, -Math.round(sx), 0); }
      const shake = Math.round(Math.abs(Math.sin(t * 6.2)) * 1.2);
      this.drawRiders(c, 240, 258 - shake, 1, t, this.hero(Math.floor(t / 2.6) % 2 ? 'pBlink' : 'pSleepy'));
      this.drawCart(c, 240, 258 - shake, 1, t);
      props.forEach((im, i) => { if (!im) return; const x = ((i * 190 + 560) - t * near) % 950 - 120; c.drawImage(im, Math.round(x), H - im.height + 6); });
    });
    await g.wait(10200);
  }

  /* fond des plans dans la charrette : forêt floue qui défile (panorama en miroir), bord de charrette, roulis */
  inside(c, t, railY = 150) {
    const b = this.p2blur, roll = Math.sin(t * 6.2) * 1.1;
    if (b) { const w = b.width, x = (t * 34) % (2 * w); for (let k = -1; k < 3; k++) { const ox = k * w - x; if (ox > W || ox + w < 0) continue; c.save(); if (k % 2) { c.translate(ox + w, 0); c.scale(-1, 1); c.drawImage(b, 0, -10, w, H + 20); } else c.drawImage(b, ox, -10, w, H + 20); c.restore(); } }
    /* la ridelle déborde des deux bords de l'image (elle faisait 474 px : 6 px vides à droite) */
    const r = this.im.rail; if (r) { const w = W + 16, h = Math.round(r.height * w / r.width); c.drawImage(r, -8, Math.round(railY + roll), w, h); }
    return roll;
  }
  /* héros de face (portraits du jeu) : n = nom du portrait, parole = alternance avec pTalk */
  drawHero(c, t, n, k = 0.86, x = 300) {
    const talk = this.talker === 'hero';
    let name = n; if (talk && (n === 'pNeutral' || n === 'pTalk')) name = Math.floor(t * 6) % 2 ? 'pTalk' : 'pNeutral';
    else if (talk && n.endsWith('T') === false && this.hero(n + 'T')) name = Math.floor(t * 6) % 2 ? n + 'T' : n;
    if (!talk && name === 'pNeutral' && t % 4.1 < 0.14) name = 'pBlink';
    const im = this.hero(name); if (!im) return;
    const bob = Math.sin(t * 6.2 + 0.6) * 1.2, w = im.width * k, h = im.height * k;
    c.drawImage(im, Math.round(x - w / 2), Math.round(H + 6 - h + bob), Math.round(w), Math.round(h));
  }
  /* compagnon de dos en amorce (flou) ; poses selon la parole */
  drawComp(c, t) {
    const talk = this.talker === 'comp', i = talk ? [1, 2, 1, 3][Math.floor(t * 2.6) % 4] : (t % 7 < 6 ? 1 : 4), im = this.im['comp_back' + i + 'b'] || this.im['comp_back1b'];
    if (!im) return; const k = 1.05, w = im.width * k, h = im.height * k, bob = Math.sin(t * 6.2 + 2) * 1.6;
    c.drawImage(im, Math.round(-30), Math.round(H - h + 24 + bob), Math.round(w), Math.round(h));
  }

  /* P3 · plan rapproché par-dessus l'épaule : le compagnon réveille le héros */
  async p3() {
    const g = this.g; let hero = 'pBlink', zzz = true;
    this.begin((c, t) => {
      this.inside(c, t);
      if (zzz) { c.save(); c.textAlign = 'center'; c.fillStyle = '#ffe9a8'; c.strokeStyle = '#1a0d06'; c.lineWidth = 2; c.lineJoin = 'round'; for (let i = 0; i < 3; i++) { const p = (t * 0.42 + i / 3) % 1; c.globalAlpha = Math.min(1, (1 - p) * 1.6); c.font = Math.round(11 + p * 9) + 'px PCPixel, monospace'; const x = Math.round(338 + p * 30 + Math.sin(p * 8) * 5), y = Math.round(100 - p * 46); c.strokeText('z', x, y); c.fillText('z', x, y); } c.restore(); }
      this.drawHero(c, t, hero); this.drawComp(c, t);
    });
    await g.wait(1600);
    await this.say('comp', 'intro.comp1', 150, 46);
    zzz = false; hero = 'pSleepy'; g.sfx('pop'); await g.wait(1100); hero = 'pNeutral';
    await this.say('comp', 'intro.comp2', 160, 46);
  }

  /* P4 · gros plan sur le voleur, paniqué */
  async p4() {
    const g = this.g;
    this.begin((c, t) => {
      this.inside(c, t, 176);
      const talk = this.talker === 'thief', seq = talk ? [1, 4, 1, 2, 3, 1] : [5, 5, 2], n = seq[Math.floor(t * (talk ? 3.2 : 1.2)) % seq.length], im = this.im['thief_cu' + n] || this.im.thief_cu1;
      if (im) { const k = 1, sh = talk ? Math.round(Math.sin(t * 40) * 0.8) : 0; c.drawImage(im, Math.round(W / 2 - im.width * k / 2 + sh), Math.round(H + 4 - im.height * k), Math.round(im.width * k), Math.round(im.height * k)); }
    });
    await g.wait(500);
    await this.say('thief', 'intro.thief1', W / 2, 34);
    await g.wait(500);
  }

  /* P5 · plan rapproché, puis zoom éclair sur le héros (« Du miel ? ») */
  async p5() {
    const g = this.g; let hero = 'pNeutral', zoom = null;
    this.begin((c, t) => {
      if (zoom) { const z = 1 + 0.5 * ease(clamp((t - zoom) / 0.14, 0, 1)); c.translate(300, 108); c.scale(z, z); c.translate(-300, -108); }
      this.inside(c, t); this.drawHero(c, t, hero); if (!zoom) this.drawComp(c, t);
    });
    hero = 'pShrug'; await this.say('hero', 'intro.hero1', 300, 40); hero = 'pNeutral';
    await this.say('comp', 'intro.comp3', 160, 46);
    await this.say('comp', 'intro.comp4', 160, 46);
    hero = 'pThink'; await g.wait(1300);
    zoom = this.t; hero = 'pPoint'; g.sfx('whoosh');
    await this.say('hero', 'intro.hero2', 300, 30);
    await g.fade(1, 450);
  }
}

/* lance l'intro ; renvoie true si elle est allée au bout, false si le joueur l'a passée */
export async function playIntro(g) {
  const it = new Intro(g); g.cine = it; g.locked = true; g.fx.fade = { from: 1, to: 1, t0: g.now, ms: 0.01, a: 1 };
  let done = false;
  await g.run(async () => { await it.play(); done = true; });
  it.uncaption(); if (it.hintEl) it.hintEl.remove(); g.cinePos = null; g.cine = null; g.locked = false;
  return done && !it.skipped;
}
