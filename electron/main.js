/**
 * electron/main.js
 * Main process entry point for YT Downloader desktop application.
 */

import { app, BrowserWindow, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { backendLifecycle } from './services/backendLifecycle.js';
import { registerAppHandlers } from './ipc/appHandlers.js';
import { registerDownloadHandlers } from './ipc/downloadHandlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

let mainWindow = null;

// Enforce single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log('[Electron] Another instance is already running. Exiting.');
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

async function createWindow() {
  const iconPath = path.join(ROOT_DIR, 'resources', 'icons', 'icon.png');

  mainWindow = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 940,
    minHeight: 620,
    title: 'YT Downloader',
    icon: iconPath,
    backgroundColor: '#090d16',
    show: false, // Wait until ready-to-show to prevent white flash
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false,
      spellcheck: false,
    },
  });

  // Remove default menu for a clean modern desktop feel
  mainWindow.setMenuBarVisibility(false);

  // Restrict navigation to local app only; open external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const isLocal = url.startsWith('http://localhost') ||
      url.startsWith('http://127.0.0.1') ||
      url.startsWith('file://');
    if (!isLocal) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Load frontend interface
  const isDev = process.env.NODE_ENV === 'development';
  const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

  if (isDev) {
    try {
      console.log(`[Electron] Connecting to frontend dev server at ${devServerUrl}`);
      await mainWindow.loadURL(devServerUrl);
    } catch (e) {
      console.warn('[Electron] Could not load dev server URL, falling back to dist/index.html');
      await mainWindow.loadFile(path.join(ROOT_DIR, 'frontend', 'dist', 'index.html'));
    }
  } else {
    const indexPath = path.join(ROOT_DIR, 'frontend', 'dist', 'index.html');
    await mainWindow.loadFile(indexPath);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('[Electron] Main window displayed.');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(async () => {
  try {
    // 1. Start backend process and confirm health
    console.log('[Electron] Initializing backend lifecycle...');
    await backendLifecycle.startBackend();

    // 2. Register IPC handlers
    registerAppHandlers(backendLifecycle);
    registerDownloadHandlers();

    // 3. Create GUI window
    await createWindow();
  } catch (err) {
    console.error('[Electron] Fatal startup error:', err);
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Clean shutdown sequence
let isShuttingDown = false;
async function cleanShutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('[Electron] Commencing clean application shutdown...');
  await backendLifecycle.stopBackend();
  app.exit(0);
}

app.on('before-quit', async (e) => {
  if (!isShuttingDown) {
    e.preventDefault();
    await cleanShutdown();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

