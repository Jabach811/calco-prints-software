import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGame } from '../state/store.js';
import { SizeSync } from '../three/framePump.js';
import { WELCOME_OBJECTIVES } from './roomModel.js';
import { RoomEditor } from './RoomEditor.jsx';
import { RoomScene } from './RoomScene.jsx';

export function getReducedMotionPreference(query) {
  return Boolean(query?.matches);
}

export function subscribeToReducedMotion(query, onChange) {
  if (!query) return () => {};
  if (query.addEventListener) {
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }
  query.addListener?.(onChange);
  return () => query.removeListener?.(onChange);
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => (
    typeof window !== 'undefined'
      && getReducedMotionPreference(window.matchMedia('(prefers-reduced-motion: reduce)'))
  ));

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = (event) => setReduced(event.matches);
    setReduced(getReducedMotionPreference(query));
    return subscribeToReducedMotion(query, update);
  }, []);
  return reduced;
}

export function RoomScreen() {
  const profile = useGame((s) => s.profile);
  const progress = useGame((s) => s.progress);
  const editingSlot = useGame((s) => s.roomScene.editingSlot);
  const curtain = useGame((s) => s.curtain);
  const selectRoomSlot = useGame((s) => s.selectRoomSlot);
  const equipRoomItem = useGame((s) => s.equipRoomItem);
  const removeRoomItem = useGame((s) => s.removeRoomItem);
  const exitRoom = useGame((s) => s.exitRoom);
  const reducedMotion = useReducedMotion();
  const journeyStep = progress.journeys?.welcomeHome?.step;
  const objective = WELCOME_OBJECTIVES[journeyStep] ?? null;

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      if (editingSlot) {
        selectRoomSlot(null);
      } else if (!curtain) {
        exitRoom();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [curtain, editingSlot, exitRoom, selectRoomSlot]);

  return (
    <main className="room-screen">
      <div className="room-canvas-wrap">
        <Canvas
          shadows
          frameloop="never"
          resize={{ debounce: 0 }}
          dpr={[1, 1.75]}
          camera={{ position: [0, 3.1, -9.8], fov: 48, near: 0.1, far: 100 }}
          gl={{ antialias: true }}
        >
          <color attach="background" args={['#8ED4F7']} />
          <ambientLight intensity={1.15} />
          <directionalLight position={[-3, 7, -4]} intensity={1.8} />
          <SizeSync />
          <RoomScene
            profile={profile}
            layout={progress.roomLayout}
            selectedSlot={editingSlot}
            onSelectSlot={selectRoomSlot}
            reducedMotion={reducedMotion}
          />
        </Canvas>
      </div>
      <header className="room-header">
        <div>
          <p className="room-kicker">Your space</p>
          <h1>Room 107</h1>
          {objective && <p className="room-objective">Journey: {objective}</p>}
        </div>
        <button type="button" className="room-exit-button" onClick={exitRoom} disabled={Boolean(curtain)}>
          Back outside
        </button>
      </header>
      <RoomEditor
        inventory={progress.roomInventory}
        layout={progress.roomLayout}
        editingSlot={editingSlot}
        onSelectSlot={selectRoomSlot}
        onEquip={equipRoomItem}
        onRemove={removeRoomItem}
        onBack={() => selectRoomSlot(null)}
      />
    </main>
  );
}
