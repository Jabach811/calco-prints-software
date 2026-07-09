// Terrain, waterfall + stream, instanced foliage, clouds, butterflies.
import * as THREE from 'three';
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instances, Instance } from '@react-three/drei';
import { WORLD, ACCENT } from '../data/palette.js';
import { mat, waterStreakTexture } from './materials.js';

const rand = (seed) => {
  // deterministic pseudo-random
  let s = seed;
  return () => {
    s = (s * 16807 + 11) % 2147483647;
    return (s % 10000) / 10000;
  };
};

export function Ground() {
  return (
    <group>
      <mesh position={[0, -1.6, 0]} receiveShadow>
        <cylinderGeometry args={[112, 122, 3.2, 56]} />
        <meshStandardMaterial color={WORLD.grass} roughness={0.9} />
      </mesh>
      {/* meadow: lighter lawn */}
      <mesh position={[-48, 0.02, 42]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[22, 28]} />
        <meshStandardMaterial color={WORLD.grassLight} roughness={0.9} />
      </mesh>
      {/* garden: warm lawn */}
      <mesh position={[35, 0.02, 51]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[20, 28]} />
        <meshStandardMaterial color="#88c95c" roughness={0.9} />
      </mesh>
      {/* forest hills back edge */}
      {[[-40, -85, 24], [20, -92, 30], [-80, -55, 20], [70, -75, 22], [-95, -10, 16]].map(([x, z, r], i) => (
        <mesh key={i} material={mat('#79b356', 'leaf')} position={[x, -r * 0.72, z]} receiveShadow>
          <sphereGeometry args={[r, 18, 12]} />
        </mesh>
      ))}
    </group>
  );
}

// ---------- instanced foliage ----------
export function Pines() {
  const spots = useMemo(() => {
    const r = rand(7);
    const arr = [];
    const clusters = [
      [-60, -70, 14, 8], [-30, -80, 16, 7], [30, -75, 14, 6], [65, -55, 12, 5],
      [80, -20, 10, 4], [75, 30, 12, 5], [-85, 25, 10, 5], [-70, 60, 12, 5],
      [-20, 75, 14, 5], [40, 75, 12, 5], [70, 55, 10, 4], [-90, -30, 10, 4],
    ];
    clusters.forEach(([cx, cz, cr, n]) => {
      for (let i = 0; i < n; i++) {
        arr.push({ x: cx + (r() - 0.5) * cr * 2, z: cz + (r() - 0.5) * cr * 2, s: 0.8 + r() * 0.9 });
      }
    });
    return arr;
  }, []);
  return (
    <group>
      <Instances range={spots.length} limit={spots.length} castShadow>
        <cylinderGeometry args={[0.28, 0.38, 1.6, 7]} />
        <meshStandardMaterial color="#8a5a2e" roughness={0.8} />
        {spots.map((p, i) => (
          <Instance key={i} position={[p.x, 0.8 * p.s, p.z]} scale={p.s} />
        ))}
      </Instances>
      {[
        { y: 2.1, r: 2.1, h: 2.4 },
        { y: 3.7, r: 1.6, h: 2.0 },
        { y: 5.0, r: 1.1, h: 1.7 },
      ].map((tier, ti) => (
        <Instances key={ti} range={spots.length} limit={spots.length} castShadow>
          <coneGeometry args={[tier.r, tier.h, 9]} />
          <meshStandardMaterial color={ti % 2 ? '#5cad46' : WORLD.pine} roughness={0.75} />
          {spots.map((p, i) => (
            <Instance key={i} position={[p.x, tier.y * p.s, p.z]} scale={p.s} />
          ))}
        </Instances>
      ))}
    </group>
  );
}

export function Lollipops() {
  const spots = useMemo(() => {
    const r = rand(31);
    const arr = [];
    [[-24, -28], [26, -40], [-34, 8], [22, 12], [56, 10], [-62, 28], [-28, 56], [12, 62], [52, 62], [30, 28], [-52, 12], [64, 40], [18, 44]].forEach(([x, z]) => {
      arr.push({ x: x + (r() - 0.5) * 4, z: z + (r() - 0.5) * 4, s: 0.75 + r() * 0.7 });
    });
    return arr;
  }, []);
  return (
    <group>
      <Instances range={spots.length} limit={spots.length} castShadow>
        <cylinderGeometry args={[0.16, 0.22, 1.4, 7]} />
        <meshStandardMaterial color="#9a6a38" roughness={0.8} />
        {spots.map((p, i) => (
          <Instance key={i} position={[p.x, 0.7 * p.s, p.z]} scale={p.s} />
        ))}
      </Instances>
      <Instances range={spots.length} limit={spots.length} castShadow>
        <sphereGeometry args={[1.35, 12, 10]} />
        <meshStandardMaterial color={WORLD.leafDark} roughness={0.7} />
        {spots.map((p, i) => (
          <Instance key={i} position={[p.x, 2.2 * p.s, p.z]} scale={p.s} color={i % 3 === 0 ? '#7ec95d' : WORLD.leafDark} />
        ))}
      </Instances>
    </group>
  );
}

export function Boulders() {
  const spots = useMemo(() => {
    const r = rand(93);
    const arr = [];
    [[-18, -24], [20, -22], [-40, -8], [48, 14], [-58, 52], [-30, 34], [16, 54], [60, 48], [-66, -18], [10, 36], [-12, 60], [30, 62]].forEach(([x, z]) => {
      for (let i = 0; i < 2; i++) arr.push({ x: x + (r() - 0.5) * 5, z: z + (r() - 0.5) * 5, s: 0.5 + r() * 1.1, ry: r() * 6 });
    });
    return arr;
  }, []);
  return (
    <Instances range={spots.length} limit={spots.length} castShadow receiveShadow>
      <sphereGeometry args={[1, 10, 8]} />
      <meshStandardMaterial color="#a8a29a" roughness={0.95} />
      {spots.map((p, i) => (
        <Instance key={i} position={[p.x, p.s * 0.55, p.z]} scale={[p.s, p.s * 0.72, p.s * 0.9]} rotation={[0, p.ry, 0]} />
      ))}
    </Instances>
  );
}

const FLOWER_COLORS = [ACCENT.pink, ACCENT.yellow, ACCENT.blue, '#ffffff', ACCENT.red];

export function Flowers({ extraBloom }) {
  const spots = useMemo(() => {
    const r = rand(55);
    const arr = [];
    const patches = [
      [0, 4, 3.5, 16],      // plaza bed
      [27, 47, 3, 12],      // garden rose bed
      [34, 52, 9, 22],      // garden general
      [-48, 42, 12, 18],    // meadow
      [8, 26, 3, 6],        // mailbox
      [-19, -31, 3.5, 6],   // forecourt edges (on the grass, not the slab)
      [19, -31, 3.5, 6],
      [52, -2, 6, 10],      // poolside
      [-4, 52, 5, 8],       // mushroom path
      [-14, 30, 3, 5], [-38, 18, 3, 5], [52, 44, 3, 5],
      [22, -40, 5, 8], [-24, -40, 5, 8],
      [-30, 10, 5, 8], [-22, 42, 5, 8], [-58, 8, 5, 7], [40, 36, 4, 7],
    ];
    patches.forEach(([cx, cz, cr, n], pi) => {
      for (let i = 0; i < n; i++) {
        const a = r() * Math.PI * 2;
        const d = Math.sqrt(r()) * cr;
        arr.push({
          x: cx + Math.cos(a) * d, z: cz + Math.sin(a) * d,
          c: FLOWER_COLORS[Math.floor(r() * FLOWER_COLORS.length)],
          s: 0.7 + r() * 0.6, patch: pi,
        });
      }
    });
    return arr;
  }, []);
  const heads = useRef();
  useFrame(({ clock }) => {
    // whole-field gentle sway
    if (heads.current) heads.current.rotation.z = Math.sin(clock.elapsedTime * 1.1) * 0.015;
  });
  const bloomScale = (p) => {
    if (!extraBloom) return 1;
    if (p.patch === 0) return 1 + (extraBloom['flowerbed-plaza'] || 0) * 0.18;
    if (p.patch === 1) return 1 + (extraBloom['flowerbed-garden'] || 0) * 0.18;
    return 1;
  };
  return (
    <group ref={heads}>
      <Instances range={spots.length} limit={spots.length}>
        <cylinderGeometry args={[0.03, 0.045, 0.4, 5]} />
        <meshStandardMaterial color="#4f9e3c" roughness={0.8} />
        {spots.map((p, i) => (
          <Instance key={i} position={[p.x, 0.2 * p.s, p.z]} scale={p.s * bloomScale(p)} />
        ))}
      </Instances>
      <Instances range={spots.length} limit={spots.length}>
        <sphereGeometry args={[0.17, 8, 6]} />
        <meshStandardMaterial roughness={0.5} />
        {spots.map((p, i) => (
          <Instance key={i} position={[p.x, (0.42 + 0.05) * p.s * bloomScale(p), p.z]} scale={p.s * bloomScale(p)} color={p.c} />
        ))}
      </Instances>
      <Instances range={spots.length} limit={spots.length}>
        <sphereGeometry args={[0.06, 6, 5]} />
        <meshStandardMaterial color="#fff3c2" roughness={0.5} />
        {spots.map((p, i) => (
          <Instance key={i} position={[p.x, (0.47 + 0.14) * p.s * bloomScale(p), p.z - 0.02]} scale={p.s} />
        ))}
      </Instances>
    </group>
  );
}

// ---------- waterfall + stream ----------
export function Waterfall() {
  const streak = useMemo(() => {
    const t = waterStreakTexture();
    t.repeat.set(1, 1.4);
    return t;
  }, []);
  const flowRefs = useRef([]);
  useFrame((_, dt) => {
    streak.offset.y -= dt * 0.8;
  });
  const tiers = [
    { pos: [-68, 0, -62], w: 10, h: 9, top: 9 },
    { pos: [-70, 0, -52], w: 8, h: 5.5, top: 5.5 },
    { pos: [-71, 0, -43], w: 7, h: 2.8, top: 2.8 },
  ];
  return (
    <group>
      {tiers.map((t, i) => (
        <group key={i} position={t.pos}>
          <mesh material={mat('#9b948a', 'stone')} position={[0, t.h / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[t.w * 0.55, t.w * 0.62, t.h, 12]} />
          </mesh>
          {/* mossy top */}
          <mesh material={mat('#79b356', 'leaf')} position={[0, t.h + 0.2, 0]} scale={[1, 0.25, 1]}>
            <sphereGeometry args={[t.w * 0.58, 12, 8]} />
          </mesh>
          {/* falling water strip on the south face */}
          <mesh ref={(el) => (flowRefs.current[i] = el)} position={[0, t.h / 2, t.w * 0.58]} rotation={[0, 0, 0]}>
            <planeGeometry args={[t.w * 0.5, t.h]} />
            <meshStandardMaterial map={streak} transparent opacity={0.85} roughness={0.12} side={THREE.DoubleSide} />
          </mesh>
          {/* foam at base */}
          <mesh material={mat('#ffffff', 'plastic')} position={[0, 0.3, t.w * 0.58 + 0.4]} scale={[1.4, 0.4, 0.8]}>
            <sphereGeometry args={[t.w * 0.28, 10, 6]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export const STREAM_PATH = [
  [-70, -40], [-74, -26], [-78, -8], [-80, 10], [-78, 28], [-73, 46], [-66, 62], [-56, 76], [-44, 86],
];

export function Stream() {
  const streak = useMemo(() => {
    const t = waterStreakTexture();
    t.repeat.set(2, 8);
    return t;
  }, []);
  useFrame((_, dt) => {
    streak.offset.y -= dt * 0.35;
  });
  const geo = useMemo(() => {
    const pts = STREAM_PATH.map(([x, z]) => new THREE.Vector3(x, 0.1, z));
    const curve = new THREE.CatmullRomCurve3(pts);
    const g = new THREE.TubeGeometry(curve, 60, 2.6, 8);
    g.scale(1, 0.05, 1);
    return g;
  }, []);
  const banks = useMemo(() => {
    const r = rand(21);
    const pts = STREAM_PATH.map(([x, z]) => new THREE.Vector3(x, 0, z));
    const curve = new THREE.CatmullRomCurve3(pts);
    const arr = [];
    for (let i = 0; i < 26; i++) {
      const p = curve.getPoint(i / 26);
      const tangent = curve.getTangent(i / 26);
      const n = new THREE.Vector3(-tangent.z, 0, tangent.x);
      const side = i % 2 === 0 ? 1 : -1;
      arr.push({ x: p.x + n.x * 3.4 * side, z: p.z + n.z * 3.4 * side, s: 0.5 + r() * 0.9 });
    }
    return arr;
  }, []);
  return (
    <group>
      <mesh geometry={geo} position={[0, 0.1, 0]}>
        <meshStandardMaterial map={streak} color={WORLD.water} transparent opacity={0.9} roughness={0.15} />
      </mesh>
      <Instances range={banks.length} limit={banks.length} castShadow>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color="#a8a29a" roughness={0.95} />
        {banks.map((b, i) => (
          <Instance key={i} position={[b.x, b.s * 0.4, b.z]} scale={[b.s, b.s * 0.6, b.s * 0.8]} />
        ))}
      </Instances>
    </group>
  );
}

// ---------- sky life ----------
export function Clouds() {
  const group = useRef();
  const clouds = useMemo(() => {
    const r = rand(77);
    return Array.from({ length: 7 }, (_, i) => ({
      x: -90 + r() * 180, y: 34 + r() * 14, z: -80 + r() * 150,
      s: 2.6 + r() * 3, speed: 0.25 + r() * 0.4,
    }));
  }, []);
  useFrame((_, dt) => {
    if (!group.current) return;
    group.current.children.forEach((c, i) => {
      c.position.x += clouds[i].speed * dt;
      if (c.position.x > 120) c.position.x = -120;
    });
  });
  return (
    <group ref={group}>
      {clouds.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]} scale={c.s}>
          <mesh material={mat('#ffffff', 'plaster', { fog: false })}>
            <sphereGeometry args={[1.15, 10, 8]} />
          </mesh>
          <mesh material={mat('#ffffff', 'plaster', { fog: false })} position={[1.05, -0.12, 0.15]} scale={0.75}>
            <sphereGeometry args={[1.05, 10, 8]} />
          </mesh>
          <mesh material={mat('#ffffff', 'plaster', { fog: false })} position={[-1.0, -0.18, -0.1]} scale={0.68}>
            <sphereGeometry args={[1.05, 10, 8]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function Butterflies() {
  const refs = useRef([]);
  const flies = useMemo(() => {
    const r = rand(13);
    return Array.from({ length: 8 }, (_, i) => ({
      cx: [-4, 30, -46, 10, 50, -20, 36, 0][i], cz: [10, 48, 40, 28, -4, -34, 54, 52][i],
      r: 3 + r() * 5, h: 1.4 + r() * 1.2, sp: 0.5 + r() * 0.6, ph: r() * 6,
      color: i % 2 === 0 ? ACCENT.blue : ACCENT.orange,
    }));
  }, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    refs.current.forEach((g, i) => {
      if (!g) return;
      const f = flies[i];
      const a = t * f.sp + f.ph;
      g.position.set(f.cx + Math.cos(a) * f.r, f.h + Math.sin(a * 2.3) * 0.5, f.cz + Math.sin(a) * f.r);
      g.rotation.y = -a + Math.PI / 2;
      const flap = Math.sin(t * 16 + f.ph) * 0.8;
      if (g.children[0]) g.children[0].rotation.z = flap;
      if (g.children[1]) g.children[1].rotation.z = -flap;
    });
  });
  return flies.map((f, i) => (
    <group key={i} ref={(el) => (refs.current[i] = el)}>
      <mesh material={mat(f.color, 'plastic', { side: THREE.DoubleSide })} position={[0.12, 0, 0]}>
        <planeGeometry args={[0.24, 0.18]} />
      </mesh>
      <mesh material={mat(f.color, 'plastic', { side: THREE.DoubleSide })} position={[-0.12, 0, 0]}>
        <planeGeometry args={[0.24, 0.18]} />
      </mesh>
      <mesh material={mat('#333333', 'plastic')}>
        <capsuleGeometry args={[0.03, 0.12, 4, 6]} />
      </mesh>
    </group>
  ));
}
