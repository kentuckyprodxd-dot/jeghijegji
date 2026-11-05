// Recuzita pentru „Ce-ar fi dacă ai deschide ușa avionului la 10 km?”: cabină, avion, săgeți de presiune, măști, personaje
import * as THREE from 'three';
import { makeHuman } from './human.js';
import { materials } from './materials.js';

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, metalness: 0, ...o });
const box = (w, h, d, m, p = [0, 0, 0], r = [0, 0, 0]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(...p); b.rotation.set(...r); b.castShadow = b.receiveShadow = true; return b; };
const shadowAll = (o) => { o.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; };
export function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- scena fără podeaua-umbră a studioului ----------
export function openStage(makeStage, opts = {}) {
  const scene = makeStage({ shadowSize: opts.shadowSize ?? 4, sunDir: opts.sunDir ?? [-3, 6, 4], sun: opts.sun ?? 2.3 });
  scene.children.forEach(o => { if (o.material && o.material.isShadowMaterial) o.visible = !opts.noFloor ? o.visible : false; });
  if (opts.fog) scene.fog = new THREE.Fog(opts.fog, opts.near ?? 40, opts.far ?? 400);
  return scene;
}

// ---------- personaje ----------
function repaint(h, { top, legs, feet, hands }) {
  const M = materials();
  h.root.traverse(o => { if (o.isMesh && o.material === M.cloth) o.material = top; });
  for (const k of ['lHip', 'rHip']) h.j[k].traverse(o => { if (o.isMesh && o.material === top) o.material = legs; });
  for (const k of ['lAn', 'rAn']) h.j[k].traverse(o => { if (o.isMesh) o.material = feet; });
  if (hands) for (const k of ['lWr', 'rWr']) h.j[k].traverse(o => { if (o.isMesh) o.material = hands; });
}
export function passenger() {   // hanorac roșu, blugi, adidași albi
  const h = makeHuman('casual');
  repaint(h, { top: std(0xc9302c, { roughness: 0.85 }), legs: std(0x34548a, { roughness: 0.8 }), feet: std(0xf2f2f2, { roughness: 0.5 }) });
  const hood = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.045, 10, 30, Math.PI * 1.3), std(0xb02a26, { roughness: 0.85 })); hood.rotation.set(-1.4, 0, Math.PI * 0.85); hood.position.set(0, 0.37, -0.05); h.j.chest.add(hood);
  return shadowAll(h.root), h;
}
export function pilot() {   // cămașă albă, pantaloni negri, chipiu
  const h = makeHuman('casual');
  const shirt = std(0xf4f4f0, { roughness: 0.7 });
  repaint(h, { top: shirt, legs: std(0x1b1d24, { roughness: 0.8 }), feet: std(0x111111, { roughness: 0.4 }) });
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.105, 0.07, 32), std(0x15171d, { roughness: 0.5 })); cap.position.set(0, 0.2, 0.0); cap.rotation.x = -0.12; h.j.head.add(cap);
  const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.012, 32, 1, false, -Math.PI / 2, Math.PI), std(0x0d0d10, { roughness: 0.2 })); visor.position.set(0, 0.17, 0.04); visor.rotation.x = -0.1; h.j.head.add(visor);
  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.005), std(0xe2b84a, { metalness: 0.8, roughness: 0.3 })); badge.position.set(0, 0.2, 0.11); h.j.head.add(badge);
  for (const s of [-1, 1]) { const ep = box(0.1, 0.012, 0.05, std(0x15171d), [s * 0.17, 0.33, 0]); h.j.chest.add(ep); for (let i = 0; i < 3; i++) h.j.chest.add(box(0.012, 0.014, 0.052, std(0xe2b84a, { metalness: 0.8, roughness: 0.3 }), [s * (0.14 + i * 0.022), 0.338, 0])); }
  const tie = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.22, 4), std(0x15171d)); tie.rotation.x = Math.PI; tie.position.set(0, 0.22, 0.125); h.j.chest.add(tie);
  return shadowAll(h.root), h;
}
export function steward() {   // uniformă bleumarin
  const h = makeHuman('casual');
  repaint(h, { top: std(0x1f3157, { roughness: 0.7 }), legs: std(0x1f3157, { roughness: 0.7 }), feet: std(0x111111, { roughness: 0.4 }) });
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.02, 8, 24), std(0xd23a3a)); scarf.rotation.x = Math.PI / 2; scarf.position.set(0, 0.36, 0.01); h.j.chest.add(scarf);
  return shadowAll(h.root), h;
}

// ---------- cabina (fuzelaj văzut din interior; axa pe Z, podeaua la y = 0) ----------
export const CAB_R = 2.0, CAB_Y = 1.0;
export function cabin({ length = 16, doorZ = 0 } = {}) {
  const g = new THREE.Group();
  const wallM = std(0xeef0f2, { roughness: 0.75, side: THREE.BackSide });
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(CAB_R, CAB_R, length, 64, 1, true), wallM); shell.rotation.x = Math.PI / 2; shell.position.y = CAB_Y; shell.receiveShadow = true; g.add(shell);
  const floor = box(3.5, 0.05, length, std(0x4b5566, { roughness: 0.95 }), [0, -0.025, 0]); g.add(floor);
  const aisle = box(0.6, 0.06, length, std(0x7d2b33, { roughness: 1 }), [0, -0.02, 0]); g.add(aisle);
  // compartimente de bagaje și lumini
  for (const s of [-1, 1]) { const bin = box(0.65, 0.42, length, std(0xf6f7f8, { roughness: 0.5 }), [s * 1.32, 2.12, 0], [0, 0, s * 0.35]); g.add(bin); g.add(box(0.02, 0.02, length, std(0xfff6dd, { emissive: 0xfff2cc, emissiveIntensity: 1.2 }), [s * 0.95, 2.42, 0])); }
  // hublouri (cer luminos)
  const winM = new THREE.MeshBasicMaterial({ color: 0xbfe0ff, toneMapped: false });
  const frameM = std(0xd9dde2, { roughness: 0.5 });
  g.windows = [];
  for (const s of [-1, 1]) for (let z = -length / 2 + 1; z < length / 2 - 0.5; z += 1.0) {
    if (s < 0 && Math.abs(z - doorZ) < 0.9) continue;
    const x = s * (CAB_R - 0.06);
    const fr = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.16, 6, 16), frameM); fr.scale.z = 0.25; fr.position.set(x, 1.32, z); fr.rotation.y = s * Math.PI / 2; g.add(fr);
    const wn = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.13, 6, 16), winM); wn.scale.z = 0.1; wn.position.set(x - s * 0.03, 1.32, z); wn.rotation.y = s * Math.PI / 2; g.add(wn);
    g.windows.push(wn);
  }
  // scaune
  const fab = std(0x2b4a8a, { roughness: 0.95 }), cover = std(0xf2f2f2, { roughness: 0.9 }), plast = std(0x9aa1ab, { roughness: 0.5 });
  for (let z = -length / 2 + 1.2; z < length / 2 - 0.8; z += 0.85) for (const x of [-1.2, -0.7, 0.7, 1.2]) {
    if (x < 0 && Math.abs(z - doorZ) < 1.4) continue;
    const s = new THREE.Group(); s.position.set(x, 0, z);
    s.add(box(0.46, 0.12, 0.46, fab, [0, 0.45, 0])); s.add(box(0.46, 0.7, 0.1, fab, [0, 0.82, -0.23], [-0.12, 0, 0])); s.add(box(0.4, 0.16, 0.11, cover, [0, 1.15, -0.27], [-0.12, 0, 0]));
    s.add(box(0.05, 0.05, 0.4, plast, [0.24, 0.62, 0])); s.add(box(0.06, 0.4, 0.06, plast, [0, 0.2, -0.1]));
    g.add(s);
  }
  // ușa (pe peretele stâng, x < 0)
  const door = new THREE.Group(); door.position.set(-1.64, 0, doorZ); door.rotation.y = Math.PI / 2; g.add(door);
  const dM = std(0xdfe3e8, { roughness: 0.45, metalness: 0.1 });
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.9, 0.08), dM); panel.position.y = 0.98; panel.castShadow = panel.receiveShadow = true; door.add(panel);
  const seam = new THREE.Mesh(new THREE.BoxGeometry(1.05, 2.0, 0.04), std(0x5a616b, { roughness: 0.6 })); seam.position.set(0, 0.98, -0.03); door.add(seam);
  const dw = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.06, 6, 12), winM); dw.scale.z = 0.2; dw.position.set(0, 1.5, 0.045); door.add(dw);
  const handle = new THREE.Group(); handle.position.set(0.18, 1.05, 0.06); door.add(handle);
  handle.add(box(0.07, 0.07, 0.05, std(0x8a9099, { metalness: 0.7, roughness: 0.3 }), [0, 0, 0]));
  handle.add(box(0.3, 0.05, 0.05, std(0xd23a3a, { roughness: 0.4 }), [-0.13, 0, 0.03]));
  const lbl = box(0.36, 0.08, 0.01, std(0xd23a3a, { roughness: 0.5 }), [0, 1.88, 0.045]); door.add(lbl);
  g.door = door; g.panel = panel; g.handle = handle;
  return g;
}

// ---------- săgeți de presiune ----------
export function arrow(color = 0xe2262a, len = 0.6) {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color, roughness: 0.35, emissive: color, emissiveIntensity: 0.35, transparent: true });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, len * 0.65, 14), m); shaft.position.y = len * 0.325; g.add(shaft);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.09, len * 0.35, 18), m); head.position.y = len * 0.825; g.add(head);
  g.mat = m; return g;   // vârful spre +Y local
}

// ---------- mască de oxigen ----------
export function oxyMask() {
  const g = new THREE.Group();
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.075, 0.09, 20, 1, true), std(0xf2c21a, { roughness: 0.5, side: THREE.DoubleSide })); cup.rotation.x = Math.PI / 2; g.add(cup);
  const bag = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), std(0xf4f4f4, { roughness: 0.8, transparent: true, opacity: 0.85 })); bag.scale.set(1, 1.3, 0.6); bag.position.set(0, -0.11, -0.02); g.add(bag);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1, 6), std(0xf2f2f2)); tube.position.y = 0.5; g.add(tube); g.tube = tube;
  return shadowAll(g), g;
}

// ---------- avionul (exterior, scară reală: diametru ~3,9 m) ----------
export const NOSE_Z = 15, FUS_R = 1.95, NOSE_K = 1.7;
export function airplane() {
  const g = new THREE.Group();
  const white = std(0xf6f7f9, { roughness: 0.35, metalness: 0.15 }), grey = std(0xb7bcc4, { roughness: 0.4, metalness: 0.4 }), blue = std(0x1f4f9a, { roughness: 0.4 }), dark = std(0x1a1d24, { roughness: 0.15, metalness: 0.3 });
  const fus = new THREE.Mesh(new THREE.CylinderGeometry(FUS_R, FUS_R, 30, 64), white); fus.rotation.x = Math.PI / 2; g.add(fus);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(FUS_R, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2), white); nose.rotation.x = Math.PI / 2; nose.scale.set(1, NOSE_K, 1); nose.position.z = NOSE_Z; g.add(nose);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.35, FUS_R, 9, 64), white); tail.rotation.x = -Math.PI / 2; tail.position.set(0, 0.55, -19.5); tail.scale.set(1, 1, 0.85); g.add(tail);
  // dungă albastră și hublouri
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(FUS_R + 0.005, FUS_R + 0.005, 30, 64, 1, true, Math.PI * 0.62, Math.PI * 0.08), blue); stripe.rotation.x = Math.PI / 2; g.add(stripe);
  const stripe2 = stripe.clone(); stripe2.rotation.y = 0; stripe2.scale.x = -1; g.add(stripe2);
  const wins = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.11, 0.1, 4, 10), dark, 60); let k = 0; const o = new THREE.Object3D();
  for (const s of [-1, 1]) for (let i = 0; i < 30; i++) { o.position.set(s * (FUS_R - 0.03), 0.45, -13 + i * 0.88); o.rotation.set(0, 0, 0); o.scale.set(s, 1, 1); o.updateMatrix(); wins.setMatrixAt(k++, o.matrix); }
  g.add(wins);
  // aripi (formă săgeată), stabilizatoare, derivă
  const wingShape = new THREE.Shape(); wingShape.moveTo(0, 3.2); wingShape.lineTo(17, -3.2); wingShape.lineTo(17, -5.0); wingShape.lineTo(0, -3.0); wingShape.lineTo(0, 3.2);
  for (const s of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.ExtrudeGeometry(wingShape, { depth: 0.32, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06 }), white);
    w.rotation.x = -Math.PI / 2; w.scale.x = s; w.position.set(s * 1.2, -1.1, 0); g.add(w);
    const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.85, 3.6, 40), grey); eng.rotation.x = Math.PI / 2; eng.position.set(s * 6, -2.0, 1.8); g.add(eng);
    const intake = new THREE.Mesh(new THREE.CircleGeometry(0.88, 40), dark); intake.position.set(s * 6, -2.0, 3.61); g.add(intake);
    const hs = new THREE.Shape(); hs.moveTo(0, 1.4); hs.lineTo(6, -1.2); hs.lineTo(6, -2.2); hs.lineTo(0, -1.4); hs.lineTo(0, 1.4);
    const st = new THREE.Mesh(new THREE.ExtrudeGeometry(hs, { depth: 0.18, bevelEnabled: false }), white); st.rotation.x = -Math.PI / 2; st.scale.x = s; st.position.set(s * 0.3, 0.6, -20.5); g.add(st);
  }
  const fs = new THREE.Shape(); fs.moveTo(0, 0); fs.lineTo(-4.2, 0); fs.lineTo(-6.5, 5.5); fs.lineTo(-4.8, 5.5); fs.lineTo(0, 0);
  const fin = new THREE.Mesh(new THREE.ExtrudeGeometry(fs, { depth: 0.22, bevelEnabled: false }), blue); fin.rotation.y = -Math.PI / 2; fin.position.set(0.11, 1.2, -16.5); g.add(fin);
  // parbrizul (două geamuri pe bot) — panourile pot fi aruncate
  const a = 0.95, py = FUS_R * Math.sin(a), pz = NOSE_Z + FUS_R * NOSE_K * Math.cos(a);
  const nrm = new THREE.Vector3(0, Math.sin(a) / FUS_R, Math.cos(a) / (FUS_R * NOSE_K)).normalize();
  g.shield = [];
  for (const s of [-1, 1]) {
    const pane = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.02), dark);
    const p = new THREE.Vector3(s * 0.52, py - 0.02, pz - 0.02); pane.position.copy(p);
    pane.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), nrm.clone().add(new THREE.Vector3(s * 0.35, 0, 0)).normalize());
    g.add(pane); g.shield.push(pane);
  }
  g.hole = new THREE.Vector3(-0.52, py - 0.1, pz - 0.25);   // locul geamului stâng (pilotul)
  const holeM = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.5, 0.05), new THREE.MeshBasicMaterial({ color: 0x0a0a0c })); holeM.position.copy(g.shield[0].position).addScaledVector(nrm, -0.04); holeM.quaternion.copy(g.shield[0].quaternion); g.add(holeM);
  // tren de aterizare (ascuns în zbor)
  const gear = new THREE.Group(); g.add(gear); g.gear = gear;
  for (const [x, z] of [[-3, -1], [3, -1], [0, 11]]) { gear.add(box(0.18, 1.6, 0.18, grey, [x, -2.6, z])); const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.4, 24), dark); wh.rotation.z = Math.PI / 2; wh.position.set(x, -3.4, z); gear.add(wh); }
  return shadowAll(g), g;
}
// nori pufoși (instanțe)
export function clouds(y, extent, count, seed = 3, sz = 14) {
  const r = rng(seed);
  const m = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 16, 12), std(0xffffff, { roughness: 1 }), count);
  const o = new THREE.Object3D();
  for (let i = 0; i < count; i++) { const s = sz * (0.4 + r()); o.position.set((r() - 0.5) * extent, y + r() * sz * 0.4, (r() - 0.5) * extent); o.scale.set(s * (1 + r()), s * 0.5, s * (1 + r())); o.updateMatrix(); m.setMatrixAt(i, o.matrix); }
  return m;
}
// obiecte care zboară prin cabină (pahare, reviste, perne)
export function debris(n, seed = 5) {
  const r = rng(seed), g = new THREE.Group(), cols = [0xffffff, 0xf2c21a, 0x2b4a8a, 0xd23a3a, 0x8fd3ff];
  for (let i = 0; i < n; i++) {
    const k = r(), m = std(cols[i % 5], { roughness: 0.7 });
    const o = k < 0.5 ? new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.025, 0.09, 12), m) : k < 0.85 ? new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.006, 0.2), m) : new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.14), m);
    o.castShadow = true; o.userData = { p: new THREE.Vector3(-0.6 + r() * 1.8, 0.3 + r() * 1.6, -2.5 + r() * 5), d: r(), spin: new THREE.Vector3(r() * 8, r() * 8, r() * 8) };
    g.add(o);
  }
  return g;
}
