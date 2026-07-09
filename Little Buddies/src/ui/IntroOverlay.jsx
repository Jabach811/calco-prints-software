// DOM half of the intro: darkness, golden seam, parting light curtains,
// drifting sparkle motes, close-up vignette, skip button.
import React, { useEffect, useMemo, useState } from 'react';
import { introClock, introElapsed } from '../state/introClock.js';
import { useGame } from '../state/store.js';

export function IntroOverlay() {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf;
    const loop = () => {
      setT(introElapsed());
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const motes = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        left: 30 + Math.random() * 40,
        delay: Math.random() * 4,
        dur: 3 + Math.random() * 3,
        size: 3 + Math.random() * 6,
      })),
    []
  );

  // curtain opening: 0 at t<2, fully open at t=4.4
  const open = Math.max(0, Math.min(1, (t - 2) / 2.4));
  const seam = Math.max(0, Math.min(1, t / 1.6));
  const dark = t < 2 ? 1 : Math.max(0, 1 - (t - 2) / 1.8);
  const vignette = t > 4.6 && t < 7.2 ? Math.min(1, (t - 4.6) / 0.8) * (t > 6.6 ? Math.max(0, 1 - (t - 6.6) / 0.6) : 1) : 0;
  const sparkleOpacity = t < 8 ? Math.min(1, t / 1.5) * (t > 6.5 ? Math.max(0.25, 1 - (t - 6.5) / 1.5) : 1) : 0;

  return (
    <div className="intro-overlay">
      {/* curtains */}
      <div
        className="curtain left"
        style={{ transform: `translateX(${-open * 62}vw) skewX(${-open * 4}deg)`, opacity: Math.max(0.25, 1 - open * 0.9) }}
      />
      <div
        className="curtain right"
        style={{ transform: `translateX(${open * 62}vw) skewX(${open * 4}deg)`, opacity: Math.max(0.25, 1 - open * 0.9) }}
      />
      {/* black backdrop before the seam opens */}
      <div className="intro-dark" style={{ opacity: dark }} />
      {/* golden seam */}
      {t < 4.6 && (
        <div className="seam" style={{ opacity: Math.min(1, seam * 1.4) * (t > 3.4 ? Math.max(0, 1 - (t - 3.4) / 1.2) : 1), transform: `translateX(-50%) scaleX(${1 + open * 26})` }} />
      )}
      {/* golden sparkle motes */}
      <div className="motes" style={{ opacity: sparkleOpacity }}>
        {motes.map((m, i) => (
          <span
            key={i}
            className="mote"
            style={{ left: `${m.left}%`, animationDelay: `${m.delay}s`, animationDuration: `${m.dur}s`, width: m.size, height: m.size }}
          />
        ))}
      </div>
      {/* close-up dreamy vignette */}
      <div className="intro-vignette" style={{ opacity: vignette }} />
      <button
        className="skip-btn"
        onClick={() => {
          introClock.skipped = true;
        }}
      >
        Skip ▸
      </button>
    </div>
  );
}
