import React, { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { World } from './three/World.jsx';
import { PlayerController } from './three/PlayerController.jsx';
import { CinematicDriver } from './three/CinematicDriver.jsx';
import { Creator } from './ui/Creator.jsx';
import { HUD } from './ui/HUD.jsx';
import { AllPanels } from './ui/Panels.jsx';
import { IntroOverlay } from './ui/IntroOverlay.jsx';
import { MobileControls } from './ui/MobileControls.jsx';
import { ArcadeScreen } from './games/ArcadeScreen.jsx';
import { Curtain } from './ui/Curtain.jsx';
import { gameById } from './games/registry.js';
import { useGame } from './state/store.js';
import { initAudio } from './systems/audio.js';
import { startFramePump, SizeSync } from './three/framePump.js';

const LazyRoomScreen = React.lazy(() => import('./room/roomEntry.js'));

export default function App() {
  const screen = useGame((s) => s.screen);
  const arcade = useGame((s) => s.arcade);
  const roomOpen = useGame((s) => s.roomScene.open);
  const ActiveStage = arcade.game ? gameById[arcade.game]?.Stage : null;

  useEffect(() => { startFramePump(); }, []);

  // audio needs a user gesture; arm it on the first interaction
  useEffect(() => {
    const arm = () => { initAudio(); window.removeEventListener('pointerdown', arm); };
    window.addEventListener('pointerdown', arm);
    return () => window.removeEventListener('pointerdown', arm);
  }, []);

  return (
    <div className="app">
      {roomOpen ? (
        <>
          <Suspense fallback={<div className="room-loading">Opening Room 107...</div>}>
            <LazyRoomScreen />
          </Suspense>
          <Curtain />
        </>
      ) : screen === 'creator' ? (
        <Creator />
      ) : (
        <>
          <div className="canvas-wrap">
            <Canvas
              shadows
              frameloop="never"
              resize={{ debounce: 0 }}
              dpr={[1, 1.75]}
              camera={{ position: [0, 3.6, -14], fov: 46, near: 0.1, far: 400 }}
              gl={{ antialias: true }}
            >
              <color attach="background" args={[arcade.open ? '#1a1030' : '#8ed4f7']} />
              <SizeSync />
              {!arcade.open && <World />}
              {!arcade.open && <PlayerController cinematic={screen === 'cinematic'} />}
              {screen === 'cinematic' && !arcade.open && <CinematicDriver />}
              {ActiveStage && <ActiveStage />}
            </Canvas>
          </div>
          {screen === 'cinematic' && <IntroOverlay />}
          {screen === 'game' && !arcade.open && (
            <>
              <HUD />
              <MobileControls />
              <AllPanels />
            </>
          )}
          {screen === 'game' && arcade.open && <ArcadeScreen />}
          <Curtain />
        </>
      )}
    </div>
  );
}
