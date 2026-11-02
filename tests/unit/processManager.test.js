import { describe, it, expect } from 'vitest';
import { EventEmitter } from 'events';
import { processManager } from '../../backend/utils/processManager.js';

describe('ProcessManager Unit Tests', () => {
  it('generates unique task IDs', () => {
    const id1 = processManager.generateTaskId();
    const id2 = processManager.generateTaskId();
    expect(id1).not.toBe(id2);
    expect(id1.startsWith('task_')).toBe(true);
  });

  it('registers and tracks child processes cleanly', () => {
    const mockProc = new EventEmitter();
    mockProc.pid = 99999;

    const taskId = processManager.generateTaskId();
    processManager.register(taskId, mockProc, 'test-proc');

    expect(processManager.isActive(taskId)).toBe(true);
    expect(processManager.isCanceled(taskId)).toBe(false);

    // When child process exits, it is automatically unmapped
    mockProc.emit('exit', 0);
    expect(processManager.isActive(taskId)).toBe(false);
  });

  it('marks tasks as canceled upon cancellation request', () => {
    const mockProc = new EventEmitter();
    mockProc.pid = 99998;

    const taskId = processManager.generateTaskId();
    processManager.register(taskId, mockProc, 'test-cancel');

    const canceled = processManager.cancelTask(taskId);
    expect(canceled).toBe(true);
    expect(processManager.isActive(taskId)).toBe(false);
  });
});

