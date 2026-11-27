#!/usr/bin/env node
/* Vérificateur anti-blocage du point & click « Le Seau de Rivebois » (ESSAI, 27/11/2026). Node seul, sans dépendance.
   Les énigmes sont écrites en JS dans les scènes (scene.on(g, verbe, cible, objet)) : pas de graphe déclaré à lire. Le vérificateur
   charge donc les VRAIES scènes avec un faux moteur (aucun dessin, aucun son ; engine/*.js remplacé par des bouchons, sauf l'appel
   peak() des éclairs, qui porte les métamorphoses), puis explore en largeur tous les états atteignables d'un chapitre :
   chaque verbe (regarder, parler, prendre, utiliser, aller) sur chaque cible (zones, personnages, objets de l'inventaire), chaque
   objet sur chaque cible, et chaque branche des choix de dialogue (g.ask).
   État = salle + drapeaux + inventaire + personnages (visible, actif, sprite) + propriétés propres de l'objet scène.
   Signale : états d'où la sortie du chapitre est devenue impossible (blocage), objets jamais obtenus, drapeaux jamais posés,
   dialogues sans fin, actions qui plantent, répliques sans texte (fr / en).
   Usage : node check_softlock.mjs [s1|s2|<id de chapitre>…] [--max 20000] [--json sortie.json]
   Limites : l'état interne aux modules des scènes (variables `let` hors de l'objet scène) n'est pas remis à zéro entre deux
   branches ; le temps (g.now) avance à chaque attente ; les événements des tick() ne sont pas joués (ils sont visuels). */
import { register } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { writeFileSync } from 'node:fs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GAME = path.resolve(HERE, '../../../js/pointclick');

/* bouchons des modules du moteur : chaque export devient une fonction « trou noir » ; les options { peak } sont appelées */
const HOOKS = `
import { readFile } from 'node:fs/promises'; import { fileURLToPath } from 'node:url';
export async function load(url, ctx, next) {
  if (/\\/js\\/pointclick\\/engine\\/[^/]+\\.js$/.test(url)) {
    const src = await readFile(fileURLToPath(url), 'utf8'), names = new Set();
    for (const m of src.matchAll(/^export\\s+(?:async\\s+)?(?:function\\*?|const|let|var|class)\\s+([A-Za-z_$][\\w$]*)/gm)) names.add(m[1]);
    for (const m of src.matchAll(/^export\\s*\\{([^}]*)\\}/gm)) for (const p of m[1].split(',')) { const n = p.trim().split(/\\s+as\\s+/).pop(); if (n) names.add(n); }
    let out = 'const stub = globalThis.__pcStub;\\n'; for (const n of names) out += 'export const ' + n + ' = stub(' + JSON.stringify(n) + ');\\n';
    if (/^export default/m.test(src)) out += 'export default stub("default");\\n';
    return { format: 'module', source: out, shortCircuit: true };
  }
  return next(url, ctx);
}`;
process.removeAllListeners('warning');
register('data:text/javascript,' + encodeURIComponent(HOOKS), import.meta.url);

globalThis.Image = class { set src(v) { this._s = v; queueMicrotask(() => this.onload && this.onload()); } get src() { return this._s; } };
globalThis.document = BH0();
function BH0() { return new Proxy(function () {}, { get: (t, k) => (k === "then" ? undefined : BH0()), apply: () => BH0() }); }
const BH = new Proxy(function () {}, {
  get: (t, k) => (k === 'then' ? undefined : k === Symbol.toPrimitive ? () => 0 : k === Symbol.iterator ? function* () {} : k === 'length' ? 0 : BH),
  apply: () => BH, construct: () => BH, set: () => true
});
globalThis.__pcStub = () => (...a) => { for (const x of a) if (x && typeof x === 'object' && typeof x.peak === 'function') x.peak(); return BH; };

/* hasard reproductible : chaque action rejouée tire les mêmes nombres */
let seed = 1; const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff); Math.random = rnd;
/* les setTimeout des scènes (passage à la salle suivante) sont mis en file et joués après l'action */
let queue = []; const realST = globalThis.setTimeout; globalThis.setTimeout = fn => { queue.push(fn); return 0; };

const { CHAPTERS, CHAPTERS2 } = await import(pathToFileURL(path.join(GAME, 'scenes/index.js')));
const FR = (await import(pathToFileURL(path.join(GAME, 'lang/fr.js')))).default;
const EN = (await import(pathToFileURL(path.join(GAME, 'lang/en.js')))).default;
const modCache = {};
const loadScene = async id => (modCache[id] ||= (await import(pathToFileURL(path.join(GAME, `scenes/${id}.js`)))).default);
const chapterOf = id => (id.match(/^(s2_\d+[gk]?)[bc]?$/) || [, id])[1];

class Branch { constructor(n, keys) { this.n = n; this.keys = keys; } }
class Runaway extends Error {}
class Prune {}
class Win { constructor(to) { this.to = to; } }

/* copie profonde des données (les fonctions sont gardées telles quelles) */
const clone = (v, seen = new Map()) => {
  if (v === null || typeof v !== 'object') return v; if (seen.has(v)) return seen.get(v);
  if (Array.isArray(v)) { const a = []; seen.set(v, a); v.forEach(x => a.push(clone(x, seen))); return a; }
  if (Object.getPrototypeOf(v) !== Object.prototype) return v;
  const o = {}; seen.set(v, o); for (const k of Object.keys(v)) o[k] = clone(v[k], seen); return o;
};

const missing = new Map(), unknownApi = new Set(), crashes = [], loops = [];
function makeG(lang) {
  const dict = lang === 'fr' ? FR : EN;
  const T = (k, vars) => { let s = dict[k] ?? FR[k]; if (s == null) return k; if (Array.isArray(s)) s = s[0]; return s; };
  T.has = k => (dict[k] ?? FR[k]) != null;
  const g = {
    lang, s2retro: false, locked: false, alive: true, started: true, night: null, now: 0, fx: {}, parts: [], bubbles: [], barks: [], imgs: {}, T, ents: [], hot: [],
    st: { scene: null, flags: {}, inv: [] }, gotI: new Set(), gotF: new Set(), steps: 0, choices: [], ci: 0, said: [],
    tickle() { if (++this.steps > 4000) throw new Runaway('plus de 4000 étapes dans une seule action'); },
    flag(k) { return this.st.flags[k]; }, set(k, v = true) { this.st.flags[k] = v; this.gotF.add(k); }, count(k, d = 1) { return (this.st.flags[k] = (this.st.flags[k] || 0) + d); },
    has(id) { return this.st.inv.includes(id); }, give(id) { this.gotI.add(id); if (!this.has(id)) this.st.inv.push(id); }, drop(id) { this.st.inv = this.st.inv.filter(x => x !== id); },
    ent(id) { return this.ents.find(e => e.id === id); }, chk() {}, sfx() {}, face() {}, shake() {}, addWalk() {}, narrate() {}, bark() {}, clearBarks() {}, hushNarr() {}, lightUp() {}, save() {}, renderInv() {}, renderPanel() {}, renderLine() {},
    async until() { this.tickle(); }, async wait(ms = 0) { this.tickle(); this.now += ms / 1000; },
    async cut(fn) { this.tickle(); return fn(); }, async run(fn) { this.tickle(); return fn(); }, input(fn) { queue.push(fn); },
    async say(who, key) {
      this.tickle(); this.now += 1;
      if (typeof key === 'string' && !(key in FR) && !(key in EN)) { const s = this.st.scene; if (!missing.has(key)) missing.set(key, s); }
      else if (typeof key === 'string' && !(key in dict)) { if (!missing.has(key + ' (' + lang + ')')) missing.set(key + ' (' + lang + ')', this.st.scene); }
    },
    async ask(keys) {
      this.tickle(); const sig = key(snap(this)) + '#' + keys.join(',');   /* retour au même menu sans rien de changé : branche inutile */
      if (this.asked.has(sig)) throw new Prune(); this.asked.add(sig);
      if (this.ci < this.choices.length) return this.choices[this.ci++]; throw new Branch(keys.length, keys); },
    async fade(to) { this.tickle(); this.fx.fade = { a: to }; }, async card() { this.tickle(); }, async fly() { this.tickle(); },
    async walkTo(x, y) { this.tickle(); if (this.hero) { this.hero.x = x; this.hero.y = y; } },
    async walkEnt(id, x, y) { this.tickle(); const e = this.ent(id); if (e) { e.x = x; e.y = y; e.goal = null; } },
    approach(tg) { return tg.at || [tg.x || 240, tg.y || 220]; }, entRect(e) { return e ? [e.x - 10, e.y - 40, e.x + 10, e.y] : null; }, headPos(e) { return [e.x, e.y - 40]; },
    persp() { return 1; }, sc() { return 1; }, spr() { return { width: 10, height: 10 }; }, img() { return Promise.resolve(null); }, bgPath(sc) { return sc.bg; },
    async end(pre) { this.winTo ||= 'fin:' + pre; },
    async goScene(id, how = {}) {
      this.tickle();
      if (chapterOf(id) !== this.chapter) { this.winTo ||= id; return; }
      const sc = await loadScene(id); this.st.scene = id; this.scene = sc; this.hot = sc.hot || [];
      this.ents = (sc.ents || []).map(e => ({ visible: true, ph: 0, ...clone(e) }));
      const st = sc.start || { x: 240, y: 230 }; this.hero = { id: 'hero', who: 'hero', x: st.x, y: st.y, dir: st.dir || 'r', path: [], walkD: 0, hot: true, isHero: true, visible: true }; this.ents.push(this.hero);
      if (sc.enter) await sc.enter(this, how);
      if (how.intro && sc.intro) queue.push(() => this.cut(() => sc.intro(this, how)));
    }
  };
  return new Proxy(g, { get: (t, k) => { if (k in t) return t[k]; if (typeof k === 'string') unknownApi.add(k); return BH; } });
}

/* instantané et clé d'un état */
const scenePropsOf = sc => Object.fromEntries(Object.entries(sc).filter(([k, v]) => typeof v !== 'function' && !STATIC.has(k)));
const STATIC = new Set(['id', 'hd', 'bg', 'music', 'amb', 'steps', 'persp', 'walkK', 'blockR', 'light', 'walk', 'fg', 'start', 'video', 'fx', 'hot', 'preload', 'ents', 'ambient', 'interior']);
const snap = g => ({ scene: g.st.scene, flags: clone(g.st.flags), inv: [...g.st.inv], ents: clone(g.ents), hero: g.ents.indexOf(g.hero), sp: clone(scenePropsOf(g.scene)), fx: clone(g.fx), now: g.now });
async function restore(g, s) {
  const sc = await loadScene(s.scene); g.scene = sc; g.hot = sc.hot || []; g.st.scene = s.scene; g.st.flags = clone(s.flags); g.st.inv = [...s.inv];
  g.ents = clone(s.ents); g.hero = g.ents[s.hero]; for (const k of Object.keys(scenePropsOf(sc))) delete sc[k]; Object.assign(sc, clone(s.sp)); g.fx = clone(s.fx); g.now = s.now;
}
const key = s => {
  const f = Object.keys(s.flags).sort().map(k => { const v = s.flags[k]; return k + '=' + (typeof v === 'number' ? (v > 12 ? 12 + (v % 12) : v) : JSON.stringify(v)); }).join(',');
  const e = s.ents.filter((x, i) => i !== s.hero).map(x => `${x.id}:${x.visible !== false ? 1 : 0}${x.hot ? 1 : 0}:${x.spr || ''}`).sort().join(',');
  let sp = ''; try { sp = JSON.stringify(s.sp, (k, v) => (typeof v === 'number' ? undefined : v));   /* nombres des scènes = horloges (catT…) : hors clé */ } catch { sp = '?'; }
  return `${s.scene}|${f}|${[...s.inv].sort().join(',')}|${e}|${sp}`;
};

/* une action, rejouée pour chaque branche de dialogue ; renvoie la liste des issues */
async function runAll(g, from, act, label, out, choices = [], depth = 0) {
  if (depth > 14) { loops.push({ chapter: g.chapter, scene: from && from.scene, action: label, why: 'plus de 14 choix de dialogue enchaînés (dialogue sans fin ?)' }); return; }
  if (from) await restore(g, from);
  seed = 7; queue = []; g.steps = 0; g.choices = choices; g.ci = 0; g.asked = new Set(); g.winTo = null;
  try {
    await act();
    while (queue.length && !g.winTo) await queue.shift()();
    if (g.winTo) throw new Win(g.winTo);
    out.push({ s: snap(g), choices, label });
  } catch (e) {
    if (e instanceof Branch) { for (let i = 0; i < e.n; i++) await runAll(g, from, act, label, out, [...choices, i], depth + 1); return; }
    if (e instanceof Prune) return;
    if (e instanceof Win) { out.push({ win: e.to, choices, label }); return; }
    if (e instanceof Runaway) { loops.push({ chapter: g.chapter, scene: from && from.scene, action: label, why: e.message }); return; }
    crashes.push({ chapter: g.chapter, scene: from && from.scene, action: label, choices, err: String(e && e.stack || e).split('\n').slice(0, 3).join(' | ') });
  }
}

function actionsOf(g) {
  const sc = g.scene, A = [], inv = g.st.inv.filter(x => x !== 'lamp');
  /* cibles cliquables : décors animés qui ont une zone (dragon, objet en orbite), personnages actifs, zones fixes */
  const amb = (sc.ambient || []).filter(o => ['dragon', 'orbit'].includes(o.type) || o.perch).map(o => ({ id: o.id || (o.type === 'dragon' ? 'dragon' : 'satellite'), at: false }));
  const tg = [...amb, ...[...new Map((sc.hot || []).map(h => [h.id, { id: h.id, at: !!h.at }])).values()], ...g.ents.filter(e => e !== g.hero && e.hot && !e.noHot && e.visible !== false).map(e => ({ id: e.id, at: true }))];
  const on = (v, id, item) => async () => { if (sc.on) await sc.on(g, v, id, item); };
  for (const t of tg) {
    for (const v of ['look', 'talk', 'take', 'use']) A.push([`${v} ${t.id}`, on(v, t.id)]);
    if (t.at) A.push([`walk ${t.id}`, on('walk', t.id)]);
    for (const it of inv) A.push([`use ${it} -> ${t.id}`, on('use', t.id, it)]);
  }
  for (const it of inv) {
    A.push([`look ${it} (inv)`, on('look', it)], [`take ${it} (inv)`, on('take', it)]);
    for (const it2 of inv) if (it2 !== it) A.push([`use ${it2} -> ${it} (inv)`, on('use', it, it2)]);
    A.push([`use ${it} -> hero`, on('use', 'hero', it)]);
  }
  return A;
}

/* sources des scènes d'un chapitre : objets donnés et drapeaux posés, pour repérer ce qui n'arrive jamais */
import { readFileSync, readdirSync } from 'node:fs';
function staticRefs(ch) {
  const files = readdirSync(path.join(GAME, 'scenes')).filter(f => f.endsWith('.js') && chapterOf(f.slice(0, -3)) === ch);
  const gives = new Set(), sets = new Set();
  for (const f of files) {
    const src = readFileSync(path.join(GAME, 'scenes', f), 'utf8');
    for (const m of src.matchAll(/g\.give\('([^']+)'\)/g)) gives.add(m[1]);
    for (const m of src.matchAll(/g\.set\('([^']+)'/g)) sets.add(m[1]);
  }
  return { files, gives, sets };
}

async function checkChapter(ch, max) {
  const lang = ch.lang || 'fr', g = makeG(lang); g.chapter = ch.id;
  const t0 = Date.now(), seen = new Map(), edges = new Map(), parent = new Map(), wins = new Map();
  const starts = []; g.st = { scene: ch.id, flags: { ...ch.flags }, inv: ['lamp', ...ch.inv.filter(x => x !== 'lamp')] };
  await runAll(g, null, () => g.goScene(ch.id, { intro: true }), 'entrée du chapitre', starts);
  const todo = [];
  const add = (from, o) => {
    if (o.win) { if (from) { if (!wins.has(from)) wins.set(from, o.label + ' ⇒ ' + o.win); edges.get(from).add('WIN'); } return; }
    const k = key(o.s);
    if (from) edges.get(from).add(k);
    if (!seen.has(k)) { seen.set(k, o.s); edges.set(k, new Set()); parent.set(k, from ? [from, o.label + (o.choices.length ? ` [choix ${o.choices.join('.')}]` : '')] : null); todo.push(k); }
  };
  let startWin = false; for (const o of starts) { if (o.win) startWin = true; else add(null, o); }
  let truncated = false;
  if (process.env.DIAG) process.on('exit', () => { const ks = [...seen.keys()].slice(-6); console.error(ks.join('\n')); });
  while (todo.length) {
    if (seen.size > max) { truncated = true; break; }
    const k = todo.shift(), s = seen.get(k); await restore(g, s);
    for (const [label, act] of actionsOf(g)) { if (process.env.TRACE) process.stderr.write(`  [${seen.size}/${todo.length}] ${s.scene} ${label}\n`); const out = []; await runAll(g, s, act, label, out); out.forEach(o => add(k, o)); }
  }
  /* qui peut encore gagner : remontée depuis les états gagnants */
  const rev = new Map(); for (const [a, bs] of edges) for (const b of bs) { if (!rev.has(b)) rev.set(b, []); rev.get(b).push(a); }
  const good = new Set(), st = ['WIN']; while (st.length) { const x = st.pop(); for (const p of rev.get(x) || []) if (!good.has(p)) { good.add(p); st.push(p); } }
  const pathTo = k => { const p = []; let c = k; while (parent.get(c)) { const [f, l] = parent.get(c); p.unshift(l); c = f; } return p; };
  const winPath = () => { const w = [...wins].map(([k, l]) => [...pathTo(k), l]).sort((a, b) => a.length - b.length)[0]; return w || []; };
  const dead = truncated ? [] : [...seen.keys()].filter(k => !good.has(k));
  /* un blocage par cause : on garde les états bloqués dont le parent ne l'était pas (l'action fautive) */
  const roots = dead.filter(k => { const p = parent.get(k); return !p || good.has(p[0]); }).map(k => ({ path: pathTo(k), scene: seen.get(k).scene, inv: seen.get(k).inv.filter(x => x !== 'lamp'), flags: Object.keys(seen.get(k).flags) }));
  roots.sort((a, b) => a.path.length - b.path.length);
  const ref = staticRefs(ch.id);
  return {
    id: ch.id, lang, states: seen.size, truncated, winnable: startWin || good.size > 0 || wins.size > 0, wins: wins.size, deadStates: dead.length, softlocks: roots.slice(0, 8), softlockCount: roots.length,
    neverItems: [...ref.gives].filter(i => !g.gotI.has(i) && !ch.inv.includes(i)), neverFlags: [...ref.sets].filter(f => !g.gotF.has(f)), winPath: winPath(), ms: Date.now() - t0
  };
}

/* ───── main ───── */
const args = process.argv.slice(2); let max = 20000, json = null; const pick = [];
for (let i = 0; i < args.length; i++) { if (args[i] === '--max') max = +args[++i]; else if (args[i] === '--json') json = args[++i]; else pick.push(args[i]); }
let list = [...CHAPTERS, ...CHAPTERS2.filter(c => c.built)];
if (pick.length) list = list.filter(c => pick.includes(c.id) || (pick.includes('s1') && !c.id.startsWith('s2_')) || (pick.includes('s2') && c.id.startsWith('s2_')));
const res = [];
for (const ch of list) {
  const r = await checkChapter(ch, max); res.push(r);
  const tag = r.truncated ? 'TRONQUÉ' : !r.winnable ? 'IMPOSSIBLE À FINIR' : r.softlockCount ? `${r.softlockCount} BLOCAGE(S)` : 'ok';
  console.log(`${r.id.padEnd(9)} ${String(r.states).padStart(6)} états  ${(r.ms / 1000).toFixed(1).padStart(5)} s  ${tag}`);
  for (const s of r.softlocks.slice(0, 3)) console.log(`   ↳ bloqué en ${s.scene} après : ${s.path.slice(-4).join(' › ')}${s.path.length > 4 ? ` (${s.path.length} actions)` : ''}`);
  if (process.env.WIN) console.log('   solution : ' + r.winPath.join(' › '));
  if (r.neverItems.length) console.log(`   objets jamais obtenus : ${r.neverItems.join(', ')}`);
  if (r.neverFlags.length) console.log(`   drapeaux jamais posés : ${r.neverFlags.join(', ')}`);
}
const cr = [...new Map(crashes.map(c => [c.chapter + c.err, c])).values()];
if (cr.length) { console.log(`\nActions qui plantent (${cr.length} causes) :`); cr.slice(0, 20).forEach(c => console.log(`  ${c.chapter} / ${c.scene} / ${c.action} : ${c.err.slice(0, 220)}`)); }
const lp = [...new Map(loops.map(l => [l.chapter + l.action, l])).values()];
if (lp.length) { console.log(`\nDialogues ou actions sans fin (${lp.length}) :`); lp.slice(0, 20).forEach(l => console.log(`  ${l.chapter} / ${l.scene} / ${l.action} : ${l.why}`)); }
if (missing.size) { console.log(`\nRépliques sans texte (${missing.size}) :`); [...missing].slice(0, 40).forEach(([k, s]) => console.log(`  ${s} : ${k}`)); }
if (json) writeFileSync(json, JSON.stringify({ chapters: res, crashes: cr, loops: lp, missing: [...missing], unknownApi: [...unknownApi] }, null, 1));
