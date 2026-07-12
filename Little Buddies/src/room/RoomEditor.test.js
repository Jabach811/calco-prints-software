import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { compatibleRoomItems, focusOnNextFrame, roomSlotLabel } from './RoomEditor.jsx';

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

  it('defers focus until the next animation frame', () => {
    let callback;
    let focused = false;
    focusOnNextFrame({ focus: () => { focused = true; } }, (next) => { callback = next; });
    expect(focused).toBe(false);
    callback();
    expect(focused).toBe(true);
  });
});

describe('RoomEditor short-height layout', () => {
  it('keeps panel actions visible while only the item tray scrolls', () => {
    const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
    expect(css).toMatch(/\.room-item-panel\s*\{[^}]*display:\s*flex[^}]*flex-direction:\s*column/s);
    expect(css).toMatch(/\.room-item-tray\s*\{[^}]*min-height:\s*0[^}]*overflow:\s*auto/s);
    expect(css).not.toMatch(/\.room-item-panel\s*\{[^}]*overflow:\s*hidden/s);
  });

  it('allows the phone header content to shrink beside the exit control', () => {
    const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
    expect(css).toMatch(/\.room-header\s*>\s*div\s*\{[^}]*min-width:\s*0/s);
    expect(css).toMatch(/\.room-exit-button\s*\{[^}]*flex:\s*0\s+0\s+auto/s);
  });
});
