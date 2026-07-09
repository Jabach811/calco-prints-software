// The Little Buddy: glossy vinyl-toy blob built entirely from rounded primitives.
// One component renders player, NPCs and remote friends alike, driven by a
// mutable rt object ({anim, animT, speak, holding}) mutated in useFrame.

import * as THREE from 'three';
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { ACCENT, HAT_COLORS } from '../data/palette.js';
import { mat } from './materials.js';

// ---------- geometry factories (module-level, shared) ----------
function lathePoints(fn, n = 26) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const [r, y] = fn(t);
    pts.push(new THREE.Vector2(Math.max(r, 0.001), y));
  }
  return pts;
}

const GEO = {};

GEO.blob = new THREE.LatheGeometry(
  lathePoints((t) => {
    const a = t * Math.PI;
    const y = 0.66 - 0.66 * Math.cos(a);
    const r = 0.62 * Math.sin(a) * (1 - 0.24 * (y / 1.32));
    return [r, y];
  }),
  36
);

GEO.ghost = new THREE.LatheGeometry(
  lathePoints((t) => {
    // flare skirt -> waist -> dome
    const y = t * 1.22;
    let r;
    if (t < 0.12) r = 0.58 - t * 0.7;
    else if (t < 0.55) r = 0.5 - (t - 0.12) * 0.1;
    else r = 0.457 * Math.cos(((t - 0.55) / 0.45) * Math.PI * 0.5);
    return [r, y];
  }),
  36
);

function starShape(outer = 0.72, inner = 0.4) {
  const s = new THREE.Shape();
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2; // one point up
    pts.push([Math.cos(a) * r, -Math.sin(a) * r]);
  }
  // rounded-ish star via quadratic curves between midpoints
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let m = mid(pts[9], pts[0]);
  s.moveTo(m[0], m[1]);
  for (let i = 0; i < 10; i++) {
    const p = pts[i];
    const nm = mid(p, pts[(i + 1) % 10]);
    s.quadraticCurveTo(p[0], p[1], nm[0], nm[1]);
  }
  return s;
}

GEO.star = (() => {
  const g = new THREE.ExtrudeGeometry(starShape(), { depth: 0.34, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.12, bevelSegments: 4, curveSegments: 10 });
  g.center();
  g.translate(0, 0.74, 0);
  return g;
})();

GEO.droplet = new THREE.LatheGeometry(
  lathePoints((t) => {
    const y = t * 1.34;
    const r = 0.58 * Math.sin(Math.PI * Math.pow(Math.min(t, 1), 0.72)) * (1 - 0.12 * t);
    return [r, y];
  }),
  36
);

GEO.mochi = new THREE.LatheGeometry(
  lathePoints((t) => {
    const a = t * Math.PI;
    const y = 0.55 - 0.55 * Math.cos(a);
    const r = 0.7 * Math.sin(a) * (1 - 0.06 * (y / 1.1));
    return [r, y];
  }),
  36
);

GEO.pear = new THREE.LatheGeometry(
  lathePoints((t) => {
    const y = t * 1.4;
    const r = 0.62 * Math.sin(Math.PI * Math.pow(t, 0.92)) * (1 - 0.3 * Math.pow(t, 1.7));
    return [r, y];
  }),
  36
);

function roundedSquare(w = 0.92, h = 0.9, r = 0.26) {
  const s = new THREE.Shape();
  const x = w / 2, y = h / 2;
  s.moveTo(-x + r, -y);
  s.lineTo(x - r, -y); s.quadraticCurveTo(x, -y, x, -y + r);
  s.lineTo(x, y - r); s.quadraticCurveTo(x, y, x - r, y);
  s.lineTo(-x + r, y); s.quadraticCurveTo(-x, y, -x, y - r);
  s.lineTo(-x, -y + r); s.quadraticCurveTo(-x, -y, -x + r, -y);
  return s;
}

GEO.tofu = (() => {
  const g = new THREE.ExtrudeGeometry(roundedSquare(), { depth: 0.58, bevelEnabled: true, bevelThickness: 0.13, bevelSize: 0.11, bevelSegments: 5, curveSegments: 8 });
  g.center();
  g.translate(0, 0.54, 0);
  return g;
})();

GEO.eye = new THREE.SphereGeometry(0.105, 18, 14);
GEO.eyeHi = new THREE.SphereGeometry(0.035, 8, 8);
GEO.brow = new THREE.CapsuleGeometry(0.03, 0.13, 4, 8);
GEO.browArc = new THREE.TorusGeometry(0.075, 0.023, 8, 12, Math.PI * 0.75);
GEO.lidArc = new THREE.TorusGeometry(0.085, 0.024, 8, 14, Math.PI * 0.85);
GEO.smileArc = new THREE.TorusGeometry(0.08, 0.022, 8, 16, Math.PI * 0.85);
GEO.mouthOpen = new THREE.SphereGeometry(0.12, 16, 12);
GEO.tongue = new THREE.SphereGeometry(0.06, 10, 8);
GEO.mouthO = new THREE.TorusGeometry(0.05, 0.028, 8, 14);
GEO.oFill = new THREE.CircleGeometry(0.04, 12);
GEO.mouthLine = new THREE.CapsuleGeometry(0.022, 0.1, 4, 8);
GEO.blush = new THREE.SphereGeometry(0.055, 8, 8);
GEO.arm = new THREE.CapsuleGeometry(0.08, 0.2, 6, 10);
GEO.foot = new THREE.SphereGeometry(0.1, 12, 10);
GEO.hatCone = new THREE.ConeGeometry(0.26, 0.48, 20);
GEO.pom = new THREE.SphereGeometry(0.085, 12, 10);
GEO.crownBase = new THREE.CylinderGeometry(0.21, 0.23, 0.15, 16);
GEO.crownSpike = new THREE.ConeGeometry(0.05, 0.13, 8);
GEO.capDome = new THREE.SphereGeometry(0.27, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
GEO.capBrim = new THREE.CylinderGeometry(0.29, 0.29, 0.035, 18);
GEO.beanieDome = new THREE.SphereGeometry(0.27, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.58);
GEO.beanieBrim = new THREE.TorusGeometry(0.24, 0.055, 10, 20);
GEO.wizardCone = new THREE.ConeGeometry(0.23, 0.56, 18);
GEO.wizardBrim = new THREE.CylinderGeometry(0.36, 0.38, 0.045, 20);
GEO.bucketTop = new THREE.CylinderGeometry(0.2, 0.26, 0.2, 18);
GEO.bucketBrim = new THREE.CylinderGeometry(0.26, 0.36, 0.07, 20);
GEO.topHat = new THREE.CylinderGeometry(0.17, 0.185, 0.32, 16);
GEO.topHatBrim = new THREE.CylinderGeometry(0.29, 0.29, 0.035, 18);
GEO.hatBand = new THREE.CylinderGeometry(0.187, 0.198, 0.09, 16);
GEO.glassLens = new THREE.BoxGeometry(0.19, 0.15, 0.05);
GEO.glassBridge = new THREE.BoxGeometry(0.1, 0.035, 0.04);
GEO.scallop = new THREE.SphereGeometry(0.115, 10, 8);
GEO.dropTip = new THREE.TorusGeometry(0.07, 0.042, 8, 10, Math.PI * 1.1);

// face placement per shape. z is the eye depth; mouthZ is separate because the
// body is wider at mouth height than at eye height — a single depth sinks the
// mouth inside the body. hatY is where a hat's base ring rests. Shapes that
// taper above the eyes (ghost, droplet, pear) pull brows inward/downward via
// browGap/browLift so raised brows stay on the head instead of floating.
const FACE = {
  blob:    { eyeY: 0.82, z: 0.475, gap: 0.21, mouthY: 0.58, mouthZ: 0.56, hatY: 1.24, armY: 0.55, armX: 0.55 },
  mochi:   { eyeY: 0.66, z: 0.61,  gap: 0.23, mouthY: 0.42, mouthZ: 0.67, hatY: 1.08, armY: 0.5,  armX: 0.62 },
  ghost:   { eyeY: 0.78, z: 0.44,  gap: 0.2,  mouthY: 0.56, mouthZ: 0.48, hatY: 1.14, armY: 0.52, armX: 0.5,  browGap: 0.17, browLift: 0.8 },
  star:    { eyeY: 0.86, z: 0.31,  gap: 0.19, mouthY: 0.63, mouthZ: 0.33, hatY: 1.3,  armY: 0.72, armX: 0.62 },
  droplet: { eyeY: 0.74, z: 0.43,  gap: 0.2,  mouthY: 0.5,  mouthZ: 0.57, hatY: 1.26, armY: 0.5,  armX: 0.52, browGap: 0.17, browLift: 0.85 },
  tofu:    { eyeY: 0.68, z: 0.37,  gap: 0.22, mouthY: 0.4,  mouthZ: 0.43, hatY: 1.09, armY: 0.5,  armX: 0.58 },
  pear:    { eyeY: 0.92, z: 0.4,   gap: 0.18, mouthY: 0.68, mouthZ: 0.55, hatY: 1.3,  armY: 0.55, armX: 0.56, browZ: 0.3, browGap: 0.14, browLift: 0.7 },
};

const darken = (hex, f = 0.72) => '#' + new THREE.Color(hex).multiplyScalar(f).getHexString();
const bodyColorOf = (p) => ACCENT[p.color] || p.color || ACCENT.green;

// non-arc eye styles: [scaleX, scaleY, scaleZ] on the eye sphere
const EYE_SCALE = {
  plain:    [1, 1.18, 0.55],
  oval:     [0.82, 1.35, 0.5],
  wide:     [1.28, 1.34, 0.6],
  dot:      [0.5, 0.5, 0.35],
  calm:     [1.15, 0.62, 0.5],
  sparkle:  [1, 1.18, 0.55],
  mischief: [1.05, 0.8, 0.5],
};
const EYE_HI = {
  plain:    { pos: [0.035, 0.045, 0.055], s: 1 },
  oval:     { pos: [0.03, 0.05, 0.052], s: 0.9 },
  wide:     { pos: [0.04, 0.05, 0.06], s: 1.15 },
  dot:      { pos: [0.016, 0.018, 0.032], s: 0.5 },
  calm:     { pos: [0.038, 0.012, 0.05], s: 0.75 },
  sparkle:  { pos: [0.035, 0.045, 0.055], s: 1 },
  mischief: { pos: [0.035, 0.02, 0.05], s: 0.8 },
};

function Eye({ p, s }) {
  const eyeMat = mat('#181818', 'gloss');
  if (p.eyes === 'sleepy') {
    // closed content lids: a soft ∩ arc per eye
    return <mesh geometry={GEO.lidArc} material={eyeMat} rotation={[0, 0, Math.PI * 0.075]} scale={[1, 0.85, 0.55]} />;
  }
  const sc = EYE_SCALE[p.eyes] || EYE_SCALE.plain;
  const hi = EYE_HI[p.eyes] || EYE_HI.plain;
  const tilt = p.eyes === 'mischief' ? s * 0.22 : 0;
  return (
    <group rotation={[0, 0, tilt]}>
      <mesh geometry={GEO.eye} material={eyeMat} scale={sc} />
      <mesh geometry={GEO.eyeHi} material={mat('#ffffff', 'gloss')} position={hi.pos} scale={hi.s} />
      {p.eyes === 'wide' && (
        <mesh geometry={GEO.eyeHi} material={mat('#ffffff', 'gloss')} position={[-0.035, -0.04, 0.06]} scale={0.55} />
      )}
      {p.eyes === 'sparkle' && (
        <mesh geometry={GEO.eyeHi} material={mat('#fff8d0', 'glow', { emissive: '#ffe9a0', emissiveIntensity: 0.7 })} position={[-0.03, -0.02, 0.06]} scale={0.8} />
      )}
    </group>
  );
}

function Brows({ p, f }) {
  const browMat = mat('#1c1c1c', 'plastic');
  const browZ = f.browZ ?? f.z + 0.02;
  const gap = f.browGap ?? f.gap;
  const lift = f.browLift ?? 1;
  const y = (h) => f.eyeY + h * lift;
  const arcTilt = Math.PI * 0.125; // centers the browArc sweep on top
  return [-1, 1].map((s) => {
    switch (p.brows) {
      case 'surprised':
        return <mesh key={'b' + s} geometry={GEO.browArc} material={browMat} position={[s * gap, y(0.3), browZ]} rotation={[0, 0, arcTilt]} scale={[1.05, 1.05, 0.55]} />;
      case 'happy':
        return <mesh key={'b' + s} geometry={GEO.browArc} material={browMat} position={[s * gap, y(0.25), browZ]} rotation={[0, 0, arcTilt]} scale={[0.95, 0.85, 0.55]} />;
      case 'curious':
        // one brow arched high, the other relaxed
        if (s === 1) return <mesh key={'b' + s} geometry={GEO.browArc} material={browMat} position={[s * gap, y(0.29), browZ]} rotation={[0, 0, arcTilt]} scale={[0.9, 0.9, 0.55]} />;
        return <mesh key={'b' + s} geometry={GEO.brow} material={browMat} position={[s * gap, y(0.21), browZ]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.7]} />;
      case 'sad':
        // inner ends drift up — gentle worry
        return <mesh key={'b' + s} geometry={GEO.brow} material={browMat} position={[s * gap, y(0.22), browZ]} rotation={[0, 0, Math.PI / 2 + s * -0.32]} scale={[1, 1, 0.7]} />;
      case 'angry':
        // the one intentionally sharp option: inner ends down, sitting low
        return <mesh key={'b' + s} geometry={GEO.brow} material={browMat} position={[s * gap, y(0.19), browZ]} rotation={[0, 0, Math.PI / 2 + s * 0.5]} scale={[1.15, 1, 0.7]} />;
      default: // neutral — flat and relaxed
        return <mesh key={'b' + s} geometry={GEO.brow} material={browMat} position={[s * gap, y(0.22), browZ]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.7]} />;
    }
  });
}

function Face({ p, f }) {
  return (
    <group position={[0, 0, 0]}>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * f.gap, f.eyeY, f.z]}>
          <Eye p={p} s={s} />
        </group>
      ))}
      <Brows p={p} f={f} />
      <Mouth p={p} f={f} />
      {p.blush && [-1, 1].map((s) => (
        <mesh key={'bl' + s} geometry={GEO.blush} material={mat('#f7a8c1', 'plastic')} position={[s * (f.gap + 0.17), f.eyeY - 0.16, f.z - 0.04]} scale={[1, 0.7, 0.4]} />
      ))}
    </group>
  );
}

const SMILE_ROT = Math.PI + Math.PI * 0.075; // centers the smileArc sweep at the bottom → ∪

function Mouth({ p, f }) {
  const line = mat('#42222e', 'plastic');
  const z = f.mouthZ;
  switch (p.mouth) {
    case 'soft':
      return <mesh geometry={GEO.smileArc} material={line} position={[0, f.mouthY + 0.03, z]} rotation={[0, 0, SMILE_ROT]} scale={[1, 0.9, 0.5]} />;
    case 'grin':
      return <mesh geometry={GEO.smileArc} material={line} position={[0, f.mouthY + 0.03, z]} rotation={[0, 0, SMILE_ROT]} scale={[0.75, 0.62, 0.5]} />;
    case 'shy':
      return <mesh geometry={GEO.smileArc} material={line} position={[0.01, f.mouthY + 0.01, z]} rotation={[0, 0, SMILE_ROT]} scale={[0.62, 0.5, 0.45]} />;
    case 'smirk':
      return <mesh geometry={GEO.smileArc} material={line} position={[0.045, f.mouthY + 0.03, z]} rotation={[0, 0, SMILE_ROT + 0.45]} scale={[0.85, 0.75, 0.5]} />;
    case 'o':
      return (
        <group position={[0, f.mouthY, z]}>
          <mesh geometry={GEO.oFill} material={mat('#2e1219', 'plastic')} position={[0, 0, -0.008]} />
          <mesh geometry={GEO.mouthO} material={line} scale={[1, 1.15, 0.6]} />
        </group>
      );
    case 'neutral':
      return <mesh geometry={GEO.mouthLine} material={line} position={[0, f.mouthY + 0.01, z]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.6]} />;
    case 'laugh':
      // small open laugh: dark half-moon, body-color lip flattens the top
      return (
        <group position={[0, f.mouthY, z]}>
          <mesh geometry={GEO.mouthOpen} material={mat('#5b2333', 'plastic')} scale={[1.05, 0.7, 0.32]} />
          <mesh geometry={GEO.mouthOpen} material={mat(bodyColorOf(p), 'plastic')} position={[0, 0.062, 0.01]} scale={[1.15, 0.44, 0.38]} />
          <mesh geometry={GEO.tongue} material={mat('#e2556b', 'plastic')} position={[0, -0.045, 0.035]} scale={[0.9, 0.42, 0.6]} />
        </group>
      );
    default: // smile — big, friendly, closed
      return <mesh geometry={GEO.smileArc} material={line} position={[0, f.mouthY + 0.045, z]} rotation={[0, 0, SMILE_ROT]} scale={[1.55, 1.45, 0.55]} />;
  }
}

// hats with a flat brim perch on the star's top point instead of sinking over it
const BRIMMED = new Set(['cap', 'wizard', 'bucket', 'tophat', 'staffcap']);
export const HEAD_HATS = new Set(['party', 'beanie', 'cap', 'wizard', 'bucket', 'crown', 'tophat', 'staffcap']);

function Accessory({ p, f }) {
  const hatY = f.hatY + (p.shape === 'star' && BRIMMED.has(p.accessory) ? 0.14 : 0);
  const c = HAT_COLORS[p.hatColor] || HAT_COLORS.red;
  const cMat = mat(c, 'plastic');
  const cDark = mat(darken(c, 0.78), 'plastic');
  switch (p.accessory) {
    case 'party':
      return (
        <group position={[0, hatY, 0]} rotation={[0.12, 0, -0.08]}>
          <mesh geometry={GEO.hatCone} material={cMat} position={[0, 0.24, 0]} castShadow />
          <mesh geometry={GEO.pom} material={mat('#FFFFFF', 'plastic')} position={[0, 0.5, 0]} />
        </group>
      );
    case 'beanie':
      return (
        <group position={[0, hatY, 0]} rotation={[0.08, 0, -0.06]}>
          <mesh geometry={GEO.beanieDome} material={cMat} position={[0, 0.02, 0]} castShadow />
          <mesh geometry={GEO.beanieBrim} material={cDark} position={[0, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]} />
          <mesh geometry={GEO.pom} material={mat('#FFF6E5', 'plastic')} position={[0, 0.29, 0]} scale={0.9} />
        </group>
      );
    case 'cap':
      return (
        <group position={[0, hatY, 0]} rotation={[0.06, 0, 0]}>
          <mesh geometry={GEO.capDome} material={cMat} castShadow />
          <mesh geometry={GEO.capBrim} material={cDark} position={[0, 0.02, 0.06]} scale={[1, 1, 1.25]} />
          <mesh geometry={GEO.eyeHi} material={mat('#FFF6E5', 'gloss')} position={[0, 0.27, 0]} scale={0.8} />
        </group>
      );
    case 'wizard':
      return (
        <group position={[0, hatY, 0]} rotation={[0.1, 0, -0.1]}>
          <mesh geometry={GEO.wizardBrim} material={cDark} position={[0, 0.02, 0]} castShadow />
          <mesh geometry={GEO.wizardCone} material={cMat} position={[0, 0.3, 0]} castShadow />
        </group>
      );
    case 'bucket':
      return (
        <group position={[0, hatY, 0]} rotation={[0.08, 0, 0.05]}>
          <mesh geometry={GEO.bucketBrim} material={cDark} position={[0, 0.035, 0]} castShadow />
          <mesh geometry={GEO.bucketTop} material={cMat} position={[0, 0.16, 0]} castShadow />
        </group>
      );
    case 'crown':
      return (
        <group position={[0, hatY + 0.02, 0]} rotation={[0.05, 0, -0.06]}>
          <mesh geometry={GEO.crownBase} material={mat(c, 'gloss')} />
          {[0, 1, 2, 3, 4].map((i) => {
            const a = (i / 5) * Math.PI * 2;
            return <mesh key={i} geometry={GEO.crownSpike} material={mat(c, 'gloss')} position={[Math.cos(a) * 0.19, 0.13, Math.sin(a) * 0.19]} />;
          })}
        </group>
      );
    case 'tophat':
      return (
        <group position={[0, hatY, 0]} rotation={[0.06, 0, -0.12]}>
          <mesh geometry={GEO.topHatBrim} material={cMat} position={[0, 0.02, 0]} castShadow />
          <mesh geometry={GEO.topHat} material={cMat} position={[0, 0.19, 0]} castShadow />
          <mesh geometry={GEO.hatBand} material={cDark} position={[0, 0.08, 0]} />
        </group>
      );
    case 'staffcap':
      return (
        <group position={[0, hatY - 0.02, 0]} rotation={[0.06, 0, 0]}>
          <mesh geometry={GEO.capDome} material={mat('#9B5DE5', 'plastic')} castShadow />
          <mesh geometry={GEO.capBrim} material={mat('#8449cf', 'plastic')} position={[0, 0.02, 0.06]} scale={[1, 1, 1.25]} />
          <mesh geometry={GEO.eyeHi} material={mat('#FFD23F', 'gloss')} position={[0, 0.13, 0.25]} />
        </group>
      );
    case 'sunglasses':
      return (
        <group position={[0, f.eyeY + 0.01, f.z + 0.04]}>
          {[-1, 1].map((s) => (
            <mesh key={s} geometry={GEO.glassLens} material={mat('#15151c', 'gloss')} position={[s * f.gap, 0, 0]} />
          ))}
          <mesh geometry={GEO.glassBridge} material={mat('#15151c', 'gloss')} position={[0, 0.03, 0]} />
        </group>
      );
    default:
      return null;
  }
}

function Holding({ rt }) {
  const ref = useRef();
  useFrame(() => {
    if (ref.current) ref.current.visible = !!rt.holding;
  });
  return (
    <group ref={ref} position={[0.52, 0.55, 0.32]}>
      <HoldingItem rt={rt} />
    </group>
  );
}

function HoldingItem({ rt }) {
  const canRef = useRef();
  const snackRef = useRef();
  useFrame(() => {
    const h = rt.holding || '';
    if (canRef.current) canRef.current.visible = h === 'wateringcan';
    if (snackRef.current) {
      const isSnack = h.startsWith('snack:');
      snackRef.current.visible = isSnack;
      if (isSnack && snackRef.current.userData.icon !== h) {
        snackRef.current.userData.icon = h;
      }
    }
  });
  return (
    <>
      <group ref={canRef} rotation={[0, 0, -0.35]}>
        <mesh material={mat('#4aa3e8', 'plastic')}>
          <cylinderGeometry args={[0.13, 0.15, 0.2, 12]} />
        </mesh>
        <mesh material={mat('#4aa3e8', 'plastic')} position={[0.16, 0.04, 0]} rotation={[0, 0, -0.9]}>
          <coneGeometry args={[0.045, 0.22, 8]} />
        </mesh>
        <mesh material={mat('#3b8ac9', 'plastic')} position={[-0.1, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.07, 0.018, 6, 12, Math.PI]} />
        </mesh>
      </group>
      <group ref={snackRef}>
        <mesh material={mat('#f3d9a4', 'plastic')}>
          <sphereGeometry args={[0.11, 10, 8]} />
        </mesh>
      </group>
    </>
  );
}

// ---------- animation ----------
export function animateBuddy(rt, refs, dt) {
  rt.animT = (rt.animT || 0) + dt;
  const t = rt.animT;
  const { bodyG, armL, armR, inner } = refs;
  if (!bodyG.current) return;
  const b = bodyG.current;

  // reset pose each frame, then apply
  let sy = 1 + 0.035 * Math.sin(performance.now() / 400);
  let sxz = 1 - 0.022 * Math.sin(performance.now() / 400);
  let y = 0, rz = 0, rx = 0, ryExtra = 0;
  let aL = 0.45, aR = -0.45; // arm rotation.z rest (down-out)
  let aLx = 0, aRx = 0;

  switch (rt.anim) {
    case 'walk': {
      y = Math.abs(Math.sin(t * 9)) * 0.09;
      rz = Math.sin(t * 9) * 0.09;
      aL = 0.45 + Math.sin(t * 9) * 0.5;
      aR = -0.45 + Math.sin(t * 9) * 0.5;
      break;
    }
    case 'wave': {
      aR = -2.5 + Math.sin(t * 10) * 0.35;
      rz = 0.06;
      break;
    }
    case 'cheer': {
      aL = 2.5 + Math.sin(t * 12) * 0.2;
      aR = -2.5 - Math.sin(t * 12) * 0.2;
      y = Math.abs(Math.sin(t * 7)) * 0.22;
      break;
    }
    case 'hop': {
      y = Math.abs(Math.sin(t * 7)) * 0.38;
      const land = Math.abs(Math.sin(t * 7));
      sy *= 0.9 + land * 0.15;
      sxz *= 1.08 - land * 0.1;
      break;
    }
    case 'spin': {
      ryExtra = t * 9;
      y = Math.abs(Math.sin(t * 5)) * 0.12;
      aL = 1.4; aR = -1.4;
      break;
    }
    case 'dance': {
      rz = Math.sin(t * 7) * 0.18;
      y = Math.abs(Math.sin(t * 7)) * 0.12;
      aL = 0.6 + Math.sin(t * 7) * 1.2;
      aR = -0.6 + Math.sin(t * 7 + Math.PI) * 1.2;
      ryExtra = Math.sin(t * 3.5) * 0.3;
      break;
    }
    case 'laugh': {
      y = Math.abs(Math.sin(t * 11)) * 0.07;
      rx = -0.18;
      aL = 0.9; aR = -0.9;
      break;
    }
    case 'clap': {
      const c = (Math.sin(t * 11) + 1) / 2;
      aL = 1.5 - c * 0.5; aR = -1.5 + c * 0.5;
      aLx = -0.9; aRx = -0.9;
      break;
    }
    case 'sit':
    case 'sitdown': {
      y = -0.16;
      sy *= 0.94;
      sxz *= 1.05;
      aL = 0.25; aR = -0.25;
      break;
    }
    case 'swim': {
      y = Math.sin(t * 2.4) * 0.05 - 0.32;
      rx = -0.12;
      aL = 1.1 + Math.sin(t * 4) * 0.4;
      aR = -1.1 - Math.sin(t * 4 + 1) * 0.4;
      break;
    }
    case 'float': {
      y = Math.sin(t * 2) * 0.06 - 0.1;
      rz = Math.sin(t * 1.4) * 0.05;
      aL = 1.3; aR = -1.3;
      break;
    }
    case 'ride': {
      rx = -0.3;
      aL = 2.4; aR = -2.4;
      y = 0.05;
      break;
    }
    case 'eat': {
      aRx = -1.3;
      aR = -0.2;
      const chew = Math.sin(t * 9);
      sy *= 1 + chew * 0.02;
      break;
    }
    case 'water': {
      rx = 0.12;
      aRx = -1.0;
      aR = -0.35;
      break;
    }
    case 'shake': {
      rz = Math.sin(t * 22) * 0.12;
      break;
    }
    case 'pick': {
      rx = 0.35 * Math.min(1, Math.sin(Math.min(t * 3, Math.PI)));
      aRx = -0.8;
      break;
    }
    case 'gift': {
      aLx = -1.1; aRx = -1.1;
      aL = 0.15; aR = -0.15;
      break;
    }
    case 'bounce': {
      y = Math.abs(Math.sin(t * 8)) * 0.12;
      break;
    }
    default: {
      // idle: occasional tiny look-around
      ryExtra = Math.sin(performance.now() / 2600) * 0.12;
    }
  }

  b.position.y = y;
  b.rotation.set(rx, ryExtra, rz);
  b.scale.set(sxz, sy, sxz);
  if (armL.current) armL.current.rotation.set(aLx, 0, aL);
  if (armR.current) armR.current.rotation.set(aRx, 0, aR);
  if (inner && inner.current) inner.current.rotation.y = 0;
}

// ---------- the component ----------
export function Buddy({ profile, rt, castShadow = true, children }) {
  const bodyG = useRef();
  const armL = useRef();
  const armR = useRef();
  const f = FACE[profile.shape] || FACE.blob;
  const color = ACCENT[profile.color] || profile.color || ACCENT.green;
  const bodyMat = mat(color, 'plastic');
  const footMat = mat(darken(color), 'plastic');

  useFrame((_, dt) => animateBuddy(rt, { bodyG, armL, armR }, Math.min(dt, 0.06)));

  const bodyGeo = GEO[profile.shape] || GEO.blob;

  return (
    <group>
      <group ref={bodyG}>
        <mesh geometry={bodyGeo} material={bodyMat} castShadow={castShadow} />
        {profile.shape === 'ghost' && (
          <group>
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
              return <mesh key={i} geometry={GEO.scallop} material={bodyMat} position={[Math.cos(a) * 0.42, 0.03, Math.sin(a) * 0.42]} scale={[1, 0.75, 1]} />;
            })}
          </group>
        )}
        {profile.shape === 'droplet' && !HEAD_HATS.has(profile.accessory) && (
          <mesh geometry={GEO.dropTip} material={bodyMat} position={[0.02, 1.3, 0]} rotation={[0, 0, -0.5]} />
        )}
        <Face p={profile} f={f} />
        <group ref={armL} position={[-f.armX, f.armY, 0]}>
          <mesh geometry={GEO.arm} material={bodyMat} position={[-0.05, -0.14, 0]} rotation={[0, 0, 0.35]} castShadow={castShadow} />
        </group>
        <group ref={armR} position={[f.armX, f.armY, 0]}>
          <mesh geometry={GEO.arm} material={bodyMat} position={[0.05, -0.14, 0]} rotation={[0, 0, -0.35]} castShadow={castShadow} />
        </group>
        {profile.shape !== 'ghost' && (
          <group>
            <mesh geometry={GEO.foot} material={footMat} position={[-0.2, 0.045, 0.14]} scale={[1.1, 0.6, 1.35]} />
            <mesh geometry={GEO.foot} material={footMat} position={[0.2, 0.045, 0.14]} scale={[1.1, 0.6, 1.35]} />
          </group>
        )}
        <Accessory p={profile} f={f} />
        {rt && <Holding rt={rt} />}
        {children}
      </group>
    </group>
  );
}

// speech / thought / sticker bubble attached above a buddy.
// distanceFactor=undefined renders at fixed screen size — used during the
// cinematic close-up, where distance scaling would blow the bubble up huge.
export function BuddyBubble({ bubble, height = 2.05, thought = false, distanceFactor = 13 }) {
  if (!bubble) return null;
  const cls = bubble.kind === 'sticker' ? 'bubble sticker-bubble' : thought ? 'bubble thought-bubble' : 'bubble speech-bubble';
  return (
    <Html position={[0, height, 0]} center distanceFactor={distanceFactor} zIndexRange={[30, 10]} style={{ pointerEvents: 'none' }}>
      <div className={cls}>
        {bubble.text}
        {thought && <div className="thought-dots"><i /><i /><i /></div>}
        {!thought && bubble.kind !== 'sticker' && <div className="speech-tail" />}
      </div>
    </Html>
  );
}
