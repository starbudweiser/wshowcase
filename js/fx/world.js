/* Le monde : relief, forêt, lac, ciel, dragon, flammes, neige, réalisation (plans de caméra) et post-traitement. */
import * as THREE from 'three';
import { EffectComposer } from '../../assets/vendor/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../../assets/vendor/three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../../assets/vendor/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from '../../assets/vendor/three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from '../../assets/vendor/three/examples/jsm/postprocessing/OutputPass.js';
import { Reflector } from '../../assets/vendor/three/examples/jsm/objects/Reflector.js';
import { buildTerrain, plantTrees, N, SIZE, LAKE, SUN } from './terrain.js';
import { U, skyMat, terrainMat, treeMat, waterShader, fireMat, snowMat, GradeShader } from './shaders.js';
import { createDragon } from './dragon.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const sm = t => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const frame = () => new Promise(r => requestAnimationFrame(() => r()));
export const CYCLE = 72;

/* trajectoire du dragon : une grande boucle dans la cuvette */
function dragonPos(t, out = V()) {
  const a = t * .074 + .9, R = 335 + 75 * Math.sin(t * .13);
  return out.set(R * Math.cos(a), 105 + 46 * Math.sin(t * .21 + 1) + 12 * Math.sin(t * .9), R * Math.sin(a) * .85 - 40);
}

function pineGeometry() {
  const parts = [];
  const add = (geo, y, col) => { geo.translate(0, y, 0); const n = geo.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const t = geo.attributes.position.getY(i) / 10; a[i * 3] = col[0] * (.8 + t * .5); a[i * 3 + 1] = col[1] * (.8 + t * .5); a[i * 3 + 2] = col[2] * (.8 + t * .5); } geo.setAttribute('aCol', new THREE.BufferAttribute(a, 3)); parts.push(geo); };
  add(new THREE.CylinderGeometry(.22, .34, 2.6, 6, 1), 1.3, [.07, .045, .03]);
  [[3.1, 2.5, 3.8], [5.3, 2.0, 3.3], [7.2, 1.5, 2.9], [9.0, .95, 2.5]].forEach(([y, r, h]) => add(new THREE.ConeGeometry(r, h, 7, 1, true), y + h * .1, [.03, .075, .045]));
  let nv = 0, ni = 0; parts.forEach(g => { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; });
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3), idx = new Uint16Array(ni); let vo = 0, io = 0;
  parts.forEach(g => { pos.set(g.attributes.position.array, vo * 3); nor.set(g.attributes.normal.array, vo * 3); col.set(g.attributes.aCol.array, vo * 3); const ix = g.index.array; for (let i = 0; i < ix.length; i++) idx[io++] = ix[i] + vo; vo += g.attributes.position.count; });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('aCol', new THREE.BufferAttribute(col, 3)); geo.setIndex(new THREE.BufferAttribute(idx, 1)); return geo;
}

export async function createWorld(container, hooks = {}) {
  const w0 = container.clientWidth || innerWidth, h0 = container.clientHeight || innerHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  let pr = Math.min(devicePixelRatio || 1, 1.6); renderer.setPixelRatio(pr); renderer.setSize(w0, h0, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .9; renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  container.append(renderer.domElement); U.uPx.value = pr;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(50, w0 / h0, .6, 9000);

  /* ----- relief ----- */
  await frame(); const T = buildTerrain(); await frame();
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(T.positions, 3)); g.setAttribute('normal', new THREE.BufferAttribute(T.normals, 3));
  g.setAttribute('aShade', new THREE.BufferAttribute(T.shade, 1)); g.setAttribute('aAo', new THREE.BufferAttribute(T.ao, 1)); g.setIndex(new THREE.BufferAttribute(T.indices, 1));
  const tex8 = f => { const a = new Uint8Array(N * N); for (let i = 0; i < N * N; i++) a[i] = Math.round(Math.min(1, Math.max(0, f(i))) * 255); const t = new THREE.DataTexture(a, N, N, THREE.RedFormat, THREE.UnsignedByteType); t.magFilter = t.minFilter = THREE.LinearFilter; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true; return t; };
  const shadeTex = tex8(i => T.shade[i]), depthTex = tex8(i => (LAKE - T.heights[i]) / 22);
  const terrain = new THREE.Mesh(g, terrainMat(shadeTex)); terrain.frustumCulled = false; scene.add(terrain);
  scene.add(Object.assign(new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), skyMat()), { frustumCulled: false, renderOrder: -10 }));

  /* ----- forêt ----- */
  await frame(); const trees = plantTrees(T); const im = new THREE.InstancedMesh(pineGeometry(), treeMat(shadeTex), trees.length); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  trees.forEach(([x, y, z, s, r], i) => { q.setFromEuler(e.set(0, r, 0)); m4.compose(V(x, y, z), q, V(s, s * (.9 + Math.random() * .3), s)); im.setMatrixAt(i, m4); }); im.frustumCulled = false; scene.add(im);

  /* ----- lac ----- */
  const lake = new Reflector(new THREE.PlaneGeometry(4400, 4400), { textureWidth: 1024, textureHeight: 576, clipBias: .003, shader: waterShader(depthTex), multisample: 0 });
  lake.rotation.x = -Math.PI / 2; lake.position.y = LAKE; Object.keys(U).forEach(k => { lake.material.uniforms[k] = U[k]; }); lake.material.uniforms.tDepth.value = depthTex; lake.material.transparent = true; scene.add(lake);

  /* ----- dragon ----- */
  const dragon = createDragon(); scene.add(dragon.group);

  /* ----- flammes ----- */
  const NF = 7000, fp = new Float32Array(NF * 3).fill(-9999), fT = new Float32Array(NF).fill(1), fS = new Float32Array(NF), fK = new Float32Array(NF), fv = new Float32Array(NF * 3), fage = new Float32Array(NF).fill(9), flife = new Float32Array(NF).fill(1); let fptr = 0;
  const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(fp, 3).setUsage(THREE.DynamicDrawUsage)); fg.setAttribute('aT', new THREE.BufferAttribute(fT, 1).setUsage(THREE.DynamicDrawUsage)); fg.setAttribute('aSize', new THREE.BufferAttribute(fS, 1)); fg.setAttribute('aKind', new THREE.BufferAttribute(fK, 1));
  const fire = new THREE.Points(fg, fireMat()); fire.frustumCulled = false; scene.add(fire);
  const emit = (o, d, vel, count) => { for (let n = 0; n < count; n++) { const i = fptr; fptr = (fptr + 1) % NF; const ember = Math.random() < .16, sp = ember ? 1.5 : .1;
    fp[i * 3] = o.x + (Math.random() - .5) * 2; fp[i * 3 + 1] = o.y + (Math.random() - .5) * 2; fp[i * 3 + 2] = o.z + (Math.random() - .5) * 2;
    const spd = (ember ? 40 : 85) + Math.random() * 40; fv[i * 3] = d.x * spd + vel.x + (Math.random() - .5) * 60 * sp; fv[i * 3 + 1] = d.y * spd + vel.y + (Math.random() - .5) * 60 * sp; fv[i * 3 + 2] = d.z * spd + vel.z + (Math.random() - .5) * 60 * sp;
    fage[i] = 0; flife[i] = ember ? 2.5 + Math.random() * 3 : 1.1 + Math.random() * 1.1; fS[i] = ember ? 4 + Math.random() * 4 : 2.4 + Math.random() * 3.4; fK[i] = ember ? 1 : 0; } fg.attributes.aSize.needsUpdate = true; fg.attributes.aKind.needsUpdate = true; };
  const updateFire = dt => { for (let i = 0; i < NF; i++) { if (fage[i] >= flife[i]) { fp[i * 3 + 1] = -9999; fT[i] = 1; continue; }
    fage[i] += dt; const k = fK[i] > .5; fv[i * 3 + 1] += (k ? -4 : 10) * dt; const dr = Math.exp(-(k ? .5 : 1.1) * dt); fv[i * 3] *= dr; fv[i * 3 + 1] *= dr; fv[i * 3 + 2] *= dr;
    fv[i * 3] += (Math.random() - .5) * 90 * dt; fv[i * 3 + 2] += (Math.random() - .5) * 90 * dt;
    fp[i * 3] += fv[i * 3] * dt; fp[i * 3 + 1] += fv[i * 3 + 1] * dt; fp[i * 3 + 2] += fv[i * 3 + 2] * dt;
    const gh = Math.max(LAKE, T.sample(fp[i * 3], fp[i * 3 + 2]) ?? LAKE) + .8; if (fp[i * 3 + 1] < gh) { fp[i * 3 + 1] = gh; fv[i * 3 + 1] = Math.abs(fv[i * 3 + 1]) * .12 + 3; fv[i * 3] *= .6; fv[i * 3 + 2] *= .6; }
    fT[i] = fage[i] / flife[i]; } fg.attributes.position.needsUpdate = true; fg.attributes.aT.needsUpdate = true; };

  /* ----- neige en suspension ----- */
  const NS = 3600, sp = new Float32Array(NS * 3), sa = new Float32Array(NS); for (let i = 0; i < NS; i++) { sp[i * 3] = (Math.random() - .5) * 600; sp[i * 3 + 1] = (Math.random() - .5) * 300; sp[i * 3 + 2] = (Math.random() - .5) * 600; sa[i] = Math.random(); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.setAttribute('aS', new THREE.BufferAttribute(sa, 1)); const snow = new THREE.Points(sg, snowMat()); snow.frustumCulled = false; scene.add(snow);

  /* ----- post-traitement ----- */
  const rt = new THREE.WebGLRenderTarget(w0 * pr, h0 * pr, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt); composer.setPixelRatio(pr); composer.setSize(w0, h0);
  composer.addPass(new RenderPass(scene, camera)); const bloom = new UnrealBloomPass(new THREE.Vector2(w0, h0), .38, .6, 2.2); composer.addPass(bloom);
  const grade = new ShaderPass(GradeShader); composer.addPass(grade); composer.addPass(new OutputPass());

  /* ----- état ----- */
  const S = { t: 0, phase: 0, cyc: -1, roared: false, camPos: V(), camLook: V(), look: V(), fov: 50, shake: 0, shock: { age: 99, s: 0, origin: V() }, flash: 0, fade: 1, mouse: [0, 0], breath: 0, roar: 0, fwd: V(0, 0, 1), dpos: V() };
  const tmp = { a: V(), b: V(), c: V(), up: V(0, 1, 0), f: V(), r: V(), mouth: V(), dir: V() };

  function dragonState(t) {
    const p = dragonPos(t, V()), a = dragonPos(t + .15, V()), b = dragonPos(t - .15, V()), f = a.clone().sub(b).normalize();
    const f1 = dragonPos(t + .25, V()).sub(dragonPos(t, V())).normalize(), f2 = dragonPos(t + .6, V()).sub(dragonPos(t + .35, V())).normalize(); const turn = new THREE.Vector3().crossVectors(f1, f2).y;
    return { p, f, bank: Math.max(-.85, Math.min(.85, -turn * 22)) };
  }

  /* réalisation : cinq plans, une boucle de 72 s */
  function director(tc, base) {
    const d = dragonState(S.t), pos = d.p, f = d.f, right = V().crossVectors(f, tmp.up).normalize().multiplyScalar(-1), out = { pos: V(), look: V(), fov: 50, shake: 0 };
    if (tc < 12) {                                                    /* 1. survol du lac vers le soleil */
      const u = sm(tc / 12); out.pos.set(lerp(-90, 40, u), lerp(7, 11, u), lerp(330, 90, u)); out.look.set(lerp(60, 200, u), lerp(70, 110, u), -700); out.fov = lerp(52, 44, u);
      out.look.lerp(pos, sm((tc - 5) / 7) * .55);
    } else if (tc < 26) {                                             /* 2. passage au ras de la rive */
      const tp = base + 19, dp = dragonPos(tp, V()); out.pos.set(dp.x * .8, 14 + (tc - 12) * .2, dp.z * .8 - 10); out.look.copy(pos); out.fov = lerp(40, 66, sm((tc - 15) / 8)); out.shake = Math.max(0, 1 - Math.abs(tc - 19.4) / 1.8);
    } else if (tc < 40) {                                             /* 3. poursuite derrière le dragon */
      const u = (tc - 26) / 14; out.pos.copy(pos).addScaledVector(f, -(44 - 10 * Math.sin(u * 3))).addScaledVector(right, 7 + 8 * Math.sin(u * 2.4)).add(V(0, 14 + 6 * Math.sin(u * 2), 0)); out.look.copy(pos).addScaledVector(f, 22).add(V(0, 1, 0)); out.fov = 62;
    } else if (tc < 54) {                                             /* 4. plan latéral et souffle de feu */
      const u = (tc - 40) / 14; out.pos.copy(pos).addScaledVector(right, 150 - 40 * u).addScaledVector(f, 40 - 120 * u).add(V(0, 8 + 14 * u, 0)); out.look.copy(pos).addScaledVector(f, 26); out.fov = 40 - 8 * u;
    } else {                                                          /* 5. le dragon fonce vers la caméra puis passe au-dessus */
      const u = (tc - 54) / 18, ahead = dragonPos(S.t + lerp(5.5, 1.5, sm(u)), V()); out.pos.set(ahead.x * .86, 26 - 6 * u, ahead.z * .86 - 20); out.look.copy(pos); out.fov = lerp(46, 70, sm(u));
    }
    return { out, d };
  }
  const dmp = { pos: V(), look: V(), fov: 50, init: false };

  function step(dt) {
    S.t += dt; const t = S.t, cyc = Math.floor(t / CYCLE), base = cyc * CYCLE, tc = t - base;
    if (cyc !== S.cyc) { S.cyc = cyc; S.roared = false; S.breathed = false; }
    const { out, d } = director(tc, base);
    /* le dragon */
    const amp = .35 + .65 * (.5 + .5 * Math.sin(t * .16)), wasPh = S.phase; S.phase += dt * (2.4 + 1.3 * amp);
    const roarWin = sm((tc - 17.6) / .5) * (1 - sm((tc - 20.4) / .6)), breath = sm((tc - 43) / .8) * (1 - sm((tc - 51) / .8)), pre = tc;
    S.roar = roarWin; S.breath = breath;
    if (!S.roared && tc > 17.9 && tc < 25) { S.roared = true; hooks.roar && hooks.roar(); shock(S.camPos.clone(), .0, 1.1); S.flash = .22; }
    if (breath > .1 && !S.breathed) { S.breathed = true; hooks.breath && hooks.breath(); }
    dragon.group.position.copy(d.p); dragon.group.lookAt(d.p.clone().add(d.f)); dragon.group.rotateZ(d.bank);
    dragon.update(t, S.phase, amp, Math.max(roarWin, breath * .85), roarWin - breath * .5);
    dragon.group.updateMatrixWorld(true);
    U.uDragon.value.set(d.p.x, d.p.y, d.p.z, 24);
    /* flammes */
    const mouth = dragon.mouth(), md = dragon.headDir(); md.y -= .12 * breath; md.normalize();
    if (breath > .08) { const dv = d.f.clone().multiplyScalar(30); emit(mouth, md, dv, Math.round(2300 * dt * breath)); }
    updateFire(dt);
    const flick = .8 + .2 * Math.sin(t * 37) * Math.sin(t * 23 + 1);
    U.uFire.value.set(mouth.x + md.x * 55, mouth.y + md.y * 55 - 8, mouth.z + md.z * 55, 26 * breath * flick);
    /* caméra : amortie, avec un léger regard à la souris et des secousses */
    if (!dmp.init) { dmp.pos.copy(out.pos); dmp.look.copy(out.look); dmp.fov = out.fov; dmp.init = true; }
    const cut = tc < dt * 2 || Math.abs(tc - 12) < dt * 1.5 || Math.abs(tc - 26) < dt * 1.5 || Math.abs(tc - 40) < dt * 1.5 || Math.abs(tc - 54) < dt * 1.5;
    if (cut) { dmp.pos.copy(out.pos); dmp.look.copy(out.look); dmp.fov = out.fov; S.cutT = t; }
    const kp = tc >= 26 && tc < 40 ? 1 - Math.exp(-dt * 6) : tc >= 54 ? 1 - Math.exp(-dt * 3) : 1 - Math.exp(-dt * 9);
    dmp.pos.lerp(out.pos, tc < 12 ? 1 : kp); dmp.look.lerp(out.look, 1 - Math.exp(-dt * (tc < 12 ? 4 : 7))); dmp.fov += (out.fov - dmp.fov) * (1 - Math.exp(-dt * 4));
    S.shake = Math.max(out.shake, S.shock.age < 1.4 ? (1 - S.shock.age / 1.4) * S.shock.s : 0);
    camera.position.copy(dmp.pos).add(V((Math.sin(t * 53) + Math.sin(t * 91)) * S.shake * .5, (Math.cos(t * 61) + Math.sin(t * 77)) * S.shake * .4, 0));
    camera.up.set(0, 1, 0); camera.lookAt(dmp.look); camera.rotateY(-S.mouse[0] * .16); camera.rotateX(S.mouse[1] * .1);
    camera.fov = dmp.fov + S.flash * 14 + (S.shock.age < .6 ? (1 - S.shock.age / .6) * S.shock.s * 6 : 0); camera.updateProjectionMatrix();
    S.camPos.copy(camera.position);
    /* fondu entre plans, onde de choc */
    const fade = (tc < .9 ? sm(tc / .9) : 1) * Math.min(1, Math.abs(t - (S.cutT ?? -9)) < .3 ? .25 + Math.abs(t - (S.cutT ?? -9)) / .4 : 1);
    S.fade = t < 1 ? sm(t / 1.4) : fade > .97 ? 1 : fade; S.shock.age += dt; S.flash *= Math.exp(-dt * 3);
    U.uTime.value = t;
    const sh = S.shock; U.uShock.value.set(sh.origin.x, sh.origin.z, sh.age < 6 ? sh.age : -1, sh.s);
    grade.uniforms.uTime.value = t; grade.uniforms.uFlash.value = S.flash; grade.uniforms.uFade.value = S.fade; grade.uniforms.uAspect.value = camera.aspect;
    grade.uniforms.uShockR.value = sh.screen && sh.age < 1.8 ? sh.age * .8 : -1; grade.uniforms.uShockS.value = sh.s * Math.exp(-sh.age * 1.4);
    /* soleil à l'écran */
    const sun = V(SUN[0], SUN[1], SUN[2]).multiplyScalar(6000).add(camera.position).project(camera);
    const cen = Math.hypot(sun.x, sun.y); grade.uniforms.uSun.value.set(sun.x * .5 + .5, sun.y * .5 + .5, sun.z < 1 ? Math.max(0, 1 - sm((cen - .2) / 1.6)) : 0);
    lake.position.y = LAKE;
    bloom.strength = .36 + S.flash * 1.2 + breath * .15;
  }

  function shock(origin, _a, s, screen = false) { S.shock = { age: 0, s, origin, screen }; }
  function thuum(strength = 1) {                                      /* le cri : onde sur le sol et à l'écran */
    const f = V(0, 0, -1).applyQuaternion(camera.quaternion); f.y = 0; f.normalize(); S.shock = { age: 0, s: strength, origin: camera.position.clone().addScaledVector(f, 70), screen: true }; S.flash = Math.max(S.flash, .12 * strength);
    grade.uniforms.uShockC.value.set(.5, .5);
  }
  function resize(w, h) { renderer.setSize(w, h, false); composer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); bloom.setSize(w, h); }
  function setPR(v) { pr = v; renderer.setPixelRatio(v); composer.setPixelRatio(v); composer.setSize(container.clientWidth || innerWidth, container.clientHeight || innerHeight); U.uPx.value = v; }
  function render() { composer.render(); }
  function dispose() { renderer.dispose(); composer.dispose && composer.dispose(); const x = renderer.getContext().getExtension('WEBGL_lose_context'); x && x.loseContext(); renderer.domElement.remove(); }
  const debug = () => { let n = 0; for (let i = 0; i < NF; i++) if (fage[i] < flife[i]) n++; const m = dragon.mouth(); const sample = []; for (let i = 0; i < NF && sample.length < 6; i++) if (fage[i] < flife[i] && fp[i * 3 + 1] > -9000) sample.push([Math.round(fp[i * 3]), Math.round(fp[i * 3 + 1]), Math.round(fp[i * 3 + 2]), +fT[i].toFixed(2), Math.round(fS[i])]);
    return { sample, cam: S.camPos.toArray().map(Math.round), alive: n, breath: S.breath, t: S.t, mouth: m.toArray().map(Math.round), fire: U.uFire.value.toArray().map(Math.round), p: [fp[0], fp[1], fp[2]].map(Math.round) }; };
  return { step, render, resize, setPR, thuum, dispose, debug, renderer, dragon, state: S, get pr() { return pr; }, camera, setMouse(x, y) { S.mouse = [x, y]; }, setTime(t) { S.t = t; S.cyc = -1; dmp.init = false; S.cutT = -9; } };
}
