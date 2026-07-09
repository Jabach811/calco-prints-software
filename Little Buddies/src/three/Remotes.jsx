// Friends in the room: interpolated remote Buddies + spawn-in sparkle bursts.
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Buddy, BuddyBubble } from './Buddy.jsx';
import { remoteRts } from '../state/rt.js';
import { useGame } from '../state/store.js';
import { sparkleTexture } from './materials.js';

const now = () => performance.now() / 1000;

function RemoteBuddy({ id, profile }) {
  const root = useRef();
  const bubble = useGame((s) => s.bubbles[id]);
  useFrame((_, rawDt) => {
    const rt = remoteRts.get(id);
    if (!rt || !root.current) return;
    const dt = Math.min(rawDt, 0.05);
    const k = 1 - Math.exp(-dt * 10);
    rt.x += (rt.tx - rt.x) * k;
    rt.y += (rt.ty - rt.y) * k;
    rt.z += (rt.tz - rt.z) * k;
    let dr = rt.try - rt.ry;
    while (dr > Math.PI) dr -= Math.PI * 2;
    while (dr < -Math.PI) dr += Math.PI * 2;
    rt.ry += dr * k;
    if (rt.animOneShot && rt.animOneShot < now()) {
      rt.animOneShot = 0;
      rt.anim = 'idle';
      rt.animT = 0;
    }
    root.current.position.set(rt.x, rt.y, rt.z);
    root.current.rotation.y = rt.ry;
  });
  const rt = remoteRts.get(id);
  if (!rt) return null;
  return (
    <group ref={root} position={[rt.x, rt.y, rt.z]}>
      <Buddy profile={profile} rt={rt} />
      <BuddyBubble bubble={bubble} />
      {/* name tag */}
      <NameTag name={profile?.name} />
    </group>
  );
}

function NameTag({ name }) {
  if (!name) return null;
  return null; // names stay in bubbles/toasts to keep the scene clean, per mockups
}

function SpawnBurst({ burst }) {
  const ref = useRef();
  const tex = useMemo(() => sparkleTexture(), []);
  useFrame(() => {
    if (!ref.current) return;
    const el = now() - burst.t0;
    const k = Math.min(el / 1.6, 1);
    ref.current.children.forEach((sp, i) => {
      const a = (i / 8) * Math.PI * 2;
      const r = 0.4 + k * 2.2;
      sp.position.set(Math.cos(a) * r, 0.5 + k * 1.8 - k * k * 1.2, Math.sin(a) * r);
      sp.material.opacity = 1 - k;
    });
  });
  return (
    <group position={[burst.x, 0, burst.z]}>
      <group ref={ref}>
        {Array.from({ length: 8 }, (_, i) => (
          <sprite key={i} scale={[0.8, 0.8, 1]}>
            <spriteMaterial map={tex} transparent depthWrite={false} />
          </sprite>
        ))}
      </group>
    </group>
  );
}

export function Remotes() {
  const remotes = useGame((s) => s.remotes);
  const bursts = useGame((s) => s.spawnBursts);
  return (
    <group>
      {Object.entries(remotes).map(([id, profile]) => (
        <RemoteBuddy key={id} id={id} profile={profile} />
      ))}
      {bursts.map((b) => (
        <SpawnBurst key={b.id + b.t0} burst={b} />
      ))}
    </group>
  );
}
