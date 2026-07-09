// Assembles the whole Blob Hotel resort.
import React from 'react';
import { Hotel } from './Hotel.jsx';
import { Arcade } from './Arcade.jsx';
import { PoolAndSlide } from './PoolSlide.jsx';
import { Ground, Pines, Lollipops, Boulders, Flowers, Waterfall, Stream, Clouds, Birds } from './Nature.jsx';
import { Paths, Forecourt, Plaza, SpawnPad, FriendshipGarden, GardenPlot, Playground, SnackStand, LampPost, Mailbox, Bench, GlowingMushroom, PathSigns, Sparkle } from './Zones.jsx';
import { NPCs } from './NPCs.jsx';
import { Remotes } from './Remotes.jsx';
import { LAMP_SPOTS } from './colliders.js';
import { INTERACTABLES } from '../data/interactables.js';
import { useGame } from '../state/store.js';

function InteractableSparkles() {
  const hidden = useGame((s) => s.world.hiddenSparkles);
  return INTERACTABLES.map((o) => (
    <Sparkle
      key={o.id}
      pos={o.pos}
      y={o.sparkleY || 1.5}
      scale={o.type === 'sparkle' ? 1.4 : 0.9}
      hiddenUntil={hidden[o.id] ? hidden[o.id] : 0}
    />
  ));
}

export function World() {
  const bloom = useGame((s) => s.world.bloom);
  return (
    <group>
      {/* light */}
      <hemisphereLight args={['#cdeaff', '#d8eebe', 0.85]} />
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[45, 70, 25]}
        intensity={1.6}
        color="#fff1d6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-95}
        shadow-camera-right={95}
        shadow-camera-top={95}
        shadow-camera-bottom={-95}
        shadow-camera-near={10}
        shadow-camera-far={220}
        shadow-bias={-0.0004}
      />

      <Ground />
      <Paths />
      <Forecourt />
      <Plaza />
      <SpawnPad />
      <Hotel />
      <PoolAndSlide />
      <Waterfall />
      <Stream />
      <Pines />
      <Lollipops />
      <Boulders />
      <Flowers extraBloom={bloom} />
      <FriendshipGarden />
      <GardenPlot />
      <Playground />
      <SnackStand />
      <Arcade />
      <Mailbox />
      <GlowingMushroom />
      <PathSigns />
      <LampPost pos={[-8.5, -8]} id="lamp-plaza" />
      {LAMP_SPOTS.map((p, i) => (
        <LampPost key={i} pos={p} />
      ))}
      <Bench pos={[41, 59]} ry={-2.2 + Math.PI} id="bench-garden" />
      <Bench pos={[35, 6]} ry={2.4 + Math.PI} id="bench-pool" color="#6f8fc9" />
      <InteractableSparkles />
      <Clouds />
      <Birds />
      <NPCs />
      <Remotes />
    </group>
  );
}
