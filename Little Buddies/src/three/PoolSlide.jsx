// Pool lagoon + the signature candy-striped rooftop water slide.
import * as THREE from 'three';
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { WORLD, ACCENT } from '../data/palette.js';
import { mat, stripeTexture } from './materials.js';
import { useGame } from '../state/store.js';

export const POOL_CENTER = [52, -16];
const POOL_RX = 15.5, POOL_RZ = 12;

const poolR = (a) => 1 + 0.16 * Math.sin(2 * a + 1) + 0.1 * Math.sin(3 * a + 2.2);

export function isInPool(x, z) {
  const dx = (x - POOL_CENTER[0]) / POOL_RX;
  const dz = (z - POOL_CENTER[1]) / POOL_RZ;
  const a = Math.atan2(dz, dx);
  return Math.hypot(dx, dz) < poolR(a) * 0.94;
}

// The slide ride path (world coords). Player follows this on "Ride".
export const SLIDE_CURVE = new THREE.CatmullRomCurve3([
  new THREE.Vector3(8, 19.6, -58),
  new THREE.Vector3(18, 16.8, -52),
  new THREE.Vector3(30, 12.2, -42),
  new THREE.Vector3(42, 7.6, -32),
  new THREE.Vector3(50, 3.6, -24),
  new THREE.Vector3(48, 1.0, -17.5),
]);

// The staircase climb path used before the ride (approx up the grand stairs).
export const CLIMB_PATH = [
  [-26, 0.5, -46], [-29, 3, -50], [-32, 5.6, -55], [-33, 8.5, -62],
  [-30, 12, -68], [-20, 16, -70], [-10, 18.6, -66], [2, 18.8, -60], [8, 19.6, -58],
];

function poolShape() {
  const s = new THREE.Shape();
  const N = 42;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const r = poolR(a);
    const x = Math.cos(a) * r * POOL_RX;
    const y = Math.sin(a) * r * POOL_RZ;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  return s;
}

function Water() {
  const ref = useRef();
  const geo = useMemo(() => new THREE.ShapeGeometry(poolShape(), 4), []);
  const geoInner = useMemo(() => {
    const g = new THREE.ShapeGeometry(poolShape(), 4);
    g.scale(0.86, 0.86, 1);
    return g;
  }, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ref.current) {
      ref.current.scale.setScalar(1 + Math.sin(t * 1.4) * 0.008);
      ref.current.material.opacity = 0.75 + Math.sin(t * 2.1) * 0.06;
    }
  });
  return (
    <group position={[POOL_CENTER[0], 0, POOL_CENTER[1]]}>
      <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.14, 0]}>
        <meshStandardMaterial color={WORLD.water} roughness={0.15} metalness={0.05} transparent opacity={0.92} />
      </mesh>
      <mesh ref={ref} geometry={geoInner} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.18, 0]}>
        <meshStandardMaterial color="#7fd0f2" roughness={0.1} transparent opacity={0.75} />
      </mesh>
      {/* sandy pool apron */}
      <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} scale={[1.16, 1.16, 1]} receiveShadow>
        <meshStandardMaterial color={WORLD.sand} roughness={0.95} />
      </mesh>
    </group>
  );
}

function BoulderRing() {
  const boulders = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2 + 0.13;
      const r = poolR(a) * 1.06;
      arr.push({
        x: POOL_CENTER[0] + Math.cos(a) * r * POOL_RX,
        z: POOL_CENTER[1] + Math.sin(a) * r * POOL_RZ,
        s: 0.7 + ((i * 37) % 10) / 12,
        ry: i * 1.7,
      });
    }
    return arr;
  }, []);
  return boulders.map((b, i) => (
    <mesh key={i} material={mat('#a8a29a', 'stone')} position={[b.x, 0.25 * b.s, b.z]} scale={[b.s, b.s * 0.7, b.s * 0.85]} rotation={[0, b.ry, 0]} castShadow>
      <sphereGeometry args={[1.1, 10, 8]} />
    </mesh>
  ));
}

export function Float({ id, kind, pos, bobPhase = 0 }) {
  const ref = useRef();
  const poke = useGame((s) => s.world.objAnim[id]);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime + bobPhase;
    let y = 0.22 + Math.sin(t * 1.7) * 0.06;
    let rz = Math.sin(t * 1.2) * 0.05;
    if (poke) {
      const dt = performance.now() / 1000 - poke.t0;
      if (dt < 0.8) { rz += Math.sin(dt * 25) * 0.2; y += Math.abs(Math.sin(dt * 20)) * 0.08; }
    }
    ref.current.position.y = y;
    ref.current.rotation.z = rz;
    ref.current.rotation.x = Math.sin(t * 1.05) * 0.04;
  });
  return (
    <group position={[pos[0], 0, pos[1]]}>
      <group ref={ref}>
        <FloatMesh kind={kind} />
      </group>
    </group>
  );
}

function FloatMesh({ kind }) {
  switch (kind) {
    case 'duck':
      return (
        <group>
          <mesh material={mat(ACCENT.yellow, 'gloss')} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.95, 0.38, 12, 24]} />
          </mesh>
          <mesh material={mat(ACCENT.yellow, 'gloss')} position={[0, 0.55, -0.95]}>
            <sphereGeometry args={[0.42, 14, 12]} />
          </mesh>
          <mesh material={mat('#F5883C', 'gloss')} position={[0, 0.5, -1.35]} rotation={[1.8, 0, 0]}>
            <coneGeometry args={[0.14, 0.3, 8]} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} material={mat('#181818', 'gloss')} position={[s * 0.17, 0.68, -1.22]}>
              <sphereGeometry args={[0.05, 6, 6]} />
            </mesh>
          ))}
        </group>
      );
    case 'star':
      return (
        <mesh material={mat(ACCENT.red, 'gloss')} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.9, 0.36, 10, 5]} />
        </mesh>
      );
    case 'blob':
      return (
        <group>
          <mesh material={mat(ACCENT.green, 'gloss')} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.9, 0.36, 12, 24]} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} material={mat('#181818', 'gloss')} position={[s * 0.28, 0.28, -0.85]}>
              <sphereGeometry args={[0.09, 8, 6]} />
            </mesh>
          ))}
        </group>
      );
    default: // donut
      return (
        <group>
          <mesh material={mat('#f5b8d0', 'gloss')} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.9, 0.38, 12, 24]} />
          </mesh>
          {Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2;
            return (
              <mesh key={i} material={mat([ACCENT.blue, ACCENT.yellow, ACCENT.green, '#ffffff'][i % 4], 'gloss')} position={[Math.cos(a) * 0.9, 0.36, Math.sin(a) * 0.9]} rotation={[0, a, 1]}>
                <capsuleGeometry args={[0.035, 0.12, 4, 6]} />
              </mesh>
            );
          })}
        </group>
      );
  }
}

function PalmTree({ pos, lean = 0.12 }) {
  return (
    <group position={pos} rotation={[0, pos[0] * 0.7, lean]}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} material={mat('#9a6a38', 'wood')} position={[Math.sin(i * 0.25) * 0.35, 0.6 + i * 1.15, 0]} rotation={[0, 0, i * 0.09]} castShadow>
          <cylinderGeometry args={[0.22 - i * 0.03, 0.27 - i * 0.03, 1.25, 8]} />
        </mesh>
      ))}
      <group position={[Math.sin(0.75) * 0.5, 5.2, 0]}>
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <mesh key={i} material={mat(WORLD.leafDark, 'leaf')} position={[Math.cos(a) * 0.9, 0.1, Math.sin(a) * 0.9]} rotation={[Math.sin(a) * 0.55, -a, Math.cos(a) * 0.55]} castShadow>
              <sphereGeometry args={[0.95, 8, 6]} />
            </mesh>
          );
        })}
        <mesh material={mat('#6FBF4A', 'leaf')} position={[0, 0.3, 0]}>
          <sphereGeometry args={[0.5, 8, 6]} />
        </mesh>
      </group>
    </group>
  );
}

function Lounger({ pos, ry, color }) {
  return (
    <group position={[pos[0], 0, pos[1]]} rotation={[0, ry, 0]}>
      <mesh material={mat(color, 'plastic')} position={[0, 0.45, 0.5]} rotation={[-0.5, 0, 0]} castShadow>
        <boxGeometry args={[1.1, 0.14, 1.2]} />
      </mesh>
      <mesh material={mat(color, 'plastic')} position={[0, 0.32, -0.5]} castShadow>
        <boxGeometry args={[1.1, 0.14, 1.3]} />
      </mesh>
      {[[-0.45, -1], [0.45, -1], [-0.45, 0], [0.45, 0]].map(([x, z], i) => (
        <mesh key={i} material={mat('#e8e0d0', 'plastic')} position={[x, 0.14, z]}>
          <cylinderGeometry args={[0.05, 0.05, 0.28, 6]} />
        </mesh>
      ))}
    </group>
  );
}

function Slide() {
  const stripeMat = useMemo(() => {
    const tex = stripeTexture(['#3D8BFD', '#FFFFFF'], 2, true);
    tex.repeat.set(16, 1);
    return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.22, metalness: 0.04 });
  }, []);
  const tube = useMemo(() => new THREE.TubeGeometry(SLIDE_CURVE, 90, 1.05, 14), []);
  const waterStrip = useMemo(() => new THREE.TubeGeometry(SLIDE_CURVE, 90, 0.55, 8), []);
  const poles = useMemo(() => [0.28, 0.52, 0.76].map((t) => SLIDE_CURVE.getPoint(t)), []);
  return (
    <group>
      <mesh geometry={tube} material={stripeMat} castShadow />
      {/* water sheen running down the open top */}
      <mesh geometry={waterStrip} position={[0, 0.55, 0]}>
        <meshStandardMaterial color="#9fdcf7" transparent opacity={0.5} roughness={0.1} />
      </mesh>
      {poles.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]}>
          <mesh material={mat('#9a6a38', 'wood')} position={[0, p.y / 2 - 0.6, 0]} castShadow>
            <cylinderGeometry args={[0.32, 0.4, p.y - 1.2, 10]} />
          </mesh>
          <mesh material={mat('#8a5a2e', 'wood')} position={[0, p.y - 1.7, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.14, 0.14, 3.2, 8]} />
          </mesh>
        </group>
      ))}
      {/* splashdown foam */}
      <SplashFoam />
    </group>
  );
}

function SplashFoam() {
  const ref = useRef();
  const end = useMemo(() => SLIDE_CURVE.getPoint(1), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ref.current) {
      ref.current.scale.setScalar(1 + Math.sin(t * 3) * 0.12);
      ref.current.rotation.y = t * 0.4;
    }
  });
  return (
    <group position={[end.x, 0.22, end.z]}>
      <group ref={ref}>
        {Array.from({ length: 7 }, (_, i) => {
          const a = (i / 7) * Math.PI * 2;
          return (
            <mesh key={i} material={mat('#ffffff', 'plastic')} position={[Math.cos(a) * 1.5, 0, Math.sin(a) * 1.5]} scale={[1, 0.5, 1]}>
              <sphereGeometry args={[0.42, 8, 6]} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

function LifeRingPost({ pos }) {
  return (
    <group position={[pos[0], 0, pos[1]]}>
      <mesh material={mat(WORLD.wood, 'wood')} position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.11, 2.2, 8]} />
      </mesh>
      <mesh material={mat('#F5883C', 'gloss')} position={[0, 1.55, 0.12]}>
        <torusGeometry args={[0.4, 0.13, 8, 18]} />
      </mesh>
    </group>
  );
}

// small rock waterfalls feeding the pool on its NE edge
function PoolFalls() {
  const flow = useRef();
  useFrame(({ clock }) => {
    if (flow.current) flow.current.position.y = 1.1 - (clock.elapsedTime % 0.5) * 0.2;
  });
  return (
    <group position={[62, 0, -26]}>
      {[[-1, 0.9], [0.6, 1.3], [2, 0.8], [-2.2, 0.7]].map(([x, s], i) => (
        <mesh key={i} material={mat('#a8a29a', 'stone')} position={[x, s * 0.8, 0]} scale={[s, s * 0.9, s]} castShadow>
          <sphereGeometry args={[1.2, 10, 8]} />
        </mesh>
      ))}
      <mesh position={[0.2, 0.9, 0.9]} rotation={[-0.25, 0, 0]}>
        <planeGeometry args={[1.8, 1.6]} />
        <meshStandardMaterial color="#9fdcf7" transparent opacity={0.75} roughness={0.1} />
      </mesh>
      <mesh position={[0.2, 0.25, 1.6]} scale={[1, 0.4, 1]}>
        <sphereGeometry args={[0.7, 8, 6]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
    </group>
  );
}

export function PoolAndSlide() {
  return (
    <group>
      <Water />
      <BoulderRing />
      <Slide />
      <PoolFalls />
      <Float id="float-duck" kind="duck" pos={[46, -13]} />
      <Float id="float-donut" kind="donut" pos={[58, -26]} bobPhase={2} />
      <PalmTree pos={[66, 0, -12]} />
      <PalmTree pos={[40, 0, -30]} lean={-0.1} />
      <PalmTree pos={[64, 0, -30]} lean={0.18} />
      <Lounger pos={[44, -2]} ry={-0.5} color="#f3ddb0" />
      <Lounger pos={[49, 0]} ry={-0.2} color={ACCENT.orange} />
      <LifeRingPost pos={[38, -8]} />
    </group>
  );
}
