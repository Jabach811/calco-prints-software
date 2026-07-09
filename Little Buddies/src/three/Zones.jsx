// Paths, plaza hub, friendship garden, play meadow, snack stand, and props.
import * as THREE from 'three';
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instances, Instance, RoundedBox } from '@react-three/drei';
import { WORLD, ACCENT } from '../data/palette.js';
import { mat, stripeTexture, menuBoardTexture, sparkleTexture, glowTexture, textTexture } from './materials.js';
import { SignArrow } from './Hotel.jsx';
import { useGame } from '../state/store.js';

const now = () => performance.now() / 1000;

// ---------- stone paver paths ----------
const ROUTES = [
  [[0, -28], [0, -18], [0, -6]],
  [[6, 8], [16, 24], [24, 36], [30, 44]],
  [[-8, 8], [-20, 18], [-32, 28], [-44, 38]],
  [[10, 6], [22, 12], [34, 18], [40, 22]],
  [[36, 16], [40, 4], [42, -4]],
  [[0, 14], [4, 24], [0, 36], [-4, 48], [-2, 60]],
  [[-6, -30], [-16, -36], [-24, -40]],
  [[8, -30], [20, -28], [30, -26], [38, -22]],
  [[40, 20], [47, 16], [53, 11]],
];

export function Paths() {
  const pavers = useMemo(() => {
    const arr = [];
    let seed = 5;
    const rnd = () => { seed = (seed * 16807 + 11) % 2147483647; return (seed % 1000) / 1000; };
    ROUTES.forEach((route) => {
      const pts = route.map(([x, z]) => new THREE.Vector3(x, 0, z));
      const curve = new THREE.CatmullRomCurve3(pts);
      const len = curve.getLength();
      const n = Math.floor(len / 1.35);
      for (let i = 0; i <= n; i++) {
        const p = curve.getPoint(i / n);
        const tangent = curve.getTangent(i / n);
        const nx = -tangent.z, nz = tangent.x;
        const off = (rnd() - 0.5) * 0.5;
        arr.push({
          x: p.x + nx * off, z: p.z + nz * off,
          s: 0.75 + rnd() * 0.45, ry: rnd() * 3,
          light: rnd() > 0.5,
        });
      }
    });
    return arr;
  }, []);
  return (
    <Instances range={pavers.length} limit={pavers.length} receiveShadow>
      <cylinderGeometry args={[1, 1.08, 0.14, 8]} />
      <meshStandardMaterial roughness={0.95} />
      {pavers.map((p, i) => (
        <Instance key={i} position={[p.x, 0.07, p.z]} scale={[p.s, 1, p.s * 0.9]} rotation={[0, p.ry, 0]} color={p.light ? '#dcc9a2' : '#c9b891'} />
      ))}
    </Instances>
  );
}

export function Forecourt() {
  return (
    <group position={[0, 0, -37]}>
      <RoundedBox args={[30, 0.24, 18]} radius={0.12} position={[0, 0.06, 0]} material={mat('#dcc9a2', 'stone')} receiveShadow />
      <mesh position={[0, 0.19, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.2, 5.8, 28]} />
        <meshStandardMaterial color="#c9b891" roughness={0.95} />
      </mesh>
    </group>
  );
}

export function Plaza() {
  return (
    <group position={[0, 0, 4]}>
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[5, 12.5, 36]} />
        <meshStandardMaterial color="#d3bf96" roughness={0.95} />
      </mesh>
      {/* center round flower bed */}
      <mesh material={mat(WORLD.dirt, 'stone')} position={[0, 0.18, 0]}>
        <cylinderGeometry args={[4.4, 4.6, 0.4, 24]} />
      </mesh>
      <mesh material={mat('#b5a480', 'stone')} position={[0, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[4.5, 0.28, 8, 28]} />
      </mesh>
    </group>
  );
}

// ---------- spawn pad ----------
export function SpawnPad() {
  const ring = useRef();
  const glow = useMemo(() => glowTexture('255,225,150'), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ring.current) {
      ring.current.scale.setScalar(1 + Math.sin(t * 2.2) * 0.06);
      ring.current.material.opacity = 0.75 + Math.sin(t * 2.2) * 0.2;
    }
  });
  return (
    <group position={[0, 0, -34]}>
      <mesh material={mat('#e8d8b8', 'stone')} position={[0, 0.09, 0]}>
        <cylinderGeometry args={[2.2, 2.4, 0.18, 24]} />
      </mesh>
      <mesh ref={ring} position={[0, 0.21, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 2.0, 28]} />
        <meshBasicMaterial color="#ffe9a8" transparent opacity={0.85} />
      </mesh>
      <sprite position={[0, 0.6, 0]} scale={[4, 4, 1]}>
        <spriteMaterial map={glow} transparent opacity={0.5} depthWrite={false} />
      </sprite>
    </group>
  );
}

// ---------- friendship garden ----------
function heartShape(scale = 0.16) {
  const s = new THREE.Shape();
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    const t = (i / 40) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    pts.push([x * scale, y * scale]);
  }
  s.moveTo(pts[0][0], pts[0][1]);
  pts.forEach(([x, y]) => s.lineTo(x, y));
  const hole = new THREE.Path();
  hole.moveTo(pts[0][0] * 0.72, pts[0][1] * 0.72 - 0.1);
  pts.forEach(([x, y]) => hole.lineTo(x * 0.72, y * 0.72 - 0.1));
  s.holes.push(hole);
  return s;
}

export function HeartArch() {
  const geo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(heartShape(), { depth: 0.5, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.08, bevelSegments: 3 });
    g.center();
    return g;
  }, []);
  const roses = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 16; i++) {
      const t = (i / 16) * Math.PI * 2;
      const x = 16 * Math.pow(Math.sin(t), 3) * 0.145;
      const y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 0.145;
      arr.push([x, y]);
    }
    return arr;
  }, []);
  return (
    <group position={[34, 2.6, 42]} rotation={[0, 0.35, 0]}>
      <mesh geometry={geo} material={mat('#c94f6d', 'plastic')} castShadow />
      {roses.map(([x, y], i) => (
        <mesh key={i} material={mat(i % 3 === 0 ? ACCENT.pink : '#e84a5f', 'plastic')} position={[x, y, 0.3]}>
          <sphereGeometry args={[0.16, 8, 6]} />
        </mesh>
      ))}
      {/* leaves */}
      {roses.filter((_, i) => i % 2).map(([x, y], i) => (
        <mesh key={'l' + i} material={mat(WORLD.leafDark, 'leaf')} position={[x, y, -0.28]}>
          <sphereGeometry args={[0.13, 6, 5]} />
        </mesh>
      ))}
    </group>
  );
}

function Pond({ pos, r }) {
  return (
    <group position={[pos[0], 0, pos[1]]}>
      <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[r, 22]} />
        <meshStandardMaterial color={WORLD.water} transparent opacity={0.9} roughness={0.15} />
      </mesh>
      <mesh material={mat('#b5a480', 'stone')} position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[r, 0.24, 8, 22]} />
      </mesh>
      {[[-r * 0.4, r * 0.3], [r * 0.35, -r * 0.2]].map(([x, z], i) => (
        <mesh key={i} material={mat('#5cad46', 'leaf')} position={[x, 0.16, z]}>
          <cylinderGeometry args={[0.4, 0.4, 0.05, 10]} />
        </mesh>
      ))}
    </group>
  );
}

export function FriendshipGarden() {
  return (
    <group>
      <HeartArch />
      <Pond pos={[26, 58]} r={3.6} />
      <Pond pos={[44, 56]} r={2.6} />
      {/* rose bed (interactable flowerbed-garden lives at 27,47 — flowers drawn by Flowers()) */}
      <mesh material={mat(WORLD.dirt, 'stone')} position={[27, 0.12, 47]}>
        <cylinderGeometry args={[3.2, 3.4, 0.26, 18]} />
      </mesh>
      {/* log stools */}
      {[[36, 62], [22, 52], [46, 48]].map(([x, z], i) => (
        <mesh key={i} material={mat('#9a6a38', 'wood')} position={[x, 0.3, z]} castShadow>
          <cylinderGeometry args={[0.5, 0.55, 0.6, 10]} />
        </mesh>
      ))}
      {/* low picket fence arcs */}
      {Array.from({ length: 14 }, (_, i) => {
        const a = -0.6 + (i / 14) * 2.4;
        return (
          <mesh key={'f' + i} material={mat('#c9a86a', 'wood')} position={[35 + Math.cos(a) * 17, 0.4, 52 + Math.sin(a) * 14]} castShadow>
            <boxGeometry args={[0.14, 0.8, 0.4]} />
          </mesh>
        );
      })}
    </group>
  );
}

// ---------- garden plot ----------
export function GardenPlot() {
  const state = useGame((s) => s.world.plot);
  return (
    <group position={[23, 0, 40]}>
      {/* wood frame */}
      {[[0, -1.3, 0], [0, 1.3, 0], [-1.8, 0, Math.PI / 2], [1.8, 0, Math.PI / 2]].map(([x, z, ry], i) => (
        <mesh key={i} material={mat('#9a6a38', 'wood')} position={[x, 0.22, z]} rotation={[0, ry || 0, 0]} castShadow>
          <boxGeometry args={[ry ? 2.8 : 3.9, 0.44, 0.22]} />
        </mesh>
      ))}
      <mesh material={mat(WORLD.dirt, 'stone')} position={[0, 0.14, 0]}>
        <boxGeometry args={[3.5, 0.28, 2.4]} />
      </mesh>
      {state !== 'empty' &&
        [[-1.2, -0.6], [-0.4, 0.5], [0.5, -0.5], [1.2, 0.55], [0, 0]].map(([x, z], i) => (
          <group key={i} position={[x, 0.3, z]}>
            {state === 'sprouts' ? (
              <mesh material={mat('#5cad46', 'leaf')}>
                <coneGeometry args={[0.09, 0.3, 6]} />
              </mesh>
            ) : (
              <>
                <mesh material={mat('#5cad46', 'leaf')} position={[0, 0.22, 0]}>
                  <sphereGeometry args={[0.16, 6, 5]} />
                </mesh>
                <mesh material={mat('#e8762e', 'plastic')} rotation={[Math.PI, 0, 0]}>
                  <coneGeometry args={[0.11, 0.3, 8]} />
                </mesh>
              </>
            )}
          </group>
        ))}
      {/* little watering can prop */}
      <group position={[2.4, 0.16, 0.8]} rotation={[0, -0.7, 0]}>
        <mesh material={mat('#4aa3e8', 'plastic')}>
          <cylinderGeometry args={[0.22, 0.26, 0.34, 10]} />
        </mesh>
        <mesh material={mat('#4aa3e8', 'plastic')} position={[0.28, 0.06, 0]} rotation={[0, 0, -0.9]}>
          <coneGeometry args={[0.07, 0.36, 8]} />
        </mesh>
      </group>
    </group>
  );
}

// ---------- play meadow ----------
// kiddie slide placement + the ride paths the player follows on "Slide"
export const KIDDIE_SLIDE_POS = [-52, 38];
const KIDDIE_RY = 0.5;
const kl = (x, y, z) => {
  const c = Math.cos(KIDDIE_RY), s = Math.sin(KIDDIE_RY);
  return new THREE.Vector3(KIDDIE_SLIDE_POS[0] + x * c + z * s, y, KIDDIE_SLIDE_POS[1] - x * s + z * c);
};
export const KIDDIE_CLIMB_CURVE = new THREE.CatmullRomCurve3([
  kl(0, 0, -2.6), kl(0, 0.7, -1.7), kl(0, 1.6, -1.25), kl(0, 2.3, -0.6), kl(0, 2.6, 0.2),
]);
export const KIDDIE_SLIDE_CURVE = new THREE.CatmullRomCurve3([
  kl(0, 2.6, 0.4), kl(0, 2.1, 1.1), kl(0, 1.3, 2.2), kl(0, 0.6, 3.1), kl(0, 0.12, 4.3),
]);

export function Playground() {
  const swing = useRef();
  useFrame(({ clock }) => {
    if (swing.current) swing.current.rotation.x = Math.sin(clock.elapsedTime * 1.3) * 0.18;
  });
  const ballTex = useMemo(() => {
    const t = stripeTexture([ACCENT.red, '#ffffff', ACCENT.blue, '#ffffff', ACCENT.yellow, '#ffffff'], 6, true);
    return t;
  }, []);
  return (
    <group>
      {/* kiddie slide */}
      <group position={[KIDDIE_SLIDE_POS[0], 0, KIDDIE_SLIDE_POS[1]]} rotation={[0, KIDDIE_RY, 0]}>
        <RoundedBox args={[1.6, 2.2, 1.6]} radius={0.15} position={[0, 1.1, 0]} material={mat(ACCENT.yellow, 'plastic')} castShadow />
        <mesh material={mat('#3D8BFD', 'plastic')} position={[0, 1.55, 1.85]} rotation={[0.62, 0, 0]} castShadow>
          <boxGeometry args={[1.2, 0.12, 3.4]} />
        </mesh>
        {[-0.62, 0.62].map((x, i) => (
          <mesh key={i} material={mat('#2f6fd0', 'plastic')} position={[x, 1.72, 1.85]} rotation={[0.62, 0, 0]}>
            <boxGeometry args={[0.12, 0.3, 3.4]} />
          </mesh>
        ))}
        {/* ladder */}
        {[0, 1, 2].map((i) => (
          <mesh key={'r' + i} material={mat('#e8e0d0', 'plastic')} position={[0, 0.5 + i * 0.55, -1.1 - i * 0.12]} rotation={[0.25, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 1.0, 6]} />
          </mesh>
        ))}
      </group>
      {/* swing set */}
      <group position={[-42, 0, 48]} rotation={[0, -0.3, 0]}>
        {[-1.6, 1.6].map((x, i) => (
          <group key={i} position={[x, 0, 0]}>
            <mesh material={mat('#9a6a38', 'wood')} position={[0, 1.4, -0.7]} rotation={[0.4, 0, 0]} castShadow>
              <cylinderGeometry args={[0.09, 0.11, 3.1, 8]} />
            </mesh>
            <mesh material={mat('#9a6a38', 'wood')} position={[0, 1.4, 0.7]} rotation={[-0.4, 0, 0]} castShadow>
              <cylinderGeometry args={[0.09, 0.11, 3.1, 8]} />
            </mesh>
          </group>
        ))}
        <mesh material={mat('#8a5a2e', 'wood')} position={[0, 2.75, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, 3.6, 8]} />
        </mesh>
        <group ref={swing} position={[0, 2.7, 0]}>
          {[-0.5, 0.5].map((x, i) => (
            <group key={i} position={[x, 0, 0]}>
              <mesh material={mat('#d9c49a', 'plastic')} position={[-0.18, -1, 0]}>
                <cylinderGeometry args={[0.025, 0.025, 2, 5]} />
              </mesh>
              <mesh material={mat('#d9c49a', 'plastic')} position={[0.18, -1, 0]}>
                <cylinderGeometry args={[0.025, 0.025, 2, 5]} />
              </mesh>
              <mesh material={mat(ACCENT.red, 'plastic')} position={[0, -2.02, 0]}>
                <boxGeometry args={[0.55, 0.08, 0.3]} />
              </mesh>
            </group>
          ))}
        </group>
      </group>
      {/* beach ball */}
      <mesh position={[-48, 0.55, 32]} rotation={[0.4, 0.8, 0]} castShadow>
        <sphereGeometry args={[0.55, 16, 12]} />
        <meshStandardMaterial map={ballTex} roughness={0.3} />
      </mesh>
      {/* meadow fence along stream side */}
      {Array.from({ length: 10 }, (_, i) => (
        <group key={i} position={[-64 + Math.sin(i * 0.4) * 1.5, 0, 30 + i * 3.4]}>
          <mesh material={mat('#c9a86a', 'wood')} position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.08, 0.09, 1, 6]} />
          </mesh>
          <mesh material={mat('#c9a86a', 'wood')} position={[0, 0.72, 1.6]} rotation={[Math.PI / 2 - 0.1, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 3.2, 5]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ---------- snack stand ----------
export function SnackStand() {
  const awningTex = useMemo(() => {
    const t = stripeTexture([ACCENT.red, '#ffffff'], 8, true);
    return t;
  }, []);
  const menuTex = useMemo(() => menuBoardTexture(), []);
  const signTex = useMemo(() => textTexture('SNACKS', { w: 256, h: 80, bg: '#8B5A2B', fg: '#FFF3D6', font: 'bold 46px "Baloo 2", sans-serif', radius: 18 }), []);
  return (
    <group position={[46, 0, 26]} rotation={[0, -Math.PI / 2, 0]}>
      {/* counter + booth */}
      <RoundedBox args={[5, 1.2, 1.6]} radius={0.12} position={[0, 0.6, 1.4]} material={mat(WORLD.woodLight, 'wood')} castShadow />
      <RoundedBox args={[5.4, 0.16, 2]} radius={0.06} position={[0, 1.26, 1.4]} material={mat('#9a6a38', 'wood')} />
      <RoundedBox args={[5, 3.2, 1.8]} radius={0.2} position={[0, 1.6, -0.8]} material={mat('#b07a42', 'wood')} castShadow />
      {/* posts + awning */}
      {[-2.4, 2.4].map((x, i) => (
        <mesh key={i} material={mat('#8a5a2e', 'wood')} position={[x, 1.8, 2]} castShadow>
          <cylinderGeometry args={[0.09, 0.11, 3.6, 8]} />
        </mesh>
      ))}
      <mesh position={[0, 3.75, 1.1]} rotation={[Math.PI / 2 + 0.35, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[2.1, 2.1, 5.6, 16, 1, true, 0, Math.PI * 0.75]} />
        <meshStandardMaterial map={awningTex} side={THREE.DoubleSide} roughness={0.7} />
      </mesh>
      {/* donut sign */}
      <group position={[0, 4.9, -0.5]}>
        <mesh material={mat('#8a5a2e', 'wood')} position={[0, -0.7, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 1.4, 6]} />
        </mesh>
        <mesh material={mat('#f5b8d0', 'gloss')} castShadow>
          <torusGeometry args={[0.75, 0.32, 10, 20]} />
        </mesh>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} material={mat([ACCENT.blue, ACCENT.yellow, ACCENT.green, '#ffffff'][i % 4], 'gloss')} position={[Math.cos(a) * 0.75, Math.sin(a) * 0.75, 0.28]} rotation={[0, 0, a]}>
              <capsuleGeometry args={[0.03, 0.1, 4, 6]} />
            </mesh>
          );
        })}
      </group>
      {/* SNACKS plaque */}
      <mesh position={[0, 3.2, 0.15]}>
        <planeGeometry args={[2.2, 0.7]} />
        <meshStandardMaterial map={signTex} transparent roughness={0.8} />
      </mesh>
      {/* menu board */}
      <group position={[3.4, 0, 2.6]} rotation={[0, -0.4, 0]}>
        <mesh material={mat('#6b4423', 'wood')} position={[0, 1.15, 0]} castShadow>
          <boxGeometry args={[1.5, 1.9, 0.12]} />
        </mesh>
        <mesh position={[0, 1.15, 0.08]}>
          <planeGeometry args={[1.35, 1.7]} />
          <meshBasicMaterial map={menuTex} />
        </mesh>
      </group>
      {/* popcorn machine */}
      <group position={[-1.6, 1.7, 1.3]}>
        <RoundedBox args={[0.8, 0.8, 0.7]} radius={0.06} material={mat(ACCENT.red, 'plastic')} />
        <mesh material={mat('#cfe9f5', 'gloss', { transparent: true, opacity: 0.7 })} position={[0, 0.62, 0]}>
          <boxGeometry args={[0.7, 0.5, 0.6]} />
        </mesh>
        {[[-0.1, 0.55, 0.1], [0.12, 0.6, -0.05], [0, 0.52, 0]].map(([x, y, z], i) => (
          <mesh key={i} material={mat('#fff6e5', 'plastic')} position={[x, y, z]}>
            <sphereGeometry args={[0.08, 6, 5]} />
          </mesh>
        ))}
      </group>
      {/* umbrella table */}
      <group position={[-1.5, 0, 5]}>
        <mesh material={mat('#fff6e5', 'plastic')} position={[0, 0.75, 0]}>
          <cylinderGeometry args={[0.75, 0.75, 0.08, 14]} />
        </mesh>
        <mesh material={mat('#c9b48a', 'wood')} position={[0, 0.38, 0]}>
          <cylinderGeometry args={[0.07, 0.1, 0.75, 8]} />
        </mesh>
        <mesh material={mat('#e8e0d0', 'plastic')} position={[0, 1.8, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 2.2, 6]} />
        </mesh>
        <mesh material={mat('#f5b8d0', 'plastic')} position={[0, 2.7, 0]} castShadow>
          <coneGeometry args={[1.3, 0.6, 10]} />
        </mesh>
        {[[-1, 0.3], [0.9, -0.4], [0.3, 1]].map(([x, z], i) => (
          <mesh key={i} material={mat(WORLD.woodLight, 'wood')} position={[x, 0.26, z]}>
            <cylinderGeometry args={[0.26, 0.3, 0.52, 8]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ---------- props ----------
export function LampPost({ pos, id }) {
  const decorated = useGame((s) => s.world.lampDecorated);
  const poke = useGame((s) => (id ? s.world.objAnim[id] : null));
  const bulb = useRef();
  const glow = useMemo(() => glowTexture(), []);
  useFrame(() => {
    if (!bulb.current) return;
    let i = 1.5;
    if (poke) {
      const dt = now() - poke.t0;
      if (dt < 1) i = 1.5 + Math.sin(dt * 40) * 1.2;
    }
    bulb.current.material.emissiveIntensity = i;
  });
  return (
    <group position={[pos[0], 0, pos[1]]}>
      <mesh material={mat('#3f5240', 'plastic')} position={[0, 2.1, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 4.2, 8]} />
      </mesh>
      <mesh material={mat('#3f5240', 'plastic')} position={[0, 4.25, 0]}>
        <cylinderGeometry args={[0.3, 0.18, 0.5, 8]} />
      </mesh>
      <mesh ref={bulb} material={mat('#ffdf8e', 'glow', { emissive: '#ffca5f', emissiveIntensity: 1.5 })} position={[0, 4.1, 0]}>
        <sphereGeometry args={[0.22, 10, 8]} />
      </mesh>
      <sprite position={[0, 4.1, 0]} scale={[1.8, 1.8, 1]}>
        <spriteMaterial map={glow} transparent opacity={0.55} depthWrite={false} />
      </sprite>
      {decorated && id && (
        <mesh material={mat(ACCENT.pink, 'plastic')} position={[0, 3.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.22, 0.07, 6, 12]} />
        </mesh>
      )}
    </group>
  );
}

export function Mailbox() {
  const hasGift = useGame((s) => s.world.mailboxGift);
  const poke = useGame((s) => s.world.objAnim.mailbox);
  const box = useRef();
  useFrame(({ clock }) => {
    if (!box.current) return;
    let rz = 0;
    const t = clock.elapsedTime;
    if (hasGift && Math.sin(t * 0.7) > 0.92) rz = Math.sin(t * 30) * 0.07; // periodic wiggle
    if (poke) {
      const dt = now() - poke.t0;
      if (dt < 0.9) rz = Math.sin(dt * 28) * 0.16;
    }
    box.current.rotation.z = rz;
  });
  return (
    <group position={[8, 0, 26]} rotation={[0, -0.5, 0]}>
      <mesh material={mat('#8a5a2e', 'wood')} position={[0, 0.85, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.11, 1.7, 8]} />
      </mesh>
      <group ref={box} position={[0, 1.8, 0]}>
        <RoundedBox args={[0.95, 0.85, 1.35]} radius={0.18} material={mat(ACCENT.red, 'plastic')} castShadow />
        <RoundedBox args={[0.7, 0.5, 0.06]} radius={0.08} position={[0, -0.02, 0.68]} material={mat('#c73535', 'plastic')} />
        {/* star badge */}
        <mesh material={mat(ACCENT.yellow, 'gloss')} position={[0, 0.12, 0.72]}>
          <circleGeometry args={[0.14, 5]} />
        </mesh>
        {/* flag */}
        <group position={[0.52, 0.1, -0.2]} rotation={[0, 0, hasGift ? 0.2 : 1.4]}>
          <mesh material={mat(ACCENT.yellow, 'plastic')} position={[0, 0.3, 0]}>
            <boxGeometry args={[0.06, 0.6, 0.06]} />
          </mesh>
          <mesh material={mat(ACCENT.yellow, 'plastic')} position={[0, 0.55, 0.12]}>
            <boxGeometry args={[0.05, 0.2, 0.3]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export function Bench({ pos, ry = 0, id, color = '#7da05a' }) {
  const decorated = useGame((s) => !!s.world.benchDecorated[id]);
  return (
    <group position={[pos[0], 0, pos[1]]} rotation={[0, ry, 0]}>
      {[[-0.8], [0.8]].map(([x], i) => (
        <mesh key={i} material={mat('#5a6b4a', 'plastic')} position={[x, 0.28, 0]} castShadow>
          <boxGeometry args={[0.12, 0.56, 0.6]} />
        </mesh>
      ))}
      {[0, 1, 2].map((i) => (
        <mesh key={'s' + i} material={mat(color, 'wood')} position={[0, 0.58, -0.2 + i * 0.22]} castShadow>
          <boxGeometry args={[2, 0.08, 0.18]} />
        </mesh>
      ))}
      {[0, 1].map((i) => (
        <mesh key={'b' + i} material={mat(color, 'wood')} position={[0, 0.95 + i * 0.24, -0.32]} rotation={[-0.15, 0, 0]}>
          <boxGeometry args={[2, 0.14, 0.07]} />
        </mesh>
      ))}
      {decorated && (
        <group position={[0, 1.25, -0.3]}>
          {[-0.7, -0.25, 0.25, 0.7].map((x, i) => (
            <mesh key={i} material={mat([ACCENT.pink, ACCENT.yellow, '#ffffff'][i % 3], 'plastic')} position={[x, Math.abs(x) * -0.15, 0]}>
              <sphereGeometry args={[0.09, 6, 5]} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

export function GlowingMushroom() {
  const capRef = useRef();
  const poke = useGame((s) => s.world.objAnim.mushroom);
  const glow = useMemo(() => glowTexture('255,160,140'), []);
  useFrame(({ clock }) => {
    if (!capRef.current) return;
    let s = 1 + Math.sin(clock.elapsedTime * 2) * 0.04;
    if (poke) {
      const dt = now() - poke.t0;
      if (dt < 0.6) s += Math.sin(dt * 20) * 0.15;
    }
    capRef.current.scale.setScalar(s);
  });
  return (
    <group position={[-4, 0, 52]}>
      <mesh material={mat('#f3e4c2', 'plastic')} position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.18, 0.26, 0.7, 10]} />
      </mesh>
      <group ref={capRef} position={[0, 0.75, 0]}>
        <mesh material={mat('#e85d4a', 'glow', { emissive: '#ff7a5c', emissiveIntensity: 0.8 })} castShadow>
          <sphereGeometry args={[0.55, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        </mesh>
        {[[0.25, 0.3, 0.2], [-0.3, 0.25, 0.1], [0, 0.42, -0.25]].map(([x, y, z], i) => (
          <mesh key={i} material={mat('#fff6e5', 'plastic')} position={[x, y, z]}>
            <sphereGeometry args={[0.08, 6, 5]} />
          </mesh>
        ))}
      </group>
      <sprite position={[0, 0.9, 0]} scale={[2.4, 2.4, 1]}>
        <spriteMaterial map={glow} transparent opacity={0.4} depthWrite={false} />
      </sprite>
    </group>
  );
}

export function PathSigns() {
  return (
    <group>
      <group position={[4, 0, 18]}>
        <mesh material={mat(WORLD.wood, 'wood')} position={[0, 1.3, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.12, 2.6, 8]} />
        </mesh>
        <SignArrow label="Garden" y={2.3} color="#a56a35" />
        <SignArrow label="Slide" y={1.75} flip color="#5f8fc9" />
        <SignArrow label="Snacks" y={1.2} color="#a56a35" />
      </group>
      <group position={[38, 0, -6]} rotation={[0, 0.6, 0]}>
        <mesh material={mat(WORLD.wood, 'wood')} position={[0, 1.2, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.12, 2.4, 8]} />
        </mesh>
        <SignArrow label="Pool" y={1.9} color="#5f8fc9" />
        <SignArrow label="Games" y={1.35} color="#7b5cc9" />
      </group>
    </group>
  );
}

// ---------- sparkles over interactables ----------
export function Sparkle({ pos, y = 1.5, scale = 1, hiddenUntil = 0 }) {
  const ref = useRef();
  const tex = useMemo(() => sparkleTexture(), []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    const hidden = hiddenUntil > now();
    ref.current.visible = !hidden;
    ref.current.material.opacity = 0.55 + Math.sin(t * 3 + pos[0]) * 0.3;
    ref.current.scale.setScalar(scale * (0.8 + Math.sin(t * 2.2 + pos[1]) * 0.15));
    ref.current.position.y = y + Math.sin(t * 1.6 + pos[0] * 2) * 0.12;
  });
  return (
    <group position={[pos[0], 0, pos[1]]}>
      <sprite ref={ref} position={[0, y, 0]}>
        <spriteMaterial map={tex} transparent depthWrite={false} />
      </sprite>
    </group>
  );
}
