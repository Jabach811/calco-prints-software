# Room 107 Progression Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a persistent fixed-slot Room 107 that turns existing Little Buddies activities into decoration rewards and guides new and returning players through their first room placement.

**Architecture:** Add a lazy-loaded room scene and editor under `src/room/`, backed by a pure catalog/model boundary and integrated through narrowly scoped Zustand actions. The outdoor world and room are mutually exclusive scene modes using the existing curtain lifecycle; saved progress stores catalog IDs and is repaired by a deterministic migration before use.

**Tech Stack:** React 18, React Three Fiber 8, Drei 9, Three.js 0.169, Zustand 4, Vite 5, Vitest 4, CSS, browser `localStorage`.

## Global Constraints

- Use exactly five fixed slots: `bed`, `rug`, `wall`, `shelf`, and `trophy`.
- Ship exactly fifteen initial decorations: three compatible items per slot.
- Add no runtime dependency and no external image, font, or 3D-model asset.
- Store decoration IDs rather than copied catalog objects.
- Existing profiles, coins, XP, quests, stickers, collectibles, snacks, phrases, flags, settings, and multiplayer behavior must survive migration unchanged.
- Room unlocks are idempotent; repeated activities retain normal rewards but never duplicate room items.
- Room modules must not enter the initial eager JavaScript dependency path.
- The outdoor world must unmount while Room 107 is active.
- Touch targets must be at least 44 by 44 CSS pixels and the editor must work by keyboard.
- `prefers-reduced-motion: reduce` must remove room camera sweeps, slot bounce, placement flourishes, and tray transitions.
- Record the pre-feature production baseline as 113 passing tests and `342.69 kB` gzip for the main JavaScript chunk; investigate any initial-load gzip increase greater than 10 KB.
- Do not stage or commit unrelated existing work. Every commit uses explicit Room 107 paths.

---

## Planned file structure

**Create**

- `src/room/roomCatalog.js` — slot constants, fifteen immutable catalog entries, lookups, and validation.
- `src/room/roomModel.js` — pure default creation, save migration, unlock, equip, remove, and journey transition functions.
- `src/room/roomModel.test.js` — catalog/model/migration/journey tests.
- `src/room/RoomDecor.jsx` — procedural geometry selected from validated catalog render kinds.
- `src/room/RoomScene.jsx` — bedroom shell, lighting, buddy, five accessible slot anchors, and equipped decorations.
- `src/room/RoomEditor.jsx` — DOM editor for the selected slot.
- `src/room/RoomScreen.jsx` — room Canvas/UI composition and exit control.
- `src/room/roomEntry.js` — lazy import boundary exported to `App.jsx`.
- `src/room/roomIntegration.test.js` — pure reward and transition integration tests.

**Modify**

- `src/state/store.js` — migrate loaded progress, add room scene state/actions, journey advancement, and decoration reward hooks.
- `src/App.jsx` — lazy-load `RoomScreen` and make room/world scene modes exclusive.
- `src/ui/HUD.jsx` — replace the placeholder Home behavior with room entry or the active unlock objective.
- `src/ui/Panels.jsx` — remove the Room 107 construction stub while preserving unrelated panels.
- `src/games/dance/DanceGame.jsx` — report stable track ID and decorate first-clear/high-grade results.
- `src/main.jsx` — restrict Fontsource imports to Latin CSS entry points.
- `src/styles.css` — room/editor/responsive/focus/reduced-motion styling.

---

### Task 1: Pure room catalog and saved-data model

**Files:**
- Create: `src/room/roomCatalog.js`
- Create: `src/room/roomModel.js`
- Create: `src/room/roomModel.test.js`

**Interfaces:**
- Produces: `ROOM_SLOTS`, `ROOM_CATALOG`, `roomItemById`, `validateRoomCatalog(catalog)`.
- Produces: `createRoomProgress()`, `migrateRoomProgress(progress)`, `unlockRoomItem(progress, itemId)`, `equipRoomItem(progress, slotId, itemId)`, `removeRoomItem(progress, slotId)`, and `advanceWelcomeHome(progress, event)`.
- All mutators return `{ progress, changed, reason }` and never mutate the supplied object.

- [ ] **Step 1: Write catalog and model contract tests**

Create `src/room/roomModel.test.js` with focused tests:

```js
import { describe, expect, it } from 'vitest';
import { ROOM_CATALOG, ROOM_SLOTS, validateRoomCatalog } from './roomCatalog.js';
import {
  createRoomProgress,
  migrateRoomProgress,
  unlockRoomItem,
  equipRoomItem,
  removeRoomItem,
  advanceWelcomeHome,
} from './roomModel.js';

describe('room catalog', () => {
  it('contains exactly three valid items for each fixed slot', () => {
    expect(validateRoomCatalog(ROOM_CATALOG)).toEqual([]);
    expect(ROOM_CATALOG).toHaveLength(15);
    for (const slot of ROOM_SLOTS) {
      expect(ROOM_CATALOG.filter((item) => item.slot === slot)).toHaveLength(3);
    }
  });
});

describe('room progress', () => {
  it('migrates current saves without changing unrelated progress', () => {
    const old = { coins: 205, xp: 40, level: 7, flags: { flowerSticker: true } };
    const migrated = migrateRoomProgress(old);
    expect(migrated.coins).toBe(205);
    expect(migrated.flags).toEqual({ flowerSticker: true });
    expect(migrated.roomLayout).toEqual({ bed: null, rug: null, wall: null, shelf: null, trophy: null });
  });

  it('repairs duplicates, unknown IDs, and incompatible layout entries', () => {
    const migrated = migrateRoomProgress({
      roomInventory: ['sunny-rug', 'sunny-rug', 'missing'],
      roomLayout: { rug: 'sunny-rug', wall: 'sunny-rug', shelf: 'missing' },
    });
    expect(migrated.roomInventory).toEqual(['sunny-rug']);
    expect(migrated.roomLayout.rug).toBe('sunny-rug');
    expect(migrated.roomLayout.wall).toBeNull();
    expect(migrated.roomLayout.shelf).toBeNull();
  });

  it('unlocks once and enforces ownership and slot compatibility', () => {
    let p = createRoomProgress();
    const first = unlockRoomItem(p, 'sunny-rug');
    expect(first.changed).toBe(true);
    p = first.progress;
    expect(unlockRoomItem(p, 'sunny-rug').changed).toBe(false);
    expect(equipRoomItem(p, 'wall', 'sunny-rug').reason).toBe('wrong-slot');
    expect(equipRoomItem(p, 'rug', 'cloud-rug').reason).toBe('not-owned');
    expect(equipRoomItem(p, 'rug', 'sunny-rug').progress.roomLayout.rug).toBe('sunny-rug');
    expect(removeRoomItem(equipRoomItem(p, 'rug', 'sunny-rug').progress, 'rug').progress.roomLayout.rug).toBeNull();
  });

  it('advances the welcome journey only on explicit matching events', () => {
    let p = createRoomProgress();
    p = advanceWelcomeHome(p, 'desk-met').progress;
    expect(p.journeys.welcomeHome.step).toBe('do-first-activity');
    expect(advanceWelcomeHome(p, 'room-entered').changed).toBe(false);
    p = advanceWelcomeHome(p, 'eligible-activity').progress;
    expect(p.journeys.welcomeHome.step).toBe('receive-decoration');
  });
});
```

- [ ] **Step 2: Run the test and confirm the missing-module failure**

Run: `npm test -- src/room/roomModel.test.js`

Expected: FAIL because `roomCatalog.js` and `roomModel.js` do not exist.

- [ ] **Step 3: Implement the immutable catalog**

Create `src/room/roomCatalog.js` with `ROOM_SLOTS = Object.freeze(['bed', 'rug', 'wall', 'shelf', 'trophy'])`, fifteen frozen entries, and these required IDs:

```js
const HEX = /^#[0-9A-F]{6}$/i;

function item(id, name, slot, rarity, source, kind, color, accent) {
  return Object.freeze({
    id, name, icon: id, slot, rarity, source,
    render: Object.freeze({ kind, color, accent }),
  });
}

export const ROOM_CATALOG = Object.freeze([
  item('cozy-bed', 'Cozy Bed', 'bed', 'starter', 'level-7', 'bed', '#D8A45B', '#FFF8E8'),
  item('cloud-bed', 'Cloud Bed', 'bed', 'common', 'level-8', 'bed', '#8ED4F7', '#FFFFFF'),
  item('starlight-bed', 'Starlight Bed', 'bed', 'rare', 'daily', 'bed', '#493B78', '#FFD23F'),
  item('sunny-rug', 'Sunny Rug', 'rug', 'starter', 'welcome-home', 'rug', '#FFD23F', '#FFF8E8'),
  item('splash-rug', 'Splash Rug', 'rug', 'common', 'slide-first', 'rug', '#3D8BFD', '#8ED4F7'),
  item('garden-rug', 'Garden Rug', 'rug', 'common', 'daily', 'rug', '#54C24E', '#FFF8E8'),
  item('postcard-frame', 'Postcard Frame', 'wall', 'common', 'mailbox-first', 'wall', '#D8A45B', '#FFF8E8'),
  item('disco-light', 'Disco Light', 'wall', 'rare', 'dance-first', 'wall', '#9B5DE5', '#FFD23F'),
  item('buddy-banner', 'Buddy Banner', 'wall', 'common', 'daily', 'wall', '#3D8BFD', '#FFF8E8'),
  item('flower-pot', 'Flower Pot', 'shelf', 'common', 'watering-first', 'shelf', '#54C24E', '#F15BB5'),
  item('lucky-leaf', 'Lucky Leaf', 'shelf', 'common', 'collectible-leaf', 'shelf', '#35743A', '#FFD23F'),
  item('glow-mushroom', 'Glow Mushroom', 'shelf', 'rare', 'daily', 'shelf', '#9B5DE5', '#FFF8E8'),
  item('pool-float-trophy', 'Pool Float Trophy', 'trophy', 'common', 'slide-first', 'trophy', '#3D8BFD', '#FFFFFF'),
  item('gold-record', 'Gold Record', 'trophy', 'rare', 'dance-a-grade', 'trophy', '#F0B429', '#35301F'),
  item('friendship-star', 'Friendship Star', 'trophy', 'rare', 'daily', 'trophy', '#FFD23F', '#F15BB5'),
]);
```

Implement `validateRoomCatalog()` to return readable error strings for duplicate IDs, invalid slots, missing labels, invalid `#RRGGBB` colors, and render kinds outside `ROOM_SLOTS`.

- [ ] **Step 4: Implement pure migration and actions**

Create `src/room/roomModel.js`. Build fresh nested objects on every changed result. Use `roomItemById` for validation. Define exact reasons: `unlocked`, `already-owned`, `unknown-item`, `unknown-slot`, `not-owned`, `wrong-slot`, `equipped`, `removed`, `already-empty`, `advanced`, and `event-ignored`.

`migrateRoomProgress()` must spread all unrelated top-level progress fields and then repair only `roomUnlocked`, `roomInventory`, `roomLayout`, and `journeys.welcomeHome`.

- [ ] **Step 5: Run focused and complete tests**

Run: `npm test -- src/room/roomModel.test.js`

Expected: the new file passes.

Run: `npm test`

Expected: 15 test files pass and no existing test regresses.

- [ ] **Step 6: Commit only Task 1 files**

```powershell
git add -- 'src/room/roomCatalog.js' 'src/room/roomModel.js' 'src/room/roomModel.test.js'
git commit -m "feat: add Room 107 data model"
```

---

### Task 2: Integrate migration, room actions, and save persistence

**Files:**
- Modify: `src/state/store.js`
- Create: `src/room/roomIntegration.test.js`

**Interfaces:**
- Consumes: Task 1 model functions and catalog IDs.
- Produces store state `roomScene: { open, editingSlot }` and actions `enterRoom`, `exitRoom`, `selectRoomSlot`, `equipRoomItem`, `removeRoomItem`, `unlockRoomItem`, and `advanceWelcomeHome`.
- Multiplayer continues using existing `room`; do not rename it. The new local scene state is deliberately named `roomScene`.

- [ ] **Step 1: Extract and test store-facing transition decisions**

In `src/room/roomIntegration.test.js`, test pure helpers exported from `roomModel.js`:

```js
import { expect, it } from 'vitest';
import { createRoomProgress, roomEntryDecision } from './roomModel.js';

it('blocks entry before unlock with the current objective', () => {
  const result = roomEntryDecision(createRoomProgress());
  expect(result).toEqual({ allowed: false, objective: 'Meet the front-desk buddy' });
});

it('allows an unlocked room', () => {
  const result = roomEntryDecision({ ...createRoomProgress(), roomUnlocked: true });
  expect(result).toEqual({ allowed: true, objective: null });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- src/room/roomIntegration.test.js`

Expected: FAIL because `roomEntryDecision` has not been exported.

- [ ] **Step 3: Implement room-entry decisions and objective copy**

Add `WELCOME_OBJECTIVES` and `roomEntryDecision(progress)` to `roomModel.js`. Each journey step must map to exact copy, including `Place the Sunny Rug in Room 107` for `place-decoration` and `Explore the hotel` after completion.

- [ ] **Step 4: Migrate progress at store initialization**

In `src/state/store.js`, import the model functions with aliases to avoid action-name collisions:

```js
import {
  migrateRoomProgress,
  unlockRoomItem as unlockRoomItemModel,
  equipRoomItem as equipRoomItemModel,
  removeRoomItem as removeRoomItemModel,
  advanceWelcomeHome as advanceWelcomeHomeModel,
  roomEntryDecision,
} from '../room/roomModel.js';
```

Replace direct progress initialization with:

```js
progress: migrateRoomProgress(load('lbw-progress', DEFAULT_PROGRESS) || { ...DEFAULT_PROGRESS }),
roomScene: { open: false, editingSlot: null },
```

Do not change the existing multiplayer `room: null` field.

- [ ] **Step 5: Add store actions with one persistence boundary**

Implement a small internal `applyRoomResult(result, toast)` helper or equivalent store actions so every changed model result updates `progress`, persists exactly once, and optionally shows one toast. `equipRoomItem` must receive explicit `slotId` and `itemId`; after equipping `sunny-rug`, call `advanceWelcomeHome('sunny-rug-placed')`.

`enterRoom()` must return `false` and toast the current objective while locked. When allowed, it must reject calls during an active curtain, close `homeOpen`, set `curtain: 'closing'`, and after 700 ms set `roomScene.open = true`, clear `editingSlot`, advance `room-entered`, pause ambient audio, and open the curtain. `exitRoom()` mirrors the lifecycle and resumes ambient audio.

- [ ] **Step 6: Test hydration and actions without widening scope**

Add tests to `roomIntegration.test.js` for the pure results used by store actions: explicit stale-slot protection, unchanged progress on invalid input, and the `sunny-rug-placed` journey event.

Run: `npm test -- src/room/roomModel.test.js src/room/roomIntegration.test.js`

Expected: PASS.

Run: `npm test`

Expected: all test files pass.

- [ ] **Step 7: Commit only store integration files**

```powershell
git add -- 'src/state/store.js' 'src/room/roomModel.js' 'src/room/roomIntegration.test.js'
git commit -m "feat: integrate persistent room state"
```

---

### Task 3: Build the Room 107 scene and procedural decorations

**Files:**
- Create: `src/room/RoomDecor.jsx`
- Create: `src/room/RoomScene.jsx`
- Modify: `src/room/roomCatalog.js`
- Modify: `src/room/roomModel.test.js`

**Interfaces:**
- Consumes: `ROOM_CATALOG`, `roomItemById`, saved `roomLayout`, and existing `Buddy`/`mat()` APIs.
- Produces: `<RoomScene profile layout selectedSlot onSelectSlot reducedMotion />`.
- Produces: `<RoomDecor item position rotation scale />` with one renderer for each allowed `render.kind`.

- [ ] **Step 1: Add render-contract assertions**

Extend `roomModel.test.js` to assert every catalog entry has finite placement metadata:

```js
for (const item of ROOM_CATALOG) {
  expect(item.render.kind).toBe(item.slot);
  expect(item.render.color).toMatch(/^#[0-9A-F]{6}$/i);
  expect(item.render.accent).toMatch(/^#[0-9A-F]{6}$/i);
}
```

Run: `npm test -- src/room/roomModel.test.js`

Expected: PASS before visual work begins.

- [ ] **Step 2: Implement reusable procedural decoration renderers**

Create `RoomDecor.jsx` with focused components `BedDecor`, `RugDecor`, `WallDecor`, `ShelfDecor`, and `TrophyDecor`. Use existing `mat(color, kind)` materials, low-segment primitives, and stable geometry. Select by `item.render.kind`; return `null` for absent items.

Do not create new materials inside `useFrame`. Do not enable decoration shadows by default.

- [ ] **Step 3: Build the room shell and fixed anchors**

Create `RoomScene.jsx` containing:

- Cream back and side walls.
- Painted wood floor and trim.
- Window frame with a static sky/ground backdrop.
- Existing `Buddy` rendered from the active profile.
- Five slot groups at fixed coordinates.
- One invisible or subtly outlined button mesh per slot.
- Visible focus/selection rings driven by `selectedSlot`.

Use this slot contract:

```js
export const ROOM_SLOT_ANCHORS = Object.freeze({
  bed: { position: [-2.8, 0, 0.9], rotation: [0, 0.18, 0] },
  rug: { position: [0, 0.035, 1.2], rotation: [-Math.PI / 2, 0, 0] },
  wall: { position: [0, 2.35, 2.86], rotation: [0, Math.PI, 0] },
  shelf: { position: [2.65, 1.25, 2.55], rotation: [0, Math.PI, 0] },
  trophy: { position: [2.55, 0.82, 0.25], rotation: [0, -0.25, 0] },
});
```

The DOM editor supplies keyboard accessibility; scene meshes must still respond to pointer selection and expose a pointer cursor.

- [ ] **Step 4: Verify code and rendering stability**

Run: `npm test -- src/room/roomModel.test.js`

Run: `npm run build`

Expected: tests pass and the build succeeds without Three.js hook errors.

- [ ] **Step 5: Commit the scene boundary**

```powershell
git add -- 'src/room/RoomDecor.jsx' 'src/room/RoomScene.jsx' 'src/room/roomCatalog.js' 'src/room/roomModel.test.js'
git commit -m "feat: build Room 107 scene"
```

---

### Task 4: Build the accessible editor and lazy-loaded room screen

**Files:**
- Create: `src/room/RoomEditor.jsx`
- Create: `src/room/RoomScreen.jsx`
- Create: `src/room/roomEntry.js`
- Modify: `src/App.jsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: Task 2 store actions and Task 3 `RoomScene`.
- Produces: default export from `roomEntry.js` suitable for `React.lazy`.
- Produces: a fully operable room screen that never mounts with the outdoor world.

- [ ] **Step 1: Implement the editor as a controlled DOM surface**

`RoomEditor.jsx` must derive compatible owned items with:

```js
const compatible = ROOM_CATALOG.filter(
  (item) => item.slot === slotId && inventory.includes(item.id),
);
```

Render five native slot buttons at all times so keyboard and touch users do not depend on clicking 3D meshes. Give the group `aria-label="Room decoration slots"`, each slot button `aria-pressed`, and every item choice an `aria-pressed` equipped state. Include exact Empty, Remove, and Back behaviors.

- [ ] **Step 2: Compose the room screen**

`RoomScreen.jsx` mounts its own `<Canvas frameloop="never">`, `SizeSync`, `RoomScene`, editor overlay, journey objective, and visible `Back outside` button. Read profile, progress, room state, and actions through narrow Zustand selectors.

Handle Escape in this order:

1. Clear `editingSlot` if an editor is open.
2. Otherwise call `exitRoom()` if no curtain transition is active.

- [ ] **Step 3: Add a real lazy-import boundary**

Create `roomEntry.js`:

```js
export { RoomScreen as default } from './RoomScreen.jsx';
```

In `App.jsx`, add:

```js
const LazyRoomScreen = React.lazy(() => import('./room/roomEntry.js'));
```

Read `roomOpen = useGame((s) => s.roomScene.open)`. When true, render only `<Suspense fallback={<div className="room-loading">Opening Room 107...</div>}><LazyRoomScreen /></Suspense>` plus the shared curtain. Preserve the creator and arcade paths exactly.

- [ ] **Step 4: Add responsive, focus, and reduced-motion CSS**

Add `.room-*` styles without changing existing creator selectors. Requirements:

- Editor buttons minimum 44 px height.
- `:focus-visible` outline at least 3 px with sufficient contrast.
- Slot strip wraps on narrow widths.
- Item tray scrolls internally at short heights.
- `env(safe-area-inset-*)` protects exit and editor controls.
- At `max-width: 600px`, the editor uses the lower portion of the screen without covering the buddy entirely.
- In `prefers-reduced-motion: reduce`, room transitions and item animation durations become `0.01ms` and scene-driven flourish flags are disabled through `matchMedia` state.

- [ ] **Step 5: Verify lazy output and regression suite**

Run: `npm test`

Expected: all tests pass.

Run: `npm run build`

Expected: a separate room chunk appears in `dist/assets`; `roomEntry`/`RoomScreen` must not be folded into the main chunk.

Record the new main-chunk gzip size in the plan execution notes. If it exceeds `352.69 kB`, stop and inspect imports before continuing.

- [ ] **Step 6: Commit only room-screen paths and deliberate integration hunks**

Because `src/styles.css` already contains user changes, inspect `git diff -- src/styles.css` and stage only the Room 107 additions using a patch-safe method. Then commit:

```powershell
git add -- 'src/room/RoomEditor.jsx' 'src/room/RoomScreen.jsx' 'src/room/roomEntry.js' 'src/App.jsx'
git commit -m "feat: add lazy Room 107 editor"
```

Include the Room 107 CSS hunk only after confirming no pre-existing style changes are captured.

---

### Task 5: Replace the Home stub and implement the welcome-home journey

**Files:**
- Modify: `src/ui/HUD.jsx`
- Modify: `src/ui/Panels.jsx`
- Modify: `src/state/store.js`
- Modify: `src/room/roomIntegration.test.js`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `roomEntryDecision`, `advanceWelcomeHome`, and room store actions.
- Produces: one concise journey objective and a functional Home control.

- [ ] **Step 1: Add failing journey integration cases**

Test these exact transitions in `roomIntegration.test.js`:

```js
it('completes welcome-home only after the Sunny Rug is placed', () => {
  let p = {
    ...createRoomProgress(),
    roomUnlocked: true,
    roomInventory: ['sunny-rug'],
    journeys: { welcomeHome: { step: 'enter-room', completed: false } },
  };
  p = advanceWelcomeHome(p, 'room-entered').progress;
  expect(p.journeys.welcomeHome.step).toBe('place-decoration');
  expect(advanceWelcomeHome(p, 'different-item-placed').changed).toBe(false);
  p = advanceWelcomeHome(p, 'sunny-rug-placed').progress;
  expect(p.journeys.welcomeHome.completed).toBe(true);
});
```

Run: `npm test -- src/room/roomIntegration.test.js`

Expected: FAIL until returning-player migration and placement events are complete.

- [ ] **Step 2: Connect the front-desk and eligible-activity events**

In the existing `interact()` switch in `store.js`, fire `advanceWelcomeHome('desk-met')` from the check-in/front-desk action that grants initial access. Fire `eligible-activity` only from the first mailbox-open or approved simple activity completion. Do not advance on panel opening or movement alone.

When entering `receive-decoration`, unlock `sunny-rug`, set `roomUnlocked: true`, advance immediately to `enter-room`, and show one `Sunny Rug unlocked for Room 107!` toast.

- [ ] **Step 3: Replace Home panel behavior**

Change the HUD Home button to call `useGame.getState().enterRoom()` directly. Remove `HomePanel` and its `homeOpen` rendering from `AllPanels`; retain backward-compatible cleanup of any hydrated `homeOpen` boolean by setting it false on entry.

For locked rooms, `enterRoom()` displays the exact current journey objective. Do not open a modal saying the room is under construction.

- [ ] **Step 4: Show one objective in the HUD**

Extend `PlayerCard` or the existing quest pill to prioritize the active welcome-home objective until it completes, then fall back to the first unfinished existing quest. Avoid displaying both simultaneously.

- [ ] **Step 5: Verify new and returning-player state paths**

Run: `npm test -- src/room/roomModel.test.js src/room/roomIntegration.test.js`

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 6: Commit journey integration**

```powershell
git add -- 'src/ui/HUD.jsx' 'src/ui/Panels.jsx' 'src/state/store.js' 'src/room/roomIntegration.test.js'
git commit -m "feat: guide players into Room 107"
```

Stage only newly added Room 107 CSS hunks if styles changed.

---

### Task 6: Connect existing activities to decoration rewards

**Files:**
- Modify: `src/state/store.js`
- Modify: `src/games/dance/DanceGame.jsx`
- Modify: `src/room/roomIntegration.test.js`
- Modify: `src/room/roomCatalog.js`

**Interfaces:**
- Consumes: `unlockRoomItem(itemId)` store action.
- Produces: deterministic first-time room rewards without altering existing coins, XP, stickers, or quest semantics.

- [ ] **Step 1: Define a pure reward-event mapping and tests**

Add to `roomModel.js`:

```js
export function roomRewardForEvent(event) {
  const fixed = {
    'mailbox:first-open': 'postcard-frame',
    'watering:first-complete': 'flower-pot',
    'slide:first-complete': 'pool-float-trophy',
    'dance:first-clear': 'disco-light',
    'collectible:leaf': 'lucky-leaf',
    'level:7': 'cozy-bed',
    'level:8': 'cloud-bed',
  };
  if (fixed[event]) return fixed[event];
  if (event === 'dance:grade:A' || event === 'dance:grade:S') return 'gold-record';
  return null;
}
```

Test every mapping plus unknown-event `null` and A/S idempotency through `unlockRoomItem`.

- [ ] **Step 2: Run focused tests and verify missing-helper failure**

Run: `npm test -- src/room/roomIntegration.test.js`

Expected: FAIL because `roomRewardForEvent` is missing.

- [ ] **Step 3: Integrate mailbox, watering, slide, collectible, and level events**

Call a store helper `grantRoomReward(event)` only at the existing completion point for each activity. The helper resolves the item ID, calls `unlockRoomItem`, and shows an unlock toast only when `changed` is true.

For level rewards, capture every level crossed by the existing `while (p.xp >= p.level * 100)` loop and dispatch the corresponding reward after the progress update so large XP awards cannot skip a bed unlock.

- [ ] **Step 4: Integrate Dance Studio with stable identifiers**

Change `finishDance` to accept `{ grade, songId, songName }`. In `DanceGame.jsx`, pass `track.id` and `track.name`. Preserve the existing result toast and coin calculation. Trigger `dance:first-clear` on the first completed chart and `dance:grade:A` or `dance:grade:S` on the first qualifying result.

Keep the existing Disco Sticker behavior separate from the room Disco Light.

- [ ] **Step 5: Add a deterministic daily rotation**

Use local calendar date plus a fixed ordered pool `['starlight-bed', 'garden-rug', 'buddy-banner', 'glow-mushroom', 'friendship-star']`. The daily reward selects `pool[dayNumber % pool.length]`. Store the last awarded room-date flag separately from the existing daily coin claim so current anti-double-claim behavior remains intact.

Test same-day idempotency and different-day selection through pure functions with injected date strings; do not test by changing the machine clock.

- [ ] **Step 6: Run all tests and build**

Run: `npm test`

Expected: all tests pass, including existing dance-engine/chart tests.

Run: `npm run build`

Expected: production build succeeds and Dance Studio remains lazy from the initial path.

- [ ] **Step 7: Commit reward integrations**

```powershell
git add -- 'src/state/store.js' 'src/games/dance/DanceGame.jsx' 'src/room/roomModel.js' 'src/room/roomIntegration.test.js' 'src/room/roomCatalog.js'
git commit -m "feat: award Room 107 decorations"
```

---

### Task 7: Accessibility, responsive behavior, and initial-load performance

**Files:**
- Modify: `src/room/RoomScreen.jsx`
- Modify: `src/room/RoomScene.jsx`
- Modify: `src/room/RoomEditor.jsx`
- Modify: `src/main.jsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: completed Room 107 experience.
- Produces: keyboard/touch/reduced-motion behavior and a main bundle within the approved budget.

- [ ] **Step 1: Restrict Fontsource imports to Latin subsets**

Replace generic imports in `src/main.jsx` with the package's Latin CSS entry points:

```js
import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/baloo-2/latin-600.css';
import '@fontsource/baloo-2/latin-700.css';
```

Run `npm run build` and confirm Devanagari, Cyrillic, and Vietnamese font files are absent from `dist/assets`.

- [ ] **Step 2: Complete keyboard focus management**

When a scene slot is selected, focus the matching editor slot button or tray heading. When the editor closes, return focus to the originating slot button. Use refs and `requestAnimationFrame` for focus timing; never call `.focus()` during render.

Confirm Escape closes the tray first and exits the room second.

- [ ] **Step 3: Complete reduced-motion handling**

Add a `useReducedMotion` hook local to the room feature or a small shared pure helper. Subscribe to `matchMedia('(prefers-reduced-motion: reduce)')` changes. Pass the boolean to `RoomScene` and skip camera/placement animation state rather than merely hiding it with CSS.

- [ ] **Step 4: Verify responsive layouts manually**

Start: `npm run dev`

Check desktop, short landscape, and 390 by 844 portrait. Confirm:

- Buddy remains visible while editing.
- All five slot controls remain reachable.
- Item tray scrolls without moving the game canvas.
- Exit and Back controls clear phone safe areas.
- No text or button is clipped.
- Every target is at least 44 by 44 pixels.

- [ ] **Step 5: Verify performance boundary**

Run: `npm run build`

Confirm:

- A separate room chunk exists.
- The initial main chunk is no more than `352.69 kB` gzip.
- Only Latin font assets are emitted.
- No room module is imported from `store.js`; store imports pure `roomModel.js` only.
- Outdoor `World` and `RoomScreen` are mutually exclusive in React DevTools or instrumented mount logs removed before commit.

- [ ] **Step 6: Run full automated verification**

Run: `npm test`

Expected: all test files pass.

Run: `npm run build`

Expected: production build succeeds without new chunk-size warnings attributable to Room 107.

- [ ] **Step 7: Commit the polish and performance work**

```powershell
git add -- 'src/room/RoomScreen.jsx' 'src/room/RoomScene.jsx' 'src/room/RoomEditor.jsx' 'src/main.jsx'
git commit -m "perf: polish Room 107 across devices"
```

Stage only Room 107 additions from `src/styles.css`; leave pre-existing creator/style work untouched.

---

### Task 8: Complete browser QA, regression audit, and release handoff

**Files:**
- Modify if evidence requires fixes: Room 107 files listed in Tasks 1–7 only.
- Do not modify unrelated website or Toy Workshop files during this task.

**Interfaces:**
- Consumes: complete implementation.
- Produces: verified release candidate and exact evidence for handoff.

- [ ] **Step 1: Test fresh-player onboarding**

Back up `lbw-profile` and `lbw-progress` values, then clear them through browser storage tools. Verify creator -> cinematic -> front desk -> eligible activity -> Sunny Rug -> Room 107 -> place rug -> completion reward. Refresh at each journey step in separate passes and confirm correct resumption.

- [ ] **Step 2: Test returning-player migration**

Seed a current-shape save with level 7, coins 205, XP 40, existing stickers/collectibles, and no room fields. Reload and verify all old values remain, Room 107 becomes available through the returning-player path, and Sunny Rug is awarded once.

- [ ] **Step 3: Test room editing matrix**

Verify empty, partial, and fully equipped layouts; replace every slot; remove every slot; refresh; rapidly switch slots; attempt repeated unlocks; and repeatedly enter/exit. Confirm no stale-slot equips, duplicate items, stuck curtains, or concurrent world/room mounts.

- [ ] **Step 4: Test reward matrix**

Verify each source once and repeated:

- Mailbox -> Postcard Frame.
- Watering completion -> Flower Pot.
- Slide completion -> Pool Float Trophy.
- First dance clear -> Disco Light.
- A/S dance grade -> Gold Record.
- Leaf collectible -> Lucky Leaf.
- Levels 7 and 8 -> corresponding beds.
- Daily rotation -> one eligible item per local date.

Normal coins, XP, stickers, quests, and dance results must remain unchanged except for their intended existing behavior.

- [ ] **Step 5: Test accessibility and devices**

Verify desktop mouse, keyboard-only, touch/mobile portrait at 390 by 844, short landscape, and reduced-motion mode. Confirm visible focus, correct Escape/Back order, accessible button names, 44 px targets, safe-area spacing, and no required information available only through the 3D canvas.

- [ ] **Step 6: Run final commands and record exact output**

Run:

```powershell
npm test
npm run build
git status --short --branch
git diff --check
```

Expected:

- All tests pass.
- Production build succeeds.
- Main JavaScript remains within the approved gzip budget or the measured exception is explicitly reviewed.
- No whitespace errors.
- Only intended Room 107 changes appear in Room 107 commits; pre-existing dirty files remain preserved.

- [ ] **Step 7: Review against the definition of done**

Open `docs/superpowers/specs/2026-07-12-room-107-progression-design.md` and match every Definition of Done bullet to automated output or a browser QA result. Fix any uncovered requirement before claiming completion.

- [ ] **Step 8: Prepare the handoff**

Report:

- What players can now do.
- Exact test and build totals.
- Final main-chunk gzip size and font output change.
- Browser/device scenarios verified.
- Any preserved pre-existing dirty files.
- Remaining non-goals: free placement, room commerce, room visits, second arcade game, and map expansion.

Do not publish, push, or merge unless the user separately authorizes that action.
