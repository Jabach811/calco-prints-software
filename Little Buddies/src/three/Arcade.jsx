// Gaming Corner arcade: chunky purple hall with a blinking marquee.
// Door faces west toward the path; interactable spot is (55, 10).
import * as THREE from 'three';
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { ACCENT } from '../data/palette.js';
import { mat, stripeTexture, textTexture } from './materials.js';

export function Arcade() {
  const signTex = useMemo(
    () => textTexture('GAMING CORNER', { w: 512, h: 96, bg: '#2b1c4e', fg: '#FFE9A8', font: 'bold 52px "Baloo 2", sans-serif', radius: 20 }),
    []
  );
  const awningTex = useMemo(() => stripeTexture([ACCENT.purple, '#ffffff'], 8, true), []);
  const bulbs = useRef([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    bulbs.current.forEach((b, i) => {
      if (b) b.material.emissiveIntensity = (Math.floor(t * 3) + i) % 2 ? 2 : 0.4;
    });
  });
  const bulbSpots = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 7; i++) arr.push([-2.7 + i * 0.9, 5.15]);
    for (let i = 0; i < 7; i++) arr.push([-2.7 + i * 0.9, 3.85]);
    return arr;
  }, []);
  return (
    <group position={[60, 0, 10]}>
      {/* main hall */}
      <RoundedBox args={[9, 5.6, 8]} radius={0.35} position={[0, 2.8, 0]} material={mat('#7b5cc9', 'plastic')} castShadow receiveShadow />
      <RoundedBox args={[9.6, 0.7, 8.6]} radius={0.25} position={[0, 5.7, 0]} material={mat('#5a3fa0', 'plastic')} castShadow />
      {/* roof joystick */}
      <mesh material={mat('#4A4A4A', 'plastic')} position={[2.6, 6.5, -1.5]} castShadow>
        <cylinderGeometry args={[0.16, 0.22, 1.1, 10]} />
      </mesh>
      <mesh material={mat(ACCENT.red, 'gloss')} position={[2.6, 7.25, -1.5]} castShadow>
        <sphereGeometry args={[0.5, 14, 12]} />
      </mesh>
      {/* west face: door, awning, marquee (west = -x) */}
      <RoundedBox args={[0.3, 3.1, 2.4]} radius={0.1} position={[-4.45, 1.55, 0]} material={mat('#2b1c4e', 'plastic')} />
      <mesh position={[-4.75, 3.4, 0]} rotation={[0, 0, -0.5]} castShadow>
        <cylinderGeometry args={[1.7, 1.7, 3.4, 14, 1, true, 0, Math.PI * 0.65]} />
        <meshStandardMaterial map={awningTex} side={THREE.DoubleSide} roughness={0.7} />
      </mesh>
      <mesh position={[-4.63, 4.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[6.4, 1.1]} />
        <meshStandardMaterial map={signTex} transparent roughness={0.8} />
      </mesh>
      {/* marquee bulbs above and below the sign */}
      {/* per-mesh materials: mat() caches by color+kind+JSON(extra), so identical
          extra objects across bulbs would return the SAME shared material — mutating
          emissiveIntensity per-bulb here would make all bulbs blink in lockstep off one
          instance instead of each blinking independently. */}
      {bulbSpots.map(([z, y], i) => (
        <mesh key={i} ref={(el) => (bulbs.current[i] = el)} position={[-4.62, y, z]}>
          <sphereGeometry args={[0.11, 8, 6]} />
          <meshStandardMaterial color="#ffdf8e" emissive="#ffca5f" emissiveIntensity={1} roughness={0.4} metalness={0} />
        </mesh>
      ))}
      {/* glowing window strips on the south face */}
      {[-1.6, 1.6].map((x, i) => (
        <mesh key={'w' + i} material={mat('#ffe9a8', 'glow', { emissive: '#ffd76e', emissiveIntensity: 0.9 })} position={[x, 2.6, 4.05]}>
          <boxGeometry args={[1.8, 1.1, 0.1]} />
        </mesh>
      ))}
    </group>
  );
}
