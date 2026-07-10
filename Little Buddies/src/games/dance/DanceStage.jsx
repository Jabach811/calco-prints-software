// The Dance Studio stage: player's buddy + backup dancers, four lanes,
// falling note blobs. All positions derive from songTime() (audio clock).
import * as THREE from 'three';
import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { Buddy } from '../../three/Buddy.jsx';
import { mat, textTexture } from '../../three/materials.js';
import { ACCENT } from '../../data/palette.js';
import { useGame } from '../../state/store.js';
import { danceSession } from './session.js';

const LANE_X = [-2.7, -0.9, 0.9, 2.7];
const LANE_COLORS = [ACCENT.blue, ACCENT.yellow, ACCENT.green, ACCENT.purple];
const TARGET_Y = 1.5;
const NOTE_Z = 3.2;
const SPEED = 3.6; // world units per second of fall
const POOL = 28;
const CAM_POS = new THREE.Vector3(0, 4.6, 11);
const CAM_LOOK = new THREE.Vector3(0, 3.4, 0);

const songTime = () => (danceSession.handle ? danceSession.handle.songTime() : 0);
const beatPulse = () => {
  if (!danceSession.track) return 0;
  const t = songTime();
  if (t < 0) return 0;
  const spb = 60 / danceSession.track.bpm;
  return Math.max(0, 1 - ((t / spb) % 1) * 2.5);
};

function CameraRig() {
  const camera = useThree((s) => s.camera);
  useFrame(() => {
    camera.position.lerp(CAM_POS, 0.15);
    camera.lookAt(CAM_LOOK);
  });
  return null;
}

function StageSet() {
  const signTex = useMemo(
    () => textTexture('DANCE STUDIO', { w: 512, h: 96, bg: null, fg: '#FFE9A8', font: 'bold 56px "Baloo 2", sans-serif' }),
    []
  );
  const tiles = useRef([]);
  const lightL = useRef(), lightR = useRef();
  useFrame(() => {
    const pulse = beatPulse();
    tiles.current.forEach((m, i) => {
      if (m) m.emissiveIntensity = (i % 2 ? 0.12 : 0.04) + pulse * 0.45;
    });
    if (lightL.current) lightL.current.intensity = 14 + pulse * 22;
    if (lightR.current) lightR.current.intensity = 14 + pulse * 22;
  });
  const tileColors = [ACCENT.pink, ACCENT.blue, ACCENT.yellow, ACCENT.purple];
  return (
    <group>
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 12, 10]} intensity={0.9} color="#fff1d6" />
      <pointLight ref={lightL} position={[-6, 7, 5]} color="#F15BB5" intensity={14} distance={30} />
      <pointLight ref={lightR} position={[6, 7, 5]} color="#3D8BFD" intensity={14} distance={30} />
      {/* floor + glowing tile grid */}
      <RoundedBox args={[16, 0.4, 12]} radius={0.15} position={[0, -0.2, 0]} material={mat('#3a2a5e', 'plastic')} />
      {Array.from({ length: 40 }, (_, i) => {
        const cx = (i % 8) - 3.5, cz = Math.floor(i / 8) - 2;
        return (
          <mesh key={i} position={[cx * 1.9, 0.02, cz * 2.2]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.7, 2]} />
            <meshStandardMaterial
              ref={(m) => (tiles.current[i] = m)}
              color={tileColors[i % 4]}
              emissive={tileColors[i % 4]}
              emissiveIntensity={0.05}
              roughness={0.3}
            />
          </mesh>
        );
      })}
      {/* back wall + marquee */}
      <RoundedBox args={[16, 9, 0.6]} radius={0.2} position={[0, 4.3, -5.5]} material={mat('#2b1c4e', 'plastic')} />
      <mesh position={[0, 7.6, -5.1]}>
        <planeGeometry args={[7.5, 1.3]} />
        <meshBasicMaterial map={signTex} transparent />
      </mesh>
      <DiscoBall />
    </group>
  );
}

function DiscoBall() {
  const g = useRef();
  useFrame((_, dt) => { if (g.current) g.current.rotation.y += dt * 1.4; });
  return (
    <group position={[0, 8.2, -1]}>
      <mesh material={mat('#8a8a8a', 'plastic')} position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.2, 6]} />
      </mesh>
      <group ref={g}>
        <mesh>
          <sphereGeometry args={[0.7, 18, 14]} />
          <meshStandardMaterial color="#dfe6ff" metalness={0.95} roughness={0.15} flatShading />
        </mesh>
      </group>
    </group>
  );
}

const BACKUPS = [
  { name: 'Beebo', shape: 'blob', color: '#F5883C', eyes: 'plain', brows: 'happy', mouth: 'smile', accessory: 'sunglasses', hatColor: 'red' },
  { name: 'Mo', shape: 'droplet', color: '#3D8BFD', eyes: 'plain', brows: 'happy', mouth: 'smile', accessory: 'none', hatColor: 'red' },
];

function Dancers() {
  const profile = useGame((s) => s.profile);
  const rts = useMemo(
    () => [0, 0.7, 1.4].map((off) => ({ anim: 'dance', animT: off, animUntil: 0, speak: null, holding: null })),
    []
  );
  // dancers face the camera (+z)
  return (
    <>
      <group position={[0, 0, -0.8]} rotation={[0, Math.PI, 0]}>
        <Buddy profile={profile} rt={rts[0]} castShadow={false} />
      </group>
      <group position={[-2.4, 0, -2.6]} rotation={[0, Math.PI, 0]} scale={0.82}>
        <Buddy profile={BACKUPS[0]} rt={rts[1]} castShadow={false} />
      </group>
      <group position={[2.4, 0, -2.6]} rotation={[0, Math.PI, 0]} scale={0.82}>
        <Buddy profile={BACKUPS[1]} rt={rts[2]} castShadow={false} />
      </group>
    </>
  );
}

function Targets() {
  // arrow direction per lane: left, up, down, right (cone default points +y)
  const rotZ = [Math.PI / 2, 0, Math.PI, -Math.PI / 2];
  return (
    <group position={[0, TARGET_Y, NOTE_Z]}>
      {LANE_X.map((x, lane) => (
        <group key={lane} position={[x, 0, 0]}>
          <mesh rotation={[0, 0, 0]}>
            <ringGeometry args={[0.5, 0.62, 24]} />
            <meshBasicMaterial color={LANE_COLORS[lane]} transparent opacity={0.9} />
          </mesh>
          <mesh rotation={[0, 0, rotZ[lane]]}>
            <coneGeometry args={[0.16, 0.34, 3]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Notes() {
  const groups = useRef([]);
  const mats = useRef([]);
  useFrame(() => {
    const s = danceSession;
    const pool = groups.current;
    for (const g of pool) if (g) g.visible = false;
    if (!s.engine || !s.handle) return;
    const t = songTime();
    const nowMs = performance.now();
    let slot = 0;
    for (const n of s.engine.notes) {
      const dt = n.time - t;
      if (dt > 2.6) break; // chart is sorted; the rest are still far away
      let popK = -1;
      if (n.judged === 'miss') continue;
      if (n.judged) {
        const pop = s.pops.find((p) => p.noteId === n.id);
        popK = pop ? Math.min(1, (nowMs - pop.t) / 260) : 1;
        if (popK >= 1) continue;
      } else if (dt < -0.2) continue; // late unjudged note; update() will miss it
      const g = pool[slot];
      const m = mats.current[slot];
      slot++;
      if (!g) break;
      g.visible = true;
      if (m) m.color.set(LANE_COLORS[n.lane]);
      if (popK >= 0) {
        // hit! freeze on the target and pop
        const k = 1 + popK * 0.9;
        g.position.set(LANE_X[n.lane], TARGET_Y, NOTE_Z);
        g.scale.setScalar(k);
        g.rotation.z = popK * 1.2;
      } else {
        g.position.set(LANE_X[n.lane], TARGET_Y + dt * SPEED, NOTE_Z);
        g.rotation.z = Math.sin(t * 7 + n.id * 1.7) * 0.28; // the wiggle
        const sq = 1 + Math.sin(t * 14 + n.id) * 0.08; // the bounce
        g.scale.set(1.05 / sq, sq, 1);
      }
    }
    s.pops = s.pops.filter((p) => nowMs - p.t < 400);
  });
  return (
    <group>
      {Array.from({ length: POOL }, (_, i) => (
        <group key={i} ref={(el) => (groups.current[i] = el)} visible={false}>
          <mesh>
            <sphereGeometry args={[0.42, 12, 10]} />
            <meshStandardMaterial ref={(m) => (mats.current[i] = m)} roughness={0.35} />
          </mesh>
          <mesh position={[-0.13, 0.1, 0.36]}>
            <sphereGeometry args={[0.055, 6, 5]} />
            <meshBasicMaterial color="#2b2b2b" />
          </mesh>
          <mesh position={[0.13, 0.1, 0.36]}>
            <sphereGeometry args={[0.055, 6, 5]} />
            <meshBasicMaterial color="#2b2b2b" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function DanceStage() {
  return (
    <group>
      <CameraRig />
      <StageSet />
      <Dancers />
      <Targets />
      <Notes />
    </group>
  );
}
