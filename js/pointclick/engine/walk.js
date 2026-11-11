/* Zone de marche : polygones, recherche de chemin A* sur une grille, lissage. */
const C = 3; // taille d'une case en pixels du jeu
const inPoly = (x, y, p) => { let r = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, yi] = p[i], [xj, yj] = p[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) r = !r; } return r; };
export const hitPoly = inPoly;

export class Walk {
  constructor(polys, w, h) { this.polys = polys; this.gw = Math.ceil(w / C); this.gh = Math.ceil(h / C); this.build(); }
  build() {
    this.ok = new Uint8Array(this.gw * this.gh);
    for (let j = 0; j < this.gh; j++) for (let i = 0; i < this.gw; i++) this.ok[j * this.gw + i] = this.polys.some(p => inPoly(i * C + C / 2, j * C + C / 2, p)) ? 1 : 0;
  }
  add(poly) { this.polys.push(poly); this.build(); }
  free(i, j) { return i >= 0 && j >= 0 && i < this.gw && j < this.gh && this.ok[j * this.gw + i] === 1; }
  inside(x, y) { return this.free(Math.floor(x / C), Math.floor(y / C)); }
  /* case libre la plus proche d'un point */
  snap(x, y) {
    const ci = Math.floor(x / C), cj = Math.floor(y / C); let best = null, bd = 1e9;
    for (let r = 0; r < 60 && !best; r++) for (let j = cj - r; j <= cj + r; j++) for (let i = ci - r; i <= ci + r; i++) {
      if (Math.max(Math.abs(i - ci), Math.abs(j - cj)) !== r || !this.free(i, j)) continue;
      const d = (i - ci) ** 2 + (j - cj) ** 2; if (d < bd) { bd = d; best = [i, j]; }
    }
    return best;
  }
  los(a, b) { const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 2); for (let k = 0; k <= n; k++) { const t = k / n; if (!this.inside(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)) return false; } return true; }
  path(from, to) {
    const s = this.snap(from[0], from[1]), g = this.snap(to[0], to[1]); if (!s || !g) return [];
    const goal = [g[0] * C + C / 2, g[1] * C + C / 2], start = [from[0], from[1]];
    if (this.los(start, goal)) return [goal];
    const key = (i, j) => j * this.gw + i, open = [[0, s[0], s[1]]], came = new Map([[key(...s), null]]), cost = new Map([[key(...s), 0]]);
    while (open.length) {
      open.sort((a, b) => a[0] - b[0]); const [, ci, cj] = open.shift();
      if (ci === g[0] && cj === g[1]) break;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const ni = ci + di, nj = cj + dj; if (!this.free(ni, nj)) continue;
        if (di && dj && (!this.free(ci + di, cj) || !this.free(ci, cj + dj))) continue;
        const nc = cost.get(key(ci, cj)) + (di && dj ? 1.41 : 1), k = key(ni, nj);
        if (!cost.has(k) || nc < cost.get(k)) { cost.set(k, nc); came.set(k, [ci, cj]); open.push([nc + Math.hypot(g[0] - ni, g[1] - nj), ni, nj]); }
      }
    }
    if (!came.has(key(...g))) return [];
    const pts = []; for (let c = g; c; c = came.get(key(...c))) pts.unshift([c[0] * C + C / 2, c[1] * C + C / 2]);
    pts[pts.length - 1] = goal;
    const out = [pts[0]]; let a = start, i = 0; /* lissage : on saute les points intermédiaires visibles */
    const res = []; let cur = start;
    while (i < pts.length) { let far = i; for (let k = pts.length - 1; k > i; k--) if (this.los(cur, pts[k])) { far = k; break; } res.push(pts[far]); cur = pts[far]; i = far + 1; }
    return res;
  }
}
