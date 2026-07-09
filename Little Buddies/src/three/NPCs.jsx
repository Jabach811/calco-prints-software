// Ambient resident Buddies: wander, swim, lounge, sit, stand on balconies,
// think out loud in thought bubbles, and greet the player by name.
import * as THREE from 'three';
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Buddy, BuddyBubble } from './Buddy.jsx';
import { Float } from './PoolSlide.jsx';
import { DESK_BUDDY, SNACK_BUDDY, AMBIENT_NPCS, WAYPOINTS } from '../data/npcs.js';
import { VOICE, CONTEXT_THOUGHTS, NPC_GREETINGS } from '../data/dialogue.js';
import { playerRt } from '../state/rt.js';
import { resolveCollisions } from './colliders.js';
import { useGame } from '../state/store.js';

const now = () => performance.now() / 1000;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// global registry so the player controller can find NPC positions
if (typeof window !== 'undefined') window.__npcRts = window.__npcRts || {};

const ZONE_CONTEXT = [
  { key: 'snack', x: 44, z: 26, r: 14 },
  { key: 'pool', x: 52, z: -16, r: 20 },
  { key: 'slide', x: -24, z: -40, r: 10 },
  { key: 'garden', x: 34, z: 50, r: 16 },
  { key: 'flowers', x: 0, z: 4, r: 8 },
  { key: 'mailbox', x: 8, z: 26, r: 8 },
  { key: 'hotel', x: -5, z: -48, r: 18 },
];

function contextFor(x, z) {
  for (const c of ZONE_CONTEXT) {
    if (Math.hypot(c.x - x, c.z - z) < c.r) return c.key;
  }
  return 'path';
}

function useNpcRt(npc) {
  return useMemo(() => {
    const rt = {
      x: npc.pos[0], y: npc.pos[1] || 0, z: npc.pos[2],
      ry: npc.face || 0, anim: npc.behavior === 'swim' ? 'float' : npc.behavior === 'bench' ? 'sit' : 'idle',
      animT: Math.random() * 5, speak: null, holding: null,
      wp: null, idleUntil: now() + Math.random() * 4, greetAt: 0, oneShotUntil: 0,
    };
    window.__npcRts[npc.id] = rt;
    return rt;
  }, [npc]);
}

export function NPC({ npc }) {
  const root = useRef();
  const rt = useNpcRt(npc);
  const [thought, setThought] = useState(null);
  const bubble = useGame((s) => s.bubbles[npc.id]);
  const speed = npc.temperament === 'Turbo' ? 3.4 : npc.temperament === 'Sleepy' || npc.temperament === 'Chill' ? 1.4 : 2.2;

  // thought bubble scheduler
  useEffect(() => {
    if (npc.behavior === 'desk') return; // staff use speech, not thoughts
    let alive = true;
    let timer;
    const schedule = () => {
      timer = setTimeout(() => {
        if (!alive) return;
        const ctx = contextFor(rt.x, rt.z);
        const bank = Math.random() < 0.55 && CONTEXT_THOUGHTS[ctx] ? CONTEXT_THOUGHTS[ctx] : (VOICE[npc.temperament]?.thought || ['⭐']);
        setThought({ text: pick(bank), until: now() + 3.6 });
        setTimeout(() => alive && setThought(null), 3800);
        schedule();
      }, 9000 + Math.random() * 14000);
    };
    schedule();
    return () => { alive = false; clearTimeout(timer); };
  }, [npc, rt]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = now();

    if (npc.behavior === 'wander') {
      if (rt.wp) {
        const dx = rt.wp[0] - rt.x, dz = rt.wp[1] - rt.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.6) {
          rt.wp = null;
          rt.idleUntil = t + 2 + Math.random() * 5;
          rt.anim = 'idle'; rt.animT = 0;
        } else {
          let nx = rt.x + (dx / d) * speed * dt;
          let nz = rt.z + (dz / d) * speed * dt;
          [nx, nz] = resolveCollisions(nx, nz, 0.5);
          // stuck? give up on this waypoint
          if (Math.hypot(nx - rt.x, nz - rt.z) < speed * dt * 0.2) rt.wp = null;
          rt.x = nx; rt.z = nz;
          rt.ry = Math.atan2(dx / d, dz / d);
          if (rt.anim !== 'walk') { rt.anim = 'walk'; rt.animT = 0; }
        }
      } else if (t > rt.idleUntil) {
        const pts = WAYPOINTS[npc.zone] || WAYPOINTS.plaza;
        rt.wp = pick(pts);
      }
    } else if (npc.behavior === 'swim') {
      // slow drift circle on the float
      const a = t * 0.12 + npc.pos[0];
      rt.x = npc.pos[0] + Math.cos(a) * 1.6;
      rt.z = npc.pos[2] + Math.sin(a) * 1.6;
      rt.ry = -a;
      if (rt.anim !== 'float' && rt.oneShotUntil < t) { rt.anim = 'float'; rt.animT = 0; }
      rt.y = 0.32;
    } else if (npc.behavior === 'bench' || npc.behavior === 'lounge') {
      if (rt.oneShotUntil < t && rt.anim !== 'sit') { rt.anim = 'sit'; rt.animT = 0; }
    } else if (npc.behavior === 'desk' || npc.behavior === 'balcony') {
      // greet player when close
      const d = Math.hypot(playerRt.x - rt.x, playerRt.z - rt.z);
      if (npc.behavior === 'desk' && d < 7) {
        rt.ry = Math.atan2(playerRt.x - rt.x, playerRt.z - rt.z);
      }
      if (rt.oneShotUntil < t && rt.anim !== 'idle') { rt.anim = 'idle'; rt.animT = 0; }
      if (d < 6 && t > rt.greetAt) {
        rt.greetAt = t + 25 + Math.random() * 20;
        rt.anim = 'wave'; rt.animT = 0; rt.oneShotUntil = t + 1.6;
        if (npc.id !== 'npc-desk') {
          const name = useGame.getState().profile.name;
          useGame.getState().showBubble(npc.id, pick(NPC_GREETINGS(name)), 3);
        }
      }
    }

    // friendly ambient NPCs wave at the player
    if (npc.behavior === 'wander' && (npc.temperament === 'Friendly' || npc.temperament === 'Hyped')) {
      const d = Math.hypot(playerRt.x - rt.x, playerRt.z - rt.z);
      if (d < 4 && t > rt.greetAt) {
        rt.greetAt = t + 30;
        rt.anim = 'wave'; rt.animT = 0; rt.oneShotUntil = t + 1.6;
        const name = useGame.getState().profile.name;
        useGame.getState().showBubble(npc.id, pick(NPC_GREETINGS(name)), 3);
      }
      if (rt.oneShotUntil && rt.oneShotUntil < t && rt.anim === 'wave') { rt.anim = 'idle'; rt.animT = 0; rt.oneShotUntil = 0; }
    }
    if (rt.oneShotUntil && rt.oneShotUntil < t && (rt.anim === 'wave' || rt.anim === 'cheer' || rt.anim === 'hop')) {
      rt.anim = npc.behavior === 'swim' ? 'float' : npc.behavior === 'bench' ? 'sit' : 'idle';
      rt.animT = 0; rt.oneShotUntil = 0;
    }

    if (root.current) {
      root.current.position.set(rt.x, rt.y || 0, rt.z);
      root.current.rotation.y = rt.ry;
    }
  });

  return (
    <group ref={root} position={[rt.x, rt.y, rt.z]}>
      <Buddy profile={npc} rt={rt} castShadow={npc.behavior !== 'balcony'}>
        {npc.behavior === 'swim' && (
          <group position={[0, -0.25, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.75, 0.3, 10, 20]} />
              <meshStandardMaterial color={npc.float === 'duck' ? '#FFD23F' : '#F5883C'} roughness={0.2} />
            </mesh>
          </group>
        )}
      </Buddy>
      <BuddyBubble bubble={bubble} />
      {!bubble && thought && <BuddyBubble bubble={thought} thought height={2.2} />}
    </group>
  );
}

export function NPCs() {
  return (
    <group>
      <NPC npc={DESK_BUDDY} />
      <NPC npc={SNACK_BUDDY} />
      {AMBIENT_NPCS.map((n) => (
        <NPC key={n.id} npc={n} />
      ))}
      {/* the two swimmers' floats are drawn by their components; nothing else here */}
    </group>
  );
}
