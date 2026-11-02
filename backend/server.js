/**
 * backend/server.js
 * Local HTTP & Socket.IO server initialization, dynamic port binding,
 * and lifecycle management.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app.js';
import { setSessionToken, getSessionToken } from './middleware/validation.js';
import { downloadService } from './services/downloadService.js';
import { processManager } from './utils/processManager.js';
import { getTempDirectory, safeUnlink } from './utils/fileManager.js';

const PORT = parseInt(process.env.PORT || '0', 10);
const HOST = '127.0.0.1'; // Strictly bind to local loopback

if (process.env.SESSION_TOKEN) {
  setSessionToken(process.env.SESSION_TOKEN);
}

const app = createApp();
const server = http.createServer(app);

// Socket.IO for real-time progress events
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Authenticate socket connections
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  const expectedToken = getSessionToken();

  if (expectedToken && token !== expectedToken) {
    return next(new Error('Unauthorized socket connection'));
  }
  next();
});

io.on('connection', socket => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // Send current tasks snapshot on connect
  socket.emit('download:snapshot', downloadService.getAllTasks());

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Relay downloadService progress events to all connected clients
downloadService.on('progress', progressData => {
  io.emit('download:progress', progressData);
});

const runtimeInfoPath = path.join(getTempDirectory(), 'backend-runtime.json');

// Start listening strictly on 127.0.0.1
server.listen(PORT, HOST, () => {
  const address = server.address();
  const actualPort = typeof address === 'string' ? address : address.port;
  const token = getSessionToken() || '';

  // Write runtime info for auto-discovery
  try {
    fs.writeFileSync(
      runtimeInfoPath,
      JSON.stringify({ port: actualPort, sessionToken: token, timestamp: Date.now() }, null, 2),
      'utf-8'
    );
  } catch (err) {
    console.warn('[Backend] Could not write runtime info file:', err.message);
  }

  console.log(`[Backend] Express server listening on http://${HOST}:${actualPort}`);
  // Structured stdout line for Electron process supervisor to parse
  console.log(`BACKEND_READY:PORT=${actualPort}:TOKEN=${token}`);
});

// Graceful shutdown logic
async function gracefulShutdown(signal) {
  console.log(`[Backend] Received ${signal}. Commencing clean shutdown...`);

  // Remove runtime discovery file
  safeUnlink(runtimeInfoPath);

  // Stop accepting new connections
  server.close(() => {
    console.log('[Backend] HTTP server closed.');
  });

  // Terminate any active media subprocesses
  processManager.shutdownAll();

  // Close socket connections
  io.close();

  setTimeout(() => {
    console.log('[Backend] Shutdown complete. Exiting.');
    process.exit(0);
  }, 500);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('message', msg => {
  if (msg === 'shutdown') {
    gracefulShutdown('IPC_SHUTDOWN');
  }
});
