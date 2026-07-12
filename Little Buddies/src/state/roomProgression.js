import { DAILY_ROOM_REWARD_POOL, ROOM_SLOTS, roomItemMetadata } from '../data/roomItems.js';

const EMPTY_LAYOUT = Object.freeze(Object.fromEntries(ROOM_SLOTS.map((slot) => [slot, null])));
const DEFAULT_WELCOME_HOME = Object.freeze({ step: 'meet-front-desk', completed: false });
const VALID_WELCOME_STEPS = new Set([
  'meet-front-desk', 'do-first-activity', 'receive-decoration', 'enter-room', 'place-decoration', 'complete',
]);

const FIXED_REWARDS = Object.freeze({
  'mailbox:first-open': Object.freeze(['postcard-frame']),
  'watering:first-complete': Object.freeze(['flower-pot']),
  'slide:first-complete': Object.freeze(['splash-rug', 'pool-float-trophy']),
  'dance:first-clear': Object.freeze(['disco-light']),
  'collectible:leaf': Object.freeze(['lucky-leaf']),
  'level:7': Object.freeze(['cozy-bed']),
  'level:8': Object.freeze(['cloud-bed']),
  'dance:grade:A': Object.freeze(['gold-record']),
  'dance:grade:S': Object.freeze(['gold-record']),
});

export function roomRewardsForEvent(event) { return FIXED_REWARDS[event] ?? []; }
export function roomItemName(itemId) { return roomItemMetadata(itemId)?.name ?? 'Room item'; }

export function dailyRoomRewardForDate(dateString) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  if (!match) return null;
  const [, year, month, day] = match;
  const timestamp = Date.UTC(Number(year), Number(month) - 1, Number(day));
  const date = new Date(timestamp);
  if (date.getUTCFullYear() !== Number(year) || date.getUTCMonth() !== Number(month) - 1
    || date.getUTCDate() !== Number(day)) return null;
  return DAILY_ROOM_REWARD_POOL[Math.floor(timestamp / 86_400_000) % DAILY_ROOM_REWARD_POOL.length];
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
  return { roomUnlocked: false, roomInventory: [], roomLayout: { ...EMPTY_LAYOUT }, journeys: { welcomeHome: { ...DEFAULT_WELCOME_HOME } } };
}

export function migrateRoomProgress(progress = {}, { returningPlayer = false } = {}) {
  const hasRoomSave = progress.roomUnlocked !== undefined || Array.isArray(progress.roomInventory)
    || progress.roomLayout != null || progress.journeys?.welcomeHome != null;
  const needsReturningWelcome = returningPlayer && !hasRoomSave;
  const inventory = [];
  const seen = new Set();
  for (const id of Array.isArray(progress.roomInventory) ? progress.roomInventory : []) {
    if (!seen.has(id) && roomItemMetadata(id)) { seen.add(id); inventory.push(id); }
  }
  if (needsReturningWelcome && !seen.has('sunny-rug')) { seen.add('sunny-rug'); inventory.push('sunny-rug'); }
  if (Number(progress.level) >= 7 && !seen.has('cozy-bed')) { seen.add('cozy-bed'); inventory.push('cozy-bed'); }
  if (Number(progress.level) >= 8 && !seen.has('cloud-bed')) { seen.add('cloud-bed'); inventory.push('cloud-bed'); }

  const roomLayout = { ...EMPTY_LAYOUT };
  for (const slot of ROOM_SLOTS) {
    const id = progress.roomLayout?.[slot];
    if (roomItemMetadata(id)?.slot === slot && seen.has(id)) roomLayout[slot] = id;
  }

  const saved = progress.journeys?.welcomeHome;
  const completed = saved?.completed === true;
  let step = completed ? 'complete' : saved?.step;
  if (!VALID_WELCOME_STEPS.has(step)) {
    step = (needsReturningWelcome || (progress.roomUnlocked === true && seen.has('sunny-rug')))
      ? 'enter-room' : DEFAULT_WELCOME_HOME.step;
  }
  return {
    ...progress,
    roomUnlocked: progress.roomUnlocked === true || needsReturningWelcome,
    roomInventory: inventory,
    roomLayout,
    journeys: { ...(progress.journeys && typeof progress.journeys === 'object' ? progress.journeys : {}), welcomeHome: { step, completed } },
  };
}

export function roomEntryDecision(progress) {
  if (progress.roomUnlocked === true) return { allowed: true, objective: null };
  const journey = progress.journeys?.welcomeHome ?? DEFAULT_WELCOME_HOME;
  const step = journey.completed ? 'complete' : journey.step;
  return { allowed: false, objective: WELCOME_OBJECTIVES[step] ?? WELCOME_OBJECTIVES['meet-front-desk'] };
}

const unchanged = (progress, reason) => ({ progress, changed: false, reason });
export function unlockRoomItem(progress, itemId) {
  if (!roomItemMetadata(itemId)) return unchanged(progress, 'unknown-item');
  if (progress.roomInventory.includes(itemId)) return unchanged(progress, 'already-owned');
  return { progress: { ...progress, roomInventory: [...progress.roomInventory, itemId] }, changed: true, reason: 'unlocked' };
}
export function equipRoomItem(progress, slotId, itemId) {
  if (!ROOM_SLOTS.includes(slotId)) return unchanged(progress, 'unknown-slot');
  const item = roomItemMetadata(itemId);
  if (!item) return unchanged(progress, 'unknown-item');
  if (!progress.roomInventory.includes(itemId)) return unchanged(progress, 'not-owned');
  if (item.slot !== slotId) return unchanged(progress, 'wrong-slot');
  if (progress.roomLayout[slotId] === itemId) return unchanged(progress, 'equipped');
  return { progress: { ...progress, roomLayout: { ...progress.roomLayout, [slotId]: itemId } }, changed: true, reason: 'equipped' };
}
export function removeRoomItem(progress, slotId) {
  if (!ROOM_SLOTS.includes(slotId)) return unchanged(progress, 'unknown-slot');
  if (progress.roomLayout[slotId] == null) return unchanged(progress, 'already-empty');
  return { progress: { ...progress, roomLayout: { ...progress.roomLayout, [slotId]: null } }, changed: true, reason: 'removed' };
}

const TRANSITIONS = Object.freeze({
  'meet-front-desk': { event: 'desk-met', step: 'do-first-activity' },
  'do-first-activity': { event: 'eligible-activity', step: 'receive-decoration' },
  'receive-decoration': { event: 'decoration-received', step: 'enter-room' },
  'enter-room': { event: 'room-entered', step: 'place-decoration' },
  'place-decoration': { event: 'sunny-rug-placed', step: 'complete', completed: true },
});
export function advanceWelcomeHome(progress, event) {
  const current = progress.journeys?.welcomeHome ?? DEFAULT_WELCOME_HOME;
  const transition = TRANSITIONS[current.step];
  if (current.completed || !transition || transition.event !== event) return unchanged(progress, 'event-ignored');
  return {
    progress: { ...progress, journeys: { ...progress.journeys, welcomeHome: { ...current, step: transition.step, completed: transition.completed === true } } },
    changed: true,
    reason: 'advanced',
  };
}
