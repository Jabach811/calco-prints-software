// Quick-creator fallback: pick shape, color, face, hat, temperament, name.
// The real website creator will POST the same profile JSON shape later.
import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Buddy } from '../three/Buddy.jsx';
import { SizeSync } from '../three/framePump.js';
import { ACCENT } from '../data/palette.js';
import { TEMPERAMENTS, CURATED_NAMES } from '../data/dialogue.js';
import { DEFAULT_PROFILE, useGame } from '../state/store.js';
import { initAudio, sfx } from '../systems/audio.js';

const SHAPES = [
  { id: 'blob', label: 'Blob', icon: '🥚' },
  { id: 'ghost', label: 'Ghost', icon: '👻' },
  { id: 'star', label: 'Star', icon: '⭐' },
  { id: 'droplet', label: 'Droplet', icon: '💧' },
];
const EYES = [
  { id: 'plain', label: 'Glossy' },
  { id: 'sparkle', label: 'Sparkle' },
  { id: 'sunglasses', label: 'Shades' },
];
const BROWS = [
  { id: 'happy', label: 'Happy' },
  { id: 'determined', label: 'Determined' },
  { id: 'grumpy', label: 'Grumpy-sweet' },
];
const MOUTHS = [
  { id: 'smile', label: 'Big smile' },
  { id: 'grin', label: 'Buck-tooth' },
  { id: 'smirk', label: 'Smirk' },
  { id: 'o', label: 'Little o' },
];
const HATS = [
  { id: 'partyhat', label: 'Party hat' },
  { id: 'rainbowhat', label: 'Rainbow hat' },
  { id: 'crowngold', label: 'Gold crown' },
  { id: 'crownwhite', label: 'White crown' },
  { id: 'sunglasses', label: 'Sunglasses' },
  { id: 'none', label: 'Nothing' },
];

function Turntable({ profile }) {
  const rt = useMemo(() => ({ anim: 'idle', animT: 0, holding: null }), []);
  const group = useRef();
  useFrame(({ clock }, dt) => {
    if (group.current) group.current.rotation.y = Math.sin(clock.elapsedTime * 0.6) * 0.6;
  });
  return (
    <group ref={group} position={[0, -0.75, 0]} scale={1.25}>
      <Buddy profile={profile} rt={rt} castShadow={false} />
      <mesh position={[0, -0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.1, 28]} />
        <meshStandardMaterial color="#e8d8b8" roughness={0.9} />
      </mesh>
    </group>
  );
}

export function Creator() {
  const [p, setP] = useState({ ...DEFAULT_PROFILE });
  const upd = (patch) => { setP((prev) => ({ ...prev, ...patch })); sfx('blip'); };
  const shuffleName = () => upd({ name: CURATED_NAMES[Math.floor(Math.random() * CURATED_NAMES.length)] });

  return (
    <div className="creator">
      <div className="creator-left">
        <div className="creator-logo">
          <span className="logo-little">Little</span>
          <span className="logo-buddies">Buddies</span>
        </div>
        <div className="creator-preview">
          <Canvas frameloop="never" resize={{ debounce: 0 }} camera={{ position: [0, 0.4, 3.4], fov: 40 }} dpr={[1, 2]}>
            <SizeSync />
            <hemisphereLight args={['#cdeaff', '#e8dcc0', 0.9]} />
            <directionalLight position={[3, 5, 4]} intensity={1.4} color="#fff1d6" />
            <Turntable profile={p} />
          </Canvas>
        </div>
        <div className="creator-name">
          <span className="creator-name-text">{p.name}</span>
          <button className="round-btn" title="New name" onClick={shuffleName}>🎲</button>
        </div>
      </div>

      <div className="creator-right">
        <div className="creator-section">
          <div className="creator-label">Shape</div>
          <div className="chip-row">
            {SHAPES.map((s) => (
              <button key={s.id} className={'choice-chip' + (p.shape === s.id ? ' active' : '')} onClick={() => upd({ shape: s.id })}>
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="creator-section">
          <div className="creator-label">Color</div>
          <div className="chip-row">
            {Object.entries(ACCENT).map(([name, hex]) => (
              <button
                key={name}
                className={'swatch' + (p.color === name ? ' active' : '')}
                style={{ background: hex }}
                onClick={() => upd({ color: name })}
              />
            ))}
          </div>
        </div>
        <div className="creator-section">
          <div className="creator-label">Eyes</div>
          <div className="chip-row">
            {EYES.map((e) => (
              <button key={e.id} className={'choice-chip' + (p.eyes === e.id ? ' active' : '')} onClick={() => upd({ eyes: e.id })}>
                {e.label}
              </button>
            ))}
          </div>
        </div>
        <div className="creator-section">
          <div className="creator-label">Eyebrows</div>
          <div className="chip-row">
            {BROWS.map((b) => (
              <button key={b.id} className={'choice-chip' + (p.brows === b.id ? ' active' : '')} onClick={() => upd({ brows: b.id })}>
                {b.label}
              </button>
            ))}
          </div>
        </div>
        <div className="creator-section">
          <div className="creator-label">Mouth</div>
          <div className="chip-row">
            {MOUTHS.map((m) => (
              <button key={m.id} className={'choice-chip' + (p.mouth === m.id ? ' active' : '')} onClick={() => upd({ mouth: m.id })}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <div className="creator-section">
          <div className="creator-label">Hat</div>
          <div className="chip-row">
            {HATS.map((h) => (
              <button key={h.id} className={'choice-chip' + (p.accessory === h.id ? ' active' : '')} onClick={() => upd({ accessory: h.id })}>
                {h.label}
              </button>
            ))}
          </div>
        </div>
        <div className="creator-section">
          <div className="creator-label">Personality</div>
          <div className="chip-row">
            {TEMPERAMENTS.map((t) => (
              <button key={t} className={'choice-chip' + (p.temperament === t ? ' active' : '')} onClick={() => upd({ temperament: t })}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <button
          className="enter-world-btn"
          onClick={() => {
            initAudio();
            sfx('tada');
            useGame.getState().setProfile(p);
          }}
        >
          Enter World ▶
        </button>
      </div>
    </div>
  );
}
