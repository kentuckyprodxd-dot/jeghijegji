// „Ce-ar fi dacă te-ar lovi fulgerul?” — montajul (motorul /zach-d-films)
import * as THREE from 'three';
import { glowSprite, rippleOverlay, sparks } from './props.js';
import { kf, lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { stormStage, flashLight, bolt, rain, smoke, hiker, charred, ranger, skyscraper, cityBlocks, fernTexture, counterSprite, rng } from './fulger.js';
import { materials } from './materials.js';
import { ST, DURATION as DUR, CAPTIONS as CAPS } from './timing.js';

export const DURATION = DUR;
export const CAPTIONS = CAPS;
export const FADES = [[ST[2] - 0.17, ST[2] - 0.02, ST[2] + 0.04, ST[2] + 0.2], [ST[6] - 0.17, ST[6] - 0.02, ST[6] + 0.04, ST[6] + 0.2]];

const idle = (t, k = 1) => Math.sin(t * 1.6) * 0.012 * k;
const STAND = { lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07] };
const UMB = { rSh: [-0.35, 0, -0.25], rEl: [-1.7, 0, 0] };   // ține umbrella deasupra capului
function handsOnHips(h) {
  for (const [s, k] of [[1, 'l'], [-1, 'r']]) {
    h.root.updateMatrixWorld(true);
    const T = h.root.localToWorld(V(s * 0.21, 0.98, 0.03)), P = h.root.localToWorld(V(s * 0.75, 1.15, -0.25));
    ikArm(h, k, T, P, h.root.localToWorld(V(-s, 0, 0)).sub(h.root.getWorldPosition(V(0, 0, 0))));
  }
}
// fulger care lovește în momentul `at` (timp local): apariție bruscă, pâlpâire, stingere
// umbrela stă mereu cu vârful în sus (în coordonatele lumii)
const _q = new THREE.Quaternion(), FLIP = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
function umbUp(h, tilt = 0.15) { h.root.updateMatrixWorld(true); h.umbrella.parent.getWorldQuaternion(_q); h.umbrella.quaternion.copy(_q.invert()).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), tilt)).multiply(FLIP); h.umbrella.updateMatrixWorld(true); }
const strikeK = (t, at, len = 0.3) => { const d = t - at; if (d < 0 || d > len) return 0; return (1 - d / len) * (0.7 + 0.3 * Math.sin(d * 90)); };

// ============ A: drumețul cu umbrelă, pe câmp, în furtună ============
function shotA({ makeStage }) {
  const scene = stormStage(makeStage);
  const h = hiker(); scene.add(h.root); h.root.rotation.y = 0.35;
  const rn = rain(500, [14, 10, 10]); scene.add(rn);
  const fl = flashLight(scene); fl.position.set(-8, 14, -20);
  const c = cam(40);
  return {
    scene, camera: c,
    update(t) {
      h.setPose({ ...STAND, ...UMB, chest: [idle(t), 0, 0], neck: [-0.35, 0.15, 0], head: [-0.15, 0.1, 0] });
      umbUp(h); h.setMouth(0.25 + 0.2 * smooth(range(t, 0.8, 1.5)));
      rn.update(t);
      const f = strikeK(t, 0.9, 0.25) + strikeK(t, 1.25, 0.2) * 0.7; fl.intensity = 900 * f;
      const k = easeInOut(range(t, 0, 2.2)), s = shake(t, 0.6);
      place(c, [lerp(1.2, 0.9, k) + s[0], lerp(0.7, 0.9, k) + s[1], lerp(3.6, 3.0, k)], [0, 1.35, 0]);
      return { dof: { focus: c.position.distanceTo(V(0, 1.3, 0)), aperture: 0.002, maxblur: 0.006 }, bloom: 0.4, exposure: 1 + f * 1.2 };
    },
  };
}

// ============ B: ce cred mulți — lovit, se face scrum, ca în desene ============
function shotB({ makeStage }) {
  const scene = stormStage(makeStage);
  const h = hiker(); scene.add(h.root); h.root.rotation.y = 0.2;
  const coal = charred(h);
  const rn = rain(500, [14, 10, 10]); scene.add(rn);
  const fl = flashLight(scene); fl.position.set(0, 6, 1);
  const TS = 0.55;
  scene.updateMatrixWorld(true);
  const bl = bolt(scene, V(1.5, 22, -6), V(0.05, 2.7, 0.1), { seed: 11, halo: 1.2 });
  const smk = [0, 1, 2, 3].map(() => { const s = smoke(0.5); scene.add(s); return s; });
  const c = cam(38);
  return {
    scene, camera: c,
    update(t) {
      const it = t - TS, hit = it > 0;
      coal.on(it > 0.05);
      h.spikes.visible = it > 0.05;
      const jolt = hit ? Math.exp(-it * 3) : 0;
      h.setPose(hit ? { ...STAND, ...UMB, lSh: [-0.2, 0, 0.9 + 0.2 * Math.sin(it * 40) * jolt], rSh: [-0.55, 0, -0.12], neck: [0.1, 0, 0], drop: -0.02 } : { ...STAND, ...UMB, neck: [-0.35, 0.1, 0] });
      umbUp(h, hit ? 0.5 : 0.15); h.setMouth(hit ? 0.7 : 0.3);
      h.root.position.x = hit ? Math.sin(it * 50) * 0.02 * jolt : 0;
      bl.set(strikeK(t, TS, 0.35), clamp((t - TS + 0.08) / 0.08));
      fl.intensity = 600 * strikeK(t, TS, 0.35);
      rn.update(t);
      smk.forEach((s, i) => { const ph = ((Math.max(0, it) * 0.6 + i * 0.25) % 1); s.position.set((i - 1.5) * 0.08 + ph * 0.1, 1.9 + ph * 1.2, 0); s.material.opacity = hit ? 0.55 * (1 - ph) * Math.min(1, it * 3) : 0; s.scale.setScalar(0.2 + ph * 0.7); });
      const s = shake(t, hit && it < 0.4 ? 7 : 0.6);
      const k = easeInOut(range(t, 0, 3.1));
      place(c, [lerp(0.8, 0.5, k) + s[0], lerp(1.2, 1.35, k) + s[1], lerp(3.4, 2.7, k)], [0, 1.25, 0]);
      return { dof: { focus: c.position.distanceTo(V(0, 1.3, 0)), aperture: 0.002, maxblur: 0.006 }, bloom: 0.5, exposure: 1 + strikeK(t, TS, 0.35) * 2 };
    },
  };
}

// ============ C: în realitate — supraviețuiește, ametit, cu părul zbârlit ============
function shotC({ makeStage }) {
  const scene = stormStage(makeStage);
  const h = hiker(); scene.add(h.root); h.root.rotation.y = -0.15; h.spikes.visible = true;
  const rn = rain(400, [14, 10, 10]); scene.add(rn);
  const smk = [0, 1].map(() => { const s = smoke(0.4); scene.add(s); return s; });
  const c = cam(36);
  return {
    scene, camera: c,
    update(t) {
      const sway = Math.sin(t * 2.2) * 0.06;
      h.setPose({ ...STAND, rSh: [0.1, 0, -0.25], rEl: [-0.3, 0, 0], chest: [idle(t), 0, sway], neck: [0.05, 0, -sway * 1.5], head: [0, 0.15 * Math.sin(t * 3), 0], lSh: [-0.6 - 0.3 * smooth(range(t, 1.5, 2.2)), 0.2, 0.3], lEl: [-1.6 * smooth(range(t, 1.5, 2.2)) - 0.3, 0, 0] });
      h.setMouth(0.35 + 0.15 * Math.sin(t * 1.3));
      rn.update(t);
      smk.forEach((s, i) => { const ph = ((t * 0.5 + i * 0.5) % 1); s.position.set(i * 0.06 - 0.03, 1.95 + ph * 0.8, 0.02); s.material.opacity = 0.35 * (1 - ph); s.scale.setScalar(0.15 + ph * 0.4); });
      const k = easeInOut(range(t, 0, 4.4)), s = shake(t, 0.6);
      place(c, [lerp(-0.6, -0.3, k) + s[0], lerp(1.45, 1.6, k) + s[1], lerp(2.8, 1.9, k)], [0, lerp(1.35, 1.55, k), 0]);
      return { dof: { focus: c.position.distanceTo(V(0, 1.5, 0)), aperture: 0.003, maxblur: 0.008 }, bloom: 0.35 };
    },
  };
}

// ============ D: cu încetinitorul — fulgerul coboară, curentul trece pe piele ============
function shotD({ makeStage }) {
  const scene = stormStage(makeStage);
  const h = hiker(); scene.add(h.root); h.root.rotation.y = 0.5;
  const rn = rain(300, [12, 10, 8], { speed: 2.5 }); scene.add(rn);
  scene.updateMatrixWorld(true);
  h.setPose({ ...STAND, ...UMB, neck: [-0.4, 0.1, 0] }); umbUp(h);
  const tip = h.umbrella.localToWorld(V(0, -1.1, 0));
  const bl = bolt(scene, V(-2, 24, -8), tip, { seed: 23, segs: 22, branches: 6, halo: 0.6, glow: 0.1 });
  const fl = flashLight(scene); fl.position.copy(tip).add(V(0.5, 0.5, 1));
  const zap = [...Array(10)].map(() => { const g = glowSprite(0xaad4ff, 0.18); scene.add(g); return g; });
  const sp = sparks(90, { speed: 1.2, spread: 1.5, gravity: -3, life: 0.8, size: 0.02, seed: 4, color: [0.7, 0.85, 1] }); sp.position.set(0, 0.02, 0); scene.add(sp);
  const c = cam(36);
  const TG = 0.6, TH = 2.4;   // fulgerul coboară încet între TG și TH
  return {
    scene, camera: c,
    update(t) {
      const grow = clamp((t - TG) / (TH - TG)), hit = t > TH;
      bl.set(t > TG ? (hit ? 0.9 + 0.1 * Math.sin(t * 30) : 0.85) : 0, easeIn(grow));
      fl.intensity = hit ? 60 + 20 * Math.sin(t * 25) : 10 * grow;
      h.setPose({ ...STAND, ...UMB, neck: [-0.4, 0.1, 0], lSh: [hit ? -0.3 : 0.05, 0, hit ? 0.7 : 0.16], chest: [hit ? -0.08 : 0, 0, 0] });
      umbUp(h); h.setMouth(hit ? 0.8 : 0.3);
      rn.update(t * 0.2);
      // curentul curge pe suprafața corpului: de la umbrelă, pe braț, pe trunchi, până la picioare
      scene.updateMatrixWorld(true);
      const path = [tip, h.j.rWr.localToWorld(V(0, -0.05, 0)), h.j.rEl.localToWorld(V(0, 0, 0)), h.j.rSh.localToWorld(V(0, 0, 0.06)), h.j.chest.localToWorld(V(0.05, 0.05, 0.14)), h.j.spine.localToWorld(V(-0.05, -0.1, 0.14)), h.j.lKn.localToWorld(V(0, 0, 0.07)), h.j.lAn.localToWorld(V(0, -0.05, 0.06))];
      zap.forEach((g, i) => { const ph = ((t * 0.6 + i / zap.length) % 1); const f = ph * (path.length - 1), a = Math.floor(f), b = Math.min(path.length - 1, a + 1); g.position.copy(path[a]).lerp(path[b], f - a); g.material.opacity = hit ? 0.9 : 0; g.scale.setScalar(0.12 + 0.08 * Math.sin(t * 40 + i)); });
      sp.update(hit ? (t - TH) % 0.8 : -1);
      const k = easeInOut(range(t, 0, 7.4)), s = shake(t, hit ? 3 : 0.8);
      place(c, [lerp(1.6, 1.1, k) + s[0], lerp(0.5, 0.8, k) + s[1], lerp(3.6, 2.8, k)], [0, lerp(1.9, 1.4, k), 0]);
      return { dof: { focus: c.position.distanceTo(V(0, 1.4, 0)), aperture: 0.0015, maxblur: 0.005 }, bloom: 0.45, exposure: 1 + (hit ? 0.15 : 0.05 * grow) };
    },
  };
}

// ============ E: feriga Lichtenberg pe antebraț ============
function shotE({ makeStage }) {
  const scene = makeStage({ shadowSize: 2, sunDir: [-2, 5, 4] });
  const M = materials();
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.36, 4, 48), M.skin); arm.rotation.z = Math.PI / 2 - 0.25; arm.position.set(0, 1.2, 0); arm.castShadow = arm.receiveShadow = true; scene.add(arm);
  const fern = new THREE.Mesh(new THREE.CylinderGeometry(0.423, 0.363, 4, 48, 1, true, -Math.PI * 0.45, Math.PI * 0.9), new THREE.MeshStandardMaterial({ map: fernTexture(7), transparent: true, opacity: 0, roughness: 0.6, depthWrite: false })); arm.add(fern); fern.rotation.y = Math.PI * 0.5;
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 24), M.skin); hand.scale.set(1.1, 0.8, 1); hand.position.set(0, 2.2, 0); arm.add(hand);
  const heart = glowSprite(0xff3040, 0.5); heart.position.set(-0.9, 2.5, 0.4); scene.add(heart);
  const c = cam(34);
  return {
    scene, camera: c,
    update(t) {
      fern.material.opacity = smooth(range(t, 0.8, 2.0));
      const beat = (t % 0.9) < 0.12 ? 1 : 0; const stop = t > 0.4 && t < 1.4; heart.material.opacity = stop ? 0.15 : 0.25 + 0.6 * beat; heart.scale.setScalar(0.4 + 0.15 * beat);
      const k = easeInOut(range(t, 0, 4.5)), s = shake(t, 0.4);
      place(c, [lerp(0.4, 0.1, k) + s[0], lerp(1.9, 1.75, k) + s[1], lerp(3.3, 2.7, k)], [0, 1.35, 0]);
      return { dof: { focus: 2.6, aperture: 0.002, maxblur: 0.006 }, bloom: 0.4 };
    },
  };
}

// ============ F: zgârie-norul lovit de mai multe ori ============
function shotF({ makeStage }) {
  const scene = stormStage(makeStage, { night: true, shadowSize: 30 });
  const ss = skyscraper(); scene.add(ss); scene.add(cityBlocks(28));
  const rn = rain(500, [30, 40, 20], { speed: 28 }); rn.position.set(0, 0, 8); scene.add(rn);
  const fl = flashLight(scene); fl.distance = 300; fl.position.copy(ss.top).add(V(4, 6, 8));
  const times = [1.0, 2.7, 4.3, 5.9], bolts = times.map((a, i) => bolt(scene, V(-14 + i * 8, 120, -30), ss.top.clone(), { seed: 31 + i, segs: 24, jit: 1.0, branches: 5, core: 0.18, glow: 0.8 }));
  const counter = counterSprite(); scene.add(counter);
  const c = cam(44);
  return {
    scene, camera: c,
    update(t) {
      let f = 0, n = 0;
      bolts.forEach((b, i) => { const k = strikeK(t, times[i], 0.35); b.set(k, 1); f = Math.max(f, k); if (t > times[i]) n = i + 1; });
      fl.intensity = 30000 * f; rn.update(t);
      ss.redLight.material.opacity = 0.5 + 0.5 * (Math.sin(t * 4) > 0 ? 1 : 0);
      counter.setText(n ? '×' + n : ''); counter.position.copy(ss.top).add(V(9, -18, 0)); counter.scale.setScalar(14); counter.visible = n > 0;
      const k = easeInOut(range(t, 0, 7.8)), s = shake(t, f > 0.3 ? 4 : 0.6);
      place(c, [lerp(26, 22, k) + s[0], lerp(6, 10, k) + s[1], lerp(46, 40, k)], [0, lerp(30, 34, k), 0]);
      return { bloom: 0.8, exposure: 1 + f * 1.6 };
    },
  };
}

// ============ G: Roy Sullivan, lovit de 7 ori ============
function shotG({ makeStage }) {
  const scene = stormStage(makeStage);
  const r = rng(77), treeM = new THREE.MeshStandardMaterial({ color: 0x223a22, roughness: 1 }), trunkM = new THREE.MeshStandardMaterial({ color: 0x3a2a1c });
  for (let i = 0; i < 40; i++) { const a = r() * Math.PI * 2, d = 6 + r() * 20, x = Math.cos(a) * d, z = Math.sin(a) * d - 4, hh = 4 + r() * 4; const tr = new THREE.Mesh(new THREE.ConeGeometry(1 + r(), hh, 10), treeM); tr.position.set(x, hh / 2 + 0.8, z); tr.castShadow = true; scene.add(tr); const tk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 1, 8), trunkM); tk.position.set(x, 0.5, z); scene.add(tk); }
  const h = ranger(); scene.add(h.root); h.root.rotation.y = 0.15;
  const rn = rain(400, [14, 10, 10]); scene.add(rn);
  const fl = flashLight(scene); fl.position.set(0.5, 4, 1.5);
  const T0 = 2.4, DT = 0.55, hits = [...Array(7)].map((_, i) => T0 + i * DT);
  scene.updateMatrixWorld(true);
  const bolts = hits.map((_, i) => bolt(scene, V(-4 + (i % 3) * 4, 24, -6), V(0, 2.0, 0.05), { seed: 50 + i, segs: 16, halo: 1.2 }));
  const counter = counterSprite(); scene.add(counter);
  const smk = [0, 1, 2].map(() => { const s = smoke(0.4); scene.add(s); return s; });
  const c = cam(38);
  return {
    scene, camera: c,
    update(t) {
      let f = 0, n = 0;
      bolts.forEach((b, i) => { const k = strikeK(t, hits[i], 0.22); b.set(k, 1); f = Math.max(f, k); if (t > hits[i]) n = i + 1; });
      fl.intensity = 700 * f; rn.update(t);
      const done = t > hits[6] + 0.4;
      if (!done) { h.setPose({ ...STAND, chest: [idle(t), 0, 0], lSh: [-0.2, 0, 0.3 + 0.9 * f], rSh: [-0.2, 0, -0.3 - 0.9 * f], neck: [0.05 - 0.3 * f, 0, 0], drop: -0.04 * f }); h.setMouth(0.3 + 0.6 * f); }
      else { h.setPose({ ...STAND, chest: [idle(t), 0, 0], neck: [0, -0.08, 0], lHip: [0, 0, 0.12], rHip: [0, 0, -0.12] }); handsOnHips(h); h.setMouth(0.25); }
      h.root.updateMatrixWorld(true);
      counter.setText(n ? '' + n : ''); counter.visible = n > 0; counter.position.set(0.32, 2.12, 0.3); counter.scale.setScalar(0.5 + 0.2 * f);
      smk.forEach((s, i) => { const ph = ((t * 0.5 + i / 3) % 1); s.position.set(i * 0.05 - 0.05, 2.0 + ph * 0.9, 0); s.material.opacity = n ? 0.4 * (1 - ph) * Math.min(1, n / 3) : 0; s.scale.setScalar(0.15 + ph * 0.5); });
      const k = easeInOut(range(t, 0, 7.6)), s = shake(t, f > 0.3 ? 5 : 0.6);
      place(c, [lerp(-0.9, -0.5, k) + s[0], lerp(1.3, 1.45, k) + s[1], lerp(3.6, 2.8, k)], [0, 1.35, 0]);
      return { dof: { focus: c.position.distanceTo(V(0, 1.3, 0)), aperture: 0.002, maxblur: 0.006 }, bloom: 0.5, exposure: 1 + f * 1.4 };
    },
  };
}

// ============ H: finalul — drumețul ghemuit pe câmp ============
function shotH({ makeStage }) {
  const scene = stormStage(makeStage);
  const h = hiker(); scene.add(h.root); h.root.rotation.y = 0.3; h.umbrella.visible = false;
  const rn = rain(500, [14, 10, 10]); scene.add(rn);
  const fl = flashLight(scene); fl.position.set(10, 14, -22);
  const c = cam(38);
  return {
    scene, camera: c,
    update(t) {
      const cr = smooth(range(t, 0.2, 0.9));
      h.setPose({ ...STAND, drop: -0.42 * cr, spine: [0.5 * cr, 0, 0], chest: [0.3 * cr, 0, 0], neck: [-0.4 * cr, 0, 0], lHip: [-1.6 * cr, 0, 0.05], rHip: [-1.6 * cr, 0, -0.05], lKn: [2.2 * cr, 0, 0], rKn: [2.2 * cr, 0, 0], lAn: [-0.6 * cr, 0, 0], rAn: [-0.6 * cr, 0, 0], lSh: [-0.6 * cr - 0.2, 0, 0.5], rSh: [-0.6 * cr - 0.2, 0, -0.5], lEl: [-2.0 * cr, 0, 0], rEl: [-2.0 * cr, 0, 0] });
      h.setMouth(0.3);
      rn.update(t);
      const f = strikeK(t, 1.4, 0.25); fl.intensity = 900 * f;
      const k = easeInOut(range(t, 0, 3.5)), s = shake(t, 0.5);
      place(c, [lerp(1.6, 1.2, k) + s[0], lerp(1.2, 1.1, k) + s[1], lerp(3.4, 2.8, k)], [0, 0.75, 0]);
      return { dof: { focus: c.position.distanceTo(V(0, 0.8, 0)), aperture: 0.002, maxblur: 0.006 }, bloom: 0.4, exposure: 1 + f };
    },
  };
}

export const SHOTS = [
  { start: 0.0, end: ST[1], build: shotA },
  { start: ST[1], end: ST[2], build: shotB },
  { start: ST[2], end: ST[3], build: shotC },
  { start: ST[3], end: ST[4], build: shotD },
  { start: ST[4], end: ST[5], build: shotE },
  { start: ST[5], end: ST[6], build: shotF },
  { start: ST[6], end: ST[7], build: shotG },
  { start: ST[7], end: DURATION + 1, build: shotH },
];
