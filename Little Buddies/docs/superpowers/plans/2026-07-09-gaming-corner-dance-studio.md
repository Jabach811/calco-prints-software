# Gaming Corner + Dance Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Gaming Corner arcade to the Little Buddies world with one fully playable DDR-style rhythm game (Dance Studio) where the falling notes are dancing blobs, plus two locked "coming soon" game tiles.

**Architecture:** The world gets an arcade building wired into the existing interactable system. Entering plays a curtain transition into a 2D game-select screen driven by a game registry. The Dance Studio splits into a pure-logic rhythm engine (tested with vitest), synthesized music on the Web Audio clock (the existing pattern in `audio.js` — no Tone.js), seeded chart generation, and a 3D stage rendered in the app's existing single `<Canvas>` starring the player's own buddy.

**Tech Stack:** React 18, React Three Fiber 8, drei, zustand, raw Web Audio, vitest (new devDep, logic tests only).

Spec: `docs/superpowers/specs/2026-07-09-gaming-corner-dance-studio-design.md`

**Conventions used throughout:**
- Lanes are `0=left, 1=up, 2=down, 3=right`. Times are **seconds from beat 0** of the song (audio clock derived, never frame counting).
- All work happens on `main` (matches this repo's history). Commit after every task.
- Preview verification uses the `preview_*` tools. Dev server: `npm run dev` (vite, port 5173).
- The repo git root is `Software/`; all paths below are relative to `Software/Little Buddies/`.

---

## File structure

| File | Responsibility |
|---|---|
| `src/games/registry.js` (new) | List of games: id, name, status, UI + Stage components |
| `src/games/ArcadeScreen.jsx` (new) | Full-screen tile menu; mounts the active game's UI |
| `src/games/dance/engine.js` (new) | Pure logic: judging, score, combo, grade. No imports. |
| `src/games/dance/engine.test.js` (new) | Vitest tests for engine |
| `src/games/dance/charts.js` (new) | Seeded `{time, lane}[]` generator per (track × difficulty) |
| `src/games/dance/charts.test.js` (new) | Vitest tests for charts |
| `src/games/dance/tracks.js` (new) | 5 synthesized songs + audio-clock track player |
| `src/games/dance/session.js` (new) | Mutable runtime shared between DOM UI and 3D stage (rt.js idiom) |
| `src/games/dance/DanceGame.jsx` (new) | Flow: song select → difficulty → playing overlay → results |
| `src/games/dance/DanceStage.jsx` (new) | 3D stage: dancers, lanes, falling note blobs, FX |
| `src/ui/Curtain.jsx` (new) | Full-screen curtain transition overlay |
| `src/three/Arcade.jsx` (new) | Arcade building + marquee in the world |
| `src/systems/audio.js` (modify) | Export ctx/master, ambient pause/resume |
| `src/state/store.js` (modify) | Arcade state, enter/exit, rewards, doAction cases |
| `src/data/interactables.js` (modify) | `arcade` interactable |
| `src/data/dialogue.js` (modify) | Disco sticker entry |
| `src/three/World.jsx` (modify) | Mount `<Arcade />` |
| `src/three/colliders.js` (modify) | Building collider |
| `src/three/Zones.jsx` (modify) | Path spur route + "Games" sign arrow |
| `src/App.jsx` (modify) | Canvas content swap + arcade UI + curtain |
| `src/styles.css` (modify) | Arcade/dance/curtain styles |
| `package.json` (modify) | vitest devDep + `test` script |

Map placement: building center **(60, 10)**, door facing west; interactable spot **(55, 10)**. A new paver route `[[40, 20], [47, 16], [53, 11]]` branches off the snack-stand path. (The path dead-end at (42, −4) is the pool approach — do NOT build there; loungers have colliders at (44, −2) and (49, 0).)

---

### Task 1: Vitest + rhythm engine (TDD)

**Files:**
- Modify: `package.json`
- Create: `src/games/dance/engine.test.js`
- Create: `src/games/dance/engine.js`

- [ ] **Step 1: Add vitest**

Run: `npm install -D vitest`

Then add to `package.json` `"scripts"`:

```json
"test": "vitest run"
```

- [ ] **Step 2: Write the failing tests**

Create `src/games/dance/engine.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { createEngine, maxScore, gradeFor, WINDOWS, POINTS, COMBO_BONUS, COMBO_MIN } from './engine.js';

const chart = (times, lane = 0) => times.map((time) => ({ time, lane }));

describe('tap judging', () => {
  it('judges a dead-on tap as perfect', () => {
    const e = createEngine(chart([1.0]));
    expect(e.tap(0, 1.0).judgment).toBe('perfect');
  });
  it('judges within the perfect window as perfect', () => {
    const e = createEngine(chart([1.0]));
    expect(e.tap(0, 1.0 + WINDOWS.perfect - 0.001).judgment).toBe('perfect');
  });
  it('judges between perfect and good windows as good', () => {
    const e = createEngine(chart([1.0]));
    expect(e.tap(0, 1.0 + WINDOWS.perfect + 0.02).judgment).toBe('good');
  });
  it('ignores taps outside the good window', () => {
    const e = createEngine(chart([1.0]));
    expect(e.tap(0, 1.0 + WINDOWS.good + 0.05)).toBeNull();
    expect(e.notes[0].judged).toBeNull();
  });
  it('ignores taps on the wrong lane', () => {
    const e = createEngine(chart([1.0], 2));
    expect(e.tap(0, 1.0)).toBeNull();
  });
  it('hits the nearest unjudged note in the lane', () => {
    const e = createEngine(chart([1.0, 1.15]));
    const r = e.tap(0, 1.14);
    expect(r.note.time).toBe(1.15);
  });
  it('never judges the same note twice', () => {
    const e = createEngine(chart([1.0]));
    e.tap(0, 1.0);
    expect(e.tap(0, 1.0)).toBeNull();
  });
});

describe('misses via update()', () => {
  it('marks unhit notes as missed once past the good window', () => {
    const e = createEngine(chart([1.0]));
    expect(e.update(1.0 + WINDOWS.good + 0.01).length).toBe(1);
    expect(e.notes[0].judged).toBe('miss');
    expect(e.counts.miss).toBe(1);
  });
  it('does not miss notes still in the window', () => {
    const e = createEngine(chart([1.0]));
    expect(e.update(1.0 + WINDOWS.good - 0.01).length).toBe(0);
  });
  it('resets combo on a miss', () => {
    const e = createEngine(chart([1.0, 2.0]));
    e.tap(0, 1.0);
    expect(e.combo).toBe(1);
    e.update(3.0);
    expect(e.combo).toBe(0);
    expect(e.maxCombo).toBe(1);
  });
  it('sets done when every note is judged', () => {
    const e = createEngine(chart([1.0]));
    e.update(2.0);
    expect(e.done).toBe(true);
  });
});

describe('scoring', () => {
  it('scores perfect and good hits', () => {
    const e = createEngine(chart([1.0, 2.0]));
    e.tap(0, 1.0);
    e.tap(0, 2.0 + WINDOWS.perfect + 0.02);
    expect(e.score).toBe(POINTS.perfect + POINTS.good);
  });
  it(`adds the combo bonus from the ${COMBO_MIN}th consecutive hit`, () => {
    const times = Array.from({ length: COMBO_MIN }, (_, i) => i + 1);
    const e = createEngine(chart(times));
    times.forEach((t) => e.tap(0, t));
    expect(e.score).toBe(COMBO_MIN * POINTS.perfect + COMBO_BONUS);
  });
  it('computes maxScore as all-perfect with combo bonuses', () => {
    expect(maxScore(5)).toBe(5 * POINTS.perfect);
    expect(maxScore(12)).toBe(12 * POINTS.perfect + 3 * COMBO_BONUS);
  });
  it('grades on percentage boundaries', () => {
    expect(gradeFor(95, 100)).toBe('S');
    expect(gradeFor(94, 100)).toBe('A');
    expect(gradeFor(85, 100)).toBe('A');
    expect(gradeFor(70, 100)).toBe('B');
    expect(gradeFor(69, 100)).toBe('C');
    expect(gradeFor(0, 0)).toBe('C');
  });
});
```

- [ ] **Step 3: Run tests, confirm they fail**

Run: `npx vitest run src/games/dance/engine.test.js`
Expected: FAIL — cannot resolve `./engine.js`.

- [ ] **Step 4: Implement the engine**

Create `src/games/dance/engine.js`:

```js
// Pure rhythm-game logic. Knows nothing about blobs, audio, or rendering.
// Times are seconds from beat 0 of the song; lanes are 0=left 1=up 2=down 3=right.

export const WINDOWS = { perfect: 0.09, good: 0.18 };
export const POINTS = { perfect: 100, good: 60 };
export const COMBO_BONUS = 10; // extra points per hit while combo >= COMBO_MIN
export const COMBO_MIN = 10;

export function createEngine(chart) {
  const notes = chart.map((n, i) => ({ time: n.time, lane: n.lane, id: i, judged: null }));
  const e = {
    notes,
    score: 0,
    combo: 0,
    maxCombo: 0,
    counts: { perfect: 0, good: 0, miss: 0 },
    done: false,

    // player tapped `lane` at song-time `t` → judge the nearest live note, or null
    tap(lane, t) {
      let best = null;
      for (const n of notes) {
        if (n.judged || n.lane !== lane) continue;
        const d = Math.abs(n.time - t);
        if (d <= WINDOWS.good && (!best || d < Math.abs(best.time - t))) best = n;
      }
      if (!best) return null;
      const judgment = Math.abs(best.time - t) <= WINDOWS.perfect ? 'perfect' : 'good';
      best.judged = judgment;
      e.combo += 1;
      e.maxCombo = Math.max(e.maxCombo, e.combo);
      e.counts[judgment] += 1;
      e.score += POINTS[judgment] + (e.combo >= COMBO_MIN ? COMBO_BONUS : 0);
      return { judgment, note: best };
    },

    // call every frame with current song-time; returns newly missed notes
    update(t) {
      const missed = [];
      for (const n of notes) {
        if (!n.judged && n.time + WINDOWS.good < t) {
          n.judged = 'miss';
          e.counts.miss += 1;
          e.combo = 0;
          missed.push(n);
        }
      }
      if (!e.done && notes.every((n) => n.judged)) e.done = true;
      return missed;
    },
  };
  return e;
}

// best possible score: all perfect, combo bonus from the COMBO_MIN-th hit onward
export function maxScore(noteCount) {
  return noteCount * POINTS.perfect + Math.max(0, noteCount - (COMBO_MIN - 1)) * COMBO_BONUS;
}

export function gradeFor(score, max) {
  const p = max ? score / max : 0;
  return p >= 0.95 ? 'S' : p >= 0.85 ? 'A' : p >= 0.7 ? 'B' : 'C';
}
```

- [ ] **Step 5: Run tests, confirm they pass**

Run: `npx vitest run src/games/dance/engine.test.js`
Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json "Little Buddies/src/games/dance/engine.js" "Little Buddies/src/games/dance/engine.test.js"
git commit -m "Add rhythm engine with vitest coverage"
```

(Note: run git from the repo root `Software/`; prefix paths with `Little Buddies/`. Same for every commit below — including `Little Buddies/package.json` and `Little Buddies/package-lock.json` here.)

---

### Task 2: Chart generator (TDD)

**Files:**
- Create: `src/games/dance/charts.test.js`
- Create: `src/games/dance/charts.js`

- [ ] **Step 1: Write the failing tests**

Create `src/games/dance/charts.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { makeChart } from './charts.js';

// minimal stand-in for a track definition
const track = { bpm: 120, bars: 30, seed: 42, eighth: 0.5 };
const spb = 60 / track.bpm;

describe('makeChart', () => {
  it('is deterministic for the same track and difficulty', () => {
    expect(makeChart(track, 'medium')).toEqual(makeChart(track, 'medium'));
  });
  it('gets denser with difficulty', () => {
    const e = makeChart(track, 'easy').length;
    const m = makeChart(track, 'medium').length;
    const h = makeChart(track, 'hard').length;
    expect(e).toBeLessThan(m);
    expect(m).toBeLessThan(h);
    expect(e).toBeGreaterThan(10);
  });
  it('only uses lanes 0-3 and non-decreasing times', () => {
    const c = makeChart(track, 'hard');
    for (let i = 0; i < c.length; i++) {
      expect(c[i].lane).toBeGreaterThanOrEqual(0);
      expect(c[i].lane).toBeLessThanOrEqual(3);
      if (i) expect(c[i].time).toBeGreaterThanOrEqual(c[i - 1].time);
    }
  });
  it('leaves a 4-beat count-in and 2-beat outro', () => {
    const c = makeChart(track, 'hard');
    expect(c[0].time).toBeGreaterThanOrEqual(4 * spb - 1e-9);
    expect(c[c.length - 1].time).toBeLessThanOrEqual((track.bars * 4 - 1) * spb + 1e-9);
  });
  it('never stacks two notes on the same time AND lane', () => {
    const c = makeChart(track, 'hard');
    const keys = new Set(c.map((n) => `${n.time}:${n.lane}`));
    expect(keys.size).toBe(c.length);
  });
});
```

- [ ] **Step 2: Run tests, confirm they fail**

Run: `npx vitest run src/games/dance/charts.test.js`
Expected: FAIL — cannot resolve `./charts.js`.

- [ ] **Step 3: Implement the generator**

Create `src/games/dance/charts.js`:

```js
// Charts are data: { time, lane }[] generated from a track's beat grid.
// Seeded so the same song+difficulty always deals the same chart — kids
// learn the patterns, that's the fun. Times use the track's `eighth`
// offset so swung songs chart on the swung grid the drums actually play.

const DIFF = {
  easy: { density: 0.45, off: 0, chord: 0 },
  medium: { density: 0.8, off: 0.25, chord: 0 },
  hard: { density: 1, off: 0.5, chord: 0.12 },
};

export function makeChart(track, difficulty) {
  const d = DIFF[difficulty];
  const spb = 60 / track.bpm;
  const totalBeats = track.bars * 4;
  let seed = track.seed * 7919 + { easy: 1, medium: 2, hard: 3 }[difficulty];
  const rnd = () => { seed = (seed * 16807 + 11) % 2147483647; return (seed % 1000) / 1000; };
  const lane = () => Math.floor(rnd() * 4);
  const notes = [];
  const push = (beat, l) => notes.push({ time: +(beat * spb).toFixed(3), lane: l });
  let last = -1;
  for (let b = 4; b <= totalBeats - 2; b++) {
    if (rnd() >= d.density) continue;
    let l = lane();
    if (l === last && rnd() < 0.5) l = (l + 1 + Math.floor(rnd() * 3)) % 4; // break up runs
    push(b, l);
    last = l;
    if (rnd() < d.chord) push(b, (l + 1 + Math.floor(rnd() * 3)) % 4); // two at once
    if (rnd() < d.off && b < totalBeats - 2) push(b + track.eighth, (l + 2) % 4);
  }
  return notes;
}
```

- [ ] **Step 4: Run tests, confirm they pass**

Run: `npx vitest run src/games/dance/charts.test.js`
Expected: all PASS. If "never stacks" fails, the chord lane formula `(l + 1 + floor(rnd()*3)) % 4` guarantees a different lane than `l` — check it wasn't changed.

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: engine + charts suites PASS.

- [ ] **Step 6: Commit**

```bash
git commit -am "Add seeded chart generator"
```

---

### Task 3: Audio system hooks

**Files:**
- Modify: `src/systems/audio.js`

- [ ] **Step 1: Export the context and add ambient pause**

In `src/systems/audio.js`, add below the module-level `let started = false;`:

```js
let ambientPaused = false;

export function getCtx() { return ctx; }
export function getMaster() { return master; }
export function setAmbientPaused(p) { ambientPaused = p; }
```

- [ ] **Step 2: Make the ambient soundtrack respect the pause**

In `startMusic()`, at the top of the `tick` function (right after `if (!ctx) return;`), add:

```js
    if (ambientPaused) {
      nextT = ctx.currentTime + 0.4; // hold the grid so resume doesn't dump missed notes
      setTimeout(tick, 300);
      return;
    }
```

In `startChirps()`, wrap the oscillator scheduling: change the body of `chirp` so everything between `if (!ctx) return;` and the final `setTimeout(chirp, ...)` only runs when not paused:

```js
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
```

- [ ] **Step 3: Verify in the preview**

Start the dev server (`preview_start`, config `little-buddies` — if `.claude/launch.json` lacks it, create the file with `{"version":"0.0.1","configurations":[{"name":"little-buddies","runtimeExecutable":"npm","runtimeArgs":["run","dev"],"port":5173}]}`). Click the page once (arms audio), then in `preview_eval`:

```js
(async () => { const m = await import('/src/systems/audio.js'); m.setAmbientPaused(true); return m.getCtx().state; })()
```

Expected: returns `"running"`; the music-box soundtrack goes quiet within ~3s while the page keeps working. Call `setAmbientPaused(false)` the same way and hear it come back. No console errors (`preview_console_logs`).

- [ ] **Step 4: Commit**

```bash
git commit -am "Expose audio ctx and ambient pause/resume"
```

---

### Task 4: Five dance tracks + audio-clock player

**Files:**
- Create: `src/games/dance/tracks.js`

- [ ] **Step 1: Write the track module**

Create `src/games/dance/tracks.js`:

```js
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
```

- [ ] **Step 2: Listen to every track in the preview**

With the dev server running, click the page once, then via `preview_eval` (one at a time, index 0–4):

```js
(async () => { await import('/src/games/dance/tracks.js'); window.__h = __danceTracks.startTrack(__danceTracks.TRACKS[0]); return 'playing ' + __danceTracks.TRACKS[0].name; })()
```

Expected per track: drums + bass + melody audibly in time, distinct groove/tempo per track, no crackling. Stop each with `window.__h.stop()` before the next; also verify `window.__h.songTime()` grows in real time. Check `preview_console_logs` for errors. If a track feels musically off, tweak only its `mel`/`bass` arrays (data, not code).

- [ ] **Step 3: Commit**

```bash
git commit -am "Add five synthesized dance tracks with audio-clock player"
```

---

### Task 5: Store wiring — arcade state, rewards, interactable

**Files:**
- Modify: `src/state/store.js`
- Modify: `src/data/interactables.js`
- Modify: `src/data/dialogue.js`

- [ ] **Step 1: Add the disco sticker**

In `src/data/dialogue.js`, append to the `STICKERS` array:

```js
  { id: 'disco', name: 'Disco Sticker', icon: '🪩' },
```

- [ ] **Step 2: Add the arcade interactable**

In `src/data/interactables.js`, add to `INTERACTABLES` (before the sparkle entries):

```js
  {
    id: 'arcade', type: 'arcade', name: 'Gaming Corner', icon: '🕹️',
    pos: [55, 10], radius: 5.5, sparkleY: 3.4,
    actions: [
      { id: 'enter', label: 'Go In', color: 'blue', icon: '🕹️', anim: 'hop', cooldown: 2 },
      { id: 'view', label: 'View', color: 'green', icon: '👁️', anim: 'look', cooldown: 2 },
    ],
  },
```

- [ ] **Step 3: Add arcade state + actions to the store**

In `src/state/store.js`:

Import at the top (extend the existing `sfx` import line):

```js
import { sfx, setAmbientPaused } from '../systems/audio.js';
```

Add to the store object, right after the `// ---------- panels ----------` block:

```js
  // ---------- gaming corner ----------
  arcade: { open: false, game: null }, // game: registry id while one is mounted
  curtain: null, // 'closing' | 'opening' | null
  enterArcade() {
    if (get().curtain) return;
    set({ curtain: 'closing' });
    sfx('whoosh');
    setTimeout(() => {
      setAmbientPaused(true);
      playerRt.anim = 'dance'; // world presence keeps grooving at the door
      playerRt.animUntil = 0;
      set({ arcade: { open: true, game: null }, curtain: 'opening' });
    }, 650);
    setTimeout(() => set({ curtain: null }), 1400);
  },
  exitArcade() {
    if (get().curtain) return;
    set({ curtain: 'closing' });
    setTimeout(() => {
      setAmbientPaused(false);
      playerRt.anim = 'idle';
      playerRt.animT = 0;
      set({ arcade: { open: false, game: null }, curtain: 'opening' });
    }, 650);
    setTimeout(() => set({ curtain: null }), 1400);
  },
  launchGame(id) { set({ arcade: { open: true, game: id } }); sfx('blip'); },
  quitToArcade() { set({ arcade: { open: true, game: null } }); },
  finishDance({ grade, song }) {
    const coins = { S: 25, A: 18, B: 12, C: 5 }[grade] || 5;
    get().award({ coins, xp: 15 });
    get().addToast(`${song}: grade ${grade}! +${coins} coins`, '🕺');
    if (!get().progress.flags.discoSticker) {
      set((st) => ({ progress: { ...st.progress, flags: { ...st.progress.flags, discoSticker: true } } }));
      get().award({ sticker: 'disco', xp: 10 });
      get().addToast('Disco Sticker unlocked!', '🪩');
      sfx('tada');
    }
    get().persist();
  },
```

(`playerRt` is already imported in store.js.)

- [ ] **Step 4: Handle the arcade actions in doAction**

In the `doAction` switch (near the `// ---- mushroom ----` cases), add:

```js
      // ---- gaming corner ----
      case 'arcade:enter': {
        get().enterArcade();
        break;
      }
      case 'arcade:view': {
        say(pick([
          'The arcade! Only the Dance Studio is open right now.',
          'I can hear beats in there. Suspiciously funky beats.',
        ]));
        break;
      }
```

- [ ] **Step 5: Sanity-check in the preview**

Reload the preview. In `preview_eval`:

```js
(() => { const s = window.__dev.game.getState(); s.enterArcade(); return s.arcade; })()
```

Expected: no crash; after ~0.7s `window.__dev.game.getState().arcade.open === true`, ambient music stops. Then `window.__dev.game.getState().exitArcade()` restores it. (No UI yet — that's Task 7.) Check console for errors.

- [ ] **Step 6: Commit**

```bash
git commit -am "Add arcade store state, rewards, and interactable"
```

---

### Task 6: The arcade building in the world

**Files:**
- Create: `src/three/Arcade.jsx`
- Modify: `src/three/World.jsx`, `src/three/colliders.js`, `src/three/Zones.jsx`

- [ ] **Step 1: Build the arcade**

Create `src/three/Arcade.jsx`:

```jsx
// Gaming Corner arcade: chunky purple hall with a blinking marquee.
// Door faces west toward the path; interactable spot is (55, 10).
import * as THREE from 'three';
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { ACCENT } from '../data/palette.js';
import { mat, stripeTexture, textTexture } from './materials.js';

export function Arcade() {
  const signTex = useMemo(
    () => textTexture('GAMING CORNER', { w: 512, h: 96, bg: '#2b1c4e', fg: '#FFE9A8', font: 'bold 52px "Baloo 2", sans-serif', radius: 20 }),
    []
  );
  const awningTex = useMemo(() => stripeTexture([ACCENT.purple, '#ffffff'], 8, true), []);
  const bulbs = useRef([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    bulbs.current.forEach((b, i) => {
      if (b) b.material.emissiveIntensity = (Math.floor(t * 3) + i) % 2 ? 2 : 0.4;
    });
  });
  const bulbSpots = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 7; i++) arr.push([-2.7 + i * 0.9, 5.15]);
    for (let i = 0; i < 7; i++) arr.push([-2.7 + i * 0.9, 3.85]);
    return arr;
  }, []);
  return (
    <group position={[60, 0, 10]}>
      {/* main hall */}
      <RoundedBox args={[9, 5.6, 8]} radius={0.35} position={[0, 2.8, 0]} material={mat('#7b5cc9', 'plastic')} castShadow receiveShadow />
      <RoundedBox args={[9.6, 0.7, 8.6]} radius={0.25} position={[0, 5.7, 0]} material={mat('#5a3fa0', 'plastic')} castShadow />
      {/* roof joystick */}
      <mesh material={mat('#4A4A4A', 'plastic')} position={[2.6, 6.5, -1.5]} castShadow>
        <cylinderGeometry args={[0.16, 0.22, 1.1, 10]} />
      </mesh>
      <mesh material={mat(ACCENT.red, 'gloss')} position={[2.6, 7.25, -1.5]} castShadow>
        <sphereGeometry args={[0.5, 14, 12]} />
      </mesh>
      {/* west face: door, awning, marquee (west = -x) */}
      <RoundedBox args={[0.3, 3.1, 2.4]} radius={0.1} position={[-4.45, 1.55, 0]} material={mat('#2b1c4e', 'plastic')} />
      <mesh position={[-4.75, 3.4, 0]} rotation={[0, 0, -0.5]} castShadow>
        <cylinderGeometry args={[1.7, 1.7, 3.4, 14, 1, true, 0, Math.PI * 0.65]} />
        <meshStandardMaterial map={awningTex} side={THREE.DoubleSide} roughness={0.7} />
      </mesh>
      <mesh position={[-4.63, 4.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[6.4, 1.1]} />
        <meshStandardMaterial map={signTex} transparent roughness={0.8} />
      </mesh>
      {/* marquee bulbs above and below the sign */}
      {bulbSpots.map(([z, y], i) => (
        <mesh
          key={i}
          ref={(el) => (bulbs.current[i] = el)}
          material={mat('#ffdf8e', 'glow', { emissive: '#ffca5f', emissiveIntensity: 1 })}
          position={[-4.62, y, z]}
        >
          <sphereGeometry args={[0.11, 8, 6]} />
        </mesh>
      ))}
      {/* glowing window strips on the south face */}
      {[-1.6, 1.6].map((x, i) => (
        <mesh key={'w' + i} material={mat('#ffe9a8', 'glow', { emissive: '#ffd76e', emissiveIntensity: 0.9 })} position={[x, 2.6, 4.05]}>
          <boxGeometry args={[1.8, 1.1, 0.1]} />
        </mesh>
      ))}
    </group>
  );
}
```

Note: `mat(color, kind, extra)` — confirm against `src/three/materials.js` that it accepts a third options object (LampPost and SnackStand already call it that way; mirror their exact usage if the signature differs).

- [ ] **Step 2: Mount it, path it, collide it, sign it**

`src/three/World.jsx`: add `import { Arcade } from './Arcade.jsx';` and render `<Arcade />` next to `<SnackStand />`.

`src/three/colliders.js`: in `COLLIDERS`, add under the snack stand line:

```js
  // gaming corner arcade
  [60, 10, 4.8],
```

`src/three/Zones.jsx`:
- Add a route to `ROUTES`: `[[40, 20], [47, 16], [53, 11]],`
- In `PathSigns()`, inside the post group at `[38, -6]`, under the Pool arrow add:

```jsx
        <SignArrow label="Games" y={1.35} color="#7b5cc9" />
```

- [ ] **Step 3: Verify in the preview**

Reload preview. Walk the buddy toward (55, 10) — or teleport for speed via `preview_eval`:

```js
(() => { const rt = window.__dev.playerRt; rt.x = 50; rt.z = 10; return 'moved'; })()
```

Expected: arcade building visible with blinking marquee reading "GAMING CORNER", paver path leads to it, sparkle floats at the door, walking into range shows the interaction card ("Gaming Corner" / Go In / View), buddy cannot walk through the building. Take `preview_screenshot`. Check console clean.

- [ ] **Step 4: Commit**

```bash
git commit -am "Add Gaming Corner arcade building to the world"
```

---

### Task 7: Registry, curtain, arcade screen, App wiring

**Files:**
- Create: `src/games/registry.js`, `src/games/ArcadeScreen.jsx`, `src/ui/Curtain.jsx`
- Modify: `src/App.jsx`, `src/styles.css`

- [ ] **Step 1: Registry with stub dance entry**

Create `src/games/registry.js`:

```js
// Every game registers here. Adding a game later = one entry + its folder.
// UI mounts as a full-screen DOM layer; Stage (optional) mounts inside the
// app's single <Canvas> while the game is active.
import { DanceUI } from './dance/DanceGame.jsx';
import { DanceStage } from './dance/DanceStage.jsx';

export const GAMES = [
  { id: 'dance', name: 'Dance Studio', icon: '🕺', status: 'open', tagline: 'Blobs drop beats. You drop moves.', UI: DanceUI, Stage: DanceStage },
  { id: 'invaders', name: 'Blob Invaders', icon: '👾', status: 'coming_soon', tagline: 'Pew pew. Eventually.' },
  { id: 'platformer', name: 'Blobby Jump', icon: '🍄', status: 'coming_soon', tagline: 'Still learning to jump.' },
];

export const gameById = Object.fromEntries(GAMES.map((g) => [g.id, g]));
```

For this task only, create minimal placeholders so the app runs (replaced in Tasks 8–9):

`src/games/dance/DanceGame.jsx`:

```jsx
import React from 'react';
import { useGame } from '../../state/store.js';

export function DanceUI() {
  return (
    <div className="arcade-screen">
      <div className="arcade-title">Dance Studio</div>
      <button className="arcade-back" onClick={() => useGame.getState().quitToArcade()}>← Arcade</button>
    </div>
  );
}
```

`src/games/dance/DanceStage.jsx`:

```jsx
import React from 'react';

export function DanceStage() {
  return <ambientLight intensity={0.6} />;
}
```

- [ ] **Step 2: Curtain**

Create `src/ui/Curtain.jsx`:

```jsx
import React from 'react';
import { useGame } from '../state/store.js';

export function Curtain() {
  const curtain = useGame((s) => s.curtain);
  if (!curtain) return null;
  return (
    <div className={`curtain ${curtain}`}>
      <div className="curtain-half curtain-l" />
      <div className="curtain-half curtain-r" />
    </div>
  );
}
```

- [ ] **Step 3: Arcade screen**

Create `src/games/ArcadeScreen.jsx`:

```jsx
// The Gaming Corner hub menu. Renders the registry; mounts the active game's UI.
import React from 'react';
import { useGame } from '../state/store.js';
import { GAMES, gameById } from './registry.js';

export function ArcadeScreen() {
  const arcade = useGame((s) => s.arcade);
  const g = arcade.game ? gameById[arcade.game] : null;
  if (g) return <g.UI />;
  return (
    <div className="arcade-screen">
      <div className="arcade-title">🕹️ GAMING CORNER</div>
      <div className="arcade-sub">Pick a game!</div>
      <div className="arcade-tiles">
        {GAMES.map((game) => (
          <button
            key={game.id}
            className={'arcade-tile' + (game.status === 'open' ? '' : ' locked')}
            disabled={game.status !== 'open'}
            onClick={() => useGame.getState().launchGame(game.id)}
          >
            <span className="tile-icon">{game.status === 'open' ? game.icon : '🔒'}</span>
            <span className="tile-name">{game.name}</span>
            <span className="tile-tag">{game.status === 'open' ? game.tagline : 'Coming soon'}</span>
          </button>
        ))}
      </div>
      <button className="arcade-back" onClick={() => useGame.getState().exitArcade()}>← Back outside</button>
    </div>
  );
}
```

- [ ] **Step 4: App wiring**

In `src/App.jsx`, add imports:

```jsx
import { ArcadeScreen } from './games/ArcadeScreen.jsx';
import { Curtain } from './ui/Curtain.jsx';
import { gameById } from './games/registry.js';
```

Read arcade state next to `screen`:

```jsx
  const arcade = useGame((s) => s.arcade);
  const ActiveStage = arcade.game ? gameById[arcade.game]?.Stage : null;
```

Replace the Canvas contents and the HUD block so the world unmounts inside the arcade (full JSX of the non-creator branch after the change):

```jsx
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
```

- [ ] **Step 5: Styles**

Append to `src/styles.css`:

```css
/* ---------- gaming corner ---------- */
.curtain { position: fixed; inset: 0; z-index: 90; display: flex; pointer-events: none; }
.curtain-half { flex: 1; background: repeating-linear-gradient(90deg, #8a2d9e 0 26px, #7b2490 26px 52px); box-shadow: inset 0 -40px 60px rgba(0, 0, 0, 0.35); }
.curtain.closing .curtain-l { animation: curtain-in-l 0.65s ease-in forwards; }
.curtain.closing .curtain-r { animation: curtain-in-r 0.65s ease-in forwards; }
.curtain.opening .curtain-l { animation: curtain-out-l 0.7s ease-out forwards; }
.curtain.opening .curtain-r { animation: curtain-out-r 0.7s ease-out forwards; }
@keyframes curtain-in-l { from { transform: translateX(-101%); } to { transform: translateX(0); } }
@keyframes curtain-in-r { from { transform: translateX(101%); } to { transform: translateX(0); } }
@keyframes curtain-out-l { from { transform: translateX(0); } to { transform: translateX(-101%); } }
@keyframes curtain-out-r { from { transform: translateX(0); } to { transform: translateX(101%); } }

.arcade-screen { position: fixed; inset: 0; z-index: 40; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; background: radial-gradient(circle at 50% 30%, #35205e, #1a1030 70%); }
.arcade-title { font-family: 'Baloo 2', sans-serif; font-size: 44px; font-weight: 700; color: #ffe9a8; text-shadow: 0 4px 0 rgba(0, 0, 0, 0.3); }
.arcade-sub { color: #cbb8f0; font-weight: 700; }
.arcade-tiles { display: flex; gap: 18px; flex-wrap: wrap; justify-content: center; padding: 10px; }
.arcade-tile { width: 190px; padding: 22px 14px; border-radius: 22px; background: #f7efdd; display: flex; flex-direction: column; align-items: center; gap: 8px; box-shadow: 0 6px 0 rgba(0, 0, 0, 0.25); transition: transform 0.12s; }
.arcade-tile:not(.locked):hover { transform: translateY(-4px) rotate(-1deg); }
.arcade-tile.locked { filter: saturate(0.3) brightness(0.75); cursor: default; }
.tile-icon { font-size: 52px; }
.tile-name { font-family: 'Baloo 2', sans-serif; font-size: 20px; font-weight: 700; color: #35301f; }
.tile-tag { font-size: 13px; color: #6b6350; text-align: center; }
.arcade-back { margin-top: 6px; padding: 10px 22px; border-radius: 999px; background: #f7efdd; font-family: 'Baloo 2', sans-serif; font-size: 17px; font-weight: 700; color: #35301f; box-shadow: 0 4px 0 rgba(0, 0, 0, 0.25); }
.arcade-back:active { transform: translateY(2px); box-shadow: 0 2px 0 rgba(0, 0, 0, 0.25); }
```

- [ ] **Step 6: Verify the full loop in the preview**

Reload. Walk to the arcade, press **Go In**. Expected: curtain closes → arcade screen with 3 tiles (Dance Studio active; Blob Invaders + Blobby Jump locked with 🔒/"Coming soon") → curtain opens. Ambient music silent. Clicking Dance Studio shows the placeholder Dance UI; "← Arcade" returns to tiles. "← Back outside" curtains back to the world at the door, music resumes, HUD is back. `preview_screenshot` of the tile screen. Console clean.

- [ ] **Step 7: Commit**

```bash
git commit -am "Add game registry, curtain transition, and arcade screen"
```

---

### Task 8: Dance Studio flow + playable loop (DOM side)

**Files:**
- Create: `src/games/dance/session.js`
- Modify: `src/games/dance/DanceGame.jsx` (replace placeholder)
- Modify: `src/styles.css`

- [ ] **Step 1: Session runtime**

Create `src/games/dance/session.js`:

```js
// Mutable dance-session runtime shared between the DOM UI and the 3D stage,
// same idiom as state/rt.js. The stage reads this every frame.
export const danceSession = {
  active: false,
  engine: null, // from createEngine()
  handle: null, // from startTrack()
  track: null,
  noteCount: 0,
  pops: [], // [{ noteId, t }] recent hits, for the stage pop animation
};

export function resetSession() {
  danceSession.active = false;
  danceSession.engine = null;
  danceSession.handle = null;
  danceSession.track = null;
  danceSession.noteCount = 0;
  danceSession.pops = [];
}
```

- [ ] **Step 2: The full DanceUI**

Replace `src/games/dance/DanceGame.jsx` entirely:

```jsx
// Dance Studio flow: song select → difficulty → playing overlay → results.
// The 3D stage lives in DanceStage.jsx; they share state via session.js.
import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '../../state/store.js';
import { sfx } from '../../systems/audio.js';
import { TRACKS, startTrack } from './tracks.js';
import { makeChart } from './charts.js';
import { createEngine, maxScore, gradeFor } from './engine.js';
import { danceSession, resetSession } from './session.js';

const KEYMAP = { ArrowLeft: 0, ArrowUp: 1, ArrowDown: 2, ArrowRight: 3 };
const PAD_CHARS = ['◀', '▲', '▼', '▶'];
const PAD_COLORS = ['#3D8BFD', '#FFD23F', '#54C24E', '#9B5DE5'];
const GRADE_LINES = {
  S: 'PERFECT STORM! The backup dancers want lessons.',
  A: 'So smooth. The floor is jealous.',
  B: 'Solid moves! A little more sparkle next time.',
  C: 'Hey, every legend starts somewhere.',
};

function doTap(lane) {
  if (!danceSession.active) return;
  const t = danceSession.handle.songTime();
  const res = danceSession.engine.tap(lane, t);
  if (res) {
    danceSession.pops.push({ noteId: res.note.id, t: performance.now() });
    sfx(res.judgment === 'perfect' ? 'ding' : 'pop');
  }
  return res;
}

export function DanceUI() {
  const [phase, setPhase] = useState('select'); // select | difficulty | playing | results
  const [track, setTrack] = useState(null);
  const [result, setResult] = useState(null);

  const begin = (difficulty) => {
    const chart = makeChart(track, difficulty);
    danceSession.engine = createEngine(chart);
    danceSession.handle = startTrack(track);
    danceSession.track = track;
    danceSession.noteCount = chart.length;
    danceSession.pops = [];
    danceSession.active = true;
    setPhase('playing');
  };

  const finish = () => {
    const e = danceSession.engine;
    danceSession.active = false;
    danceSession.handle.stop();
    const grade = gradeFor(e.score, maxScore(danceSession.noteCount));
    setResult({ score: e.score, grade, maxCombo: e.maxCombo, counts: { ...e.counts } });
    useGame.getState().finishDance({ grade, song: danceSession.track.name });
    setPhase('results');
  };

  const bail = () => { // quit mid-song, no rewards
    if (danceSession.handle) danceSession.handle.stop();
    resetSession();
    setPhase('select');
  };

  if (phase === 'select') {
    return (
      <div className="arcade-screen">
        <div className="arcade-title">🕺 Dance Studio</div>
        <div className="arcade-sub">Pick your jam</div>
        <div className="arcade-tiles">
          {TRACKS.map((t) => (
            <button key={t.id} className="arcade-tile" onClick={() => { setTrack(t); setPhase('difficulty'); }}>
              <span className="tile-icon">{t.icon}</span>
              <span className="tile-name">{t.name}</span>
              <span className="tile-tag">{t.vibe} · {t.speed}</span>
            </button>
          ))}
        </div>
        <button className="arcade-back" onClick={() => useGame.getState().quitToArcade()}>← Arcade</button>
      </div>
    );
  }

  if (phase === 'difficulty') {
    return (
      <div className="arcade-screen">
        <div className="arcade-title">{track.icon} {track.name}</div>
        <div className="arcade-sub">How brave are we feeling?</div>
        <div className="arcade-tiles">
          {[
            ['easy', '🙂', 'Easy', 'Chill blobs only'],
            ['medium', '😼', 'Medium', 'The blobs mean business'],
            ['hard', '🔥', 'Hard', 'Blob avalanche'],
          ].map(([id, icon, name, tag]) => (
            <button key={id} className="arcade-tile" onClick={() => begin(id)}>
              <span className="tile-icon">{icon}</span>
              <span className="tile-name">{name}</span>
              <span className="tile-tag">{tag}</span>
            </button>
          ))}
        </div>
        <button className="arcade-back" onClick={() => setPhase('select')}>← Songs</button>
      </div>
    );
  }

  if (phase === 'playing') return <PlayingOverlay onFinish={finish} onBail={bail} />;

  return (
    <div className="arcade-screen">
      <div className={`dance-grade grade-${result.grade}`}>{result.grade}</div>
      <div className="arcade-title">{result.score} pts</div>
      <div className="arcade-sub">{GRADE_LINES[result.grade]}</div>
      <div className="dance-counts">
        ⭐ Perfect {result.counts.perfect} · 👍 Good {result.counts.good} · 💨 Miss {result.counts.miss} · 🔥 Best combo {result.maxCombo}
      </div>
      <div className="dance-result-btns">
        <button className="arcade-back" onClick={() => { resetSession(); setPhase('difficulty'); }}>Play again</button>
        <button className="arcade-back" onClick={() => { resetSession(); setPhase('select'); }}>Songs</button>
        <button className="arcade-back" onClick={() => { resetSession(); useGame.getState().quitToArcade(); }}>Arcade</button>
      </div>
    </div>
  );
}

function PlayingOverlay({ onFinish, onBail }) {
  const [hud, setHud] = useState({ score: 0, combo: 0, ready: true });
  const [judgment, setJudgment] = useState(null); // { word, kind, key }
  const judgeSeq = useRef(0);

  const showJudgment = (kind) => {
    const word = kind === 'perfect' ? 'Perfect!' : kind === 'good' ? 'Good!' : 'Miss';
    setJudgment({ word, kind, key: ++judgeSeq.current });
  };

  const tap = (lane) => {
    const res = doTap(lane);
    if (res) showJudgment(res.judgment);
  };

  useEffect(() => {
    let raf, tick = 0;
    const loop = () => {
      const s = danceSession;
      if (s.active) {
        const t = s.handle.songTime();
        const missed = s.engine.update(t);
        if (missed.length) showJudgment('miss');
        if (t > s.handle.duration + 0.6) { onFinish(); return; }
        if (++tick % 6 === 0) setHud({ score: s.engine.score, combo: s.engine.combo, ready: t < 0 });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const down = (e) => {
      const lane = KEYMAP[e.code];
      if (lane !== undefined && !e.repeat) { e.preventDefault(); tap(lane); }
    };
    window.addEventListener('keydown', down);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', down); };
  }, [onFinish]);

  return (
    <div className="dance-overlay">
      <div className="dance-score">
        <div className="dance-score-num">{hud.score}</div>
        {hud.combo >= 4 && <div className="dance-combo">{hud.combo} combo!</div>}
      </div>
      {hud.ready && <div className="dance-ready">Get ready…</div>}
      {judgment && (
        <div key={judgment.key} className={`dance-judgment j-${judgment.kind}`}>{judgment.word}</div>
      )}
      <div className="dance-pads">
        {PAD_CHARS.map((ch, lane) => (
          <button
            key={lane}
            className="dance-pad"
            style={{ background: PAD_COLORS[lane] }}
            onPointerDown={(e) => { e.preventDefault(); tap(lane); }}
          >
            {ch}
          </button>
        ))}
      </div>
      <button className="dance-bail" onClick={onBail}>✕</button>
    </div>
  );
}
```

- [ ] **Step 3: Styles for the playing overlay + results**

Append to `src/styles.css`:

```css
/* ---------- dance studio ---------- */
.dance-overlay { position: fixed; inset: 0; z-index: 40; pointer-events: none; }
.dance-score { position: absolute; top: 16px; left: 18px; text-align: left; }
.dance-score-num { font-family: 'Baloo 2', sans-serif; font-size: 38px; font-weight: 700; color: #ffe9a8; text-shadow: 0 3px 0 rgba(0, 0, 0, 0.35); }
.dance-combo { font-family: 'Baloo 2', sans-serif; font-size: 20px; font-weight: 700; color: #f15bb5; }
.dance-ready { position: absolute; top: 30%; left: 0; right: 0; text-align: center; font-family: 'Baloo 2', sans-serif; font-size: 40px; font-weight: 700; color: #fff; text-shadow: 0 3px 0 rgba(0, 0, 0, 0.4); }
.dance-judgment { position: absolute; top: 24%; left: 0; right: 0; text-align: center; font-family: 'Baloo 2', sans-serif; font-size: 46px; font-weight: 700; pointer-events: none; animation: judgment-pop 0.5s ease-out forwards; }
.j-perfect { color: #ffd23f; text-shadow: 0 0 18px rgba(255, 210, 63, 0.7), 0 3px 0 rgba(0, 0, 0, 0.35); }
.j-good { color: #54c24e; text-shadow: 0 3px 0 rgba(0, 0, 0, 0.35); }
.j-miss { color: #9aa0b4; text-shadow: 0 3px 0 rgba(0, 0, 0, 0.35); }
@keyframes judgment-pop { 0% { transform: scale(0.4); opacity: 0; } 25% { transform: scale(1.15); opacity: 1; } 75% { transform: scale(1); opacity: 1; } 100% { transform: scale(1); opacity: 0; } }
.dance-pads { position: absolute; bottom: 22px; left: 0; right: 0; display: flex; justify-content: center; gap: 16px; pointer-events: auto; }
.dance-pad { width: 74px; height: 74px; border-radius: 22px; font-size: 30px; color: #fff; box-shadow: 0 5px 0 rgba(0, 0, 0, 0.3); transition: transform 0.06s; touch-action: manipulation; }
.dance-pad:active { transform: translateY(4px) scale(0.95); box-shadow: 0 1px 0 rgba(0, 0, 0, 0.3); }
.dance-bail { position: absolute; top: 16px; right: 16px; width: 44px; height: 44px; border-radius: 50%; background: rgba(0, 0, 0, 0.4); color: #fff; font-size: 18px; pointer-events: auto; }
.dance-grade { font-family: 'Baloo 2', sans-serif; font-size: 110px; font-weight: 700; line-height: 1; text-shadow: 0 6px 0 rgba(0, 0, 0, 0.3); }
.grade-S { color: #ffd23f; } .grade-A { color: #54c24e; } .grade-B { color: #3d8bfd; } .grade-C { color: #cbb8f0; }
.dance-counts { color: #f7efdd; font-weight: 700; }
.dance-result-btns { display: flex; gap: 12px; }
```

- [ ] **Step 4: Verify the loop end-to-end (no stage visuals yet)**

Reload, enter arcade → Dance Studio → pick "Marshmallow Slow Jam" → Easy. Expected: music plays; "Get ready…" shows briefly; arrow keys and the four pads produce Perfect!/Good! flashes with ding/pop sounds when timed to notes (blind for now — some taps will judge, mistimed ones say nothing, unhit notes flash Miss); score climbs; after ~60s the results screen appears with a grade, coin toast fires, coins increase (check the HUD after exiting to the world), first clear shows "Disco Sticker unlocked!". Play again / Songs / Arcade buttons all navigate. The ✕ button bails to song select without rewards. Console clean.

- [ ] **Step 5: Run the test suite (regression)**

Run: `npm test` — expected: still all PASS.

- [ ] **Step 6: Commit**

```bash
git commit -am "Add Dance Studio flow: song select, difficulty, live scoring, results"
```

---

### Task 9: The 3D stage

**Files:**
- Modify: `src/games/dance/DanceStage.jsx` (replace placeholder)

- [ ] **Step 1: Build the stage**

Replace `src/games/dance/DanceStage.jsx` entirely:

```jsx
// The Dance Studio stage: player's buddy + backup dancers, four lanes,
// falling note blobs. All positions derive from songTime() (audio clock).
import * as THREE from 'three';
import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { Buddy } from '../../three/Buddy.jsx';
import { mat, textTexture } from '../../three/materials.js';
import { ACCENT } from '../../data/palette.js';
import { useGame } from '../../state/store.js';
import { danceSession } from './session.js';

const LANE_X = [-2.7, -0.9, 0.9, 2.7];
const LANE_COLORS = [ACCENT.blue, ACCENT.yellow, ACCENT.green, ACCENT.purple];
const TARGET_Y = 1.5;
const NOTE_Z = 3.2;
const SPEED = 3.6; // world units per second of fall
const POOL = 28;
const CAM_POS = new THREE.Vector3(0, 4.6, 11);
const CAM_LOOK = new THREE.Vector3(0, 3.4, 0);

const songTime = () => (danceSession.handle ? danceSession.handle.songTime() : 0);
const beatPulse = () => {
  if (!danceSession.track) return 0;
  const t = songTime();
  if (t < 0) return 0;
  const spb = 60 / danceSession.track.bpm;
  return Math.max(0, 1 - ((t / spb) % 1) * 2.5);
};

function CameraRig() {
  const camera = useThree((s) => s.camera);
  useFrame(() => {
    camera.position.lerp(CAM_POS, 0.15);
    camera.lookAt(CAM_LOOK);
  });
  return null;
}

function StageSet() {
  const signTex = useMemo(
    () => textTexture('DANCE STUDIO', { w: 512, h: 96, bg: null, fg: '#FFE9A8', font: 'bold 56px "Baloo 2", sans-serif' }),
    []
  );
  const tiles = useRef([]);
  const lightL = useRef(), lightR = useRef();
  useFrame(() => {
    const pulse = beatPulse();
    tiles.current.forEach((m, i) => {
      if (m) m.material.emissiveIntensity = (i % 2 ? 0.12 : 0.04) + pulse * 0.45;
    });
    if (lightL.current) lightL.current.intensity = 14 + pulse * 22;
    if (lightR.current) lightR.current.intensity = 14 + pulse * 22;
  });
  const tileColors = [ACCENT.pink, ACCENT.blue, ACCENT.yellow, ACCENT.purple];
  return (
    <group>
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 12, 10]} intensity={0.9} color="#fff1d6" />
      <pointLight ref={lightL} position={[-6, 7, 5]} color="#F15BB5" intensity={14} distance={30} />
      <pointLight ref={lightR} position={[6, 7, 5]} color="#3D8BFD" intensity={14} distance={30} />
      {/* floor + glowing tile grid */}
      <RoundedBox args={[16, 0.4, 12]} radius={0.15} position={[0, -0.2, 0]} material={mat('#3a2a5e', 'plastic')} />
      {Array.from({ length: 40 }, (_, i) => {
        const cx = (i % 8) - 3.5, cz = Math.floor(i / 8) - 2;
        return (
          <mesh key={i} position={[cx * 1.9, 0.02, cz * 2.2]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.7, 2]} />
            <meshStandardMaterial
              ref={(m) => (tiles.current[i] = m)}
              color={tileColors[i % 4]}
              emissive={tileColors[i % 4]}
              emissiveIntensity={0.05}
              roughness={0.3}
            />
          </mesh>
        );
      })}
      {/* back wall + marquee */}
      <RoundedBox args={[16, 9, 0.6]} radius={0.2} position={[0, 4.3, -5.5]} material={mat('#2b1c4e', 'plastic')} />
      <mesh position={[0, 7.6, -5.1]}>
        <planeGeometry args={[7.5, 1.3]} />
        <meshBasicMaterial map={signTex} transparent />
      </mesh>
      <DiscoBall />
    </group>
  );
}

function DiscoBall() {
  const g = useRef();
  useFrame((_, dt) => { if (g.current) g.current.rotation.y += dt * 1.4; });
  return (
    <group position={[0, 8.2, -1]}>
      <mesh material={mat('#8a8a8a', 'plastic')} position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.2, 6]} />
      </mesh>
      <group ref={g}>
        <mesh>
          <sphereGeometry args={[0.7, 18, 14]} />
          <meshStandardMaterial color="#dfe6ff" metalness={0.95} roughness={0.15} flatShading />
        </mesh>
      </group>
    </group>
  );
}

const BACKUPS = [
  { name: 'Beebo', shape: 'blob', color: '#F5883C', eyes: 'plain', brows: 'happy', mouth: 'smile', accessory: 'sunglasses', hatColor: 'red' },
  { name: 'Mo', shape: 'droplet', color: '#3D8BFD', eyes: 'plain', brows: 'happy', mouth: 'smile', accessory: 'none', hatColor: 'red' },
];

function Dancers() {
  const profile = useGame((s) => s.profile);
  const rts = useMemo(
    () => [0, 0.7, 1.4].map((off) => ({ anim: 'dance', animT: off, animUntil: 0, speak: null, holding: null })),
    []
  );
  // dancers face the camera (+z)
  return (
    <>
      <group position={[0, 0, -0.8]} rotation={[0, Math.PI, 0]}>
        <Buddy profile={profile} rt={rts[0]} castShadow={false} />
      </group>
      <group position={[-2.4, 0, -2.6]} rotation={[0, Math.PI, 0]} scale={0.82}>
        <Buddy profile={BACKUPS[0]} rt={rts[1]} castShadow={false} />
      </group>
      <group position={[2.4, 0, -2.6]} rotation={[0, Math.PI, 0]} scale={0.82}>
        <Buddy profile={BACKUPS[1]} rt={rts[2]} castShadow={false} />
      </group>
    </>
  );
}

function Targets() {
  // arrow direction per lane: left, up, down, right (cone default points +y)
  const rotZ = [Math.PI / 2, 0, Math.PI, -Math.PI / 2];
  return (
    <group position={[0, TARGET_Y, NOTE_Z]}>
      {LANE_X.map((x, lane) => (
        <group key={lane} position={[x, 0, 0]}>
          <mesh rotation={[0, 0, 0]}>
            <ringGeometry args={[0.5, 0.62, 24]} />
            <meshBasicMaterial color={LANE_COLORS[lane]} transparent opacity={0.9} />
          </mesh>
          <mesh rotation={[0, 0, rotZ[lane]]}>
            <coneGeometry args={[0.16, 0.34, 3]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Notes() {
  const groups = useRef([]);
  const mats = useRef([]);
  useFrame(() => {
    const s = danceSession;
    const pool = groups.current;
    for (const g of pool) if (g) g.visible = false;
    if (!s.engine || !s.handle) return;
    const t = songTime();
    const nowMs = performance.now();
    let slot = 0;
    for (const n of s.engine.notes) {
      const dt = n.time - t;
      if (dt > 2.6) break; // chart is sorted; the rest are still far away
      let popK = -1;
      if (n.judged === 'miss') continue;
      if (n.judged) {
        const pop = s.pops.find((p) => p.noteId === n.id);
        popK = pop ? Math.min(1, (nowMs - pop.t) / 260) : 1;
        if (popK >= 1) continue;
      } else if (dt < -0.2) continue; // late unjudged note; update() will miss it
      const g = pool[slot];
      const m = mats.current[slot];
      slot++;
      if (!g) break;
      g.visible = true;
      if (m) m.color.set(LANE_COLORS[n.lane]);
      if (popK >= 0) {
        // hit! freeze on the target and pop
        const k = 1 + popK * 0.9;
        g.position.set(LANE_X[n.lane], TARGET_Y, NOTE_Z);
        g.scale.setScalar(k);
        g.rotation.z = popK * 1.2;
      } else {
        g.position.set(LANE_X[n.lane], TARGET_Y + dt * SPEED, NOTE_Z);
        g.rotation.z = Math.sin(t * 7 + n.id * 1.7) * 0.28; // the wiggle
        const sq = 1 + Math.sin(t * 14 + n.id) * 0.08; // the bounce
        g.scale.set(1.05 / sq, sq, 1);
      }
    }
    s.pops = s.pops.filter((p) => nowMs - p.t < 400);
  });
  return (
    <group>
      {Array.from({ length: POOL }, (_, i) => (
        <group key={i} ref={(el) => (groups.current[i] = el)} visible={false}>
          <mesh>
            <sphereGeometry args={[0.42, 12, 10]} />
            <meshStandardMaterial ref={(m) => (mats.current[i] = m)} roughness={0.35} />
          </mesh>
          <mesh position={[-0.13, 0.1, 0.36]}>
            <sphereGeometry args={[0.055, 6, 5]} />
            <meshBasicMaterial color="#2b2b2b" />
          </mesh>
          <mesh position={[0.13, 0.1, 0.36]}>
            <sphereGeometry args={[0.055, 6, 5]} />
            <meshBasicMaterial color="#2b2b2b" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function DanceStage() {
  return (
    <group>
      <CameraRig />
      <StageSet />
      <Dancers />
      <Targets />
      <Notes />
    </group>
  );
}
```

- [ ] **Step 2: Verify visually in the preview**

Reload, enter the Dance Studio, start "Sunshine Sprint" / Medium. Expected:
- Stage with pulsing colored floor tiles, back wall, spinning disco ball, "DANCE STUDIO" marquee.
- Your buddy center stage doing the dance animation, **facing the camera** (if all three dancers face away, remove `rotation={[0, Math.PI, 0]}` from the three dancer groups — depends on Buddy model facing).
- Note blobs wiggle down the 4 lanes and cross the target rings exactly on musical beats — watch several: a blob should be centered in its ring at the instant its drum/melody hit sounds.
- Tapping on time pops the blob (scale-up spin) with Perfect!/Good!; late/no tap → the blob passes and Miss flashes.
- Floor tiles and side lights pulse on the beat.
- Sanity: let a full song play — the LAST notes must still land on the beat (this proves the no-drift rule).
Take a `preview_screenshot` mid-song. Console clean, frame rate feels smooth.

- [ ] **Step 3: Commit**

```bash
git commit -am "Add 3D dance stage with buddy dancers and falling note blobs"
```

---

### Task 10: Definition-of-done pass + build

**Files:**
- No new files. Fix whatever the checklist below surfaces.

- [ ] **Step 1: Full definition-of-done run in the preview**

Fresh reload, then walk the whole loop and tick every line (fix + re-verify anything that fails):

1. "Games" arrow on the (38, −6) signpost; paver path leads to the arcade; marquee blinks.
2. Walk up → interaction card → **View** says a flavor line; **Go In** → curtain → arcade screen.
3. Arcade screen: Dance Studio open; Blob Invaders + Blobby Jump locked "Coming soon"; Back outside works (curtain, music resumes, buddy at the door).
4. All 5 songs playable; Easy/Medium/Hard visibly different density; each song sounds distinct.
5. Full ~60s song: falling blobs, 4 lanes, keyboard + pads both work, Perfect/Good/Miss + live score/combo.
6. Results: score, grade, counts, best combo; Play again / Songs / Arcade all work; coins/XP awarded (toast + HUD coin count after exit); Disco sticker on first clear (check Backpack stickers tab).
7. Mid-song ✕ bails without rewards.
8. Multiplayer presence: with a second browser tab in the same room, the first player's buddy shows the dance animation at the arcade door while they're inside (best-effort check; skip if rooms can't connect locally).
9. Mobile check: `preview_resize` to mobile — arcade tiles wrap, pads reachable, no clipped UI.
10. No console errors anywhere in the loop.

- [ ] **Step 2: Tests + production build**

Run: `npm test` → all PASS.
Run: `npm run build` → completes without errors.

- [ ] **Step 3: Commit any fixes**

```bash
git commit -am "Polish pass: Gaming Corner definition-of-done fixes"
```

(Skip the commit if Step 1 surfaced nothing.)

---

## Post-plan notes for the executor

- **Do not** add Tone.js. The audio-clock pattern in `tracks.js` is the sync guarantee.
- **Do not** create standalone HTML files; this is all in-app.
- If `mat()` in `materials.js` doesn't accept a third options argument, copy how `LampPost` in `Zones.jsx` builds its glow material instead.
- The buddy's `dance` anim already exists (`animateBuddy` in `Buddy.jsx`); if the dancers T-pose, check the `rt` object shape against `playerRt` in `state/rt.js`.
- Tuning knobs live in one place each: fall speed (`SPEED` in DanceStage), windows (`WINDOWS` in engine), densities (`DIFF` in charts), grooves (track data). Tweak data, not logic.
