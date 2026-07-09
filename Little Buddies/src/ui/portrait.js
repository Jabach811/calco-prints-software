// Draws a chunky 2D portrait of a Buddy profile onto a canvas (HUD avatar).
import { ACCENT } from '../data/palette.js';

const LIGHT_BG = { green: '#dff3d8', blue: '#dbe9ff', purple: '#ecdffa', pink: '#fbdff0', red: '#fbdddd', orange: '#fde8d6', yellow: '#fdf3d0' };

export function drawPortrait(canvas, profile, size = 112) {
  canvas.width = size;
  canvas.height = size;
  const g = canvas.getContext('2d');
  const c = ACCENT[profile.color] || '#54C24E';
  const u = size / 112;

  // rounded background
  g.fillStyle = LIGHT_BG[profile.color] || '#e8f2e2';
  g.beginPath();
  g.roundRect(0, 0, size, size, 24 * u);
  g.fill();

  g.save();
  g.translate(56 * u, 64 * u);

  // body silhouette
  g.fillStyle = c;
  g.beginPath();
  if (profile.shape === 'star') {
    for (let i = 0; i < 10; i++) {
      const r = (i % 2 === 0 ? 40 : 21) * u;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.closePath();
  } else if (profile.shape === 'ghost') {
    g.ellipse(0, -6 * u, 32 * u, 34 * u, 0, Math.PI, 0);
    g.lineTo(34 * u, 26 * u);
    for (let i = 0; i < 5; i++) {
      g.arc(34 * u - (i * 17 + 8.5) * u, 26 * u, 8.5 * u, 0, Math.PI, i % 2 === 0);
    }
    g.closePath();
  } else if (profile.shape === 'droplet') {
    g.moveTo(0, -40 * u);
    g.quadraticCurveTo(30 * u, -6 * u, 30 * u, 8 * u);
    g.arc(0, 8 * u, 30 * u, 0, Math.PI);
    g.quadraticCurveTo(-30 * u, -6 * u, 0, -40 * u);
  } else {
    g.ellipse(0, 0, 32 * u, 38 * u, 0, 0, Math.PI * 2);
  }
  g.fill();

  // eyes
  const eyeY = -8 * u;
  if (profile.eyes === 'sunglasses') {
    g.fillStyle = '#15151c';
    g.beginPath(); g.roundRect(-24 * u, eyeY - 8 * u, 20 * u, 15 * u, 5 * u); g.fill();
    g.beginPath(); g.roundRect(4 * u, eyeY - 8 * u, 20 * u, 15 * u, 5 * u); g.fill();
    g.fillRect(-6 * u, eyeY - 4 * u, 12 * u, 3 * u);
  } else {
    g.fillStyle = '#181818';
    [[-13, 0], [13, 0]].forEach(([x]) => {
      g.beginPath();
      g.ellipse(x * u, eyeY, 6.5 * u, 8 * u, 0, 0, Math.PI * 2);
      g.fill();
    });
    g.fillStyle = '#fff';
    [[-11, 0], [15, 0]].forEach(([x]) => {
      g.beginPath();
      g.arc(x * u, eyeY - 3 * u, 2.2 * u, 0, Math.PI * 2);
      g.fill();
    });
  }

  // brows
  g.strokeStyle = '#1c1c1c';
  g.lineWidth = 4 * u;
  g.lineCap = 'round';
  const tilt = { happy: -4, determined: 4, grumpy: 6 }[profile.brows] ?? -4;
  g.beginPath();
  g.moveTo(-20 * u, -20 * u + tilt * u); g.lineTo(-7 * u, -20 * u - tilt * u * 0.4);
  g.moveTo(20 * u, -20 * u + tilt * u); g.lineTo(7 * u, -20 * u - tilt * u * 0.4);
  g.stroke();

  // mouth
  g.fillStyle = '#5b2333';
  if (profile.mouth === 'o') {
    g.beginPath(); g.arc(0, 10 * u, 4.5 * u, 0, Math.PI * 2); g.fill();
  } else if (profile.mouth === 'smirk') {
    g.strokeStyle = '#3a1a22';
    g.beginPath(); g.arc(2 * u, 8 * u, 8 * u, 0.2, Math.PI * 0.75); g.stroke();
  } else {
    g.beginPath();
    g.ellipse(0, 10 * u, 11 * u, profile.mouth === 'grin' ? 6 * u : 8 * u, 0, 0, Math.PI * 2);
    g.fill();
    if (profile.mouth === 'grin') {
      g.fillStyle = '#fff';
      g.fillRect(-4 * u, 5 * u, 8 * u, 5 * u);
    } else {
      g.fillStyle = '#e2556b';
      g.beginPath(); g.ellipse(0, 14 * u, 6 * u, 3.5 * u, 0, 0, Math.PI * 2); g.fill();
    }
  }

  // accessory
  const topY = profile.shape === 'star' ? -44 * u : -36 * u;
  if (profile.accessory === 'partyhat' || profile.accessory === 'rainbowhat') {
    g.fillStyle = profile.accessory === 'partyhat' ? '#EF4444' : '#9B5DE5';
    g.beginPath();
    g.moveTo(-13 * u, topY + 4 * u);
    g.lineTo(13 * u, topY + 4 * u);
    g.lineTo(0, topY - 22 * u);
    g.closePath();
    g.fill();
    if (profile.accessory === 'rainbowhat') {
      const cols = ['#EF4444', '#F5883C', '#FFD23F', '#54C24E', '#3D8BFD'];
      cols.forEach((col, i) => {
        g.fillStyle = col;
        g.beginPath();
        const yy = topY + 2 * u - i * 4.4 * u;
        const w = 13 * u * (1 - i * 0.17);
        g.rect(-w, yy - 2.2 * u, w * 2, 4.4 * u);
        g.fill();
      });
    }
    g.fillStyle = '#fff';
    g.beginPath(); g.arc(0, topY - 23 * u, 5 * u, 0, Math.PI * 2); g.fill();
  } else if (profile.accessory === 'crowngold' || profile.accessory === 'crownwhite') {
    g.fillStyle = profile.accessory === 'crowngold' ? '#f5c542' : '#f6f2ea';
    g.beginPath();
    g.moveTo(-14 * u, topY + 6 * u);
    g.lineTo(14 * u, topY + 6 * u);
    g.lineTo(12 * u, topY - 8 * u);
    g.lineTo(6 * u, topY - 1 * u);
    g.lineTo(0, topY - 10 * u);
    g.lineTo(-6 * u, topY - 1 * u);
    g.lineTo(-12 * u, topY - 8 * u);
    g.closePath();
    g.fill();
  } else if (profile.accessory === 'staffcap') {
    g.fillStyle = '#9B5DE5';
    g.beginPath();
    g.ellipse(0, topY + 2 * u, 16 * u, 10 * u, 0, Math.PI, 0);
    g.fill();
    g.beginPath();
    g.roundRect(-16 * u, topY + 1 * u, 32 * u, 5 * u, 3 * u);
    g.fill();
  }
  g.restore();
}
