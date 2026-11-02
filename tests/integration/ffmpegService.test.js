import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import { spawnSync } from 'child_process';
import { FFmpegService } from '../../backend/services/ffmpegService.js';
import { getBinaryPaths, getTempDirectory, safeUnlink } from '../../backend/utils/fileManager.js';

describe('FFmpeg & FFprobe Integration Tests', () => {
  const tempDir = getTempDirectory();
  const testVideoPath = path.join(tempDir, 'integration_test_synthetic.mp4');

  it('generates a synthetic test media and verifies streams via ffprobe', async () => {
    const { ffmpeg } = getBinaryPaths();

    // Generate 1-second test video with video and audio streams using bundled ffmpeg
    const gen = spawnSync(ffmpeg, [
      '-y',
      '-f', 'lavfi', '-i', 'testsrc=duration=1:size=320x240:rate=1',
      '-f', 'lavfi', '-i', 'sine=duration=1:frequency=440',
      '-c:v', 'libx264',
      '-c:a', 'aac',
      testVideoPath,
    ], {
      windowsHide: true,
      timeout: 15000,
    });

    expect(gen.status).toBe(0);
    expect(fs.existsSync(testVideoPath)).toBe(true);

    // Verify streams via FFmpegService
    const verification = await FFmpegService.verifyMediaStreams(testVideoPath);

    expect(verification.valid).toBe(true);
    expect(verification.hasVideo).toBe(true);
    expect(verification.hasAudio).toBe(true);
    expect(verification.width).toBe(320);
    expect(verification.height).toBe(240);
    expect(verification.videoCodec).toBe('h264');
    expect(verification.audioCodec).toBe('aac');

    // Clean up
    safeUnlink(testVideoPath);
  });
});

