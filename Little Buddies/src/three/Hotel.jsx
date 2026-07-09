// The Blob Hotel: four color-blocked floors like a rainbow layer cake, open
// check-in lobby, numbered doors, balconies, rooftop terrace, grand staircase.
import * as THREE from 'three';
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { FLOORS, WORLD, ACCENT } from '../data/palette.js';
import { mat, textTexture } from './materials.js';
import { useGame } from '../state/store.js';

const DOOR_COLORS = ['#54C24E', '#3D8BFD', '#9B5DE5', '#F15BB5', '#EF4444', '#F5883C'];

function NumberPlaque({ n, ...props }) {
  const tex = useMemo(() => textTexture(String(n), { w: 96, h: 64, bg: '#fff6e5', fg: '#6b4a2a', font: 'bold 40px "Baloo 2", sans-serif', radius: 14 }), [n]);
  return (
    <mesh {...props}>
      <planeGeometry args={[0.62, 0.42]} />
      <meshStandardMaterial map={tex} roughness={0.8} />
    </mesh>
  );
}

function Door({ x, y, z, n, color }) {
  return (
    <group position={[x, y, z]}>
      <RoundedBox args={[1.5, 2.5, 0.18]} radius={0.09} position={[0, 1.25, 0]} material={mat(color, 'plastic')} />
      <RoundedBox args={[1.15, 2.2, 0.14]} radius={0.07} position={[0, 1.18, 0.05]} material={mat(WORLD.woodLight, 'wood')} />
      <mesh material={mat('#f5c542', 'gloss')} position={[0.36, 1.15, 0.15]}>
        <sphereGeometry args={[0.07, 8, 8]} />
      </mesh>
      <NumberPlaque n={n} position={[0, 2.85, 0.12]} />
    </group>
  );
}

function Railing({ width, x = 0, y, z }) {
  const posts = Math.max(2, Math.round(width / 1.1));
  return (
    <group position={[x, y, z]}>
      <mesh material={mat(WORLD.wood, 'wood')} position={[0, 0.82, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.055, 0.055, width, 8]} />
      </mesh>
      {Array.from({ length: posts + 1 }, (_, i) => (
        <mesh key={i} material={mat(WORLD.wood, 'wood')} position={[-width / 2 + (i * width) / posts, 0.41, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.82, 6]} />
        </mesh>
      ))}
      {/* planter boxes with flowers */}
      {Array.from({ length: Math.floor(posts / 2) }, (_, i) => {
        const px = -width / 2 + 1 + i * 2.2;
        return (
          <group key={'p' + i} position={[px, 0.62, 0.08]}>
            <RoundedBox args={[0.8, 0.26, 0.24]} radius={0.05} material={mat('#7a4a22', 'wood')} />
            {[-0.22, 0, 0.22].map((fx, j) => (
              <mesh key={j} material={mat([ACCENT.pink, ACCENT.yellow, '#ffffff'][(i + j) % 3], 'plastic')} position={[fx, 0.2, 0]}>
                <sphereGeometry args={[0.1, 8, 6]} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

function WallLamp({ x, y, z }) {
  return (
    <group position={[x, y, z]}>
      <mesh material={mat('#6b4a2a', 'wood')}>
        <boxGeometry args={[0.12, 0.3, 0.08]} />
      </mesh>
      <mesh material={mat('#ffdf8e', 'glow', { emissive: '#ffca5f', emissiveIntensity: 1.4 })} position={[0, 0, 0.1]}>
        <sphereGeometry args={[0.11, 10, 8]} />
      </mesh>
    </group>
  );
}

function Picture({ x, y, z }) {
  return (
    <group position={[x, y, z]}>
      <RoundedBox args={[0.6, 0.48, 0.05]} radius={0.03} material={mat('#6b4a2a', 'wood')} />
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[0.46, 0.34]} />
        <meshStandardMaterial color="#bfe3f7" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Umbrella({ pos, colors = ['#EF4444', '#FFFFFF'] }) {
  return (
    <group position={pos}>
      <mesh material={mat('#e8e0d0', 'plastic')} position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 2.4, 8]} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} material={mat(colors[i % 2], 'plastic')} position={[Math.cos(a) * 0.55, 2.28, Math.sin(a) * 0.55]} rotation={[Math.cos(a) * -0.9 * Math.sin(a > Math.PI ? 1 : 1), -a + Math.PI / 2, 0.9]}>
            <coneGeometry args={[0.42, 0.5, 4]} />
          </mesh>
        );
      })}
      <mesh material={mat(colors[0], 'plastic')} position={[0, 2.5, 0]}>
        <coneGeometry args={[1.35, 0.55, 10]} />
      </mesh>
    </group>
  );
}

function DeskBell() {
  const ref = useRef();
  const poke = useGame((s) => s.world.objAnim['checkin-desk']);
  useFrame(() => {
    if (!ref.current) return;
    const t0 = poke?.t0 || 0;
    const dt = performance.now() / 1000 - t0;
    ref.current.position.y = dt < 0.5 ? 0.12 + Math.abs(Math.sin(dt * 30)) * 0.06 : 0.12;
  });
  return (
    <group ref={ref} position={[0.7, 0.12, 0.3]}>
      <mesh material={mat('#f5c542', 'gloss')}>
        <sphereGeometry args={[0.13, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
      </mesh>
      <mesh material={mat('#e0b032', 'gloss')} position={[0, 0.13, 0]}>
        <sphereGeometry args={[0.035, 8, 6]} />
      </mesh>
    </group>
  );
}

function Lobby() {
  const signTex = useMemo(() => textTexture('BLOB HOTEL', { w: 512, h: 128, bg: '#8B5A2B', fg: '#FFF3D6', font: 'bold 72px "Baloo 2", sans-serif', radius: 30 }), []);
  const checkinTex = useMemo(() => textTexture('CHECK-IN', { w: 256, h: 72, bg: '#6b4423', fg: '#FFF3D6', font: 'bold 38px "Baloo 2", sans-serif', radius: 12 }), []);
  return (
    <group>
      {/* interior back + side walls (warm) */}
      <mesh material={mat('#e8cf9f', 'plaster')} position={[0, 2.1, -6.5]}>
        <boxGeometry args={[17, 4.2, 0.6]} />
      </mesh>
      {/* hanging lamps */}
      {[-4, 0, 4].map((x) => (
        <group key={x} position={[x, 3.6, -3]}>
          <mesh material={mat('#6b4a2a', 'wood')} position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.7, 6]} />
          </mesh>
          <mesh material={mat('#ffdf8e', 'glow', { emissive: '#ffca5f', emissiveIntensity: 1.6 })}>
            <sphereGeometry args={[0.19, 10, 8]} />
          </mesh>
        </group>
      ))}
      {/* curved reception desk (three angled segments) */}
      <group position={[1.5, 0, -2.5]}>
        {[[-1.7, 0.5], [0, 0], [1.7, -0.5]].map(([x, rz], i) => (
          <group key={i} position={[x, 0, Math.abs(x) * 0.28]} rotation={[0, rz * 0.5, 0]}>
            <RoundedBox args={[1.9, 1.15, 0.5]} radius={0.1} position={[0, 0.58, 0]} material={mat(WORLD.woodLight, 'wood')} castShadow />
            <RoundedBox args={[2.05, 0.12, 0.72]} radius={0.05} position={[0, 1.18, 0]} material={mat('#9a6a38', 'wood')} />
          </group>
        ))}
        <mesh position={[0, 0.72, 0.31]}>
          <planeGeometry args={[1.5, 0.42]} />
          <meshStandardMaterial map={checkinTex} roughness={0.85} />
        </mesh>
        <group position={[-1, 1.12, 0]}>
          <DeskBell />
        </group>
      </group>
      {/* key cabinet on back wall */}
      <group position={[-3.5, 2.4, -6.1]}>
        <RoundedBox args={[2.2, 1.5, 0.18]} radius={0.06} material={mat('#7a4a22', 'wood')} />
        {Array.from({ length: 12 }, (_, i) => (
          <mesh key={i} material={mat('#f5c542', 'gloss')} position={[-0.8 + (i % 4) * 0.53, 0.42 - Math.floor(i / 4) * 0.45, 0.11]}>
            <sphereGeometry args={[0.055, 6, 6]} />
          </mesh>
        ))}
      </group>
      {/* notice board + clock */}
      <RoundedBox args={[1.6, 1.2, 0.14]} radius={0.06} position={[3.8, 2.5, -6.1]} material={mat('#a9713a', 'wood')} />
      <mesh position={[3.8, 2.5, -6.0]}>
        <planeGeometry args={[1.3, 0.9]} />
        <meshStandardMaterial color="#f3e4c2" roughness={0.9} />
      </mesh>
      <group position={[6.3, 3, -6.05]}>
        <mesh material={mat('#fff6e5', 'plastic')} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.09, 20]} />
        </mesh>
        <mesh material={mat('#333', 'plastic')} position={[0, 0.1, 0.06]}>
          <boxGeometry args={[0.05, 0.26, 0.02]} />
        </mesh>
        <mesh material={mat('#333', 'plastic')} position={[0.09, 0.02, 0.06]} rotation={[0, 0, -1.2]}>
          <boxGeometry args={[0.04, 0.2, 0.02]} />
        </mesh>
      </group>
      {/* potted plants */}
      {[[-6.5, -4.5], [6.8, -1.5], [-5.2, -0.5]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh material={mat(WORLD.terracotta, 'plaster')} position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.4, 0.3, 0.7, 10]} />
          </mesh>
          <mesh material={mat(WORLD.leafDark, 'leaf')} position={[0, 1.05, 0]}>
            <sphereGeometry args={[0.55, 10, 8]} />
          </mesh>
        </group>
      ))}
      {/* rug */}
      <mesh position={[1.5, 0.02, 1]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.2, 24]} />
        <meshStandardMaterial color="#d8734f" roughness={0.95} />
      </mesh>
      {/* BLOB HOTEL sign above arch */}
      <group position={[0, 4.05, 8.6]} rotation={[0.08, 0, 0]}>
        <RoundedBox args={[7.2, 1.7, 0.35]} radius={0.25} material={mat('#8B5A2B', 'wood')} castShadow />
        <mesh position={[0, 0, 0.19]}>
          <planeGeometry args={[6.8, 1.4]} />
          <meshStandardMaterial map={signTex} roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

function Floor({ y, width, color, doors, startNum, depth = 15 }) {
  const front = depth / 2;
  return (
    <group position={[0, y, 0]}>
      <RoundedBox args={[width, 3.4, depth]} radius={0.7} smoothness={3} position={[0, 1.7, 0]} material={mat(color, 'plaster')} castShadow receiveShadow />
      {/* walkway front face: doors, lamps, pictures */}
      {doors.map((dx, i) => (
        <Door key={i} x={dx} y={0.35} z={front - 0.15} n={startNum + i} color={DOOR_COLORS[(startNum + i) % DOOR_COLORS.length]} />
      ))}
      {doors.slice(0, -1).map((dx, i) => (
        <WallLamp key={'l' + i} x={(dx + doors[i + 1]) / 2} y={2.4} z={front - 0.1} />
      ))}
      {doors.slice(0, -1).map((dx, i) => (
        <Picture key={'pic' + i} x={(dx + doors[i + 1]) / 2 + 0.9} y={1.9} z={front - 0.12} />
      ))}
      {/* balcony ledge + railing */}
      <RoundedBox args={[width - 1, 0.35, 1.6]} radius={0.12} position={[0, 0.1, front + 0.55]} material={mat('#f3e4c2', 'plaster')} />
      <Railing width={width - 2} y={0.25} z={front + 1.1} />
    </group>
  );
}

export function Hotel() {
  return (
    <group position={[-5, 0, -60]}>
      {/* low green rise behind the hotel */}
      <mesh material={mat('#79b356', 'leaf')} position={[0, -2.5, -20]} scale={[1.4, 0.14, 0.6]} receiveShadow>
        <sphereGeometry args={[30, 24, 16]} />
      </mesh>

      {/* lobby level: two flanks + header create the open front */}
      <group position={[0, 0, 0]}>
        <RoundedBox args={[13, 4.4, 16]} radius={0.7} position={[-14.5, 2.2, 0]} material={mat(WORLD.sand, 'plaster')} castShadow />
        <RoundedBox args={[13, 4.4, 16]} radius={0.7} position={[14.5, 2.2, 0]} material={mat(WORLD.sand, 'plaster')} castShadow />
        <RoundedBox args={[18, 1.1, 16]} radius={0.4} position={[0, 3.9, 0]} material={mat(WORLD.sand, 'plaster')} castShadow />
        {/* arch top corners */}
        <mesh material={mat(WORLD.sand, 'plaster')} position={[-8, 3.2, 3.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.9, 0.9, 9, 12]} />
        </mesh>
        <mesh material={mat(WORLD.sand, 'plaster')} position={[8, 3.2, 3.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.9, 0.9, 9, 12]} />
        </mesh>
        {/* lobby floor */}
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[16, 15.4]} />
          <meshStandardMaterial color="#e9d9b5" roughness={0.9} />
        </mesh>
        <Lobby />
      </group>

      {/* four rainbow floors */}
      <Floor y={4.4} width={40} color={FLOORS[0]} doors={[-15, -10, -5, 5, 10, 15]} startNum={101} />
      <Floor y={7.8} width={37} color={FLOORS[1]} doors={[-13, -8, -3, 3, 8, 13]} startNum={103} />
      <Floor y={11.2} width={34} color={FLOORS[2]} doors={[-11, -5.5, 0, 5.5, 11]} startNum={105} />
      <Floor y={14.6} width={31} color={FLOORS[3]} doors={[-9, -3, 3, 9]} startNum={108} />

      {/* rooftop terrace */}
      <group position={[0, 18, 0]}>
        <RoundedBox args={[29, 0.5, 14]} radius={0.2} position={[0, 0.1, 0]} material={mat('#e9d9b5', 'plaster')} receiveShadow />
        <Railing width={27} y={0.35} z={6.6} />
        <Railing width={27} y={0.35} z={-6.6} />
        <Umbrella pos={[-6, 0.3, 2]} colors={['#3D8BFD', '#FFFFFF']} />
        {/* cafe table + stools */}
        <group position={[-6, 0.3, 2]}>
          <mesh material={mat('#fff6e5', 'plastic')} position={[0, 0.55, 0]}>
            <cylinderGeometry args={[0.7, 0.7, 0.08, 14]} />
          </mesh>
          <mesh material={mat('#c9b48a', 'wood')} position={[0, 0.28, 0]}>
            <cylinderGeometry args={[0.08, 0.12, 0.55, 8]} />
          </mesh>
          {[[-1.1, 0], [1.1, 0.3]].map(([x, z], i) => (
            <mesh key={i} material={mat(WORLD.woodLight, 'wood')} position={[x, 0.3, z]}>
              <cylinderGeometry args={[0.3, 0.34, 0.6, 10]} />
            </mesh>
          ))}
        </group>
        {/* penthouse hut */}
        <group position={[5.5, 0.3, -2.5]}>
          <RoundedBox args={[5, 3.4, 4.6]} radius={0.35} position={[0, 1.7, 0]} material={mat('#efe0bd', 'plaster')} castShadow />
          <RoundedBox args={[5.6, 0.5, 5.2]} radius={0.2} position={[0, 3.55, 0]} material={mat('#8B5A2B', 'wood')} />
          <RoundedBox args={[1.2, 2.1, 0.16]} radius={0.08} position={[0, 1.05, 2.32]} material={mat(WORLD.woodLight, 'wood')} />
          <mesh material={mat('#f5c542', 'gloss')} position={[0.4, 1.05, 2.42]}>
            <sphereGeometry args={[0.06, 8, 8]} />
          </mesh>
        </group>
        {/* slide launch platform on the right end */}
        <group position={[13, 0.3, 2]}>
          <RoundedBox args={[3.6, 0.9, 3.6]} radius={0.2} position={[0, 0.45, 0]} material={mat('#3D8BFD', 'plastic')} />
          <RoundedBox args={[3.2, 0.25, 3.2]} radius={0.1} position={[0, 1, 0]} material={mat('#ffffff', 'plastic')} />
        </group>
      </group>

      {/* grand exterior staircase, left hillside: two flights + landing */}
      <Staircase />

      {/* directional signposts at the lobby */}
      <LobbySigns />
    </group>
  );
}

function Staircase() {
  const steps1 = Array.from({ length: 12 }, (_, i) => i);
  const steps2 = Array.from({ length: 14 }, (_, i) => i);
  return (
    <group position={[-21, 0, 8]}>
      {/* flight 1: up toward north-west */}
      {steps1.map((i) => (
        <mesh key={i} material={mat('#e5d3ac', 'stone')} position={[-i * 0.62, 0.25 + i * 0.42, -i * 0.62]} castShadow receiveShadow>
          <boxGeometry args={[3.4, 0.5, 1.15]} />
        </mesh>
      ))}
      {/* landing */}
      <RoundedBox args={[4.4, 0.6, 4.4]} radius={0.15} position={[-7.6, 5.35, -8.4]} material={mat('#e5d3ac', 'stone')} />
      {/* flight 2: continues up along hotel side */}
      {steps2.map((i) => (
        <mesh key={'b' + i} material={mat('#e5d3ac', 'stone')} position={[-7.6 + i * 0.0, 5.85 + i * 0.62, -10 - i * 0.55]} castShadow>
          <boxGeometry args={[3.4, 0.6, 1.05]} />
        </mesh>
      ))}
      {/* vine + flower blobs along the rail */}
      {steps1.filter((i) => i % 3 === 0).map((i) => (
        <group key={'v' + i} position={[-i * 0.62 + 1.6, 0.8 + i * 0.42, -i * 0.62]}>
          <mesh material={mat(WORLD.leafDark, 'leaf')}>
            <sphereGeometry args={[0.4, 8, 6]} />
          </mesh>
          <mesh material={mat(ACCENT.pink, 'plastic')} position={[0.15, 0.25, 0.1]}>
            <sphereGeometry args={[0.12, 6, 6]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function LobbySigns() {
  const items = ['ROOMS', 'POOL', 'SNACKS', 'GARDEN'];
  return (
    <group position={[10.5, 0, 9]}>
      <mesh material={mat(WORLD.wood, 'wood')} position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.13, 3, 8]} />
      </mesh>
      {items.map((label, i) => (
        <SignArrow key={label} label={label} y={2.7 - i * 0.55} flip={i % 2 === 1} />
      ))}
    </group>
  );
}

export function SignArrow({ label, y, flip = false, color = '#8B5A2B' }) {
  const tex = useMemo(() => textTexture(label, { w: 256, h: 72, bg: null, fg: '#FFF3D6', font: 'bold 40px "Baloo 2", sans-serif' }), [label]);
  return (
    <group position={[0, y, 0]} rotation={[0, flip ? 0.25 : -0.25, 0]}>
      <RoundedBox args={[2, 0.5, 0.12]} radius={0.08} position={[flip ? -1 : 1, 0, 0]} material={mat(color, 'wood')} />
      <mesh material={mat(color, 'wood')} position={[flip ? -2.1 : 2.1, 0, 0]} rotation={[0, 0, flip ? Math.PI / 4 : Math.PI / 4]}>
        <boxGeometry args={[0.36, 0.36, 0.12]} />
      </mesh>
      <mesh position={[flip ? -1 : 1, 0, 0.07]}>
        <planeGeometry args={[1.8, 0.42]} />
        <meshBasicMaterial map={tex} transparent />
      </mesh>
    </group>
  );
}
