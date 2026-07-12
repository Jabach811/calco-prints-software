# Room 107 Final Review Fixes

## Status

**DONE_WITH_CONCERNS**

All code findings from `final-review-f210194-600358e.md` are resolved. Automated tests, production build, dependency-boundary inspection, chunk inspection, font inspection, and whitespace checks pass. The pre-existing limitation remains: this worktree has no reliable interactive WebGL/device pass, so live mouse/touch composition and low-end frame stability are not newly claimed.

## Root causes and fixes

1. **Room code was only partially lazy.** `App.jsx` dynamically imported the room screen, but eager `store.js` and `HUD.jsx` imported `src/room/roomModel.js`, which imported `roomCatalog.js`. Progression now lives in `src/state/roomProgression.js`, while canonical item metadata lives once in `src/data/roomItems.js`. The lazy `roomCatalog.js` derives its render catalog from that metadata. Store and HUD have no import into `src/room/`; room-local compatibility remains through a tiny re-export facade.
2. **Splash Rug had metadata but no award path.** `slide:first-complete` now maps atomically to both `splash-rug` and `pool-float-trophy`. Multi-item grants are idempotent, persist once, and retain both exact `slide-first` catalog sources.
3. **Cozy Bed depended on crossing level 7 after Room 107 existed.** Migration now backfills Cozy Bed for every level-7-or-higher save and Cloud Bed for level-8-or-higher saves. Dedupe makes repeated hydration safe; valid equipped layouts remain preserved.
4. **Journey migration trusted arbitrary strings.** Migration validates the complete welcome-step set, normalizes completed saves to `complete`, and repairs invalid unlocked saves with Sunny Rug to recoverable `enter-room` state (otherwise the normal front-desk start).
5. **Crossed-level awards redundantly persisted.** Internal level reward grants now suppress their own persistence because `award()` already persists the completed state after all crossed levels. Public reward calls still persist normally.

## TDD evidence

The initial focused run failed exactly at the new contracts:

- eager store/HUD imports still pointed into `src/room/`;
- `roomRewardsForEvent` did not exist and slide granted only Pool Float Trophy;
- returning/default level-7 migration omitted Cozy Bed;
- invalid `teleport-to-roof` journey state survived migration.

After implementation:

- Focused command: `.\node_modules\.bin\vitest.cmd run src\room\roomModel.test.js src\room\roomIntegration.test.js src\room\roomLazyBoundary.test.js`
- Result: 3 files passed, 39 tests passed.

## Fresh verification

- `npm test`: exit 0; 9 files passed; 72 tests passed.
- `npm run build`: exit 0; Vite transformed 702 modules.
- Main JS: `index-CSHhygJq.js`, 1,211.33 kB raw / 344.08 kB gzip.
- Lazy room JS: `roomEntry-BEE9PauJ.js`, 9.06 kB raw / 3.05 kB gzip.
- Budget: main gzip is 8.61 kB below the approved 352.69 kB ceiling.
- Chunk marker inspection: main chunk does not contain `room-item-panel`; lazy room chunk does. Source contract also verifies store/HUD contain no imports from `src/room/`.
- Fonts: exactly ten Latin WOFF/WOFF2 outputs: Nunito 400/700/800 and Baloo 2 600/700. No non-Latin subset assets emitted.
- `git diff --check`: exit 0; line-ending conversion warnings only.

The existing Vite raw chunk-size warning remains unchanged and is not a Room 107 regression.

## Scope

Only Room 107 metadata, progression, catalog facade, store/HUD imports and reward behavior, regression tests, and this report were changed. No publish, push, merge, or deployment action was performed.
