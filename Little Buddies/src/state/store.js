import { create } from 'zustand';
import { byId } from '../data/interactables.js';
import { AMBIENT_NPCS } from '../data/npcs.js';
import { VOICE, DESK_LINES, SNACK_LINES, STARTER_PHRASES, UNLOCK_PHRASES, STICKERS, COLLECTIBLES, SNACKS } from '../data/dialogue.js';
import { playerRt, remoteRts, upsertRemoteRt } from './rt.js';
import { connectTransport } from '../net/transport.js';
import { sfx, setAmbientPaused, initAudio } from '../systems/audio.js';
import { startIntro } from './introClock.js';
import {
  migrateRoomProgress,
  unlockRoomItem as unlockRoomItemModel,
  equipRoomItem as equipRoomItemModel,
  removeRoomItem as removeRoomItemModel,
  advanceWelcomeHome as advanceWelcomeHomeModel,
  roomEntryDecision,
} from '../room/roomModel.js';

const now = () => performance.now() / 1000;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const DEFAULT_PROFILE = {
  name: 'Goober',
  shape: 'blob', color: 'green', eyes: 'plain', brows: 'happy', mouth: 'smile',
  accessory: 'party', hatColor: 'red', temperament: 'Hyped',
  stats: { energy: 7, curiosity: 6, friendliness: 8, shyness: 2, playfulness: 8 },
  favorites: { snack: 'pizza', activity: 'slide' },
};

// profiles saved before the asset-system rework use retired part ids
function migrateProfile(p) {
  if (!p) return p;
  const m = { ...p };
  m.temperament = {
    Cheerful: 'Hyped', Shy: 'Lowkey', Silly: 'Goofball', Brave: 'Daredevil',
    Calm: 'Chill', 'Grumpy-but-sweet': 'Grumpy', Energetic: 'Turbo', Imaginative: 'Weird',
  }[m.temperament] || m.temperament;
  if (m.eyes === 'sunglasses') {
    m.eyes = 'plain';
    if (!m.accessory || m.accessory === 'none') m.accessory = 'sunglasses';
  }
  m.brows = { determined: 'angry', grumpy: 'angry' }[m.brows] || m.brows;
  const hat = { partyhat: 'party', rainbowhat: 'party', crowngold: 'crown', crownwhite: 'crown' }[m.accessory];
  if (hat) {
    m.hatColor = m.accessory === 'crowngold' ? 'gold' : m.accessory === 'crownwhite' ? 'cream' : 'red';
    m.accessory = hat;
  }
  if (!m.hatColor) m.hatColor = 'red';
  return m;
}

const DEFAULT_PROGRESS = {
  coins: 205, xp: 40, level: 7,
  stickers: [], collectibles: {}, snacks: {},
  phrases: STARTER_PHRASES.map((p) => p.id),
  quests: [],
  flags: {}, // firstFlowerSticker, checkedInDay, etc.
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return { ...fallback, ...JSON.parse(raw) };
  } catch { /* fresh start */ }
  return null;
}

let toastSeq = 0;
let transport = null;
let stateTimer = null;

const bootScreen = load('lbw-profile', DEFAULT_PROFILE) ? 'cinematic' : 'creator';
// arm the intro clock before React ever renders — passive effects run too late
// (the frame pump can advance frames first and would instantly finish the intro)
if (bootScreen === 'cinematic') startIntro();

function applyRoomResult(set, get, result, toast) {
  if (!result.changed) return false;
  set({ progress: result.progress });
  get().persist();
  if (toast) get().addToast(toast.text, toast.icon, toast.gold);
  return true;
}

export const useGame = create((set, get) => ({
  // ---------- screens ----------
  screen: bootScreen,
  profile: migrateProfile(load('lbw-profile', DEFAULT_PROFILE)) || DEFAULT_PROFILE,
  progress: migrateRoomProgress(load('lbw-progress', DEFAULT_PROGRESS) || { ...DEFAULT_PROGRESS }),
  roomScene: { open: false, editingSlot: null },

  setProfile(profile) {
    localStorage.setItem('lbw-profile', JSON.stringify(profile));
    startIntro();
    set({ profile, screen: 'cinematic' });
  },
  finishIntro() { set({ screen: 'game' }); get().checkIn(); },
  resetBuddy() {
    localStorage.removeItem('lbw-profile');
    localStorage.removeItem('lbw-progress');
    location.reload();
  },

  // ---------- mood ----------
  mood: 'Happy',
  moodIcon: '😊',
  setMood(mood) {
    const icons = { Happy: '😊', Curious: '🤔', Calm: '😌', Excited: '🤩', Sleepy: '😴', Silly: '🤪', Bashful: '😊', Proud: '😎' };
    set({ mood, moodIcon: icons[mood] || '😊' });
  },

  // ---------- toasts & bubbles ----------
  toasts: [],
  addToast(text, icon = '⭐', gold = true) {
    const id = ++toastSeq;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, text, icon, gold }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3400);
  },

  // bubbles: id ('me' | npc id | remote id) -> {text, kind:'speech'|'sticker', until}
  bubbles: {},
  showBubble(id, text, secs = 3.2, kind = 'speech') {
    set((s) => ({ bubbles: { ...s.bubbles, [id]: { text, kind, until: now() + secs } } }));
    setTimeout(() => {
      set((s) => {
        const b = s.bubbles[id];
        if (b && b.until <= now() + 0.05) {
          const rest = { ...s.bubbles };
          delete rest[id];
          return { bubbles: rest };
        }
        return {};
      });
    }, secs * 1000 + 80);
  },

  // ---------- rewards / economy ----------
  award({ coins = 0, xp = 0, sticker = null, collectible = null, snack = null, quiet = false }) {
    set((s) => {
      const p = { ...s.progress };
      p.coins += coins;
      p.xp += xp;
      let leveled = false;
      while (p.xp >= p.level * 100) { p.xp -= p.level * 100; p.level += 1; leveled = true; }
      if (sticker && !p.stickers.includes(sticker)) p.stickers = [...p.stickers, sticker];
      if (collectible) p.collectibles = { ...p.collectibles, [collectible]: (p.collectibles[collectible] || 0) + 1 };
      if (snack) p.snacks = { ...p.snacks, [snack]: (p.snacks[snack] || 0) + 1 };
      if (leveled) {
        setTimeout(() => {
          get().addToast(`Level up! You're level ${p.level}!`, '🎉');
          sfx('tada');
          const unlocked = UNLOCK_PHRASES.filter((u) => u.level === p.level);
          unlocked.forEach((u) => {
            get().addToast(`New phrase unlocked: "${u.text}"`, '💬');
          });
          if (unlocked.length) {
            set((s2) => ({ progress: { ...s2.progress, phrases: [...s2.progress.phrases, ...unlocked.map((u) => u.id)] } }));
            get().persist();
          }
        }, 400);
      }
      return { progress: p };
    });
    if (coins > 0 && !quiet) sfx('coin');
    get().persist();
  },
  persist() {
    const s = get();
    localStorage.setItem('lbw-progress', JSON.stringify(s.progress));
  },

  // ---------- Room 107 ----------
  selectRoomSlot(slotId) {
    set((s) => ({ roomScene: { ...s.roomScene, editingSlot: slotId } }));
  },
  unlockRoomItem(itemId) {
    return applyRoomResult(set, get, unlockRoomItemModel(get().progress, itemId), {
      text: 'Room item unlocked!', icon: '🎁', gold: true,
    });
  },
  equipRoomItem(slotId, itemId) {
    let result = equipRoomItemModel(get().progress, slotId, itemId);
    if (result.changed && itemId === 'sunny-rug') {
      const journeyResult = advanceWelcomeHomeModel(result.progress, 'sunny-rug-placed');
      if (journeyResult.changed) result = journeyResult;
    }
    return applyRoomResult(set, get, result);
  },
  removeRoomItem(slotId) {
    return applyRoomResult(set, get, removeRoomItemModel(get().progress, slotId));
  },
  advanceWelcomeHome(event) {
    return applyRoomResult(set, get, advanceWelcomeHomeModel(get().progress, event));
  },
  enterRoom() {
    const decision = roomEntryDecision(get().progress);
    if (!decision.allowed) {
      get().addToast(decision.objective, '🏠', false);
      return false;
    }
    if (get().curtain) return false;
    initAudio();
    set({ homeOpen: false, curtain: 'closing' });
    sfx('whoosh');
    setTimeout(() => {
      setAmbientPaused(true);
      const result = advanceWelcomeHomeModel(get().progress, 'room-entered');
      applyRoomResult(set, get, result);
      set({ roomScene: { open: true, editingSlot: null }, curtain: 'opening' });
    }, 700);
    setTimeout(() => set({ curtain: null }), 1400);
    return true;
  },
  exitRoom() {
    if (get().curtain) return false;
    set({ curtain: 'closing' });
    sfx('whoosh');
    setTimeout(() => {
      setAmbientPaused(false);
      set({ roomScene: { open: false, editingSlot: null }, curtain: 'opening' });
    }, 700);
    setTimeout(() => set({ curtain: null }), 1400);
    return true;
  },

  // ---------- quests ----------
  offerQuest(q) {
    const s = get();
    if (s.progress.quests.find((x) => x.id === q.id)) return;
    set((st) => ({ progress: { ...st.progress, quests: [...st.progress.quests, { ...q, n: 0, done: false }] } }));
    get().addToast(`New mission: ${q.label}`, '🎯', false);
    get().persist();
  },
  questStep(id, amt = 1) {
    const s = get();
    const q = s.progress.quests.find((x) => x.id === id);
    if (!q || q.done) return;
    const n = q.n + amt;
    const done = n >= q.target;
    set((st) => ({
      progress: {
        ...st.progress,
        quests: st.progress.quests.map((x) => (x.id === id ? { ...x, n, done } : x)),
      },
    }));
    if (done) {
      setTimeout(() => {
        get().addToast(`Mission complete! +${q.reward.coins} coins`, '🏅');
        get().award({ coins: q.reward.coins, xp: 20 });
      }, 500);
    }
    get().persist();
  },

  // ---------- world object state ----------
  world: {
    bloom: { 'flowerbed-plaza': 0, 'flowerbed-garden': 0 },
    mailboxGift: true,
    plot: 'sprouts', // empty | sprouts | grown
    lampDecorated: false,
    benchDecorated: {},
    objAnim: {}, // id -> {kind, t0}  (shake/wiggle/flicker triggers for meshes)
    hiddenSparkles: {}, // id -> hiddenUntil
  },
  setWorld(patch) { set((s) => ({ world: { ...s.world, ...patch } })); },
  pokeObject(id, kind = 'shake') {
    set((s) => ({ world: { ...s.world, objAnim: { ...s.world.objAnim, [id]: { kind, t0: now() } } } }));
  },

  // ---------- interaction card ----------
  nearId: null, // interactable id currently in range
  setNear(id) { if (get().nearId !== id) set({ nearId: id }); },
  cooldowns: {},
  progressCard: null, // {label, t0, secs}
  snackMenuOpen: false,
  giftPopup: null, // {text, reward}
  postcard: null,

  // one-shot player animation requests (PlayerController consumes)
  playerAnimReq: null,
  requestAnim(anim, secs = 1.6) { set({ playerAnimReq: { anim, secs, t: now() } }); },
  rideRequest: null, // {n, id} — id picks which slide
  sitRequest: null,
  floatRequest: null,

  // ---------- the interaction resolution pipeline ----------
  doAction(objId, actId) {
    const s = get();
    const obj = byId[objId];
    const act = obj?.actions.find((a) => a.id === actId);
    if (!obj || !act) return;
    const key = `${objId}:${actId}`;
    const cdUntil = s.cooldowns[key] || 0;
    if (cdUntil > now()) return; // still cooling down
    set({ cooldowns: { ...s.cooldowns, [key]: now() + act.cooldown } });
    sfx('blip');

    const voice = VOICE[s.profile.temperament] || VOICE.Hyped;
    const say = (text, secs = 3) => { get().showBubble('me', text, secs); playerRt.speak = { text, until: now() + secs }; };
    const objLine = (type) => pick(voice.object[type] || voice.idle);
    const desk = DESK_LINES(s.profile.name);

    // default: play the buddy animation
    if (act.anim && !['ride', 'float', 'sit', 'water'].includes(act.anim)) {
      get().requestAnim(act.anim === 'talk' || act.anim === 'look' ? 'bounce' : act.anim, 1.4);
    }

    const broadcast = () => get().sendEvent({ kind: 'interact', obj: objId, act: actId });

    switch (`${obj.type}:${actId}`) {
      // ---- check-in desk ----
      case 'desk:talk': {
        get().showBubble('npc-desk', pick(desk.talk), 3.4);
        get().award({ xp: 2, quiet: true });
        break;
      }
      case 'desk:gift': {
        say('Got you something. 🎁');
        setTimeout(() => get().showBubble('npc-desk', 'Whoa, for me? Nice!', 3), 900);
        get().award({ xp: 10 });
        get().setMood('Proud');
        break;
      }
      case 'desk:wave': {
        say('Yo! 👋');
        setTimeout(() => get().showBubble('npc-desk', pick(['Yo yo!', `Sup, ${s.profile.name}!`]), 2.6), 700);
        break;
      }
      case 'desk:cheer': {
        say('LET’S GO! 🔥');
        setTimeout(() => get().showBubble('npc-desk', 'HYPE! I love the energy!', 2.6), 700);
        get().setMood('Excited');
        break;
      }
      case 'desk:bell': {
        sfx('ding');
        get().pokeObject('checkin-desk', 'bell');
        setTimeout(() => get().showBubble('npc-desk', pick(['You rang?', 'That bell is the best part of my job.']), 3), 500);
        get().questStep('bell');
        break;
      }

      // ---- flowers ----
      case 'flowers:view': { say(objLine('flowers')); break; }
      case 'flowers:smell': {
        say(pick(['Smells… green.', 'Not bad. Not bad at all.', 'Achoo. Worth it.']));
        get().setMood('Calm');
        break;
      }
      case 'flowers:water': {
        // progress card + watering can animation, resolve after fill
        playerRt.holding = 'wateringcan';
        get().requestAnim('water', obj.actions.find((a) => a.id === 'water').progress.secs);
        set({ progressCard: { label: 'Water Flowers', t0: now(), secs: 2.6 } });
        setTimeout(() => {
          set({ progressCard: null });
          playerRt.holding = null;
          const w = get().world;
          const bloom = Math.min((w.bloom[objId] || 0) + 1, 3);
          get().setWorld({ bloom: { ...w.bloom, [objId]: bloom } });
          get().pokeObject(objId, 'bloom');
          sfx('chime');
          if (!get().progress.flags.flowerSticker) {
            set((st) => ({ progress: { ...st.progress, flags: { ...st.progress.flags, flowerSticker: true } } }));
            get().award({ sticker: 'flower', xp: 12, coins: 5 });
            get().addToast('Cactus Sticker unlocked!', '🌵');
            sfx('tada');
          } else {
            get().award({ coins: 5, xp: 8 });
            get().addToast('+5 coins — hydration complete!', '💧');
          }
          say(objLine('flowers'));
          get().questStep('water4');
          broadcast();
        }, 2600);
        return; // broadcast happens after completion
      }
      case 'flowers:sparklepick': {
        const c = pick(COLLECTIBLES);
        get().award({ collectible: c.id, xp: 6 });
        get().addToast(`${c.name} collected!`, c.icon);
        say(pick(['Loot!', 'Score.']));
        break;
      }

      // ---- mailbox ----
      case 'mailbox:view': { say(objLine('mailbox')); break; }
      case 'mailbox:read': {
        set({
          postcard: pick([
            { from: 'The Blob Hotel', text: 'Pool’s open. Cannonballs encouraged. — The Staff' },
            { from: 'Anonymous', text: 'I buried something shiny along the path. Finders keepers. 💎' },
            { from: 'Room 104', text: 'The rooftop at sunset is undefeated. Bring snacks.' },
          ]),
        });
        break;
      }
      case 'mailbox:shake': {
        get().pokeObject('mailbox', 'wiggle');
        say(get().world.mailboxGift ? 'Something is DEFINITELY moving in there.' : 'Nothing. Suspiciously quiet.');
        break;
      }
      case 'mailbox:open': {
        if (get().world.mailboxGift) {
          const reward = pick([
            { text: 'a Star Sticker!', sticker: 'star', icon: '⭐' },
            { text: 'a Rubber Duck Sticker!', sticker: 'duck', icon: '🦆' },
            { text: '15 coins!', coins: 15, icon: '🪙' },
            { text: 'a Lightning Sticker!', sticker: 'rainbow', icon: '⚡' },
          ]);
          set({ giftPopup: { text: 'Mail loot!', reward } });
          get().setWorld({ mailboxGift: false });
          get().questStep('mailbox');
          setTimeout(() => get().setWorld({ mailboxGift: true }), 90000);
        } else {
          say('Empty. The dragon must be off duty.');
        }
        break;
      }

      // ---- lamp ----
      case 'lamp:view': { say(objLine('lamp')); break; }
      case 'lamp:shake': {
        get().pokeObject('lamp-plaza', 'flicker');
        say(pick(['It flickered. It’s alive.', 'Was that Morse code?']));
        break;
      }
      case 'lamp:decorate': {
        get().setWorld({ lampDecorated: true });
        get().setMood('Proud');
        get().addToast('You decked out the lamp post!', '🎨');
        say('Sick.');
        break;
      }

      // ---- bench ----
      case 'bench:sit': {
        set({ sitRequest: { id: objId, spot: obj.sitSpot, face: obj.sitFace, t: now() } });
        say(objLine('bench'), 2.2);
        get().setMood('Calm');
        break;
      }
      case 'bench:view': { say(objLine('bench')); break; }
      case 'bench:decorate': {
        get().setWorld({ benchDecorated: { ...get().world.benchDecorated, [objId]: true } });
        get().setMood('Proud');
        get().addToast('You decked out the bench!', '🎨');
        break;
      }

      // ---- garden plot ----
      case 'plot:view': { say(objLine('garden')); break; }
      case 'plot:plant': {
        if (get().world.plot === 'empty') {
          get().setWorld({ plot: 'sprouts' });
          get().addToast('Seeds planted!', '🌱');
          say('Grow. I believe in you.');
        } else say('It’s already growing!');
        break;
      }
      case 'plot:water': {
        playerRt.holding = 'wateringcan';
        get().requestAnim('water', 2.2);
        set({ progressCard: { label: 'Water Plot', t0: now(), secs: 2.2 } });
        setTimeout(() => {
          set({ progressCard: null });
          playerRt.holding = null;
          if (get().world.plot === 'sprouts') {
            get().setWorld({ plot: 'grown' });
            get().addToast('The veggies grew HUGE!', '🥕');
          } else get().addToast('Watered. Science is happening.', '💧');
          get().award({ xp: 6, coins: 2 });
          get().questStep('water4');
          broadcast();
        }, 2200);
        return;
      }
      case 'plot:harvest': {
        if (get().world.plot === 'grown') {
          get().setWorld({ plot: 'empty' });
          get().award({ coins: 8, xp: 10, collectible: 'leaf' });
          get().addToast('Harvested! +8 coins', '🥕');
          say('Farm to face.');
        } else say('Not ready yet. Keep watering.');
        break;
      }

      // ---- floats ----
      case 'float:getin':
      case 'float:sit':
      case 'float:play': {
        set({ floatRequest: { id: objId, t: now() } });
        say(objLine('pool'), 2.4);
        get().setMood(actId === 'play' ? 'Excited' : 'Happy');
        sfx('splash');
        break;
      }
      case 'float:shake': {
        get().pokeObject(objId, 'wiggle');
        sfx('splash');
        say('Tidal wave!');
        break;
      }

      // ---- slide ----
      case 'slide:ride': {
        set({ rideRequest: { n: (get().rideRequest?.n || 0) + 1, id: objId } });
        get().setMood('Excited');
        get().questStep('slide');
        break;
      }
      case 'slide:view': { say(objLine('slide')); break; }
      case 'slide:cheer': {
        say('SEND IT! 🔥');
        get().requestAnim('cheer', 1.6);
        break;
      }

      // ---- snack stand ----
      case 'snack:menu':
      case 'snack:buy': {
        set({ snackMenuOpen: true });
        break;
      }
      case 'snack:share': {
        get().showBubble('npc-snack', pick(SNACK_LINES.share), 3);
        get().award({ xp: 8 });
        say('Split it. I get the big half.');
        get().setMood('Happy');
        break;
      }
      case 'snack:snackthanks': {
        say('Thanks! 🤘');
        setTimeout(() => get().showBubble('npc-snack', pick(SNACK_LINES.thanks), 3), 800);
        break;
      }

      // ---- hidden sparkles ----
      case 'sparkle:pickup': {
        const r = pick([
          { sticker: 'sparkle', toast: 'Rare Drop Sticker!', icon: '✨' },
          { sticker: 'shell', toast: 'Shell Sticker!', icon: '🐚' },
          { collectible: 'pebble', toast: 'Pet Rock acquired!', icon: '🪨' },
          { collectible: 'starc', toast: 'Star Shard found!', icon: '⭐' },
        ]);
        get().award({ ...r, xp: 10, coins: 3 });
        get().addToast(r.toast, r.icon);
        sfx('tada');
        const hu = { ...get().world.hiddenSparkles, [objId]: now() + 120 };
        get().setWorld({ hiddenSparkles: hu });
        get().questStep('pebbles');
        break;
      }

      // ---- mushroom ----
      case 'mushroom:view': { say(pick(['It’s glowing. That’s normal, right?', 'Do NOT lick it.'])); break; }
      case 'mushroom:boop': {
        get().pokeObject('mushroom', 'pulse');
        sfx('pop');
        say(pick(['Poke.', 'It poked back.']));
        if (Math.random() < 0.25) {
          get().award({ sticker: 'sun', xp: 6 });
          get().addToast('Supernova Sticker!', '🌞');
        }
        break;
      }

      // ---- gaming corner ----
      case 'arcade:enter': {
        get().enterArcade();
        break;
      }
      case 'arcade:view': {
        say(pick([
          'The arcade! Only the Dance Studio is open right now.',
          'I can hear beats in there. Suspiciously funky beats.',
        ]));
        break;
      }

      default: {
        say(pick(voice.idle));
      }
    }
    broadcast();
  },

  // talking to Buddies (NPC or friend): Talk / Gift / Wave / Cheer
  doBuddyAction(id, actId) {
    const s = get();
    const key = `buddy:${id}:${actId}`;
    if ((s.cooldowns[key] || 0) > now()) return;
    set({ cooldowns: { ...s.cooldowns, [key]: now() + 4 } });
    sfx('blip');
    const npc = AMBIENT_NPCS.find((n) => n.id === id);
    const npcRt = typeof window !== 'undefined' ? window.__npcRts?.[id] : null;
    const npcReact = (anim) => {
      if (npcRt) { npcRt.anim = anim; npcRt.animT = 0; npcRt.oneShotUntil = now() + 1.8; }
    };
    const myVoice = VOICE[s.profile.temperament] || VOICE.Hyped;
    const theirVoice = npc ? VOICE[npc.temperament] || VOICE.Hyped : null;

    switch (actId) {
      case 'talk': {
        get().showBubble('me', pick(myVoice.greet), 2.8);
        if (npc) setTimeout(() => get().showBubble(id, pick(theirVoice.greet), 3), 1100);
        else get().sendEvent({ kind: 'phrase', id: 'hi' });
        get().award({ xp: 2, quiet: true });
        break;
      }
      case 'gift': {
        get().requestAnim('gift', 1.6);
        get().showBubble('me', 'For you! 🎁', 2.4);
        if (npc) {
          npcReact('hop');
          setTimeout(() => get().showBubble(id, pick(['Whoa, thanks!', 'For ME? Legend.', 'Epic. Thanks!']), 3), 1100);
        } else get().sendEvent({ kind: 'phrase', id: 'thanks' });
        get().award({ xp: 8 });
        get().setMood('Proud');
        break;
      }
      case 'wave': {
        get().requestAnim('wave', 1.6);
        if (npc) {
          npcReact('wave');
          if (Math.random() < 0.5) setTimeout(() => get().showBubble(id, 'Yo! 👋', 2.4), 800);
        } else get().sendEvent({ kind: 'emote', anim: 'wave' });
        break;
      }
      case 'cheer': {
        get().requestAnim('cheer', 1.6);
        if (npc) {
          npcReact('cheer');
          setTimeout(() => get().showBubble(id, pick(['LET’S GO!', 'HYPE!', 'W!']), 2.4), 700);
        } else get().sendEvent({ kind: 'emote', anim: 'cheer' });
        get().setMood('Excited');
        break;
      }
    }
    if (npc) get().award({ xp: 1, quiet: true });
  },

  buySnack(snackId) {
    const s = get();
    const snack = SNACKS.find((x) => x.id === snackId);
    if (!snack || s.progress.coins < snack.price) {
      get().addToast('Not enough coins. Go find some loot!', '🪙', false);
      return;
    }
    set({ snackMenuOpen: false });
    get().award({ coins: -snack.price, xp: 5, quiet: true });
    playerRt.holding = 'snack:' + snack.icon;
    get().requestAnim('eat', 2.4);
    setTimeout(() => { playerRt.holding = null; }, 2500);
    get().showBubble('npc-snack', pick(SNACK_LINES.buy[snackId]), 3);
    const fav = s.profile.favorites?.snack === snackId;
    setTimeout(() => {
      get().showBubble('me', fav ? 'My FAVORITE. Chef’s kiss.' : 'So good.', 2.4);
      get().setMood(fav ? 'Excited' : 'Happy');
    }, 1200);
    sfx('pop');
    get().sendEvent({ kind: 'interact', obj: 'snackstand', act: 'buy' });
  },

  claimGift() {
    const g = get().giftPopup;
    if (!g) return;
    set({ giftPopup: null });
    get().award({ ...g.reward, xp: 8 });
    get().addToast(`You got ${g.reward.text}`, g.reward.icon);
    sfx('tada');
  },

  // ---------- check-in (first visit each session) ----------
  checkedIn: false,
  checkIn() {
    if (get().checkedIn) return;
    set({ checkedIn: true });
    const s = get();
    const desk = DESK_LINES(s.profile.name);
    setTimeout(() => {
      get().showBubble('npc-desk', desk.welcome, 4);
      sfx('chime');
    }, 1500);
    setTimeout(() => {
      get().showBubble('npc-desk', desk.reward, 3.4);
      get().award({ coins: 10, xp: 5 });
      get().addToast('Daily bonus: +10 coins!', '🪙');
    }, 5400);
    setTimeout(() => {
      get().showBubble('npc-desk', pick(desk.suggest), 4);
      get().offerQuest(pick([
        { id: 'water4', label: 'Water 4 flowers', target: 4, reward: { coins: 20 } },
        { id: 'slide', label: 'Ride the rooftop slide', target: 1, reward: { coins: 15 } },
        { id: 'mailbox', label: 'Raid the mailbox', target: 1, reward: { coins: 10 } },
        { id: 'bell', label: 'Ring the desk bell', target: 1, reward: { coins: 10 } },
        { id: 'pebbles', label: 'Find 3 loot spots', target: 3, reward: { coins: 25 } },
      ]));
    }, 9400);
  },

  // ---------- phrases / emotes / stickers ----------
  usePhrase(id) {
    const all = [...STARTER_PHRASES, ...UNLOCK_PHRASES];
    const p = all.find((x) => x.id === id);
    if (!p) return;
    get().showBubble('me', p.text, 3);
    sfx('blip');
    get().sendEvent({ kind: 'phrase', id });
  },
  useEmote(anim) {
    if (anim === 'sit') { get().requestAnim('sitdown', 4); }
    else get().requestAnim(anim, anim === 'dance' ? 2.6 : 1.6);
    sfx('pop');
    get().sendEvent({ kind: 'emote', anim });
  },
  useSticker(stickerId) {
    const st = STICKERS.find((x) => x.id === stickerId);
    if (!st) return;
    get().showBubble('me', st.icon, 2.6, 'sticker');
    sfx('chime');
    get().sendEvent({ kind: 'sticker', id: stickerId });
  },

  // ---------- panels ----------
  backpackOpen: false, homeOpen: false, friendsOpen: false, parentOpen: false,
  setPanel(k, v) { set({ [k]: v }); },

  // ---------- gaming corner ----------
  arcade: { open: false, game: null }, // game: registry id while one is mounted
  curtain: null, // 'closing' | 'opening' | null
  enterArcade() {
    initAudio();
    if (get().curtain) return;
    set({ curtain: 'closing' });
    sfx('whoosh');
    setTimeout(() => {
      setAmbientPaused(true);
      playerRt.anim = 'dance'; // world presence keeps grooving at the door
      playerRt.animT = 0;
      set({ arcade: { open: true, game: null }, curtain: 'opening' });
    }, 650);
    setTimeout(() => set({ curtain: null }), 1400);
  },
  exitArcade() {
    if (get().curtain) return;
    set({ curtain: 'closing' });
    setTimeout(() => {
      setAmbientPaused(false);
      playerRt.anim = 'idle';
      playerRt.animT = 0;
      set({ arcade: { open: false, game: null }, curtain: 'opening' });
    }, 650);
    setTimeout(() => set({ curtain: null }), 1400);
  },
  launchGame(id) { set({ arcade: { open: true, game: id } }); sfx('blip'); },
  quitToArcade() { set({ arcade: { open: true, game: null } }); },
  finishDance({ grade, song }) {
    const firstClear = !get().progress.flags.discoSticker;
    const coins = { S: 25, A: 18, B: 12, C: 5 }[grade] || 5;
    get().award({ coins, xp: 15 });
    get().addToast(`${song}: grade ${grade}! +${coins} coins`, '🕺');
    if (firstClear) {
      set((st) => ({ progress: { ...st.progress, flags: { ...st.progress.flags, discoSticker: true } } }));
      get().award({ sticker: 'disco', xp: 10 });
      get().addToast('Disco Sticker unlocked!', '🪩');
      sfx('tada');
    }
    return { coins, firstClear };
  },

  // parent/safety controls
  safety: load('lbw-safety', { multiplayer: true, phraseBar: true }) || { multiplayer: true, phraseBar: true },
  setSafety(patch) {
    const safety = { ...get().safety, ...patch };
    localStorage.setItem('lbw-safety', JSON.stringify(safety));
    set({ safety });
  },

  // ---------- multiplayer ----------
  room: null, // {code, kind}
  remotes: {}, // id -> profile (positions live in remoteRts)
  netStatus: 'off',
  spawnBursts: [], // [{id, x, z, t0}] friend-join sparkle-in
  get buddiesOnlineBase() { return 12; },

  async hostRoom() {
    if (!get().safety.multiplayer) return;
    set({ netStatus: 'connecting' });
    transport = transport || (await connectTransport());
    get()._bindTransport();
    const res = await transport.createRoom(get().profile);
    if (res.ok) {
      await transport.joinRoom(res.code, get().profile);
      set({ room: { code: res.code, kind: transport.kind }, netStatus: 'on' });
      get()._startStateLoop();
    } else set({ netStatus: 'off' });
  },
  async joinRoom(code) {
    if (!get().safety.multiplayer) return { ok: false };
    set({ netStatus: 'connecting' });
    transport = transport || (await connectTransport());
    get()._bindTransport();
    const res = await transport.joinRoom(code, get().profile);
    if (res.ok) {
      const remotes = {};
      (res.players || []).forEach((p) => {
        remotes[p.id] = p.profile;
        if (p.state) upsertRemoteRt(p.id, p.state);
      });
      set({ room: { code: res.code, kind: transport.kind }, remotes, netStatus: 'on' });
      get()._startStateLoop();
    } else {
      set({ netStatus: 'off' });
      get().addToast('No room with that code.', '🔎', false);
    }
    return res;
  },
  leaveRoom() {
    if (transport) transport.leave();
    transport = null;
    clearInterval(stateTimer);
    remoteRts.clear();
    set({ room: null, remotes: {}, netStatus: 'off' });
  },
  _bound: false,
  _bindTransport() {
    if (get()._bound || !transport) return;
    set({ _bound: true });
    transport.on('playerJoined', ({ id, profile, state, quiet }) => {
      set((s) => ({ remotes: { ...s.remotes, [id]: profile } }));
      const rt = upsertRemoteRt(id, state || { x: 0, y: 0, z: -34, ry: 0, anim: 'idle' });
      if (!quiet) {
        set((s) => ({ spawnBursts: [...s.spawnBursts, { id, x: rt.tx, z: rt.tz, t0: now() }] }));
        get().addToast(`${profile?.name || 'A Buddy'} joined!`, '🎉');
        sfx('chime');
        setTimeout(() => set((s) => ({ spawnBursts: s.spawnBursts.filter((b) => b.id !== id) })), 3000);
      }
    });
    transport.on('playerState', ({ id, state }) => upsertRemoteRt(id, state));
    transport.on('playerEvent', (ev) => {
      const { from, kind } = ev;
      const rt = remoteRts.get(from);
      if (kind === 'phrase') {
        const all = [...STARTER_PHRASES, ...UNLOCK_PHRASES];
        const p = all.find((x) => x.id === ev.id);
        if (p) get().showBubble(from, p.text, 3);
      } else if (kind === 'emote') {
        if (rt) { rt.anim = ev.anim; rt.animT = 0; rt.animOneShot = now() + 1.8; }
      } else if (kind === 'sticker') {
        const st = STICKERS.find((x) => x.id === ev.id);
        if (st) get().showBubble(from, st.icon, 2.6, 'sticker');
      } else if (kind === 'interact') {
        get().pokeObject(ev.obj, 'shake');
      }
    });
    transport.on('playerLeft', ({ id }) => {
      remoteRts.delete(id);
      set((s) => {
        const remotes = { ...s.remotes };
        const name = remotes[id]?.name;
        delete remotes[id];
        if (name) get().addToast(`${name} left.`, '👋', false);
        return { remotes };
      });
    });
  },
  _startStateLoop() {
    clearInterval(stateTimer);
    stateTimer = setInterval(() => {
      if (!transport) return;
      transport.sendState({
        x: +playerRt.x.toFixed(2), y: +playerRt.y.toFixed(2), z: +playerRt.z.toFixed(2),
        ry: +playerRt.ry.toFixed(2), anim: playerRt.anim,
      });
    }, 100);
    transport.sendEvent({ kind: 'spawn' });
  },
  sendEvent(ev) { if (transport && get().room) transport.sendEvent(ev); },
}));
