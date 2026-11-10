/* Dragon procédural : corps balayé le long d'une colonne animée, tête articulée, ailes à doigts et membranes, épines, queue. Tout est recalculé à chaque image. */
import * as THREE from 'three';
import { dragonMat, wingMat, eyeMat } from './shaders.js';

const M = 72, RING = 14, K = 10, J = 8, F = 4;
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const PROF = [[0, .95], [.06, 1.15], [.15, 1.55], [.24, 2.2], [.33, 3.1], [.44, 3.0], [.53, 2.45], [.66, 1.5], [.8, .85], [.92, .4], [1, .12]];
function radiusAt(s) { for (let k = 0; k < PROF.length - 1; k++) if (s <= PROF[k + 1][0]) { const a = PROF[k], b = PROF[k + 1]; let u = (s - a[0]) / (b[0] - a[0]); u = u * u * (3 - 2 * u); return a[1] + (b[1] - a[1]) * u; } return .1; }
const dir = (yaw, pitch) => { const c = Math.cos(pitch); return [Math.cos(yaw) * c, Math.sin(pitch), Math.sin(yaw) * c]; };
const BACK = [.028, .032, .042], BELLY = [.085, .07, .055];

export function createDragon() {
  const group = new THREE.Group(), mat = dragonMat(), wmat = wingMat();

  /* ----- corps ----- */
  const bp = new Float32Array(M * RING * 3), bn = new Float32Array(M * RING * 3), bc = new Float32Array(M * RING * 3), bu = new Float32Array(M * RING * 2);
  const bi = []; for (let i = 0; i < M - 1; i++) for (let k = 0; k < RING; k++) { const a = i * RING + k, b = i * RING + (k + 1) % RING, c = (i + 1) * RING + k, d = (i + 1) * RING + (k + 1) % RING; bi.push(a, b, c, b, d, c); }
  for (let i = 0; i < M; i++) for (let k = 0; k < RING; k++) {
    const th = k / RING * Math.PI * 2, belly = sstep(-.1, -.75, Math.sin(th)), v = i * RING + k;
    for (let c = 0; c < 3; c++) bc[v * 3 + c] = BACK[c] + (BELLY[c] - BACK[c]) * belly;
    bu[v * 2] = i / (M - 1); bu[v * 2 + 1] = k / RING;
  }
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(bp, 3).setUsage(THREE.DynamicDrawUsage)); bg.setAttribute('normal', new THREE.BufferAttribute(bn, 3).setUsage(THREE.DynamicDrawUsage));
  bg.setAttribute('aCol', new THREE.BufferAttribute(bc, 3)); bg.setAttribute('aUv', new THREE.BufferAttribute(bu, 2)); bg.setIndex(bi);
  const body = new THREE.Mesh(bg, mat); body.frustumCulled = false; group.add(body);

  /* ----- épines dorsales et pointe de queue ----- */
  const SP = []; for (let i = 3; i < M - 4; i += 2) SP.push(i);
  const sp = new Float32Array((SP.length + 2) * 9), sn = new Float32Array((SP.length + 2) * 9), sc = new Float32Array((SP.length + 2) * 9), su = new Float32Array((SP.length + 2) * 6);
  for (let i = 0; i < SP.length + 2; i++) for (let k = 0; k < 3; k++) { const v = i * 3 + k; sc[v * 3] = .09; sc[v * 3 + 1] = .075; sc[v * 3 + 2] = .07; su[v * 2] = .5; su[v * 2 + 1] = k / 2; }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3).setUsage(THREE.DynamicDrawUsage)); sg.setAttribute('normal', new THREE.BufferAttribute(sn, 3).setUsage(THREE.DynamicDrawUsage));
  sg.setAttribute('aCol', new THREE.BufferAttribute(sc, 3)); sg.setAttribute('aUv', new THREE.BufferAttribute(su, 2));
  const spikes = new THREE.Mesh(sg, mat); spikes.frustumCulled = false; group.add(spikes);

  /* ----- tête ----- */
  const head = new THREE.Group(); head.matrixAutoUpdate = false; group.add(head);
  const addCol = (geo, c) => { const n = geo.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c[0]; a[i * 3 + 1] = c[1]; a[i * 3 + 2] = c[2]; } geo.setAttribute('aCol', new THREE.BufferAttribute(a, 3)); geo.setAttribute('aUv', geo.attributes.uv); return geo; };
  const part = (geo, col, pos, scl, parent = head, material = mat) => { const m = new THREE.Mesh(addCol(geo, col), material); m.position.set(...pos); if (scl) m.scale.set(...scl); parent.add(m); return m; };
  const sph = () => new THREE.SphereGeometry(1, 20, 14), cone = (r, h, s = 8) => new THREE.ConeGeometry(r, h, s);
  part(sph(), [.04, .045, .055], [0, 0, .55], [1.15, 1.0, 1.75]);                 /* crâne */
  part(sph(), [.05, .052, .06], [0, -.12, 2.35], [.82, .6, 1.75]);                 /* museau */
  part(sph(), [.03, .03, .035], [0, .5, 1.1], [1.0, .35, .9]);                      /* arcade */
  const jawPivot = new THREE.Group(); jawPivot.position.set(0, -.42, .25); head.add(jawPivot);
  part(sph(), [.12, .1, .09], [0, -.05, 1.35], [.68, .26, 1.7], jawPivot);          /* mâchoire */
  for (let k = 0; k < 6; k++) for (const sx of [-1, 1]) { const t = part(cone(.07, .3, 5), [.9, .88, .8], [sx * .42, .25, .25 + k * .45], null, jawPivot); t.rotation.z = 0; }
  for (let k = 0; k < 5; k++) for (const sx of [-1, 1]) { const t = part(cone(.07, .3, 5), [.9, .88, .8], [sx * .5, -.1, 1.2 + k * .5], null, head); t.rotation.x = Math.PI; }
  for (const sx of [-1, 1]) {
    const hn = part(cone(.3, 3.4, 8), [.06, .055, .05], [sx * .75, .85, -.15], null); const d = new THREE.Vector3(sx * .35, .42, -1).normalize(); hn.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
    const hn2 = part(cone(.18, 1.8, 6), [.07, .06, .055], [sx * 1.0, .1, .2], null); hn2.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(sx * .8, .15, -.6).normalize());
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.2, 10, 8), eyeMat()); eye.position.set(sx * .66, .32, 1.15); eye.scale.set(1, .7, 1.4); head.add(eye);
  }

  /* ----- pattes (repliées) ----- */
  const legs = new THREE.Group(); group.add(legs);
  const leg = (x, z, s) => { const g = new THREE.Group(); g.position.set(x, -2.2, z); legs.add(g);
    part(new THREE.CylinderGeometry(.75 * s, .5 * s, 3.4 * s, 8), [.04, .04, .045], [0, -.9 * s, .6 * s], null, g).rotation.x = .7;
    part(new THREE.CylinderGeometry(.42 * s, .26 * s, 3.4 * s, 8), [.045, .042, .045], [0, -2.7 * s, -.2 * s], null, g).rotation.x = -.55;
    for (const cx of [-.3, 0, .3]) { const c = part(cone(.1, .8, 5), [.8, .78, .7], [cx * s, -4.2 * s, .9 * s], null, g); c.rotation.x = 1.2; } return g; };
  leg(1.9, 4.5, .85); leg(-1.9, 4.5, .85); leg(2.0, -6.2, 1.1); leg(-2.0, -6.2, 1.1);

  /* ----- ailes ----- */
  const wings = [1, -1].map(sx => makeWing(sx, wmat)); wings.forEach(w => group.add(w.mesh, w.bones));

  const P = Array.from({ length: M }, () => new THREE.Vector3()), Tn = new THREE.Vector3(), R = new THREE.Vector3(), Uv = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const frames = [];
  function update(T, flapPhase, amp, jaw, lift) {
    /* colonne vertébrale */
    for (let i = 0; i < M; i++) {
      const s = i / (M - 1), z = 19 - 46 * s, tail = sstep(.42, 1, s), neck = 1 - sstep(0, .3, s);
      const x = Math.sin(T * 2.0 - s * 6.2) * tail * 3.6 + Math.sin(T * .8 - s * 3) * .55 * sstep(0, .5, s);
      const y = neck * (2.4 + lift * 3.4) + Math.sin(T * 1.5 - s * 4.6 + 1.1) * (.35 + tail * 2.0) - tail * 2.8 + Math.sin(flapPhase) * 1.0 * amp * sstep(.1, .6, s) * (1 - tail) + (1 - sstep(0, .12, s)) * lift * 1.4;
      P[i].set(x, y, z);
    }
    for (let i = 0; i < M; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(M - 1, i + 1)]; Tn.subVectors(a, b).normalize(); R.crossVectors(up, Tn).normalize(); Uv.crossVectors(Tn, R);
      frames[i] = frames[i] || [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]; frames[i][0].copy(Tn); frames[i][1].copy(R); frames[i][2].copy(Uv);
      const s = i / (M - 1), r = radiusAt(s), rx = r * .9, ry = r;
      for (let k = 0; k < RING; k++) { const th = k / RING * Math.PI * 2, c = Math.cos(th), sn_ = Math.sin(th), v = (i * RING + k) * 3;
        bp[v] = P[i].x + R.x * c * rx + Uv.x * sn_ * ry; bp[v + 1] = P[i].y + R.y * c * rx + Uv.y * sn_ * ry; bp[v + 2] = P[i].z + R.z * c * rx + Uv.z * sn_ * ry;
        const nx = R.x * c / rx + Uv.x * sn_ / ry, ny = R.y * c / rx + Uv.y * sn_ / ry, nz = R.z * c / rx + Uv.z * sn_ / ry, nl = Math.hypot(nx, ny, nz) || 1; bn[v] = nx / nl; bn[v + 1] = ny / nl; bn[v + 2] = nz / nl; }
    }
    bg.attributes.position.needsUpdate = true; bg.attributes.normal.needsUpdate = true;
    /* épines */
    let q = 0;
    const tri = (a, b, c, n) => { for (const p of [a, b, c]) { sp[q] = p.x; sp[q + 1] = p.y; sp[q + 2] = p.z; sn[q] = n.x; sn[q + 1] = n.y; sn[q + 2] = n.z; q += 3; } };
    const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3();
    for (const i of SP) { const [T_, R_, U_] = frames[i], s = i / (M - 1), r = radiusAt(s), h = (.7 + 1.1 * Math.sin(Math.PI * Math.min(1, s * 1.3))) * (1 - .3 * s), w = .32 + r * .08;
      const base = P[i].clone().addScaledVector(U_, r * .97); va.copy(base).addScaledVector(R_, -w); vb.copy(base).addScaledVector(U_, h).addScaledVector(T_, -h * .55); vc.copy(base).addScaledVector(R_, w); tri(va, vb, vc, U_); }
    { const [T_, R_, U_] = frames[M - 1]; const e = P[M - 1]; va.copy(e).addScaledVector(R_, -2.6).addScaledVector(T_, 1.2); vb.copy(e).addScaledVector(T_, -3.2); vc.copy(e).addScaledVector(R_, 2.6).addScaledVector(T_, 1.2); tri(va, vb, vc, U_);
      va.copy(e).addScaledVector(R_, -2.6).addScaledVector(T_, 1.2); vb.copy(e).addScaledVector(T_, 3.2); vc.copy(e).addScaledVector(R_, 2.6).addScaledVector(T_, 1.2); tri(va, vb, vc, U_); }
    sg.attributes.position.needsUpdate = true; sg.attributes.normal.needsUpdate = true;
    /* tête : repère de la première bague */
    head.matrix.makeBasis(frames[0][1], frames[0][2], frames[0][0]).setPosition(P[0].x, P[0].y + .2, P[0].z + 1.4); head.matrixWorldNeedsUpdate = true;
    jawPivot.rotation.x = jaw * .6; head.matrix.multiply(new THREE.Matrix4().makeRotationX(-lift * .35));
    legs.position.set(P[Math.floor(M * .33)].x * .3, P[Math.floor(M * .33)].y, 0);
    wings.forEach(w => w.update(flapPhase, amp));
  }
  const mouthLocal = new THREE.Vector3(0, -.25, 4.1);
  return { group, update, head, mouth: () => head.localToWorld(mouthLocal.clone()), headDir: () => new THREE.Vector3(0, 0, 1).transformDirection(head.matrixWorld) };
}

function makeWing(sx, wmat) {
  const strips = F, vpS = 3 * (J + 1) + 1, nv = strips * vpS;
  const pos = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), col = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), idx = [];
  for (let g = 0; g < strips; g++) {
    const o = g * vpS;
    for (let j = 0; j <= J; j++) for (let c = 0; c < 3; c++) { uv[(o + j * 3 + c) * 2] = j / J + g * .13; uv[(o + j * 3 + c) * 2 + 1] = c / 2; }
    uv[(o + vpS - 1) * 2] = 1 + g * .13; uv[(o + vpS - 1) * 2 + 1] = .5;
    for (let j = 0; j < J; j++) { const a = o + j * 3, b = a + 1, c = a + 2, d = a + 3, e = a + 4, f = a + 5; idx.push(a, b, d, b, e, d, b, c, e, c, f, e); }
    idx.push(o + J * 3, o + vpS - 1, o + J * 3 + 2);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aUv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('aCol', new THREE.BufferAttribute(col, 3)); g.setIndex(idx);
  const mesh = new THREE.Mesh(g, wmat); mesh.frustumCulled = false;
  /* os : rubans sombres le long du bras et des doigts */
  const segs = F + 2, bn = segs * K * 2, bpos = new Float32Array(bn * 3), buv = new Float32Array(bn * 2), bcol = new Float32Array(bn * 3), bnor = new Float32Array(bn * 3), bidx = [];
  for (let s = 0; s < segs; s++) for (let j = 0; j < K - 1; j++) { const a = (s * K + j) * 2; bidx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(bpos, 3).setUsage(THREE.DynamicDrawUsage)); bg.setAttribute('normal', new THREE.BufferAttribute(bnor, 3).setUsage(THREE.DynamicDrawUsage));
  bg.setAttribute('aUv', new THREE.BufferAttribute(buv, 2)); bg.setAttribute('aCol', new THREE.BufferAttribute(bcol, 3)); bg.setIndex(bidx);
  const bones = new THREE.Mesh(bg, wmat); bones.frustumCulled = false;
  const fin = Array.from({ length: F }, () => Array.from({ length: K }, () => [0, 0, 0])), body = Array.from({ length: K }, () => [0, 0, 0]);
  const arm = [Array.from({ length: K }, () => [0, 0, 0]), Array.from({ length: K }, () => [0, 0, 0])];
  const LEN = [36, 31, 25, 18], YAW = [.5, -.1, -.72, -1.28];
  function update(phase, amp) {
    const f1 = Math.sin(phase), f2 = Math.sin(phase - .8), f3 = Math.sin(phase - 1.5), cs = Math.cos(phase);
    const S = [1.9, 2.5, 4.6], H = [2.1, .2, -12];
    const armD = dir(.5 + amp * .22 * cs, .32 + amp * .85 * f1), E = [S[0] + armD[0] * 9, S[1] + armD[1] * 9, S[2] + armD[2] * 9];
    const forD = dir(-.12 + amp * .2 * Math.cos(phase - .5), .1 + amp * .6 * f2), W = [E[0] + forD[0] * 13, E[1] + forD[1] * 13, E[2] + forD[2] * 13];
    for (let j = 0; j < K; j++) { const u = j / (K - 1); arm[0][j] = [S[0] + (E[0] - S[0]) * u, S[1] + (E[1] - S[1]) * u, S[2] + (E[2] - S[2]) * u]; arm[1][j] = [E[0] + (W[0] - E[0]) * u, E[1] + (W[1] - E[1]) * u, E[2] + (W[2] - E[2]) * u]; }
    const droop = .12 + amp * .55 * Math.cos(phase - .4), basePitch = .1 + amp * .5 * f2 * .7 + .12 * f3;
    for (let k = 0; k < F; k++) { let p = [...W]; fin[k][0] = [...p]; const step = LEN[k] / (K - 1);
      for (let j = 1; j < K; j++) { const u = (j - 1) / (K - 1), d = dir(YAW[k] - .12 * u * k + amp * .15 * cs * (1 - k * .2), basePitch - k * .07 + droop * u * 1.3); p = [p[0] + d[0] * step, p[1] + d[1] * step, p[2] + d[2] * step]; fin[k][j] = p; } }
    for (let j = 0; j < K; j++) { const u = j / J; body[j] = [S[0] + (H[0] - S[0]) * u, S[1] + (H[1] - S[1]) * u, S[2] + (H[2] - S[2]) * u]; }
    let q = 0; const put = (p, dy = 0) => { pos[q * 3] = sx * p[0]; pos[q * 3 + 1] = p[1] + dy; pos[q * 3 + 2] = p[2]; q++; };
    const billow = Math.cos(phase - .3) * amp;
    for (let gi = 0; gi < strips; gi++) {
      const A = fin[gi], B = gi < F - 1 ? fin[gi + 1] : body;
      for (let j = 0; j <= J; j++) { const u = j / J, bl = Math.sin(Math.PI * Math.min(1, u * 1.05)) * (1.1 + 1.4 * billow) - u * 1.2;
        put(A[j]); put([(A[j][0] + B[j][0]) / 2, (A[j][1] + B[j][1]) / 2, (A[j][2] + B[j][2]) / 2], bl); put(B[j]); }
      const a = A[J], b = B[J], c = A[Math.max(2, J - 4)], d = B[Math.max(2, J - 4)];
      put([(a[0] + b[0]) / 2 + ((c[0] + d[0]) / 2 - (a[0] + b[0]) / 2) * .3, (a[1] + b[1]) / 2 + ((c[1] + d[1]) / 2 - (a[1] + b[1]) / 2) * .3 - 1.2, (a[2] + b[2]) / 2 + ((c[2] + d[2]) / 2 - (a[2] + b[2]) / 2) * .3]);
    }
    g.attributes.position.needsUpdate = true; g.computeVertexNormals();
    let r = 0; const ribbon = pts => { for (let j = 0; j < K; j++) { const p = pts[j], wd = .42 * (1 - j / K * .6); bpos[r * 3] = sx * p[0]; bpos[r * 3 + 1] = p[1] + wd; bpos[r * 3 + 2] = p[2]; r++; bpos[r * 3] = sx * p[0]; bpos[r * 3 + 1] = p[1] - wd; bpos[r * 3 + 2] = p[2]; r++; } };
    ribbon(arm[0]); ribbon(arm[1]); for (let k = 0; k < F; k++) ribbon(fin[k]);
    bg.attributes.position.needsUpdate = true; bg.computeVertexNormals();
  }
  return { mesh, bones, update };
}
