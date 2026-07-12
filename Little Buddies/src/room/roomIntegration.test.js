import { afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import {
  advanceWelcomeHome,
  createRoomProgress,
  equipRoomItem,
  roomEntryDecision,
  unlockRoomItem,
} from './roomModel.js';

let useGame;

beforeAll(async () => {
  globalThis.localStorage = {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  };
  ({ useGame } = await import('../state/store.js'));
});

beforeEach(() => {
  vi.useFakeTimers();
  useGame.setState({
    checkedIn: false,
    progress: { ...createRoomProgress(), quests: [], flags: {} },
    world: { ...useGame.getState().world, mailboxGift: true },
    toasts: [],
    homeOpen: false,
    curtain: null,
    roomScene: { open: false, editingSlot: null },
  });
});

afterEach(() => vi.useRealTimers());

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

it('completes welcome-home only after the Sunny Rug is placed', () => {
  let p = {
    ...createRoomProgress(),
    roomUnlocked: true,
    roomInventory: ['sunny-rug'],
    journeys: { welcomeHome: { step: 'enter-room', completed: false } },
  };
  p = advanceWelcomeHome(p, 'room-entered').progress;
  expect(p.journeys.welcomeHome.step).toBe('place-decoration');
  expect(advanceWelcomeHome(p, 'different-item-placed').changed).toBe(false);
  p = advanceWelcomeHome(p, 'sunny-rug-placed').progress;
  expect(p.journeys.welcomeHome.completed).toBe(true);
});

it('advances from the front desk when check-in grants access', () => {
  useGame.getState().checkIn();

  expect(useGame.getState().progress.journeys.welcomeHome.step).toBe('do-first-activity');
});

it('unlocks Room 107 and the Sunny Rug after the first mailbox reward', () => {
  useGame.setState({
    progress: {
      ...useGame.getState().progress,
      journeys: { welcomeHome: { step: 'do-first-activity', completed: false } },
    },
  });

  useGame.getState().doAction('mailbox', 'open');

  const { progress, toasts } = useGame.getState();
  expect(progress.journeys.welcomeHome.step).toBe('enter-room');
  expect(progress.roomUnlocked).toBe(true);
  expect(progress.roomInventory).toContain('sunny-rug');
  expect(toasts.filter((toast) => toast.text === 'Sunny Rug unlocked for Room 107!')).toHaveLength(1);
});

it('cleans up a hydrated Home panel flag when entering Room 107', () => {
  useGame.setState({
    homeOpen: true,
    progress: { ...useGame.getState().progress, roomUnlocked: true },
  });

  expect(useGame.getState().enterRoom()).toBe(true);
  expect(useGame.getState().homeOpen).toBe(false);
});

it('cleans up a hydrated Home panel flag when Room 107 is still locked', () => {
  useGame.setState({ homeOpen: true });

  expect(useGame.getState().enterRoom()).toBe(false);
  expect(useGame.getState().homeOpen).toBe(false);
  expect(useGame.getState().toasts.at(-1).text).toBe('Meet the front-desk buddy');
});
