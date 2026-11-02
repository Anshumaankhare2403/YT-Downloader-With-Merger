/**
 * scripts/dev.js
 * Launches Vite development server and Electron in parallel.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

console.log('[Dev] Starting Vite frontend server...');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';

const viteProc = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(ROOT_DIR, 'frontend'),
  stdio: 'inherit',
  shell: true,
});

// Wait 2 seconds for Vite, then launch Electron
setTimeout(() => {
  console.log('[Dev] Launching Electron...');
  const electronProc = spawn(npxCmd, ['electron', '.'], {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      VITE_DEV_SERVER_URL: 'http://localhost:5173',
    },
    shell: true,
  });

  electronProc.on('close', code => {
    console.log(`[Dev] Electron exited with code ${code}. Stopping Vite...`);
    viteProc.kill();
    process.exit(code);
  });
}, 2500);

process.on('SIGINT', () => {
  viteProc.kill();
  process.exit();
});

