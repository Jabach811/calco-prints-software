// Every interactable in the world: position, radius, action menu, cooldowns.
// Action colors follow the mockups: Talk=blue, Gift=green, Wave=yellow, Cheer=purple, Snack=orange.

export const INTERACTABLES = [
  {
    id: 'checkin-desk', type: 'desk', name: 'Check-in Desk Buddy', icon: '🛎️',
    pos: [1.5, -48.5], radius: 5, sparkleY: 3.2,
    actions: [
      { id: 'talk', label: 'Talk', color: 'blue', icon: '💬', anim: 'talk', cooldown: 4 },
      { id: 'gift', label: 'Gift', color: 'green', icon: '🎁', anim: 'gift', cooldown: 30 },
      { id: 'wave', label: 'Wave', color: 'yellow', icon: '👋', anim: 'wave', cooldown: 4 },
      { id: 'cheer', label: 'Cheer', color: 'purple', icon: '⭐', anim: 'cheer', cooldown: 4 },
      { id: 'bell', label: 'Ring Bell', color: 'orange', icon: '🔔', anim: 'talk', cooldown: 8 },
    ],
  },
  {
    id: 'flowerbed-plaza', type: 'flowers', name: 'Flower Bed', icon: '🌸',
    pos: [0, 4], radius: 5.5, sparkleY: 1.6,
    actions: [
      { id: 'view', label: 'View', color: 'blue', icon: '👁️', anim: 'look', cooldown: 2 },
      { id: 'water', label: 'Water', color: 'green', icon: '💧', anim: 'water', cooldown: 30, progress: { label: 'Water Flowers', secs: 2.6 } },
      { id: 'smell', label: 'Smell', color: 'yellow', icon: '👃', anim: 'look', cooldown: 6 },
      { id: 'sparklepick', label: 'Pick Sparkle', color: 'purple', icon: '✨', anim: 'pick', cooldown: 45 },
    ],
  },
  {
    id: 'flowerbed-garden', type: 'flowers', name: 'Rose Bed', icon: '🌹',
    pos: [27, 47], radius: 5, sparkleY: 1.6,
    actions: [
      { id: 'view', label: 'View', color: 'blue', icon: '👁️', anim: 'look', cooldown: 2 },
      { id: 'water', label: 'Water', color: 'green', icon: '💧', anim: 'water', cooldown: 30, progress: { label: 'Water Flowers', secs: 2.6 } },
      { id: 'smell', label: 'Smell', color: 'yellow', icon: '👃', anim: 'look', cooldown: 6 },
      { id: 'sparklepick', label: 'Pick Sparkle', color: 'purple', icon: '✨', anim: 'pick', cooldown: 45 },
    ],
  },
  {
    id: 'mailbox', type: 'mailbox', name: 'Mailbox', icon: '📮',
    pos: [8, 26], radius: 4.5, sparkleY: 2.6,
    actions: [
      { id: 'view', label: 'View', color: 'blue', icon: '👁️', anim: 'look', cooldown: 2 },
      { id: 'read', label: 'Read', color: 'green', icon: '📖', anim: 'look', cooldown: 8 },
      { id: 'shake', label: 'Shake', color: 'yellow', icon: '🤝', anim: 'shake', cooldown: 8 },
      { id: 'open', label: 'Open', color: 'purple', icon: '🎁', anim: 'pick', cooldown: 5 },
    ],
  },
  {
    id: 'lamp-plaza', type: 'lamp', name: 'Lamp Post', icon: '💡',
    pos: [-8.5, -8], radius: 4, sparkleY: 5,
    actions: [
      { id: 'view', label: 'View', color: 'blue', icon: '👁️', anim: 'look', cooldown: 2 },
      { id: 'shake', label: 'Shake', color: 'yellow', icon: '🤝', anim: 'shake', cooldown: 10 },
      { id: 'decorate', label: 'Decorate', color: 'purple', icon: '🎀', anim: 'pick', cooldown: 20 },
    ],
  },
  {
    id: 'bench-garden', type: 'bench', name: 'Garden Bench', icon: '🪑',
    pos: [41, 59], radius: 4.5, sparkleY: 2, sitSpot: [41.65, 58.4], sitFace: -2.2,
    actions: [
      { id: 'sit', label: 'Sit', color: 'blue', icon: '🪑', anim: 'sit', cooldown: 2 },
      { id: 'view', label: 'View', color: 'green', icon: '👁️', anim: 'look', cooldown: 2 },
      { id: 'decorate', label: 'Decorate', color: 'purple', icon: '🎀', anim: 'pick', cooldown: 20 },
    ],
  },
  {
    id: 'bench-pool', type: 'bench', name: 'Poolside Bench', icon: '🪑',
    pos: [35, 6], radius: 4.5, sparkleY: 2, sitSpot: [35.65, 5.4], sitFace: 2.4,
    actions: [
      { id: 'sit', label: 'Sit', color: 'blue', icon: '🪑', anim: 'sit', cooldown: 2 },
      { id: 'view', label: 'View', color: 'green', icon: '👁️', anim: 'look', cooldown: 2 },
      { id: 'decorate', label: 'Decorate', color: 'purple', icon: '🎀', anim: 'pick', cooldown: 20 },
    ],
  },
  {
    id: 'gardenplot', type: 'plot', name: 'Garden Plot', icon: '🥕',
    pos: [23, 40], radius: 4.5, sparkleY: 1.6,
    actions: [
      { id: 'water', label: 'Water', color: 'green', icon: '💧', anim: 'water', cooldown: 20, progress: { label: 'Water Plot', secs: 2.2 } },
      { id: 'view', label: 'View', color: 'blue', icon: '👁️', anim: 'look', cooldown: 2 },
      { id: 'plant', label: 'Plant', color: 'yellow', icon: '🌱', anim: 'pick', cooldown: 10 },
      { id: 'harvest', label: 'Harvest', color: 'orange', icon: '🧺', anim: 'pick', cooldown: 10 },
    ],
  },
  {
    id: 'float-duck', type: 'float', name: 'Ducky Float', icon: '🦆',
    pos: [46, -13], radius: 5, sparkleY: 1.4, waterY: true,
    actions: [
      { id: 'getin', label: 'Get In', color: 'blue', icon: '🛟', anim: 'float', cooldown: 3 },
      { id: 'sit', label: 'Sit', color: 'green', icon: '🪑', anim: 'float', cooldown: 3 },
      { id: 'shake', label: 'Shake', color: 'yellow', icon: '🤝', anim: 'shake', cooldown: 8 },
      { id: 'play', label: 'Play', color: 'purple', icon: '🎮', anim: 'float', cooldown: 6 },
    ],
  },
  {
    id: 'float-donut', type: 'float', name: 'Donut Float', icon: '🍩',
    pos: [58, -26], radius: 5, sparkleY: 1.4, waterY: true,
    actions: [
      { id: 'getin', label: 'Get In', color: 'blue', icon: '🛟', anim: 'float', cooldown: 3 },
      { id: 'sit', label: 'Sit', color: 'green', icon: '🪑', anim: 'float', cooldown: 3 },
      { id: 'shake', label: 'Shake', color: 'yellow', icon: '🤝', anim: 'shake', cooldown: 8 },
      { id: 'play', label: 'Play', color: 'purple', icon: '🎮', anim: 'float', cooldown: 6 },
    ],
  },
  {
    id: 'slide', type: 'slide', name: 'Rooftop Slide', icon: '🛝',
    pos: [-24, -40], radius: 5.5, sparkleY: 3,
    actions: [
      { id: 'ride', label: 'Ride', color: 'blue', icon: '🛝', anim: 'ride', cooldown: 10 },
      { id: 'view', label: 'View', color: 'green', icon: '👁️', anim: 'look', cooldown: 2 },
      { id: 'cheer', label: 'Cheer', color: 'purple', icon: '⭐', anim: 'cheer', cooldown: 4 },
    ],
  },
  {
    id: 'snackstand', type: 'snack', name: 'Snack Stand', icon: '🍩',
    pos: [44, 26], radius: 5.5, sparkleY: 4,
    actions: [
      { id: 'menu', label: 'View Menu', color: 'blue', icon: '📋', anim: 'look', cooldown: 2 },
      { id: 'buy', label: 'Buy', color: 'green', icon: '🪙', anim: 'talk', cooldown: 3 },
      { id: 'share', label: 'Share', color: 'yellow', icon: '💝', anim: 'gift', cooldown: 15 },
      { id: 'snackthanks', label: 'Say Thanks', color: 'purple', icon: '💜', anim: 'wave', cooldown: 6 },
    ],
  },
  {
    id: 'sparkle-1', type: 'sparkle', name: 'Sparkly Spot', icon: '✨',
    pos: [-14, 30], radius: 3.5, sparkleY: 1,
    actions: [{ id: 'pickup', label: 'Pick Up', color: 'purple', icon: '✨', anim: 'pick', cooldown: 120 }],
  },
  {
    id: 'sparkle-2', type: 'sparkle', name: 'Sparkly Spot', icon: '✨',
    pos: [-38, 18], radius: 3.5, sparkleY: 1,
    actions: [{ id: 'pickup', label: 'Pick Up', color: 'purple', icon: '✨', anim: 'pick', cooldown: 120 }],
  },
  {
    id: 'sparkle-3', type: 'sparkle', name: 'Sparkly Spot', icon: '✨',
    pos: [52, 44], radius: 3.5, sparkleY: 1,
    actions: [{ id: 'pickup', label: 'Pick Up', color: 'purple', icon: '✨', anim: 'pick', cooldown: 120 }],
  },
  {
    id: 'mushroom', type: 'mushroom', name: 'Glowing Mushroom', icon: '🍄',
    pos: [-4, 52], radius: 3.5, sparkleY: 1.4,
    actions: [
      { id: 'view', label: 'View', color: 'blue', icon: '👁️', anim: 'look', cooldown: 2 },
      { id: 'boop', label: 'Boop', color: 'pink', icon: '👉', anim: 'pick', cooldown: 8 },
    ],
  },
];

export const byId = Object.fromEntries(INTERACTABLES.map((o) => [o.id, o]));
