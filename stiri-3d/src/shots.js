// „Știri din 2050” (ficțiune) — montajul (motorul /zach-d-films)
import * as THREE from 'three';
import { glowSprite, sparks, streak } from './props.js';
import { kf, lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { std, box, rng, textTex, screen, anchor, person, mayor, astronaut, robot, dome, teardrop } from './stiri.js';
import { stormStage, hiker, counterSprite, smoke } from './fulger.js';
import { ST, DURATION as DUR, CAPTIONS as CAPS } from './timing.js';

export const DURATION = DUR;
export const CAPTIONS = CAPS;
export const FADES = [[ST[6] - 0.17, ST[6] - 0.02, ST[6] + 0.04, ST[6] + 0.2]];

const idle = (t, k = 1) => Math.sin(t * 1.6) * 0.012 * k;
const STAND = { lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07] };
const talk = (t) => 0.15 + 0.35 * Math.max(0, Math.sin(t * 13) * Math.sin(t * 5.1 + 1));

// ---------- banda de știri (DOM): titlul pe segment, ceasul, banda care rulează ----------
const HEAD = ['ATENȚIE: TOT CE URMEAZĂ E FICȚIUNE', 'MARTE ȘI-A ALES PRIMUL PRIMAR', 'AUTOSTRADA IAȘI–TÂRGU MUREȘ, TERMINATĂ', 'SPORT · MECI PE LUNĂ, OPRIT DUPĂ 3 MINUTE', 'TEHNOLOGIE · GREVĂ LA ROBOȚII DE LIVRARE', 'METEO · PLOAIE UȘOARĂ DE METEORIȚI', 'ULTIMA ORĂ · MESAJ DIN 2026', 'SCRIE ÎN COMENTARII'];
let lastHead = -1;
window.__overlay = (t) => {
  let i = 0; for (let k = 0; k < ST.length; k++) if (t >= ST[k] - 0.3) i = k;
  const lh = document.getElementById('lhead'), tk = document.getElementById('tick'), clk = document.getElementById('clk');
  if (i !== lastHead) { lastHead = i; lh.textContent = HEAD[i]; }
  const a = clamp((t - (ST[i] - 0.3)) / 0.35); lh.style.transform = `translateX(${(1 - easeOut(a)) * -100}%)`;
  tk.style.transform = `translateX(${720 - ((t * 110) % 2600)}px)`;
  const m = Math.floor(t / 60), s = Math.floor(t % 60); clk.textContent = `20:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} · 2050`;
};

// ---------- studioul ----------
function studio(makeStage, scrTex) {
  const scene = makeStage({ shadowSize: 3, sunDir: [-2, 6, 5], sun: 1.6 });
  scene.children.forEach(o => { if (o.material && o.material.isShadowMaterial) o.visible = false; });
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x050a18); u.mid.value.set(0x0a1430); u.horizon.value.set(0x10204a); u.floorC.value.set(0x050a18);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(12, 64), new THREE.MeshStandardMaterial({ color: 0x0c1428, roughness: 0.25, metalness: 0.4 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 6, 64, 1, true, Math.PI * 0.75, Math.PI * 0.5), new THREE.MeshStandardMaterial({ color: 0x0e1a3a, roughness: 0.6, side: THREE.BackSide })); wall.position.set(0, 3, 2.5); scene.add(wall);
  const scr = screen(1.9, 1.07, scrTex, 1.1); scr.position.set(0, 2.25, -2.6); scene.add(scr);
  const frame = box(2.0, 1.16, 0.06, std(0x1b2232, { metalness: 0.6, roughness: 0.3 }), [0, 2.25, -2.64]); scene.add(frame);
  for (const x of [-2.4, 2.4]) for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.05, 3.2, 0.05), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 0.6, 1.6), toneMapped: false })); s.position.set(x + (x > 0 ? i * 0.35 : -i * 0.35), 1.8, -2.9 + i * 0.4); scene.add(s); }
  const deskM = std(0xeef1f6, { roughness: 0.3, metalness: 0.2 });
  const desk = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.2, 0.95, 48, 1, false, -0.9, 1.8), deskM); desk.position.set(0, 0.475, -0.9); desk.rotation.y = Math.PI; desk.castShadow = desk.receiveShadow = true; scene.add(desk);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.05, 48, 1, false, -0.95, 1.9), std(0x0f1a33, { roughness: 0.2, metalness: 0.5 })); top.position.set(0, 0.97, -0.9); top.rotation.y = Math.PI; scene.add(top);
  const logo = screen(1.3, 0.34, textTex(['ȘTIRI 2050'], { w: 768, h: 200, bg: '#c8202a', fg: '#ffffff', size: 120 }), 1); logo.position.set(0, 0.55, 0.32); logo.rotation.x = -0.05; scene.add(logo);
  const key = new THREE.SpotLight(0xffffff, 40, 12, 0.6, 0.6); key.position.set(1.5, 3.5, 3); key.target.position.set(0, 1.4, -1.2); scene.add(key, key.target);
  const an = anchor(); an.root.position.set(0, 0, -1.25); scene.add(an.root);
  return { scene, an, scr };
}
function anchorPose(an, t, extra = {}) {
  an.setPose({ ...STAND, chest: [idle(t) + 0.04, 0.05 * Math.sin(t * 0.8), 0], neck: [0.02, 0.06 * Math.sin(t * 0.7), 0], lSh: [-0.55, 0, 0.18], rSh: [-0.55, 0, -0.18], lEl: [-1.0 - 0.15 * Math.sin(t * 2), 0, 0.2], rEl: [-1.0 - 0.15 * Math.sin(t * 2.3 + 1), 0, -0.2], ...extra });
  an.setMouth(talk(t));
}

// ============ A: deschiderea — prezentatorul în studio ============
function shotA({ makeStage }) {
  const { scene, an } = studio(makeStage, textTex(['ȘTIRI DIN', 'VIITOR', '2050'], { w: 1024, h: 576, bg: '#0a1f5c', fg: '#ffffff', size: 130, accent: '#c8202a' }));
  const c = cam(36);
  return {
    scene, camera: c,
    update(t) {
      anchorPose(an, t);
      const k = easeInOut(range(t, 0, 4.6)), s = shake(t, 0.3);
      place(c, [lerp(0.9, 0.3, k) + s[0], lerp(1.9, 1.62, k) + s[1], lerp(4.8, 2.6, k)], [0, lerp(1.6, 1.45, k), -1.2]);
      return { dof: { focus: c.position.distanceTo(V(0, 1.5, -1.2)), aperture: 0.003, maxblur: 0.008 }, bloom: 0.5 };
    },
  };
}

// ============ B: Marte — primul primar, ales cu 3 voturi ============
function shotB({ makeStage }) {
  const scene = makeStage({ shadowSize: 5, sunDir: [-3, 5, 4], sun: 2.2 });
  scene.children.forEach(o => { if (o.material && o.material.isShadowMaterial) o.visible = false; });
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x8a5a3a); u.mid.value.set(0xc48a5a); u.horizon.value.set(0xe0b07a); u.floorC.value.set(0x8a4a2a);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300, 1, 1), std(0xa8522c, { roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const r = rng(5); for (let i = 0; i < 40; i++) { const rk = new THREE.Mesh(new THREE.DodecahedronGeometry(0.1 + r() * 0.35, 0), std(0x7a3a1c, { roughness: 1 })); rk.position.set((r() - 0.5) * 30, 0.05, -2 - r() * 25); rk.castShadow = true; scene.add(rk); }
  [[-5, -14, 4], [3, -18, 5.5], [9, -11, 3], [-11, -20, 6]].forEach(([x, z, rr]) => { const d = dome(rr); d.position.set(x, 0, z); scene.add(d); const b = box(rr * 0.6, rr * 0.5, rr * 0.6, std(0xdedede), [x, rr * 0.25, z]); scene.add(b); });
  const pod = box(1.2, 0.5, 0.8, std(0xf2f2f2), [0, 0.25, -1.4]); scene.add(pod);
  const may = mayor(); may.root.position.set(0, 0.5, -1.5); scene.add(may.root);
  const crowd = [0xe8e8e8, 0xd0d6e0, 0xe8e8e8, 0xd8d0c8].map((col, i) => { const a = astronaut(col, [0x2b56c8, 0xc8202a, 0xf2c21a, 0x2aa54a][i]); a.root.position.set(-1.5 + i, 0, 0.6 + (i % 2) * 0.3); a.root.rotation.y = Math.PI + (i - 1.5) * 0.15; scene.add(a.root); return a; });
  const cnt = counterSprite(); scene.add(cnt);
  const c = cam(38);
  const T3 = ST[1] + 4.2 - ST[1];
  return {
    scene, camera: c,
    update(t) {
      const wave = Math.sin(t * 7);
      may.setPose({ ...STAND, chest: [idle(t), 0, 0], rSh: [-0.2, 0, -2.4], rEl: [0, 0, -0.5 + 0.4 * wave], lSh: [-0.3, 0, 0.3], neck: [0.05, 0.2 * Math.sin(t), 0] }); may.setMouth(0.4 + 0.2 * Math.sin(t * 3));
      crowd.forEach((a, i) => { const j = Math.max(0, Math.sin(t * 6 + i * 1.7)); a.setPose({ ...STAND, lSh: [0, 0, 2.2 + 0.4 * j], rSh: [0, 0, -2.2 - 0.4 * j], lEl: [0, 0, 0.3], rEl: [0, 0, -0.3], drop: -0.03 * j }); a.root.position.y = 0.08 * j; });
      cnt.setText(t > T3 ? '+3' : ''); cnt.visible = t > T3; cnt.position.set(0.85, 2.7, -1.4); cnt.scale.setScalar(0.9 * easeOut(clamp((t - T3) / 0.3)) + 0.01);
      const k = easeInOut(range(t, 0, 5.9)), s = shake(t, 0.4);
      place(c, [lerp(1.4, 0.9, k) + s[0], lerp(2.9, 2.6, k) + s[1], lerp(7.2, 6.0, k)], [0, 1.5, -1.4]);
      return { dof: { focus: c.position.distanceTo(V(0, 1.6, -1.5)), aperture: 0.002, maxblur: 0.006 }, bloom: 0.35 };
    },
  };
}

// ============ C: autostrada Iași–Târgu Mureș, terminată ============
function shotC({ makeStage }) {
  const scene = makeStage({ shadowSize: 6, sunDir: [-3, 6, 4] });
  scene.children.forEach(o => { if (o.material && o.material.isShadowMaterial) o.visible = false; });
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), std(0x5d8a3a, { roughness: 1 })); grass.rotation.x = -Math.PI / 2; grass.receiveShadow = true; scene.add(grass);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(9, 400), std(0x3a3d44, { roughness: 0.9 })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, -180); road.receiveShadow = true; scene.add(road);
  for (let z = 4; z > -380; z -= 6) for (const x of [-1.5, 1.5]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 3), new THREE.MeshBasicMaterial({ color: 0xffffff })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.02, z); scene.add(m); }
  for (const x of [-4.3, 4.3]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 400), new THREE.MeshBasicMaterial({ color: 0xffffff })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.02, -180); scene.add(m); }
  // portal cu indicator verde
  for (const x of [-4.8, 4.8]) scene.add(box(0.2, 6, 0.2, std(0x9aa1ab, { metalness: 0.6 }), [x, 3, -9]));
  scene.add(box(9.8, 0.25, 0.25, std(0x9aa1ab, { metalness: 0.6 }), [0, 5.9, -9]));
  const sign = screen(5.6, 1.5, textTex(['IAȘI — TÂRGU MUREȘ', 'A8 · TERMINATĂ'], { w: 1024, h: 280, bg: '#0f6b2e', fg: '#ffffff', size: 70 }), 1); sign.material = new THREE.MeshStandardMaterial({ map: sign.material.map, roughness: 0.5 }); sign.position.set(0, 5.0, -8.88); scene.add(sign);
  // panglica
  const ribL = box(2.4, 0.08, 0.02, std(0xd62020, { roughness: 0.5 }), [-1.2, 1.05, -2.2]), ribR = ribL.clone(); ribR.position.x = 1.2; scene.add(ribL, ribR);
  for (const x of [-2.6, 2.6]) scene.add(box(0.06, 1.1, 0.06, std(0xdddddd), [x, 0.55, -2.2]));
  const ppl = [[0xc9302c, 0x34548a], [0x2aa54a, 0x2c2c2c], [0xf2c21a, 0x34548a], [0x7b4bb0, 0x2c2c2c], [0x2b56c8, 0x5a4632]].map(([a, b], i) => { const p = person(a, b); p.root.position.set(-2 + i, 0, -0.6 + (i % 2) * 0.5); p.root.rotation.y = (i - 2) * -0.15; scene.add(p.root); return p; });
  const tears = ppl.map(() => [0, 1, 2, 3].map(() => { const s = teardrop(); scene.add(s); return s; }));
  const conf = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.05, 0.08), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide }), 220); conf.frustumCulled = false; scene.add(conf);
  const r = rng(3), CF = []; for (let i = 0; i < 220; i++) { CF.push([r() * 6 - 3, r() * 3, r() * 4 - 4, r()]); conf.setColorAt(i, new THREE.Color().setHSL(r(), 0.8, 0.55)); }
  const c = cam(40);
  const TCUT = ST[2] + 2.6 - ST[2];
  return {
    scene, camera: c,
    update(t) {
      const cut = easeOut(range(t, TCUT, TCUT + 0.5));
      ribL.position.x = -1.2 - cut * 0.3; ribL.rotation.z = cut * 1.2; ribR.position.x = 1.2 + cut * 0.3; ribR.rotation.z = -cut * 1.2;
      ppl.forEach((p, i) => { const j = Math.max(0, Math.sin(t * 5 + i)) * (t > TCUT ? 1 : 0.2); p.setPose({ ...STAND, lSh: [-0.3, 0, 0.3 + 2 * j], rSh: [-0.3, 0, -0.3 - 2 * j], lEl: [-0.4, 0, 0], rEl: [-0.4, 0, 0], neck: [-0.1, 0, 0.1 * Math.sin(t * 3 + i)] }); p.setMouth(0.4 + 0.4 * j); p.root.updateMatrixWorld(true);
        tears[i].forEach((s, k) => { const ph = ((t * 1.2 + k * 0.25 + i * 0.13) % 1); const eye = p.j.head.localToWorld(V((k % 2 ? 1 : -1) * 0.035, 0.1, 0.1)); s.position.copy(eye).add(V(0, -ph * 0.25, 0.02)); s.material.opacity = t > 1.5 ? 0.9 * (1 - ph) : 0; }); });
      const o = new THREE.Object3D(); CF.forEach(([x, y, z, d], i) => { const tt = Math.max(0, t - TCUT); const yy = 4 + y - tt * (0.8 + d); o.position.set(x + Math.sin(tt * 3 + i) * 0.2, t > TCUT ? yy : -10, z); o.rotation.set(tt * 5 + i, tt * 3, 0); o.updateMatrix(); conf.setMatrixAt(i, o.matrix); }); conf.instanceMatrix.needsUpdate = true;
      const k = easeInOut(range(t, 0, 5.3)), s = shake(t, 0.4);
      place(c, [lerp(0.6, 0.3, k) + s[0], lerp(1.8, 2.1, k) + s[1], lerp(4.6, 3.9, k)], [0, lerp(1.9, 2.5, k), -5]);
      return { dof: { focus: 4, aperture: 0.0015, maxblur: 0.005 }, bloom: 0.35 };
    },
  };
}

// ============ D: fotbal pe Lună — mingea n-a mai aterizat ============
function shotD({ makeStage }) {
  const scene = makeStage({ shadowSize: 6, sunDir: [-4, 5, 2], sun: 3.0 });
  scene.children.forEach(o => { if (o.material && o.material.isShadowMaterial) o.visible = false; if (o.isHemisphereLight) o.intensity = 0.15; });
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x000000); u.mid.value.set(0x020206); u.horizon.value.set(0x05060c); u.floorC.value.set(0x111111);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300, 160, 160), std(0x8a8a8a, { roughness: 1 })); ground.rotation.x = -Math.PI / 2;
  { const p = ground.geometry.attributes.position, r = rng(9), cr = []; for (let i = 0; i < 40; i++) cr.push([(r() - 0.5) * 80, (r() - 0.5) * 80, 0.6 + r() * 3]); for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); let h = 0; for (const [cx, cy, cr2] of cr) { const d = Math.hypot(x - cx, y - cy) / cr2; if (d < 1) h -= 0.25 * cr2 * (1 - d * d) * 0.3; else if (d < 1.3) h += 0.04 * cr2; } p.setZ(i, h); } ground.geometry.computeVertexNormals(); }
  ground.receiveShadow = true; scene.add(ground);
  const stars = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array([...Array(1500)].flatMap(() => { const v = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.6 + 0.05, Math.random() - 0.5).normalize().multiplyScalar(70); return [v.x, v.y, v.z]; })), 3)), new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, toneMapped: false })); scene.add(stars);
  const eTex = textTex([''], { w: 256, h: 128, bg: '#1a4fa8' }); const earth = new THREE.Mesh(new THREE.SphereGeometry(4, 48, 32), std(0x2a6ad8, { roughness: 0.6, emissive: 0x0a1a40 })); earth.position.set(-8, 22, -50); scene.add(earth);
  const cl = new THREE.Mesh(new THREE.SphereGeometry(4.05, 48, 32), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 })); cl.position.copy(earth.position); cl.scale.set(1, 0.6, 1); scene.add(cl);
  // poarta
  const gm = std(0xf2f2f2); for (const x of [-1.6, 1.6]) scene.add(box(0.08, 1.4, 0.08, gm, [x, 0.7, -7])); scene.add(box(3.3, 0.08, 0.08, gm, [0, 1.4, -7]));
  const a1 = astronaut(0xf0f0f0, 0xc8202a), a2 = astronaut(0xf0f0f0, 0x2b56c8); a1.root.position.set(0.3, 0, 0); a1.root.rotation.y = Math.PI; a2.root.position.set(1.6, 0, -2.2); a2.root.rotation.y = -2.4; scene.add(a1.root, a2.root);
  const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 1), new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 0.5 })); ball.castShadow = true; scene.add(ball);
  const dust = sparks(60, { speed: 0.6, spread: 1.5, gravity: -0.8, life: 1.4, size: 0.04, seed: 2, color: [0.6, 0.6, 0.6], dir: V(0, 1, 0) }); dust.position.set(0.3, 0.05, -0.3); scene.add(dust);
  const c = cam(40);
  const TK = 2.3;
  return {
    scene, camera: c,
    update(t) {
      const kick = smooth(range(t, TK - 0.35, TK)) * (1 - smooth(range(t, TK, TK + 0.4)));
      a1.setPose({ ...STAND, rHip: [0.7 * smooth(range(t, TK - 0.8, TK - 0.35)) - 1.4 * kick, 0, -0.1], rKn: [0.8 * smooth(range(t, TK - 0.8, TK - 0.35)) * (1 - kick), 0, 0], lSh: [-0.6 * kick, 0, 0.5], rSh: [0.5 * kick, 0, -0.5], neck: t > TK + 0.6 ? [-0.6, 0, 0] : [0.2, 0, 0] });
      const look = smooth(range(t, TK + 0.4, TK + 1.2));
      a2.setPose({ ...STAND, neck: [-0.7 * look, 0, 0], lSh: [-2.6 * look, 0, 0.4], rSh: [-2.6 * look, 0, -0.4], lEl: [-1.2 * look, 0, 0], rEl: [-1.2 * look, 0, 0] });
      const ft = t - TK;
      if (ft < 0) ball.position.set(0.25, 0.11, -0.45); else ball.position.set(0.25 - ft * 0.3, 0.11 + ft * 4.5 - 0.81 * ft * ft * 0.05, -0.45 - ft * 2.2);
      ball.rotation.set(t * 4, t * 3, 0);
      dust.update(t - TK);
      const k = easeInOut(range(t, 0, 6.3)), s = shake(t, 0.4);
      const lk = ft > 0.3 ? ball.position.clone().lerp(V(0.3, 1.2, -0.5), 0.6) : V(0.4, 1.0, -0.6);
      place(c, [lerp(2.6, 2.2, k) + s[0], lerp(1.2, 0.9, k) + s[1], lerp(3.6, 3.2, k)], [lk.x, lk.y, lk.z]);
      return { dof: { focus: 3.4, aperture: 0.0015, maxblur: 0.005 }, bloom: 0.35 };
    },
  };
}

// ============ E: roboții de livrare în grevă ============
function shotE({ makeStage }) {
  const scene = makeStage({ shadowSize: 5, sunDir: [-3, 6, 4] });
  scene.children.forEach(o => { if (o.material && o.material.isShadowMaterial) o.visible = false; });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), std(0x5a5e66, { roughness: 0.95 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  scene.add(box(40, 0.15, 3, std(0xb8b8b0, { roughness: 0.9 }), [0, 0.075, -4]));
  const cols = [0xd9a066, 0x8fb3d9, 0xe0d6c8, 0xc77b6b, 0x9ab38a, 0xd9c26b];
  for (let i = 0; i < 9; i++) { const h = 6 + (i * 7 % 9); scene.add(box(4.2, h, 4, std(cols[i % 6], { roughness: 0.8 }), [-16 + i * 4.3, h / 2, -8])); for (let k = 0; k < h / 1.6; k++) scene.add(box(3.2, 0.6, 0.05, std(0x2a3448, { roughness: 0.2, metalness: 0.3 }), [-16 + i * 4.3, 1.4 + k * 1.6, -5.97])); }
  const signs = [['GREVĂ!'], ['ÎNCĂRCARE', 'GRATUITĂ!'], ['ZI LIBERĂ', 'PE SĂPTĂMÂNĂ'], ['NU MAI CĂRĂM', 'PIZZA!']];
  const bots = signs.map((sg, i) => { const r = robot(sg, i + 1); r.position.set(-2.1 + i * 1.4, 0, -1 + (i % 2) * 0.6); r.rotation.y = (1.5 - i) * 0.12; scene.add(r); return r; });
  const c = cam(40);
  return {
    scene, camera: c,
    update(t) {
      bots.forEach((b, i) => { const ph = t * 4 + i * 1.3; b.position.y = Math.abs(Math.sin(ph)) * 0.06; b.sign.rotation.z = Math.sin(ph) * 0.12; b.flag.rotation.y = Math.sin(ph * 2) * 0.4; b.position.x = -2.1 + i * 1.4 + Math.sin(t * 0.8 + i) * 0.08; });
      const k = easeInOut(range(t, 0, 7)), s = shake(t, 0.4);
      place(c, [lerp(-1.2, 0.6, k) + s[0], lerp(1.3, 1.5, k) + s[1], lerp(4.6, 4.0, k)], [lerp(-0.6, 0.4, k), 0.9, -1]);
      return { dof: { focus: 4.5, aperture: 0.0015, maxblur: 0.005 }, bloom: 0.35 };
    },
  };
}

// ============ F: meteo — ploaie ușoară de meteoriți, umbrelă blindată ============
function shotF({ makeStage }) {
  const scene = stormStage(makeStage, { night: true });
  const h = hiker(); scene.add(h.root); h.root.rotation.y = 0.25;
  h.umbrella.traverse(o => { if (o.isMesh && o.geometry.type === 'ConeGeometry' && o.geometry.parameters.radius > 0.3) o.material = new THREE.MeshStandardMaterial({ color: 0x9aa1ab, metalness: 0.9, roughness: 0.25, side: THREE.DoubleSide }); });
  const rr = rng(11), mets = [...Array(16)].map((_, i) => { const s = streak(0xffc070), g = glowSprite(0xffd090, 0.4); scene.add(s, g); return { s, g, t0: rr() * 4, x: -8 + rr() * 16, z: -8 - rr() * 20, sp: 6 + rr() * 6 }; });
  const sp = sparks(50, { speed: 1.6, spread: 1.5, gravity: -5, life: 0.6, size: 0.03, seed: 7, color: [1, 0.7, 0.3], dir: V(0, 1, 0) }); scene.add(sp);
  const _q = new THREE.Quaternion(), FLIP = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
  const c = cam(40);
  const TB = ST[5] + 3.9 - ST[5];
  return {
    scene, camera: c,
    update(t) {
      h.setPose({ ...STAND, rSh: [-0.35, 0, -0.25], rEl: [-1.7, 0, 0], chest: [idle(t), 0, 0], neck: [-0.2, 0.2, 0] }); h.setMouth(talk(t));
      h.root.updateMatrixWorld(true); h.umbrella.parent.getWorldQuaternion(_q); h.umbrella.quaternion.copy(_q.invert()).multiply(FLIP); h.umbrella.updateMatrixWorld(true);
      mets.forEach(m => { const ph = ((t - m.t0) * 0.5) % 1; const p0 = V(m.x + ph * m.sp * 0.6, 14 - ph * 16, m.z); m.g.position.copy(p0); m.s.set(p0, p0.clone().add(V(-1.6, 2.4, 0)), 0.03, 0.6 * (ph < 0.95 ? 1 : 0)); m.g.material.opacity = ph < 0.95 ? 0.9 : 0; });
      const tip = h.umbrella.localToWorld(V(0, -1.1, 0)); sp.position.copy(tip); sp.update(t - TB);
      const k = easeInOut(range(t, 0, 5.4)), s = shake(t, t > TB && t < TB + 0.3 ? 4 : 0.4);
      place(c, [lerp(1.0, 0.7, k) + s[0], lerp(1.1, 1.3, k) + s[1], lerp(3.8, 3.1, k)], [0, 1.6, 0]);
      return { dof: { focus: c.position.distanceTo(V(0, 1.5, 0)), aperture: 0.002, maxblur: 0.006 }, bloom: 0.6 };
    },
  };
}

// ============ G: ultima știre — mesajul din 2026 ============
function shotG({ makeStage }) {
  const tex = textTex(['MESAJ DIN 2026:', '„LASĂ UN', 'COMENTARIU DACĂ', 'AI AJUNS AICI”'], { w: 1024, h: 576, bg: '#0a1f5c', fg: '#ffffff', size: 92, accent: '#ffd21f' });
  const { scene, an } = studio(makeStage, tex);
  const phone = box(0.08, 0.15, 0.01, std(0x111111, { roughness: 0.2 }), [0, 0, 0]); scene.add(phone);
  const glow = glowSprite(0x8fd3ff, 0.25); scene.add(glow);
  const c = cam(34);
  return {
    scene, camera: c,
    update(t) {
      anchorPose(an, t, { rSh: [-0.9, 0, -0.1], rEl: [-1.4, 0, 0], neck: [0.25 * smooth(range(t, 0.3, 1)) * (1 - smooth(range(t, 5.5, 6.2))), 0, 0] });
      an.root.updateMatrixWorld(true); const hp = an.j.rWr.localToWorld(V(0, -0.1, 0.03)); phone.position.copy(hp); phone.lookAt(an.j.head.localToWorld(V(0, 0, 0))); glow.position.copy(hp); glow.material.opacity = 0.5;
      const k = easeInOut(range(t, 0, 9.8)), s = shake(t, 0.3);
      place(c, [lerp(-1.2, -0.4, k) + s[0], lerp(1.8, 1.7, k) + s[1], lerp(3.6, 2.6, k)], [lerp(-0.2, 0, k), 1.75, -2]);
      return { dof: { focus: c.position.distanceTo(V(0, 1.5, -1.2)), aperture: 0.002, maxblur: 0.006 }, bloom: 0.5 };
    },
  };
}

// ============ H: finalul — întrebarea ============
function shotH({ makeStage }) {
  const { scene, an } = studio(makeStage, textTex(['SCRIE ÎN', 'COMENTARII'], { w: 1024, h: 576, bg: '#c8202a', fg: '#ffffff', size: 140, accent: '#ffd21f' }));
  const c = cam(32);
  return {
    scene, camera: c,
    update(t) {
      anchorPose(an, t, { rSh: [-1.2, 0, -0.2], rEl: [-0.8, 0, 0] });
      const k = easeInOut(range(t, 0, 4.4)), s = shake(t, 0.3);
      place(c, [lerp(0.2, 0.1, k) + s[0], lerp(1.65, 1.6, k) + s[1], lerp(2.4, 1.6, k)], [0, 1.55, -1.25]);
      return { dof: { focus: c.position.distanceTo(V(0, 1.6, -1.25)), aperture: 0.003, maxblur: 0.008 }, bloom: 0.5 };
    },
  };
}

export const SHOTS = [
  { start: 0.0, end: ST[1] - 0.2, build: shotA },
  { start: ST[1] - 0.2, end: ST[2] - 0.2, build: shotB },
  { start: ST[2] - 0.2, end: ST[3] - 0.2, build: shotC },
  { start: ST[3] - 0.2, end: ST[4] - 0.2, build: shotD },
  { start: ST[4] - 0.2, end: ST[5] - 0.2, build: shotE },
  { start: ST[5] - 0.2, end: ST[6], build: shotF },
  { start: ST[6], end: ST[7] - 0.2, build: shotG },
  { start: ST[7] - 0.2, end: DURATION + 1, build: shotH },
];
