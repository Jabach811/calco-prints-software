// Mutable per-frame runtime state, kept outside React to avoid re-renders.
// Three.js components read/write these in useFrame; UI samples them occasionally.

export const playerRt = {
  x: 0, y: 0, z: -34, ry: 0,
  vx: 0, vz: 0,
  anim: 'idle',        // idle | walk | wave | hop | spin | sit | swim | float | ride | ...
  animT: 0,            // seconds since anim started
  animUntil: 0,        // performance.now()/1000 when a one-shot anim ends (0 = looping)
  moving: false,
  swimming: false,
  onFloat: null,       // float object id when riding a float
  riding: false,       // on the big slide
  sitting: null,       // bench id
  speak: null,         // {text, until}
  holding: null,       // 'wateringcan' | 'snack:🍿' | null
};

// camera orbit state
export const camRt = { yaw: 0, pitch: 0.42, dist: 11, shake: 0 };

// remote players: id -> mutable state mirror
export const remoteRts = new Map();

export function upsertRemoteRt(id, s) {
  let r = remoteRts.get(id);
  if (!r) {
    r = { x: s.x, y: s.y || 0, z: s.z, ry: s.ry, tx: s.x, ty: s.y || 0, tz: s.z, try: s.ry, anim: s.anim || 'idle', animT: 0, speak: null, sticker: null };
    remoteRts.set(id, r);
  } else {
    r.tx = s.x; r.ty = s.y || 0; r.tz = s.z; r.try = s.ry;
    if (s.anim) r.anim = s.anim;
  }
  return r;
}
