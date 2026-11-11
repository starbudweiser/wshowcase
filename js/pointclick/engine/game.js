/* Moteur du jeu d'aventure : scènes, déplacements, verbes, inventaire, dialogues, scripts, sauvegarde.
   Canvas 2D 480×270 mis à l'échelle par le navigateur ; interface (verbes, inventaire, bulles) en HTML par-dessus. */
import { lang } from '../../i18n.js';
import { Walk, hitPoly } from './walk.js';
import { snd } from './sound.js';
import { loadLang, makeT } from './lang.js';
import { hasSave, loadSave, writeSave, clearSave } from './save.js';
import { makeAmbient } from './ambient.js';
import { SPR, ITEMS } from '../data/sheets.js';

export const W = 480, H = 270;
const VERBS = ['walk', 'take', 'use', 'talk', 'look'];
const COLORS = { hero: '#ffe08a', rider: '#ffe08a', merchant: '#ffa45c', guard: '#9ad0ff', horse: '#f0c890', hen: '#ffffff', narr: '#ffffff' };
class Cancel {}
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export class Game {
  constructor(root) {
    this.root = root; this.imgs = {}; this.st = null; this.scene = null; this.ents = []; this.hot = []; this.waiters = [];
    this.verb = 'walk'; this.sel = null; this.hover = null; this.tok = 0; this.runTok = 0; this.locked = false; this.now = 0; this.fx = {};
    this.bubbles = []; this.choice = null; this.skip = false; this.alive = true; this.started = false; this.nextBlip = 0; this.mouse = [0, 0];
  }

  /* ───────── démarrage ───────── */
  async init() {
    await this.setLang(lang(), true);
    this.build();
    await Promise.all(Object.values(SPR).map(n => this.img(`assets/pointclick/spr/${n}.png`)));
    this.ro = new ResizeObserver(() => this.fit()); this.ro.observe(this.root); this.fit();
    this.last = performance.now(); const tick = t => { if (!this.alive) return; this.raf = requestAnimationFrame(tick); const dt = Math.min(0.05, (t - this.last) / 1000); this.last = t; try { this.update(dt); this.draw(); } catch (e) { console.error(e); } };
    this.raf = requestAnimationFrame(tick);
    this.showTitle();
  }
  destroy() { this.alive = false; cancelAnimationFrame(this.raf); this.ro && this.ro.disconnect(); snd.stop(); }
  async setLang(l, first) {
    this.dict = await loadLang(l); this.T = makeT(this.dict); this.lang = l;
    if (!first) { this.renderPanel(); this.renderLine(); if (this.titleEl) this.showTitle(); }
  }
  img(src) { return this.imgs[src] || (this.imgs[src] = new Promise(res => { const i = new Image(); i.onload = () => { this.imgs[src] = i; res(i); }; i.onerror = () => res(null); i.src = src; }).then(i => (this.imgs[src] = i))); }
  spr(name) { const i = this.imgs[`assets/pointclick/spr/${SPR[name] || name}.png`]; return i && i.width ? i : null; }

  /* ───────── interface HTML ───────── */
  build() {
    const r = this.root; r.innerHTML = ''; r.classList.add('pc');
    this.stage = el('div', 'pc-stage'); this.view = this.stage;
    this.cv = el('canvas'); this.cv.width = W; this.cv.height = H; this.ctx = this.cv.getContext('2d'); this.ctx.imageSmoothingEnabled = false;
    this.ov = el('div', 'pc-ov'); this.askEl = el('div', 'pc-ask'); this.popEl = el('div', 'pc-pop'); this.popEl.hidden = true;
    this.stage.append(this.cv, this.ov, this.askEl, this.popEl);
    this.panel = el('div', 'pc-panel'); this.lineEl = el('div', 'pc-line'); this.verbsEl = el('div', 'pc-verbs'); this.invEl = el('div', 'pc-inv');
    this.menuBtn = el('button', 'pc-menu', '≡'); this.menuBtn.title = 'Menu'; this.menuBtn.onclick = () => this.showTitle(true);
    this.panel.append(this.lineEl, this.verbsEl, this.invEl, this.menuBtn);
    r.append(this.stage, this.panel);
    this.renderPanel();
    const cv = this.cv;
    cv.addEventListener('pointermove', e => { this.mouse = this.pos(e); this.setHover(this.pick(...this.mouse)); });
    cv.addEventListener('pointerleave', () => this.setHover(null));
    cv.addEventListener('pointerdown', e => this.onDown(e));
    cv.addEventListener('contextmenu', e => { e.preventDefault(); const p = this.pos(e), tg = this.pick(...p); if (tg) this.input(() => this.act('look', tg)); });
    this.ov.addEventListener('pointerdown', () => { this.skip = true; });
    /* un balayage dans le jeu ne doit pas changer de bureau du faux Mac */
    ['touchstart', 'touchend'].forEach(n => this.root.addEventListener(n, e => e.stopPropagation(), { passive: true }));
  }
  fit() {
    const rw = this.root.clientWidth, rh = this.root.clientHeight; if (!rw || !rh) return;
    const w = Math.min(rw, rh / (9 / 16 + 66 / 480)), u = w / W;
    this.root.style.setProperty('--u', u.toFixed(4)); this.stage.style.width = w + 'px'; this.stage.style.height = (w * 9 / 16) + 'px';
    this.panel.style.width = w + 'px'; this.panel.style.height = (66 * u) + 'px';
  }
  pos(e) { const r = this.cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; }
  renderPanel() {
    this.verbsEl.innerHTML = '';
    VERBS.forEach((v, i) => { const b = el('button', 'pc-v' + (this.verb === v ? ' on' : ''), `${this.T('v.' + v)}<i>${i + 1}</i>`); b.onclick = () => this.setVerb(v); this.verbsEl.append(b); });
    this.renderInv();
  }
  renderInv() {
    this.invEl.innerHTML = ''; const inv = this.st ? this.st.inv : [];
    for (let i = 0; i < 8; i++) {
      const id = inv[i], b = el('button', 'pc-slot' + (id && this.sel === id ? ' on' : '')); b.disabled = !id;
      if (id) { const c = document.createElement('canvas'); c.width = 40; c.height = 34; const im = this.spr(ITEMS[id].spr); if (im) { const k = Math.min(38 / im.width, 32 / im.height); const w = im.width * k, h = im.height * k; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(im, (40 - w) / 2, 34 - h - 1, w, h); } b.append(c); b.title = this.T('n.' + id); b.onclick = () => this.onItem(id); }
      this.invEl.append(b);
    }
  }
  renderLine() {
    const T = this.T, v = this.verb; let s = T('v.' + v);
    if (v === 'use' && this.sel) s += ' ' + T('n.' + this.sel) + ' ' + T('ui.with');
    if (this.hover) s += ' ' + T(this.hover.name || 'n.' + this.hover.id);
    this.lineEl.textContent = this.locked ? '' : s;
  }
  setVerb(v) { this.verb = v; if (v !== 'use') this.sel = null; snd.click(); this.renderPanel(); this.renderLine(); }
  setHover(t) { const k = t ? t.id : null; if ((this.hover && this.hover.id) === k) return; this.hover = t; this.cv.classList.toggle('hot', !!t); this.renderLine(); }

  /* ───────── écran-titre et menu (composants Socle) ───────── */
  showTitle(inGame) {
    this.hideTitle(); const T = this.T, d = el('div', 'pc-title socle'), c = el('div', 'pc-card');
    c.append(el('h1', '', T('ui.title')), el('p', '', T('ui.sub')));
    const row = el('div', 'pc-btns'), btn = (t, fn, cls) => { const b = el('button', 'sbtn' + (cls ? ' ' + cls : ''), t); b.onclick = () => { snd.unlock(); fn(); }; row.append(b); return b; };
    if (inGame) btn(T('ui.resume'), () => this.hideTitle(), 'acc');
    if (!inGame && hasSave()) btn(T('ui.continue'), () => this.continueGame(), 'acc');
    btn(T('ui.new'), () => this.newGame(), !inGame && !hasSave() ? 'acc' : '');
    const opts = el('div', 'pc-opts');
    const sb = el('button', 'sbtn', T(snd.musicOn === false ? 'ui.musicOff' : 'ui.musicOn')); sb.onclick = () => { snd.musicOn = snd.musicOn === false ? true : false; snd.music(snd.musicOn); sb.textContent = T(snd.musicOn ? 'ui.musicOn' : 'ui.musicOff'); }; opts.append(sb);
    const lb = el('button', 'sbtn', this.lang === 'fr' ? 'English' : 'Français'); lb.onclick = () => this.setLang(this.lang === 'fr' ? 'en' : 'fr'); opts.append(lb);
    c.append(row, opts, el('p', 'pc-fine', T('ui.fine'))); d.append(c); this.stage.append(d); this.titleEl = d;
  }
  hideTitle() { if (this.titleEl) { this.titleEl.remove(); this.titleEl = null; } }

  /* ───────── parties ───────── */
  async newGame() {
    this.hideTitle(); clearSave(); this.cancelAll(); this.locked = false; this.sel = null; this.fx = {};
    this.st = { scene: 'rue', flags: {}, inv: [], hero: null }; snd.music(snd.musicOn !== false); this.started = true;
    await this.goScene('rue', { intro: true });
  }
  async continueGame() {
    const s = loadSave(); if (!s) return this.newGame();
    this.hideTitle(); this.cancelAll(); this.locked = false; this.sel = null; this.fx = {}; this.st = { scene: s.scene, flags: s.flags || {}, inv: s.inv || [], hero: s.hero || null };
    snd.music(snd.musicOn !== false); this.started = true; await this.goScene(s.scene, { restored: true });
  }
  save() { if (this.st && this.started) writeSave({ scene: this.st.scene, flags: this.st.flags, inv: this.st.inv, hero: this.hero ? { x: this.hero.x, y: this.hero.y, dir: this.hero.dir } : null }); }
  async goScene(id, how = {}) {
    const sc = (await import(`../scenes/${id}.js`)).default; this.st.scene = id;
    const bg = await this.img('assets/pointclick/' + sc.bg); this.scene = sc; this.bg = bg;
    this.walk = new Walk(sc.walk.map(p => p.slice()), W, H);
    this.hot = sc.hot || []; this.amb = makeAmbient(sc.ambient);
    this.ents = (sc.ents || []).map(e => ({ visible: true, ...e }));
    const st = how.restored && this.st.hero ? this.st.hero : sc.start;
    this.hero = { id: 'hero', who: 'hero', spr: 'hero.side', x: st.x, y: st.y, dir: st.dir || 'r', path: [], walkD: 0, hot: true, isHero: true, visible: true };
    this.ents.push(this.hero);
    this.hover = null; this.renderPanel(); this.renderLine();
    if (this.started) snd.music(snd.musicOn !== false, sc.music || id);
    if (sc.enter) await sc.enter(this, how);
    this.save();
    if (how.intro && sc.intro) this.run(() => this.cut(() => sc.intro(this)));
  }

  /* ───────── API pour les scènes ───────── */
  flag(k) { return this.st.flags[k]; }
  set(k, v = true) { this.st.flags[k] = v; this.save(); }
  count(k, d = 1) { this.st.flags[k] = (this.st.flags[k] || 0) + d; this.save(); return this.st.flags[k]; }
  has(id) { return this.st.inv.includes(id); }
  give(id) { if (!this.has(id)) this.st.inv.push(id); this.renderInv(); this.save(); }
  drop(id) { this.st.inv = this.st.inv.filter(x => x !== id); if (this.sel === id) this.sel = null; this.renderInv(); this.save(); }
  ent(id) { return this.ents.find(e => e.id === id); }
  addWalk(poly) { this.walk.add(poly); }
  sfx(n, ...a) { snd[n] && snd[n](...a); }
  chk() { if (this.runTok !== this.tok) throw new Cancel(); }
  until(cond) { return new Promise(res => this.waiters.push({ cond, res })); }
  async wait(ms) { this.chk(); const end = this.now + ms / 1000; await this.until(() => this.now >= end); this.chk(); }
  async cut(fn) { this.locked = true; this.renderLine(); try { await fn(); } finally { this.locked = false; this.renderLine(); } }
  cancelAll() { this.tok++; this.waiters.splice(0).forEach(w => w.res()); this.clearBubbles(); if (this.hero) this.hero.path = []; this.askEl.innerHTML = ''; this.choice = null; }
  async run(fn) {
    const tok = ++this.tok; this.runTok = tok;
    try { await fn(); } catch (e) { if (!(e instanceof Cancel)) console.error(e); }
    finally { if (this.runTok === tok && !this.locked) { this.clearBubbles(); this.ents.forEach(e => { e.talk = false; }); } }
  }
  input(fn) { if (this.locked || !this.started || this.titleEl) return; this.cancelAll(); this.run(fn); }
  persp(y) { const p = this.scene.persp; return clamp(p[1] + (p[3] - p[1]) * (y - p[0]) / (p[2] - p[0]), Math.min(p[1], p[3]) * 0.8, Math.max(p[1], p[3])); }
  async walkTo(x, y) { this.chk(); this.hero.path = this.walk.path([this.hero.x, this.hero.y], [x, y]); await this.until(() => !this.hero.path.length); this.chk(); }
  face(x) { this.hero.dir = x >= this.hero.x ? 'r' : 'l'; this.hero.front = false; }
  async walkEnt(id, x, y, speed = 40) { const e = this.ent(id); e.goal = [x, y, speed]; await this.until(() => !e.goal); this.chk(); }
  async say(who, key, vars) {
    this.chk(); const text = key.startsWith('=') ? key.slice(1) : this.T(key, vars), e = who === 'narr' ? null : this.ent(who);
    const b = el('div', 'pc-b', text); b.style.color = COLORS[who] || '#fff'; this.ov.append(b); this.bubbles.push(b);
    const [ax, ay] = e ? this.headPos(e) : [W / 2, 40]; this.placeBubble(b, ax, ay);
    if (e) e.talk = who;
    this.skip = false; const end = this.now + Math.max(1.3, text.length * 0.052);
    await this.until(() => this.now >= end || this.skip); this.skip = false;
    b.remove(); this.bubbles = this.bubbles.filter(x => x !== b); if (e) e.talk = false; this.chk();
  }
  headPos(e) { const im = this.spr(e.spr), s = e.scale ?? this.persp(e.y); return [e.x, e.y - (im ? im.height * s : 40) - 3]; }
  placeBubble(b, x, y) {
    const sw = this.stage.clientWidth, k = sw / W; b.style.left = x * k + 'px'; b.style.top = y * k + 'px';
    const w = b.offsetWidth, l = clamp(x * k, w / 2 + 6, sw - w / 2 - 6); b.style.left = l + 'px'; if (y * k - b.offsetHeight < 4) b.style.top = (b.offsetHeight + 6) + 'px';
  }
  clearBubbles() { this.bubbles.forEach(b => b.remove()); this.bubbles = []; }
  /* choix de dialogue : renvoie l'indice choisi */
  async ask(keys) {
    this.chk(); this.askEl.innerHTML = ''; this.choice = null; this.sel = null;
    keys.forEach((k, i) => { const b = el('button', 'pc-opt', this.T(k)); b.onclick = () => { this.choice = i; }; this.askEl.append(b); });
    await this.until(() => this.choice !== null); const c = this.choice; this.choice = null; this.askEl.innerHTML = ''; this.chk(); return c;
  }
  shake(ms = 500, amp = 3) { this.fx.shake = { end: this.now + ms / 1000, amp }; }
  async fade(to, ms = 600) { const from = this.fx.fade ? this.fx.fade.a : (to ? 0 : 1); this.fx.fade = { from, to, t0: this.now, ms: ms / 1000, a: from }; await this.until(() => !this.fx.fade || this.fx.fade.a === to); }
  /* objet lancé : de (x0,y0) vers (x1,y1) avec un arc */
  async fly(sprName, [x0, y0], [x1, y1], ms = 500, arc = 30, spin = 0) {
    const e = { id: 'fly', spr: sprName, x: x0, y: y0, scale: 1, visible: true, fly: true, rot: 0, noHot: true }; this.ents.push(e);
    const t0 = this.now, d = ms / 1000;
    await this.until(() => { const t = Math.min(1, (this.now - t0) / d); e.x = x0 + (x1 - x0) * t; e.y = y0 + (y1 - y0) * t - Math.sin(t * Math.PI) * arc; e.rot = spin * t; return t >= 1; });
    this.ents = this.ents.filter(x => x !== e); this.chk();
  }
  async end(pre = 'end') { /* fin du chapitre */
    await this.fade(1, 1200); clearSave(); this.started = false; const d = el('div', 'pc-title socle'), c = el('div', 'pc-card'); const T = this.T;
    c.append(el('h1', '', T(pre + '.title')), el('p', '', T(pre + '.sub')), el('p', 'pc-fine', T('end.love')));
    const row = el('div', 'pc-btns'), a = el('button', 'sbtn acc', T('end.again')); a.onclick = () => { d.remove(); this.newGame(); }; row.append(a); c.append(row); d.append(c); this.stage.append(d); this.titleEl = d; snd.jingle();
  }

  /* ───────── actions ───────── */
  pick(x, y) {
    for (const a of this.amb || []) if (a.hit && a.hit(x, y)) return { id: a.id, name: 'n.' + a.id };
    const es = this.ents.filter(e => e.visible !== false && e.hot && !e.noHot).sort((a, b) => b.y - a.y);
    for (const e of es) { const r = e.hit || this.entRect(e); if (r && x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3]) return { id: e.id, name: 'n.' + e.id, at: e.at || [e.x, e.y + 4], isEnt: true }; }
    for (let i = this.hot.length - 1; i >= 0; i--) { const h = this.hot[i], r = h.rect; if (r ? (x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3]) : hitPoly(x, y, h.poly)) return { id: h.id, name: 'n.' + h.id, at: h.at, dir: h.dir }; }
    return null;
  }
  entRect(e) { const im = this.spr(e.spr); if (!im) return null; const s = e.scale ?? this.persp(e.y), w = im.width * s, h = im.height * s; return [e.x - w / 2, e.y - h, e.x + w / 2, e.y]; }
  onDown(e) {
    if (e.button === 2 || this.locked || this.titleEl) { if (this.locked) this.skip = true; return; }
    this.popEl.hidden = true; snd.unlock();
    const p = this.pos(e), tg = this.pick(...p);
    if (e.pointerType === 'touch' && tg && !(this.verb === 'use' && this.sel)) return this.showPop(e, tg);
    this.setHover(tg);
    if (!tg) { this.sel = null; this.renderInv(); return this.input(() => this.walkTo(p[0], p[1])); }
    if (tg.id === 'hero' && this.verb === 'use' && !this.sel) return this.input(() => this.act('look', tg));
    this.input(() => this.act(this.verb, tg, this.verb === 'use' ? this.sel : null));
  }
  showPop(e, tg) {
    const p = this.popEl; p.innerHTML = ''; const r = this.stage.getBoundingClientRect();
    VERBS.slice(1).forEach(v => { const b = el('button', '', this.T('v.' + v)); b.onclick = ev => { ev.stopPropagation(); p.hidden = true; this.input(() => this.act(v, tg)); }; p.append(b); });
    p.style.left = clamp(e.clientX - r.left, 60, r.width - 60) + 'px'; p.style.top = clamp(e.clientY - r.top, 70, r.height - 10) + 'px'; p.hidden = false; this.setHover(tg);
  }
  onItem(id) {
    snd.click();
    if (this.locked) return;
    if (this.verb === 'use') { if (!this.sel) { this.sel = id; this.renderInv(); this.renderLine(); return; } if (this.sel === id) { this.sel = null; this.renderInv(); this.renderLine(); return; } const it = this.sel; this.sel = null; this.renderInv(); return this.input(() => this.act('use', { id, name: 'n.' + id, isItem: true }, it)); }
    this.input(() => this.act(this.verb === 'walk' ? 'look' : this.verb, { id, name: 'n.' + id, isItem: true }));
  }
  async act(verb, tg, item) {
    if (!tg.at && !tg.isItem && !tg.isEnt && verb !== 'look' && verb !== 'walk') { const done = this.scene.on && await this.scene.on(this, verb, tg.id, item); if (!done) await this.fallbackFar(verb, tg); return; }
    if (verb === 'walk') { if (!tg.at) { await this.say('hero', 'def.far'); return; } await this.walkTo(...tg.at); this.face(tg.at[0] + (tg.dir === 'l' ? -9 : 9)); if (this.scene.on) await this.scene.on(this, 'walk', tg.id); return; }
    if (verb !== 'look' && !tg.isItem && tg.at) { await this.walkTo(...tg.at); const cx = tg.isEnt && this.ent(tg.id) ? this.ent(tg.id).x : tg.at[0] + (tg.dir === 'l' ? -9 : 9); this.face(cx); }
    const sc = this.scene; let done = false;
    if (sc.on) done = await sc.on(this, verb, tg.id, item);
    if (!done) await this.fallback(verb, tg, item);
    this.save();
  }
  async fallbackFar(verb, tg) { const T = this.T, k = verb === 'talk' ? 'talk.' + tg.id : verb === 'take' ? 'take.' + tg.id : 'use.' + tg.id; await this.say('hero', T.has(k) ? k : 'def.far'); }
  async fallback(verb, tg, item) {
    const T = this.T; let k;
    if (verb === 'look') k = ['look.' + tg.id, 'def.look'];
    else if (verb === 'take') k = tg.isItem ? ['def.takeItem'] : ['take.' + tg.id, 'def.take'];
    else if (verb === 'talk') k = ['talk.' + tg.id, 'def.talk'];
    else if (item) k = [`use.${item}.${tg.id}`, `use.${tg.id}.${item}`, item === tg.id ? 'def.useSelf' : 'def.useWith'];
    else k = ['use.' + tg.id, 'def.use'];
    const key = k.find(x => T.has(x)); await this.say('hero', key);
  }
  key(e) {
    if (this.titleEl) return;
    if (e.key >= '1' && e.key <= '5') this.setVerb(VERBS[+e.key - 1]);
    else if (e.key === ' ' || e.key === 'Enter') { this.skip = true; e.preventDefault(); }
    else if (e.key === 'Escape') this.showTitle(true);
  }

  /* ───────── mise à jour et rendu ───────── */
  update(dt) {
    this.now += dt; const h = this.hero;
    if (h && this.scene) {
      let moving = false;
      if (h.path.length) {
        const [tx, ty] = h.path[0], dx = tx - h.x, dy = ty - h.y, dist = Math.hypot(dx, dy), s = this.persp(h.y), step = 78 * s * dt + 6 * dt; moving = true;
        if (Math.abs(dx) > 0.2) { h.dir = dx > 0 ? 'r' : 'l'; h.front = false; }
        if (dist <= step) { h.x = tx; h.y = ty; h.path.shift(); } else { h.x += dx / dist * step; h.y += dy / dist * step; }
        h.walkD += step;
      }
      const s = this.persp(h.y);
      h.flip = h.dir === 'l' && !h.front;
      if (moving) { h.spr = Math.floor(h.walkD / (11 * s)) % 2 ? 'hero.stride' : 'hero.side'; h.bob = Math.abs(Math.sin(h.walkD / (11 * s) * Math.PI)) * 2.4 * s; if (this.now >= (h.stepT || 0)) { snd.step(); h.stepT = this.now + 0.3; } }
      else { h.spr = h.front || h.talk ? 'hero.front' : 'hero.side'; h.bob = 0; }
    }
    this.ents.forEach(e => {
      if (e.goal) { const [gx, gy, sp] = e.goal, dx = gx - e.x, dy = gy - e.y, d = Math.hypot(dx, dy), st = sp * dt; if (d <= st) { e.x = gx; e.y = gy; e.goal = null; } else { e.x += dx / d * st; e.y += dy / d * st; } }
      if (e.talk && this.now >= this.nextBlip) { snd.blip(e.talk); this.nextBlip = this.now + 0.07; }
    });
    if (this.scene && this.scene.tick) this.scene.tick(this, dt);
    for (let i = this.waiters.length - 1; i >= 0; i--) { const w = this.waiters[i]; if (w.cond()) { this.waiters.splice(i, 1); w.res(); } }
    const f = this.fx.fade; if (f) { const t = clamp((this.now - f.t0) / f.ms, 0, 1); f.a = f.from + (f.to - f.from) * t; if (t >= 1) { f.a = f.to; if (f.to === 0) delete this.fx.fade; } }
  }
  draw() {
    const c = this.ctx; if (!c || !this.scene || !this.bg || !this.bg.width) { if (c) { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); } return; }
    c.save(); const sh = this.fx.shake; if (sh && this.now < sh.end) c.translate(Math.round((Math.random() - .5) * sh.amp * 2), Math.round((Math.random() - .5) * sh.amp * 2));
    if (this.bg) c.drawImage(this.bg, 0, 0, W, H);
    if (this.amb) this.amb.forEach(a => a.draw(this, c, this.now));
    [...this.ents].filter(e => e.visible !== false).sort((a, b) => (a.y + (a.z || 0)) - (b.y + (b.z || 0))).forEach(e => this.drawEnt(e));
    (this.scene.fg || []).forEach(p => { c.save(); c.beginPath(); p.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.clip(); c.drawImage(this.bg, 0, 0, W, H); c.restore(); });
    c.restore();
    if (this.fx.fade) { c.fillStyle = `rgba(0,0,0,${this.fx.fade.a})`; c.fillRect(0, 0, W, H); }
  }
  drawEnt(e) {
    const im = this.spr(e.spr); if (!im) return; const c = this.ctx, s = e.scale ?? this.persp(e.y), w = im.width * s, h = im.height * s;
    c.save(); c.translate(Math.round(e.x), Math.round(e.y - (e.bob || 0)));
    if (e.rot) { c.translate(0, -h / 2); c.rotate(e.rot); c.translate(0, h / 2); }
    if (e.flip) c.scale(-1, 1);
    if (e.talk) c.scale(1, 1 + 0.018 * Math.sin(this.now * 26));
    c.drawImage(im, Math.round(-w / 2), Math.round(-h), Math.round(w), Math.round(h)); c.restore();
  }
}
