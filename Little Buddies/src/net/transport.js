// Transport abstraction. Primary: Socket.IO (room server attached to the dev/prod
// http server). Fallback: BroadcastChannel — lets two tabs on one machine play
// together with no server at all. Both expose the same tiny API.

import { io } from 'socket.io-client';

function makeLocalTransport() {
  let channel = null;
  const listeners = {};
  const emitL = (ev, data) => (listeners[ev] || []).forEach((cb) => cb(data));
  const myId = 'local-' + Math.random().toString(36).slice(2, 9);
  let myProfile = null;
  let myState = { x: 0, y: 0, z: -30, ry: 0, anim: 'idle' };
  const peers = new Set();

  function post(msg) { channel && channel.postMessage({ ...msg, from: myId }); }

  function bind(code) {
    channel = new BroadcastChannel('lbw-room-' + code);
    channel.onmessage = ({ data: m }) => {
      if (m.from === myId) return;
      if (m.type === 'hello') {
        if (!peers.has(m.from)) {
          peers.add(m.from);
          emitL('playerJoined', { id: m.from, profile: m.profile });
        }
        post({ type: 'hello-ack', profile: myProfile, state: myState });
      } else if (m.type === 'hello-ack') {
        if (!peers.has(m.from)) {
          peers.add(m.from);
          emitL('playerJoined', { id: m.from, profile: m.profile, state: m.state, quiet: true });
        }
      } else if (m.type === 'state') {
        emitL('playerState', { id: m.from, state: m.state });
      } else if (m.type === 'event') {
        emitL('playerEvent', { ...m.ev, from: m.from });
      } else if (m.type === 'bye') {
        peers.delete(m.from);
        emitL('playerLeft', { id: m.from });
      }
    };
    window.addEventListener('beforeunload', () => post({ type: 'bye' }));
  }

  return {
    kind: 'local',
    on(ev, cb) { (listeners[ev] = listeners[ev] || []).push(cb); },
    async createRoom(profile) {
      const code = Array.from({ length: 6 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 31)]).join('');
      myProfile = profile;
      bind(code);
      post({ type: 'hello', profile });
      return { ok: true, code };
    },
    async joinRoom(code, profile) {
      myProfile = profile;
      bind(code);
      post({ type: 'hello', profile });
      return { ok: true, code, players: [] };
    },
    sendState(state) { myState = state; post({ type: 'state', state }); },
    sendEvent(ev) { post({ type: 'event', ev }); },
    leave() { post({ type: 'bye' }); channel && channel.close(); channel = null; peers.clear(); },
  };
}

function makeSocketTransport(socket) {
  const listeners = {};
  const emitL = (ev, data) => (listeners[ev] || []).forEach((cb) => cb(data));
  socket.on('playerJoined', (d) => emitL('playerJoined', d));
  socket.on('playerState', (d) => emitL('playerState', d));
  socket.on('playerEvent', (d) => emitL('playerEvent', d));
  socket.on('playerLeft', (d) => emitL('playerLeft', d));
  return {
    kind: 'socket',
    on(ev, cb) { (listeners[ev] = listeners[ev] || []).push(cb); },
    createRoom(profile) {
      return new Promise((res) => socket.emit('createRoom', profile, res));
    },
    joinRoom(code, profile) {
      return new Promise((res) => socket.emit('joinRoom', { code, profile }, res));
    },
    sendState(state) { socket.emit('state', state); },
    sendEvent(ev) { socket.emit('event', ev); },
    leave() { socket.disconnect(); },
  };
}

export function connectTransport() {
  return new Promise((resolve) => {
    let settled = false;
    const socket = io({ timeout: 2000, reconnectionAttempts: 2 });
    const fallback = setTimeout(() => {
      if (settled) return;
      settled = true;
      socket.close();
      resolve(makeLocalTransport());
    }, 2500);
    socket.on('connect', () => {
      if (settled) { socket.close(); return; }
      settled = true;
      clearTimeout(fallback);
      resolve(makeSocketTransport(socket));
    });
  });
}
