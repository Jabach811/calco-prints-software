import { describe, expect, it } from 'vitest';
import { ROOM_CATALOG, ROOM_SLOTS, validateRoomCatalog } from './roomCatalog.js';
import {
  createRoomProgress,
  migrateRoomProgress,
  unlockRoomItem,
  equipRoomItem,
  removeRoomItem,
  advanceWelcomeHome,
  roomItemName,
} from './roomModel.js';

describe('room catalog', () => {
  it('exposes item names through the pure room model boundary', () => {
    expect(roomItemName('sunny-rug')).toBe('Sunny Rug');
    expect(roomItemName('missing')).toBe('Room item');
  });

  it('contains exactly three valid items for each fixed slot', () => {
    expect(validateRoomCatalog(ROOM_CATALOG)).toEqual([]);
    expect(ROOM_CATALOG).toHaveLength(15);
    for (const slot of ROOM_SLOTS) {
      expect(ROOM_CATALOG.filter((item) => item.slot === slot)).toHaveLength(3);
    }
    for (const item of ROOM_CATALOG) {
      expect(item.render.kind).toBe(item.slot);
      expect(item.render.color).toMatch(/^#[0-9A-F]{6}$/i);
      expect(item.render.accent).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });

  it('defines an exact slide source for both slide decorations', () => {
    expect(ROOM_CATALOG.filter((item) => item.source === 'slide-first').map((item) => item.id))
      .toEqual(['splash-rug', 'pool-float-trophy']);
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

  it('welcomes a returning player with room access and one Sunny Rug', () => {
    const old = {
      coins: 205,
      xp: 40,
      level: 7,
      stickers: ['disco'],
      collectibles: { leaf: 2 },
    };
    const migrated = migrateRoomProgress(old, { returningPlayer: true });

    expect(migrated).toMatchObject({
      coins: 205,
      xp: 40,
      level: 7,
      stickers: ['disco'],
      collectibles: { leaf: 2 },
      roomUnlocked: true,
      roomInventory: ['sunny-rug', 'cozy-bed'],
      journeys: { welcomeHome: { step: 'enter-room', completed: false } },
    });
    expect(migrateRoomProgress(migrated, { returningPlayer: true }).roomInventory)
      .toEqual(['sunny-rug', 'cozy-bed']);
  });

  it('grants the level-7 bed during migration without duplicating it', () => {
    const migrated = migrateRoomProgress({
      level: 7,
      roomUnlocked: true,
      roomInventory: ['cozy-bed', 'cozy-bed'],
      roomLayout: {},
    });

    expect(migrated.roomInventory).toEqual(['cozy-bed']);
    expect(migrateRoomProgress(migrated).roomInventory).toEqual(['cozy-bed']);
  });

  it('repairs invalid welcome journey steps to a recoverable state', () => {
    const migrated = migrateRoomProgress({
      level: 7,
      roomUnlocked: true,
      roomInventory: ['sunny-rug'],
      journeys: { welcomeHome: { step: 'teleport-to-roof', completed: false } },
    });

    expect(migrated.journeys.welcomeHome).toEqual({ step: 'enter-room', completed: false });
    expect(advanceWelcomeHome(migrated, 'room-entered').progress.journeys.welcomeHome.step)
      .toBe('place-decoration');
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
    expect(equipRoomItem(p, 'rug', 'garden-rug').reason).toBe('not-owned');
    expect(equipRoomItem(p, 'rug', 'missing').reason).toBe('unknown-item');
    expect(equipRoomItem(p, 'rug', 'sunny-rug').progress.roomLayout.rug).toBe('sunny-rug');
    expect(removeRoomItem(equipRoomItem(p, 'rug', 'sunny-rug').progress, 'rug').progress.roomLayout.rug).toBeNull();
  });

  it('keeps frozen inputs unchanged and makes repeated actions idempotent', () => {
    const initial = createRoomProgress();
    Object.freeze(initial.roomInventory);
    Object.freeze(initial.roomLayout);
    Object.freeze(initial.journeys.welcomeHome);
    Object.freeze(initial.journeys);
    Object.freeze(initial);

    const unlocked = unlockRoomItem(initial, 'sunny-rug');
    expect(initial).toEqual(createRoomProgress());
    expect(unlockRoomItem(unlocked.progress, 'sunny-rug')).toEqual({
      progress: unlocked.progress,
      changed: false,
      reason: 'already-owned',
    });

    Object.freeze(unlocked.progress.roomInventory);
    Object.freeze(unlocked.progress);
    const equipped = equipRoomItem(unlocked.progress, 'rug', 'sunny-rug');
    expect(unlocked.progress.roomLayout.rug).toBeNull();
    expect(equipRoomItem(equipped.progress, 'rug', 'sunny-rug')).toEqual({
      progress: equipped.progress,
      changed: false,
      reason: 'equipped',
    });

    Object.freeze(equipped.progress.roomLayout);
    Object.freeze(equipped.progress);
    const removed = removeRoomItem(equipped.progress, 'rug');
    expect(equipped.progress.roomLayout.rug).toBe('sunny-rug');
    expect(removeRoomItem(removed.progress, 'rug')).toEqual({
      progress: removed.progress,
      changed: false,
      reason: 'already-empty',
    });
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
