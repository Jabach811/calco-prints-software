// All text a child can ever see or send. Everything is pre-written. No exceptions.

export const STARTER_PHRASES = [
  { id: 'hi', text: 'Hi! 👋' },
  { id: 'play', text: "Let's play! 🎮" },
  { id: 'look', text: 'Look! 👀' },
  { id: 'wow', text: 'Wow! ⭐' },
  { id: 'follow', text: 'Follow me!' },
  { id: 'thanks', text: 'Thanks! 💜' },
];

// unlock at level thresholds
export const UNLOCK_PHRASES = [
  { id: 'goodjob', text: 'Good job!', level: 8 },
  { id: 'funny', text: 'That was funny!', level: 9 },
  { id: 'garden', text: "Let's go to the garden!", level: 10 },
  { id: 'nice', text: 'Nice Buddy!', level: 11 },
];

export const EMOTES = [
  { id: 'wave', label: 'Wave', icon: '👋', anim: 'wave' },
  { id: 'cheer', label: 'Cheer', icon: '⭐', anim: 'cheer' },
  { id: 'dance', label: 'Dance', icon: '🎵', anim: 'dance' },
  { id: 'laugh', label: 'Laugh', icon: '😆', anim: 'laugh' },
  { id: 'clap', label: 'Clap', icon: '👏', anim: 'clap' },
  { id: 'sit', label: 'Sit', icon: '🪑', anim: 'sit' },
  { id: 'hop', label: 'Happy Hop', icon: '🐰', anim: 'hop' },
  { id: 'spin', label: 'Spin', icon: '🌀', anim: 'spin' },
];

export const TEMPERAMENTS = [
  'Cheerful', 'Shy', 'Curious', 'Silly', 'Brave', 'Calm',
  'Sleepy', 'Friendly', 'Grumpy-but-sweet', 'Energetic', 'Imaginative',
];

// Each temperament's signature line — shouted during the arrival close-up.
export const CATCHPHRASES = {
  Cheerful: 'Best! Day! EVER! 🌈',
  Shy: 'Um… hi! I made it! 🌸',
  Curious: 'Ooh, what’s THAT? ✨',
  Silly: 'Boing! I have arrived! 🥳',
  Brave: 'Adventure time! ⚡',
  Calm: 'Ahh… lovely. 🍃',
  Sleepy: '*yawn* …I’m here! 💤',
  Friendly: 'Hi, new friends! 💛',
  'Grumpy-but-sweet': 'Hmph. …Okay, this is great. 💕',
  Energetic: 'LET’S GOOO! 🚀',
  Imaginative: 'A magical kingdom! 🦄',
};

// Temperament dialogue banks — short, warm, kid-safe.
export const VOICE = {
  Cheerful: {
    greet: ['Hi hi!', 'This place is awesome!', 'Best day ever!'],
    idle: ['I found something fun!', 'Everything is so sunny!', 'La la laaa!'],
    object: {
      flowers: ['These flowers are SO happy!', 'Flower power!'],
      snack: ['Snacks make everything better!', 'Yum yum yum!'],
      pool: ['Splash splash!', 'The water is all giggly today!'],
      slide: ['Wheee! Again again!', 'That slide is the BEST!'],
      mailbox: ['Ooh, mail day!', 'I love surprises!'],
      bench: ['Best seat in the whole world!'],
      lamp: ['So glowy and pretty!'],
      garden: ['Grow, little plants, grow!'],
      desk: ['Checking in is so exciting!'],
    },
    thought: ['Best day ever! ⭐', 'I love it here!', 'Sunshine! 🌼'],
  },
  Shy: {
    greet: ['Oh! Hello.', 'Hi there…', 'Um, hi.'],
    idle: ['I like it here.', 'Can we go slowly?', 'It’s nice and quiet.'],
    object: {
      flowers: ['These flowers smell nice.', 'They’re so soft…'],
      snack: ['Maybe just a small one…'],
      pool: ['The water looks gentle today.'],
      slide: ['It’s a little high… but fun.'],
      mailbox: ['Is it okay to peek?'],
      bench: ['This is a good hiding spot.'],
      lamp: ['The light is cozy.'],
      garden: ['I like watching things grow.'],
      desk: ['H-hello. Checking in, please.'],
    },
    thought: ['It’s peaceful here.', 'I like the soft breeze.', '🌼'],
  },
  Curious: {
    greet: ['What does this do?', 'Ooh, who are you?', 'Hello! What’s new?'],
    idle: ['Maybe there’s a secret!', 'Let’s look closer!', 'What’s over there?'],
    object: {
      flowers: ['Something moved in there!', 'How do flowers drink?'],
      snack: ['What’s IN popcorn, anyway?'],
      pool: ['How deep does it go?', 'I heard splashing!'],
      slide: ['How fast does it go? Let’s find out!'],
      mailbox: ['Did that mailbox wiggle?', 'What’s inside? WHAT’S INSIDE?'],
      bench: ['Who sat here before us?'],
      lamp: ['How does the light get in there?'],
      garden: ['Maybe there’s treasure under the dirt! 💎'],
      desk: ['What do all those keys open?'],
    },
    thought: ['What’s up there? ⭐', 'Maybe there’s treasure! 💎', 'Did that mailbox wiggle?', 'I wonder what’s upstairs?'],
  },
  Silly: {
    greet: ['Boing!', 'Hi! My feet are doing dance things!', 'Blub blub!'],
    idle: ['I meant to do that!', 'Wiggle wiggle!', 'Boing boing boing!'],
    object: {
      flowers: ['Achoo! Flower sneeze!', 'Petal party!'],
      snack: ['Popcorn goes POP!', 'Ice cream for my face!'],
      pool: ['Cannonbaaaall!', 'I’m a soup ingredient!'],
      slide: ['Wheeeee-hehehe!', 'Zoom zoom splash!'],
      mailbox: ['Hello, box! Any letters for MEEE?'],
      bench: ['This bench is now a boat!'],
      lamp: ['Hello, tiny sun on a stick!'],
      garden: ['Grow, tiny salad, grow!'],
      desk: ['Ding ding! I love that bell!'],
    },
    thought: ['Boing! 🐰', 'My feet are doing dance things!', 'Snacks? 🍪'],
  },
  Brave: {
    greet: ['Hello! Adventure time?', 'I was just exploring!'],
    idle: ['Nothing scares me. Mostly.', 'Let’s climb something!'],
    object: {
      flowers: ['Even brave Buddies stop for flowers.'],
      snack: ['Fuel for adventure!'],
      pool: ['I’ll do the BIG splash!'],
      slide: ['The slide? Easy. Watch this!'],
      mailbox: ['I’ll open it. Stand back!'],
      bench: ['A lookout post!'],
      lamp: ['A beacon for explorers!'],
      garden: ['Guarding the garden. Very important.'],
      desk: ['Reporting for adventure!'],
    },
    thought: ['What’s up there? ⭐', 'Let’s find something shiny!', 'I want a turn! 🛝'],
  },
  Calm: {
    greet: ['Hello, friend.', 'Lovely day, isn’t it?'],
    idle: ['This is peaceful.', 'Let’s rest here.', 'I like the soft breeze.'],
    object: {
      flowers: ['This is a nice shady spot.', 'These flowers smell nice.'],
      snack: ['A little treat, slowly enjoyed.'],
      pool: ['The water sounds like a lullaby.'],
      slide: ['Maybe a gentle ride later.'],
      mailbox: ['Good news travels slowly.'],
      bench: ['Ahh. Perfect.'],
      lamp: ['A warm little glow.'],
      garden: ['Growing takes time. That’s okay.'],
      desk: ['Checking in, nice and easy.'],
    },
    thought: ['This is peaceful.', 'These flowers smell nice.', '🌼'],
  },
  Sleepy: {
    greet: ['Mm? Oh, hello…', '*yawn* Hi…'],
    idle: ['Five more minutes…', 'This grass looks comfy…'],
    object: {
      flowers: ['Flowers make good pillows… probably.'],
      snack: ['A snack, then a nap.'],
      pool: ['Floating is basically napping.'],
      slide: ['The slide can wait… zzz.'],
      mailbox: ['Wake me if it wiggles.'],
      bench: ['Nap spot located.'],
      lamp: ['Too bright… nice, but bright…'],
      garden: ['The plants nap all day. Smart.'],
      desk: ['One room. With a big bed, please.'],
    },
    thought: ['Zzz…', 'This grass looks comfy…', '🥪'],
  },
  Friendly: {
    greet: ['Hi, new friend!', 'I’m SO glad you’re here!', 'Hey, Buddy!'],
    idle: ['Wanna play together?', 'Everyone here is so nice!'],
    object: {
      flowers: ['Let’s water them together!'],
      snack: ['Snacks taste better shared!'],
      pool: ['Pool party! Everyone in!'],
      slide: ['You first! No, me first! Okay, together!'],
      mailbox: ['Maybe it’s a letter from a friend!'],
      bench: ['Sit with me!'],
      lamp: ['Meet you under the lamp!'],
      garden: ['The garden is for everyone!'],
      desk: ['Hello! Any friends checked in today?'],
    },
    thought: ['Let’s play! 🎮', 'I hope a friend comes by!', 'Pool time! 🌊'],
  },
  'Grumpy-but-sweet': {
    greet: ['Hmph. …Hi.', 'What? Oh. Hello, I guess.'],
    idle: ['I’m NOT smiling.', 'This place is… fine. Really fine.'],
    object: {
      flowers: ['Flowers. Hmph. …They’re lovely, okay?!'],
      snack: ['I’m only having one. Maybe two.'],
      pool: ['I’m not splashing. …Okay ONE splash.'],
      slide: ['Slides are for kids. …One ride.'],
      mailbox: ['Probably junk mail. …Ooh, a gift!'],
      bench: ['MY bench. …You can share it.'],
      lamp: ['Too glowy. …It’s kind of nice.'],
      garden: ['Weeds! …Aw, the roses are sweet.'],
      desk: ['Took you long enough. …Thanks.'],
    },
    thought: ['Hmph.', '…Okay, this is nice.', 'Snacks? 🍪'],
  },
  Energetic: {
    greet: ['HI! Race you!', 'GO GO GO!', 'You’re here! Let’s RUN!'],
    idle: ['Can’t stop, won’t stop!', 'Zoom!', 'Again! Again!'],
    object: {
      flowers: ['Speed-watering! Zoom!'],
      snack: ['Snack break! Fastest eater wins!'],
      pool: ['Last one in is a soggy donut!'],
      slide: ['SLIDE! SLIDE! SLIDE!'],
      mailbox: ['Mail check at TOP SPEED!'],
      bench: ['Sitting is just charging up!'],
      lamp: ['Lap around the lamp! Go!'],
      garden: ['Grow faster, plants!'],
      desk: ['Check me in QUICK, I gotta zoom!'],
    },
    thought: ['I want a turn! 🛝', 'I heard splashing!', 'GO GO GO!'],
  },
  Imaginative: {
    greet: ['Greetings, fellow explorer!', 'Welcome to the enchanted resort!'],
    idle: ['That cloud is a dragon. A friendly one.', 'This path leads to a secret kingdom!'],
    object: {
      flowers: ['These are fairy umbrellas, obviously.'],
      snack: ['Popcorn: tiny fluffy clouds you can EAT.'],
      pool: ['The lagoon of the gentle sea monster!'],
      slide: ['The great swooshing rainbow river!'],
      mailbox: ['A tiny dragon lives in there. He sorts letters.'],
      bench: ['Our royal throne!'],
      lamp: ['A captured star on a stick!'],
      garden: ['The rose arch is a portal. Probably.'],
      desk: ['One castle room, please!'],
    },
    thought: ['Maybe there’s treasure! 💎', 'Let’s find something shiny!', 'What’s up there? ⭐'],
  },
};

// context-triggered thought bubbles (nearest zone/object wins, mixed with temperament lines)
export const CONTEXT_THOUGHTS = {
  snack: ['I smell snacks 🍪', 'Snacks? 🍪', '🍪', '🥪'],
  pool: ['I heard splashing!', 'Pool time! 🌊', 'Splash splash!'],
  slide: ['I want a turn! 🛝', 'I want to ride the slide!'],
  garden: ['Let’s check the garden! 🌸', 'These flowers smell nice.', '🌼'],
  flowers: ['These flowers smell nice.', '🌼'],
  mailbox: ['Did that mailbox wiggle?'],
  hotel: ['I wonder what’s upstairs?', 'What’s up there? ⭐'],
  path: ['Let’s find something shiny!', 'Maybe there’s treasure! 💎', '⭐'],
};

export const NPC_GREETINGS = (name) => [
  `Hey, ${name}!`,
  `Welcome back, ${name}!`,
  `${name}! Great to see you!`,
];

export const DESK_LINES = (name) => ({
  welcome: `Hey, ${name}! Welcome to the Blob Hotel!`,
  reward: `Here's your check-in treat: 10 coins!`,
  suggest: [
    'The garden flowers look thirsty today…',
    'I heard the mailbox wiggling earlier!',
    'The slide is extra splashy today!',
    'Somebody spotted sparkles along the path!',
  ],
  talk: [
    `Enjoying your stay, ${name}?`,
    'The rooftop view is wonderful today!',
    'Room 104 found a shiny pebble this morning!',
    'Ring the bell any time you like. I love the bell.',
  ],
});

export const SNACK_LINES = {
  buy: {
    popcorn: ['Pop pop pop! Enjoy!', 'Extra fluffy today!'],
    juice: ['Fresh and squeezy!', 'Berry good choice!'],
    icecream: ['Stay frosty!', 'One scoop of happy!'],
  },
  thanks: ['Aw, you’re welcome! Come back soon!', 'That made my day!'],
  share: ['Sharing is the sweetest!', 'A snack for a friend!'],
};

// curated buddy names (safety: no free-typed names shown to other children)
export const NAME_PARTS = {
  first: ['Goo', 'Bloo', 'Squish', 'Bounce', 'Jelly', 'Wiggle', 'Puff', 'Snug', 'Boba', 'Mochi', 'Pip', 'Doodle', 'Sunny', 'Ziggy', 'Bubble'],
  last: ['ber', 'p', 'bit', 'bean', 'boo', 'zle', 'pop', 'let', 'kin', 'muffin', 'sprout', 'button'],
};
export const CURATED_NAMES = [
  'Goober', 'Bloop', 'Squishbit', 'Jellybean', 'Wigglezle', 'Puffkin', 'Snugbug',
  'Bobaboo', 'Mochipop', 'Piplet', 'Doodlebean', 'Sunnybit', 'Zigzag', 'Bubblet',
  'Bouncemuffin', 'Gumdrop', 'Pebbles', 'Sprout', 'Twinkle', 'Marsh', 'Waffle',
  'Pudding', 'Biscuit', 'Clover', 'Nibbles', 'Poppet', 'Squeak', 'Tofu', 'Pickle', 'Momo',
];

export const STICKERS = [
  { id: 'flower', name: 'Flower Sticker', icon: '🌸' },
  { id: 'star', name: 'Star Sticker', icon: '⭐' },
  { id: 'shell', name: 'Shell Sticker', icon: '🐚' },
  { id: 'sun', name: 'Sunny Sticker', icon: '🌞' },
  { id: 'heart', name: 'Heart Sticker', icon: '💜' },
  { id: 'donut', name: 'Donut Sticker', icon: '🍩' },
  { id: 'duck', name: 'Ducky Sticker', icon: '🦆' },
  { id: 'rainbow', name: 'Rainbow Sticker', icon: '🌈' },
  { id: 'splash', name: 'Splash Sticker', icon: '💦' },
  { id: 'sparkle', name: 'Sparkle Sticker', icon: '✨' },
];

export const COLLECTIBLES = [
  { id: 'leaf', name: 'Leaf', icon: '🍃' },
  { id: 'pebble', name: 'Shiny Pebble', icon: '🪨' },
  { id: 'shellc', name: 'Shell', icon: '🐚' },
  { id: 'starc', name: 'Little Star', icon: '⭐' },
  { id: 'button', name: 'Button', icon: '🔘' },
  { id: 'note', name: 'Music Note', icon: '🎵' },
];

export const SNACKS = [
  { id: 'popcorn', name: 'Popcorn', icon: '🍿', price: 5 },
  { id: 'juice', name: 'Juice', icon: '🧃', price: 5 },
  { id: 'icecream', name: 'Ice Cream', icon: '🍦', price: 5 },
];
