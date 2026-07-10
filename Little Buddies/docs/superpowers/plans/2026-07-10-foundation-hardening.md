# Little Buddies Foundation Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden persistence, rewards, multiplayer, presence reporting, arcade loading, and local server surfaces without redesigning the existing experience.

**Architecture:** Preserve the public Zustand actions and React screen flow while extracting pure policy/services that can be tested without mounting Three.js. Make room creation atomic, bind listeners per transport instance, and load playable arcade modules only after launch.

**Tech Stack:** React 18, Zustand 4, React Three Fiber, Vite 5, Vitest 4, Socket.IO 4, Node HTTP.

## Global Constraints

- Preserve current visuals, controls, world content, economy values, and Dance Studio behavior.
- Do not convert the project to TypeScript or replace Zustand.
- Every behavior change starts with a failing Vitest test and is verified green before refactoring.
- Keep unrelated untracked files outside `Little Buddies` untouched.
- Use `npm.cmd` in PowerShell because the unsigned `npm.ps1` shim is blocked.
- Git commands run from the parent `Software` repository with `-c safe.directory="C:/Dev/Joel's Workspaces/Personal/CalCo Prints - Project Folder/Software"`.

---

### Task 1: Safe persistence and daily progression policy

**Files:**
- Create: `src/state/persistence.js`
- Create: `src/state/persistence.test.js`
- Create: `src/state/progressionPolicy.js`
- Create: `src/state/progressionPolicy.test.js`
- Modify: `src/state/store.js`

**Interfaces:**
- Produces: `loadStored(storage, key, defaults)`, `saveStored(storage, key, value)`.
- Produces: `localDayKey(date)`, `claimDaily(progress, date)` returning `{ progress, claimed }`.
- Produces: `applyReward(progress, reward)` returning `{ progress, leveled }` without side effects.
- Preserves: `useGame.getState().award(...)`, `checkIn()`, and existing local-storage keys.

- [ ] **Step 1: Write failing persistence tests**

Cover corrupted JSON, partial legacy saves, nested default preservation, independent clones, and exact serialization:

```js
import { describe, expect, it } from 'vitest';
import { loadStored, saveStored } from './persistence.js';

const defaults = { coins: 0, flags: { tutorial: true }, stickers: ['starter'], quests: [] };

it('deeply fills nested defaults without aliasing them', () => {
  const storage = { getItem: () => '{"coins":8,"flags":{"daily":"2026-07-09"}}' };
  const loaded = loadStored(storage, 'progress', defaults);
  expect(loaded).toEqual({ coins: 8, flags: { tutorial: true, daily: '2026-07-09' }, stickers: ['starter'], quests: [] });
  loaded.flags.tutorial = false;
  loaded.stickers.push('new');
  expect(defaults.flags.tutorial).toBe(true);
  expect(defaults.stickers).toEqual(['starter']);
});
```

- [ ] **Step 2: Run the persistence test and verify RED**

Run: `npm.cmd test -- src/state/persistence.test.js`

Expected: FAIL because `persistence.js` does not exist.

- [ ] **Step 3: Implement safe storage helpers**

Use recursive plain-object merging and clone arrays:

```js
export function mergeDefaults(defaults, value) {
  if (Array.isArray(defaults)) return Array.isArray(value) ? [...value] : [...defaults];
  if (defaults && typeof defaults === 'object') {
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    return Object.fromEntries(Object.keys({ ...defaults, ...source }).map((key) => [
      key,
      key in defaults ? mergeDefaults(defaults[key], source[key]) : source[key],
    ]));
  }
  return value === undefined ? defaults : value;
}
```

Catch storage read/write errors and return an independent default clone on read failure.

- [ ] **Step 4: Verify persistence GREEN**

Run: `npm.cmd test -- src/state/persistence.test.js`

Expected: PASS.

- [ ] **Step 5: Write failing progression tests**

Test local date formatting, same-day no-op, next-day claim, immutable rewards, unique stickers, counters, negative coins, and existing single/multi-level behavior.

```js
it('claims the daily reward once per local calendar day', () => {
  const start = { coins: 20, xp: 5, level: 1, flags: {} };
  const first = claimDaily(start, new Date(2026, 6, 10, 8));
  const second = claimDaily(first.progress, new Date(2026, 6, 10, 22));
  expect(first.claimed).toBe(true);
  expect(first.progress.flags.checkedInDay).toBe('2026-07-10');
  expect(second.claimed).toBe(false);
  expect(second.progress).toEqual(first.progress);
});
```

- [ ] **Step 6: Run progression tests and verify RED**

Run: `npm.cmd test -- src/state/progressionPolicy.test.js`

Expected: FAIL because the policy module does not exist.

- [ ] **Step 7: Implement progression policies and integrate the store**

Move reward math into `applyReward`. In `checkIn()`, keep welcome and quest scheduling once per session; at reward time call `claimDaily(get().progress, new Date())`, update/persist only when `claimed`, and show reward copy only when coins/XP were granted. Replace the embedded shallow `load()` with `loadStored` and persistence writes with `saveStored`.

- [ ] **Step 8: Verify Task 1**

Run: `npm.cmd test -- src/state/persistence.test.js src/state/progressionPolicy.test.js`

Expected: PASS.

- [ ] **Step 9: Commit Task 1**

Stage only the five Task 1 files and commit `refactor: harden Little Buddies progression persistence`.

---

### Task 2: Bounded room service and payload policy

**Files:**
- Create: `server/roomService.js`
- Create: `server/roomService.test.js`
- Modify: `server/rooms.js`

**Interfaces:**
- Produces: `createRoomService({ now, random, maxPlayers, maxLog })`.
- Service methods: `createAndJoin(playerId, profile)`, `join(code, playerId, profile)`, `updateState(playerId, state)`, `recordEvent(playerId, event)`, `leave(playerId)`.
- Produces pure exports: `normalizeRoomCode`, `sanitizeProfile`, `sanitizeState`, `sanitizeEvent`.

- [ ] **Step 1: Write failing room-service tests**

Cover atomic create/join, unique six-character codes, capacity eight, A-to-B switching, last-player deletion, bounded logs, finite/clamped coordinates, bounded profile names, allowed animations/events, and malformed payload rejection.

```js
it('moves a player between rooms without leaking old membership', () => {
  const rooms = createRoomService({ random: () => 0, now: () => 1 });
  const first = rooms.createAndJoin('p1', { name: 'One' });
  const second = rooms.createAndJoin('p2', { name: 'Two' });
  expect(rooms.join(second.code, 'p1', { name: 'One' }).ok).toBe(true);
  expect(rooms.inspect(first.code)).toBeUndefined();
  expect(rooms.inspect(second.code).players).toHaveLength(2);
});
```

- [ ] **Step 2: Run room-service tests and verify RED**

Run: `npm.cmd test -- server/roomService.test.js`

Expected: FAIL because `roomService.js` does not exist.

- [ ] **Step 3: Implement the room service**

Use `Map` for rooms and a reverse `playerRooms` map. `createAndJoin` must remove prior membership, generate a unique code, sanitize the profile, and add the creator before returning. `leave` deletes an empty room immediately. Return copies from `inspect` for tests.

Sanitize state to `{ x, y, z, ry, anim }`, require finite numbers, clamp position to `[-100, 100]`, and allow only known buddy animations. Sanitize events by kind and bounded identifiers. Cap each room log at 200 entries.

- [ ] **Step 4: Verify room-service GREEN**

Run: `npm.cmd test -- server/roomService.test.js`

Expected: PASS.

- [ ] **Step 5: Add failing rate-limit tests**

Inject `now` and assert that state/event bursts over the configured per-second thresholds are rejected while later messages are accepted.

- [ ] **Step 6: Implement minimal token-window rate limiting**

Track `{ startedAt, count }` per player and message class. Use permissive limits suitable for the current 10 Hz state loop: 20 state updates/second and 10 social events/second.

- [ ] **Step 7: Adapt Socket.IO handlers**

Create one service inside `attachRooms`. Make `createRoom` atomic, clean up old Socket.IO membership before room switches, emit sanitized payloads only when the service accepts them, and remove the player through the service on disconnect.

- [ ] **Step 8: Verify Task 2**

Run: `npm.cmd test -- server/roomService.test.js`

Expected: PASS.

- [ ] **Step 9: Commit Task 2**

Commit `fix: harden Little Buddies room lifecycle`.

---

### Task 3: Transport and store reconnect lifecycle

**Files:**
- Create: `src/net/transportLifecycle.js`
- Create: `src/net/transportLifecycle.test.js`
- Modify: `src/net/transport.js`
- Modify: `src/state/store.js`

**Interfaces:**
- Produces: `createTransportSession({ connect, onState, onEvent, onJoined, onLeft, onDisconnect })`.
- Session methods: `host(profile)`, `join(code, profile)`, `sendState(state)`, `sendEvent(event)`, `leave()`.
- Transport `.on(event, callback)` returns an unsubscribe function.
- Socket acknowledgements resolve `{ ok: false, error: 'timeout' }` after three seconds.

- [ ] **Step 1: Write failing lifecycle tests**

Use a small fake transport to prove listener binding once, idempotent leave, listener cleanup, atomic host without a second join, fresh binding after leave/rejoin, acknowledgement timeout, and disconnect cleanup.

```js
it('binds a fresh transport after leave and rejoin', async () => {
  const first = fakeTransport();
  const second = fakeTransport();
  const session = createTransportSession({ connect: vi.fn().mockResolvedValueOnce(first).mockResolvedValueOnce(second) });
  await session.join('ABC123', { name: 'Goober' });
  session.leave();
  await session.join('XYZ789', { name: 'Goober' });
  expect(first.listenerCount()).toBe(0);
  expect(second.listenerCount()).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run lifecycle tests and verify RED**

Run: `npm.cmd test -- src/net/transportLifecycle.test.js`

Expected: FAIL because the lifecycle module does not exist.

- [ ] **Step 3: Implement lifecycle ownership and transport cleanup**

The session owns the current transport and unsubscribe list. `leave()` clears all listeners before closing. Local transport removes its `beforeunload` handler and closes its active channel. `createRoom` binds once and returns an already-joined room. Normalize local room codes with the same server policy.

- [ ] **Step 4: Add acknowledgement timeout and disconnect events**

Wrap Socket.IO acknowledgement calls with a three-second timer. Forward socket `disconnect` through the transport abstraction. Do not silently leave `netStatus` as `on` after disconnect.

- [ ] **Step 5: Integrate the Zustand store**

Remove `_bound`. Delegate host/join/leave to the session, preserve existing store action names, clear the state timer and remote runtime map on leave/disconnect, and keep the 100 ms state broadcast interval only while connected.

- [ ] **Step 6: Verify Task 3**

Run: `npm.cmd test -- src/net/transportLifecycle.test.js server/roomService.test.js`

Expected: PASS.

- [ ] **Step 7: Commit Task 3**

Commit `fix: make Little Buddies multiplayer reconnectable`.

---

### Task 4: Honest presence reporting

**Files:**
- Create: `src/ui/presence.js`
- Create: `src/ui/presence.test.js`
- Modify: `src/ui/HUD.jsx`

**Interfaces:**
- Produces: `presenceSummary(room, remotes)` returning `{ connected, count, label }`.

- [ ] **Step 1: Write failing presence tests**

```js
it('does not claim online players outside a room', () => {
  expect(presenceSummary(null, {})).toEqual({ connected: false, count: 0, label: 'Friends' });
});

it('counts the local player and actual remotes inside a room', () => {
  expect(presenceSummary({ code: 'ABC123' }, { a: {}, b: {} }).count).toBe(3);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm.cmd test -- src/ui/presence.test.js`

Expected: FAIL because `presence.js` does not exist.

- [ ] **Step 3: Implement and wire the presence summary**

Outside a room, render the existing pill as a Friends entry point without a numerical population claim. Inside a room, show the actual total including the local player. Do not change layout or styling.

- [ ] **Step 4: Verify and commit Task 4**

Run: `npm.cmd test -- src/ui/presence.test.js`

Expected: PASS. Commit `fix: report honest Little Buddies presence`.

---

### Task 5: Lazy-load arcade games with recovery

**Files:**
- Modify: `src/games/registry.js`
- Create: `src/games/registry.test.js`
- Modify: `src/games/ArcadeScreen.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Registry open-game entry exposes `load()` returning a cached promise resolving `{ UI, Stage }`.
- Store arcade state adds `module`, `loading`, and `error` fields while preserving `open` and `game`.

- [ ] **Step 1: Write failing registry tests**

Assert unique IDs, valid statuses, coming-soon entries without loaders, one open Dance entry with a loader, promise memoization, and an unknown ID returning no module.

- [ ] **Step 2: Run registry tests and verify RED**

Run: `npm.cmd test -- src/games/registry.test.js`

Expected: FAIL because Dance Studio is still imported eagerly and no loader exists.

- [ ] **Step 3: Implement cached dynamic loading**

Replace eager Dance imports with:

```js
let dancePromise;
const loadDance = () => (dancePromise ||= Promise.all([
  import('./dance/DanceGame.jsx'),
  import('./dance/DanceStage.jsx'),
]).then(([ui, stage]) => ({ UI: ui.DanceUI, Stage: stage.DanceStage })));
```

Keep menu metadata synchronous.

- [ ] **Step 4: Add loading and error handling**

`launchGame(id)` sets `loading`, awaits the registry loader, and stores the resolved module only if the same launch is still active. Failure returns to the arcade menu with an error message. `App` and `ArcadeScreen` read the resolved module instead of eager registry components.

- [ ] **Step 5: Verify lazy loading**

Run: `npm.cmd test -- src/games/registry.test.js`

Run: `npm.cmd run build`

Expected: tests PASS; build emits separate Dance chunks and the initial `index-*.js` is smaller than the 1,201.33 kB baseline.

- [ ] **Step 6: Commit Task 5**

Commit `perf: lazy load Little Buddies arcade games`.

---

### Task 6: Contain local server file operations

**Files:**
- Create: `server/staticHandler.js`
- Create: `server/staticHandler.test.js`
- Create: `server/snapshotHandler.js`
- Create: `server/snapshotHandler.test.js`
- Modify: `server/index.js`
- Modify: `vite.config.js`

**Interfaces:**
- Produces: `resolveDistPath(dist, requestUrl)` returning an absolute contained path or `null`.
- Produces: `createStaticHandler({ dist })`.
- Produces: `createSnapshotHandler({ outputDir, maxBytes })`.

- [ ] **Step 1: Write failing containment tests**

Cover `/`, query strings, SPA fallback, encoded traversal, backslash traversal, unsupported methods, oversized snapshot bodies, invalid base64, sanitized names, and successful bounded JPEG writes.

- [ ] **Step 2: Run server handler tests and verify RED**

Run: `npm.cmd test -- server/staticHandler.test.js server/snapshotHandler.test.js`

Expected: FAIL because the handlers do not exist.

- [ ] **Step 3: Implement contained static serving**

Decode the URL pathname safely, normalize separators, resolve beneath `dist`, and verify the result starts with `dist + path.sep`. Return 400 for malformed encoding, 403 for traversal, 404/SPA fallback for missing application routes, and 500 on stream errors.

- [ ] **Step 4: Implement bounded snapshot middleware**

Accept only `POST`; reject bodies above 5 MB while streaming; validate base64 syntax and decoded JPEG signature; sanitize the filename; use asynchronous file writes; return 201 on success.

- [ ] **Step 5: Wire handlers and verify Task 6**

Run: `npm.cmd test -- server/staticHandler.test.js server/snapshotHandler.test.js`

Expected: PASS. Commit `fix: contain Little Buddies local server writes`.

---

### Task 7: Full integration verification

**Files:**
- Modify only if a failing verification exposes a regression covered by a new failing test.

- [ ] **Step 1: Run the full automated suite**

Run: `npm.cmd test`

Expected: all test files pass with no runtime errors.

- [ ] **Step 2: Run the production build**

Run: `npm.cmd run build`

Expected: build succeeds and Dance Studio code is split from the initial entry chunk.

- [ ] **Step 3: Run a local desktop smoke test**

Verify creator entry, intro skip, world HUD, arcade entry, Dance Studio loading, song selection, back-to-arcade, host/leave/rejoin, and no browser console errors.

- [ ] **Step 4: Run a 390×844 regression smoke test**

Verify the existing mobile creator, intro, world, and arcade flows still render and respond. Record visual issues for the next phase; do not redesign them here.

- [ ] **Step 5: Review scope and working tree**

Confirm only intended Little Buddies files changed and the unrelated `Website/story-project-links.html` and `story.html` remain untouched.

- [ ] **Step 6: Commit any verification-only test fixes**

If needed, commit `test: cover Little Buddies foundation integration`. Otherwise make no empty commit.

