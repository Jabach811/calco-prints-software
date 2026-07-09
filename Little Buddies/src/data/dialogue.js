// All text a child can ever see or send. Everything is pre-written. No exceptions.

export const STARTER_PHRASES = [
  { id: 'hi', text: 'Yo! 👋' },
  { id: 'play', text: "Let's go! 🎮" },
  { id: 'look', text: 'Check this out! 👀' },
  { id: 'wow', text: 'No way! 🔥' },
  { id: 'follow', text: 'Follow me!' },
  { id: 'thanks', text: 'Thanks! 🤘' },
];

// unlock at level thresholds
export const UNLOCK_PHRASES = [
  { id: 'goodjob', text: 'Nice one!', level: 8 },
  { id: 'funny', text: 'LOL!', level: 9 },
  { id: 'garden', text: 'Race you to the pool!', level: 10 },
  { id: 'nice', text: 'GG!', level: 11 },
];

export const EMOTES = [
  { id: 'wave', label: 'Wave', icon: '👋', anim: 'wave' },
  { id: 'cheer', label: 'Hype', icon: '🔥', anim: 'cheer' },
  { id: 'dance', label: 'Dance', icon: '🕺', anim: 'dance' },
  { id: 'laugh', label: 'LOL', icon: '😂', anim: 'laugh' },
  { id: 'clap', label: 'Slow Clap', icon: '👏', anim: 'clap' },
  { id: 'sit', label: 'Sit', icon: '🪑', anim: 'sit' },
  { id: 'hop', label: 'Bounce', icon: '⚡', anim: 'hop' },
  { id: 'spin', label: 'Spin', icon: '🌀', anim: 'spin' },
];

export const TEMPERAMENTS = [
  'Hyped', 'Lowkey', 'Curious', 'Goofball', 'Daredevil', 'Chill',
  'Sleepy', 'Friendly', 'Grumpy', 'Turbo', 'Weird',
];

// Each temperament's signature line — shouted during the arrival close-up.
export const CATCHPHRASES = {
  Hyped: 'This place is EPIC! 🔥',
  Lowkey: 'Sup. I made it.',
  Curious: 'Wait. What IS this place?',
  Goofball: 'I have arrived. Hold your applause.',
  Daredevil: "Where's the biggest slide?! ⚡",
  Chill: 'Cool cool cool.',
  Sleepy: '*yawn* …made it. 💤',
  Friendly: "Yooo, what's up everybody!",
  Grumpy: 'Hmph. …Fine, this is cool.',
  Turbo: 'LET’S GOOO! 🚀',
  Weird: 'The prophecy was true.',
};

// Temperament dialogue banks — short, punchy, kid-safe.
export const VOICE = {
  Hyped: {
    greet: ['Yooo!', 'This place is EPIC!', 'Best. Day. Ever.'],
    idle: ['I am SO hyped right now!', 'Today rules!', 'Everything here goes hard!'],
    object: {
      flowers: ['Even the flowers go hard here!', 'Nature buff: unlocked!'],
      snack: ['Snacks are basically power-ups!', 'Best snack stand EVER!'],
      pool: ['CANNONBALL!', 'Pool day is the best day!'],
      slide: ['That slide is UNDEFEATED!', 'Ten out of ten. Going again.'],
      mailbox: ['Mail day! Let’s gooo!', 'I love free stuff!'],
      bench: ['Best seat in the house!'],
      lamp: ['Even the lamp is cool here!'],
      garden: ['Grow! GROW!'],
      desk: ['Check me in, I’m READY!'],
    },
    thought: ['This place rules! ⭐', 'HYPED.', 'Best day ever.'],
  },
  Lowkey: {
    greet: ['Oh. Hey.', 'Sup.', '…hi.'],
    idle: ['Just gonna hang here.', 'It’s quiet. I like it.', 'No rush.'],
    object: {
      flowers: ['Flowers. Cool.', 'They’re… actually pretty nice.'],
      snack: ['I’ll take one. Maybe two.'],
      pool: ['I’ll get in. In a minute.'],
      slide: ['Looks high. …I’ll allow it.'],
      mailbox: ['You open it. I’ll watch.'],
      bench: ['Good spot. Low traffic.'],
      lamp: ['Nice lamp, I guess.'],
      garden: ['Plants don’t talk. That’s why I like them.'],
      desk: ['One room please. A quiet one.'],
    },
    thought: ['Peace and quiet.', 'Five more minutes of nothing.', '…'],
  },
  Curious: {
    greet: ['What does this do?', 'Any new discoveries?', 'Who are you, and what do you know?'],
    idle: ['There’s DEFINITELY a secret around here.', 'Let’s investigate.', 'What’s over there?'],
    object: {
      flowers: ['Something moved in there.', 'How do flowers even drink?'],
      snack: ['What’s IN popcorn, anyway?'],
      pool: ['How deep does it go? Nobody knows.', 'I heard splashing!'],
      slide: ['How fast does it go? Let’s find out.'],
      mailbox: ['That mailbox moved. I saw it.', 'What’s inside? WHAT’S INSIDE?'],
      bench: ['Who sat here before us? A mystery.'],
      lamp: ['How does the light get in there?'],
      garden: ['Buried treasure. Calling it now. 💎'],
      desk: ['What do all those keys open?'],
    },
    thought: ['Something’s up.', 'The mailbox knows things.', 'What’s upstairs?', 'Maybe there’s treasure. 💎'],
  },
  Goofball: {
    greet: ['Boing.', 'Greetings. My feet are doing their own thing.', 'Blub blub.'],
    idle: ['I meant to do that.', 'Watch this. …Okay, watch THIS.', 'Boing boing boing.'],
    object: {
      flowers: ['Achoo! Flower attack!', 'The flowers are plotting something.'],
      snack: ['Popcorn goes POP!', 'Applying ice cream directly to face.'],
      pool: ['Cannonbaaaall!', 'I am now a soup ingredient.'],
      slide: ['WheeeHAHAHA!', 'Zoom zoom splat.'],
      mailbox: ['Hello, box. Any letters for MEEE?'],
      bench: ['This bench is now a pirate ship.'],
      lamp: ['Hello, tiny sun on a stick.'],
      garden: ['Grow, tiny salad, grow!'],
      desk: ['One room for me and my 47 invisible snails.'],
    },
    thought: ['Boing.', 'My feet are doing their own thing.', 'Snacks? 🍕'],
  },
  Daredevil: {
    greet: ['Who wants to do something slightly dangerous?', 'I was just up on the roof.'],
    idle: ['Nothing scares me. Mostly.', 'Let’s climb something.'],
    object: {
      flowers: ['Even daredevils stop for flowers. Briefly.'],
      snack: ['Fuel for the mission.'],
      pool: ['Biggest splash. Watch this.'],
      slide: ['The slide? Easy. No hands.'],
      mailbox: ['I’ll open it. Stand back.'],
      bench: ['A lookout post.'],
      lamp: ['Signal tower. For emergencies.'],
      garden: ['Guarding the garden. Very important.'],
      desk: ['Reporting for duty.'],
    },
    thought: ['What’s on the roof?', 'No hands next time.', 'My turn. 🛝'],
  },
  Chill: {
    greet: ['Hey.', 'Nice day, right?'],
    idle: ['No stress.', 'Just vibing.', 'Take it easy.'],
    object: {
      flowers: ['Good spot. Good shade.', 'Flowers get it. Just chill and grow.'],
      snack: ['Snack break. No rush.'],
      pool: ['Float mode: activated.'],
      slide: ['Maybe later. The bench is calling.'],
      mailbox: ['Good news travels slow.'],
      bench: ['Ahh. Perfect.'],
      lamp: ['Nice glow.'],
      garden: ['Growing takes time. Respect.'],
      desk: ['Checking in. No rush.'],
    },
    thought: ['Vibes.', 'This is the spot.', 'Zero stress.'],
  },
  Sleepy: {
    greet: ['Mm? Oh, hey…', '*yawn* Sup…'],
    idle: ['Five more minutes…', 'This grass looks comfy…'],
    object: {
      flowers: ['Flowers make good pillows… probably.'],
      snack: ['Snack, then nap.'],
      pool: ['Floating is basically napping.'],
      slide: ['The slide can wait… zzz.'],
      mailbox: ['Wake me if it moves.'],
      bench: ['Nap spot located.'],
      lamp: ['Too bright… nice, but bright…'],
      garden: ['The plants nap all day. Smart.'],
      desk: ['One room. Big bed. Please.'],
    },
    thought: ['Zzz…', 'This grass looks comfy…', '🍕'],
  },
  Friendly: {
    greet: ['Yo, new friend!', 'You made it!', 'Hey hey!'],
    idle: ['Wanna hang?', 'Everyone here is cool.'],
    object: {
      flowers: ['Team watering. Let’s go.'],
      snack: ['Snacks hit different when you split them.'],
      pool: ['Pool party! Everyone in!'],
      slide: ['You first! No, me first! Okay, race.'],
      mailbox: ['Maybe it’s from a friend!'],
      bench: ['Saved you a seat.'],
      lamp: ['Meet-up spot: the lamp.'],
      garden: ['Group project: this garden.'],
      desk: ['Any friends checked in today?'],
    },
    thought: ['Squad forming. 🎮', 'Hope somebody comes by.', 'Pool time! 🌊'],
  },
  Grumpy: {
    greet: ['Hmph. …Hi.', 'What? Oh. Hey, I guess.'],
    idle: ['I’m NOT having fun.', 'This place is… fine. WHATEVER.'],
    object: {
      flowers: ['Flowers. Hmph. …They’re decent, okay?!'],
      snack: ['I’m only having one. Maybe two.'],
      pool: ['I’m not splashing. …Okay ONE splash.'],
      slide: ['Slides are for little kids. …One ride.'],
      mailbox: ['Probably junk mail. …Ooh, free stuff.'],
      bench: ['MY bench. …Fine, you can share.'],
      lamp: ['Too glowy. …It’s kind of cool.'],
      garden: ['Weeds! …Okay, the roses are decent.'],
      desk: ['Took you long enough. …Thanks.'],
    },
    thought: ['Hmph.', '…Okay, this is nice.', 'Snacks? 🍕'],
  },
  Turbo: {
    greet: ['RACE YOU!', 'GO GO GO!', 'You’re here! RUN!'],
    idle: ['Can’t stop, won’t stop!', 'Zoom!', 'Lap two!'],
    object: {
      flowers: ['Speed-watering! GO!'],
      snack: ['Snack break! Speedrun!'],
      pool: ['Last one in is a soggy donut!'],
      slide: ['SLIDE! SLIDE! SLIDE!'],
      mailbox: ['Mail check at TOP SPEED!'],
      bench: ['Sitting is just charging up!'],
      lamp: ['Lap around the lamp! GO!'],
      garden: ['Grow faster, plants!'],
      desk: ['Check me in QUICK, I gotta GO!'],
    },
    thought: ['GO GO GO!', 'Speedrun everything.', 'My turn! 🛝'],
  },
  Weird: {
    greet: ['Greetings. The signs led me here.', 'You again. Interesting.'],
    idle: ['That cloud is watching us.', 'This path is definitely a portal.'],
    object: {
      flowers: ['These are alien antennas. Obviously.'],
      snack: ['Popcorn: tiny clouds you can eat.'],
      pool: ['The lagoon of the gentle sea monster.'],
      slide: ['The great launch ramp of the ancients.'],
      mailbox: ['A tiny dragon lives in there. He sorts the letters.'],
      bench: ['The Throne. Show respect.'],
      lamp: ['A captured star on a stick.'],
      garden: ['The rose arch is a portal. Probably.'],
      desk: ['One room. Preferably haunted.'],
    },
    thought: ['The prophecy…', 'The mushroom knows.', 'That bird is a spy.'],
  },
};

// context-triggered thought bubbles (nearest zone/object wins, mixed with temperament lines)
export const CONTEXT_THOUGHTS = {
  snack: ['I smell snacks 🍕', 'Snack time?', '🍕', '🍿'],
  pool: ['I heard splashing!', 'Cannonball time. 🌊', 'Pool!'],
  slide: ['My turn. 🛝', 'Race you to the slide!'],
  garden: ['Something’s growing over there. 🥕', 'Garden check.'],
  flowers: ['The flowers are up to something.', '🌼'],
  mailbox: ['Did that mailbox just move?'],
  hotel: ['What’s on the roof?', 'What’s upstairs? ⭐'],
  path: ['Loot. I can feel it.', 'Something shiny out there… 💎', '⭐'],
};

export const NPC_GREETINGS = (name) => [
  `Yo, ${name}!`,
  `${name}! You're back!`,
  `Sup, ${name}.`,
];

export const DESK_LINES = (name) => ({
  welcome: `Yo, ${name}! Welcome back to the Blob Hotel.`,
  reward: `Daily bonus: 10 coins. Don't blow it all at the snack stand.`,
  suggest: [
    'Word is something’s buried along the path…',
    'The mailbox was making noises again. Probably nothing.',
    'The rooftop slide is running FAST today.',
    'Somebody keeps poking the mushroom. It started glowing back.',
  ],
  talk: [
    `Enjoying your stay, ${name}?`,
    'The rooftop view is undefeated.',
    'Room 104 swears the mailbox growled at them.',
    'Ring the bell again. I dare you.',
  ],
});

export const SNACK_LINES = {
  buy: {
    popcorn: ['Fresh batch. Careful, it’s still popping.', 'Extra crunchy today!'],
    pizza: ['Hot slice, coming up!', 'The good stuff.'],
    juice: ['Ice cold!', 'Extra fizzy today!'],
    icecream: ['Stay frosty!', 'Brain freeze speedrun?'],
  },
  thanks: ['Anytime! Come back soon!', 'You just made my shift!'],
  share: ['Respect. Sharing the loot.', 'Snacks taste better split.'],
};

// curated buddy names (safety: no free-typed names shown to other children)
export const NAME_PARTS = {
  first: ['Glitch', 'Turbo', 'Nacho', 'Sludge', 'Chomp', 'Splat', 'Grub', 'Zonk', 'Bolt', 'Mega', 'Crunch', 'Blor'],
  last: ['bo', 'zilla', 'tron', 'ster', 'ball', 'face', 'wich', 'zoid', 'er', 'o', 'nugget', 'byte'],
};
export const CURATED_NAMES = [
  'Goober', 'Glitch', 'Turbo', 'Nacho', 'Pickle', 'Waffle', 'Biscuit', 'Zigzag',
  'Sludge', 'Chomp', 'Bolt', 'Fang', 'Gizmo', 'Taco', 'Meatball', 'Nugget',
  'Splat', 'Zonk', 'Grub', 'Rocket', 'Steve', 'Kevin', 'Gary', 'Larry',
  'Doug', 'Crouton', 'Noodle', 'Mothman', 'Blorp', 'Dozer',
];

export const STICKERS = [
  { id: 'flower', name: 'Cactus Sticker', icon: '🌵' },
  { id: 'star', name: 'Star Sticker', icon: '⭐' },
  { id: 'shell', name: 'Shell Sticker', icon: '🐚' },
  { id: 'sun', name: 'Supernova Sticker', icon: '🌞' },
  { id: 'heart', name: 'Skull Sticker', icon: '💀' },
  { id: 'donut', name: 'Donut Sticker', icon: '🍩' },
  { id: 'duck', name: 'Rubber Duck Sticker', icon: '🦆' },
  { id: 'rainbow', name: 'Lightning Sticker', icon: '⚡' },
  { id: 'splash', name: 'Cannonball Sticker', icon: '💦' },
  { id: 'sparkle', name: 'Rare Drop Sticker', icon: '✨' },
];

export const COLLECTIBLES = [
  { id: 'leaf', name: 'Weird Leaf', icon: '🍃' },
  { id: 'pebble', name: 'Pet Rock', icon: '🪨' },
  { id: 'shellc', name: 'Fossil', icon: '🦴' },
  { id: 'starc', name: 'Star Shard', icon: '⭐' },
  { id: 'button', name: 'Mystery Button', icon: '🔘' },
  { id: 'note', name: 'Sick Beat', icon: '🎵' },
];

export const SNACKS = [
  { id: 'pizza', name: 'Pizza', icon: '🍕', price: 5 },
  { id: 'popcorn', name: 'Popcorn', icon: '🍿', price: 5 },
  { id: 'juice', name: 'Soda', icon: '🥤', price: 5 },
  { id: 'icecream', name: 'Ice Cream', icon: '🍦', price: 5 },
];
