/**
 * backend/utils/sizeFormatter.js
 * Formats byte counts and provides defensible size estimation
 * when exact metadata is absent.
 */

export function formatBytes(bytes, decimals = 2) {
  if (bytes === null || bytes === undefined || isNaN(bytes) || bytes < 0) {
    return 'Unknown size';
  }
  if (bytes === 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, idx)).toFixed(dm))} ${sizes[idx]}`;
}

export function formatSpeed(bytesPerSec) {
  if (!bytesPerSec || isNaN(bytesPerSec) || bytesPerSec <= 0) return '0 KB/s';
  return `${formatBytes(bytesPerSec)}/s`;
}

export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '0:00';
  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatEta(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0 || !isFinite(seconds)) return 'Calculating...';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  if (mins > 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

/**
 * Calculates actual or defensible estimated size.
 * Returns { bytes: number | null, formatted: string, isEstimate: boolean }
 */
export function calculateFormatSize(format, durationSeconds = null) {
  // 1. Exact filesize if present
  if (typeof format.filesize === 'number' && format.filesize > 0) {
    return {
      bytes: format.filesize,
      formatted: formatBytes(format.filesize),
      isEstimate: false,
    };
  }

  // 2. yt-dlp approximate filesize if present
  if (typeof format.filesize_approx === 'number' && format.filesize_approx > 0) {
    return {
      bytes: Math.round(format.filesize_approx),
      formatted: `~${formatBytes(format.filesize_approx)}`,
      isEstimate: true,
    };
  }

  // 3. Defensible calculation from bitrate (tbr or vbr + abr) and duration
  const bitrateKbps = format.tbr || ((format.vbr || 0) + (format.abr || 0));
  if (bitrateKbps > 0 && durationSeconds && durationSeconds > 0) {
    // bitrate in kilobits/sec -> bytes: (bitrate * 1000 / 8) * duration
    const estimatedBytes = Math.round((bitrateKbps * 1000 / 8) * durationSeconds);
    return {
      bytes: estimatedBytes,
      formatted: `~${formatBytes(estimatedBytes)}`,
      isEstimate: true,
    };
  }

  return {
    bytes: null,
    formatted: 'Unknown',
    isEstimate: false,
  };
}

