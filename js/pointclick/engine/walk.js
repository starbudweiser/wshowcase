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
  los(a, b, ok = this.ok) { const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 2); for (let k = 0; k <= n; k++) { const t = k / n, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t, i = Math.floor(x / C), j = Math.floor(y / C); if (i < 0 || j < 0 || i >= this.gw || j >= this.gh || ok[j * this.gw + i] !== 1) return false; } return true; }
  /* chemin : A* sur la grille (tas binaire), évite les personnages (obstacles [x, y, rx, ry]) sauf près de l'arrivée, vise la case atteignable la plus proche si la cible est hors zone, puis lissage */
  path(from, to, blockers = []) {
    const r = this.pathOn(from, to, blockers); return r.length || !blockers.length ? r : this.pathOn(from, to, []);
  }
  pathOn(from, to, blockers) {
    const { gw, gh } = this, ok = blockers.length ? this.ok.slice() : this.ok;
    for (const [bx, by, rx, ry] of blockers) {
      if (Math.hypot(bx - to[0], by - to[1]) < 16 || Math.hypot(bx - from[0], by - from[1]) < 8) continue;
      for (let j = Math.floor((by - ry) / C); j <= Math.floor((by + ry) / C); j++) for (let i = Math.floor((bx - rx) / C); i <= Math.floor((bx + rx) / C); i++) {
        if (i >= 0 && j >= 0 && i < gw && j < gh && ((i * C + C / 2 - bx) / rx) ** 2 + ((j * C + C / 2 - by) / ry) ** 2 <= 1) ok[j * gw + i] = 0;
      }
    }
    const fr = (i, j) => i >= 0 && j >= 0 && i < gw && j < gh && ok[j * gw + i] === 1, key = (i, j) => j * gw + i;
    const s0 = this.snap(from[0], from[1]); if (!s0) return [];
    /* cases atteignables depuis le départ (parcours en largeur) : la cible est ramenée à la plus proche d'entre elles */
    const seen = new Uint8Array(gw * gh), q = [s0]; seen[key(...s0)] = 1; let g = s0, bd = 1e9;
    for (let h = 0; h < q.length; h++) {
      const [ci, cj] = q[h], d = (ci * C + C / 2 - to[0]) ** 2 + (cj * C + C / 2 - to[1]) ** 2; if (d < bd) { bd = d; g = [ci, cj]; }
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ni = ci + di, nj = cj + dj; if (fr(ni, nj) && !seen[key(ni, nj)]) { seen[key(ni, nj)] = 1; q.push([ni, nj]); } }
    }
    const goal = [g[0] * C + C / 2, g[1] * C + C / 2], start = [from[0], from[1]];
    if (this.los(start, goal, ok)) return [goal];
    const open = [[0, 0, s0[0], s0[1]]], came = new Map([[key(...s0), null]]), cost = new Map([[key(...s0), 0]]);
    const push = n => { open.push(n); let k = open.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (open[p][0] <= open[k][0]) break; [open[p], open[k]] = [open[k], open[p]]; k = p; } };
    const pop = () => { const top = open[0], last = open.pop(); if (open.length) { open[0] = last; let k = 0; for (;;) { let l = 2 * k + 1, r = l + 1, m = k; if (l < open.length && open[l][0] < open[m][0]) m = l; if (r < open.length && open[r][0] < open[m][0]) m = r; if (m === k) break; [open[m], open[k]] = [open[k], open[m]]; k = m; } } return top; };
    while (open.length) {
      const [, , ci, cj] = pop(); if (ci === g[0] && cj === g[1]) break;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const ni = ci + di, nj = cj + dj; if (!fr(ni, nj)) continue;
        if (di && dj && (!fr(ci + di, cj) || !fr(ci, cj + dj))) continue;
        const nc = cost.get(key(ci, cj)) + (di && dj ? 1.41 : 1), k = key(ni, nj);
        if (!cost.has(k) || nc < cost.get(k)) { cost.set(k, nc); came.set(k, [ci, cj]); push([nc + Math.hypot(g[0] - ni, g[1] - nj), nc, ni, nj]); }
      }
    }
    if (!came.has(key(...g))) return [];
    const pts = []; for (let c = g; c; c = came.get(key(...c))) pts.unshift([c[0] * C + C / 2, c[1] * C + C / 2]);
    pts[pts.length - 1] = goal;
    const res = []; let cur = start, i = 0; /* lissage : on saute les points intermédiaires visibles */
    while (i < pts.length) { let far = i; for (let k = pts.length - 1; k > i; k--) if (this.los(cur, pts[k], ok)) { far = k; break; } res.push(pts[far]); cur = pts[far]; i = far + 1; }
    return res;
  }
}
