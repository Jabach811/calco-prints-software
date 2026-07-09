// Drives R3F frames manually: rAF while visible, a Worker timer while the tab
// is hidden (rAF freezes in hidden tabs, which would stall the whole world).
// SizeSync replaces ResizeObserver-based sizing, which is also frozen when hidden.
import { useRef } from 'react';
import { advance, useThree, useFrame } from '@react-three/fiber';
import { playerRt, camRt } from '../state/rt.js';
import { inputRt } from '../state/input.js';
import { useGame } from '../state/store.js';

export function SizeSync() {
  const gl = useThree((s) => s.gl);
  const setSize = useThree((s) => s.setSize);
  const size = useThree((s) => s.size);
  const n = useRef(0);
  useFrame(() => {
    if (n.current++ % 15) return;
    const el = gl.domElement.parentElement;
    if (!el) return;
    const w = el.clientWidth, h = el.clientHeight;
    if (w && h && (Math.abs(w - size.width) > 1 || Math.abs(h - size.height) > 1)) setSize(w, h);
  });
  return null;
}

let started = false;

export function startFramePump() {
  if (started) return;
  started = true;
  if (import.meta.env.DEV) {
    window.__advance = (t = performance.now()) => advance(t / 1000); // lets tooling render a frame synchronously for captures
    window.__dev = { playerRt, camRt, inputRt, game: useGame };
  }
  // holding a web lock opts the page out of Chrome's hidden-tab freezing
  try { navigator.locks?.request('little-buddies-alive', () => new Promise(() => {})); } catch { /* optional */ }
  // advance() in frameloop="never" mode uses the timestamp as the clock's
  // elapsedTime verbatim — it expects SECONDS, not the ms that rAF hands us.
  let raf;
  const loop = (t) => {
    advance(t / 1000);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  const blob = new Blob(['setInterval(() => postMessage(0), 33)'], { type: 'text/javascript' });
  const worker = new Worker(URL.createObjectURL(blob));
  let ticks = 0;
  let lastEnd = 0;
  worker.onmessage = () => {
    if (!document.hidden) return;
    const f0 = performance.now();
    // Backlog guard: if this tick queued up while the last frame was still
    // rendering, drop it — otherwise slow frames snowball into a queue that
    // never drains and the tab appears permanently hung.
    if (f0 - lastEnd < 20) return;
    advance(f0 / 1000);
    lastEnd = performance.now();
    // rAF + ResizeObserver are frozen while hidden; a resize event makes
    // react-use-measure re-measure so the Canvas root can (re)size itself
    if (ticks++ % 30 === 0) window.dispatchEvent(new Event('resize'));
  };
}
