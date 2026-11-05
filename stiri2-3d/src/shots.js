// „Știri din 2050 – ediția a 2-a” (ficțiune) — montajul (motorul /zach-d-films)
import * as THREE from 'three';
import { glowSprite, sparks } from './props.js';
import { lerp, smooth, easeOut, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { std, box, rng, textTex, screen, anchor, person, astronaut, dome } from './stiri.js';
import { building, flyingCar, robotParts, robotPlayer, santa, surfboard, palm, clouds } from './stiri2.js';
import { ST, DURATION as DUR, CAPTIONS as CAPS } from './timing.js';

export const DURATION = DUR;
export const CAPTIONS = CAPS;
export const FADES = [[ST[6] - 0.17, ST[6] - 0.02, ST[6] + 0.04, ST[6] + 0.2]];

const idle = (t, k = 1) => Math.sin(t * 1.6) * 0.012 * k;
const STAND = { lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07] };
const talk = (t) => 0.15 + 0.35 * Math.max(0, Math.sin(t * 13) * Math.sin(t * 5.1 + 1));
const noShadowGround = (scene) => scene.children.forEach(o => { if (o.material && o.material.isShadowMaterial) o.visible = false; });

// ---------- banda de știri (DOM) ----------
const HEAD = ['ATENȚIE: TOT CE URMEAZĂ E FICȚIUNE', 'BUCUREȘTI · BLOCAJ LA ETAJUL 10', 'BAC 2050 · A PICAT INTELIGENȚA ARTIFICIALĂ', 'HOTELUL DE PE LUNĂ: „ATMOSFERĂ ZERO”', 'METEO · IARNA A FOST ANULATĂ', 'SPORT · ROMÂNIA, CAMPIOANA ROBOȚILOR', 'ULTIMA ORĂ · PREZENTATORUL E ROBOT', 'SCRIE ÎN COMENTARII'];
let lastHead = -1;
window.__overlay = (t) => {
  let i = 0; for (let k = 0; k < ST.length; k++) if (t >= ST[k] - 0.3) i = k;
  const lh = document.getElementById('lhead'), tk = document.getElementById('tick'), clk = document.getElementById('clk');
  if (i !== lastHead) { lastHead = i; lh.textContent = HEAD[i]; }
  const a = clamp((t - (ST[i] - 0.3)) / 0.35); lh.style.transform = `translateX(${(1 - easeOut(a)) * -100}%)`;
  tk.style.transform = `translateX(${720 - ((t * 110) % 2800)}px)`;
  const m = Math.floor(t / 60), s = Math.floor(t % 60); clk.textContent = `20:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} · 2050`;
  // glitch scurt pe bandă când se dezvăluie robotul
  const g = t - (ST[6] + 4.35); const on = g > 0 && g < 0.5 && Math.sin(t * 90) > 0;
  document.getElementById('lower').style.transform = on ? `translateX(${Math.sin(t * 57) * 14}px)` : '';
  document.getElementById('lower').style.filter = on ? 'hue-rotate(160deg)' : '';
};

// ---------- studioul ----------
function studio(makeStage, scrTex) {
  const scene = makeStage({ shadowSize: 3, sunDir: [-2, 6, 5], sun: 1.6 });
  noShadowGround(scene);
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x050a18); u.mid.value.set(0x0a1430); u.horizon.value.set(0x10204a); u.floorC.value.set(0x050a18);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(12, 64), new THREE.MeshStandardMaterial({ color: 0x0c1428, roughness: 0.25, metalness: 0.4 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 6, 64, 1, true, Math.PI * 0.75, Math.PI * 0.5), new THREE.MeshStandardMaterial({ color: 0x0e1a3a, roughness: 0.6, side: THREE.BackSide })); wall.position.set(0, 3, 2.5); scene.add(wall);
  const scr = screen(1.9, 1.07, scrTex, 1.1); scr.position.set(0, 2.25, -2.6); scene.add(scr);
  scene.add(box(2.0, 1.16, 0.06, std(0x1b2232, { metalness: 0.6, roughness: 0.3 }), [0, 2.25, -2.64]));
  const strips = [];
  for (const x of [-2.4, 2.4]) for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.05, 3.2, 0.05), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 0.6, 1.6), toneMapped: false })); s.position.set(x + (x > 0 ? i * 0.35 : -i * 0.35), 1.8, -2.9 + i * 0.4); scene.add(s); strips.push(s); }
  const desk = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.2, 0.95, 48, 1, false, -0.9, 1.8), std(0xeef1f6, { roughness: 0.3, metalness: 0.2 })); desk.position.set(0, 0.475, -0.9); desk.rotation.y = Math.PI; desk.castShadow = desk.receiveShadow = true; scene.add(desk);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.05, 48, 1, false, -0.95, 1.9), std(0x0f1a33, { roughness: 0.2, metalness: 0.5 })); top.position.set(0, 0.97, -0.9); top.rotation.y = Math.PI; scene.add(top);
  const logo = screen(1.3, 0.34, textTex(['ȘTIRI 2050'], { w: 768, h: 200, bg: '#c8202a', fg: '#ffffff', size: 120 }), 1); logo.position.set(0, 0.55, 0.32); logo.rotation.x = -0.05; scene.add(logo);
  const key = new THREE.SpotLight(0xffffff, 40, 12, 0.6, 0.6); key.position.set(1.5, 3.5, 3); key.target.position.set(0, 1.4, -1.2); scene.add(key, key.target);
  const an = anchor(); an.root.position.set(0, 0, -1.25); scene.add(an.root);
  return { scene, an, scr, key, strips };
}
function anchorPose(an, t, extra = {}) {
  an.setPose({ ...STAND, chest: [idle(t) + 0.04, 0.05 * Math.sin(t * 0.8), 0], neck: [0.02, 0.06 * Math.sin(t * 0.7), 0], lSh: [-0.55, 0, 0.18], rSh: [-0.55, 0, -0.18], lEl: [-1.0 - 0.15 * Math.sin(t * 2), 0, 0.2], rEl: [-1.0 - 0.15 * Math.sin(t * 2.3 + 1), 0, -0.2], ...extra });
  an.setMouth(talk(t));
}

// ============ A: deschiderea ============
function shotA({ makeStage }) {
  const { scene, an } = studio(makeStage, textTex(['ȘTIRI DIN 2050', 'EDIȚIA A 2-A'], { w: 1024, h: 576, bg: '#0a1f5c', fg: '#ffffff', size: 110, accent: '#c8202a' }));
  const c = cam(36);
  return {
    scene, camera: c,
    update(t) {
      anchorPose(an, t);
      const k = easeInOut(range(t, 0, 5.4)), s = shake(t, 0.3);
      place(c, [lerp(-0.9, 0.3, k) + s[0], lerp(2.0, 1.62, k) + s[1], lerp(5.0, 2.6, k)], [0, lerp(1.75, 1.45, k), -1.2]);
      return { dof: { focus: c.position.distanceTo(V(0, 1.5, -1.2)), aperture: 0.003, maxblur: 0.008 }, bloom: 0.5 };
    },
  };
}

// ============ B: București — străzi goale, blocaj în aer la etajul 10 ============
function shotB({ makeStage }) {
  const scene = makeStage({ shadowSize: 30, sunDir: [-8, 14, 6], sun: 2.4 });
  noShadowGround(scene);
  scene.userData.key.shadow.camera.far = 80; scene.userData.key.target.position.set(0, 15, -15); scene.userData.key.position.set(-25, 55, 10);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(14, 260), std(0x3b3e45, { roughness: 0.95 })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0, -100); road.receiveShadow = true; scene.add(road);
  for (const x of [-9.5, 9.5]) scene.add(box(5, 0.18, 260, std(0xa9a49a, { roughness: 0.95 }), [x, 0.09, -100]));
  for (let z = 10; z > -220; z -= 7) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 3.2), new THREE.MeshBasicMaterial({ color: 0xe8e8e0 })); m.rotation.x = -Math.PI / 2; m.position.set(0, 0.02, z); scene.add(m); }
  const bases = ['#d9cbb4', '#c9b8a0', '#e3d9c6', '#bfc7cf', '#d8c2a8', '#cfd6c4'];
  const r = rng(4);
  for (const side of [-1, 1]) { let z = 8; let i = 0; while (z > -200) { const w = 9 + r() * 6, fl = 11 + Math.floor(r() * 6); const b = building(10, fl, w, 30 + i + (side > 0 ? 50 : 0), bases[(i + (side > 0 ? 3 : 0)) % 6]); b.position.x = side * 17; b.position.z = z - w / 2; scene.add(b); z -= w + 0.6; i++; } }
  // balconul de la etajul 10, cu un locatar nervos
  const by = 27, bx = 11.6, bz = -9;
  scene.add(box(1.5, 0.15, 2.4, std(0xdddddd), [bx + 0.15, by, bz]));
  scene.add(box(0.05, 1.0, 2.4, std(0x666a70, { metalness: 0.7, roughness: 0.3 }), [bx - 0.55, by + 0.55, bz]));
  const etaj = screen(1.6, 0.6, textTex(['ETAJUL 10'], { w: 512, h: 192, bg: '#1d5fbf', fg: '#ffffff', size: 100 }), 1); etaj.position.set(bx - 0.6, by + 2.0, bz - 2.2); etaj.rotation.y = -Math.PI / 2; scene.add(etaj);
  const loc = person(0xf2f2f2, 0x34548a); loc.root.position.set(bx + 0.3, by + 0.07, bz); loc.root.rotation.y = -Math.PI / 2; loc.root.scale.setScalar(1); scene.add(loc.root);
  // mașinile zburătoare, bară la bară
  const COLS = [0xc8202a, 0xf2f2f2, 0x1d5fbf, 0x222428, 0xf2c21a, 0x2aa54a, 0x9aa1ab, 0xe8701a];
  const cars = [];
  for (const lane of [-3, 3]) for (let k = 0; k < 18; k++) { const car = flyingCar(COLS[(k * 3 + (lane > 0 ? 1 : 0)) % COLS.length]); car.position.set(lane + (r() - 0.5) * 0.4, by + 1.5 + (lane > 0 ? 0 : 2.2) + (r() - 0.5) * 0.3, -2 - k * 5.4); if (lane > 0) car.rotation.y = Math.PI; scene.add(car); cars.push({ car, ph: r() * 6 }); }
  scene.add(clouds(8, 3, 120, 50));
  const c = cam(40);
  return {
    scene, camera: c,
    update(t) {
      cars.forEach(({ car, ph }) => { car.position.y += Math.sin(t * 2 + ph) * 0.004; car.rotation.z = Math.sin(t * 1.5 + ph) * 0.03; car.glows.forEach((g, i) => g.scale.setScalar(0.8 + 0.15 * Math.sin(t * 30 + i + ph))); });
      const ang = 0.6 + 0.4 * Math.sin(t * 5);
      loc.setPose({ ...STAND, rSh: [-1.6, 0, -0.4], rEl: [-0.6 * ang, 0, 0], lSh: [-0.2, 0, 0.5], lEl: [-1.8, 0, 0], neck: [0.1, 0.25 * Math.sin(t * 2), 0] }); loc.setMouth(0.3 + 0.4 * ang);
      const k = easeInOut(range(t, 1.7, 3.4)), s = shake(t, 0.5);
      const p = [lerp(0.5, 3.2, k) + s[0], lerp(1.6, 31.5, k) + s[1], lerp(14, 16, k)];
      const L = [lerp(0, 2.0, k), lerp(2.6, 28.8, k), lerp(-40, -12, k)];
      place(c, [p[0] + (t - 3.4 > 0 ? (t - 3.4) * 0.3 : 0), p[1], p[2] - Math.max(0, t - 3.4) * 1.2], L);
      return { dof: { focus: 20, aperture: 0.0, maxblur: 0 }, bloom: 0.35 };
    },
  };
}

// ============ C: Bac 2050 — a picat inteligența artificială ============
function shotC({ makeStage }) {
  const scene = makeStage({ shadowSize: 5, sunDir: [4, 6, 3], sun: 1.6 });
  noShadowGround(scene);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), std(0x9a6c45, { roughness: 0.6 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const wallM = std(0xd9e4d2, { roughness: 0.9 });
  scene.add(box(10, 4, 0.1, wallM, [0, 2, -4.2])); scene.add(box(0.1, 4, 12, wallM, [-4.5, 2, 0])); scene.add(box(0.1, 4, 12, wallM, [4.5, 2, 0]));
  for (let i = 0; i < 3; i++) { const w = screen(1.4, 1.6, textTex([''], { w: 64, h: 64, bg: '#cfe8ff' }), 1.5); w.position.set(4.44, 2.1, -2.5 + i * 2.4); w.rotation.y = -Math.PI / 2; scene.add(w); }
  const banner = screen(3.6, 0.5, textTex(['BACALAUREAT 2050'], { w: 1024, h: 140, bg: '#1d3f8a', fg: '#ffffff', size: 90 }), 1); banner.position.set(0, 3.55, -4.13); scene.add(banner);
  const T1 = textTex(['AI REZOLVĂ', 'SUBIECTELE...', '██████░░ 78%'], { w: 1024, h: 576, bg: '#0b1530', fg: '#7fe0ff', size: 92 });
  const T2 = textTex(['NOTA AI: 4,50', '✗ RESPINS'], { w: 1024, h: 576, bg: '#b3121c', fg: '#ffffff', size: 130 });
  const big = screen(3.2, 1.8, T1, 1.15); big.position.set(0, 2.2, -4.13); scene.add(big);
  const tilted = new THREE.Group(); scene.add(tilted);
  const studs = [], lap = [];
  const tops = [0xc9302c, 0x2aa54a, 0xf2c21a, 0x7b4bb0, 0x2b56c8, 0xe8701a];
  for (let row = 0; row < 2; row++) for (let col = 0; col < 3; col++) {
    const x = -2.2 + col * 2.2, z = -1.2 + row * 2.0;
    scene.add(box(1.2, 0.05, 0.6, std(0xe8e0d0, { roughness: 0.5 }), [x, 0.75, z]));
    for (const dx of [-0.55, 0.55]) scene.add(box(0.04, 0.75, 0.55, std(0x555a60, { metalness: 0.6 }), [x + dx, 0.375, z]));
    scene.add(box(0.45, 0.04, 0.45, std(0x2b56c8), [x, 0.45, z + 0.55])); scene.add(box(0.45, 0.5, 0.04, std(0x2b56c8), [x, 0.7, z + 0.78]));
    const lb = box(0.4, 0.02, 0.28, std(0x30343a, { metalness: 0.6 }), [x, 0.785, z - 0.02]); scene.add(lb);
    const ls = screen(0.4, 0.26, textTex(['AI'], { w: 256, h: 160, bg: '#0b1530', fg: '#7fe0ff', size: 90 }), 1.2); ls.position.set(x, 0.92, z - 0.17); ls.rotation.x = -0.25; ls.userData.t0 = ls.material.map; scene.add(ls); lap.push(ls);
    const s = person(tops[row * 3 + col], 0x2c2c34); s.root.position.set(x, 0, z + 0.45); s.root.rotation.y = Math.PI; scene.add(s.root); studs.push(s);
  }
  const LT = textTex(['✗'], { w: 256, h: 160, bg: '#b3121c', fg: '#ffffff', size: 120 });
  const c = cam(40);
  const TF = 6.05, TW = 6.6;
  return {
    scene, camera: c,
    update(t) {
      const fail = t > TF;
      big.material.map = fail ? T2 : T1; lap.forEach(l => { l.material.map = fail ? LT : l.userData.t0; });
      if (!fail) { const blink = Math.sin(t * 6) > 0; big.material.color.setScalar(blink ? 1.15 : 1.0); } else big.material.color.setScalar(1.15 + 0.3 * Math.max(0, Math.sin(t * 14)));
      studs.forEach((s, i) => {
        const sit = { lHip: [-1.5, 0, 0.08], rHip: [-1.5, 0, -0.08], lKn: [1.5, 0, 0], rKn: [1.5, 0, 0], drop: -0.47 };
        const shock = smooth(range(t, TF + 0.15 + i * 0.05, TF + 0.5 + i * 0.05));
        s.setPose({ ...STAND, ...sit, chest: [0.1 - 0.15 * shock, 0, 0], neck: [0.1 - 0.25 * shock, 0.1 * Math.sin(t * 2 + i), 0], lSh: [-0.9, 0, 0.1], rSh: [-0.9, 0, -0.1], lEl: [-0.5, 0, 0], rEl: [-0.5, 0, 0] });
        if (shock > 0) {
          s.root.updateMatrixWorld(true);
          for (const side of ['l', 'r']) { const sg = side === 'l' ? 1 : -1; const hd = s.j.head.localToWorld(V(sg * 0.11, 0.17, 0.02)); const rest = s.j[side + 'Sh'].getWorldPosition(V(0, 0, 0)).add(V(0, -0.1, -0.35)); const tgt = rest.lerp(hd, shock); const pole = s.j[side + 'Sh'].localToWorld(V(sg * 0.6, 0.0, 0.1)); ikArm(s, side, tgt, pole, V(0, 1, 0)); }
        }
        s.setMouth(fail ? 0.6 : 0.05);
      });
      // cameră: din spatele elevilor spre ecran, apoi întoarcere bruscă spre fețele lor
      const s = shake(t, 0.5);
      if (t < TW) { const k = easeInOut(range(t, 0, TW)); place(c, [lerp(-1.6, -0.5, k) + s[0], lerp(2.4, 2.1, k) + s[1], lerp(5.0, 3.6, k)], [0, 1.9, -4]); }
      else { const k = easeOut(range(t, TW, TW + 0.35)); place(c, [lerp(-0.5, 0.3, k) + s[0], lerp(2.1, 1.75, k) + s[1], lerp(3.6, -3.2, k)], [lerp(0, 0, k), lerp(1.9, 1.0, k), lerp(-4, 0.5, k)]); }
      return { dof: { focus: 4, aperture: 0.0012, maxblur: 0.004 }, bloom: 0.45 };
    },
  };
}

// ============ D: hotelul de pe Lună — recenzia ============
function shotD({ makeStage }) {
  const scene = makeStage({ shadowSize: 8, sunDir: [-5, 4, 4], sun: 3.0 });
  scene.children.forEach(o => { if (o.material && o.material.isShadowMaterial) o.visible = false; if (o.isHemisphereLight) o.intensity = 0.18; });
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x000000); u.mid.value.set(0x020206); u.horizon.value.set(0x05060c); u.floorC.value.set(0x111111);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300, 160, 160), std(0x8a8a8a, { roughness: 1 })); ground.rotation.x = -Math.PI / 2;
  { const p = ground.geometry.attributes.position, r = rng(19), cr = []; for (let i = 0; i < 50; i++) cr.push([(r() - 0.5) * 90, (r() - 0.5) * 90, 0.6 + r() * 3]); for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); let h = 0; for (const [cx, cy, c2] of cr) { const d = Math.hypot(x - cx, y - cy) / c2; if (d < 1) h -= 0.25 * c2 * (1 - d * d) * 0.3; else if (d < 1.3) h += 0.04 * c2; } if (Math.hypot(x, y + 8) < 9) h *= 0.1; p.setZ(i, h); } ground.geometry.computeVertexNormals(); }
  ground.receiveShadow = true; scene.add(ground);
  const stars = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array([...Array(1800)].flatMap((_, i) => { const r = rng(i + 5); const v = new THREE.Vector3(r() - 0.5, r() * 0.7 + 0.03, r() - 0.5).normalize().multiplyScalar(70); return [v.x, v.y, v.z]; })), 3)), new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, toneMapped: false })); scene.add(stars);
  const earth = new THREE.Mesh(new THREE.SphereGeometry(4, 48, 32), std(0x2a6ad8, { roughness: 0.6, emissive: 0x0a1a40 })); earth.position.set(10, 26, -55); scene.add(earth);
  const cl = new THREE.Mesh(new THREE.SphereGeometry(4.05, 48, 32), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 })); cl.position.copy(earth.position); cl.scale.set(1, 0.6, 1); scene.add(cl);
  // hotelul: cupolă mare, inel de ferestre, firmă luminoasă
  const H = new THREE.Group(); H.position.set(-1.5, 0, -10); scene.add(H);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 6.4, 1.2, 64), std(0xdedede, { roughness: 0.5, metalness: 0.3 })); base.position.y = 0.6; H.add(base);
  const win = new THREE.Mesh(new THREE.CylinderGeometry(6.22, 6.22, 0.35, 64, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.7, 1.0), toneMapped: false })); win.position.y = 0.7; H.add(win);
  const d = dome(6); d.position.y = 1.2; H.add(d);
  const inner = new THREE.Mesh(new THREE.SphereGeometry(5.6, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 0.42, 0.3), side: THREE.BackSide })); inner.position.y = 1.2; H.add(inner);
  for (let i = 0; i < 5; i++) { const tr = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.4, 10), std(0x2f8a3a)); tr.position.set(-3 + i * 1.5, 2.4, -1 + (i % 2)); H.add(tr); }
  const sign = screen(5.5, 1.1, textTex(['HOTEL LUNA ★★★★★'], { w: 1024, h: 200, bg: '#0a0a12', fg: '#ffd27a', size: 100 }), 1.6); sign.position.set(0, 8.2, 2.5); H.add(sign);
  for (const x of [-2.3, 2.3]) H.add(box(0.12, 1.4, 0.12, std(0x777777, { metalness: 0.7 }), [x, 7.3, 2.5]));
  const door = screen(1.4, 1.1, textTex([''], { w: 32, h: 32, bg: '#ffe0a0' }), 1.4); door.position.set(0, 0.55, 6.25); H.add(door);
  // turistul cu valiza
  const a = astronaut(0xf0f0f0, 0x2b56c8); a.root.position.set(0.6, 0, -1.5); a.root.rotation.y = -0.5; scene.add(a.root);
  const suit = box(0.36, 0.5, 0.18, std(0xc8202a, { roughness: 0.4 }), [0, 0, 0]); scene.add(suit);
  const handle = box(0.12, 0.04, 0.03, std(0x111111), [0, 0, 0]); scene.add(handle);
  const phone = box(0.08, 0.15, 0.01, std(0x111111, { roughness: 0.2 }), [0, 0, 0]); scene.add(phone);
  // cardul cu recenzia
  const card = screen(1.5, 0.95, textTex(['★★★★☆', 'Priveliște superbă,', 'dar atmosferă ZERO.', '— Ion, de pe Pământ'], { w: 1024, h: 650, bg: '#ffffff', fg: '#1a1a22', size: 92, accent: '#ffd21f' }), 1.0); scene.add(card);
  const c = cam(40);
  const TC = 2.7;
  return {
    scene, camera: c,
    update(t) {
      a.setPose({ ...STAND, rSh: [0.05, 0, -0.25], rEl: [-0.15, 0, 0], lSh: [-0.9, 0, 0.2], lEl: [-1.3, 0, 0], neck: [0.25, 0, 0], chest: [idle(t), 0, 0] });
      a.root.updateMatrixWorld(true);
      const hp = a.j.rWr.localToWorld(V(0, -0.12, 0)); suit.position.set(hp.x, Math.max(0.25, hp.y - 0.3), hp.z); suit.rotation.y = a.root.rotation.y; handle.position.set(hp.x, hp.y - 0.03, hp.z); handle.rotation.y = a.root.rotation.y;
      const lp = a.j.lWr.localToWorld(V(0, -0.1, 0.03)); phone.position.copy(lp); phone.lookAt(a.j.head.localToWorld(V(0, 0, 0)));
      const ap = easeOut(range(t, TC, TC + 0.4)); card.visible = ap > 0.01; card.scale.setScalar(0.01 + 0.78 * ap);
      card.position.set(0.15, 2.45 + 0.03 * Math.sin(t * 2), -1.4); card.lookAt(c.position);
      const k = easeInOut(range(t, 0, 2.9)), k2 = easeInOut(range(t, 2.9, 6.8)), s = shake(t, 0.4);
      const P0 = [7.0, 3.0, 16.0], P1 = [1.2, 1.9, 3.4], P2 = [1.0, 2.0, 2.9];
      const P = P0.map((v, i) => lerp(lerp(v, P1[i], k), P2[i], k2));
      const L0 = [-1.0, 6.5, -10], L1 = [0.0, 1.9, -1.5];
      place(c, [P[0] + s[0], P[1] + s[1], P[2]], L0.map((v, i) => lerp(v, L1[i], k)));
      return { dof: { focus: c.position.distanceTo(V(0.2, 1.8, -1.4)), aperture: k > 0.9 ? 0.0015 : 0, maxblur: 0.005 }, bloom: 0.5 };
    },
  };
}

// ============ E: meteo — iarna anulată, Moș Crăciun cu placa de surf ============
function shotE({ makeStage }) {
  const scene = makeStage({ shadowSize: 6, sunDir: [5, 7, 3], sun: 3.0 });
  noShadowGround(scene);
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x2a7ad8); u.mid.value.set(0x6ab0f0); u.horizon.value.set(0xcfe8ff);
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(200, 200, 100, 100), std(0xe8d3a0, { roughness: 1 })); sand.rotation.x = -Math.PI / 2;
  { const p = sand.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, Math.sin(x * 0.7) * 0.03 + Math.sin(y * 1.1 + x * 0.3) * 0.03); } sand.geometry.computeVertexNormals(); }
  sand.receiveShadow = true; scene.add(sand);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(400, 200, 1, 1), new THREE.MeshPhysicalMaterial({ color: 0x1d8fb8, roughness: 0.08, metalness: 0.1, clearcoat: 1 })); sea.rotation.x = -Math.PI / 2; sea.position.set(0, 0.04, -106); scene.add(sea);
  const foam = new THREE.Mesh(new THREE.PlaneGeometry(400, 0.6), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, roughness: 0.6 })); foam.rotation.x = -Math.PI / 2; foam.position.set(0, 0.06, -6.2); scene.add(foam);
  const sun = glowSprite(0xfff2c0, 14); sun.position.set(25, 30, -70); scene.add(sun);
  [[-5, -3, 6.5, 1], [-7.5, -1, 5.5, 2], [6, -4, 7, 3]].forEach(([x, z, h, sd]) => { const p = palm(h, sd); p.position.set(x, 0, z); scene.add(p); });
  // indicatorul de la meteo
  scene.add(box(0.1, 1.6, 0.1, std(0x8a6a48), [1.2, 0.8, 0.6]));
  const sg = screen(1.5, 0.95, textTex(['IARNA 2050:', 'ANULATĂ', '+31°C'], { w: 768, h: 486, bg: '#ffffff', fg: '#c8202a', size: 120, accent: '#1d5fbf' }), 1); sg.material = new THREE.MeshStandardMaterial({ map: sg.material.map, roughness: 0.6 }); sg.position.set(1.2, 1.75, 0.66); sg.rotation.y = -0.25; scene.add(sg);
  // umbrelă de plajă + prosop
  const ub = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.5, 16, 1, true), std(0xf2c21a, { roughness: 0.6, side: THREE.DoubleSide })); ub.position.set(-2.4, 2.2, -1.5); scene.add(ub);
  scene.add(box(0.05, 2.2, 0.05, std(0xeeeeee), [-2.4, 1.1, -1.5]));
  scene.add(box(0.9, 0.01, 1.8, std(0x1d5fbf, { roughness: 0.9 }), [-2.2, 0.01, -1.0]));
  const ms = santa(); scene.add(ms.root);
  const board = surfboard(); ms.j.chest.add(board); board.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(V(0, 1, 0), V(0, 0, 1), V(1, 0, 0))); board.position.set(-0.36, -0.15, 0.05);
  const c = cam(40);
  const TS = 3.0;
  return {
    scene, camera: c,
    update(t) {
      foam.position.z = -6.2 + Math.sin(t * 1.2) * 0.25; foam.material.opacity = 0.6 + 0.3 * Math.sin(t * 1.2);
      const w = Math.max(0, t - TS);
      const x = lerp(3.6, -0.9, clamp(w / 3.4)); ms.root.position.set(x, 0, 0.4 - clamp(w / 3.4) * 0.6); ms.root.rotation.y = -Math.PI / 2 + 0.35;
      const walking = w < 3.4 && t > TS; const ph = w * 7.5, sw = walking ? Math.sin(ph) : 0;
      const wave = smooth(range(w, 2.6, 3.0));
      ms.setPose({ ...STAND, lHip: [0.45 * sw, 0, 0.05], rHip: [-0.45 * sw, 0, -0.05], lKn: [Math.max(0, -sw) * 0.6, 0, 0], rKn: [Math.max(0, sw) * 0.6, 0, 0], rSh: [0.3 * sw * (1 - wave) - 2.6 * wave, 0, -0.25 - 0.2 * wave], rEl: [-0.3 - 0.5 * wave * (1 + 0.5 * Math.sin(t * 9)), 0, 0], lSh: [0, 0, 0.55], lEl: [-0.9, 0, 0], chest: [0.05, 0, 0], neck: [0, -0.5 * wave, 0], drop: walking ? -Math.abs(Math.cos(ph)) * 0.02 : 0 });
      ms.setMouth(wave > 0 ? 0.5 : 0.1);
      const k = easeInOut(range(t, 0, TS + 0.4)), k2 = easeInOut(range(t, TS + 0.2, 6.9)), s = shake(t, 0.4);
      const P = [lerp(lerp(1.9, 1.8, k), 0.2, k2), lerp(1.8, 1.6, k), lerp(lerp(5.6, 6.0, k), 6.2, k2)];
      const L = [lerp(lerp(1.0, 2.2, k), -0.6, k2), lerp(1.7, 1.3, k), lerp(0.6, 0.0, k)];
      place(c, [P[0] + s[0], P[1] + s[1], P[2]], L);
      return { dof: { focus: c.position.distanceTo(V(ms.root.position.x, 1.3, 0.2)), aperture: 0.0012, maxblur: 0.004 }, bloom: 0.45, exposure: 1.05 };
    },
  };
}

// ============ F: România câștigă Cupa Mondială a roboților — gol din foarfecă ============
function shotF({ makeStage }) {
  const scene = makeStage({ shadowSize: 8, sunDir: [-3, 8, 4], sun: 2.6 });
  noShadowGround(scene);
  const u = scene.userData.sky.material.uniforms; u.top.value.set(0x081028); u.mid.value.set(0x152a5a); u.horizon.value.set(0x3a4a7a);
  const pc = document.createElement('canvas'); pc.width = 16; pc.height = 256; const px = pc.getContext('2d'); for (let i = 0; i < 16; i++) { px.fillStyle = i % 2 ? '#2f8a3a' : '#3a9a44'; px.fillRect(0, i * 16, 16, 16); }
  const pt = new THREE.CanvasTexture(pc); pt.colorSpace = THREE.SRGBColorSpace; pt.wrapS = pt.wrapT = THREE.RepeatWrapping; pt.repeat.set(1, 3);
  const pitch = new THREE.Mesh(new THREE.PlaneGeometry(70, 100), new THREE.MeshStandardMaterial({ map: pt, roughness: 0.9 })); pitch.rotation.x = -Math.PI / 2; pitch.receiveShadow = true; scene.add(pitch);
  const lineM = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const ln = (w, d, x, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), lineM); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.01, z); scene.add(m); };
  ln(40, 0.1, 0, -8); ln(16, 0.1, 0, 0); ln(0.1, 8, -8, -4); ln(0.1, 8, 8, -4);
  // poarta + plasa
  const gm = std(0xf4f4f4, { roughness: 0.3 });
  for (const x of [-3.66, 3.66]) scene.add(box(0.12, 2.44, 0.12, gm, [x, 1.22, -8]));
  scene.add(box(7.44, 0.12, 0.12, gm, [0, 2.44, -8]));
  const netM = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.45 });
  const net = new THREE.Mesh(new THREE.PlaneGeometry(7.3, 2.4, 30, 10), netM); net.position.set(0, 1.2, -9.5); scene.add(net);
  const netP = net.geometry.attributes.position, net0 = Float32Array.from(netP.array);
  for (const x of [-3.66, 3.66]) { const sn = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.4, 6, 10), netM); sn.rotation.y = Math.PI / 2; sn.position.set(x, 1.2, -8.75); scene.add(sn); }
  // tribuna cu public
  const r = rng(8), N = 1400;
  const fans = new THREE.InstancedMesh(new THREE.BoxGeometry(0.4, 0.55, 0.3), new THREE.MeshStandardMaterial({ roughness: 0.8 }), N); scene.add(fans);
  const FP = []; const o = new THREE.Object3D(); const tric = [0x1d4fbf, 0xf2c21a, 0xc8202a];
  for (let i = 0; i < N; i++) { const row = Math.floor(i / 70), col = i % 70; const p = [-21 + col * 0.6 + (row % 2) * 0.3, 1.0 + row * 0.75, -18 - row * 0.8]; FP.push([...p, r() * 6]); fans.setColorAt(i, new THREE.Color(r() < 0.6 ? tric[Math.floor(r() * 3)] : new THREE.Color().setHSL(r(), 0.4, 0.5))); }
  for (let row = 0; row < 20; row++) scene.add(box(44, 0.75, 0.8, std(0x3a3d48, { roughness: 0.9 }), [0, 0.37 + row * 0.75, -18 - row * 0.8]));
  // tabela
  const SB0 = textTex(['CUPA MONDIALĂ A ROBOȚILOR', 'ROMÂNIA 0 – 0 ROBOLAND · 89\''], { w: 1024, h: 300, bg: '#05070f', fg: '#ffd27a', size: 72 });
  const SB1 = textTex(['CUPA MONDIALĂ A ROBOȚILOR', 'ROMÂNIA 1 – 0 ROBOLAND · 90\''], { w: 1024, h: 300, bg: '#05070f', fg: '#5dff8a', size: 72 });
  const sb = screen(9, 2.6, SB0, 1.3); sb.position.set(-4, 14, -30); scene.add(sb);
  for (let i = 0; i < 4; i++) { const fl = glowSprite(0xffffff, 6); fl.position.set(-24 + i * 16, 22, -32); scene.add(fl); }
  // jucătorii-roboți
  const ROU = [0xe6e9ee, 0x1d4fbf, 0xf2c21a, 0xc8202a], RBL = [0x26282e, 0x1fae6a, 0x1fae6a];
  const st = robotPlayer(ROU); const piv = new THREE.Group(); piv.add(st.root); st.root.position.y = -0.95; scene.add(piv);
  const gk = robotPlayer(RBL, 0xff5050); gk.root.position.set(0.3, 0, -7.6); scene.add(gk.root);
  const df = robotPlayer(RBL, 0xff5050); df.root.position.set(-2.3, 0, -3.4); df.root.rotation.y = 0.6; scene.add(df.root);
  const mates = [0, 1].map(i => { const m = robotPlayer(ROU); m.root.position.set(4.5 + i * 1.5, 0, 3 + i * 1.5); m.root.rotation.y = -2.2; scene.add(m.root); return m; });
  const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 2), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45 })); ball.castShadow = true; scene.add(ball);
  const sp = sparks(70, { speed: 2.2, spread: 1.4, gravity: -3, life: 0.7, size: 0.05, seed: 4, color: [0.6, 0.9, 1.0], dir: V(0, 0, -1) }); scene.add(sp);
  const conf = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.06, 0.1), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide }), 300); conf.frustumCulled = false; scene.add(conf);
  const CF = []; for (let i = 0; i < 300; i++) { CF.push([r() * 10 - 5, r() * 3, r() * 6 - 5, r()]); conf.setColorAt(i, new THREE.Color(tric[i % 3])); }
  const c = cam(40);
  const KT = 5.2, GT = KT + 0.42, LAND = KT + 0.75;
  const KP = V(0, 1.55, 0.05), GOAL = V(1.6, 1.5, -9.3);
  return {
    scene, camera: c,
    update(t) {
      // mingea: centrare din dreapta, foarfecă, gol
      if (t < KT) { const f = clamp((t - (KT - 1.1)) / 1.1); const S = V(6, 0.15, 2.5); ball.position.lerpVectors(S, KP, f); ball.position.y += Math.sin(f * Math.PI) * 2.2; if (t < KT - 1.1) ball.position.copy(S); }
      else if (t < GT) { const f = (t - KT) / (GT - KT); ball.position.lerpVectors(KP, GOAL, f); ball.position.y += Math.sin(f * Math.PI) * 0.3; }
      else { const f = clamp((t - GT) / 0.6); ball.position.set(GOAL.x, Math.max(0.11, GOAL.y - f * f * 1.5), GOAL.z - 0.2 * easeOut(f)); }
      ball.rotation.set(t * 8, t * 5, 0);
      // plasa se umflă
      const nb = Math.max(0, Math.sin(clamp((t - GT) / 0.5) * Math.PI)) * (t > GT ? 1 : 0);
      for (let i = 0; i < netP.count; i++) { const x = net0[i * 3], y = net0[i * 3 + 1]; const d = Math.hypot(x - (GOAL.x), y - (GOAL.y - 1.2)); netP.setZ(i, -Math.max(0, 1 - d / 2.2) * 0.8 * nb); } netP.needsUpdate = true;
      // atacantul: sare, se dă peste cap, lovește, aterizează, sărbătorește
      const up = smooth(range(t, KT - 0.35, KT)) * (1 - smooth(range(t, KT + 0.15, LAND)));
      const flip = smooth(range(t, KT - 0.35, KT + 0.05)) * (1 - smooth(range(t, KT + 0.3, LAND + 0.15)));
      const kick = smooth(range(t, KT - 0.12, KT + 0.04));
      const cel = smooth(range(t, LAND + 0.5, LAND + 1.0));
      piv.position.set(0, 0.95 + up * 0.9 - (t > LAND ? 0.55 * (1 - cel) * smooth(range(t, LAND, LAND + 0.1)) : 0), 0);
      piv.rotation.set(-flip * 1.9 - (t > LAND ? 1.3 * (1 - cel) * smooth(range(t, LAND - 0.1, LAND + 0.1)) : 0), 0, 0);
      st.setPose({ ...STAND, rHip: [-0.6 * flip - 1.6 * kick * (1 - cel), 0, -0.1], lHip: [0.3 * flip, 0, 0.1], rKn: [0.3 * (1 - kick) * flip, 0, 0], lKn: [0.9 * flip, 0, 0], lSh: [-0.2 * flip - 2.6 * cel, 0, 0.9 * flip + 0.3 * cel], rSh: [-0.2 * flip - 2.6 * cel, 0, -0.9 * flip - 0.3 * cel], neck: [-0.3 * flip, 0, 0], drop: 0 });
      // portarul se aruncă în partea greșită
      const dv = smooth(range(t, KT + 0.05, KT + 0.45));
      gk.root.position.set(0.3 - dv * 1.6, dv * 0.5 * (1 - smooth(range(t, KT + 0.45, KT + 0.8))), -7.6); gk.root.rotation.set(0, 0, dv * 1.2);
      gk.setPose({ ...STAND, lSh: [0, 0, 0.5 + 2.2 * dv], rSh: [0, 0, -0.5 - 1.5 * dv] });
      df.setPose({ ...STAND, neck: [-0.4 * smooth(range(t, KT - 0.6, KT)), 0, 0] });
      mates.forEach((m, i) => { const j = Math.max(0, Math.sin(t * 7 + i)) * cel; m.setPose({ ...STAND, lSh: [0, 0, 0.2 + 2.4 * cel], rSh: [0, 0, -0.2 - 2.4 * cel], drop: -0.02 }); m.root.position.y = 0.15 * j; });
      st.rp.eyes.forEach(e => e.scale.setScalar(0.06 + 0.04 * cel));
      sp.position.copy(KP); sp.update(t - KT);
      sb.material.map = t > GT + 0.2 ? SB1 : SB0;
      // publicul
      FP.forEach(([x, y, z, ph], i) => { const j = t > GT ? Math.abs(Math.sin(t * 9 + ph)) * 0.25 : Math.abs(Math.sin(t * 2 + ph)) * 0.03; o.position.set(x, y + 0.3 + j, z); o.rotation.set(0, 0, 0); o.scale.setScalar(1); o.updateMatrix(); fans.setMatrixAt(i, o.matrix); }); fans.instanceMatrix.needsUpdate = true;
      CF.forEach(([x, y, z, d], i) => { const tt = Math.max(0, t - GT - 0.3); o.position.set(x + Math.sin(tt * 3 + i) * 0.3, t > GT + 0.3 ? 5 + y - tt * (0.9 + d) : -10, z); o.rotation.set(tt * 5 + i, tt * 3, 0); o.updateMatrix(); conf.setMatrixAt(i, o.matrix); }); conf.instanceMatrix.needsUpdate = true;
      // camera: lateral, cu încetinitor vizual la foarfecă (mișcare lentă a camerei)
      const k = easeInOut(range(t, 0, KT - 0.4)), s = shake(t, t > GT && t < GT + 0.4 ? 3 : 0.5);
      const lk = V(0, 1.3, -2.3).lerp(ball.position, t > KT - 1.2 ? 0.15 : 0);
      place(c, [lerp(2.6, 1.3, k) + s[0], lerp(2.0, 1.5, k) + s[1], lerp(8.0, 5.0, k) - Math.max(0, t - GT) * 0.4], [lk.x, lk.y, lk.z]);
      return { dof: { focus: c.position.distanceTo(V(0, 1.3, 0)), aperture: 0.0012, maxblur: 0.004 }, bloom: 0.55 };
    },
  };
}

// ============ G: ultima știre — prezentatorul e robot ============
function shotG({ makeStage }) {
  const T1 = textTex(['ULTIMA ORĂ'], { w: 1024, h: 576, bg: '#c8202a', fg: '#ffffff', size: 150, accent: '#ffd21f' });
  const T2 = textTex(['SISTEM:', 'OM NEGĂSIT', 'ROBOT ACTIV'], { w: 1024, h: 576, bg: '#05070f', fg: '#38e0ff', size: 120 });
  const { scene, an, scr, key, strips } = studio(makeStage, T1);
  const rp = robotParts(an, { onlyHead: true });
  const sp = sparks(90, { speed: 1.4, spread: 1.6, gravity: -4, life: 0.8, size: 0.03, seed: 12, color: [0.5, 0.9, 1.0], dir: V(0, 1, 0.4) }); scene.add(sp);
  const sp2 = sparks(60, { speed: 1.0, spread: 1.8, gravity: -4, life: 0.6, size: 0.025, seed: 13, color: [1, 0.8, 0.4], dir: V(0, 0.5, 1) }); scene.add(sp2);
  const c = cam(34);
  const TR = 4.35, TD = 4.8;
  return {
    scene, camera: c,
    update(t) {
      const fl = t > TR && t < TD ? (Math.sin(t * 70) > 0.1) : t >= TD;
      rp.set(fl);
      const tilt = smooth(range(t, TD, TD + 0.4));
      anchorPose(an, t, { neck: [0.02 - 0.08 * tilt, 0.25 * tilt, 0.18 * tilt], rSh: [-0.55 - 0.4 * tilt, 0, -0.18 - 0.3 * tilt], rEl: [-1.0 - 0.6 * tilt, 0, -0.2] });
      if (fl) an.setMouth(0.1 + 0.25 * Math.max(0, Math.sin(t * 9)));
      an.root.updateMatrixWorld(true);
      const nk = an.j.neck.localToWorld(V(0, 0.05, 0.05)); sp.position.copy(nk); sp.update(t - TR); sp2.position.copy(an.j.head.localToWorld(V(0.06, 0.12, 0.05))); sp2.update(t - TR - 0.15);
      scr.material.map = t > TR ? T2 : T1;
      const flick = t > TR && t < TD ? 0.3 + 0.7 * (Math.sin(t * 53) > 0 ? 1 : 0) : 1;
      key.intensity = 40 * flick; strips.forEach(s => s.material.color.setRGB(t > TR ? 0.3 * flick : 0.2, t > TR ? 1.8 * flick : 0.6, t > TR ? 2.0 * flick : 1.6));
      rp.eyes.forEach(e => e.scale.setScalar(0.06 * (1 + 0.6 * tilt)));
      const k = easeInOut(range(t, 0, TR)), s = shake(t, t > TR && t < TD ? 3.5 : 0.3);
      place(c, [lerp(-1.0, -0.12, k) + s[0], lerp(1.8, 1.82, k) + s[1], lerp(3.4, 0.35, k) - smooth(range(t, TD, 6)) * 0.2], [0, lerp(1.7, 1.83, k), -1.25]);
      return { dof: { focus: c.position.distanceTo(V(0, 1.8, -1.2)), aperture: 0.003, maxblur: 0.008 }, bloom: t > TR ? 0.75 : 0.5 };
    },
  };
}

// ============ H: finalul — robotul întreabă ============
function shotH({ makeStage }) {
  const { scene, an, strips } = studio(makeStage, textTex(['SCRIE ÎN', 'COMENTARII'], { w: 1024, h: 576, bg: '#c8202a', fg: '#ffffff', size: 140, accent: '#ffd21f' }));
  const rp = robotParts(an, { onlyHead: true }); rp.set(true);
  strips.forEach(s => s.material.color.setRGB(0.3, 1.8, 2.0));
  const c = cam(32);
  return {
    scene, camera: c,
    update(t) {
      const wave = Math.sin(t * 8);
      anchorPose(an, t, { rSh: [-0.3, 0, -2.5], rEl: [0, 0, -0.4 + 0.35 * wave], neck: [0, 0.12 * Math.sin(t * 1.4), 0.08] });
      an.setMouth(0.1 + 0.25 * Math.max(0, Math.sin(t * 9) * Math.sin(t * 3.1)));
      rp.bulb.material.color.setRGB(2.5 * (Math.sin(t * 6) > 0 ? 1 : 0.2), 0.3, 0.2);
      const k = easeInOut(range(t, 0, 5.4)), s = shake(t, 0.3);
      place(c, [lerp(0.4, 0.0, k) + s[0], lerp(1.75, 1.66, k) + s[1], lerp(3.4, 2.7, k)], [0, lerp(1.75, 1.6, k), -1.25]);
      return { dof: { focus: c.position.distanceTo(V(0, 1.6, -1.25)), aperture: 0.003, maxblur: 0.008 }, bloom: 0.55 };
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
