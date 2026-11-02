// Recuzita pentru „Ce-ar fi dacă ai sări de pe Everest?”: munte, nori, alpinist, costum-aripă, parașută, zăpadă
import * as THREE from 'three';
import { makeHuman } from './human.js';
import { materials } from './materials.js';

// ---------- zgomot determinist ----------
const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
function vnoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, y) { let s = 0, a = 0.5; for (let i = 0; i < 5; i++) { s += a * vnoise(x, y); x *= 2.03; y *= 2.03; a *= 0.5; } return s; }
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- scena de munte: fără podeaua-umbră a studioului, cu ceață ----------
export function mountainScene(makeStage, opts = {}) {
  const scene = makeStage({ shadowSize: opts.shadowSize ?? 4, sunDir: opts.sunDir ?? [-3, 6, 4], sun: opts.sun ?? 2.4 });
  scene.children.forEach(o => { if (o.material && o.material.isShadowMaterial) o.visible = false; });
  scene.fog = new THREE.Fog(opts.fog ?? 0xb3d4f4, opts.near ?? 40, opts.far ?? 320);
  return scene;
}

// ---------- teren colorat după pantă (zăpadă / stâncă) ----------
export function terrain(size, seg, hfn, { cx = 0, cz = 0, rockAt = 0.72 } = {}) {
  const g = new THREE.PlaneGeometry(size, size, seg, seg).rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i) + cx, z = p.getZ(i) + cz; p.setX(i, x); p.setZ(i, z); p.setY(i, hfn(x, z)); }
  g.computeVertexNormals();
  const n = g.attributes.normal, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), ny = n.getY(i);
    const k = Math.min(1, sstep(rockAt, rockAt - 0.18, ny) * (0.55 + 0.6 * fbm(x * 0.6 + 7, z * 0.6)));
    const sh = 0.9 + 0.1 * fbm(x * 2.2, z * 2.2);
    col[i * 3] = (0.86 + (0.3 - 0.86) * k) * sh; col[i * 3 + 1] = (0.9 + (0.28 - 0.9) * k) * sh; col[i * 3 + 2] = (0.96 + (0.27 - 0.96) * k) * sh;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0 }));
  m.receiveShadow = true; m.castShadow = true;
  return m;
}
// vârful: o creastă îngustă pe axa X, prăpăstii spre ±Z, platou mic în (0,0)
export function hSummit(x, z) {
  const ax = Math.abs(x), az = Math.abs(z), r = Math.hypot(x, z);
  return -0.32 * Math.pow(ax, 1.15) - 0.9 * Math.pow(az, 1.25) + (fbm(x * 0.33 + 3, z * 0.33) - 0.5) * 2.4 * sstep(0.9, 5, r) + (fbm(x * 1.6, z * 1.6) - 0.5) * 0.22 * sstep(0.4, 1.6, r);
}
// vârfuri îndepărtate (conuri deformate)
export function peak(radius, height, seed) {
  const g = new THREE.ConeGeometry(radius, height, 96, 40, true);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x), h = (y + height / 2) / height;
    const k = 1 + (fbm(Math.cos(a) * 1.3 + seed, Math.sin(a) * 1.3 + h * 1.8) - 0.5) * 0.8 * (1 - h * 0.3) + Math.sin(a * 3 + seed) * 0.15;
    p.setX(i, x * k); p.setZ(i, z * k);
  }
  g.computeVertexNormals(); g.translate(0, height / 2, 0);
  const n = g.attributes.normal, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) / height, ny = n.getY(i);
    const snow = sstep(0.12, 0.42, ny + (fbm(p.getX(i) * 0.08 + seed, p.getZ(i) * 0.08) - 0.5) * 0.5 + y * 0.25);
    const sh = 0.9 + 0.1 * fbm(p.getX(i) * 0.2, p.getZ(i) * 0.2);
    col[i * 3] = (0.34 + (0.88 - 0.34) * snow) * sh; col[i * 3 + 1] = (0.32 + (0.91 - 0.32) * snow) * sh; col[i * 3 + 2] = (0.32 + (0.97 - 0.32) * snow) * sh;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, flatShading: false }));
  return m;
}
export function range3(scene, list) { for (const [x, z, r, h, s] of list) { const m = peak(r, h, s); m.position.set(x, -h * 0.55, z); scene.add(m); } }
// marea de nori de sub vârf
export function cloudSea(y, extent, count, seed = 5) {
  const r = rng(seed);
  const m = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 10), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }), count);
  const o = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const s = 6 + r() * 14;
    o.position.set((r() - 0.5) * extent, y + r() * 3, (r() - 0.5) * extent); o.scale.set(s * (1 + r()), s * 0.45, s * (1 + r()));
    o.updateMatrix(); m.setMatrixAt(i, o.matrix);
  }
  return m;
}

// ---------- personaje ----------
const stdM = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, metalness: 0, ...o });
function repaint(h, { jacket, pants, boots, gloves }) {
  const M = materials();
  h.root.traverse(o => { if (o.isMesh && o.material === M.cloth) o.material = jacket; });
  for (const k of ['lHip', 'rHip']) h.j[k].traverse(o => { if (o.isMesh && o.material === jacket) o.material = pants; });
  for (const k of ['lAn', 'rAn']) h.j[k].traverse(o => { if (o.isMesh) o.material = boots; });
  for (const k of ['lWr', 'rWr']) h.j[k].traverse(o => { if (o.isMesh) o.material = gloves; });
}
// alpinist: geacă portocalie, căciulă roșie, ochelari pe frunte, rucsac cu tub de oxigen
export function climber() {
  const h = makeHuman('climber');
  const jacket = stdM(0xe4571c, { roughness: 0.55 }), pants = stdM(0x26344d, { roughness: 0.8 }), boots = stdM(0x3b2a20, { roughness: 0.7 }), gloves = stdM(0x1c1c20, { roughness: 0.8 });
  repaint(h, { jacket, pants, boots, gloves });
  const head = h.j.head;
  const bean = new THREE.Mesh(new THREE.SphereGeometry(0.114, 40, 20, 0, Math.PI * 2, 0, 1.5), stdM(0xc8202a, { roughness: 0.9 }));
  bean.scale.set(0.95, 1.08, 1.05); bean.position.set(0, 0.112, -0.01); bean.rotation.x = -0.28; head.add(bean);
  const fold = new THREE.Mesh(new THREE.TorusGeometry(0.104, 0.017, 10, 40), stdM(0xa8161f, { roughness: 0.9 })); fold.rotation.x = Math.PI / 2 - 0.28; fold.position.set(0, 0.125, 0.0); fold.scale.set(0.95, 1.05, 1); head.add(fold);
  const pom = new THREE.Mesh(new THREE.SphereGeometry(0.032, 16, 12), stdM(0xf2f2f2, { roughness: 1 })); pom.position.set(0, 0.235, -0.03); head.add(pom);
  for (const s of [-1, 1]) { const g = new THREE.Mesh(new THREE.SphereGeometry(0.03, 20, 14), stdM(0xff9a2a, { roughness: 0.15, metalness: 0.4 })); g.scale.set(1.25, 0.8, 0.5); g.position.set(s * 0.034, 0.168, 0.088); g.rotation.x = -0.4; head.add(g); }
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.15), stdM(0x2f5f8a, { roughness: 0.7 })); pack.position.set(0, 0.12, -0.17); h.j.chest.add(pack);
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.36, 18), stdM(0xd9d9d9, { roughness: 0.3, metalness: 0.6 })); tank.position.set(0.09, 0.3, -0.19); h.j.chest.add(tank);
  h.root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return h;
}
// zburătorul în costum-aripă (cască, costum galben cu negru)
export function wingsuiter() {
  const h = makeHuman('climber');
  const suit = stdM(0xf2c21a, { roughness: 0.5 }), dark = stdM(0x1b1d22, { roughness: 0.6 });
  repaint(h, { jacket: suit, pants: suit, boots: dark, gloves: dark });
  const helm = new THREE.Mesh(new THREE.SphereGeometry(0.128, 40, 24, 0, Math.PI * 2, 0, 1.75), stdM(0x1b1d22, { roughness: 0.25, metalness: 0.2 }));
  helm.position.set(0, 0.1, -0.005); helm.rotation.x = -0.35; h.j.head.add(helm);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.03, 20, 14), stdM(0x6fb7ff, { roughness: 0.05, metalness: 0.6 })); visor.scale.set(2.6, 0.8, 0.5); visor.position.set(0, 0.168, 0.092); h.j.head.add(visor);
  h.suit = suit; h.dark = dark;
  h.root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return h;
}
// membranele costumului-aripă, construite din poziția curentă a articulațiilor (în coordonatele rădăcinii)
export function wingMembranes(h, mat) {
  h.root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(h.root.matrixWorld).invert();
  const P = (obj, off = [0, 0, 0]) => obj.localToWorld(new THREE.Vector3(...off)).applyMatrix4(inv);
  const tris = [];
  for (const k of ['l', 'r']) {
    const S = P(h.j[k + 'Sh'], [0, 0.02, 0]), E = P(h.j[k + 'El']), W = P(h.j[k + 'Wr'], [0, -0.05, 0]), H = P(h.j[k + 'Hip']), K = P(h.j[k + 'Kn'], [0, 0.1, 0]);
    tris.push(S, W, E, S, H, W, H, K, W);
  }
  const C = P(h.j.pelvis, [0, -0.1, 0]), LA = P(h.j.lAn), RA = P(h.j.rAn), LK = P(h.j.lKn), RK = P(h.j.rKn);
  tris.push(C, LK, RK, LK, LA, RA, LK, RA, RK);
  const g = new THREE.BufferGeometry().setFromPoints(tris); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat.clone()); m.material.side = THREE.DoubleSide; m.castShadow = true;
  h.root.add(m);
  return m;
}
// parașuta: cupolă cu fâșii roșii și albe, cu suspante
export function parachute() {
  const g = new THREE.Group();
  const geo = new THREE.SphereGeometry(1.8, 48, 12, 0, Math.PI * 2, 0, 0.95);
  const col = new Float32Array(geo.attributes.position.count * 3), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)); const s = Math.floor((a + Math.PI) / (Math.PI * 2) * 12) % 2; col.set(s ? [0.92, 0.12, 0.12] : [0.96, 0.96, 0.96], i * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const canopy = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, side: THREE.DoubleSide }));
  canopy.scale.set(1.35, 0.55, 0.85); canopy.position.y = 3.2; canopy.castShadow = true; g.add(canopy);
  const lineM = new THREE.MeshBasicMaterial({ color: 0x333333 });
  const rimY = 3.2 + 1.8 * Math.cos(0.95) * 0.55, rimR = 1.8 * Math.sin(0.95);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2, top = new THREE.Vector3(Math.cos(a) * rimR * 1.35, rimY, Math.sin(a) * rimR * 0.85), bot = new THREE.Vector3(i < 5 ? 0.2 : -0.2, 1.55, 0);
    const d = top.clone().sub(bot), L = d.length();
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, L, 4), lineM); c.position.copy(top).add(bot).multiplyScalar(0.5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); g.add(c);
  }
  g.canopy = canopy;
  return g;
}
// steaguri de rugăciune tibetane pe o sfoară
export function prayerFlags(a, b, n = 12, sag = 0.25) {
  const g = new THREE.Group(), cols = [0x2a62d6, 0xf5f5f5, 0xd62a2a, 0x2aa54a, 0xf2c21a];
  const line = []; const flags = [];
  for (let i = 0; i <= n; i++) { const t = i / n; const p = a.clone().lerp(b, t); p.y -= Math.sin(t * Math.PI) * sag; line.push(p); }
  g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(line), new THREE.LineBasicMaterial({ color: 0x555555 })));
  for (let i = 0; i < n; i++) {
    const piv = new THREE.Group(); piv.position.copy(line[i]).lerp(line[i + 1], 0.5); g.add(piv);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.2).translate(0, -0.1, 0), new THREE.MeshStandardMaterial({ color: cols[i % 5], roughness: 0.9, side: THREE.DoubleSide }));
    f.castShadow = true; piv.add(f); piv.lookAt(piv.position.clone().add(new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3(0, 1, 0)))); flags.push(piv);
  }
  g.update = (t, wind = 1) => flags.forEach((f, i) => { f.children[0].rotation.x = -(0.25 + 1.1 * wind) + Math.sin(t * (4 + 9 * wind) + i * 1.3) * (0.15 + 0.25 * wind); f.children[0].rotation.y = Math.sin(t * 7 + i) * 0.2 * wind; });
  return g;
}
// bucăți de zăpadă care sar la impact (balistic, determinist)
export function snowBurst(n, { seed = 1, speed = 3, up = 1, gravity = -9, size = 0.05, dir = new THREE.Vector3(0, 1, 0) } = {}) {
  const r = rng(seed);
  const m = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: 0xf4f8ff, roughness: 0.9 }), n);
  m.castShadow = true; m.frustumCulled = false;
  const V = [], S = []; const d = dir.clone().normalize();
  for (let i = 0; i < n; i++) { const v = new THREE.Vector3(r() - 0.5, r() * up, r() - 0.5).normalize().add(d.clone().multiplyScalar(0.8)).normalize().multiplyScalar(speed * (0.3 + r())); V.push(v); S.push(size * (0.3 + r() * 1.2)); }
  const o = new THREE.Object3D();
  m.update = (t) => {
    for (let i = 0; i < n; i++) {
      const tt = Math.max(0, t), v = V[i];
      o.position.set(v.x * tt, v.y * tt + 0.5 * gravity * tt * tt, v.z * tt);
      o.scale.setScalar(t < 0 ? 1e-4 : S[i] * Math.max(0.05, 1 - tt * 0.5)); o.rotation.set(tt * 5 + i, tt * 3, 0); o.updateMatrix(); m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  };
  m.update(-1);
  return m;
}
// fulgi purtați de vânt, în buclă (pozițiile depind doar de t)
export function blowingSnow(n, box, { seed = 3, speed = 9, size = 0.018 } = {}) {
  const r = rng(seed);
  const m = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }), n);
  m.frustumCulled = false;
  const P = []; for (let i = 0; i < n; i++) P.push([r(), r(), r(), 0.6 + r() * 0.8]);
  const o = new THREE.Object3D();
  m.update = (t) => {
    for (let i = 0; i < n; i++) {
      const [a, b, c, s] = P[i]; const x = ((a + t * speed * s / box[0]) % 1) * box[0] - box[0] / 2;
      o.position.set(x, b * box[1] + Math.sin(t * 3 + i) * 0.05, c * box[2] - box[2] / 2); o.scale.set(size * 3 * s, size, size); o.updateMatrix(); m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  };
  return m;
}
