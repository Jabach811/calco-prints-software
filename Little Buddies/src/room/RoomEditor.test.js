import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { compatibleRoomItems, roomSlotLabel } from './RoomEditor.jsx';

describe('RoomEditor helpers', () => {
  it('returns only owned catalog items compatible with the selected slot', () => {
    expect(compatibleRoomItems('rug', ['sunny-rug', 'cozy-bed', 'missing']).map((item) => item.id))
      .toEqual(['sunny-rug']);
  });

  it('returns no choices when a slot has no compatible owned items', () => {
    expect(compatibleRoomItems('wall', ['sunny-rug'])).toEqual([]);
  });

  it('turns fixed slot IDs into concise visible labels', () => {
    expect(roomSlotLabel('trophy')).toBe('Trophy');
  });
});

describe('RoomEditor short-height layout', () => {
  it('keeps panel actions visible while only the item tray scrolls', () => {
    const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
    expect(css).toMatch(/\.room-item-panel\s*\{[^}]*display:\s*flex[^}]*flex-direction:\s*column/s);
    expect(css).toMatch(/\.room-item-tray\s*\{[^}]*min-height:\s*0[^}]*overflow:\s*auto/s);
    expect(css).not.toMatch(/\.room-item-panel\s*\{[^}]*overflow:\s*hidden/s);
  });
});
