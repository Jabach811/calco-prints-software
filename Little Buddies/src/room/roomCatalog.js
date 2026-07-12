import { DAILY_ROOM_REWARD_POOL, ROOM_ITEMS, ROOM_SLOTS } from '../data/roomItems.js';
export { DAILY_ROOM_REWARD_POOL, ROOM_SLOTS };
const HEX = /^#[0-9A-F]{6}$/i;

function item(metadata) {
  return Object.freeze({
    id: metadata.id, name: metadata.name, icon: metadata.icon, slot: metadata.slot,
    rarity: metadata.rarity, source: metadata.source,
    render: Object.freeze({ kind: metadata.slot, color: metadata.color, accent: metadata.accent }),
  });
}

export const ROOM_CATALOG = Object.freeze(ROOM_ITEMS.map(item));

const ROOM_ITEM_LOOKUP = new Map(ROOM_CATALOG.map((catalogItem) => [catalogItem.id, catalogItem]));

export function roomItemById(id) {
  return ROOM_ITEM_LOOKUP.get(id) ?? null;
}

export function validateRoomCatalog(catalog) {
  if (!Array.isArray(catalog)) return ['Catalog must be an array'];

  const errors = [];
  const ids = new Set();
  for (const [index, catalogItem] of catalog.entries()) {
    const label = catalogItem?.id || `item ${index + 1}`;
    if (!catalogItem?.id) errors.push(`Item ${index + 1} is missing an ID`);
    else if (ids.has(catalogItem.id)) errors.push(`Duplicate item ID: ${catalogItem.id}`);
    else ids.add(catalogItem.id);

    if (!catalogItem?.name?.trim()) errors.push(`${label} is missing a name`);
    if (!ROOM_SLOTS.includes(catalogItem?.slot)) errors.push(`${label} has invalid slot: ${catalogItem?.slot}`);
    if (!ROOM_SLOTS.includes(catalogItem?.render?.kind)) {
      errors.push(`${label} has invalid render kind: ${catalogItem?.render?.kind}`);
    }
    if (!HEX.test(catalogItem?.render?.color ?? '')) errors.push(`${label} has invalid color`);
    if (!HEX.test(catalogItem?.render?.accent ?? '')) errors.push(`${label} has invalid accent`);
  }
  return errors;
}
