/* Génération du paysage : relief, normales, ombres du soleil cuites dans le maillage, occlusion ambiante, forêt de pins. Tout est calculé ici, sans fichier. */
export const SIZE = 2800, N = 641, STEP = SIZE / (N - 1), HALF = SIZE / 2;
export const LAKE = 0;
/* Soleil bas, au nord-est, dans une trouée du relief */
export const SUN_AZ = 0.62, SUN_EL = 0.2;
export const SUN = [Math.sin(SUN_AZ) * Math.cos(SUN_EL), Math.sin(SUN_EL), -Math.cos(SUN_AZ) * Math.cos(SUN_EL)];

function hash2(ix, iy) { let h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function vnoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy), b = hash2(ix + 1, iy), c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, o) { let a = .5, f = 0; for (let i = 0; i < o; i++) { f += a * vnoise(x, y); x = x * 2.03 + 3.1; y = y * 2.03 + 1.7; a *= .5; } return f; }
function ridged(x, y, o) { let a = .5, f = 0, w = 1; for (let i = 0; i < o; i++) { let n = 1 - Math.abs(vnoise(x, y) * 2 - 1); n *= n; f += a * n * w; w = Math.min(1, n * 1.6); x = x * 2.07 + 1.7; y = y * 2.07 + 9.2; a *= .5; } return f; }
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export function heightAt(x, z) {
  const r = Math.hypot(x, z * .92), ang = Math.atan2(x, -z);
  const wx = x + (fbm(x * .0016 + 9.1, z * .0016 + 3.3, 3) - .5) * 700, wz = z + (fbm(x * .0016 + 1.7, z * .0016 + 7.7, 3) - .5) * 700;
  const m = sstep(360, 1050, r);
  let da = Math.abs(ang - SUN_AZ); if (da > Math.PI) da = 2 * Math.PI - da;
  const gap = Math.exp(-Math.pow(da / .8, 2)) * sstep(500, 900, r);        /* trouée où le soleil entre dans la vallée */
  const ridge = ridged(wx * .0021, wz * .0021, 5);
  const peaks = (Math.pow(ridge, 1.45) * 640 * m + m * m * 190) * (1 - .8 * gap);
  const rolling = (fbm(x * .0042, z * .0042, 4) - .5) * 46 * (1 - .4 * m);
  const bed = -3 + (fbm(x * .0034 + 4, z * .0034 + 8, 4) - .5) * 30 + Math.max(0, 14 - Math.hypot(x - 90, z + 40) * .12) * 1.4;
  return bed * (1 - m) + (46 + rolling + peaks) * m;
}

/* Maillage du relief : hauteurs, normales, ombre cuite, occlusion */
export function buildTerrain() {
  const heights = new Float32Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) heights[j * N + i] = heightAt(i * STEP - HALF, j * STEP - HALF);
  const sample = (x, z) => {
    const fx = (x + HALF) / STEP, fz = (z + HALF) / STEP; if (fx < 0 || fz < 0 || fx >= N - 1 || fz >= N - 1) return null;
    const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, k = j * N + i;
    return heights[k] * (1 - u) * (1 - v) + heights[k + 1] * u * (1 - v) + heights[k + N] * (1 - u) * v + heights[k + N + 1] * u * v;
  };
  const positions = new Float32Array(N * N * 3), normals = new Float32Array(N * N * 3), shade = new Float32Array(N * N), ao = new Float32Array(N * N);
  const sx = SUN[0], sy = SUN[1], sz = SUN[2], hl = Math.hypot(sx, sz), dx = sx / hl, dz = sz / hl, slope = sy / hl;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const k = j * N + i, x = i * STEP - HALF, z = j * STEP - HALF, h = heights[k];
    positions[k * 3] = x; positions[k * 3 + 1] = h; positions[k * 3 + 2] = z;
    const hl_ = heights[j * N + Math.max(0, i - 1)], hr = heights[j * N + Math.min(N - 1, i + 1)], hu = heights[Math.max(0, j - 1) * N + i], hd = heights[Math.min(N - 1, j + 1) * N + i];
    let nx = hl_ - hr, ny = 2 * STEP, nz = hu - hd; const nl = Math.hypot(nx, ny, nz); normals[k * 3] = nx / nl; normals[k * 3 + 1] = ny / nl; normals[k * 3 + 2] = nz / nl;
    ao[k] = Math.min(1, Math.max(.35, 1 - ((hl_ + hr + hu + hd) * .25 - h) * .045));
    /* ombre : on remonte le rayon du soleil, doux près de l'obstacle */
    let vis = 1, t = 6;
    for (let s = 0; s < 96 && t < 2600; s++) {
      const hh = sample(x + dx * t, z + dz * t); if (hh === null) break;
      const rayY = h + slope * t; const o = (hh - rayY) / (.05 * t + 3);
      if (o > 0) { vis = Math.min(vis, 1 - Math.min(1, o)); if (vis <= 0) break; }
      t *= 1.06; t += 1.6;
    }
    shade[k] = vis * vis * (3 - 2 * vis);
  }
  /* adoucit l'ombre cuite : deux passes de flou 3×3, pour effacer l'effet d'escalier */
  const tmp = new Float32Array(N * N);
  for (let pass = 0; pass < 3; pass++) {
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { let s = 0, c = 0; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const ii = i + di, jj = j + dj; if (ii >= 0 && jj >= 0 && ii < N && jj < N) { s += shade[jj * N + ii]; c++; } } tmp[j * N + i] = s / c; }
    shade.set(tmp);
  }
  const indices = new Uint32Array((N - 1) * (N - 1) * 6); let q = 0;
  for (let j = 0; j < N - 1; j++) for (let i = 0; i < N - 1; i++) { const a = j * N + i, b = a + 1, c = a + N, d = c + 1; indices[q++] = a; indices[q++] = c; indices[q++] = b; indices[q++] = b; indices[q++] = c; indices[q++] = d; }
  const normalAt = (x, z) => { const e = 3, a = sample(x - e, z) ?? 0, b = sample(x + e, z) ?? 0, c = sample(x, z - e) ?? 0, d = sample(x, z + e) ?? 0; const nx = a - b, nz = c - d, ny = 2 * e, l = Math.hypot(nx, ny, nz); return [nx / l, ny / l, nz / l]; };
  return { heights, positions, normals, shade, ao, indices, sample, normalAt };
}

/* Forêt : positions, échelle, rotation (instances) */
export function plantTrees(T, max = 9500) {
  const out = []; let tries = 0;
  while (out.length < max && tries < max * 14) {
    tries++;
    const x = (Math.random() - .5) * 2300, z = (Math.random() - .5) * 2300, h = T.sample(x, z); if (h === null) continue;
    if (h < 2.5 || h > 150) continue;
    const n = T.normalAt(x, z); if (n[1] < .84) continue;
    const dens = fbm(x * .006 + 20, z * .006 + 5, 3);
    if (dens < .46 || Math.random() > (dens - .4) * 2.2) continue;
    const fade = 1 - sstep(60, 150, h);
    if (Math.random() > fade) continue;
    out.push([x, h - .4, z, .55 + Math.random() * 1.1 + (1 - sstep(0, 80, h)) * .3, Math.random() * 6.28]);
  }
  return out;
}
