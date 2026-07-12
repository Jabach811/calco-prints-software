import { describe, expect, it, vi } from 'vitest';
import { getReducedMotionPreference, subscribeToReducedMotion } from './RoomScreen.jsx';

vi.hoisted(() => {
  globalThis.localStorage = { getItem: () => null, setItem: () => {} };
});

describe('Room 107 reduced-motion preference', () => {
  it('reads the current reduced-motion value', () => {
    expect(getReducedMotionPreference({ matches: true })).toBe(true);
    expect(getReducedMotionPreference(null)).toBe(false);
  });

  it('subscribes to live changes and removes the same listener', () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    const query = { addEventListener, removeEventListener };
    const onChange = vi.fn();
    const cleanup = subscribeToReducedMotion(query, onChange);

    expect(addEventListener).toHaveBeenCalledWith('change', onChange);
    cleanup();
    expect(removeEventListener).toHaveBeenCalledWith('change', onChange);
  });

  it('supports the legacy MediaQueryList listener API', () => {
    const addListener = vi.fn();
    const removeListener = vi.fn();
    const query = { addListener, removeListener };
    const onChange = vi.fn();
    const cleanup = subscribeToReducedMotion(query, onChange);

    expect(addListener).toHaveBeenCalledWith(onChange);
    cleanup();
    expect(removeListener).toHaveBeenCalledWith(onChange);
  });
});
