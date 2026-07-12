import { describe, expect, it } from 'vitest';
import { animateBuddy } from './Buddy.jsx';

function transform() {
  const target = {};
  target.set = (...values) => { target.values = values; };
  return target;
}

describe('Buddy reduced motion', () => {
  it('keeps a stable neutral pose without advancing animation time', () => {
    const position = transform();
    const rotation = transform();
    const scale = transform();
    const leftRotation = transform();
    const rightRotation = transform();
    const rt = { anim: 'idle', animT: 4 };
    const refs = {
      bodyG: { current: { position, rotation, scale } },
      armL: { current: { rotation: leftRotation } },
      armR: { current: { rotation: rightRotation } },
    };

    animateBuddy(rt, refs, 0.05, true);

    expect(rt.animT).toBe(4);
    expect(position.values).toEqual([0, 0, 0]);
    expect(rotation.values).toEqual([0, 0, 0]);
    expect(scale.values).toEqual([1, 1, 1]);
    expect(leftRotation.values).toEqual([0, 0, 0.45]);
    expect(rightRotation.values).toEqual([0, 0, -0.45]);
  });
});
