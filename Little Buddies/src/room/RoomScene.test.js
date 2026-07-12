import { describe, expect, it } from 'vitest';
import { roomSlotRingRotation } from './RoomScene.jsx';

describe('Room 107 selection ring orientation', () => {
  it('keeps the wall selection ring in the wall plane', () => {
    expect(roomSlotRingRotation('wall')).toBeUndefined();
  });

  it('lays floor decoration selection rings flat', () => {
    expect(roomSlotRingRotation('rug')).toBeUndefined();
    expect(roomSlotRingRotation('bed')).toEqual([-Math.PI / 2, 0, 0]);
  });
});
