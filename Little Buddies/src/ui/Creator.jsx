// Quick-creator fallback: pick shape, color, face, hat, temperament, name.
// The real website creator will POST the same profile JSON shape later.
import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Buddy } from '../three/Buddy.jsx';
import { SizeSync } from '../three/framePump.js';
import { ACCENT, HAT_COLORS } from '../data/palette.js';
import { TEMPERAMENTS, CURATED_NAMES } from '../data/dialogue.js';
import { DEFAULT_PROFILE, useGame } from '../state/store.js';
import { initAudio, sfx } from '../systems/audio.js';

const INK = '#33313b';
const FAINT = '#ddd3c2';
const LINE = '#42222e';

const SHAPES = [
  { id: 'blob', label: 'Blob' },
  { id: 'mochi', label: 'Mochi' },
  { id: 'ghost', label: 'Ghost' },
  { id: 'star', label: 'Star' },
  { id: 'droplet', label: 'Droplet' },
  { id: 'tofu', label: 'Tofu' },
  { id: 'pear', label: 'Pear' },
];
const EYES = [
  { id: 'plain', label: 'Soft Round' },
  { id: 'oval', label: 'Oval' },
  { id: 'wide', label: 'Curious' },
  { id: 'dot', label: 'Tiny Dots' },
  { id: 'sleepy', label: 'Sleepy' },
  { id: 'calm', label: 'Calm' },
  { id: 'sparkle', label: 'Starry' },
  { id: 'mischief', label: 'Mischief' },
];
const BROWS = [
  { id: 'happy', label: 'Happy' },
  { id: 'neutral', label: 'Neutral' },
  { id: 'curious', label: 'Curious' },
  { id: 'surprised', label: 'Surprised' },
  { id: 'sad', label: 'Sad' },
  { id: 'angry', label: 'Angry' },
];
const MOUTHS = [
  { id: 'smile', label: 'Big Smile' },
  { id: 'soft', label: 'Small Smile' },
  { id: 'grin', label: 'Tiny Grin' },
  { id: 'laugh', label: 'Laugh' },
  { id: 'smirk', label: 'Smirk' },
  { id: 'o', label: 'Little O' },
  { id: 'shy', label: 'Shy' },
  { id: 'neutral', label: 'Neutral' },
];
const HATS = [
  { id: 'none', label: 'None' },
  { id: 'beanie', label: 'Beanie' },
  { id: 'cap', label: 'Cap' },
  { id: 'party', label: 'Party Hat' },
  { id: 'wizard', label: 'Wizard' },
  { id: 'bucket', label: 'Bucket' },
  { id: 'crown', label: 'Crown' },
  { id: 'tophat', label: 'Top Hat' },
  { id: 'sunglasses', label: 'Shades' },
];
const COLORABLE_HATS = new Set(['beanie', 'cap', 'party', 'wizard', 'bucket', 'crown', 'tophat']);

// ---------- option-tile icons: one hand-drawn SVG system ----------

function ShapeIcon({ id, color }) {
  if (id === 'star') {
    return (
      <svg viewBox="0 0 40 40" className="tile-svg" aria-hidden="true">
        <polygon points="20,6 25,16.1 36.2,17.7 28.1,25.6 30,36.8 20,31.5 10,36.8 11.9,25.6 3.8,17.7 15,16.1" fill={color} />
      </svg>
    );
  }
  if (id === 'tofu') {
    return (
      <svg viewBox="0 0 40 40" className="tile-svg" aria-hidden="true">
        <rect x="5" y="9" width="30" height="26" rx="9" fill={color} />
      </svg>
    );
  }
  const d = {
    blob: 'M20 4 C29 6 33 15 33 24 C33 33 27 38 20 38 C13 38 7 33 7 24 C7 15 11 6 20 4 Z',
    mochi: 'M20 12 C31 12 36 17 36 25 C36 33 29 37 20 37 C11 37 4 33 4 25 C4 17 9 12 20 12 Z',
    ghost: 'M6 24 a14 16 0 0 1 28 0 l0 8 a3.5 4 0 0 1 -7 0 a3.5 4 0 0 1 -7 0 a3.5 4 0 0 1 -7 0 a3.5 4 0 0 1 -7 0 Z',
    droplet: 'M20 3 C26 12 31 18 31 26 A11 11 0 1 1 9 26 C9 18 14 12 20 3 Z',
    pear: 'M20 4 C23 9 25 13 28 18 C31 22 32 25 32 28 A12 10 0 1 1 8 28 C8 25 9 22 12 18 C15 13 17 9 20 4 Z',
  }[id];
  return (
    <svg viewBox="0 0 40 40" className="tile-svg" aria-hidden="true">
      <path d={d} fill={color} />
    </svg>
  );
}

function EyeIcon({ id }) {
  const hi = (cx, cy = 12.4, r = 1.8) => <circle cx={cx} cy={cy} r={r} fill="#fff" />;
  return (
    <svg viewBox="0 0 48 30" className="tile-svg" aria-hidden="true">
      {id === 'sleepy' ? (
        <g stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M10 17 Q16 9.5 22 17" />
          <path d="M26 17 Q32 9.5 38 17" />
        </g>
      ) : (
        [-1, 1].map((s) => {
          const cx = 24 + s * 8;
          switch (id) {
            case 'oval': return <g key={s}><ellipse cx={cx} cy="15" rx="4" ry="7.5" fill={INK} />{hi(cx + 1.4, 11.6, 1.6)}</g>;
            case 'wide': return <g key={s}><ellipse cx={cx} cy="15" rx="6.3" ry="7.5" fill={INK} />{hi(cx + 2, 11.8, 2)}{hi(cx - 2.4, 18, 1.1)}</g>;
            case 'dot': return <g key={s}><circle cx={cx} cy="15" r="2.7" fill={INK} />{hi(cx + 0.9, 14, 0.9)}</g>;
            case 'calm': return <g key={s}><ellipse cx={cx} cy="15" rx="5.8" ry="3.4" fill={INK} />{hi(cx + 2, 13.9, 1.3)}</g>;
            case 'sparkle': return <g key={s}><ellipse cx={cx} cy="15" rx="5" ry="6.5" fill={INK} />{hi(cx + 1.7)}<circle cx={cx - 2.2} cy="16.6" r="1.7" fill="#f5c542" /></g>;
            case 'mischief': return <g key={s} transform={`rotate(${s * -14} ${cx} 15)`}><ellipse cx={cx} cy="15" rx="5.6" ry="4.4" fill={INK} />{hi(cx + 1.8, 13.4, 1.4)}</g>;
            default: return <g key={s}><ellipse cx={cx} cy="15" rx="5" ry="6.5" fill={INK} />{hi(cx + 1.7)}</g>;
          }
        })
      )}
    </svg>
  );
}

function BrowIcon({ id }) {
  const paths = {
    happy: ['M10.5 13 Q16 6.5 21.5 13', 'M26.5 13 Q32 6.5 37.5 13'],
    neutral: ['M10.5 11.5 L21.5 11.5', 'M26.5 11.5 L37.5 11.5'],
    curious: ['M10.5 12.5 L21.5 12.5', 'M26.5 10 Q32 3.5 37.5 10'],
    surprised: ['M11 9 Q16 3 21 9', 'M27 9 Q32 3 37 9'],
    sad: ['M10.5 13 L21.5 8.5', 'M26.5 8.5 L37.5 13'],
    angry: ['M10.5 8.5 L21.5 13', 'M26.5 13 L37.5 8.5'],
  };
  return (
    <svg viewBox="0 0 48 30" className="tile-svg" aria-hidden="true">
      <circle cx="16" cy="22.5" r="3.8" fill={FAINT} />
      <circle cx="32" cy="22.5" r="3.8" fill={FAINT} />
      <g stroke={INK} strokeWidth="3.2" strokeLinecap="round" fill="none">
        {(paths[id] || paths.neutral).map((d) => <path key={d} d={d} />)}
      </g>
    </svg>
  );
}

function MouthIcon({ id }) {
  const arc = (d, w = 3) => <path d={d} stroke={LINE} strokeWidth={w} strokeLinecap="round" fill="none" />;
  return (
    <svg viewBox="0 0 48 30" className="tile-svg" aria-hidden="true">
      {id === 'smile' && arc('M13 10 Q24 23 35 10', 4)}
      {id === 'soft' && arc('M17 12 Q24 19 31 12')}
      {id === 'grin' && arc('M19.5 13 Q24 17.5 28.5 13')}
      {id === 'smirk' && arc('M17 15 Q25 19.5 31 10.5')}
      {id === 'shy' && arc('M20.5 14.5 Q24 17.5 27.5 14.5', 2.6)}
      {id === 'neutral' && arc('M17.5 15 L30.5 15')}
      {id === 'o' && <circle cx="24" cy="15" r="4.5" stroke={LINE} strokeWidth="3" fill="none" />}
      {id === 'laugh' && (
        <g>
          <path d="M15.5 11 L32.5 11 A8.5 8 0 0 1 15.5 11 Z" fill="#5b2333" />
          <ellipse cx="24" cy="16.2" rx="4.2" ry="2.6" fill="#e2556b" />
        </g>
      )}
    </svg>
  );
}

function HatIcon({ id, color }) {
  const dark = 'rgba(0,0,0,0.22)';
  return (
    <svg viewBox="0 0 44 34" className="tile-svg" aria-hidden="true">
      {id === 'none' && <circle cx="22" cy="17" r="10" fill="none" stroke="#c9bfa9" strokeWidth="2.4" strokeDasharray="3.5 4.5" />}
      {id === 'beanie' && (
        <g>
          <path d="M9 21 A13 14 0 0 1 35 21 Z" fill={color} />
          <rect x="7" y="20" width="30" height="6.5" rx="3" fill={color} />
          <rect x="7" y="20" width="30" height="6.5" rx="3" fill={dark} />
          <circle cx="22" cy="6.5" r="4" fill="#fff6e5" />
        </g>
      )}
      {id === 'cap' && (
        <g>
          <path d="M8 22 A12 13 0 0 1 32 22 Z" fill={color} />
          <rect x="29" y="19" width="13" height="5" rx="2.5" fill={color} />
          <rect x="29" y="19" width="13" height="5" rx="2.5" fill={dark} />
          <circle cx="20" cy="8" r="1.8" fill="#fff6e5" />
        </g>
      )}
      {id === 'party' && (
        <g>
          <path d="M22 6 L30.5 28 L13.5 28 Z" fill={color} />
          <circle cx="22" cy="5.5" r="3.6" fill="#fff" />
        </g>
      )}
      {id === 'wizard' && (
        <g>
          <path d="M22 2 L33 25 L11 25 Z" fill={color} />
          <ellipse cx="22" cy="25.5" rx="16" ry="4" fill={color} />
          <ellipse cx="22" cy="25.5" rx="16" ry="4" fill={dark} />
        </g>
      )}
      {id === 'bucket' && (
        <g>
          <path d="M15 10 L29 10 L31.5 21 L12.5 21 Z" fill={color} />
          <path d="M12.5 21 L31.5 21 L35 28 L9 28 Z" fill={color} />
          <path d="M12.5 21 L31.5 21 L35 28 L9 28 Z" fill={dark} />
        </g>
      )}
      {id === 'crown' && <path d="M11 27 L11 12 L17 18.5 L22 8 L27 18.5 L33 12 L33 27 Z" fill={color} />}
      {id === 'tophat' && (
        <g>
          <rect x="14" y="5" width="16" height="17" rx="2" fill={color} />
          <rect x="8" y="20.5" width="28" height="5.5" rx="2.75" fill={color} />
          <rect x="14" y="15" width="16" height="4.5" fill={dark} />
        </g>
      )}
      {id === 'sunglasses' && (
        <g fill={INK}>
          <rect x="5" y="12" width="14" height="10" rx="4" />
          <rect x="25" y="12" width="14" height="10" rx="4" />
          <rect x="17" y="14.5" width="10" height="3" rx="1.5" />
        </g>
      )}
    </svg>
  );
}

function DieIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
      {[[8.3, 8.3], [15.7, 8.3], [12, 12], [8.3, 15.7], [15.7, 15.7]].map(([x, y]) => (
        <circle key={x + ',' + y} cx={x} cy={y} r="1.6" fill="currentColor" />
      ))}
    </svg>
  );
}

// ---------- the creator ----------

function Turntable({ profile }) {
  const rt = useMemo(() => ({ anim: 'idle', animT: 0, holding: null }), []);
  const group = useRef();
  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.y = Math.sin(clock.elapsedTime * 0.6) * 0.6;
  });
  return (
    <group ref={group} position={[0, -0.78, 0]} scale={1.15}>
      <Buddy profile={profile} rt={rt} castShadow={false} />
      <mesh position={[0, -0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.1, 28]} />
        <meshStandardMaterial color="#e8d8b8" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Section({ label, children }) {
  return (
    <div className="creator-section">
      <div className="creator-label">{label}</div>
      {children}
    </div>
  );
}

function TileGrid({ options, value, onPick, renderIcon }) {
  return (
    <div className="tile-grid">
      {options.map((o) => (
        <button
          key={o.id}
          className={'part-tile' + (value === o.id ? ' active' : '')}
          onClick={() => onPick(o.id)}
          title={o.label}
        >
          {renderIcon(o)}
          <span className="part-name">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export function Creator() {
  const [p, setP] = useState({ ...DEFAULT_PROFILE });
  const upd = (patch) => { setP((prev) => ({ ...prev, ...patch })); sfx('blip'); };
  const shuffleName = () => upd({ name: CURATED_NAMES[Math.floor(Math.random() * CURATED_NAMES.length)] });
  const bodyColor = ACCENT[p.color] || ACCENT.green;
  const hatColor = HAT_COLORS[p.hatColor] || HAT_COLORS.red;

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
          <button className="round-btn shuffle-btn" title="New name" onClick={shuffleName}><DieIcon /></button>
        </div>
      </div>

      <div className="creator-right">
        <Section label="Shape">
          <TileGrid options={SHAPES} value={p.shape} onPick={(id) => upd({ shape: id })} renderIcon={(o) => <ShapeIcon id={o.id} color={bodyColor} />} />
        </Section>
        <Section label="Color">
          <div className="chip-row">
            {Object.entries(ACCENT).map(([name, hex]) => (
              <button
                key={name}
                className={'swatch' + (p.color === name ? ' active' : '')}
                style={{ background: hex }}
                title={name}
                onClick={() => upd({ color: name })}
              />
            ))}
          </div>
        </Section>
        <Section label="Eyes">
          <TileGrid options={EYES} value={p.eyes} onPick={(id) => upd({ eyes: id })} renderIcon={(o) => <EyeIcon id={o.id} />} />
        </Section>
        <Section label="Eyebrows">
          <TileGrid options={BROWS} value={p.brows} onPick={(id) => upd({ brows: id })} renderIcon={(o) => <BrowIcon id={o.id} />} />
        </Section>
        <Section label="Mouth">
          <TileGrid options={MOUTHS} value={p.mouth} onPick={(id) => upd({ mouth: id })} renderIcon={(o) => <MouthIcon id={o.id} />} />
        </Section>
        <Section label="Hat & Extras">
          <TileGrid options={HATS} value={p.accessory} onPick={(id) => upd({ accessory: id })} renderIcon={(o) => <HatIcon id={o.id} color={hatColor} />} />
          {COLORABLE_HATS.has(p.accessory) && (
            <div className="hat-color-row">
              <span className="hat-color-label">Hat color</span>
              {Object.entries(HAT_COLORS).map(([name, hex]) => (
                <button
                  key={name}
                  className={'swatch small' + (p.hatColor === name ? ' active' : '')}
                  style={{ background: hex }}
                  title={name}
                  onClick={() => upd({ hatColor: name })}
                />
              ))}
            </div>
          )}
        </Section>
        <Section label="Personality">
          <div className="chip-row">
            {TEMPERAMENTS.map((t) => (
              <button key={t} className={'choice-chip' + (p.temperament === t ? ' active' : '')} onClick={() => upd({ temperament: t })}>
                {t}
              </button>
            ))}
          </div>
        </Section>
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
