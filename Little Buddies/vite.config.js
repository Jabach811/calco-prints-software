import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { Server } from 'socket.io';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { attachRooms } from './server/rooms.js';

// Dev-time multiplayer: attach the Socket.IO room server to Vite's own http
// server so one process serves both the app and the transport.
// Also: POST /__snap?name=x saves a base64 canvas capture to node_modules/.lb-snaps
// (dev tooling — the preview browser tab is often hidden and unscreenshotable).
function roomServer() {
  return {
    name: 'little-buddies-rooms',
    configureServer(server) {
      attachRooms(new Server(server.httpServer));
      server.middlewares.use('/__snap', (req, res) => {
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', () => {
          const dir = join(process.cwd(), 'node_modules', '.lb-snaps');
          mkdirSync(dir, { recursive: true });
          const name = (new URL(req.url, 'http://x').searchParams.get('name') || 'snap').replace(/[^\w-]/g, '');
          writeFileSync(join(dir, name + '.jpg'), Buffer.from(body, 'base64'));
          res.end('ok');
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), roomServer()],
  server: { port: 5173 },
});
