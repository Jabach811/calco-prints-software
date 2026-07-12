# Room 107 Task 7 Report

## Status

Implemented accessibility, reduced-motion, responsive-header, font-subset, and performance-boundary polish. The production room remains lazy loaded and the outdoor world remains mutually exclusive with it in `App.jsx`.

## Implementation evidence

- `src/main.jsx` now imports only the five requested Fontsource Latin entrypoints.
- `RoomEditor` keeps refs for all five slot controls, schedules focus through `requestAnimationFrame`, focuses a selected slot, and returns focus to that slot when the tray closes.
- Escape handling remains tray-first, room-second in `RoomScreen`: a non-null editing slot is cleared before `exitRoom()` can run.
- `useReducedMotion` reads the current media query, subscribes to live `change` events, supports the legacy listener API, and cleans up. The live boolean is passed to `RoomScene`; `Buddy` consumes it to skip its animated pose update path.
- Phone header flex children now shrink safely while the exit button remains fixed-size. Existing room CSS keeps controls at 44px minimum height, safe-area offsets on Exit/editor controls, and scrolling confined to `.room-item-tray`.
- `store.js` no longer imports `roomCatalog.js`; room item display names cross the pure `roomModel.js` interface.

## TDD evidence

- Focus scheduling test failed first with `focusOnNextFrame is not a function`, then passed after implementation.
- Reduced-motion tests cover current value, modern live subscription cleanup, and legacy listener cleanup.
- Pure room-model boundary test failed first with `roomItemName is not a function`, then passed after implementation.
- Phone header CSS contract failed first, then passed after the shrink/flex rule was added.

## Fresh final verification

- `npm test`: exit 0; 8 test files passed, 64 tests passed.
- `npm run build`: exit 0; 700 modules transformed.
- Main JS: `index-DGioPmy2.js`, 343.78 kB gzip, below the 352.69 kB budget by 8.91 kB.
- Separate room chunk: `roomEntry-B1H8Jdcm.js`, 8.79 kB raw / 2.95 kB gzip.
- CSS: `index-CVkDceeR.css`, 28.32 kB raw / 6.52 kB gzip.
- Emitted fonts: exactly ten Latin WOFF/WOFF2 assets for Nunito 400/700/800 and Baloo 2 600/700. No Devanagari, Cyrillic, or Vietnamese filenames were present.
- Import audit: `store.js` contains no `roomCatalog`, `RoomScreen`, `RoomScene`, `RoomEditor`, or `roomEntry` import. `App.jsx` retains `React.lazy(() => import('./room/roomEntry.js'))` and its mutually exclusive `roomOpen` render branch.
- `git diff --check`: exit 0 (Git emitted only line-ending conversion notices).

## Responsive/browser verification and limitation

Headless Microsoft Edge was run against the Vite dev server at desktop, 390x844 portrait, and short-landscape dimensions. The first completed portrait capture exposed the exit button clipping at the right edge; the CSS fix and regression contract address that issue. The capture also confirmed all five slot controls and the item panel remained reachable at portrait width.

The available headless Edge session was not a reliable full visual verifier for the Three.js canvas: some captures stopped on the lazy-loading fallback and the completed portrait capture did not render WebGL room content. Because of that environment limitation, buddy visibility, live canvas composition, touch interaction, focus movement, reduced-motion animation changes, and a React DevTools mount inspection were not claimed as browser-verified. Source structure and automated contracts cover those paths, but a final interactive browser/device pass remains appropriate.

The existing Vite warning for a JavaScript chunk over 500 kB raw remains. The measured initial gzip artifact is inside the approved Room 107 budget, and the room code is emitted separately.
