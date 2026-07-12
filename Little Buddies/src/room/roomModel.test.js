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
