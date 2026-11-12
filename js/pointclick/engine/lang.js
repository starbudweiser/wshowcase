/* Textes du jeu : un fichier par langue (lang/fr.js, lang/en.js), mêmes clés. Une valeur peut être un tableau : réplique tirée au hasard. */
const cache = {};
export async function loadLang(l) {
  const code = l === 'fr' ? 'fr' : 'en';
  if (!cache[code]) cache[code] = (await import(`../lang/${code}.js`)).default;
  if (!cache.fr) cache.fr = (await import('../lang/fr.js')).default;
  return cache[code];
}
export function makeT(dict, fallback = cache.fr) {
  const raw = k => dict[k] ?? (fallback && fallback[k]);
  const t = (k, vars) => {
    let s = raw(k); if (s == null) return k;
    t.idx = -1; if (Array.isArray(s)) { t.idx = Math.floor(Math.random() * s.length); s = s[t.idx]; }
    if (vars) for (const [a, b] of Object.entries(vars)) s = s.replaceAll(`{${a}}`, b);
    return s;
  };
  t.has = k => raw(k) != null;
  return t;
}
