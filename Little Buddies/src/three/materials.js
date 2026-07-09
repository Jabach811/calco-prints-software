import * as THREE from 'three';

const cache = new Map();

// glossy vinyl-toy plastic / matte plaster / warm wood / soft stone
export function mat(color, kind = 'plastic', extra = {}) {
  const key = `${color}|${kind}|${JSON.stringify(extra)}`;
  if (cache.has(key)) return cache.get(key);
  const presets = {
    plastic: { roughness: 0.28, metalness: 0.02 },
    gloss: { roughness: 0.15, metalness: 0.05 },
    plaster: { roughness: 0.92, metalness: 0 },
    wood: { roughness: 0.75, metalness: 0 },
    stone: { roughness: 0.95, metalness: 0 },
    leaf: { roughness: 0.7, metalness: 0 },
    water: { roughness: 0.18, metalness: 0.05, transparent: true, opacity: 0.88 },
    glow: { roughness: 0.4, metalness: 0, emissiveIntensity: 1 },
  };
  const m = new THREE.MeshStandardMaterial({ color, ...presets[kind], ...extra });
  if (kind === 'glow' && !extra.emissive) m.emissive = new THREE.Color(color);
  cache.set(key, m);
  return m;
}

// ---------- canvas textures ----------
export function textTexture(text, { w = 256, h = 96, bg = '#8B5A2B', fg = '#FFF6E5', font = 'bold 44px "Baloo 2", "Nunito", sans-serif', radius = 18 } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  if (bg) {
    g.fillStyle = bg;
    g.beginPath();
    g.roundRect(0, 0, w, h, radius);
    g.fill();
  }
  g.fillStyle = fg;
  g.font = font;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, w / 2, h / 2 + 2);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}

export function stripeTexture(colors = ['#3D8BFD', '#FFFFFF'], reps = 8, vertical = false) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  const band = 256 / reps;
  for (let i = 0; i < reps; i++) {
    g.fillStyle = colors[i % colors.length];
    if (vertical) g.fillRect(i * band, 0, band + 1, 256);
    else g.fillRect(0, i * band, 256, band + 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function sparkleTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  g.translate(64, 64);
  const grad = g.createRadialGradient(0, 0, 0, 0, 0, 64);
  grad.addColorStop(0, 'rgba(255,240,180,0.9)');
  grad.addColorStop(0.25, 'rgba(255,230,150,0.35)');
  grad.addColorStop(1, 'rgba(255,230,150,0)');
  g.fillStyle = grad;
  g.fillRect(-64, -64, 128, 128);
  g.fillStyle = 'rgba(255,255,255,0.95)';
  g.beginPath();
  const R = 52, r = 7;
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    g.moveTo(0, 0);
    g.quadraticCurveTo(Math.cos(a + 0.5) * r * 2, Math.sin(a + 0.5) * r * 2, Math.cos(a) * R, Math.sin(a) * R);
    g.quadraticCurveTo(Math.cos(a - 0.5) * r * 2, Math.sin(a - 0.5) * r * 2, 0, 0);
  }
  g.fill();
  return new THREE.CanvasTexture(c);
}

export function glowTexture(color = '255,220,140') {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, `rgba(${color},0.85)`);
  grad.addColorStop(0.4, `rgba(${color},0.28)`);
  grad.addColorStop(1, `rgba(${color},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

// subtle mottled-grass tile; drawn on white so the mesh color tints it
export function grassTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * 256, y = Math.random() * 256, r = 14 + Math.random() * 30;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, Math.random() > 0.5 ? 'rgba(25,70,20,0.12)' : 'rgba(255,250,190,0.13)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  g.lineWidth = 1.5;
  for (let i = 0; i < 380; i++) {
    const x = Math.random() * 250 + 3, y = Math.random() * 250 + 4;
    g.strokeStyle = Math.random() > 0.5 ? 'rgba(20,60,15,0.20)' : 'rgba(245,255,200,0.20)';
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + (Math.random() * 2 - 1) * 2, y - 2 - Math.random() * 3);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function waterStreakTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(90,190,240,0.85)';
  g.fillRect(0, 0, 128, 256);
  g.strokeStyle = 'rgba(255,255,255,0.55)';
  g.lineWidth = 5;
  for (let i = 0; i < 9; i++) {
    const x = 8 + Math.random() * 112;
    g.beginPath();
    g.moveTo(x, -10);
    g.quadraticCurveTo(x + (Math.random() * 16 - 8), 128, x, 270);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function menuBoardTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 320;
  const g = c.getContext('2d');
  g.fillStyle = '#3d2b1c';
  g.roundRect(0, 0, 256, 320, 20);
  g.fill();
  g.fillStyle = '#FFF6E5';
  g.font = 'bold 34px "Baloo 2", sans-serif';
  g.textAlign = 'center';
  g.fillText('MENU', 128, 52);
  g.font = '26px "Baloo 2", sans-serif';
  const rows = [['🍿 Popcorn', '5'], ['🧃 Juice', '5'], ['🍦 Ice Cream', '5']];
  rows.forEach(([n, p], i) => {
    g.textAlign = 'left';
    g.fillText(n, 22, 120 + i * 62);
    g.textAlign = 'right';
    g.fillText('🪙' + p, 236, 120 + i * 62);
  });
  return new THREE.CanvasTexture(c);
}
