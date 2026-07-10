# Little Buddies Foundation Hardening Design

Approved direction: 2026-07-10

## Purpose

Harden the existing Little Buddies foundation before the next visual and progression-design phase. Preserve the current player experience while fixing known lifecycle and trust problems, creating testable module boundaries, and reducing the amount of code loaded before a player enters the arcade.

## Scope

This pass will:

- make multiplayer leave and rejoin reliable;
- give server rooms explicit creation, membership, validation, rate-limit, and cleanup behavior;
- make the daily check-in reward claimable once per local calendar day;
- replace simulated online population with honest room status;
- extract focused persistence, progression, and multiplayer helpers from the oversized Zustand store;
- lazy-load playable arcade modules;
- add automated coverage for each changed behavior.

This pass will not redesign screens, mobile controls, world layout, rewards, game balance, quests, character customization, or Dance Studio presentation. The broader return loop and visual system will be designed together afterward.

## Approach

Use targeted extraction rather than a complete store rewrite. Existing React components and Zustand action names remain stable. Pure or state-light logic moves behind small interfaces, allowing tests to exercise behavior without mounting the 3D application.

This deliberately avoids converting the project to TypeScript, replacing Zustand, or introducing a new state-machine framework. Those changes would increase migration risk without improving the immediate player-facing failures.

## Architecture

### Daily check-in and progression

Create focused persistence and progression modules responsible for safe stored-state normalization, local-day keys, reward eligibility, and immutable reward calculations. The store remains responsible for timers, dialogue, sounds, and player-facing effects.

Required interface:

```js
localDayKey(date = new Date()) => 'YYYY-MM-DD'
canClaimDaily(lastClaimDay, today) => boolean
```

`progress.flags.checkedInDay` is the persisted source of truth. A player receives the existing 10 coins and 5 XP only when the stored day differs from the current local day. Welcome dialogue and a quest offer may still happen once per page session, but the reward message must accurately reflect whether a reward was granted.

Stored profile and progress data must be merged with defaults at the nested collection level so an older partial save cannot erase newer `flags`, `collectibles`, `snacks`, `stickers`, `phrases`, or `quests` defaults. Loaded arrays and objects must not alias the default constants. Existing reward values, purchase support for negative coin adjustments, and current level-unlock behavior are preserved in this pass.

### Multiplayer client lifecycle

Transport event binding belongs to the current transport instance, not a permanent boolean in the store. A leave operation must:

- stop the state broadcast timer;
- unsubscribe or discard the current transport listeners;
- close the transport;
- clear remote runtime state;
- allow a later host/join operation to bind a fresh transport exactly once.

Transport listeners return unsubscribe functions. Local `BroadcastChannel` unload handling is registered once per active local transport and removed when that transport closes.

Room creation is atomic: `createRoom(profile)` creates the room and joins the creator in one operation. The store must not follow it with a second join. Joining a different room first removes the socket from its previous room. Socket acknowledgements have a bounded timeout so the UI cannot remain in `connecting` forever. An unexpected socket disconnect clears the active room and reports the session as offline; the player may then reconnect through the normal host/join actions.

### Room server

Extract an in-memory room service from the Socket.IO adapter. The service owns atomic room creation and creator membership, normalized joins, room switching, player removal, and empty-room deletion. Socket handlers translate network messages into calls to this service.

Room rules:

- codes are six characters from the existing restricted alphabet;
- a room is deleted immediately after its last joined player leaves;
- a room has at most eight players;
- profile, state, and event payloads are copied into bounded, known fields;
- numeric position values must be finite and are clamped to the playable world boundary;
- names and identifiers have explicit length limits;
- unknown event types and malformed payloads are ignored;
- state updates and social events have lightweight per-socket rate limits.

The room log remains in memory and is capped so a long-running room cannot grow without limit.

### Hosting surfaces

The standalone static server resolves request paths under `dist` and rejects traversal outside that directory. Stream failures return an HTTP error rather than terminating the request silently. The development snapshot endpoint accepts only `POST`, enforces a small body limit, and rejects malformed image data before writing under its existing development-only directory.

### Honest presence UI

Remove the hard-coded base population. Outside a room, the HUD presents the Friends entry point without claiming live users. Inside a room, it reports the actual number of connected buddies, including the local player.

This is a copy/data correction only. Visual redesign remains out of scope.

### Arcade loading

Registry metadata stays synchronous so the arcade menu renders immediately. Playable game UI and Stage modules are loaded with dynamic imports when a player launches a game. The registry exposes a loader rather than importing Dance Studio eagerly.

The launch flow includes an explicit loading state and a recoverable error state. A failed game import returns the player to the arcade menu with a concise message rather than leaving a blank canvas.

## Error handling

- Failed room connections keep the existing local fallback behavior.
- Invalid room codes produce the existing user-facing no-room response.
- Missing Socket.IO acknowledgements time out and return the UI to an offline state.
- Switching rooms removes the player from the previous room before joining the next.
- An unexpected socket disconnect clears stale room presence rather than claiming the player is still online.
- Malformed network messages are dropped without mutating room state.
- Leaving when no transport exists is idempotent.
- Rejoining after a leave creates and binds a fresh transport.
- A failed arcade-module load never awards progress and never leaves ambient audio paused indefinitely.
- Local-storage parse failures continue to fall back to safe defaults.

## Testing

Every behavior change follows a failing-test-first cycle.

Add coverage for:

- same-day daily reward rejection and next-day eligibility;
- local date-key boundaries;
- corrupted, partial, and legacy stored-state normalization without default-object aliasing;
- immutable reward application, duplicate-sticker prevention, counters, purchases, and level thresholds;
- welcome/quest session behavior remaining independent from reward eligibility;
- transport listener cleanup and fresh binding after leave/rejoin;
- atomic host creation, room switching, acknowledgement timeout, and disconnect cleanup;
- idempotent leave;
- room creation, join capacity, room switching, and disconnect cleanup;
- profile, state, and event sanitization;
- room-log caps and rate limits;
- honest presence counts;
- registry metadata without eager Dance Studio imports;
- successful and failed dynamic game loading.
- standalone-server path containment and development snapshot request limits.

The existing rhythm-engine and chart tests must remain unchanged and pass. Verification also includes a production build and a short desktop/mobile browser smoke test focused on regressions, not visual redesign.

## Expected file boundaries

Create:

- `src/state/progressionPolicy.js`
- `src/state/progressionPolicy.test.js`
- `src/state/persistence.js`
- `src/state/persistence.test.js`
- `src/net/transportLifecycle.js`
- `src/net/transportLifecycle.test.js`
- `server/roomService.js`
- `server/roomService.test.js`
- `server/index.test.js`
- `src/games/registry.test.js`

Modify:

- `src/state/store.js`
- `src/net/transport.js`
- `server/rooms.js`
- `server/index.js`
- `vite.config.js`
- `src/ui/HUD.jsx`
- `src/games/registry.js`
- `src/games/ArcadeScreen.jsx`
- `src/App.jsx`

The exact extraction may be adjusted during implementation if tests expose a smaller clean boundary, but it must not become a full application-state rewrite.

## Success criteria

- Leaving and rejoining multiplayer works repeatedly without duplicate or missing listeners.
- Room creation cannot produce an abandoned empty room, and room switching cannot leak old membership.
- Network payloads cannot inject unbounded or non-finite state into rooms.
- Refreshing the page cannot claim the daily reward again on the same local day.
- The HUD no longer implies nonexistent online players.
- Dance Studio is absent from the initial eager JavaScript dependency path.
- Existing behavior outside these corrections remains intact.
- All automated tests pass and the production build succeeds.
