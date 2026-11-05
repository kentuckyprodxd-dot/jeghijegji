// Recuzita pentru „Știri din 2050” (ficțiune): studio, Marte, autostradă, Lună, roboți, meteo
import * as THREE from 'three';
import { makeHuman } from './human.js';
import { materials } from './materials.js';
import { glowSprite } from './props.js';

export const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, metalness: 0, ...o });
const shadowAll = (o) => { o.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; };
export const box = (w, h, d, m, p = [0, 0, 0], r = [0, 0, 0]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(...p); b.rotation.set(...r); b.castShadow = b.receiveShadow = true; return b; };
export function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// text pe o textură (pancarte, ecrane, indicatoare)
export function textTex(lines, { w = 1024, h = 512, bg = '#0a1838', fg = '#ffffff', size = 120, accent = null } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.draw = () => { x.fillStyle = bg; x.fillRect(0, 0, w, h); if (accent) { x.fillStyle = accent; x.fillRect(0, h - h * 0.08, w, h * 0.08); }
    x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `700 ${size}px Cap, Montserrat, sans-serif`;
    lines.forEach((l, i) => x.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size * 1.1)); t.needsUpdate = true; };
  t.draw(); return t;
}
export function screen(w, h, tex, glow = 1) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, color: new THREE.Color(glow, glow, glow) })); return m; }

// ---------- personaje ----------
function repaint(h, { top, legs, feet, hands }) {
  const M = materials();
  h.root.traverse(o => { if (o.isMesh && o.material === M.cloth) o.material = top; });
  for (const k of ['lHip', 'rHip']) h.j[k].traverse(o => { if (o.isMesh && o.material === top) o.material = legs; });
  for (const k of ['lAn', 'rAn']) h.j[k].traverse(o => { if (o.isMesh) o.material = feet; });
  if (hands) for (const k of ['lWr', 'rWr']) h.j[k].traverse(o => { if (o.isMesh) o.material = hands; });
}
export function anchor() {   // prezentatorul: costum bleumarin, cămașă albă, cravată roșie
  const h = makeHuman('casual');
  repaint(h, { top: std(0x1a2a4a, { roughness: 0.55 }), legs: std(0x1a2a4a, { roughness: 0.6 }), feet: std(0x111111, { roughness: 0.4 }) });
  const shirt = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.22, 3), std(0xf4f4f0)); shirt.rotation.set(Math.PI, 0, 0); shirt.position.set(0, 0.27, 0.118); shirt.scale.z = 0.4; h.j.chest.add(shirt);
  const tie = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.24, 4), std(0xc8202a)); tie.rotation.x = Math.PI; tie.position.set(0, 0.2, 0.128); h.j.chest.add(tie);
  const mic = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), std(0x111111)); mic.position.set(0.09, 0.26, 0.125); h.j.chest.add(mic);
  return shadowAll(h.root), h;
}
export function person(top, legs, opts = {}) {
  const h = makeHuman('casual'); repaint(h, { top: std(top, { roughness: 0.8 }), legs: std(legs, { roughness: 0.8 }), feet: std(opts.feet ?? 0x2a2a2a) });
  return shadowAll(h.root), h;
}
export function mayor() {   // primarul de pe Marte: costum spațial portocaliu, eșarfă tricoloră pe diagonală
  const h = person(0xe8701a, 0xe8701a, { feet: 0xdddddd });
  const sash = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 8, 40), std(0x2b56c8)); sash.rotation.set(0.1, 0, 0.75); sash.scale.set(1, 1.55, 0.7); sash.position.set(0, 0.12, 0); h.j.chest.add(sash);
  const sash2 = sash.clone(); sash2.material = std(0xf2c21a); sash2.scale.set(1.05, 1.6, 0.72); sash2.position.y += 0.005; h.j.chest.add(sash2);
  return h;
}
export function astronaut(color = 0xf0f0f0, stripe = 0xc8202a) {
  const h = person(color, color, { feet: 0x9aa1ab });
  const helm = new THREE.Mesh(new THREE.SphereGeometry(0.17, 32, 20), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, metalness: 0, transmission: 0.0, transparent: true, opacity: 0.35, clearcoat: 1 })); helm.position.set(0, 0.11, 0.01); h.j.head.add(helm);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 10, 30), std(0xbfc4cc, { metalness: 0.6, roughness: 0.3 })); ring.rotation.x = Math.PI / 2; ring.position.set(0, -0.03, 0); h.j.head.add(ring);
  const pack = box(0.28, 0.38, 0.14, std(0xdcdcdc), [0, 0.1, -0.17]); h.j.chest.add(pack);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.225, 0.05, 24, 1, true), std(stripe)); band.position.y = 0.05; h.j.chest.add(band);
  return h;
}
// robot de livrare: cutie pe roți, „față” pe ecran, steag, pancartă
export function robot(signText, seed = 1) {
  const g = new THREE.Group(), r = rng(seed);
  const body = box(0.62, 0.48, 0.78, std(0xf2f2f2, { roughness: 0.35 }), [0, 0.42, 0]); g.add(body);
  const lid = box(0.64, 0.06, 0.8, std(0x2b2f36, { roughness: 0.4 }), [0, 0.68, 0]); g.add(lid);
  const face = screen(0.42, 0.18, textTex(['ò_ó'], { w: 256, h: 112, bg: '#0b0f18', fg: '#38e0ff', size: 80 }), 1.4); face.position.set(0, 0.48, 0.395); g.add(face);
  for (const x of [-0.3, 0.3]) for (const z of [-0.28, 0, 0.28]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.07, 16), std(0x1b1d22)); w.rotation.z = Math.PI / 2; w.position.set(x, 0.1, z); g.add(w); }
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.2, 8), std(0x8a6a3e)); pole.position.set(0.24, 1.2, -0.1); g.add(pole);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.14), std(0xff7a1a, { side: THREE.DoubleSide })); flag.position.set(0.35, 1.72, -0.1); g.add(flag);
  const sign = screen(0.9, 0.5, textTex(signText, { w: 512, h: 288, bg: '#fff7e0', fg: '#c8202a', size: 64 }), 1); sign.position.set(-0.05, 1.18, 0.05); sign.material = new THREE.MeshStandardMaterial({ map: sign.material.map, roughness: 0.8, side: THREE.DoubleSide }); g.add(sign);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.6, 8), std(0x8a6a3e)); stick.position.set(-0.05, 0.75, 0.03); g.add(stick);
  g.sign = sign; g.flag = flag;
  return shadowAll(g);
}
// cupolă transparentă (oraș pe Marte)
export function dome(r) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0xcfe8ff, roughness: 0.05, transparent: true, opacity: 0.28, clearcoat: 1, side: THREE.DoubleSide })); return m; }
export function teardrop() { const s = glowSprite(0x7fd0ff, 0.06); return s; }
