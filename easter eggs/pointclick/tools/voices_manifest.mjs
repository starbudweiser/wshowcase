// Liste des répliques à doubler : clé, variante, langue, personnage (déduit des appels say/bark du code), texte nettoyé.
// Usage : node voices_manifest.mjs  -> easter eggs/pointclick/work/voices.json
import fs from 'fs'; import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const fr = (await import(pathToFileURL(R + '/js/pointclick/lang/fr.js'))).default, en = (await import(pathToFileURL(R + '/js/pointclick/lang/en.js'))).default;
const files = [...fs.readdirSync(R + '/js/pointclick/scenes').filter(f => f.endsWith('.js')).map(f => R + '/js/pointclick/scenes/' + f), R + '/js/pointclick/engine/game.js'];
const exact = {}, prefix = [];
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  for (const m of s.matchAll(/(?:say|bark)\(\s*(['"])([\w.]+)\1\s*,\s*(['"])([^'"]+)\3(\s*\+)?/g)) { if (m[5]) prefix.push([m[4], m[2]]); else exact[m[4]] = m[2]; }
}
const rules = [[/^nar\./, 'narr'], [/^blind\.(dark|talk\.n|wow\d)$/, 'blind'], [/^blind\.sing\./, 'blind'], [/^blind\.(talk\.h|after|\w+\.\d)$/, 'hero'], [/^s10\.(p\w+)$/, null], [/^(look|take|use|talk|def)\./, 'hero']];
const skip = /^(n\.|v\.|ui\.|ch\.|ach\.|end\d*\.|end$)/;
const extra = { 's3.giant.talk1': 'giant', 's3.giant.talk2': 'giant', 's.bridge1': 'guard', 's.bridge2': 'guard', 's.bridge1h': 'hero', 's.bridge2h': 'hero' };
const who = k => {
  if (extra[k]) return extra[k];
  if (exact[k]) return exact[k];
  const p = prefix.filter(([pre]) => k.startsWith(pre)).sort((a, b) => b[0].length - a[0].length)[0]; if (p) return p[1];
  for (const [re, w] of rules) { const m = k.match(re); if (m) return w === null ? m[1] : w; }
  return null;
};
const clean = t => t.replace(/[♪♫]/g, '').replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
const out = [], unmapped = [];
for (const [lang, L] of [['fr', fr], ['en', en]]) for (const [k, v] of Object.entries(L)) {
  if (skip.test(k)) continue; const arr = Array.isArray(v) ? v : [v]; let w = who(k);
  if (!w) { unmapped.push(k); continue; } if (w === 'rider') w = 'hero';
  arr.forEach((t, i) => { if (typeof t === 'string' && !/\{\w+\}/.test(t) && clean(t).length > 1) out.push({ key: k, idx: Array.isArray(v) ? i : -1, lang, who: w, text: clean(t) }); });
}
fs.mkdirSync(R + '/easter eggs/pointclick/work', { recursive: true });
fs.writeFileSync(R + '/easter eggs/pointclick/work/voices.json', JSON.stringify(out));
const by = {}; out.filter(o => o.lang === 'fr').forEach(o => by[o.who] = (by[o.who] || 0) + 1);
console.log('répliques', out.length, 'chars', out.reduce((a, o) => a + o.text.length, 0)); console.log(JSON.stringify(by)); console.log('non classées:', [...new Set(unmapped)].length, [...new Set(unmapped)].slice(0, 25).join(' '));
