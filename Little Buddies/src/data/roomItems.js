export const ROOM_SLOTS = Object.freeze(['bed', 'rug', 'wall', 'shelf', 'trophy']);

const item = (id, name, slot, rarity, source, color, accent) => Object.freeze({
  id, name, icon: id, slot, rarity, source, color, accent,
});

// Canonical Room 107 metadata. The lazy visual catalog adds only render shape.
export const ROOM_ITEMS = Object.freeze([
  item('cozy-bed', 'Cozy Bed', 'bed', 'starter', 'level-7', '#D8A45B', '#FFF8E8'),
  item('cloud-bed', 'Cloud Bed', 'bed', 'common', 'level-8', '#8ED4F7', '#FFFFFF'),
  item('starlight-bed', 'Starlight Bed', 'bed', 'rare', 'daily', '#493B78', '#FFD23F'),
  item('sunny-rug', 'Sunny Rug', 'rug', 'starter', 'welcome-home', '#FFD23F', '#FFF8E8'),
  item('splash-rug', 'Splash Rug', 'rug', 'common', 'slide-first', '#3D8BFD', '#8ED4F7'),
  item('garden-rug', 'Garden Rug', 'rug', 'common', 'daily', '#54C24E', '#FFF8E8'),
  item('postcard-frame', 'Postcard Frame', 'wall', 'common', 'mailbox-first', '#D8A45B', '#FFF8E8'),
  item('disco-light', 'Disco Light', 'wall', 'rare', 'dance-first', '#9B5DE5', '#FFD23F'),
  item('buddy-banner', 'Buddy Banner', 'wall', 'common', 'daily', '#3D8BFD', '#FFF8E8'),
  item('flower-pot', 'Flower Pot', 'shelf', 'common', 'watering-first', '#54C24E', '#F15BB5'),
  item('lucky-leaf', 'Lucky Leaf', 'shelf', 'common', 'collectible-leaf', '#35743A', '#FFD23F'),
  item('glow-mushroom', 'Glow Mushroom', 'shelf', 'rare', 'daily', '#9B5DE5', '#FFF8E8'),
  item('pool-float-trophy', 'Pool Float Trophy', 'trophy', 'common', 'slide-first', '#3D8BFD', '#FFFFFF'),
  item('gold-record', 'Gold Record', 'trophy', 'rare', 'dance-a-grade', '#F0B429', '#35301F'),
  item('friendship-star', 'Friendship Star', 'trophy', 'rare', 'daily', '#FFD23F', '#F15BB5'),
]);

const LOOKUP = new Map(ROOM_ITEMS.map((entry) => [entry.id, entry]));
export const DAILY_ROOM_REWARD_POOL = Object.freeze(ROOM_ITEMS.filter((entry) => entry.source === 'daily').map((entry) => entry.id));
export function roomItemMetadata(id) { return LOOKUP.get(id) ?? null; }
