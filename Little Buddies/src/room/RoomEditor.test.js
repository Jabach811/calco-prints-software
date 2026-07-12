import { describe, expect, it } from 'vitest';
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
