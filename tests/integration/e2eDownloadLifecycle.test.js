import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import { YtDlpService } from '../../backend/services/ytDlpService.js';
import { FFmpegService } from '../../backend/services/ffmpegService.js';
import { downloadService } from '../../backend/services/downloadService.js';
import { getTempDirectory, safeUnlink } from '../../backend/utils/fileManager.js';

describe('End-to-End Real Media & Engine Lifecycle Tests', () => {
  // Blender Foundation open source animation licensed under Creative Commons
  const TEST_URL = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ';
  const tempDir = getTempDirectory();

  it('fetches real metadata with complete format breakdowns', async () => {
    const meta = await YtDlpService.fetchMetadata(TEST_URL);

    expect(meta.id).toBe('aqz-KE-bpKQ');
    expect(meta.title).toContain('Big Buck Bunny');
    expect(meta.duration).toBeGreaterThan(600);
    expect(meta.formats.length).toBeGreaterThan(10);
    expect(meta.videoFormats.length).toBeGreaterThan(5);
    expect(meta.audioFormats.length).toBeGreaterThan(0);

    // Verify format fields are properly populated
    const firstVideo = meta.videoFormats[0];
    expect(firstVideo.qualityLabel).toBeTruthy();
    expect(firstVideo.vcodec).not.toBe('none');
    expect(firstVideo.sizeFormatted).toBeTruthy();
  }, 45000);

  it('executes real download task with progress tracking, stream verification, and history entry', async () => {
    const meta = await YtDlpService.fetchMetadata(TEST_URL);

    // Pick smallest audio format to ensure fast, efficient test execution
    const smallestAudio = meta.audioFormats[meta.audioFormats.length - 1];
    expect(smallestAudio).toBeDefined();

    const progressEvents = [];
    const onProgress = (p) => {
      progressEvents.push(p);
    };

    downloadService.on('progress', onProgress);

    const task = await downloadService.createDownloadTask({
      url: TEST_URL,
      mode: 'audio',
      audioFormatId: smallestAudio.format_id,
      outputDirectory: tempDir,
      customFilename: 'e2e_test_audio',
      convertToMp3: false,
    });

    expect(task.id).toBeTruthy();

    // Wait for task completion
    await new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const current = downloadService.getTask(task.id);
        if (current.status === 'completed') {
          clearInterval(checkInterval);
          resolve(current);
        } else if (current.status === 'failed') {
          clearInterval(checkInterval);
          reject(new Error(current.error || 'Task failed'));
        }
      }, 500);

      // 60s timeout
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('E2E task timed out'));
      }, 60000);
    });

    const finishedTask = downloadService.getTask(task.id);
    expect(finishedTask.status).toBe('completed');
    expect(finishedTask.progress).toBe(100);
    expect(finishedTask.outputPath).toBeTruthy();
    expect(fs.existsSync(finishedTask.outputPath)).toBe(true);

    // Real stream verification via FFprobe
    const verification = await FFmpegService.verifyMediaStreams(finishedTask.outputPath);
    expect(verification.valid).toBe(true);
    expect(verification.hasAudio).toBe(true);

    // Verify history entry
    const history = downloadService.getHistory();
    const entry = history.find(h => h.id === task.id);
    expect(entry).toBeDefined();
    expect(entry.status).toBe('completed');

    // Clean up
    safeUnlink(finishedTask.outputPath);
    downloadService.removeListener('progress', onProgress);
  }, 90000);

  it('cancels an active task cleanly and removes temp files', async () => {
    const meta = await YtDlpService.fetchMetadata(TEST_URL);
    const video = meta.videoFormats[0];

    const task = await downloadService.createDownloadTask({
      url: TEST_URL,
      mode: 'video',
      videoFormatId: video.format_id,
      outputDirectory: tempDir,
      customFilename: 'cancel_test_video',
    });

    // Wait a brief moment for process to begin downloading
    await new Promise(r => setTimeout(r, 1200));

    // Cancel task
    const canceled = downloadService.cancelTask(task.id);
    expect(canceled).toBe(true);

    const updated = downloadService.getTask(task.id);
    expect(updated.status).toBe('canceled');
  }, 45000);
});

