// Five original ~60s dance loops, synthesized like the rest of the game's
// audio. THE SYNC RULE: notes are scheduled ahead on the AudioContext clock,
// and songTime() derives from ctx.currentTime — the falling blobs read that.
// rAF renders; it never counts time.
import { getCtx, getMaster } from '../../systems/audio.js';

// note frequencies (Hz)
const E2 = 82.41, F2 = 87.31, G2 = 98.0, A2 = 110.0, Bb2 = 116.54, C3 = 130.81, D3 = 146.83, E3 = 164.81,
  C4 = 261.63, D4 = 293.66, E4 = 329.63, G4 = 392.0, A4 = 440.0, Bb4 = 466.16,
  C5 = 523.25, D5 = 587.33, E5 = 659.25, F5 = 698.46;
const _ = 0;

// Patterns are a 2-bar loop of 16 eighth-note slots (odd slots are off-beats,
// shifted by `eighth`: 0.5 = straight, 0.66 = swung). `bass` is one note per
// beat (8 slots). The loop repeats for `bars` bars; duration = bars*4*spb.
export const TRACKS = [
  {
    id: 'slowjam', name: 'Marshmallow Slow Jam', icon: '🧸', vibe: 'Chill & smooth', speed: 'Slow',
    bpm: 82, bars: 20, seed: 101, eighth: 0.5, melType: 'sine', melPeak: 0.055,
    kick:  [1,0,0,0,0,1,0,0, 1,0,0,0,0,1,0,0],
    snare: [0,0,1,0,0,0,1,0, 0,0,1,0,0,0,1,0],
    hat:   [1,0,1,0,1,0,1,0, 1,0,1,0,1,0,1,1],
    bass:  [C3,C3,A2,A2,F2,F2,G2,G2],
    mel:   [E4,_,G4,_,A4,_,G4,E4, D4,_,E4,_,C4,_,_,_],
  },
  {
    id: 'rnb', name: 'Velvet Boba', icon: '🧋', vibe: 'Smooth groove', speed: 'Medium',
    bpm: 94, bars: 24, seed: 102, eighth: 0.5, melType: 'triangle', melPeak: 0.045,
    kick:  [1,0,0,1,0,0,0,0, 1,0,0,1,0,1,0,0],
    snare: [0,0,1,0,0,0,1,0, 0,0,1,0,0,0,1,0],
    hat:   [1,1,1,1,1,1,1,1, 1,1,1,1,1,1,1,1],
    bass:  [A2,A2,C3,C3,D3,D3,E3,E3],
    mel:   [C5,_,A4,_,_,G4,A4,_, E4,_,G4,_,A4,_,C5,_],
  },
  {
    id: 'hiphop', name: 'Wobble Street', icon: '🎧', vibe: 'Swagger', speed: 'Medium',
    bpm: 104, bars: 26, seed: 103, eighth: 0.66, melType: 'square', melPeak: 0.028,
    kick:  [1,0,0,0,0,1,0,0, 1,0,0,1,0,0,0,0],
    snare: [0,0,1,0,0,0,1,0, 0,0,1,0,0,0,1,1],
    hat:   [1,1,1,1,1,1,1,1, 1,1,1,0,1,1,1,1],
    bass:  [E2,E2,G2,E2,A2,A2,G2,D3],
    mel:   [_,_,E4,_,G4,_,_,_, _,_,E4,G4,A4,_,G4,_],
  },
  {
    id: 'pop', name: 'Sunshine Sprint', icon: '🌞', vibe: 'Happy sprint', speed: 'Fast',
    bpm: 124, bars: 32, seed: 104, eighth: 0.5, melType: 'triangle', melPeak: 0.05,
    kick:  [1,0,1,0,1,0,1,0, 1,0,1,0,1,0,1,0],
    snare: [0,0,1,0,0,0,1,0, 0,0,1,0,0,0,1,0],
    hat:   [0,1,0,1,0,1,0,1, 0,1,0,1,0,1,0,1],
    bass:  [C3,C3,G2,G2,A2,A2,F2,F2],
    mel:   [E5,_,E5,D5,C5,_,G4,_, A4,_,C5,_,D5,C5,D5,E5],
  },
  {
    id: 'turbo', name: 'Turbo Taco', icon: '🌮', vibe: 'Chaos mode', speed: 'Fastest',
    bpm: 144, bars: 36, seed: 105, eighth: 0.5, melType: 'triangle', melPeak: 0.05,
    kick:  [1,0,1,0,1,0,1,0, 1,0,1,0,1,0,1,0],
    snare: [0,0,1,0,0,0,1,0, 0,0,1,0,0,0,1,1],
    hat:   [0,1,0,1,0,1,0,1, 0,1,0,1,0,1,1,1],
    bass:  [F2,F2,F2,F2,Bb2,Bb2,C3,C3],
    mel:   [C5,_,A4,C5,F5,_,C5,_, D5,C5,Bb4,C5,A4,_,G4,A4],
  },
];

export const trackById = Object.fromEntries(TRACKS.map((t) => [t.id, t]));

// ---------- tiny drum kit ----------
let noiseBuf = null;
function noise(ctx) {
  if (!noiseBuf) {
    const len = ctx.sampleRate * 0.5;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  const n = ctx.createBufferSource();
  n.buffer = noiseBuf;
  return n;
}
function kick(ctx, out, t) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  g.gain.setValueAtTime(0.001, t);
  g.gain.linearRampToValueAtTime(0.3, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
  o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.3);
}
function snare(ctx, out, t) {
  const n = noise(ctx);
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.9;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.001, t);
  g.gain.linearRampToValueAtTime(0.16, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
  n.connect(f); f.connect(g); g.connect(out); n.start(t); n.stop(t + 0.2);
  const o = ctx.createOscillator(), g2 = ctx.createGain();
  o.type = 'triangle'; o.frequency.value = 190;
  g2.gain.setValueAtTime(0.001, t);
  g2.gain.linearRampToValueAtTime(0.09, t + 0.004);
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  o.connect(g2); g2.connect(out); o.start(t); o.stop(t + 0.12);
}
function hat(ctx, out, t) {
  const n = noise(ctx);
  const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6500;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.001, t);
  g.gain.linearRampToValueAtTime(0.055, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  n.connect(f); f.connect(g); g.connect(out); n.start(t); n.stop(t + 0.07);
}
function tone(ctx, out, freq, t, type, peak, dur) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.1);
}

// ---------- track player ----------
// Returns { duration, songTime, stop }. songTime() < 0 during the 1s lead-in.
export function startTrack(track) {
  const ctx = getCtx(), master = getMaster();
  const bus = ctx.createGain();
  bus.gain.value = 0.9;
  bus.connect(master);
  const spb = 60 / track.bpm;
  const duration = track.bars * 4 * spb;
  const t0 = ctx.currentTime + 1.0;
  const totalSlots = track.bars * 8;
  const slotTime = (i) => t0 + (Math.floor(i / 2) + (i % 2 ? track.eighth : 0)) * spb;
  let slot = 0, stopped = false, timer;
  const tick = () => {
    if (stopped) return;
    // fell badly behind (tab hidden etc.) — skip past slots instead of
    // dumping all the missed notes at once
    while (slot < totalSlots && slotTime(slot) < ctx.currentTime - 0.05) slot++;
    // 1.5s lookahead on the audio clock — main-thread hitches can't smear it
    while (slot < totalSlots && slotTime(slot) < ctx.currentTime + 1.5) {
      const t = slotTime(slot), p = slot % 16;
      if (track.kick[p]) kick(ctx, bus, t);
      if (track.snare[p]) snare(ctx, bus, t);
      if (track.hat[p]) hat(ctx, bus, t);
      if (track.mel[p]) tone(ctx, bus, track.mel[p], t, track.melType, track.melPeak, spb * 1.6);
      if (slot % 2 === 0) {
        const b = track.bass[(slot / 2) % 8];
        if (b) tone(ctx, bus, b, t, 'triangle', 0.07, spb * 0.9);
      }
      slot++;
    }
    timer = setTimeout(tick, 120);
  };
  tick();
  return {
    duration,
    songTime: () => ctx.currentTime - t0,
    stop() {
      stopped = true;
      clearTimeout(timer);
      bus.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.08);
      setTimeout(() => bus.disconnect(), 500);
    },
  };
}

if (import.meta.env.DEV) window.__danceTracks = { TRACKS, startTrack };
