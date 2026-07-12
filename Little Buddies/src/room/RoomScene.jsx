import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { Buddy } from '../three/Buddy.jsx';
import { mat } from '../three/materials.js';
import { ROOM_SLOTS, roomItemById } from './roomCatalog.js';
import { RoomDecor } from './RoomDecor.jsx';

export const ROOM_SLOT_ANCHORS = Object.freeze({
  bed: { position: [-2.8, 0, 0.9], rotation: [0, 0.18, 0] },
  rug: { position: [0, 0.035, 1.2], rotation: [-Math.PI / 2, 0, 0] },
  wall: { position: [0, 2.35, 2.86], rotation: [0, Math.PI, 0] },
  shelf: { position: [2.65, 1.25, 2.55], rotation: [0, Math.PI, 0] },
  trophy: { position: [2.55, 0.82, 0.25], rotation: [0, -0.25, 0] },
});

const HIT_AREAS = Object.freeze({
  bed: [2.5, 1.5, 1.8],
  rug: [2.9, 0.2, 2.9],
  wall: [2.4, 1.5, 0.3],
  shelf: [2, 1.4, 0.8],
  trophy: [1.4, 2.2, 1.4],
});

export function roomSlotRingRotation(slot) {
  return slot === 'rug' || slot === 'wall' ? undefined : [-Math.PI / 2, 0, 0];
}

function Slot({ slot, item, selected, onSelect }) {
  const anchor = ROOM_SLOT_ANCHORS[slot];
  const hitRotation = slot === 'rug' ? [Math.PI / 2, 0, 0] : undefined;
  const select = (event) => {
    event.stopPropagation();
    onSelect?.(slot);
  };
  return (
    <group position={anchor.position} rotation={anchor.rotation}>
      <RoomDecor item={item} />
      <mesh
        position={[0, HIT_AREAS[slot][1] / 2, 0]}
        rotation={hitRotation}
        onClick={select}
        onPointerOver={(event) => {
          event.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <boxGeometry args={HIT_AREAS[slot]} />
        <primitive object={mat('#FFFFFF', 'plastic', { transparent: true, opacity: 0, depthWrite: false })} attach="material" />
      </mesh>
      {selected && (
        <mesh position={[0, 0.06, 0]} rotation={roomSlotRingRotation(slot)} material={mat('#3D8BFD', 'glow')}>
          <torusGeometry args={[slot === 'rug' ? 1.65 : 1.15, 0.055, 6, 32]} />
        </mesh>
      )}
    </group>
  );
}

function RoomShell() {
  return (
    <group>
      <mesh position={[0, -0.08, 0]} material={mat('#C89258', 'wood')} receiveShadow>
        <boxGeometry args={[8, 0.16, 7]} />
      </mesh>
      <mesh position={[0, 2.3, 3.45]} material={mat('#FFF3D7', 'plaster')}>
        <boxGeometry args={[8, 4.6, 0.16]} />
      </mesh>
      <mesh position={[-3.92, 2.3, 0]} material={mat('#F8E8C8', 'plaster')}>
        <boxGeometry args={[0.16, 4.6, 7]} />
      </mesh>
      <mesh position={[3.92, 2.3, 0]} material={mat('#F8E8C8', 'plaster')}>
        <boxGeometry args={[0.16, 4.6, 7]} />
      </mesh>
      <mesh position={[0, 0.16, 3.31]} material={mat('#9A6A38', 'wood')}>
        <boxGeometry args={[7.85, 0.22, 0.16]} />
      </mesh>
      <group position={[-2.35, 2.55, 3.28]}>
        <RoundedBox args={[2.15, 1.55, 0.12]} radius={0.04} material={mat('#9A6A38', 'wood')} />
        <mesh position={[0, 0, -0.08]} material={mat('#8ED4F7', 'plastic')}>
          <planeGeometry args={[1.8, 1.22]} />
        </mesh>
        <mesh position={[0, -0.42, -0.1]} material={mat('#78B85A', 'plastic')}>
          <planeGeometry args={[1.8, 0.38]} />
        </mesh>
        <mesh position={[0, 0, -0.13]} material={mat('#FFF8E8', 'wood')}>
          <boxGeometry args={[0.08, 1.25, 0.08]} />
        </mesh>
        <mesh position={[0, 0, -0.13]} material={mat('#FFF8E8', 'wood')}>
          <boxGeometry args={[1.82, 0.08, 0.08]} />
        </mesh>
      </group>
    </group>
  );
}

export function RoomScene({ profile, layout, selectedSlot, onSelectSlot, reducedMotion = false }) {
  const buddyRt = useMemo(() => ({ anim: 'idle', animT: 0 }), []);
  return (
    <group>
      <RoomShell />
      {ROOM_SLOTS.map((slot) => (
        <Slot
          key={slot}
          slot={slot}
          item={roomItemById(layout?.[slot])}
          selected={selectedSlot === slot}
          onSelect={onSelectSlot}
        />
      ))}
      {profile && (
        <group position={[0.7, 0.05, 0]} rotation={[0, -0.25, 0]}>
          <Buddy profile={profile} rt={buddyRt} castShadow={false} reducedMotion={reducedMotion} />
        </group>
      )}
    </group>
  );
}
