import { describe, it, expect } from 'vitest';
import {
  formatBytes,
  formatSpeed,
  formatDuration,
  formatEta,
  calculateFormatSize,
} from '../../backend/utils/sizeFormatter.js';

describe('sizeFormatter Unit Tests', () => {
  it('formats byte numbers into human readable units', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(1073741824)).toBe('1 GB');
    expect(formatBytes(52428800)).toBe('50 MB');
    expect(formatBytes(null)).toBe('Unknown size');
    expect(formatBytes(-10)).toBe('Unknown size');
  });

  it('formats network speed values', () => {
    expect(formatSpeed(1048576)).toBe('1 MB/s');
    expect(formatSpeed(524288)).toBe('512 KB/s');
    expect(formatSpeed(0)).toBe('0 KB/s');
  });

  it('formats duration in seconds to standard clock format', () => {
    expect(formatDuration(45)).toBe('0:45');
    expect(formatDuration(185)).toBe('3:05');
    expect(formatDuration(3665)).toBe('1:01:05');
    expect(formatDuration(null)).toBe('0:00');
  });

  it('formats remaining ETA correctly', () => {
    expect(formatEta(15)).toBe('15s');
    expect(formatEta(90)).toBe('1m 30s');
    expect(formatEta(3720)).toBe('1h 2m');
    expect(formatEta(null)).toBe('Calculating...');
    expect(formatEta(Infinity)).toBe('Calculating...');
  });

  it('calculates format size: exact, approx, and bitrate estimation', () => {
    // Exact filesize
    const exact = calculateFormatSize({ filesize: 10485760 });
    expect(exact.bytes).toBe(10485760);
    expect(exact.isEstimate).toBe(false);
    expect(exact.formatted).toBe('10 MB');

    // Approx filesize
    const approx = calculateFormatSize({ filesize_approx: 20971520 });
    expect(approx.bytes).toBe(20971520);
    expect(approx.isEstimate).toBe(true);
    expect(approx.formatted).toBe('~20 MB');

    // Calculated from bitrate + duration (tbr 1000 kbps for 60 seconds)
    // 1000 * 1000 / 8 * 60 = 7,500,000 bytes
    const estimated = calculateFormatSize({ tbr: 1000 }, 60);
    expect(estimated.bytes).toBe(7500000);
    expect(estimated.isEstimate).toBe(true);
    expect(estimated.formatted).toBe('~7.15 MB');

    // Unknown size
    const unknown = calculateFormatSize({});
    expect(unknown.bytes).toBe(null);
    expect(unknown.isEstimate).toBe(false);
    expect(unknown.formatted).toBe('Unknown');
  });
});

