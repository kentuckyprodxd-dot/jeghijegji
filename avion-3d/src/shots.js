// „Ce-ar fi dacă ai deschide ușa avionului la 10 km?” — montajul (motorul /zach-d-films)
import * as THREE from 'three';
import { glowSprite, rippleOverlay, streak } from './props.js';
import { kf, lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { openStage, passenger, pilot, steward, cabin, CAB_R, arrow, oxyMask, airplane, clouds, debris, rng, NOSE_Z, FUS_R } from './avion.js';
import { ST, DURATION as DUR, CAPTIONS as CAPS } from './timing.js';

export const DURATION = DUR;
export const CAPTIONS = CAPS;
export const FADES = [[ST[2] - 0.17, ST[2] - 0.02, ST[2] + 0.04, ST[2] + 0.2], [ST[5] - 0.17, ST[5] - 0.02, ST[5] + 0.04, ST[5] + 0.2]];

const idle = (t, k = 1) => Math.sin(t * 1.6) * 0.012 * k;
const STAND = { lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07] };
const SIT = { lHip: [-1.5, 0, 0.08], rHip: [-1.5, 0, -0.08], lKn: [1.5, 0, 0], rKn: [1.5, 0, 0], drop: -0.47, spine: [-0.08, 0, 0] };
function handsOnHips(h) {
  for (const [s, k] of [[1, 'l'], [-1, 'r']]) {
    h.root.updateMatrixWorld(true);
    const T = h.root.localToWorld(V(s * 0.21, 0.98, 0.03)), P = h.root.localToWorld(V(s * 0.75, 1.15, -0.25));
    ikArm(h, k, T, P, h.root.localToWorld(V(-s, 0, 0)).sub(h.root.getWorldPosition(V(0, 0, 0))));
  }
}
function sky(scene, y = -60, seed = 3) { scene.add(clouds(y, 900, 140, seed, 22)); }

// ============ A: avionul la 10 km, peste nori ============
function shotA({ makeStage }) {
  const scene = openStage(makeStage, { shadowSize: 30, sunDir: [-4, 8, 3], noFloor: true, fog: 0xbcdcf7, near: 80, far: 700 });
  const pl = airplane(); pl.gear.visible = false; scene.add(pl); sky(scene, -70);
  const c = cam(40);
  return {
    scene, camera: c,
    update(t) {
      pl.position.set(0, Math.sin(t * 0.8) * 0.3, t * 4); pl.rotation.z = Math.sin(t * 0.6) * 0.03;
      const k = easeInOut(range(t, 0, 1.6));
      place(c, [lerp(-30, -24, k), lerp(9, 7, k), pl.position.z + lerp(30, 24, k)], [0, 0, pl.position.z + 2]);
      return { bloom: 0.25 };
    },
  };
}

// ============ B: pasagerul pune mâna pe mânerul ușii ============
function shotB({ makeStage }) {
  const scene = openStage(makeStage, { shadowSize: 4, sunDir: [2, 6, 3], noFloor: true });
  const cab = cabin(); scene.add(cab);
  const man = passenger(); scene.add(man.root); man.root.position.set(-1.1, 0, 0.15); man.root.rotation.y = -Math.PI / 2 + 0.35;
  const amb = new THREE.PointLight(0xfff4e0, 3, 6); amb.position.set(0, 2.2, 0.5); scene.add(amb);
  const c = cam(40);
  return {
    scene, camera: c,
    update(t) {
      man.setPose({ ...STAND, chest: [idle(t) + 0.05, 0.15, 0], neck: [0.05, 0.25 + 0.2 * smooth(range(t, 0.9, 1.6)), 0], head: [0, 0.2 * smooth(range(t, 0.9, 1.6)), 0] });
      cab.updateMatrixWorld(true); man.root.updateMatrixWorld(true);
      const H = cab.handle.localToWorld(V(-0.2, 0, 0.06));
      ikArm(man, 'r', H, man.root.localToWorld(V(-0.6, 0.9, -0.3)), V(0, 1, 0));
      man.setMouth(0.1 + 0.25 * smooth(range(t, 1.0, 1.6)));   // zâmbet șmecher
      const k = easeInOut(range(t, 0, 2.3)), s = shake(t, 0.5);
      place(c, [lerp(0.6, 0.4, k) + s[0], lerp(1.5, 1.45, k) + s[1], lerp(2.6, 2.0, k)], [-1.5, 1.15, -0.05]);
      return { dof: { focus: c.position.distanceTo(V(-1.2, 1.3, 0.1)), aperture: 0.003, maxblur: 0.008 }, bloom: 0.3 };
    },
  };
}

// ============ C: în filme — ușa zboară, toți sunt aspirați afară ============
function shotC({ makeStage }) {
  const scene = openStage(makeStage, { shadowSize: 4, sunDir: [2, 6, 3], noFloor: true });
  const cab = cabin(); scene.add(cab);
  const hole = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.95), new THREE.MeshBasicMaterial({ color: 0xcfe8ff, toneMapped: false })); hole.position.set(-1.62, 0.98, 0); hole.rotation.y = Math.PI / 2; scene.add(hole);
  const man = passenger(); scene.add(man.root);
  const deb = debris(14, 9); scene.add(deb);
  const streaks = [...Array(10)].map(() => { const s = streak(0xffffff); scene.add(s); return s; });
  const c = cam(42);
  return {
    scene, camera: c,
    update(t) {
      const out = easeIn(range(t, 0.15, 0.6));
      cab.door.position.x = -1.64 - out * 6; cab.door.rotation.z = out * 2; cab.door.visible = out < 0.95;
      hole.visible = t > 0.2;
      const pull = easeIn(range(t, 0.35, 2.0));
      man.root.position.set(lerp(-0.8, -3.2, pull), lerp(0, 0.9, pull), lerp(0.4, 0.05, pull));
      man.root.rotation.set(0, -Math.PI / 2, lerp(0, -1.3, smooth(range(t, 0.3, 1.2))));
      const w = Math.sin(t * 14);
      man.setPose({ ...STAND, lSh: [-2.6 + 0.5 * w, 0, 0.4], rSh: [-2.6 - 0.5 * w, 0, -0.4], lHip: [-0.4 + 0.5 * w, 0, 0.2], rHip: [-0.2 - 0.5 * w, 0, -0.2], lKn: [0.6, 0, 0], rKn: [0.8, 0, 0], neck: [-0.3, 0, 0] });
      man.setMouth(t > 0.2 ? 0.95 : 0.2);
      deb.children.forEach((o, i) => { const u = o.userData, kk = easeIn(range(t, 0.25 + u.d * 0.6, 1.7 + u.d * 0.4)); o.position.copy(u.p).lerp(V(-3.5, 1.0, 0), kk); o.rotation.set(u.spin.x * t, u.spin.y * t, u.spin.z * t); o.visible = kk < 0.98; });
      streaks.forEach((s, i) => { const ph = (t * 2.2 + i * 0.29) % 1, y = 0.3 + ((i * 0.618) % 1) * 1.8, z = -2 + ((i * 0.37) % 1) * 4; const x = lerp(1.2, -2.2, ph); s.set(V(x, y, z * (1 - ph)), V(x - 0.8, y, z * (1 - ph)), 0.006, t > 0.25 ? 0.5 * Math.sin(ph * Math.PI) : 0); });
      const sh = shake(t, t > 0.2 ? 5 : 1);
      place(c, [1.2 + sh[0], 1.5 + sh[1], 2.4], [-1.2, 1.1, 0]);
      return { dof: { focus: 3, aperture: 0.002, maxblur: 0.006 }, bloom: 0.35, exposure: 1.05 };
    },
  };
}

// ============ D: în realitate — trage de mâner, ușa nu se clintește; presiunea o apasă ============
function shotD({ makeStage }) {
  const scene = openStage(makeStage, { shadowSize: 4, sunDir: [2, 6, 3], noFloor: true });
  const cab = cabin(); scene.add(cab);
  const man = passenger(); scene.add(man.root); man.root.position.set(-1.05, 0, 0.1); man.root.rotation.y = -Math.PI / 2;
  const amb = new THREE.PointLight(0xfff4e0, 3, 6); amb.position.set(0, 2.2, 0.5); scene.add(amb);
  const arrows = []; for (let i = 0; i < 12; i++) { const a = arrow(0xe2262a, 0.55); a.rotation.z = Math.PI / 2; a.position.set(-1.25, 0.35 + (i % 4) * 0.42, -0.45 + Math.floor(i / 4) * 0.45); scene.add(a); arrows.push(a); }
  const rip = rippleOverlay(cab.panel);
  const c = cam(38);
  const TP = ST[3 - 1] + 2.45 - ST[2];   // „Presiunea”
  return {
    scene, camera: c,
    update(t) {
      const strain = 0.5 + 0.5 * Math.sin(t * 9);
      man.setPose({ ...STAND, drop: -0.06, spine: [-0.25 - 0.05 * strain, 0, 0], chest: [-0.1, 0, 0], neck: [0.25, 0.1, 0], lHip: [-0.35, 0, 0.12], rHip: [0.3, 0, -0.12], lKn: [0.5, 0, 0], rKn: [0.1, 0, 0] });
      cab.updateMatrixWorld(true); man.root.updateMatrixWorld(true);
      const H = cab.handle.localToWorld(V(-0.22, 0, 0.06)).add(V(0.02 * strain, 0, 0));
      ikArm(man, 'r', H, man.root.localToWorld(V(-0.6, 0.6, 0.3)), V(0, 1, 0));
      ikArm(man, 'l', H.clone().add(V(0, 0, 0.09)), man.root.localToWorld(V(0.6, 0.6, 0.3)), V(0, 1, 0));
      man.setMouth(0.55 + 0.35 * strain);
      cab.handle.rotation.z = 0.04 * Math.sin(t * 30) * strain;
      const ak = smooth(range(t, TP - 0.1, TP + 0.5));
      arrows.forEach((a, i) => { const ph = (t * 1.4 + i * 0.13) % 1; a.position.x = -1.25 - ph * 0.45; a.mat.opacity = ak * Math.sin(ph * Math.PI); a.visible = ak > 0.01; });
      const u = rip.material.uniforms, it = t - TP;
      u.uCenter.value.set(0, 0, 0.05); u.uAmp.value = it > 0 ? Math.min(1, it * 4) * (0.75 + 0.25 * Math.sin(t * 6)) : 0; u.uRadius.value = it > 0 ? 0.2 + easeOut(range(it, 0, 1.2)) * 1.0 : 0; u.uSpot.value = 0.2; u.uSpotAmp.value = 0.6; u.uRings.value = 26; u.uTime.value = t;
      const k = easeInOut(range(t, 0, 6)), s = shake(t, 1 + strain);
      const camP = t < TP ? [lerp(0.6, 0.3, k), 1.5, lerp(1.9, 1.6, k)] : [lerp(0.1, -0.1, k), 1.45, lerp(2.4, 2.2, k)];
      place(c, [camP[0] + s[0], camP[1] + s[1], camP[2]], [-1.45, 1.1, 0]);
      return { dof: { focus: c.position.distanceTo(V(-1.3, 1.1, 0)), aperture: 0.002, maxblur: 0.006 }, bloom: 0.4 };
    },
  };
}

// ============ E: secțiune — ușa e un dop mai mare decât gaura ============
function shotE({ makeStage }) {
  const scene = openStage(makeStage, { shadowSize: 3, sunDir: [-2, 6, 5], noFloor: true });
  const wallM = new THREE.MeshStandardMaterial({ color: 0xc8ccd3, roughness: 0.45, metalness: 0.3 });
  const B = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallM); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; scene.add(m); return m; };
  // peretele fuzelajului (vertical, în planul X-Y), cu o gaură de 1 × 1,9 m; exteriorul e spre -Z
  B(1.2, 3.4, 0.16, -1.1, 1.0, 0); B(1.2, 3.4, 0.16, 1.1, 1.0, 0); B(1.0, 0.75, 0.16, 0, 2.325, 0); B(1.0, 0.75, 0.16, 0, -0.325, 0);
  // opritoarele cadrului (pe interior)
  const stopM = new THREE.MeshStandardMaterial({ color: 0x5a616b, roughness: 0.5 });
  for (const [x, y, w, h] of [[-0.56, 0.95, 0.08, 1.95], [0.56, 0.95, 0.08, 1.95], [0, 1.95, 1.2, 0.08], [0, -0.05, 1.2, 0.08]]) { const s = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), stopM); s.position.set(x, y, 0.11); scene.add(s); }
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.1, 0.12), new THREE.MeshStandardMaterial({ color: 0xe9ecf0, roughness: 0.4, metalness: 0.2 })); door.castShadow = true; scene.add(door);
  const arrows = []; for (let i = 0; i < 9; i++) { const a = arrow(0xe2262a, 0.5); a.rotation.x = -Math.PI / 2; a.position.set(-0.4 + (i % 3) * 0.4, 0.35 + Math.floor(i / 3) * 0.6, 0.9); scene.add(a); arrows.push(a); }
  const outArrows = []; for (let i = 0; i < 4; i++) { const a = arrow(0x3b8cff, 0.32); a.rotation.x = Math.PI / 2; a.position.set(-0.6 + i * 0.4, 1.0 + Math.sin(i) * 0.3, -1.0); scene.add(a); outArrows.push(a); }
  const c = cam(40);
  return {
    scene, camera: c,
    update(t) {
      // ușa e trasă spre interior ca să treacă, apoi aerul o împinge în cadru: se oprește pe opritoare
      const k1 = smooth(range(t, 0.2, 1.6)), push = easeOut(range(t, 2.0, 2.6));
      door.position.set(0, 0.95, lerp(0.75, 0.2, push) + 0.4 * (1 - k1) * 0);
      door.rotation.y = 0;
      arrows.forEach((a, i) => { const ph = (t * 1.2 + i * 0.11) % 1; a.position.z = 0.95 - ph * 0.5 + (push > 0 ? 0 : 0.3); a.mat.opacity = smooth(range(t, 1.4, 2.0)) * Math.sin(ph * Math.PI); });
      outArrows.forEach((a, i) => { a.mat.opacity = 0.6 * smooth(range(t, 2.6, 3.2)); });
      const k = easeInOut(range(t, 0, 6)), s = shake(t, 0.4);
      place(c, [lerp(3.4, 3.0, k) + s[0], lerp(2.6, 2.3, k) + s[1], lerp(3.2, 2.6, k)], [0, 0.95, 0.15]);
      return { dof: { focus: 4.3, aperture: 0.001, maxblur: 0.004 }, bloom: 0.35 };
    },
  };
}

// ============ F1: un hublou crapă ============
function shotF1({ makeStage }) {
  const scene = openStage(makeStage, { shadowSize: 3, sunDir: [2, 6, 3], noFloor: true });
  const cab = cabin(); scene.add(cab);
  const w = cab.windows.find(m => m.position.x > 0 && Math.abs(m.position.z - 0.0) < 0.6) || cab.windows[cab.windows.length - 4];
  const crackM = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true });
  const r = rng(7), cracks = new THREE.Group(); w.parent.add(cracks); cracks.position.copy(w.position).add(V(-0.02, 0, 0)); cracks.rotation.y = Math.PI / 2;
  for (let i = 0; i < 9; i++) { const pts = [V(0, 0, 0)]; let a = (i / 9) * Math.PI * 2, p = V(0, 0, 0); for (let k = 0; k < 4; k++) { a += (r() - 0.5) * 0.8; p = p.clone().add(V(Math.cos(a) * 0.05, Math.sin(a) * 0.06, 0)); pts.push(p); } const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), crackM); cracks.add(l); }
  const fog = [...Array(8)].map((_, i) => { const g = glowSprite(0xffffff, 0.2); scene.add(g); return g; });
  const c = cam(36);
  return {
    scene, camera: c,
    update(t) {
      const ck = easeOut(range(t, 0.5, 0.75)); cracks.scale.setScalar(Math.max(0.001, ck * 1.6)); crackM.opacity = ck;
      fog.forEach((g, i) => { const ph = clamp((t - 0.8 - i * 0.12) / 1.2); g.position.copy(w.position).add(V(-0.3 - ph * 1.2, (i % 3 - 1) * 0.2 * ph, (i % 2 - 0.5) * 0.5 * ph)); g.scale.setScalar(0.2 + ph * 1.4); g.material.opacity = 0.6 * ph * (1 - ph * 0.5); });
      const s = shake(t, t > 0.5 ? 3 : 0.5);
      place(c, [w.position.x - 1.0 + s[0], 1.35 + s[1], w.position.z + 0.9], [w.position.x, 1.32, w.position.z]);
      return { dof: { focus: 1.35, aperture: 0.004, maxblur: 0.01 }, bloom: 0.4 };
    },
  };
}

// ============ F2: cad măștile, pasagerul și-o pune ============
function shotF2({ makeStage }) {
  const scene = openStage(makeStage, { shadowSize: 4, sunDir: [2, 6, 3], noFloor: true });
  const cab = cabin({ doorZ: -6 }); scene.add(cab);
  const man = passenger(); scene.add(man.root); man.root.position.set(0.7, 0, 0.0);
  const masks = []; for (const x of [0.7, 1.2, -0.7, -1.2]) for (const z of [0.0, 0.85, -0.85]) { const m = oxyMask(); m.position.set(x, 2.0, z + 0.25); scene.add(m); masks.push(m); }
  const fog = [...Array(10)].map((_, i) => { const g = glowSprite(0xffffff, 0.6); g.position.set((i % 3 - 1) * 1.2, 1.2 + (i % 2) * 0.6, -2 + i * 0.5); scene.add(g); return g; });
  const amb = new THREE.PointLight(0xfff4e0, 2.5, 6); amb.position.set(0, 2.2, 1.2); scene.add(amb);
  const c = cam(38);
  const TM = 0.6, TPUT = 2.6;
  return {
    scene, camera: c,
    update(t) {
      masks.forEach((m, i) => { const d = easeOut(range(t, TM + i * 0.03, TM + 0.35 + i * 0.03)); const bounce = Math.sin(clamp(t - TM - 0.35) * 14) * 0.04 * Math.exp(-clamp(t - TM - 0.35) * 3); const y = 2.25 - d * 0.75 + bounce; m.position.y = y; m.tube.scale.y = 2.32 - y + 0.01; m.tube.position.y = (2.32 - y) / 2; m.rotation.y = Math.sin(t * 2 + i) * 0.2; });
      fog.forEach((g, i) => { g.material.opacity = 0.18 * (1 - smooth(range(t, 1.5, 4))) * (0.6 + 0.4 * Math.sin(t + i)); });
      man.setPose({ ...SIT, chest: [idle(t) + 0.05, 0, 0], neck: [-0.2 * (1 - smooth(range(t, TPUT, TPUT + 0.6))), 0, 0] });
      man.root.updateMatrixWorld(true);
      // își pune masca: mâna dreaptă duce masca la față
      const my = masks[0];
      const face = man.j.head.localToWorld(V(0, 0.04, 0.14));
      const grab = smooth(range(t, TPUT - 0.8, TPUT)), put = smooth(range(t, TPUT, TPUT + 0.7));
      const hang = V(0.7, my.position.y, 0.25);
      const mp = hang.clone().lerp(face, put);
      if (put > 0) { my.position.copy(mp); my.tube.scale.y = 2.32 - mp.y; my.tube.position.y = (2.32 - mp.y) / 2; my.rotation.set(0, 0, 0); }
      const hand = man.root.localToWorld(V(-0.15, 0.85, 0.25)).lerp(hang.clone().add(V(-0.05, -0.05, 0)), grab).lerp(mp.clone().add(V(-0.06, -0.06, -0.02)), put);
      ikArm(man, 'r', hand, man.root.localToWorld(V(-0.6, 0.5, -0.2)), V(0, 1, 0));
      man.setMouth(put > 0.9 ? 0.1 : 0.4 + 0.3 * Math.sin(t * 8));
      const k = easeInOut(range(t, 0, 5.4)), s = shake(t, 1.5);
      place(c, [lerp(-0.2, 0.0, k) + s[0], lerp(1.45, 1.3, k) + s[1], lerp(2.1, 1.6, k)], [0.7, lerp(1.25, 1.15, k), 0]);
      return { dof: { focus: c.position.distanceTo(V(0.7, 1.15, 0)), aperture: 0.003, maxblur: 0.008 }, bloom: 0.35 };
    },
  };
}

// ============ G: 1990 — parbrizul cedează, pilotul e tras afară ============
function shotG({ makeStage }) {
  const scene = openStage(makeStage, { shadowSize: 6, sunDir: [-3, 7, 5], noFloor: true, fog: 0xbcdcf7, near: 60, far: 600 });
  const pl = airplane(); pl.gear.visible = false; scene.add(pl); sky(scene, -40, 9);
  const pi = pilot(); pl.add(pi.root);
  const streaks = [...Array(16)].map(() => { const s = streak(0xffffff); scene.add(s); return s; });
  const c = cam(40);
  const TB = ST[5] + 3.7 - ST[5], TO = TB + 0.6;   // parbrizul cedează, apoi pilotul iese
  const hole = pl.hole.clone(), pane = pl.shield[0], p0 = pane.position.clone(), q0 = pane.quaternion.clone();
  return {
    scene, camera: c,
    update(t) {
      pl.position.set(0, 0, 0);
      // panoul zboară spre spate
      const bt = t - TB;
      if (bt > 0) { pane.position.copy(p0).add(V(-bt * 1.5, bt * 2.5, -bt * 22)); pane.rotation.set(bt * 7, bt * 4, 0); } else { pane.position.copy(p0); pane.quaternion.copy(q0); }
      // pilotul: șoldurile în gaură, corpul întins pe spate peste bot, spre spate
      const ot = easeOut(range(t, TO, TO + 0.7));
      pi.root.visible = t > TO - 0.05;
      const ang = lerp(-0.3, -1.15, ot);
      pi.root.rotation.set(ang, 0, 0);
      const up = V(0, Math.cos(ang), Math.sin(ang));
      pi.root.position.copy(hole).addScaledVector(up, -0.95 + lerp(-0.7, 0.05, ot));
      const w = Math.sin(t * 16);
      pi.setPose({ lSh: [-2.7 + 0.4 * w, 0, 0.5], rSh: [-2.7 - 0.4 * w, 0, -0.5], lEl: [-0.3, 0, 0], rEl: [-0.3, 0, 0], neck: [0.3, 0, 0], head: [0.2, 0, 0.1 * w], lHip: [1.3, 0, 0.1], rHip: [1.3, 0, -0.1], lKn: [-0.3, 0, 0], rKn: [-0.3, 0, 0] });
      pi.setMouth(0.9);
      streaks.forEach((s, i) => { const ph = (t * 1.8 + i * 0.21) % 1, x = -3 + ((i * 0.618) % 1) * 6, y = 0.5 + ((i * 0.37) % 1) * 4; const z = NOSE_Z + 8 - ph * 20; s.set(V(x, y, z), V(x, y, z - 3), 0.02, 0.35 * Math.sin(ph * Math.PI)); });
      const k = easeInOut(range(t, 0, 7.6)), s = shake(t, bt > 0 ? 3 : 0.8);
      place(c, [lerp(-4.6, -3.3, k) + s[0], lerp(4.1, 3.5, k) + s[1], NOSE_Z + lerp(6.2, 4.4, k)], [-0.5, 2.1, NOSE_Z + 1.0]);
      return { dof: { focus: c.position.distanceTo(V(-0.5, 1.8, NOSE_Z + 1.5)), aperture: 0.001, maxblur: 0.004 }, bloom: 0.3 };
    },
  };
}

// ============ H: echipajul îl ține de picioare ============
function shotH({ makeStage }) {
  const scene = openStage(makeStage, { shadowSize: 3, sunDir: [-2, 6, 4], noFloor: true });
  const dark = new THREE.MeshStandardMaterial({ color: 0x3a3f48, roughness: 0.7 }), panelM = new THREE.MeshStandardMaterial({ color: 0x23262d, roughness: 0.5 });
  const room = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 5, 40, 1, true), new THREE.MeshStandardMaterial({ color: 0x9aa1ab, roughness: 0.6, side: THREE.BackSide })); room.rotation.x = Math.PI / 2; room.position.set(0, 1.0, 0); scene.add(room);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.05, 5), dark); floor.position.y = -0.02; scene.add(floor);
  const dash = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.7, 0.6), panelM); dash.position.set(0, 0.95, 1.7); scene.add(dash);
  const screens = [-0.8, -0.3, 0.3, 0.8].map(x => { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.26), new THREE.MeshBasicMaterial({ color: 0x2e7dd6, toneMapped: false })); s.position.set(x, 1.12, 1.39); s.rotation.y = Math.PI; scene.add(s); return s; });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.55), new THREE.MeshBasicMaterial({ color: 0xd8ecff, toneMapped: false })); win.position.set(-0.5, 1.72, 1.9); win.rotation.set(0.6, Math.PI, 0); win.scale.set(1.1, 1.3, 1); scene.add(win);
  const seat = new THREE.Group(); seat.add(new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.55), dark)); seat.children[0].position.y = 0.45; scene.add(seat); seat.position.set(-0.5, 0, 0.8);
  const pi = pilot(); scene.add(pi.root);
  const st = steward(); scene.add(st.root); st.root.position.set(-0.45, 0, 0.15); st.root.rotation.y = 0.05;
  const c = cam(40);
  return {
    scene, camera: c,
    update(t) {
      // pilotul: picioarele înăuntru, corpul ieșit prin geam (sus-față)
      pi.root.rotation.set(0.93, 0, 0.06 * Math.sin(t * 7)); pi.root.position.set(-0.5, 1.13, 1.09);
      pi.setPose({ lHip: [0.1, 0, 0.12], rHip: [0.05, 0, -0.12], lKn: [0.15, 0, 0], rKn: [0.1, 0, 0] });
      const tug = 0.5 + 0.5 * Math.sin(t * 5);
      st.setPose({ ...STAND, drop: -0.12, spine: [0.15 - 0.15 * tug, 0, 0], chest: [0.1, 0, 0], lHip: [-0.5, 0, 0.15], rHip: [0.2, 0, -0.15], lKn: [0.6, 0, 0], rKn: [0.15, 0, 0], neck: [-0.3, 0, 0] });
      scene.updateMatrixWorld(true);
      for (const k of ['l', 'r']) { const tgt = pi.j[k + 'Kn'].localToWorld(V(0, -0.2, 0)); ikArm(st, k, tgt, st.root.localToWorld(V(k === 'l' ? 0.7 : -0.7, 0.8, -0.3)), V(0, 1, 0)); }
      st.setMouth(0.5 + 0.4 * tug);
      const k = easeInOut(range(t, 0, 3)), s = shake(t, 2.5);
      place(c, [lerp(1.3, 1.1, k) + s[0], lerp(1.3, 1.35, k) + s[1], lerp(-1.6, -1.3, k)], [-0.45, 1.25, 0.9]);
      return { dof: { focus: 2.3, aperture: 0.002, maxblur: 0.006 }, bloom: 0.4 };
    },
  };
}

// ============ I: aterizarea ============
function shotI({ makeStage }) {
  const scene = openStage(makeStage, { shadowSize: 30, sunDir: [-4, 8, 3], noFloor: true, fog: 0xc6e0f7, near: 80, far: 700 });
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), new THREE.MeshStandardMaterial({ color: 0x6f9a4a, roughness: 1 })); grass.rotation.x = -Math.PI / 2; grass.position.y = -3.95; grass.receiveShadow = true; scene.add(grass);
  const run = new THREE.Mesh(new THREE.PlaneGeometry(45, 1000), new THREE.MeshStandardMaterial({ color: 0x3b3e44, roughness: 0.9 })); run.rotation.x = -Math.PI / 2; run.position.y = -3.94; run.receiveShadow = true; scene.add(run);
  for (let z = -500; z < 500; z += 30) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 14), new THREE.MeshBasicMaterial({ color: 0xffffff })); m.rotation.x = -Math.PI / 2; m.position.set(0, -3.93, z); scene.add(m); }
  const pl = airplane(); scene.add(pl);
  const smoke = [0, 1].map(() => { const g = glowSprite(0xffffff, 2); scene.add(g); return g; });
  const c = cam(40);
  const TT = 1.0;
  return {
    scene, camera: c,
    update(t) {
      const z = (t - TT) * 60, y = t < TT ? (TT - t) * 4 : 0;
      pl.position.set(0, y, z); pl.rotation.x = t < TT ? -0.06 : -0.06 * Math.exp(-(t - TT) * 2);
      smoke.forEach((g, i) => { const it = t - TT; g.position.set(i ? 3 : -3, -3.5, z - 1 - Math.max(0, it) * 10); g.material.opacity = it > 0 ? Math.max(0, 0.8 - it) : 0; g.scale.setScalar(1 + Math.max(0, it) * 6); });
      const s = shake(t, t > TT && t < TT + 0.3 ? 3 : 0.4);
      place(c, [-26 + s[0], -1.5 + s[1], 25], [0, -1, Math.max(-30, z * 0.6)]);
      return { bloom: 0.25 };
    },
  };
}

// ============ J: finalul — pilotul și stewardul ============
function shotJ({ makeStage }) {
  const scene = openStage(makeStage, { shadowSize: 3, sunDir: [-2, 6, 6] });
  const pi = pilot(); scene.add(pi.root); pi.root.position.set(-0.35, 0, 0); pi.root.rotation.y = 0.2;
  const st = steward(); scene.add(st.root); st.root.position.set(0.4, 0, -0.1); st.root.rotation.y = -0.25;
  const c = cam(36);
  return {
    scene, camera: c,
    update(t) {
      pi.setPose({ ...STAND, chest: [idle(t), 0, 0], neck: [0, -0.05, 0], lHip: [0, 0, 0.1], rHip: [0, 0, -0.1] }); handsOnHips(pi); pi.setMouth(0.25);
      st.setPose({ ...STAND, chest: [idle(t + 1), 0, 0], neck: [0, 0.1, 0], rSh: [-1.0, 0, -0.3], rEl: [-1.4, 0, 0] }); st.setMouth(0.15 + 0.15 * Math.max(0, Math.sin(t * 3)));
      const k = easeInOut(range(t, 0, 2.9)), s = shake(t, 0.5);
      place(c, [lerp(0.2, 0.1, k) + s[0], lerp(1.3, 1.4, k) + s[1], lerp(3.6, 2.9, k)], [0, lerp(1.05, 1.15, k), 0]);
      return { dof: { focus: c.position.distanceTo(V(0, 1.2, 0)), aperture: 0.003, maxblur: 0.008 }, bloom: 0.3 };
    },
  };
}

export const SHOTS = [
  { start: 0.0, end: 1.55, build: shotA },
  { start: 1.55, end: ST[1], build: shotB },
  { start: ST[1], end: ST[2], build: shotC },
  { start: ST[2], end: ST[3], build: shotD },
  { start: ST[3], end: ST[4], build: shotE },
  { start: ST[4], end: ST[4] + 2.0, build: shotF1 },
  { start: ST[4] + 2.0, end: ST[5], build: shotF2 },
  { start: ST[5], end: ST[6], build: shotG },
  { start: ST[6], end: ST[6] + 2.9, build: shotH },
  { start: ST[6] + 2.9, end: ST[7], build: shotI },
  { start: ST[7], end: DURATION + 1, build: shotJ },
];
