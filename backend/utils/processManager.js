/**
 * backend/utils/processManager.js
 * Tracks and controls all spawned child processes (yt-dlp, FFmpeg).
 * Guarantees zero orphaned processes during cancellation or application shutdown.
 */

import { spawnSync } from 'child_process';

class ProcessManager {
  constructor() {
    this.activeProcesses = new Map(); // taskId -> { process, type, startTime, canceled: boolean }
    this.isShuttingDown = false;
  }

  /**
   * Generates a unique task ID.
   */
  generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Registers a child process with an assigned task ID.
   */
  register(taskId, childProcess, type = 'generic') {
    if (this.isShuttingDown) {
      this.killProcessTree(childProcess.pid);
      throw new Error('Application is shutting down. Rejecting new task execution.');
    }

    const taskEntry = {
      process: childProcess,
      type,
      pid: childProcess.pid,
      startTime: Date.now(),
      canceled: false,
    };

    this.activeProcesses.set(taskId, taskEntry);

    const cleanup = () => {
      this.activeProcesses.delete(taskId);
    };

    childProcess.once('exit', cleanup);
    childProcess.once('error', cleanup);

    return taskEntry;
  }

  /**
   * Checks if a task is active.
   */
  isActive(taskId) {
    return this.activeProcesses.has(taskId);
  }

  /**
   * Checks if a task has been canceled.
   */
  isCanceled(taskId) {
    const entry = this.activeProcesses.get(taskId);
    return entry ? entry.canceled : false;
  }

  /**
   * Forcefully kills a process and any of its children using Windows taskkill.
   */
  killProcessTree(pid) {
    if (!pid) return;
    try {
      if (process.platform === 'win32') {
        spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], {
          windowsHide: true,
          stdio: 'ignore',
        });
      } else {
        process.kill(-pid, 'SIGKILL');
      }
    } catch (err) {
      try {
        process.kill(pid, 'SIGKILL');
      } catch (e) {
        // already dead
      }
    }
  }

  /**
   * Cancels an active task by its ID.
   */
  cancelTask(taskId) {
    const entry = this.activeProcesses.get(taskId);
    if (!entry) {
      return false;
    }

    entry.canceled = true;
    console.log(`[ProcessManager] Canceling task ${taskId} (PID: ${entry.pid}, Type: ${entry.type})`);

    this.killProcessTree(entry.pid);
    this.activeProcesses.delete(taskId);
    return true;
  }

  /**
   * Forcefully terminates all active processes.
   * Called during application closing/shutdown.
   */
  shutdownAll() {
    this.isShuttingDown = true;
    console.log(`[ProcessManager] Shutting down. Active processes to terminate: ${this.activeProcesses.size}`);

    for (const [taskId, entry] of this.activeProcesses.entries()) {
      try {
        console.log(`[ProcessManager] Terminating PID ${entry.pid} (${entry.type}) for task ${taskId}`);
        this.killProcessTree(entry.pid);
      } catch (err) {
        console.warn(`[ProcessManager] Error terminating PID ${entry.pid}:`, err.message);
      }
    }

    this.activeProcesses.clear();
  }

  /**
   * Returns current active task count.
   */
  getActiveCount() {
    return this.activeProcesses.size;
  }
}

export const processManager = new ProcessManager();

