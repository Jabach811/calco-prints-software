import { DAILY_ROOM_REWARD_POOL, ROOM_SLOTS, roomItemById } from './roomCatalog.js';

const EMPTY_LAYOUT = Object.freeze(Object.fromEntries(ROOM_SLOTS.map((slot) => [slot, null])));
const DEFAULT_WELCOME_HOME = Object.freeze({ step: 'meet-front-desk', completed: false });

export function roomRewardForEvent(event) {
  const fixed = {
    'mailbox:first-open': 'postcard-frame',
    'watering:first-complete': 'flower-pot',
    'slide:first-complete': 'pool-float-trophy',
    'dance:first-clear': 'disco-light',
    'collectible:leaf': 'lucky-leaf',
    'level:7': 'cozy-bed',
    'level:8': 'cloud-bed',
  };
  if (fixed[event]) return fixed[event];
  if (event === 'dance:grade:A' || event === 'dance:grade:S') return 'gold-record';
  return null;
}

export function roomItemName(itemId) {
  return roomItemById(itemId)?.name ?? 'Room item';
}

export function dailyRoomRewardForDate(dateString) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  if (!match) return null;
  const [, year, month, day] = match;
  const timestamp = Date.UTC(Number(year), Number(month) - 1, Number(day));
  const date = new Date(timestamp);
  if (date.getUTCFullYear() !== Number(year)
    || date.getUTCMonth() !== Number(month) - 1
    || date.getUTCDate() !== Number(day)) return null;
  const dayNumber = Math.floor(timestamp / 86_400_000);
  return DAILY_ROOM_REWARD_POOL[dayNumber % DAILY_ROOM_REWARD_POOL.length];
}

export const WELCOME_OBJECTIVES = Object.freeze({
  'meet-front-desk': 'Meet the front-desk buddy',
  'do-first-activity': 'Complete your first hotel activity',
  'receive-decoration': 'Collect your Room 107 decoration',
  'enter-room': 'Enter Room 107',
  'place-decoration': 'Place the Sunny Rug in Room 107',
  complete: 'Explore the hotel',
});

export function createRoomProgress() {
  return {
    roomUnlocked: false,
    roomInventory: [],
    roomLayout: { ...EMPTY_LAYOUT },
    journeys: { welcomeHome: { ...DEFAULT_WELCOME_HOME } },
  };
}

export function migrateRoomProgress(progress = {}) {
  const inventory = [];
  const seen = new Set();
  for (const id of Array.isArray(progress.roomInventory) ? progress.roomInventory : []) {
    if (!seen.has(id) && roomItemById(id)) {
      seen.add(id);
      inventory.push(id);
    }
  }

  const roomLayout = { ...EMPTY_LAYOUT };
  for (const slot of ROOM_SLOTS) {
    const id = progress.roomLayout?.[slot];
    const catalogItem = roomItemById(id);
    if (catalogItem?.slot === slot && seen.has(id)) roomLayout[slot] = id;
  }

  const savedJourney = progress.journeys?.welcomeHome;
  const welcomeHome = {
    step: typeof savedJourney?.step === 'string' ? savedJourney.step : DEFAULT_WELCOME_HOME.step,
    completed: savedJourney?.completed === true,
  };

  return {
    ...progress,
    roomUnlocked: progress.roomUnlocked === true,
    roomInventory: inventory,
    roomLayout,
    journeys: {
      ...(progress.journeys && typeof progress.journeys === 'object' ? progress.journeys : {}),
      welcomeHome,
    },
  };
}

export function roomEntryDecision(progress) {
  if (progress.roomUnlocked === true) return { allowed: true, objective: null };
  const journey = progress.journeys?.welcomeHome ?? DEFAULT_WELCOME_HOME;
  const step = journey.completed ? 'complete' : journey.step;
  return { allowed: false, objective: WELCOME_OBJECTIVES[step] ?? WELCOME_OBJECTIVES['meet-front-desk'] };
}

function unchanged(progress, reason) {
  return { progress, changed: false, reason };
}

export function unlockRoomItem(progress, itemId) {
  if (!roomItemById(itemId)) return unchanged(progress, 'unknown-item');
  if (progress.roomInventory.includes(itemId)) return unchanged(progress, 'already-owned');
  return {
    progress: { ...progress, roomInventory: [...progress.roomInventory, itemId] },
    changed: true,
    reason: 'unlocked',
  };
}

export function equipRoomItem(progress, slotId, itemId) {
  if (!ROOM_SLOTS.includes(slotId)) return unchanged(progress, 'unknown-slot');
  const catalogItem = roomItemById(itemId);
  if (!catalogItem) return unchanged(progress, 'unknown-item');
  if (!progress.roomInventory.includes(itemId)) return unchanged(progress, 'not-owned');
  if (catalogItem.slot !== slotId) return unchanged(progress, 'wrong-slot');
  if (progress.roomLayout[slotId] === itemId) return unchanged(progress, 'equipped');
  return {
    progress: { ...progress, roomLayout: { ...progress.roomLayout, [slotId]: itemId } },
    changed: true,
    reason: 'equipped',
  };
}

export function removeRoomItem(progress, slotId) {
  if (!ROOM_SLOTS.includes(slotId)) return unchanged(progress, 'unknown-slot');
  if (progress.roomLayout[slotId] == null) return unchanged(progress, 'already-empty');
  return {
    progress: { ...progress, roomLayout: { ...progress.roomLayout, [slotId]: null } },
    changed: true,
    reason: 'removed',
  };
}

const WELCOME_HOME_TRANSITIONS = Object.freeze({
  'meet-front-desk': Object.freeze({ event: 'desk-met', step: 'do-first-activity' }),
  'do-first-activity': Object.freeze({ event: 'eligible-activity', step: 'receive-decoration' }),
  'receive-decoration': Object.freeze({ event: 'decoration-received', step: 'enter-room' }),
  'enter-room': Object.freeze({ event: 'room-entered', step: 'place-decoration' }),
  'place-decoration': Object.freeze({ event: 'sunny-rug-placed', step: 'complete', completed: true }),
});

export function advanceWelcomeHome(progress, event) {
  const current = progress.journeys?.welcomeHome ?? DEFAULT_WELCOME_HOME;
  const transition = WELCOME_HOME_TRANSITIONS[current.step];
  if (current.completed || !transition || transition.event !== event) {
    return unchanged(progress, 'event-ignored');
  }

  return {
    progress: {
      ...progress,
      journeys: {
        ...progress.journeys,
        welcomeHome: {
          ...current,
          step: transition.step,
          completed: transition.completed === true,
        },
      },
    },
    changed: true,
    reason: 'advanced',
  };
}
