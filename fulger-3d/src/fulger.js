// Recuzita pentru „Ce-ar fi dacă te-ar lovi fulgerul?”: furtună, fulgere, ploaie, personaje, zgârie-nor, feriga Lichtenberg
import * as THREE from 'three';
import { makeHuman } from './human.js';
import { materials } from './materials.js';
import { glowSprite, streak } from './props.js';

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, metalness: 0, ...o });
const shadowAll = (o) => { o.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; };
export function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- scena de furtună: cer întunecat, iarbă, nori grei ----------
export function stormStage(makeStage, { night = false, ground = true, shadowSize = 4 } = {}) {
  const scene = makeStage({ shadowSize, sunDir: [-2, 6, 3], sun: night ? 0.5 : 1.1 });
  scene.children.forEach(o => { if (o.material && o.material.isShadowMaterial) o.visible = false; if (o.isHemisphereLight) { o.intensity = night ? 0.35 : 0.55; o.color.set(0x8ea0c0); o.groundColor.set(0x2b3326); } if (o.isDirectionalLight && o !== scene.userData.key) o.intensity = 0.5; });
  const u = scene.userData.sky.material.uniforms;
  u.top.value.set(night ? 0x07090f : 0x151a24); u.mid.value.set(night ? 0x111622 : 0x262e3c); u.horizon.value.set(night ? 0x252c3b : 0x48505f); u.floorC.value.set(night ? 0x0b0d12 : 0x2a3128);
  scene.userData.key.color.set(0xb8c8e8);
  scene.fog = new THREE.Fog(night ? 0x1a1f2b : 0x3c4452, 18, night ? 220 : 90);
  if (ground) { const g = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), std(0x34502a, { roughness: 1 })); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g); scene.userData.ground = g; }
  // nori joși, întunecați
  const r = rng(night ? 4 : 2), n = 60, cm = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 10), std(night ? 0x1c212c : 0x3a4250, { roughness: 1 }), n), o = new THREE.Object3D();
  for (let i = 0; i < n; i++) { const s = 4 + r() * 7; o.position.set((r() - 0.5) * 120, 16 + r() * 5, -10 - r() * 90); o.scale.set(s * 1.6, s * 0.5, s); o.updateMatrix(); cm.setMatrixAt(i, o.matrix); }
  scene.add(cm);
  return scene;
}
// lumină de fulger: o lumină punctuală puternică + intensitatea întregii scene
export function flashLight(scene) { const l = new THREE.PointLight(0xcfe0ff, 0, 80, 1.2); scene.add(l); return l; }

// ---------- fulgerul: cale zimțată, cu ramificații (dâre luminoase) ----------
function zig(r, a, b, segs, jit) {
  const pts = [a.clone()];
  const dir = b.clone().sub(a), len = dir.length();
  const side = new THREE.Vector3(1, 0, 0), side2 = new THREE.Vector3(0, 0, 1);
  for (let i = 1; i < segs; i++) { const p = a.clone().addScaledVector(dir, i / segs); p.addScaledVector(side, (r() - 0.5) * jit * len / segs * 2.2).addScaledVector(side2, (r() - 0.5) * jit * len / segs * 1.5); pts.push(p); }
  pts.push(b.clone()); return pts;
}
export function bolt(scene, from, to, { seed = 1, segs = 18, jit = 1.4, branches = 4, core = 0.035, glow = 0.16, halo = 3 } = {}) {
  const r = rng(seed), g = new THREE.Group(); scene.add(g);
  const paths = [zig(r, from, to, segs, jit)];
  for (let k = 0; k < branches; k++) { const main = paths[0], i = 2 + Math.floor(r() * (segs - 6)), a = main[i]; const b = a.clone().add(new THREE.Vector3((r() - 0.5) * 6, -2 - r() * 5, (r() - 0.5) * 3)); paths.push(zig(r, a, b, 7, 1.6)); }
  const parts = [];
  paths.forEach((pts, pi) => { for (let i = 0; i < pts.length - 1; i++) { const c = streak(0xffffff), h = streak(0x9cc4ff); g.add(h, c); parts.push({ c, h, a: pts[i], b: pts[i + 1], main: pi === 0, f: i / (pts.length - 1) }); } });
  const glowS = glowSprite(0xbfd8ff, halo); glowS.position.copy(to); g.add(glowS);
  // k = 0…1 (vizibil), grow = 0…1 (cât de departe a coborât)
  g.set = (k, grow = 1) => {
    parts.forEach(p => { const vis = p.f <= grow ? 1 : 0; const w = p.main ? 1 : 0.55; p.c.set(p.a, p.b, core * w, k * vis); p.h.set(p.a, p.b, glow * w, k * vis * 0.35); });
    glowS.material.opacity = k * (grow >= 1 ? 1 : 0); glowS.scale.setScalar(halo * (0.6 + k));
  };
  g.set(0); return g;
}
// ploaie: dâre care cad (pozițiile depind doar de t)
export function rain(n, box, { seed = 3, speed = 14 } = {}) {
  const r = rng(seed), m = new THREE.InstancedMesh(new THREE.BoxGeometry(0.008, 0.35, 0.008), new THREE.MeshBasicMaterial({ color: 0xaab8cc, transparent: true, opacity: 0.5 }), n);
  m.frustumCulled = false; const P = []; for (let i = 0; i < n; i++) P.push([r(), r(), r(), 0.8 + r() * 0.4]); const o = new THREE.Object3D();
  m.update = (t) => { for (let i = 0; i < n; i++) { const [a, b, c, s] = P[i]; const y = box[1] - ((b * box[1] + t * speed * s) % box[1]); o.position.set((a - 0.5) * box[0], y, (c - 0.5) * box[2]); o.rotation.z = 0.12; o.updateMatrix(); m.setMatrixAt(i, o.matrix); } m.instanceMatrix.needsUpdate = true; };
  return m;
}
// fum (sprite cenușiu, amestec normal)
export function smoke(scale = 0.5) { const s = glowSprite(0x9a9a9a, scale); s.material.blending = THREE.NormalBlending; s.material.color.set(0x8a8a8a); return s; }

// ---------- personaje ----------
function repaint(h, { top, legs, feet, hands }) {
  const M = materials();
  h.root.traverse(o => { if (o.isMesh && o.material === M.cloth) o.material = top; });
  for (const k of ['lHip', 'rHip']) h.j[k].traverse(o => { if (o.isMesh && o.material === top) o.material = legs; });
  for (const k of ['lAn', 'rAn']) h.j[k].traverse(o => { if (o.isMesh) o.material = feet; });
  if (hands) for (const k of ['lWr', 'rWr']) h.j[k].traverse(o => { if (o.isMesh) o.material = hands; });
}
// drumeț cu pelerină galbenă și umbrelă
export function hiker() {
  const h = makeHuman('casual');
  repaint(h, { top: std(0xf2c21a, { roughness: 0.35 }), legs: std(0x2c3e5c, { roughness: 0.8 }), feet: std(0x3b2a20, { roughness: 0.7 }) });
  // umbrelă în mâna dreaptă
  const um = new THREE.Group(); h.j.rWr.add(um); um.position.set(0, -0.08, 0.02);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.0, 8), std(0x2a2a2a, { metalness: 0.7, roughness: 0.3 })); shaft.position.y = -0.45; um.add(shaft);
  const can = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.28, 16, 1, true), std(0xd23a3a, { roughness: 0.6, side: THREE.DoubleSide })); can.position.y = -0.95 + 0.0; can.rotation.x = Math.PI; um.add(can);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.12, 8), std(0x2a2a2a, { metalness: 0.8 })); tip.position.y = -1.1; tip.rotation.x = Math.PI; um.add(tip);
  um.rotation.x = Math.PI; h.umbrella = um;
  // păr zbârlit (apare după lovitură)
  const spikes = new THREE.Group(); h.j.head.add(spikes); const hm = materials().hair;
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; const c = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.14, 6), hm); c.position.set(Math.cos(a) * 0.06, 0.21, Math.sin(a) * 0.06 - 0.01); c.rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6); spikes.add(c); }
  spikes.visible = false; h.spikes = spikes;
  return shadowAll(h.root), h;
}
// versiunea „arsă”, ca în desene: totul negru, în afară de ochi
export function charred(h) {
  const M = materials(), coal = std(0x111111, { roughness: 0.9 });
  const orig = []; h.root.traverse(o => { if (o.isMesh && o.material !== M.eyeWhite && o.material !== M.iris) { orig.push([o, o.material]); } });
  return { on: (k) => orig.forEach(([o, m]) => { o.material = k ? coal : m; }) };
}
// pădurarul Roy Sullivan: cămașă kaki, pantaloni verzi, pălărie de ranger
export function ranger() {
  const h = makeHuman('casual');
  repaint(h, { top: std(0xb59a62, { roughness: 0.8 }), legs: std(0x3d5232, { roughness: 0.8 }), feet: std(0x2a1d14, { roughness: 0.6 }) });
  const hatM = std(0x8a6a3e, { roughness: 0.8 });
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.012, 40), hatM); brim.position.set(0, 0.19, 0); h.j.head.add(brim);
  const crown = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.15, 4), hatM); crown.position.set(0, 0.27, 0); crown.rotation.y = Math.PI / 4; h.j.head.add(crown);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.025, 24), std(0x3b2a20)); band.position.set(0, 0.21, 0); h.j.head.add(band);
  const badge = new THREE.Mesh(new THREE.CircleGeometry(0.025, 16), std(0xe2b84a, { metalness: 0.8, roughness: 0.3 })); badge.position.set(0.09, 0.28, 0.135); h.j.chest.add(badge);
  return shadowAll(h.root), h;
}

// ---------- zgârie-norul (stilizat, în trepte, cu antenă) ----------
function windowTex(seed) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d'), r = rng(seed);
  x.fillStyle = '#2a2e38'; x.fillRect(0, 0, 64, 256);
  for (let j = 0; j < 64; j++) for (let i = 0; i < 8; i++) { x.fillStyle = r() < 0.35 ? (r() < 0.5 ? '#ffd98a' : '#f2c46a') : '#1a1d24'; x.fillRect(i * 8 + 2, j * 4 + 1, 4, 2); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function skyscraper() {
  const g = new THREE.Group(), tex = windowTex(5);
  const tiers = [[6, 6, 14], [4.6, 4.6, 16], [3.4, 3.4, 8], [2.4, 2.4, 4], [1.6, 1.6, 3]];
  let y = 0;
  tiers.forEach(([w, d, h], i) => { const t = tex.clone(); t.needsUpdate = true; t.repeat.set(w / 3, h / 6); const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0.55, roughness: 0.7 })); m.position.y = y + h / 2; m.castShadow = m.receiveShadow = true; g.add(m); y += h; });
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.7, 4, 16), std(0xb8bcc4, { metalness: 0.6, roughness: 0.3 })); spire.position.y = y + 2; g.add(spire); y += 4;
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.1, 5, 8), std(0x9aa1ab, { metalness: 0.8, roughness: 0.3 })); ant.position.y = y + 2.5; g.add(ant); y += 5;
  const red = glowSprite(0xff3030, 0.8); red.position.y = y; g.add(red); g.top = new THREE.Vector3(0, y, 0); g.redLight = red;
  return g;
}
export function cityBlocks(n, seed = 9) {
  const g = new THREE.Group(), r = rng(seed);
  for (let i = 0; i < n; i++) { const w = 3 + r() * 4, h = 6 + r() * 22, t = windowTex(20 + i); t.repeat.set(w / 3, h / 6); const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0.4, roughness: 0.8 })); const a = r() * Math.PI * 2, d = 9 + r() * 30; m.position.set(Math.cos(a) * d, h / 2, Math.sin(a) * d - 6); g.add(m); }
  return g;
}

// ---------- figura Lichtenberg („feriga”) pe un antebraț văzut de aproape ----------
export function fernTexture(seed = 7) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 1024; const x = c.getContext('2d'), r = rng(seed);
  x.clearRect(0, 0, 512, 1024); x.lineCap = 'round';
  const branch = (px, py, a, len, w, depth) => {
    if (depth <= 0 || len < 4) return;
    const nx = px + Math.cos(a) * len, ny = py + Math.sin(a) * len;
    x.strokeStyle = `rgba(190,45,45,${0.75 + 0.25 * Math.min(1, w / 10)})`; x.lineWidth = w * 1.5 + 1.5; x.beginPath(); x.moveTo(px, py); x.lineTo(nx, ny); x.stroke();
    branch(nx, ny, a + (r() - 0.5) * 0.35, len * 0.92, w * 0.9, depth - 1);
    if (r() < 0.85) branch(nx, ny, a + 0.6 + r() * 0.5, len * 0.55, w * 0.6, depth - 2);
    if (r() < 0.85) branch(nx, ny, a - 0.6 - r() * 0.5, len * 0.55, w * 0.6, depth - 2);
  };
  branch(256, 1000, -Math.PI / 2, 70, 14, 11);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function counterSprite() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const x = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, toneMapped: false })); s.renderOrder = 30;
  let cur = null;
  s.setText = (txt) => { if (txt === cur) return; cur = txt; x.clearRect(0, 0, 256, 256); x.font = '700 150px Cap, Montserrat, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 14; x.strokeStyle = 'rgba(0,0,0,0.6)'; x.strokeText(txt, 128, 136); x.fillStyle = '#ffe14d'; x.fillText(txt, 128, 136); t.needsUpdate = true; };
  return s;
}
