import { describe, it, expect } from 'vitest';
import path from 'path';
import {
  sanitizeFilename,
  getBinaryPaths,
  getTempDirectory,
  getDefaultDownloadDirectory,
  validateDirectory,
} from '../../backend/utils/fileManager.js';

describe('FileManager Unit Tests', () => {
  it('sanitizes Windows filenames by stripping illegal characters', () => {
    expect(sanitizeFilename('Video: The "Ultimate" Guide <2026>? *WOW*|#1')).toBe(
      'Video_ The _Ultimate_ Guide _2026_ _WOW_#1'
    );
    expect(sanitizeFilename('trailing spaces and dots...   ')).toBe('trailing spaces and dots');
    expect(sanitizeFilename('')).toBe('download');
    expect(sanitizeFilename(null)).toBe('download');
  });

  it('resolves binary paths correctly', () => {
    const paths = getBinaryPaths();
    expect(paths.ytdlp).toContain('yt-dlp.exe');
    expect(paths.ffmpeg).toContain('ffmpeg.exe');
    expect(paths.ffprobe).toContain('ffprobe.exe');
  });

  it('provides a valid temporary directory', () => {
    const temp = getTempDirectory();
    expect(temp).toBeTruthy();
    expect(temp).toContain('yt-downloader-temp');
  });

  it('validates directory existence and rejects invalid paths', () => {
    const valid = getDefaultDownloadDirectory();
    expect(validateDirectory(valid)).toBe(path.resolve(valid));

    expect(() => validateDirectory('Z:\\DefinitelyNonExistentDir12345')).toThrow();
    expect(() => validateDirectory('')).toThrow();
  });
});

