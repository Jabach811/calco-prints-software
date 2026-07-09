// Standalone production server: serves dist/ and hosts the room server.
import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { Server } from 'socket.io';
import { attachRooms } from './rooms.js';

const dist = join(process.cwd(), 'dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };

const server = http.createServer((req, res) => {
  let path = join(dist, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!existsSync(path) || statSync(path).isDirectory()) path = join(dist, 'index.html');
  res.setHeader('Content-Type', types[extname(path)] || 'application/octet-stream');
  createReadStream(path).pipe(res);
});

attachRooms(new Server(server));
const port = process.env.PORT || 8787;
server.listen(port, () => console.log(`Little Buddies World on http://localhost:${port}`));
