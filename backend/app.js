/**
 * backend/app.js
 * Express application configuration and route registration.
 */

import express from 'express';
import cors from 'cors';
import metadataRoutes from './routes/metadataRoutes.js';
import downloadRoutes from './routes/downloadRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Permissive local CORS allowing Electron file:// (origin: 'null'), localhost, and 127.0.0.1
  app.use(cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        origin === 'null' ||
        origin.startsWith('http://127.0.0.1') ||
        origin.startsWith('http://localhost') ||
        origin.startsWith('file://')
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-session-token', 'Authorization'],
  }));

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // Unauthenticated health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'YT-Downloader-Backend',
      pid: process.pid,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // Main application routes
  app.use('/api/metadata', metadataRoutes);
  app.use('/api/downloads', downloadRoutes);
  app.use('/api/settings', settingsRoutes);

  // Centralized error handler
  app.use(errorHandler);

  return app;
}
