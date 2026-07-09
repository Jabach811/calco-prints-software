// Draws a chunky 2D portrait of a Buddy profile onto a canvas (HUD avatar).
import { ACCENT, HAT_COLORS } from '../data/palette.js';

const LIGHT_BG = { green: '#dff3d8', blue: '#dbe9ff', purple: '#ecdffa', pink: '#fbdff0', red: '#fbdddd', orange: '#fde8d6', yellow: '#fdf3d0' };
const INK = '#181818';
const LINE = '#42222e';

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
  } else if (profile.shape === 'mochi') {
    g.ellipse(0, 4 * u, 36 * u, 30 * u, 0, 0, Math.PI * 2);
  } else if (profile.shape === 'tofu') {
    g.roundRect(-32 * u, -30 * u, 64 * u, 62 * u, 18 * u);
  } else if (profile.shape === 'pear') {
    g.moveTo(0, -40 * u);
    g.quadraticCurveTo(16 * u, -30 * u, 24 * u, -4 * u);
    g.arc(0, 10 * u, 28 * u, -0.53, Math.PI + 0.53);
    g.quadraticCurveTo(-16 * u, -30 * u, 0, -40 * u);
  } else {
    g.ellipse(0, 0, 32 * u, 38 * u, 0, 0, Math.PI * 2);
  }
  g.fill();

  // eyes
  const eyeY = -8 * u;
  const eyes = profile.eyes || 'plain';
  if (eyes === 'sleepy') {
    g.strokeStyle = INK;
    g.lineWidth = 3.5 * u;
    g.lineCap = 'round';
    [-13, 13].forEach((x) => {
      g.beginPath();
      g.arc(x * u, eyeY + 2 * u, 6 * u, Math.PI, 0);
      g.stroke();
    });
  } else {
    const dims = {
      plain: [6.5, 8], oval: [5, 9], wide: [8, 9.5], dot: [3, 3],
      calm: [7, 4.5], sparkle: [6.5, 8], mischief: [7, 5],
    }[eyes] || [6.5, 8];
    [-1, 1].forEach((s) => {
      const x = s * 13 * u;
      const rot = eyes === 'mischief' ? s * -0.25 : 0;
      g.fillStyle = INK;
      g.beginPath();
      g.ellipse(x, eyeY, dims[0] * u, dims[1] * u, rot, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#fff';
      g.beginPath();
      g.arc(x + 2 * u, eyeY - dims[1] * 0.35 * u, (eyes === 'dot' ? 1 : 2.2) * u, 0, Math.PI * 2);
      g.fill();
      if (eyes === 'wide') {
        g.beginPath();
        g.arc(x - 2.5 * u, eyeY + 2.5 * u, 1.3 * u, 0, Math.PI * 2);
        g.fill();
      }
      if (eyes === 'sparkle') {
        g.fillStyle = '#f5c542';
        g.beginPath();
        g.arc(x - 2.5 * u, eyeY + 1.5 * u, 1.7 * u, 0, Math.PI * 2);
        g.fill();
      }
    });
  }

  // brows
  g.strokeStyle = '#1c1c1c';
  g.lineWidth = 4 * u;
  g.lineCap = 'round';
  const brows = profile.brows || 'happy';
  [-1, 1].forEach((s) => {
    g.beginPath();
    if (brows === 'happy') {
      g.arc(s * 13.5 * u, -22 * u, 6 * u, Math.PI, 0);
    } else if (brows === 'surprised') {
      g.arc(s * 13.5 * u, -27 * u, 5.5 * u, Math.PI, 0);
    } else if (brows === 'curious') {
      if (s === 1) g.arc(13.5 * u, -26 * u, 5.5 * u, Math.PI, 0);
      else { g.moveTo(-20 * u, -21 * u); g.lineTo(-7 * u, -21 * u); }
    } else if (brows === 'sad') {
      g.moveTo(s * 7 * u, -24 * u); g.lineTo(s * 20 * u, -19 * u);
    } else if (brows === 'angry') {
      g.moveTo(s * 7 * u, -17 * u); g.lineTo(s * 20 * u, -22 * u);
    } else { // neutral
      g.moveTo(s * 7 * u, -21 * u); g.lineTo(s * 20 * u, -21 * u);
    }
    g.stroke();
  });

  // mouth
  g.strokeStyle = LINE;
  g.lineWidth = 3.5 * u;
  const mouth = profile.mouth || 'smile';
  g.beginPath();
  if (mouth === 'soft') {
    g.arc(0, 6 * u, 7 * u, 0.35, Math.PI - 0.35);
    g.stroke();
  } else if (mouth === 'grin') {
    g.arc(0, 8 * u, 4.5 * u, 0.3, Math.PI - 0.3);
    g.stroke();
  } else if (mouth === 'shy') {
    g.lineWidth = 2.8 * u;
    g.arc(u, 9 * u, 4 * u, 0.4, Math.PI - 0.4);
    g.stroke();
  } else if (mouth === 'smirk') {
    g.arc(4 * u, 6 * u, 8 * u, 0.15, Math.PI * 0.55);
    g.stroke();
  } else if (mouth === 'o') {
    g.arc(0, 9 * u, 4 * u, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = '#2e1219';
    g.beginPath(); g.arc(0, 9 * u, 2 * u, 0, Math.PI * 2); g.fill();
  } else if (mouth === 'neutral') {
    g.moveTo(-6 * u, 9 * u); g.lineTo(6 * u, 9 * u);
    g.stroke();
  } else if (mouth === 'laugh') {
    g.fillStyle = '#5b2333';
    g.moveTo(-9 * u, 6 * u); g.lineTo(9 * u, 6 * u);
    g.arc(0, 6 * u, 9 * u, 0, Math.PI);
    g.closePath(); g.fill();
    g.fillStyle = '#e2556b';
    g.beginPath(); g.ellipse(0, 11 * u, 4.5 * u, 2.8 * u, 0, 0, Math.PI * 2); g.fill();
  } else { // smile — big, friendly, closed
    g.lineWidth = 4.5 * u;
    g.arc(0, 3 * u, 11 * u, 0.3, Math.PI - 0.3);
    g.stroke();
  }

  // accessory
  const topY = ({ star: -44, pear: -40, mochi: -26, tofu: -30 }[profile.shape] ?? -36) * u;
  const acc = profile.accessory;
  const hc = HAT_COLORS[profile.hatColor] || HAT_COLORS.red;
  const shade = () => { g.fillStyle = 'rgba(0,0,0,0.22)'; g.fill(); };
  if (acc === 'party') {
    g.fillStyle = hc;
    g.beginPath();
    g.moveTo(-13 * u, topY + 4 * u);
    g.lineTo(13 * u, topY + 4 * u);
    g.lineTo(0, topY - 22 * u);
    g.closePath();
    g.fill();
    g.fillStyle = '#fff';
    g.beginPath(); g.arc(0, topY - 23 * u, 5 * u, 0, Math.PI * 2); g.fill();
  } else if (acc === 'crown') {
    g.fillStyle = hc;
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
  } else if (acc === 'beanie') {
    g.fillStyle = hc;
    g.beginPath(); g.ellipse(0, topY + 2 * u, 17 * u, 15 * u, 0, Math.PI, 0); g.fill();
    g.beginPath(); g.roundRect(-18 * u, topY, 36 * u, 7 * u, 3.5 * u); g.fill();
    shade();
    g.fillStyle = '#fff6e5';
    g.beginPath(); g.arc(0, topY - 14 * u, 5 * u, 0, Math.PI * 2); g.fill();
  } else if (acc === 'cap') {
    g.fillStyle = hc;
    g.beginPath(); g.ellipse(0, topY + 2 * u, 16 * u, 14 * u, 0, Math.PI, 0); g.fill();
    g.beginPath(); g.ellipse(0, topY + 3 * u, 17 * u, 4 * u, 0, 0, Math.PI * 2); g.fill();
    shade();
    g.fillStyle = '#fff6e5';
    g.beginPath(); g.arc(0, topY - 10 * u, 2 * u, 0, Math.PI * 2); g.fill();
  } else if (acc === 'wizard') {
    g.fillStyle = hc;
    g.beginPath();
    g.moveTo(0, topY - 26 * u);
    g.lineTo(11 * u, topY + 2 * u);
    g.lineTo(-11 * u, topY + 2 * u);
    g.closePath();
    g.fill();
    g.beginPath(); g.ellipse(0, topY + 3 * u, 20 * u, 4.5 * u, 0, 0, Math.PI * 2); g.fill();
    shade();
  } else if (acc === 'bucket') {
    g.fillStyle = hc;
    g.beginPath();
    g.moveTo(-11 * u, topY - 14 * u); g.lineTo(11 * u, topY - 14 * u);
    g.lineTo(13 * u, topY); g.lineTo(-13 * u, topY);
    g.closePath();
    g.fill();
    g.beginPath();
    g.moveTo(-13 * u, topY); g.lineTo(13 * u, topY);
    g.lineTo(17 * u, topY + 7 * u); g.lineTo(-17 * u, topY + 7 * u);
    g.closePath();
    g.fill();
    shade();
  } else if (acc === 'tophat') {
    g.fillStyle = hc;
    g.beginPath(); g.roundRect(-10 * u, topY - 20 * u, 20 * u, 21 * u, 3 * u); g.fill();
    g.beginPath(); g.roundRect(-17 * u, topY - u, 34 * u, 5 * u, 2.5 * u); g.fill();
    g.beginPath(); g.rect(-10 * u, topY - 8 * u, 20 * u, 5 * u);
    shade();
  } else if (acc === 'staffcap') {
    g.fillStyle = '#9B5DE5';
    g.beginPath();
    g.ellipse(0, topY + 2 * u, 16 * u, 10 * u, 0, Math.PI, 0);
    g.fill();
    g.beginPath();
    g.roundRect(-16 * u, topY + 1 * u, 32 * u, 5 * u, 3 * u);
    g.fill();
  } else if (acc === 'sunglasses') {
    g.fillStyle = '#15151c';
    g.beginPath(); g.roundRect(-24 * u, eyeY - 8 * u, 20 * u, 15 * u, 5 * u); g.fill();
    g.beginPath(); g.roundRect(4 * u, eyeY - 8 * u, 20 * u, 15 * u, 5 * u); g.fill();
    g.fillRect(-6 * u, eyeY - 4 * u, 12 * u, 3 * u);
  }
  g.restore();
}
