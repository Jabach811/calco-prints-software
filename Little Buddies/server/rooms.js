// In-memory friends-only room server. Attached to either the Vite dev server
// (vite.config.js plugin) or the standalone production server (server/index.js).

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function makeCode() {
  let c = '';
  for (let i = 0; i < 6; i++) c += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return c;
}

export function attachRooms(io) {
  // rooms: code -> { players: Map<socketId, {profile, state}>, log: [] }
  const rooms = new Map();

  function roomSummary(room) {
    return [...room.players.entries()].map(([id, p]) => ({ id, profile: p.profile, state: p.state }));
  }

  io.on('connection', (socket) => {
    let joined = null; // room code

    socket.on('createRoom', (profile, cb) => {
      let code = makeCode();
      while (rooms.has(code)) code = makeCode();
      rooms.set(code, { players: new Map(), log: [] });
      cb && cb({ ok: true, code });
    });

    socket.on('joinRoom', ({ code, profile }, cb) => {
      code = String(code || '').toUpperCase().trim();
      const room = rooms.get(code);
      if (!room) return cb && cb({ ok: false, error: 'no-room' });
      if (room.players.size >= 8) return cb && cb({ ok: false, error: 'full' });
      joined = code;
      socket.join(code);
      room.players.set(socket.id, { profile, state: { x: 0, y: 0, z: -30, ry: 0, anim: 'idle' } });
      room.log.push({ t: Date.now(), ev: 'join', who: profile?.name });
      cb && cb({ ok: true, code, players: roomSummary(room).filter((p) => p.id !== socket.id) });
      socket.to(code).emit('playerJoined', { id: socket.id, profile });
    });

    socket.on('state', (state) => {
      const room = rooms.get(joined);
      if (!room) return;
      const p = room.players.get(socket.id);
      if (p) p.state = state;
      socket.to(joined).emit('playerState', { id: socket.id, state });
    });

    // phrases, emotes, interactions, spawn bursts — all pre-written event types only
    socket.on('event', (ev) => {
      const room = rooms.get(joined);
      if (!room) return;
      // safety: log server-side for review; only allow known event kinds
      const ALLOWED = ['phrase', 'emote', 'interact', 'spawn', 'sticker'];
      if (!ALLOWED.includes(ev?.kind)) return;
      room.log.push({ t: Date.now(), who: socket.id, ...ev });
      socket.to(joined).emit('playerEvent', { ...ev, from: socket.id });
    });

    socket.on('disconnect', () => {
      const room = rooms.get(joined);
      if (!room) return;
      room.players.delete(socket.id);
      socket.to(joined).emit('playerLeft', { id: socket.id });
      if (room.players.size === 0) rooms.delete(joined);
    });
  });
}
