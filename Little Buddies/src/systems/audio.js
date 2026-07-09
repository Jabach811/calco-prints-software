// Tiny WebAudio ambience + SFX. Everything synthesized — no audio files.
let ctx = null;
let master = null;
let muted = localStorage.getItem('lbw-muted') === '1';
let started = false;
let ambientPaused = false;

export function getCtx() { return ctx; }
export function getMaster() { return master; }
export function setAmbientPaused(p) { ambientPaused = p; }

export function isMuted() { return muted; }

export function setMuted(m) {
  muted = m;
  localStorage.setItem('lbw-muted', m ? '1' : '0');
  if (master) master.gain.value = m ? 0 : 0.5;
}

export function initAudio() {
  if (started) return;
  started = true;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(ctx.destination);
    if (import.meta.env.DEV) window.__audio = { get t() { return ctx.currentTime; }, get state() { return ctx.state; } };
    startMusic();
    startChirps();
  } catch { started = false; }
}

function env(gainNode, t0, a, peak, d) {
  gainNode.gain.setValueAtTime(0.0001, t0);
  gainNode.gain.linearRampToValueAtTime(peak, t0 + a);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
}

function pluck(freq, t0, peak = 0.08, d = 1.2, type = 'sine') {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  env(g, t0, 0.01, peak, d);
  o.connect(g); g.connect(master);
  o.start(t0); o.stop(t0 + d + 0.1);
}

// Soundtrack: three composed music-box songs played in rotation, with a
// quiet breather (just the ambient chirps) between songs so nothing ever
// audibly restarts. Notes are scheduled on the AudioContext clock half a
// second ahead, so main-thread hitches can't smear the rhythm.
const F4 = 349.23, G4 = 392.0, A4 = 440.0, B4 = 493.88, C5 = 523.25, D5 = 587.33,
  E5 = 659.25, F5 = 698.46, G5 = 783.99, A5 = 880.0, B5 = 987.77, C6 = 1046.5, D6 = 1174.66;
const C3 = 130.81, D3 = 146.83, G2 = 98.0, A2 = 110.0, E2 = 82.41, F2 = 87.31, Bb2 = 116.54;
const _ = 0; // rest

const SONGS = [
  {
    // "Sunny Morning" — C pentatonic, gentle stroll. 16 bars of 8 eighth-notes.
    step: 0.32, spb: 8, peak: 0.045, decay: 1.5, shimmer: C6,
    mel: [
      E5, _, G5, _, A5, _, G5, _,
      E5, _, D5, _, C5, _, _, _,
      E5, _, G5, _, A5, _, C6, _,
      G5, _, _, _, _, _, D5, E5,
      A5, _, C6, _, D6, _, C6, _,
      A5, _, G5, _, E5, _, _, _,
      G5, _, A5, _, G5, _, E5, _,
      D5, _, C5, _, _, _, _, _,
      E5, _, G5, _, A5, _, G5, _,
      E5, _, D5, _, C5, _, _, _,
      C6, _, A5, _, G5, _, E5, _,
      G5, _, A5, G5, E5, _, D5, _,
      E5, _, G5, _, A5, _, C6, _,
      D6, _, C6, _, A5, _, G5, _,
      E5, _, G5, _, D5, _, E5, _,
      C5, _, _, _, _, _, _, _,
    ],
    bass: [C3, G2, A2, G2, A2, F2, C3, G2, C3, G2, A2, E2, F2, G2, C3, C3],
  },
  {
    // "Cloud Nap" — slow dreamy waltz feel. 12 bars of 6 steps.
    step: 0.42, spb: 6, peak: 0.035, decay: 2.0, shimmer: B5,
    mel: [
      B4, _, _, D5, _, _,
      E5, _, D5, B4, _, _,
      A4, _, _, B4, _, _,
      G4, _, _, _, _, _,
      B4, _, _, D5, _, _,
      E5, _, G5, E5, _, _,
      D5, _, B4, A4, _, _,
      B4, _, _, _, _, _,
      E5, _, _, G5, _, _,
      B5, _, G5, E5, _, _,
      D5, _, E5, D5, _, B4,
      G4, _, _, _, _, _,
    ],
    bass: [G2, E2, C3, G2, G2, C3, D3, E2, C3, G2, D3, G2],
  },
  {
    // "Puddle Jumps" — brighter and bouncier, F major. 12 bars of 8 steps.
    step: 0.27, spb: 8, peak: 0.05, decay: 0.9, shimmer: Infinity,
    mel: [
      A4, _, C5, _, D5, C5, A4, _,
      F4, _, G4, _, A4, _, _, _,
      A4, _, C5, _, D5, _, F5, _,
      D5, C5, A4, _, G4, _, _, _,
      C5, _, D5, _, F5, _, D5, _,
      C5, _, A4, _, G4, _, A4, _,
      F5, _, D5, _, C5, D5, C5, _,
      A4, _, G4, _, F4, _, _, _,
      A4, _, C5, _, D5, C5, A4, _,
      F4, _, G4, _, A4, _, C5, _,
      D5, _, C5, _, A4, G4, A4, _,
      F4, _, _, _, _, _, _, _,
    ],
    bass: [F2, D3, Bb2, C3, F2, Bb2, C3, C3, F2, D3, C3, F2],
  },
];

function startMusic() {
  let si = 0;
  let song = SONGS[0];
  let step = 0;
  let nextT = ctx.currentTime + 0.8;
  const tick = () => {
    if (!ctx) return;
    if (ambientPaused) {
      nextT = ctx.currentTime + 0.4; // hold the grid so resume doesn't dump missed notes
      setTimeout(tick, 300);
      return;
    }
    if (nextT < ctx.currentTime - 0.05) {
      // fell badly behind (tab hidden etc.) — jump forward on the grid instead
      // of dumping all the missed notes at once
      const behind = Math.ceil((ctx.currentTime - nextT) / song.step);
      step += behind;
      nextT += behind * song.step;
    }
    // 2.5s lookahead rides out hidden-tab timer throttling (timers drop to 1/s)
    while (nextT < ctx.currentTime + 2.5) {
      if (step >= song.mel.length) {
        // song over — breather, then the next one
        si = (si + 1) % SONGS.length;
        song = SONGS[si];
        step = 0;
        nextT += 14 + Math.random() * 10;
        continue;
      }
      if (step % song.spb === 0) pluck(song.bass[step / song.spb], nextT, 0.05, song.step * song.spb * 1.05, 'triangle');
      const f = song.mel[step];
      if (f) {
        pluck(f, nextT, song.peak, song.decay);
        if (f >= song.shimmer) pluck(f * 2, nextT + 0.02, 0.014, 1.0); // sparkle on the highest notes
      }
      step++;
      nextT += song.step;
    }
    setTimeout(tick, 150);
  };
  tick();
}

function startChirps() {
  const chirp = () => {
    if (!ctx) return;
    if (!ambientPaused) {
      const t0 = ctx.currentTime + 0.05;
      const base = 2200 + Math.random() * 1200;
      for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'sine';
        const t = t0 + i * 0.09;
        o.frequency.setValueAtTime(base, t);
        o.frequency.exponentialRampToValueAtTime(base * 1.4, t + 0.06);
        env(g, t, 0.005, 0.02, 0.1);
        o.connect(g); g.connect(master);
        o.start(t); o.stop(t + 0.2);
      }
    }
    setTimeout(chirp, 4000 + Math.random() * 9000);
  };
  setTimeout(chirp, 3000);
}

export function sfx(kind) {
  if (!ctx) return;
  const t = ctx.currentTime + 0.02;
  switch (kind) {
    case 'blip': pluck(720, t, 0.06, 0.15); break;
    case 'pop': pluck(340, t, 0.09, 0.18, 'triangle'); pluck(680, t + 0.03, 0.05, 0.12); break;
    case 'chime': [880, 1108.7, 1318.5].forEach((f, i) => pluck(f, t + i * 0.07, 0.05, 1.2)); break;
    case 'ding': pluck(1567.98, t, 0.09, 1.8); pluck(3135.96, t, 0.03, 1.2); break;
    case 'splash': {
      const n = ctx.createBufferSource();
      const len = ctx.sampleRate * 0.5;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      n.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
      const g = ctx.createGain(); env(g, t, 0.01, 0.16, 0.45);
      n.connect(f); f.connect(g); g.connect(master);
      n.start(t);
      break;
    }
    case 'whoosh': {
      const n = ctx.createBufferSource();
      const len = ctx.sampleRate * 1.2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.6;
      n.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
      f.frequency.setValueAtTime(300, t);
      f.frequency.exponentialRampToValueAtTime(1800, t + 1.1);
      const g = ctx.createGain(); env(g, t, 0.15, 0.12, 1.0);
      n.connect(f); f.connect(g); g.connect(master);
      n.start(t);
      break;
    }
    case 'tada': [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => pluck(f, t + i * 0.09, 0.07, 1.0)); break;
    case 'coin': pluck(987.77, t, 0.06, 0.4); pluck(1318.5, t + 0.07, 0.06, 0.5); break;
  }
}
