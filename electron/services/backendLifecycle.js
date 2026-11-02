/**
 * electron/services/backendLifecycle.js
 * Manages the lifecycle of the local Node.js Express backend.
 * Handles automatic startup, readiness verification, and guaranteed clean shutdown.
 */

import { spawn } from 'child_process';
import path from 'path';
import crypto from 'crypto';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');

class BackendLifecycleManager {
  constructor() {
    this.backendProcess = null;
    this.port = null;
    this.sessionToken = crypto.randomBytes(32).toString('hex');
    this.isReady = false;
  }

  /**
   * Spawns the local Express backend on a dynamic loopback port.
   */
  async startBackend() {
    return new Promise((resolve, reject) => {
      const serverScript = path.join(ROOT_DIR, 'backend', 'server.js');
      const isPackaged = process.env.IS_PACKAGED === 'true' ||
        (process.mainModule && process.mainModule.filename && process.mainModule.filename.includes('app.asar'));

      console.log(`[Lifecycle] Starting backend process (Packaged: ${isPackaged})...`);

      const env = {
        ...process.env,
        PORT: '0', // Request dynamic port from OS
        SESSION_TOKEN: this.sessionToken,
        IS_PACKAGED: isPackaged ? 'true' : 'false',
        ELECTRON_RUN_AS_NODE: '1',
      };

      // In production or Electron runtime, use process.execPath with ELECTRON_RUN_AS_NODE
      const execBinary = process.execPath;

      this.backendProcess = spawn(execBinary, [serverScript], {
        env,
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
        windowsHide: true,
      });

      let stdoutBuffer = '';
      let stderrBuffer = '';
      let readyParsed = false;

      this.backendProcess.stdout.on('data', chunk => {
        const text = chunk.toString('utf-8');
        stdoutBuffer += text;
        console.log(`[Backend stdout] ${text.trim()}`);

        // Look for readiness marker: BACKEND_READY:PORT=<port>:TOKEN=<token>
        const match = text.match(/BACKEND_READY:PORT=(\d+):TOKEN=([a-f0-9]+)/);
        if (match && !readyParsed) {
          readyParsed = true;
          this.port = parseInt(match[1], 10);
          console.log(`[Lifecycle] Detected backend on port ${this.port}`);

          // Verify readiness via HTTP health check
          this.verifyHealth(this.port)
            .then(() => {
              this.isReady = true;
              console.log('[Lifecycle] Backend health verified successfully.');
              resolve({ port: this.port, sessionToken: this.sessionToken });
            })
            .catch(err => {
              reject(new Error(`Backend started but failed health check: ${err.message}`));
            });
        }
      });

      this.backendProcess.stderr.on('data', chunk => {
        const text = chunk.toString('utf-8');
        stderrBuffer += text;
        console.error(`[Backend stderr] ${text.trim()}`);
      });

      this.backendProcess.on('error', err => {
        console.error('[Lifecycle] Backend process failed to start:', err);
        reject(err);
      });

      this.backendProcess.on('close', code => {
        console.log(`[Lifecycle] Backend process exited with code ${code}`);
        this.backendProcess = null;
        this.isReady = false;
        if (!readyParsed) {
          reject(new Error(`Backend terminated prematurely (code ${code}): ${stderrBuffer || stdoutBuffer}`));
        }
      });

      // Startup timeout safeguard
      setTimeout(() => {
        if (!this.isReady) {
          reject(new Error('Backend startup timed out after 20 seconds.'));
        }
      }, 20000);
    });
  }

  /**
   * Performs an HTTP GET request to /api/health to confirm the server is responsive.
   */
  async verifyHealth(port, retries = 10, intervalMs = 300) {
    for (let i = 0; i < retries; i++) {
      try {
        await new Promise((resolve, reject) => {
          const req = http.get(`http://127.0.0.1:${port}/api/health`, res => {
            if (res.statusCode === 200) {
              resolve();
            } else {
              reject(new Error(`Status ${res.statusCode}`));
            }
          });
          req.on('error', reject);
          req.setTimeout(1500, () => {
            req.destroy();
            reject(new Error('Timeout'));
          });
        });
        return true;
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise(r => setTimeout(r, intervalMs));
      }
    }
  }

  /**
   * Cleanly shuts down the backend and terminates all child processes.
   */
  async stopBackend() {
    if (!this.backendProcess) return;

    console.log('[Lifecycle] Stopping backend process...');
    try {
      if (this.backendProcess.connected) {
        this.backendProcess.send('shutdown');
      }

      // Give 1 second for graceful termination
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (this.backendProcess && !this.backendProcess.killed) {
        this.backendProcess.kill('SIGTERM');
      }
    } catch (err) {
      console.warn('[Lifecycle] Warning while stopping backend:', err.message);
    } finally {
      this.backendProcess = null;
      this.isReady = false;
    }
  }

  getBackendInfo() {
    return {
      port: this.port,
      sessionToken: this.sessionToken,
    };
  }
}

export const backendLifecycle = new BackendLifecycleManager();

