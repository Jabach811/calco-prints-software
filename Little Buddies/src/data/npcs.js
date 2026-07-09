// NPC roster. Desk + snack staff, plus ambient residents (counted in Buddies Online).

export const DESK_BUDDY = {
  id: 'npc-desk',
  name: 'Check-in Desk Buddy',
  shape: 'ghost', color: 'yellow', eyes: 'plain', brows: 'happy', mouth: 'smile',
  accessory: 'staffcap', temperament: 'Friendly',
  behavior: 'desk', pos: [1.5, 0, -50.5], face: Math.PI,
};

export const SNACK_BUDDY = {
  id: 'npc-snack',
  name: 'Snack Stand Buddy',
  shape: 'ghost', color: 'yellow', eyes: 'plain', brows: 'happy', mouth: 'laugh',
  accessory: 'staffcap', temperament: 'Cheerful',
  behavior: 'desk', pos: [46.4, 0, 26], face: -Math.PI / 2,
};

export const AMBIENT_NPCS = [
  { id: 'npc-1', name: 'Pip', shape: 'star', color: 'red', eyes: 'wide', brows: 'happy', mouth: 'laugh', accessory: 'crown', hatColor: 'cream', temperament: 'Energetic', behavior: 'wander', zone: 'plaza', pos: [-8, 0, -20] },
  { id: 'npc-2', name: 'Boba', shape: 'ghost', color: 'yellow', eyes: 'calm', brows: 'angry', mouth: 'neutral', accessory: 'none', temperament: 'Grumpy-but-sweet', behavior: 'wander', zone: 'forecourt', pos: [14, 0, -30] },
  { id: 'npc-3', name: 'Momo', shape: 'mochi', color: 'purple', eyes: 'calm', brows: 'neutral', mouth: 'soft', accessory: 'none', temperament: 'Calm', behavior: 'bench', zone: 'poolside', pos: [34.4, 0.35, 5.45], face: 2.4 },
  { id: 'npc-4', name: 'Ziggy', shape: 'droplet', color: 'blue', eyes: 'sparkle', brows: 'curious', mouth: 'o', accessory: 'wizard', hatColor: 'purple', temperament: 'Imaginative', behavior: 'wander', zone: 'hotelpath', pos: [18, 0, -44] },
  { id: 'npc-5', name: 'Sunny', shape: 'ghost', color: 'orange', eyes: 'plain', brows: 'happy', mouth: 'smile', accessory: 'sunglasses', temperament: 'Cheerful', behavior: 'lounge', zone: 'pool', pos: [63, 0, -2] },
  { id: 'npc-6', name: 'Jelly', shape: 'pear', color: 'pink', eyes: 'sparkle', brows: 'happy', mouth: 'smile', accessory: 'none', temperament: 'Friendly', behavior: 'wander', zone: 'garden', pos: [30, 0, 46] },
  { id: 'npc-7', name: 'Squish', shape: 'star', color: 'yellow', eyes: 'mischief', brows: 'curious', mouth: 'laugh', accessory: 'tophat', hatColor: 'midnight', temperament: 'Silly', behavior: 'wander', zone: 'meadow', pos: [-46, 0, 40] },
  { id: 'npc-8', name: 'Bloop', shape: 'blob', color: 'blue', eyes: 'wide', brows: 'surprised', mouth: 'o', accessory: 'none', temperament: 'Curious', behavior: 'swim', zone: 'pool', pos: [56, 0, -18], float: 'ring' },
  { id: 'npc-9', name: 'Twinkle', shape: 'star', color: 'red', eyes: 'plain', brows: 'angry', mouth: 'grin', accessory: 'party', hatColor: 'blue', temperament: 'Brave', behavior: 'swim', zone: 'pool', pos: [48, 0, -24], float: 'duck' },
  { id: 'npc-10', name: 'Clover', shape: 'tofu', color: 'green', eyes: 'sleepy', brows: 'neutral', mouth: 'shy', accessory: 'beanie', hatColor: 'green', temperament: 'Sleepy', behavior: 'bench', zone: 'garden', pos: [40.4, 0.35, 58.55], face: -2.2 },
  { id: 'npc-11', name: 'Puff', shape: 'ghost', color: 'purple', eyes: 'plain', brows: 'sad', mouth: 'shy', accessory: 'party', hatColor: 'pink', temperament: 'Shy', behavior: 'balcony', pos: [-12, 6.4, -52.2] },
  { id: 'npc-12', name: 'Pudding', shape: 'mochi', color: 'yellow', eyes: 'plain', brows: 'curious', mouth: 'soft', accessory: 'crown', hatColor: 'gold', temperament: 'Curious', behavior: 'balcony', pos: [10, 9.6, -52.2] },
];

// waypoint sets by zone for wanderers
export const WAYPOINTS = {
  plaza: [[-6, 4], [8, 8], [0, 14], [-10, 10], [4, -2], [12, 2]],
  forecourt: [[10, -32], [-8, -36], [4, -26], [16, -28], [-14, -30]],
  hotelpath: [[18, -40], [8, -30], [-4, -24], [22, -32], [12, -22]],
  garden: [[28, 44], [40, 50], [34, 58], [24, 52], [44, 44], [34, 40]],
  meadow: [[-52, 36], [-40, 44], [-48, 50], [-56, 44], [-42, 34], [-36, 40]],
  poolside: [[38, -2], [42, 6], [34, 8], [40, 0]],
  path: [[0, 22], [10, 30], [-6, 34], [4, 42], [14, 20]],
};
