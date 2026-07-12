export const ROOM_SLOTS = Object.freeze(['bed', 'rug', 'wall', 'shelf', 'trophy']);
export const DAILY_ROOM_REWARD_POOL = Object.freeze([
  'starlight-bed', 'garden-rug', 'buddy-banner', 'glow-mushroom', 'friendship-star',
]);

const HEX = /^#[0-9A-F]{6}$/i;

function item(id, name, slot, rarity, source, kind, color, accent) {
  return Object.freeze({
    id,
    name,
    icon: id,
    slot,
    rarity,
    source,
    render: Object.freeze({ kind, color, accent }),
  });
}

export const ROOM_CATALOG = Object.freeze([
  item('cozy-bed', 'Cozy Bed', 'bed', 'starter', 'level-7', 'bed', '#D8A45B', '#FFF8E8'),
  item('cloud-bed', 'Cloud Bed', 'bed', 'common', 'level-8', 'bed', '#8ED4F7', '#FFFFFF'),
  item('starlight-bed', 'Starlight Bed', 'bed', 'rare', 'daily', 'bed', '#493B78', '#FFD23F'),
  item('sunny-rug', 'Sunny Rug', 'rug', 'starter', 'welcome-home', 'rug', '#FFD23F', '#FFF8E8'),
  item('splash-rug', 'Splash Rug', 'rug', 'common', 'slide-first', 'rug', '#3D8BFD', '#8ED4F7'),
  item('garden-rug', 'Garden Rug', 'rug', 'common', 'daily', 'rug', '#54C24E', '#FFF8E8'),
  item('postcard-frame', 'Postcard Frame', 'wall', 'common', 'mailbox-first', 'wall', '#D8A45B', '#FFF8E8'),
  item('disco-light', 'Disco Light', 'wall', 'rare', 'dance-first', 'wall', '#9B5DE5', '#FFD23F'),
  item('buddy-banner', 'Buddy Banner', 'wall', 'common', 'daily', 'wall', '#3D8BFD', '#FFF8E8'),
  item('flower-pot', 'Flower Pot', 'shelf', 'common', 'watering-first', 'shelf', '#54C24E', '#F15BB5'),
  item('lucky-leaf', 'Lucky Leaf', 'shelf', 'common', 'collectible-leaf', 'shelf', '#35743A', '#FFD23F'),
  item('glow-mushroom', 'Glow Mushroom', 'shelf', 'rare', 'daily', 'shelf', '#9B5DE5', '#FFF8E8'),
  item('pool-float-trophy', 'Pool Float Trophy', 'trophy', 'common', 'slide-first', 'trophy', '#3D8BFD', '#FFFFFF'),
  item('gold-record', 'Gold Record', 'trophy', 'rare', 'dance-a-grade', 'trophy', '#F0B429', '#35301F'),
  item('friendship-star', 'Friendship Star', 'trophy', 'rare', 'daily', 'trophy', '#FFD23F', '#F15BB5'),
]);

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
