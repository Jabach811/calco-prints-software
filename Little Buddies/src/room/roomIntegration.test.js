import { afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import {
  advanceWelcomeHome,
  createRoomProgress,
  equipRoomItem,
  dailyRoomRewardForDate,
  roomRewardForEvent,
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
    progress: {
      ...createRoomProgress(), coins: 205, xp: 40, level: 7, stickers: [],
      collectibles: {}, snacks: {}, phrases: [], quests: [], flags: {},
    },
    world: { ...useGame.getState().world, mailboxGift: true },
    toasts: [],
    cooldowns: {},
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

it('awards the welcome-home completion reward exactly once', () => {
  useGame.setState({
    progress: {
      ...useGame.getState().progress,
      coins: 205,
      xp: 40,
      roomUnlocked: true,
      roomInventory: ['sunny-rug'],
      journeys: { welcomeHome: { step: 'place-decoration', completed: false } },
    },
  });

  expect(useGame.getState().equipRoomItem('rug', 'sunny-rug')).toBe(true);
  expect(useGame.getState().progress).toMatchObject({
    coins: 230,
    xp: 65,
    roomLayout: { rug: 'sunny-rug' },
    journeys: { welcomeHome: { step: 'complete', completed: true } },
  });

  expect(useGame.getState().equipRoomItem('rug', 'sunny-rug')).toBe(false);
  expect(useGame.getState().progress).toMatchObject({ coins: 230, xp: 65 });
});

it('processes the welcome-home XP reward through level rollover and room milestones', () => {
  useGame.setState({
    progress: {
      ...useGame.getState().progress,
      coins: 205,
      level: 7,
      xp: 690,
      roomUnlocked: true,
      roomInventory: ['sunny-rug'],
      journeys: { welcomeHome: { step: 'place-decoration', completed: false } },
    },
  });

  expect(useGame.getState().equipRoomItem('rug', 'sunny-rug')).toBe(true);
  expect(useGame.getState().progress).toMatchObject({
    coins: 230,
    level: 8,
    xp: 15,
    roomInventory: expect.arrayContaining(['sunny-rug', 'cloud-bed']),
  });
  expect(useGame.getState().toasts.filter(
    (toast) => toast.text === 'Room 107 ready! +25 coins and +25 XP',
  )).toHaveLength(1);
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

it.each([
  ['mailbox:first-open', 'postcard-frame'],
  ['watering:first-complete', 'flower-pot'],
  ['slide:first-complete', 'pool-float-trophy'],
  ['dance:first-clear', 'disco-light'],
  ['collectible:leaf', 'lucky-leaf'],
  ['level:7', 'cozy-bed'],
  ['level:8', 'cloud-bed'],
  ['dance:grade:A', 'gold-record'],
  ['dance:grade:S', 'gold-record'],
])('maps the %s reward event to %s', (event, itemId) => {
  expect(roomRewardForEvent(event)).toBe(itemId);
});

it('returns null for an unknown room reward event', () => {
  expect(roomRewardForEvent('unknown:event')).toBeNull();
});

it('keeps the shared A and S dance reward idempotent through unlockRoomItem', () => {
  const progress = createRoomProgress();
  const aReward = unlockRoomItem(progress, roomRewardForEvent('dance:grade:A'));
  const sReward = unlockRoomItem(aReward.progress, roomRewardForEvent('dance:grade:S'));

  expect(aReward.changed).toBe(true);
  expect(sReward).toEqual({ progress: aReward.progress, changed: false, reason: 'already-owned' });
});

it('rotates daily room rewards deterministically from an injected local date string', () => {
  expect(dailyRoomRewardForDate('2026-07-12')).toBe('garden-rug');
  expect(dailyRoomRewardForDate('2026-07-13')).toBe('buddy-banner');
  expect(dailyRoomRewardForDate('2026-07-12')).toBe('garden-rug');
});

it('awards a daily room item once per injected local date', () => {
  expect(useGame.getState().claimDailyRoomReward('2026-07-12')).toBe(true);
  expect(useGame.getState().claimDailyRoomReward('2026-07-12')).toBe(false);
  expect(useGame.getState().claimDailyRoomReward('2026-07-13')).toBe(true);
  expect(useGame.getState().progress.roomInventory).toEqual(expect.arrayContaining(['garden-rug', 'buddy-banner']));
});

it('grants first-time room rewards at the existing mailbox, watering, slide, and leaf completion points', () => {
  useGame.getState().doAction('mailbox', 'open');
  useGame.getState().doAction('flowerbed-plaza', 'water');
  vi.advanceTimersByTime(2600);
  useGame.getState().doAction('slide', 'ride');
  useGame.setState((state) => ({ world: { ...state.world, plot: 'grown' } }));
  useGame.getState().doAction('gardenplot', 'harvest');

  expect(useGame.getState().progress.roomInventory).toEqual(expect.arrayContaining([
    'postcard-frame', 'flower-pot', 'pool-float-trophy', 'lucky-leaf',
  ]));
});

it('grants every room reward for levels crossed by a large XP award', () => {
  useGame.setState((state) => ({ progress: { ...state.progress, level: 6, xp: 590 } }));

  useGame.getState().award({ xp: 900, quiet: true });

  expect(useGame.getState().progress.level).toBe(8);
  expect(useGame.getState().progress.roomInventory).toEqual(expect.arrayContaining(['cozy-bed', 'cloud-bed']));
});

it('keeps dance sticker and room rewards separate while using stable song identifiers', () => {
  const addToast = vi.fn();
  useGame.setState({ addToast });
  const result = useGame.getState().finishDance({ grade: 'A', songId: 'bubble-beat', songName: 'Bubble Beat' });

  const { progress } = useGame.getState();
  expect(result).toEqual({ coins: 18, firstClear: true });
  expect(progress.stickers).toContain('disco');
  expect(progress.roomInventory).toEqual(expect.arrayContaining(['disco-light', 'gold-record']));
  expect(progress.flags.danceClears['bubble-beat']).toBe(true);
  expect(addToast).toHaveBeenCalledWith('Bubble Beat: grade A! +18 coins', '🕺');
});
