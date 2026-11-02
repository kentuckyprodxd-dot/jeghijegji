// „Ce-ar fi dacă ai sări de pe Everest?” — montajul (motorul /zach-d-films)
import * as THREE from 'three';
import { glowSprite, rippleOverlay, streak } from './props.js';
import { kf, lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { mountainScene, terrain, hSummit, range3, cloudSea, climber, wingsuiter, wingMembranes, parachute, prayerFlags, snowBurst, blowingSnow, fbm } from './everest.js';
import { ST, DURATION as DUR, CAPTIONS as CAPS } from './timing.js';

export const DURATION = DUR;
export const CAPTIONS = CAPS;
// dip la negru pe „Dar” și pe twist
export const FADES = [[ST[2] - 0.17, ST[2] - 0.02, ST[2] + 0.04, ST[2] + 0.2], [ST[4] - 0.17, ST[4] - 0.02, ST[4] + 0.04, ST[4] + 0.2]];

const idle = (t, k = 1) => Math.sin(t * 1.6) * 0.012 * k;
const STAND = { lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07] };
function handsOnHips(h) {
  for (const [s, k] of [[1, 'l'], [-1, 'r']]) {
    h.root.updateMatrixWorld(true);
    const T = h.root.localToWorld(V(s * 0.21, 0.98, 0.03)), P = h.root.localToWorld(V(s * 0.75, 1.15, -0.25));
    const hint = h.root.localToWorld(V(-s, 0, 0)).sub(h.root.getWorldPosition(V(0, 0, 0)));
    ikArm(h, k, T, P, hint);
  }
}
// munții din jur (Himalaya), aceiași în toate cadrele de pe vârf
const RANGE = [[-60, -90, 34, 46, 1], [55, -120, 40, 52, 2], [-130, -40, 45, 40, 3], [120, -30, 38, 36, 4], [-20, -190, 60, 70, 5], [160, -150, 55, 60, 6], [-170, -160, 60, 58, 7], [80, 90, 40, 38, 8], [-90, 110, 45, 42, 9], [10, 160, 60, 50, 10]];
function summitStage(makeStage, o = {}) {
  const scene = mountainScene(makeStage, { shadowSize: o.shadowSize ?? 3.5, sunDir: o.sunDir ?? [-3, 6, 4], near: 30, far: 260 });
  scene.add(terrain(70, 170, hSummit));
  range3(scene, RANGE.map(([x, z, r, h, s]) => [x, z, r, h, s]));
  scene.add(cloudSea(-38, 420, 160, 11));
  const flags = prayerFlags(V(-1.3, 0.75, -0.5), V(1.6, 0.05, -1.0), 12, 0.2); scene.add(flags);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.9, 8), new THREE.MeshStandardMaterial({ color: 0x6b4a2a })); pole.position.set(-1.3, 0.35, -0.5); pole.castShadow = true; scene.add(pole);
  return { scene, flags };
}

// ============ 1: alpinistul pe vârf, se uită în jos ============
function shot1({ makeStage }) {
  const { scene, flags } = summitStage(makeStage);
  const man = climber(); scene.add(man.root); man.root.position.set(0, -0.02, 0.15);
  const c = cam(40);
  return {
    scene, camera: c,
    update(t) {
      man.setPose({ ...STAND, chest: [0.12 + idle(t), 0, 0], spine: [0.08, 0, 0], neck: [0.35, 0, 0], head: [0.25, 0.1, 0], lSh: [-0.15, 0, 0.35], rSh: [-0.15, 0, -0.35], lEl: [-0.5, 0, 0], rEl: [-0.5, 0, 0] });
      man.setMouth(0.15 + 0.1 * smooth(range(t, 1.2, 2)));
      flags.update(t, 0.35);
      const k = easeInOut(range(t, 0, 2.7));
      const s = shake(t, 0.5);
      place(c, [lerp(1.7, 1.15, k) + s[0], lerp(0.55, 1.05, k) + s[1], lerp(2.9, 2.25, k)], [0, lerp(1.25, 1.35, k), 0.1]);
      return { dof: { focus: c.position.distanceTo(V(0, 1.3, 0.15)), aperture: 0.002, maxblur: 0.006 }, bloom: 0.3 };
    },
  };
}

// ============ 2: săritura pe lângă un zid fără fund (ce cred mulți) ============
function shot2({ makeStage }) {
  const scene = mountainScene(makeStage, { shadowSize: 6, sunDir: [-4, 7, 5], near: 20, far: 240 });
  // zidul vertical de stâncă și zăpadă, fără capăt
  const wall = terrain(60, 120, (x, z) => (fbm(x * 0.25, z * 0.25) - 0.5) * 2.5 + (fbm(x * 1.2 + 4, z * 1.2) - 0.5) * 0.4, { rockAt: 1.2 });
  wall.rotation.x = Math.PI / 2; wall.position.set(0, -28, -1.2); scene.add(wall);
  const ledge = new THREE.Mesh(new THREE.BoxGeometry(3, 0.6, 1.6), new THREE.MeshStandardMaterial({ color: 0xe8eef7, roughness: 0.85 })); ledge.position.set(0, -0.3, -0.4); ledge.receiveShadow = ledge.castShadow = true; scene.add(ledge);
  scene.add(cloudSea(-150, 500, 160, 21));
  const man = climber(); scene.add(man.root);
  const c = cam(48);
  const TJ = 0.75;
  return {
    scene, camera: c,
    update(t) {
      const ft = Math.max(0, t - TJ);
      const crouch = smooth(range(t, 0.1, TJ)) * (1 - smooth(range(t, TJ, TJ + 0.15)));
      const x = 0, z = 0.1 + ft * 1.3, y = ft * 1.6 - 4.9 * ft * ft;
      man.root.position.set(x, y, z);
      man.root.rotation.set(-0.15 * smooth(range(ft, 0, 0.6)) - ft * 0.25, 0, 0.05 * Math.sin(ft * 3));
      const fl = ft > 0 ? 1 : 0, w = Math.sin(t * 13);
      man.setPose({
        ...STAND, drop: -0.12 * crouch, spine: [0.25 * crouch, 0, 0], chest: [0.1, 0, 0],
        lHip: [-0.6 * crouch - 0.4 * fl + 0.3 * w * fl, 0, 0.15], rHip: [-0.6 * crouch - 0.2 * fl - 0.3 * w * fl, 0, -0.15], lKn: [1.0 * crouch + 0.6 * fl, 0, 0], rKn: [1.0 * crouch + 0.8 * fl, 0, 0],
        lSh: [-0.3 * crouch - 2.4 * fl + 0.4 * w * fl, 0, 0.5 * fl], rSh: [-0.3 * crouch - 2.4 * fl - 0.4 * w * fl, 0, -0.5 * fl], lEl: [-0.4, 0, 0], rEl: [-0.4, 0, 0],
        neck: [0.3 - 0.4 * fl, 0, 0], head: [0.1, 0, 0],
      });
      man.setMouth(fl ? 0.85 + 0.15 * Math.sin(t * 20) : 0.2);
      // camera: întâi lângă margine, apoi deasupra, privind în jos pe lângă zid
      const p = man.root.position;
      let cp, look;
      if (t < TJ + 0.2) { cp = [1.6, 1.3, 2.6]; look = [0, 0.9, 0.2]; }
      else { const k = easeOut(range(t, TJ + 0.2, TJ + 1.2)); cp = [lerp(1.6, 1.3, k), p.y + lerp(1.3, 3.4, k), p.z + lerp(2.5, 2.4, k)]; look = [p.x, p.y + lerp(0.9, -0.6, k), p.z + lerp(0, -0.2, k)]; }
      const s = shake(t, fl ? 2 : 0.5);
      place(c, [cp[0] + s[0], cp[1] + s[1], cp[2]], look);
      return { dof: { focus: c.position.distanceTo(p.clone().add(V(0, 0.9, 0))), aperture: 0.0025, maxblur: 0.008 }, bloom: 0.3 };
    },
  };
}

// traiectoria reală: săritura de pe vârf până în pantă (aceeași în cadrele 3 și 4)
const JUMP = { z0: 0.35, y0: 0.0, vz: 2.2, vy: 1.6, g: 9.8 };
const fallPos = (tt) => V(0, JUMP.y0 + JUMP.vy * tt - 0.5 * JUMP.g * tt * tt, JUMP.z0 + JUMP.vz * tt);
const T_HIT = (() => { let tt = 0.2; while (tt < 4 && fallPos(tt).y > hSummit(0, fallPos(tt).z) + 0.15) tt += 0.002; return tt; })();
const HIT = fallPos(T_HIT);

// ============ 3: vederea reală — Everestul are pante, nu e un zid ============
function shot3({ makeStage }) {
  const scene = mountainScene(makeStage, { shadowSize: 9, sunDir: [-3, 7, 5], near: 40, far: 300 });
  scene.add(terrain(70, 170, hSummit));
  range3(scene, RANGE);
  scene.add(cloudSea(-38, 420, 160, 11));
  const man = climber(); scene.add(man.root); man.root.scale.setScalar(1.0);
  const c = cam(42);
  const SPAN = ST[2] + 1.75 - (ST[2] - 0.0); // shotul durează până la impact
  return {
    scene, camera: c,
    update(t) {
      const tt = Math.min(T_HIT, T_HIT * clamp(t / 1.78));
      const p = fallPos(tt); man.root.position.copy(p);
      man.root.rotation.set(-tt * 1.6, 0.2, tt * 0.6);
      const w = Math.sin(t * 12);
      man.setPose({ ...STAND, lSh: [-2.2 + 0.5 * w, 0, 0.7], rSh: [-2.2 - 0.5 * w, 0, -0.7], lHip: [-0.6 + 0.4 * w, 0, 0.2], rHip: [-0.3 - 0.4 * w, 0, -0.2], lKn: [0.7, 0, 0], rKn: [0.9, 0, 0], neck: [-0.2, 0, 0] });
      man.setMouth(0.9);
      const k = easeInOut(range(t, 0, 1.8));
      const lk = p.clone().add(V(0, -0.8, 0.6)).lerp(V(0, -3.5, 2.4), 0.4); place(c, [lerp(9.5, 8.0, k), lerp(-1.2, -2.6, k), lerp(4.6, 4.0, k)], [lk.x, lk.y, lk.z]);
      return { dof: { focus: 9, aperture: 0.0006, maxblur: 0.004 }, bloom: 0.25 };
    },
  };
}

// ============ 4: impactul cu încetinitorul, apoi alunecarea pe pantă ============
function shot4({ makeStage }) {
  const scene = mountainScene(makeStage, { shadowSize: 6, sunDir: [-3, 7, 5], near: 30, far: 260 });
  const ter = terrain(70, 220, hSummit); scene.add(ter);
  range3(scene, RANGE); scene.add(cloudSea(-38, 420, 160, 11));
  const man = climber(); scene.add(man.root);
  const burst = snowBurst(70, { seed: 7, speed: 2.6, up: 1.2, size: 0.06, dir: V(0, 1, 0.6) }); burst.position.copy(HIT); scene.add(burst);
  const burst2 = snowBurst(50, { seed: 9, speed: 1.6, up: 0.6, size: 0.04, dir: V(0, 0.6, 1) }); scene.add(burst2);
  const rip = rippleOverlay(ter);
  const puff = glowSprite(0xffffff, 0.5); puff.position.copy(HIT).add(V(0, 0.2, 0)); scene.add(puff);
  const c = cam(36);
  const TI = 0.35;                       // impactul (timp local)
  const SLO = (t) => t < TI ? t : TI + (t - TI) * (t < TI + 1.1 ? 0.22 : 0.22) ;
  return {
    scene, camera: c,
    update(t) {
      // timp „fizic”: înainte de impact normal, după impact încetinit (0,22×) până la 1,4 s, apoi normal
      const sl = t < TI ? t - TI : t < TI + 1.4 ? (t - TI) * 0.22 : 1.4 * 0.22 + (t - TI - 1.4);
      const it = sl;                      // timp de la impact (încetinit)
      let p;
      if (it < 0) { p = fallPos(T_HIT + it); man.root.rotation.set(-(T_HIT + it) * 1.6, 0.2, (T_HIT + it) * 0.6); }
      else {
        // după impact: alunecă pe spate, cu picioarele la vale (+z), pe linia pantei
        const sd = it < 0.25 ? 0 : (it - 0.25) * (it - 0.25) * 1.6 + (it - 0.25) * 0.6;
        const z = HIT.z + 0.15 * easeOut(clamp(it / 0.25)) + sd, y = hSummit(0.05, z) + 0.12;
        p = V(0.05, y, z);
        const dz = 0.05, slope = Math.atan2(hSummit(0, z - dz) - hSummit(0, z + dz), 2 * dz);
        man.root.rotation.set(-Math.PI / 2 + slope * 0.9, 0, Math.sin(it * 6) * 0.1 * clamp(it));
        p.add(V(0, 0.0, 0));
      }
      man.root.position.copy(p);
      const w = Math.sin(t * 9);
      man.setPose(it < 0 ? { ...STAND, lSh: [-2.2, 0, 0.7], rSh: [-2.2, 0, -0.7], lHip: [-0.5, 0, 0.2], rHip: [-0.3, 0, -0.2], lKn: [0.7, 0, 0], rKn: [0.9, 0, 0] }
        : { lSh: [-0.6 + 0.3 * w, 0, 1.2], rSh: [-0.6 - 0.3 * w, 0, -1.2], lEl: [-0.6, 0, 0], rEl: [-0.6, 0, 0], lHip: [-0.4, 0, 0.25], rHip: [-0.2, 0, -0.25], lKn: [0.6, 0, 0], rKn: [0.4, 0, 0], neck: [0.5, 0, 0], head: [0.2, 0, 0] });
      man.setMouth(0.95);
      burst.update(it);
      burst2.position.copy(p).add(V(0, -0.05, 0.4)); burst2.update(it > 0.35 ? (it - 0.35) % 0.9 : -1);
      const u = rip.material.uniforms; u.uCenter.value.copy(ter.worldToLocal(HIT.clone()));
      u.uAmp.value = it > 0 ? Math.min(1, it * 10) * (1 - smooth(range(it, 0.4, 0.9))) : 0;
      u.uRadius.value = it > 0 ? 0.1 + easeOut(range(it, 0, 0.6)) * 1.4 : 0; u.uSpot.value = 0.25; u.uSpotAmp.value = 1; u.uRings.value = 22; u.uTime.value = t;
      puff.material.opacity = it > 0 ? Math.max(0, 0.8 - it * 2.5) : 0; puff.scale.setScalar(0.3 + Math.max(0, it) * 2.5);
      // camera: aproape la impact, apoi urmărește alunecarea
      const s = shake(t, it > 0 && it < 0.3 ? 6 : 1.2);
      const k = smooth(range(t, TI + 1.1, TI + 2.2));
      const cp = V(lerp(3.3, 3.8, k), lerp(1.5, 2.4, k), lerp(-1.3, -2.6, k)).add(k > 0 ? p : HIT);
      const look = (k > 0 ? p.clone().lerp(HIT, 0) : HIT.clone()).add(V(0, 0.25, 0.2));
      place(c, [cp.x + s[0] * 2, cp.y + s[1] * 2, cp.z], [look.x, look.y, look.z]);
      return { dof: { focus: c.position.distanceTo(look), aperture: 0.003, maxblur: 0.01 }, bloom: 0.35 };
    },
  };
}

// ============ 5: pe vârf, înainte să sari — aer cu o treime din oxigen ============
function shot5({ makeStage }) {
  const { scene, flags } = summitStage(makeStage, { sunDir: [-3, 5, 5] });
  const man = climber(); scene.add(man.root); man.root.rotation.y = 0.4;
  const breath = [0, 1, 2].map(() => { const g = glowSprite(0xffffff, 0.1); scene.add(g); return g; });
  const c = cam(34);
  return {
    scene, camera: c,
    update(t) {
      const br = Math.sin(t * 7) * 0.5 + 0.5;            // gâfâie
      const bend = smooth(range(t, 0.2, 1.0));
      man.setPose({ ...STAND, drop: -0.08 * bend, spine: [0.35 * bend, 0, 0], chest: [0.15 * bend + br * 0.05, 0, 0], neck: [-0.25 * bend, 0, 0], head: [-0.1, 0.05 * Math.sin(t), 0],
        lHip: [-0.35 * bend, 0, 0.12], rHip: [-0.35 * bend, 0, -0.12], lKn: [0.5 * bend, 0, 0], rKn: [0.5 * bend, 0, 0], lAn: [-0.15 * bend, 0, 0], rAn: [-0.15 * bend, 0, 0] });
      // mâinile pe genunchi
      man.root.updateMatrixWorld(true);
      for (const [s, k] of [[1, 'l'], [-1, 'r']]) {
        const T = man.j[k + 'Kn'].localToWorld(V(0, 0.08, 0.1)), P = man.root.localToWorld(V(s * 0.8, 1.0, 0.3));
        if (bend > 0.3) ikArm(man, k, T, P, man.root.localToWorld(V(0, 0, 1)).sub(man.root.position));
      }
      man.setMouth(0.35 + br * 0.55);
      flags.update(t, 0.45);
      man.root.updateMatrixWorld(true);
      const mouth = man.j.head.localToWorld(V(0, 0.03, 0.14));
      breath.forEach((g, i) => { const ph = ((t * 7 / (Math.PI * 2)) + i / 3) % 1; g.position.copy(mouth).add(V(0.05 * ph, 0.08 * ph, 0.25 * ph)).applyAxisAngle(V(0, 1, 0), 0); g.material.opacity = 0.35 * (1 - ph) * ph * 4; g.scale.setScalar(0.06 + ph * 0.25); });
      const k = easeInOut(range(t, 0, 5.4));
      const s = shake(t, 0.6);
      const face = man.j.head.localToWorld(V(0, 0.08, 0.05));
      place(c, [face.x + lerp(1.3, 1.0, k) + s[0], face.y + lerp(-0.1, -0.15, k) + s[1], face.z + lerp(2.2, 1.7, k)], [face.x, face.y - lerp(0.45, 0.3, k), face.z]);
      return { dof: { focus: c.position.distanceTo(face), aperture: 0.004, maxblur: 0.01 }, bloom: 0.3 };
    },
  };
}

// ============ 6: vântul de peste 100 km/h ============
function shot6({ makeStage }) {
  const { scene, flags } = summitStage(makeStage, { sunDir: [-4, 5, 3] });
  const man = climber(); scene.add(man.root); man.root.rotation.y = -1.1;
  const snow = blowingSnow(160, [10, 2.6, 4], { seed: 4, speed: 11, size: 0.01 }); snow.position.set(0, 0, 0); snow.rotation.y = 0; scene.add(snow);
  const streaks = [...Array(14)].map(() => { const s = streak(0xffffff); scene.add(s); return s; });
  const c = cam(40);
  return {
    scene, camera: c,
    update(t) {
      const gust = 0.7 + 0.3 * Math.sin(t * 2.3) * Math.sin(t * 1.1 + 1);
      man.setPose({ ...STAND, drop: -0.05, spine: [0.15, 0, -0.18 * gust], chest: [0.1, 0, -0.12 * gust], neck: [0.1, 0.5, 0], head: [0.1, 0.3, 0],
        lSh: [-1.5, 0.3, 0.3], lEl: [-1.9, 0, 0], rSh: [-0.2, 0, -0.5 - 0.2 * gust], rEl: [-0.4, 0, 0], lHip: [-0.2, 0, 0.18], rHip: [0.15, 0, -0.18], lKn: [0.3, 0, 0], rKn: [0.1, 0, 0] });
      man.setMouth(0.5 + 0.2 * Math.sin(t * 9));
      man.root.position.x = Math.sin(t * 17) * 0.004 * gust;
      flags.update(t, 1.2 * gust);
      snow.update(t);
      streaks.forEach((s, i) => { const ph = ((t * 1.6 + i * 0.37) % 1), y = 0.3 + ((i * 0.618) % 1) * 2.4, z = -1.5 + ((i * 0.41) % 1) * 3.4; const x0 = -6 + ph * 12; s.set(V(x0, y, z), V(x0 + 1.2, y, z), 0.004, 0.35 * Math.sin(ph * Math.PI)); });
      const k = easeInOut(range(t, 0, 3.6)), sh = shake(t, 2.2 * gust);
      place(c, [lerp(-1.0, -0.8, k) + sh[0], lerp(1.2, 1.35, k) + sh[1], lerp(3.4, 2.8, k)], [-0.25, 1.15, 0]);
      return { dof: { focus: c.position.distanceTo(V(0, 1.2, 0)), aperture: 0.002, maxblur: 0.006 }, bloom: 0.3 };
    },
  };
}

// ============ 7: twist — Rozov pe marginea stâncii, în costum-aripă ============
const FLY_POSE = { lSh: [0, 0, 1.25], rSh: [0, 0, -1.25], lEl: [0, 0, 0.1], rEl: [0, 0, -0.1], lHip: [0, 0, 0.28], rHip: [0, 0, -0.28], lKn: [0.05, 0, 0], rKn: [0.05, 0, 0], neck: [-0.85, 0, 0], head: [-0.3, 0, 0] };
function shot7({ makeStage }) {
  const scene = mountainScene(makeStage, { shadowSize: 4, sunDir: [-3, 6, 5], near: 40, far: 320 });
  scene.add(terrain(70, 170, (x, z) => hSummit(x, z) - Math.max(0, -z) * 0.2));
  range3(scene, RANGE); scene.add(cloudSea(-50, 420, 160, 13));
  const w = wingsuiter(); scene.add(w.root); w.root.position.set(0, -0.02, 0.15);
  w.setPose({ ...STAND, lSh: [0, 0, 0.75], rSh: [0, 0, -0.75], lHip: [0, 0, 0.15], rHip: [0, 0, -0.15] });
  const mem = wingMembranes(w, w.suit);
  const c = cam(38);
  return {
    scene, camera: c,
    update(t) {
      const jump = smooth(range(t, 2.2, 2.75));
      w.setPose({ ...STAND, drop: -0.1 * smooth(range(t, 1.8, 2.2)) * (1 - jump), chest: [idle(t) + 0.3 * jump, 0, 0], spine: [0.2 * jump, 0, 0], lSh: [0, 0, 0.75], rSh: [0, 0, -0.75], lHip: [0, 0, 0.15], rHip: [0, 0, -0.15], neck: [0.3 - 0.5 * jump, 0, 0] });
      w.root.position.set(0, 0.6 * jump - 1.2 * jump * jump, 0.15 + jump * 1.2); w.root.rotation.x = jump * 0.9;
      w.setMouth(0.1);
      const k = easeInOut(range(t, 0, 2.8)), s = shake(t, 0.6);
      place(c, [lerp(-1.6, -1.1, k) + s[0], lerp(0.6, 1.0, k) + s[1], lerp(3.0, 2.3, k)], [0, 1.1, 0.3]);
      return { dof: { focus: c.position.distanceTo(V(0, 1.1, 0.2)), aperture: 0.002, maxblur: 0.006 }, bloom: 0.3 };
    },
  };
}

// ============ 8: zborul peste ghețari ============
const hValley = (x, z) => { const v = Math.abs(x); return -120 + Math.pow(v / 60, 1.6) * 70 + (fbm(x * 0.012 + 2, z * 0.012) - 0.5) * 90 * Math.min(1, v / 80) + (fbm(x * 0.05, z * 0.05) - 0.5) * 8; };
function shot8({ makeStage }) {
  const scene = mountainScene(makeStage, { shadowSize: 6, sunDir: [-3, 6, 4], near: 60, far: 700, fog: 0xb6d6f4 });
  scene.add(terrain(900, 220, hValley, { cz: 300, rockAt: 0.8 }));
  range3(scene, [[-260, 500, 120, 160, 21], [280, 620, 140, 180, 22], [-60, 820, 150, 200, 23], [330, 250, 110, 140, 24], [-330, 200, 110, 150, 25]]);
  const w = wingsuiter(); scene.add(w.root);
  w.setPose(FLY_POSE); wingMembranes(w, w.suit);
  const trail = [0, 1].map(() => { const s = streak(0xffffff); scene.add(s); return s; });
  const c = cam(44);
  return {
    scene, camera: c,
    update(t) {
      const z = t * 26, y = -10 - t * 6 + Math.sin(t * 0.8) * 1.5, x = Math.sin(t * 0.5) * 6;
      w.root.position.set(x, y, z); w.root.rotation.set(Math.PI / 2 - 0.15, 0, Math.cos(t * 0.5) * 0.25);
      w.root.updateMatrixWorld(true);
      [w.j.lWr, w.j.rWr].forEach((j, i) => { const a = j.localToWorld(V(0, -0.05, 0)); trail[i].set(a.clone().add(V(0, 0, -3)), a, 0.006, 0.25); });
      const k = easeInOut(range(t, 0, 5.8)), s = shake(t, 1.2);
      place(c, [x + lerp(-2.4, 1.6, k) + s[0], y + lerp(2.8, 2.2, k) + s[1], z - lerp(4.6, 3.8, k)], [x, y - 1.6, z + 4], Math.cos(t * 0.5) * 0.12);
      return { dof: { focus: c.position.distanceTo(w.root.position), aperture: 0.0015, maxblur: 0.006 }, bloom: 0.3 };
    },
  };
}

// ============ 9: parașuta se deschide, aterizare pe ghețar ============
function shot9({ makeStage }) {
  const scene = mountainScene(makeStage, { shadowSize: 8, sunDir: [-3, 7, 4], near: 60, far: 600 });
  const ground = terrain(500, 160, (x, z) => (fbm(x * 0.02, z * 0.02) - 0.5) * 4 + Math.pow(Math.abs(x) / 120, 2) * 40, { rockAt: 0.85 }); scene.add(ground);
  range3(scene, [[-160, -260, 110, 150, 31], [180, -300, 120, 170, 32], [0, -420, 150, 210, 33], [260, -80, 90, 120, 34], [-250, -60, 90, 130, 35]]);
  const w = wingsuiter(); scene.add(w.root);
  const mem = wingMembranes(w, w.suit);
  const chute = parachute(); w.root.add(chute);
  const puff = snowBurst(60, { seed: 13, speed: 1.4, up: 0.8, size: 0.05 }); scene.add(puff);
  const c = cam(40);
  const TL = 2.9;   // aterizarea
  const g0 = (fbm(0, 0) - 0.5) * 4;
  return {
    scene, camera: c,
    update(t) {
      const open = easeOut(range(t, 0.25, 0.9));
      const hang = smooth(range(t, 0.25, 1.2));
      const y = g0 + Math.max(0, (TL - t) * 3.2) + (t < 0.6 ? (0.6 - t) * 4 : 0);
      const z = t * 2.2;
      w.root.position.set(0, y, z);
      w.root.rotation.set(lerp(Math.PI / 2 - 0.15, 0.1, hang) + Math.sin(t * 2) * 0.06 * (1 - smooth(range(t, TL - 0.2, TL + 0.2))), 0, Math.sin(t * 1.4) * 0.05);
      const land = smooth(range(t, TL - 0.1, TL + 0.3));
      w.setPose(t < 0.6 ? FLY_POSE : { ...STAND, lSh: [-2.6 * (1 - land), 0, 0.3], rSh: [-2.6 * (1 - land), 0, -0.3], lEl: [-0.5, 0, 0], rEl: [-0.5, 0, 0], lHip: [-0.3 * land, 0, 0.1], rHip: [-0.3 * land, 0, -0.1], lKn: [0.4 * land, 0, 0], rKn: [0.4 * land, 0, 0], drop: -0.08 * land, neck: [0.1, 0, 0] });
      mem.visible = t < 0.6;
      chute.scale.set(open * 0.999 + 0.001, open * 0.999 + 0.001, open * 0.999 + 0.001); chute.visible = open > 0.01;
      chute.canopy.scale.set(1.35 * (0.6 + 0.4 * open), 0.55 * (1 - 0.3 * land), 0.85 * (0.6 + 0.4 * open));
      chute.rotation.x = -0.1 + land * 0.9; chute.position.z = -land * 1.4; chute.position.y = -land * 1.6;
      w.setMouth(0.2 + 0.4 * land);
      puff.position.set(0, g0, z); puff.update(t - TL);
      const k = easeInOut(range(t, 0, 3.6));
      const s = shake(t, t > TL && t < TL + 0.25 ? 4 : 0.8);
      place(c, [lerp(6.5, 5.0, k) + s[0], g0 + lerp(3.6, 1.8, k) + s[1], z + lerp(7.0, 6.0, k)], [0, lerp(y + 2.4, g0 + 1.8, k), z]);
      return { dof: { focus: c.position.distanceTo(V(0, y + 1, z)), aperture: 0.0015, maxblur: 0.006 }, bloom: 0.3 };
    },
  };
}

// ============ 10: finalul — alpinistul pe vârf, mâinile în șolduri ============
function shot10({ makeStage }) {
  const { scene, flags } = summitStage(makeStage, { sunDir: [-2, 6, 6] });
  const man = climber(); scene.add(man.root); man.root.rotation.y = 0.25;
  const c = cam(36);
  return {
    scene, camera: c,
    update(t) {
      man.setPose({ ...STAND, chest: [idle(t), 0, 0], neck: [0.02, -0.1, 0], head: [0, -0.08, 0.06], lHip: [0, 0, 0.12], rHip: [0, 0, -0.12], lAn: [0, 0, -0.12], rAn: [0, 0, 0.12] });
      handsOnHips(man);
      man.setMouth(0.12 + 0.18 * Math.max(0, Math.sin(t * 2.2)) * (t < 1.2 ? 1 : 0));
      flags.update(t, 0.4);
      const k = easeInOut(range(t, 0, 2.7)), s = shake(t, 0.5);
      place(c, [lerp(0.7, 0.5, k) + s[0], lerp(1.15, 1.35, k) + s[1], lerp(3.2, 2.5, k)], [0.05, lerp(1.0, 1.15, k), 0]);
      return { dof: { focus: c.position.distanceTo(V(0, 1.2, 0)), aperture: 0.003, maxblur: 0.008 }, bloom: 0.3 };
    },
  };
}

const T3 = ST[2], T4 = ST[2] + 1.78;
export const SHOTS = [
  { start: 0.0, end: ST[1], build: shot1 },
  { start: ST[1], end: T3, build: shot2 },
  { start: T3, end: T4, build: shot3 },
  { start: T4, end: ST[3], build: shot4 },
  { start: ST[3], end: 17.25, build: shot5 },
  { start: 17.25, end: ST[4], build: shot6 },
  { start: ST[4], end: ST[5], build: shot7 },
  { start: ST[5], end: ST[6], build: shot8 },
  { start: ST[6], end: ST[7], build: shot9 },
  { start: ST[7], end: DURATION + 1, build: shot10 },
];
