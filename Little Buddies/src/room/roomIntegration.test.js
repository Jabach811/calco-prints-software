import { expect, it } from 'vitest';
import {
  advanceWelcomeHome,
  createRoomProgress,
  equipRoomItem,
  roomEntryDecision,
  unlockRoomItem,
} from './roomModel.js';

it('blocks entry before unlock with the current objective', () => {
  const result = roomEntryDecision(createRoomProgress());
  expect(result).toEqual({ allowed: false, objective: 'Meet the front-desk buddy' });
});

it('allows an unlocked room', () => {
  const result = roomEntryDecision({ ...createRoomProgress(), roomUnlocked: true });
  expect(result).toEqual({ allowed: true, objective: null });
});

it('protects against applying an item to a stale selected slot', () => {
  const owned = unlockRoomItem(createRoomProgress(), 'sunny-rug').progress;
  const result = equipRoomItem(owned, 'wall', 'sunny-rug');

  expect(result).toEqual({ progress: owned, changed: false, reason: 'wrong-slot' });
});

it('keeps progress unchanged for invalid explicit input', () => {
  const progress = createRoomProgress();
  const result = equipRoomItem(progress, 'missing-slot', 'sunny-rug');

  expect(result).toEqual({ progress, changed: false, reason: 'unknown-slot' });
});

it('advances the journey when the Sunny Rug is placed', () => {
  const progress = {
    ...createRoomProgress(),
    journeys: { welcomeHome: { step: 'place-decoration', completed: false } },
  };
  const result = advanceWelcomeHome(progress, 'sunny-rug-placed');

  expect(result.changed).toBe(true);
  expect(result.progress.journeys.welcomeHome).toEqual({ step: 'complete', completed: true });
});
