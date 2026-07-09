# Gaming Corner — Dance Game (v1) Build Spec

A handoff prompt for a long-term build. Paste this into a fresh Claude Code session as the project brief.

---

## What we're building

A playful little arcade world called **Gaming Corner**. You walk a blob character up to a **Game Studio**, and inside are multiple game "studios." Long-term there will be several (a Space Invaders–style shooter, a Mario-style platformer, etc.), but **v1 ships exactly one playable game — the Dance Studio.** Everything else shows as "coming soon."

The Dance Studio is a **Dance Dance Revolution–style rhythm game** with a joke baked into it: the falling notes aren't plain arrows — they're **little blobs busting a move on the way down.** Player taps the matching direction when a blob hits the target zone. Perfect / Good / Miss timing, score at the end.

Tone throughout: **funny, bouncy, blob aesthetic.** This is meant to make a kid laugh, not to be a hardcore rhythm sim.

---

## Hard scope line for v1

Build:
- The **Gaming Corner hub** (map + "Gaming Corner" sign + a Game Studio entrance you can walk into).
- The **Dance Studio**, fully playable end to end.

Stub only (visible but locked, "Coming soon"):
- Space Invaders studio
- Platformer studio

Do **not** build the other two games yet. But architect the hub so adding them later is "register a new game module," not "rewrite the shell." (See architecture below — this is the whole point of doing the hub now.)

---

## Architecture (this matters more than any single feature)

Structure it so the games are pluggable, because more are coming.

- **Hub shell** = a registry. Each game registers itself with `{ id, name, status: 'open' | 'coming_soon', mount() }`. Adding a game later = add one entry. No touching the hub logic.
- **Rhythm engine** is separate from **blob presentation.** The engine only knows about note objects with a `time` and a `lane`, timing windows, and scoring. Whether a note renders as an arrow, a blob, or a dancing potato is a presentation concern layered on top. Keep them apart so the engine is reusable and the funny stuff is swappable.
- **Charts are data, not code.** A chart is an array of `{ time, lane }`. Songs and difficulties are just different charts. Never hard-code note timing into the engine.
- **One standalone HTML file.** Everything inline (JS + CSS + generated audio). No external asset hosting, no build step. This keeps it portable and matches how the rest of the toolkit is built.

---

## The hub — Gaming Corner

- A small scene / map with a **"Gaming Corner" sign.**
- Player blob can move to a **Game Studio** entrance and enter it.
- On entering, a prompt: *"The Dance Studio is the only one open right now — wanna play?"* → **Yes.**
- **Transition:** view closes like a curtain / zoom-to-black, then zooms back out — and now you're **on the stage.** (Easy to do with a full-screen CSS transition overlay. It's polish, but it sells the "walking into a place" feeling, so keep it.)

---

## The Dance Studio — gameplay

**Setup screens (before the song):**
1. **Song select — 5 tracks**, varying tempo and style: slow, fast, hip-hop, R&B/slow-jam, and one upbeat. Each **~1 minute** (loop a short pattern — don't drag it out; short attention span is a feature here).
2. **Difficulty select — Easy / Medium / Hard.** Same song, denser/faster chart as difficulty rises.

**The stage:**
- Your **player blob center stage**, with a couple of **backup dancer blobs** behind him, all idle-dancing to the beat.
- **Four lanes** with a target zone at the bottom: **left, up, down, right.**
- **Blobs fall down the lanes** — these are the notes. Each is a little blob doing a wiggle/dance animation as it descends. When it reaches the target zone, tap the matching direction.
- On a good hit the blob **pops / strikes a pose.** Make hits feel satisfying and a little silly.

**Timing / scoring:**
- Three judgments: **Perfect** (dead on), **Good** (close), **Miss** (not close / no tap).
- Running score + combo. Feed the judgment back visually on the hit (flash the word, pop the blob).
- **End screen:** final score and grade, plus play-again / back-to-studio.

**Controls:** keyboard arrows on desktop; four on-screen tap buttons (left/up/down/right) for touch. Both always active.

---

## The technical crux — read this before writing the engine

Rhythm games fall apart on **audio↔visual sync.** Two rules that keep it from drifting:

1. **The audio clock is the source of truth, not the frame loop.** Use **Tone.js** (`Tone.Transport`). Schedule notes on the Transport and drive the falling blobs' positions off `Tone.Transport.seconds` / `Tone.now()`. Use `requestAnimationFrame` only to *render* — never to *count time.* If you count beats by adding up frame deltas, it will slowly desync from the music and feel broken.

2. **Generate the music, don't ship real songs.** Real tracks = copyright problems + external audio files that break the single-file build. Instead, compose **5 original short loops with Tone.js** — pick distinct grooves/tempos so they *feel* like different genres (e.g. ~80bpm slow jam, ~140bpm fast, a swung hip-hop beat, etc.). This keeps it one file, legally clean, and perfectly synced because the notes and the audio are on the same Transport.

**Charting:** generate each chart from the song's beat grid — notes on strong beats for Easy, more subdivisions/off-beats for Hard. Store as `{ time, lane }[]` per (song × difficulty). Hand-tweak later if a section feels off, but auto-generating from the beat grid is the maintainable default.

---

## Future studios (design for these, don't build them)

- **Space Invaders studio** — blob shooter.
- **Platformer studio** — Mario-style blob jumper.

They register into the hub the same way the Dance Studio does. If the shell is built right, adding one is a new module + a `status: 'open'` flip on its tile.

---

## Definition of done for v1

- Walk the hub, enter the Game Studio, get the "only Dance Studio is open" prompt, transition onto the stage.
- Pick 1 of 5 songs and a difficulty.
- Play a full ~1-min track with blobs falling in 4 lanes, tap to hit, Perfect/Good/Miss judging, live score + combo.
- End screen with score/grade and replay.
- Backup dancer blobs and idle bounce present. Hits feel poppy and funny.
- Other two studios visible as locked "coming soon."
- Ships as a single standalone HTML file with all audio generated in-browser.
