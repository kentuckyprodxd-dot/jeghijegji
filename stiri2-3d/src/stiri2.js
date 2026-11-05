// Recuzita pentru „Știri din 2050 – ediția a 2-a” (ficțiune): mașini zburătoare, clasă, hotel pe Lună, Moș pe plajă, roboți fotbaliști
import * as THREE from 'three';
import { makeHuman } from './human.js';
import { materials } from './materials.js';
import { glowSprite } from './props.js';
import { std, box, rng, textTex, screen, person } from './stiri.js';

const shadowAll = (o) => { o.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; };

// fațadă de bloc: etaje de 3 m, ferestre cu reflexe
export function facadeTex(seed, base = '#d9cbb4', floors = 14, cols = 6) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512; const x = c.getContext('2d'), r = rng(seed);
  x.fillStyle = base; x.fillRect(0, 0, 256, 512);
  const fh = 512 / floors, cw = 256 / cols;
  for (let j = 0; j < floors; j++) {
    x.fillStyle = 'rgba(0,0,0,0.08)'; x.fillRect(0, j * fh + fh - 3, 256, 3);
    for (let i = 0; i < cols; i++) {
      const g = x.createLinearGradient(0, j * fh, 0, j * fh + fh * 0.6); const b = 0.25 + r() * 0.35;
      g.addColorStop(0, `rgba(${150 * b + 60},${180 * b + 70},${220 * b + 30},1)`); g.addColorStop(1, `rgba(${40 * b + 20},${60 * b + 30},${90 * b + 40},1)`);
      x.fillStyle = g; x.fillRect(i * cw + cw * 0.18, j * fh + fh * 0.22, cw * 0.64, fh * 0.55);
      x.fillStyle = 'rgba(255,255,255,0.5)'; x.fillRect(i * cw + cw * 0.18, j * fh + fh * 0.75, cw * 0.64, 2);
    }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
export function building(w, floors, d, seed, base) {
  const h = floors * 3, t = facadeTex(seed, base, floors, Math.max(3, Math.round(w / 2.2)));
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [0, 1, 2, 3, 4, 5].map(i => i === 2 || i === 3 ? std(0x8a8580) : new THREE.MeshStandardMaterial({ map: t, roughness: 0.75 })));
  m.position.y = h / 2; m.castShadow = m.receiveShadow = true; return m;
}

// mașină zburătoare: caroserie rotunjită, cabină de sticlă, propulsoare albastre, stopuri roșii
export function flyingCar(color = 0xc8202a) {
  const g = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({ color, metalness: 0.6, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.75, 2.6, 8, 20), paint); body.rotation.x = Math.PI / 2; body.scale.set(1.15, 1, 0.55); g.add(body);
  const cab = new THREE.Mesh(new THREE.SphereGeometry(0.75, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0x0c1a2a, metalness: 0.2, roughness: 0.05, clearcoat: 1 })); cab.scale.set(1.0, 0.75, 1.5); cab.position.set(0, 0.28, -0.1); g.add(cab);
  const skirt = box(1.9, 0.12, 3.6, std(0x1b1d22, { roughness: 0.4, metalness: 0.5 }), [0, -0.38, 0]); g.add(skirt);
  g.glows = [];
  for (const x of [-0.75, 0.75]) for (const z of [-1.2, 1.2]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.06, 8, 24), std(0x2a2d33, { metalness: 0.7, roughness: 0.3 })); ring.rotation.x = Math.PI / 2; ring.position.set(x * 1.25, -0.4, z); g.add(ring);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.24, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 1.2, 2.6), toneMapped: false })); disc.rotation.x = Math.PI / 2; disc.position.set(x * 1.25, -0.42, z); g.add(disc);
    const s = glowSprite(0x58c8ff, 0.9); s.position.set(x * 1.25, -0.6, z); g.add(s); g.glows.push(s);
  }
  for (const x of [-0.55, 0.55]) { const tl = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.1, 0.05), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.5, 0.2, 0.2), toneMapped: false })); tl.position.set(x, 0.05, 2.08); g.add(tl); const s = glowSprite(0xff3030, 0.5); s.position.set(x, 0.05, 2.15); g.add(s); g.brake = (g.brake || []).concat(s); }
  for (const x of [-0.5, 0.5]) { const hl = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.05), new THREE.MeshBasicMaterial({ color: new THREE.Color(2, 2, 1.8), toneMapped: false })); hl.position.set(x, 0.0, -2.08); g.add(hl); }
  return shadowAll(g);
}

// mâini pe cap (disperare): IK pe ambele brațe
export function poseRobotify() {}

// robot umanoid: pornește de la un om și îl îmbracă în metal; vizieră cu ochi luminoși, antenă
const HIDE_ON_ROBOT = (M, m) => m === M.hair || m === M.beard || m === M.eyeWhite || m === M.iris || m === M.lip || m === M.teeth;
export function robotParts(h, { metal, dark, eye = 0x38e0ff, onlyHead = false } = {}) {
  const M = materials();
  metal = metal || new THREE.MeshPhysicalMaterial({ color: 0xd8dde4, metalness: 0.85, roughness: 0.28, clearcoat: 0.6 });
  dark = dark || new THREE.MeshPhysicalMaterial({ color: 0x14161b, metalness: 0.4, roughness: 0.15, clearcoat: 1 });
  const swaps = [];
  const rootObj = onlyHead ? h.j.neck : h.root;
  rootObj.traverse(o => { if (!o.isMesh) return; const m = o.material; if (HIDE_ON_ROBOT(M, m) || (m === M.mouth && o.geometry.parameters?.radius < 0.01)) swaps.push([o, m, null]); else if (m === M.skin || !onlyHead) swaps.push([o, m, m === M.mouth ? dark : metal]); });
  const extra = new THREE.Group(); h.j.head.add(extra);
  const visor = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.12, 6, 16), dark); visor.rotation.z = Math.PI / 2; visor.position.set(0, 0.112, 0.085); visor.scale.set(1, 1, 0.8); extra.add(visor);
  const eyes = [-1, 1].map(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(eye).multiplyScalar(2.5), toneMapped: false })); e.position.set(s * 0.035, 0.112, 0.108); extra.add(e); const g = glowSprite(eye, 0.06); g.position.copy(e.position); g.position.z += 0.01; extra.add(g); return g; });
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.09, 6), metal); ant.position.set(0.05, 0.24, -0.01); extra.add(ant);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.5, 0.3, 0.2), toneMapped: false })); bulb.position.set(0.05, 0.29, -0.01); extra.add(bulb);
  for (const s of [-1, 1]) { const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 16), metal); ear.rotation.z = Math.PI / 2; ear.position.set(s * 0.09, 0.1, 0); extra.add(ear); }
  extra.traverse(o => { if (o.isMesh) o.castShadow = true; });
  const set = (on) => { swaps.forEach(([o, m, r]) => { if (r === null) o.visible = !on; else o.material = on ? r : m; }); extra.visible = on; };
  set(false);
  return { set, eyes, bulb, metal };
}
export function robotPlayer(colors, eye = 0x38e0ff) {
  const h = makeHuman('casual');
  const metal = new THREE.MeshPhysicalMaterial({ color: colors[0], metalness: 0.75, roughness: 0.3, clearcoat: 0.7 });
  const rp = robotParts(h, { metal, eye }); rp.set(true);
  // tricou cu dungi (culorile echipei) pe piept
  colors.slice(1).forEach((c, i) => { const band = new THREE.Mesh(new THREE.CylinderGeometry(0.232, 0.232, 0.06, 28, 1, true), std(c, { roughness: 0.5 })); band.position.y = 0.02 + i * 0.065; band.scale.z = 0.72; h.j.chest.add(band); });
  shadowAll(h.root); h.rp = rp; return h;
}

// Moș Crăciun la plajă: costum roșu, barbă albă, căciulă, ochelari de soare
export function santa() {
  const h = person(0xc8202a, 0xc8202a, { feet: 0x111111 });
  const white = std(0xf6f6f2, { roughness: 0.95 });
  const beard = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 16), white); beard.scale.set(1.05, 1.25, 0.75); beard.position.set(0, 0.0, 0.06); h.j.head.add(beard);
  const mst = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 10), white); mst.scale.set(1.6, 0.55, 0.8); mst.position.set(0, 0.045, 0.1); h.j.head.add(mst);
  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.105, 0.26, 24), std(0xc8202a, { roughness: 0.8 })); hat.position.set(0, 0.28, -0.03); hat.rotation.x = -0.35; h.j.head.add(hat);
  const brim = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.028, 10, 28), white); brim.rotation.x = Math.PI / 2 - 0.35; brim.position.set(0, 0.17, 0.0); h.j.head.add(brim);
  const pom = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), white); pom.position.set(0, 0.36, -0.12); h.j.head.add(pom);
  const glasses = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.09, 6, 12), new THREE.MeshPhysicalMaterial({ color: 0x101018, roughness: 0.05, metalness: 0.3, clearcoat: 1 })); glasses.rotation.z = Math.PI / 2; glasses.position.set(0, 0.11, 0.095); h.j.head.add(glasses);
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 28, 1, true), std(0x111111, { roughness: 0.4 })); belt.position.y = -0.17; belt.scale.z = 0.75; h.j.chest.add(belt);
  const buckle = box(0.06, 0.05, 0.01, std(0xf2c21a, { metalness: 0.9, roughness: 0.2 }), [0, -0.17, 0.155]); h.j.chest.add(buckle);
  return shadowAll(h.root), h;
}
export function surfboard() {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 1.5, 8, 24), new THREE.MeshPhysicalMaterial({ color: 0x2ec4d6, roughness: 0.3, clearcoat: 1 })); b.scale.set(1, 1, 0.12); g.add(b);
  const stripe = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 1.6, 4, 12), std(0xffffff, { roughness: 0.4 })); stripe.scale.set(1, 1, 0.5); stripe.position.z = 0.0; stripe.scale.z = 0.35; g.add(stripe);
  const fin = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 3), std(0x222222)); fin.position.set(0, -0.8, -0.05); fin.rotation.x = Math.PI / 2; fin.scale.z = 0.3; g.add(fin);
  return shadowAll(g);
}
export function palm(h = 6, seed = 1) {
  const g = new THREE.Group(), r = rng(seed);
  const pts = []; for (let i = 0; i <= 10; i++) pts.push(new THREE.Vector3(Math.sin(i / 10 * 1.2) * 0.8, i / 10 * h, 0));
  const trunk = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.16, 10), std(0x8a6a48, { roughness: 1 })); g.add(trunk);
  const top = pts[pts.length - 1];
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2 + r(); const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 2.4, 1, 6), std(0x2f8a3a, { roughness: 0.8, side: THREE.DoubleSide }));
    const p = leaf.geometry.attributes.position; for (let k = 0; k < p.count; k++) { const y = p.getY(k) + 1.2; p.setZ(k, -0.12 * y * y); p.setX(k, p.getX(k) * (1 - Math.abs(y - 1.2) / 1.4)); } leaf.geometry.computeVertexNormals();
    leaf.geometry.translate(0, 1.2, 0); leaf.position.copy(top); leaf.rotation.set(0, a, 0); leaf.rotateX(1.1); g.add(leaf); }
  return shadowAll(g);
}
export function clouds(n, seed, spread = 60, y = 18) {
  const g = new THREE.Group(), r = rng(seed), m = std(0xffffff, { roughness: 1, emissive: 0x5a6070 });
  for (let i = 0; i < n; i++) { const c = new THREE.Group(); for (let k = 0; k < 5; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(1 + r() * 1.2, 16, 12), m); s.position.set(k * 1.3 - 2.6, r() * 0.6, r() * 0.8); s.scale.y = 0.6; c.add(s); } c.position.set((r() - 0.5) * spread, y + r() * 6, -30 - r() * 30); c.scale.setScalar(1 + r()); g.add(c); }
  return g;
}
export { std, box, rng, textTex, screen, person };
