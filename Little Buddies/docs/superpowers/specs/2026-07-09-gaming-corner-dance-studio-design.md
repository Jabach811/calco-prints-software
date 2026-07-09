# Gaming Corner + Dance Studio — Design

Approved 2026-07-09. Adapts `gaming-corner-dance-game-spec.md` (written for a standalone
HTML file) to the Little Buddies world (React Three Fiber + Vite + zustand).

## Decisions made with Joel

1. **Lives inside Little Buddies.** The world is the hub — no separate walkable map,
   no standalone file. The spec's architecture ideas survive; its "single HTML file"
   rule does not.
2. **Arcade interior = 2D game-select screen**, not a walkable 3D room.
3. **Stage is 3D in the existing canvas**, starring the player's actual customized buddy.

## 1. Gaming Corner on the map

- Arcade building + "GAMING CORNER" sign in the northeast, near the pool and snack
  stand. The existing path that dead-ends at ~(42, -4) leads to it.
- Same construction style as hotel/snack stand: rounded primitives, `mat()` palette
  materials, canvas-drawn sign texture.
- A "Games" arrow added to a path sign.
- New interactable (`arcade`): walk-up sparkle, action card with **Enter** and a
  **View** flavor line. Collider so you can't walk through the building.

## 2. Entry transition + arcade screen

- **Enter** → full-screen curtain overlay closes over the world → arcade screen →
  curtain opens. Exiting reverses it; the buddy is back at the arcade door.
- The arcade screen is a 2D menu of three tiles:
  - **Dance Studio** — open
  - **Blob Invaders** — locked, "coming soon" + jokey line
  - **Platformer** — locked, "coming soon" + jokey line
- Tiles render from a **game registry**: `{ id, name, status: 'open'|'coming_soon',
  Component }` per game. Adding a future game = one registry entry + its own folder
  under `src/games/`. Arcade screen and world code don't change.
- While the player is inside the arcade, the world scene unmounts (perf) and their
  multiplayer presence shows the dance animation at the arcade door.

## 3. Dance Studio flow

Song select (5 tracks: name, vibe, speed) → difficulty (Easy / Medium / Hard) →
stage → results (score, grade, best combo, play again / back to arcade).
Menus are DOM panels in the existing HUD style.

## 4. The stage

- 3D scene swapped into the existing canvas: stage floor, back wall, disco-ish
  lighting.
- Player's own buddy front and center using the existing `dance` animation; two
  backup-dancer buddies (fun random profiles) behind, idle-dancing on the beat.
- Four lanes — left, up, down, right — with a target zone. Falling notes are small
  3D blobs that wiggle as they descend.
- Hit: blob pops with a burst + judgment word flash (Perfect! / Good!). Miss: blob
  slumps off the bottom. Score + combo in a corner overlay (DOM).

## 5. Music — extend the existing synth audio, no Tone.js

- The spec's Tone.js advice assumed a from-scratch build. `src/systems/audio.js`
  already composes music in code and schedules notes ahead of time on the
  AudioContext clock — the exact anti-drift pattern a rhythm game needs.
- Five new ~60s dance tracks, synthesized (drums via noise/oscillators, bass,
  melody), distinct grooves:
  - slow jam ~82 bpm, R&B ~94, swung hip-hop ~104, upbeat pop ~124, fast ~144.
- **Audio clock is the source of truth**: the track player exposes a precise
  `songTime()` derived from `ctx.currentTime`; falling-blob positions and judging
  read that every frame. `requestAnimationFrame` renders only — it never counts time.
- Ambient world soundtrack + chirps pause while in the arcade, resume on exit
  (small stop/resume hook added to audio.js).

## 6. Charts — data, generated from the beat grid

- A chart is `{ time, lane }[]` per (song × difficulty). Never hard-coded into the
  engine.
- Seeded generator places notes on the beat grid: Easy = sparse strong beats,
  Medium = most beats + some off-beats, Hard = eighths + occasional two-note chords.
  Seeded → same chart every play, so kids can learn patterns.
- Hand-tweakable later because it's just data.

## 7. Engine — plain logic, no visuals

- `engine.js` knows only: chart, timing windows, taps, judgments, score, combo.
- Windows (kid-friendly): **Perfect ±90ms**, **Good ±180ms**, else **Miss**
  (including never tapped).
- Scoring: Perfect 100, Good 60, plus a +10 bonus per hit while combo ≥ 10.
  Grade by percentage of the chart's max score: S ≥ 95%, A ≥ 85%, B ≥ 70%,
  else C.
- Controls: keyboard arrows + four on-screen tap buttons, both always active.

## 8. Rewards

- Results feed the existing economy via `award()`: coins by grade (~5–25), some XP,
  and a one-time **Disco Sticker** on first clear of any song. Free to play.

## 9. Not in v1

Walkable arcade interior; the other two games (tiles only); multiplayer dance
battles; quest hooks; leaderboards.

## File layout

```
src/games/registry.js          game registry
src/games/ArcadeScreen.jsx     tile menu + curtain transition
src/games/dance/DanceGame.jsx  flow: song select → difficulty → stage → results
src/games/dance/engine.js      timing/judging/scoring (pure logic)
src/games/dance/tracks.js      5 synthesized songs + audio-clock scheduling
src/games/dance/charts.js      seeded chart generator
src/games/dance/DanceStage.jsx 3D stage scene
```

Plus small edits: world files (building, sign, collider), `interactables.js` (arcade
entry), `store.js` (active-game state, enter/exit actions, rewards), `audio.js`
(ambient pause/resume), `App.jsx` (scene swap + arcade UI mount).

## Definition of done

- Walk to the Gaming Corner, Enter, curtain transition, arcade screen with one open
  tile and two locked ones.
- Pick 1 of 5 songs and a difficulty; play a full ~1-minute track: blobs fall in
  4 lanes, tap with keys or buttons, Perfect/Good/Miss judging, live score + combo.
- Results screen with score, grade, replay, and back-to-arcade; coins/XP awarded.
- Player's own buddy + 2 backup dancers on stage; hits feel poppy and silly.
- No audio drift over a full song (notes land on the beat at the end as at the start).
- Exit returns to the world at the arcade door; ambient music resumes.
