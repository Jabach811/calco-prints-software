# Little Buddies Room 107 Progression Design

Approved direction: 2026-07-12

## Purpose

Turn Room 107 from a placeholder into the center of Little Buddies' progression loop. Players explore the existing world and play activities to earn decorations, arrange them in a personal room, and return to see their choices preserved.

The first release uses fixed decoration slots. It must prove that earning and displaying objects makes the existing world more meaningful without introducing a general-purpose housing engine.

## Product outcome

The game loop becomes:

**Explore and play -> earn decorations -> improve Room 107 -> pursue new goals**

The first release succeeds when a new player naturally reaches Room 107, places an earned decoration, leaves, returns, and sees the same room preserved.

## Player journey

A new player's first-session journey is:

1. Create a buddy in the Toy Workshop.
2. Complete the existing cinematic arrival.
3. Meet the front-desk buddy and receive the Room 107 key.
4. Complete one simple world activity or check the mailbox.
5. Receive the Sunny Rug starter decoration.
6. Enter Room 107.
7. Select the rug slot and equip the Sunny Rug.
8. Receive a small completion reward.
9. Receive a new objective pointing toward Dance Studio or world exploration.

Returning players with existing saves do not repeat the full arrival sequence. Save migration grants access to Room 107 and presents a concise welcome-home objective that awards the starter rug if it is not already owned.

## Room interaction model

Room 107 contains five fixed decoration slots:

- Bed
- Rug
- Wall decoration
- Shelf collectible
- Trophy/display position

Players select a slot, see owned compatible items, and equip one. They may replace or remove an equipped item at any time. A decoration may only be equipped in its declared slot type.

The first release does not support dragging, unrestricted placement, rotation, scaling, collision between decorations, or room expansion.

## Presentation

Room 107 is a warm, toy-scale hotel bedroom rather than a generic inventory screen.

- Cream walls and painted wood trim.
- One large window with a lightweight outdoor backdrop.
- Soft afternoon lighting.
- The player's customized buddy visible in the room.
- Five visually readable decoration locations.
- Clear negative space around equipped items.
- Intentional desktop, mobile landscape, and mobile portrait compositions.

Room decorations use lightweight procedural Three.js geometry and the project's existing material system. The first release adds no external models, images, fonts, or runtime dependencies.

## Navigation and scene lifecycle

Room 107 is a separate scene mode using the established curtain transition:

```text
World -> curtain closes -> outdoor world unmounts -> Room 107 mounts -> curtain opens
Room 107 -> curtain closes -> room unmounts -> world mounts at hotel entrance -> curtain opens
```

The room must not remain mounted behind the outdoor world. This preserves a clean performance boundary and prevents duplicate frame work.

Entering the room is available through the existing Home control after the player receives the room key. Before that point, the Home control explains the current welcome objective rather than opening an empty placeholder.

## Architecture

Room-specific behavior lives under `src/room/`:

```text
src/room/RoomScene.jsx       3D room shell, camera, lighting, buddy, and slot anchors
src/room/RoomDecor.jsx       Procedural rendering for equipped catalog items
src/room/RoomScreen.jsx      Room mode and UI composition
src/room/RoomEditor.jsx      Slot selection and owned-compatible-item tray
src/room/roomCatalog.js      Decoration definitions and catalog validation
src/room/roomModel.js        Pure migration, unlock, equip, replace, and remove logic
src/room/roomModel.test.js   Pure room-model and catalog tests
```

`RoomScene` receives the saved room layout and emits slot-selection events. It does not mutate game state.

`RoomEditor` receives the selected slot, inventory, catalog, and action callbacks. It does not contain save logic or Three.js geometry.

`roomModel.js` owns all room-data invariants and remains independent of React and Three.js.

The existing Zustand store gains integration state and actions only:

```js
room: {
  open: false,
  editingSlot: null
}

enterRoom()
exitRoom()
selectRoomSlot(slotId)
equipRoomItem(slotId, itemId)
removeRoomItem(slotId)
unlockRoomItem(itemId)
```

## Saved data

Existing progress data gains:

```js
roomUnlocked: false,
roomInventory: [],
roomLayout: {
  bed: null,
  rug: null,
  wall: null,
  shelf: null,
  trophy: null
},
journeys: {
  welcomeHome: {
    step: 'meet-desk',
    completed: false
  }
}
```

Inventory and layout store catalog IDs rather than copied catalog objects. Catalog copy, appearance, and rendering may therefore evolve without rewriting saves.

Save migration must:

- Add room defaults without resetting current profile, currency, XP, quests, inventory, settings, or world progress.
- Preserve valid room data on future migrations.
- Deduplicate room inventory IDs.
- Remove unknown inventory IDs.
- Clear layout entries containing unknown or slot-incompatible item IDs.
- Grant returning players room access without replaying the new-player arrival.
- Award the starter rug through the welcome-home journey if it is not already owned.

## Decoration catalog

The initial catalog contains exactly fifteen decorations:

- Three bed styles.
- Three rugs.
- Three wall decorations.
- Three shelf collectibles.
- Three trophy/display items.

Each entry uses this contract:

```js
{
  id: 'sunny-rug',
  name: 'Sunny Rug',
  icon: 'sun',
  slot: 'rug',
  rarity: 'starter',
  source: 'welcome-home',
  render: {
    kind: 'rug',
    color: '#FFD23F',
    accent: '#FFF8E8'
  }
}
```

Catalog validation rejects duplicate IDs, unknown slot types, missing names, unknown render kinds, and invalid color values during automated tests.

The catalog is the source of truth for item names, compatibility, reward source, and rendering parameters. Reward code passes item IDs only.

## Initial rewards

Existing activities unlock room objects:

| Source | Decoration | Slot |
| --- | --- | --- |
| Welcome-home journey | Sunny Rug | Rug |
| First mailbox completion | Postcard Frame | Wall |
| Watering quest completion | Flower Pot | Shelf |
| First slide quest completion | Pool Float Trophy | Trophy |
| First Dance Studio clear | Disco Light | Wall |
| First A or S Dance Studio grade | Gold Record | Trophy |
| Selected collectible discoveries | Matching display object | Shelf |
| Defined level milestones | Bed styles | Bed |
| Daily reward rotation | Remaining catalog items | Compatible catalog slot |

Decoration unlocks are idempotent. Repeating an activity can continue to award its normal coins or XP but never duplicates a room item or changes the equipped layout.

The first release does not include a furniture shop. Coins remain connected to the existing snack economy.

## Welcome-home journey

The journey uses explicit states:

```text
meet-desk
-> do-first-activity
-> receive-decoration
-> enter-room
-> place-decoration
-> complete
```

Only one concise objective is shown at a time. Transitions occur from confirmed game actions, not from UI panel visibility alone.

- `meet-desk` completes through the defined front-desk interaction.
- `do-first-activity` completes through an eligible mailbox or simple world action.
- `receive-decoration` unlocks the Sunny Rug exactly once and immediately advances.
- `enter-room` completes after the room scene has mounted.
- `place-decoration` completes only when the Sunny Rug is equipped in the rug slot.
- `complete` awards the journey completion coins and XP exactly once and points toward the next existing activity.

The journey must resume correctly after a refresh at every step.

## Room editor UI

Selecting a room slot opens a compact tray containing:

- Slot name.
- Currently equipped item and Remove action when applicable.
- Owned compatible items.
- Clear selected-state text.
- Close or Back action.

Locked items appear only when they communicate a specific reachable goal. They render as a named silhouette with an exact unlock hint such as `Clear your first Dance Studio song`, not as a large catalog of unavailable content.

The editor uses existing Little Buddies typography, color language, button shapes, and curtain behavior. It does not introduce a second design system.

## Input and accessibility

- Every editable slot is keyboard reachable and has a useful accessible name.
- Editor choices use native buttons.
- Equipped state is expressed through text, shape, and iconography rather than color alone.
- Visible focus styling meets WCAG AA contrast on room and panel surfaces.
- Escape closes the editor before it exits the room.
- A visible Back control provides the same behavior for touch users.
- Item names and compatibility remain understandable without seeing the 3D preview.
- Touch targets are at least 44 by 44 CSS pixels.
- Safe-area insets are respected on mobile.
- The interface remains usable at 390 by 844 portrait and short landscape heights.

With `prefers-reduced-motion: reduce`, the room removes camera sweeps, slot bounce, item-placement flourishes, and animated tray transitions. State changes remain immediate and fully functional.

## Error handling and invariants

- Entering before room unlock shows the active welcome objective and leaves the player in the world.
- Equipping an unknown item, an unowned item, or an item in the wrong slot is a no-op and returns a failure result for UI feedback.
- Unlocking an already-owned item is a successful idempotent operation with no duplicate reward toast.
- Removing an empty slot is a safe no-op.
- Invalid saved room data is repaired during hydration without resetting unrelated progress.
- Missing render parameters use catalog-tested defaults; unknown render kinds fail catalog tests rather than failing during gameplay.
- Rapid slot selection cannot equip into a stale slot because equip actions receive the explicit `slotId` and `itemId`.
- Transition controls remain disabled while the curtain is moving to prevent double entry or exit.

## Performance requirements

- Record the current production build size before implementation.
- Load room scene, editor, and catalog code through a dynamic import when Room 107 is first entered.
- Do not add Room 107 to the initial eager JavaScript dependency path.
- Restrict bundled font imports to the character sets and formats the game actually uses.
- Unmount the outdoor world while Room 107 is active.
- Reuse cached materials and geometry where practical.
- Avoid real-time shadows on small decorations unless visual testing proves they are affordable.
- The initial JavaScript gzip size must not materially exceed the pre-room baseline; a regression over 10 KB requires review and justification.

## Automated testing

Add coverage for:

- Unique and valid catalog entries.
- Exactly fifteen initial decorations and three per slot.
- Save migration from the current progress shape.
- Preservation of all unrelated existing progress.
- Inventory deduplication and unknown-ID repair.
- Invalid and incompatible layout repair.
- Unlock idempotency.
- Equip, replace, remove, unknown-item, unowned-item, and wrong-slot behavior.
- Welcome-home transitions and refresh resumption at every state.
- Returning-player access and starter reward behavior.
- Mailbox, watering, slide, Dance Studio, collectible, level, and daily reward integrations.
- Room layout persistence through serialization and hydration.
- Room entry and exit state transitions.
- Transition re-entry protection.
- Reduced-motion decision logic where implemented in JavaScript.
- No regressions in the existing test suite.

## Browser verification

Verify:

- Fresh player journey from creator through first placement.
- Existing saved player migration.
- Empty, partially equipped, and fully equipped rooms.
- Replace and remove flows.
- Refresh persistence.
- Repeated world-room transitions.
- Desktop layout.
- Short landscape viewport.
- 390 by 844 mobile portrait.
- Keyboard-only operation and focus visibility.
- Reduced-motion mode.
- Touch controls and safe-area spacing.
- Room and outdoor world never render concurrently.
- Low-end-device behavior and frame stability.
- Production bundle size against the recorded baseline.

## Delivery phases

1. Pure room model, catalog, migration, and automated tests.
2. Room scene, player buddy, fixed slot anchors, and procedural decoration rendering.
3. Room editor, equip/remove actions, accessibility, and persistence.
4. Home control, curtain lifecycle, lazy loading, and world return position.
5. Welcome-home journey and starter reward.
6. Existing activity reward integrations and remaining catalog content.
7. Responsive polish, reduced motion, performance work, and font optimization.
8. Full regression, browser verification, and release readiness review.

Each phase must end in a working, testable state. Feature integration must not depend on unfinished content from a later phase.

## Non-goals

The first Room 107 release does not include:

- Free object placement.
- Drag-and-drop furniture.
- Object rotation or scaling.
- Room expansion.
- Furniture purchasing.
- Multiplayer room visits.
- Friend editing.
- Custom text or user-generated content.
- External 3D assets.
- More outdoor world zones.
- A second arcade game.
- Broad rewrites of unrelated game systems.

## Definition of done

- A new player receives the room key and Sunny Rug through the welcome-home journey.
- The player enters Room 107 through the existing Home control.
- The room displays the player's customized buddy and five fixed decoration slots.
- Owned compatible decorations can be equipped, replaced, and removed using mouse, touch, or keyboard.
- Room inventory and layout survive refresh and safely migrate current saves.
- At least the defined mailbox, watering, slide, Dance Studio, collectible, level, and daily sources unlock their assigned decorations exactly once.
- Existing players gain room access without losing progress or replaying the full arrival.
- Reduced-motion and responsive behavior meet the specified requirements.
- Room code is lazy-loaded and the outdoor world unmounts while the room is active.
- The production bundle stays within the performance budget or receives an explicit documented review.
- All automated tests pass, the production build succeeds, and browser verification covers the listed scenarios.
