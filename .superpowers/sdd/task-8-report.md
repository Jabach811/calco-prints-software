# Room 107 Task 8 QA Report

## Status

**DONE_WITH_CONCERNS**

The release candidate passes the complete automated suite and production build after two evidence-backed Task 8 fixes. Interactive Windows/browser control was unavailable, and the fallback CDP run did not complete reliably, so manual mouse, touch, live WebGL composition, focus-ring appearance, and low-end frame stability are not claimed as verified in this task.

## Defects found and fixed with TDD

1. **Returning-player migration was missing.** A current-shape save with a profile and progress but no Room 107 fields was treated as a new Room 107 player: the room stayed locked, Sunny Rug was absent, and the journey restarted at the front desk. A failing migration test reproduced this. Migration now distinguishes a real legacy save from a fresh fallback, preserves unrelated values, unlocks Room 107, adds exactly one Sunny Rug, and resumes at `enter-room`.
2. **Welcome-home completion reward was missing.** Equipping Sunny Rug completed the journey but awarded no coins or XP. A failing store integration test reproduced this. The first qualifying placement now awards +25 coins and +25 XP with one toast; repeated equip is a no-op and cannot repeat the reward.

TDD red evidence:

- Returning migration test failed with `roomUnlocked: false`, `roomInventory: []`, and `step: "meet-front-desk"`.
- Completion reward test failed with coins `205` and XP `40` instead of `230` and `65`.

TDD green evidence:

- Targeted command: `.\node_modules\.bin\vitest.cmd run src\room\roomIntegration.test.js src\room\roomModel.test.js`
- Result: 2 files passed, 34 tests passed.

## QA matrix

### Fresh player and refresh resumption

- Automated coverage confirms explicit journey transitions, wrong-event no-ops, front-desk advancement, eligible mailbox reward, one Sunny Rug unlock, room entry transition, Sunny Rug placement, one completion reward, and repeat-placement idempotency.
- Pure state and persisted-store paths cover refresh-safe serialized progress and all defined journey states.
- The complete creator -> cinematic -> world -> room sequence was not manually driven in Task 8 because Windows automation could not connect.

### Returning player

- New regression test seeds level 7, 205 coins, 40 XP, sticker and collectible data with no room fields.
- Verified preservation of all seeded values, Room 107 access, `enter-room` welcome state, exactly one Sunny Rug, and idempotent re-migration.

### Room editing and lifecycle

- Automated model/integration coverage verifies empty-slot removal, partial/full layout data, equip, replace, remove, unknown/unowned/wrong-slot no-ops, stale-slot protection through explicit slot IDs, duplicate unlock idempotency, serialization/hydration, transition re-entry protection, and room entry/exit state.
- Source audit confirms `App.jsx` renders the lazy room branch instead of the outdoor branch while `roomScene.open` is true.
- Live repeated mouse/touch entry/exit and curtain appearance were not manually verified in Task 8.

### Reward matrix

- Mailbox -> Postcard Frame.
- Watering completion -> Flower Pot.
- Slide completion -> Pool Float Trophy.
- First dance clear -> Disco Light.
- A/S grade -> Gold Record, shared idempotently.
- Leaf collectible -> Lucky Leaf.
- Levels 7 and 8 -> Cozy Bed and Cloud Bed.
- Daily rotation -> deterministic eligible item, once per injected local date.
- Existing integration assertions preserve normal dance coins/sticker/clear flag and existing activity award paths; room unlocks remain independent and idempotent.

### Accessibility and devices

- Automated/source contracts verify native button controls, useful visible slot/item text, `aria-pressed` state, tray-first Escape behavior, deferred focus return, 44 px minimum control height, safe-area insets, portrait header shrink behavior, short-height tray scrolling, and live reduced-motion media-query subscription/cleanup.
- Task 7 carried forward headless Edge evidence at desktop, 390 x 844 portrait, and short landscape, including the portrait header correction.
- Not freshly verified interactively in Task 8: desktop mouse, physical touch, visible focus contrast in a rendered browser, actual safe-area hardware insets, live WebGL buddy/composition, and low-end frame stability.

## Definition of Done audit

- New player receives key and Sunny Rug: automated journey/store coverage.
- Home enters Room 107: room entry decision and store integration coverage.
- Customized buddy and five slots: source/component tests; live WebGL visual remains a manual concern.
- Equip/replace/remove: model and integration coverage; mouse/touch manual interaction remains a concern.
- Inventory/layout refresh and safe migration: model, serialization, hydration, and new returning migration coverage.
- All defined reward sources unlock once: reward integration matrix coverage.
- Existing players retain progress and skip arrival: new migration regression coverage.
- Reduced motion/responsive behavior: automated CSS/JS contracts plus Task 7 headless evidence; physical-device pass remains open.
- Lazy room and mutually exclusive world mount: build chunk plus `App.jsx` branch audit.
- Performance budget: main gzip 343.98 kB, below the approved 352.69 kB ceiling by 8.71 kB. Room remains a separate 2.95 kB gzip chunk.
- Tests/build: fresh full results below.

## Fresh release gate

### `npm test`

- Exit 0.
- 8 test files passed.
- 66 tests passed.
- Existing Vite React plugin deprecation warnings remain; no test failures.

### `npm run build`

- Exit 0.
- Vite 5.4.21; 700 modules transformed.
- Main JS: `index-DHKxyQyq.js`, 1,210.97 kB raw / **343.98 kB gzip**.
- Lazy room JS: `roomEntry-BSrw08Up.js`, 8.79 kB raw / **2.95 kB gzip**.
- CSS: `index-CVkDceeR.css`, 28.32 kB raw / 6.52 kB gzip.
- Fonts: exactly ten Latin WOFF/WOFF2 outputs for Nunito 400/700/800 and Baloo 2 600/700. No new font families or non-Latin subsets.
- Existing raw chunk-size warning remains. Gzip is within the approved Room 107 budget.

### `git diff --check`

- Exit 0.
- No whitespace errors; Git printed only LF-to-CRLF conversion warnings.

### Scope and preserved files

- Intended Task 8 code changes are limited to `src/room/roomModel.js`, `src/room/roomModel.test.js`, `src/room/roomIntegration.test.js`, and `src/state/store.js`.
- The `.superpowers/sdd/` brief/report/review/progress files already present as untracked worktree-root artifacts were preserved. This report is the only Task 8 artifact added there.
- No Toy Workshop or unrelated website files were modified.
- No publish, push, merge, or deployment action was performed.

## Player-facing handoff

Players can earn fifteen fixed-slot decorations from the welcome journey and existing activities, enter Room 107 from Home, equip/replace/remove owned compatible decorations, return to a persisted layout, and use the room across keyboard/responsive/reduced-motion paths covered by automated contracts. Returning players now receive Room 107 access and exactly one Sunny Rug without losing prior progress. Completing the first Sunny Rug placement now gives the missing one-time +25 coin / +25 XP reward.

Remaining non-goals are unchanged: free placement, room commerce, room visits, a second arcade game, and map expansion.

## Required follow-up before an unconditional release claim

Run one interactive browser/device pass with working Windows or Chrome automation: full fresh journey with refresh at every step, returning seeded save reload, mouse and keyboard editing, physical/mobile touch at 390 x 844 and short landscape, reduced-motion visuals, repeated curtain transitions, mutual mount inspection, and low-end frame stability. Until that pass is recorded, the correct handoff status is `DONE_WITH_CONCERNS`.
