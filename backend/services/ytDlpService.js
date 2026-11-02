/**
 * backend/services/ytDlpService.js
 * Invokes yt-dlp binary with safe argument arrays, progress capture,
 * parallel fragment downloads (-N 5), and single-pass stream merging.
 */

import { spawn } from 'child_process';
import path from 'path';
import { getBinaryPaths } from '../utils/fileManager.js';
import { processManager } from '../utils/processManager.js';
import { FormatService } from './formatService.js';
import { metadataCache } from './metadataCache.js';

export class YtDlpService {
  /**
   * Fetches full structured JSON metadata for a media URL with caching.
   */
  static async fetchMetadata(url, timeoutMs = 45000) {
    // 1. Check cache first to avoid repeating multi-second network extraction
    const cached = metadataCache.get(url);
    if (cached) {
      console.log(`[YtDlpService] Using cached metadata for: ${url}`);
      return cached;
    }

    const { ytdlp } = getBinaryPaths();
    const taskId = processManager.generateTaskId();

    const args = [
      '--dump-single-json',
      '--no-warnings',
      '--no-playlist',
      '--no-check-certificates',
      '--js-runtimes', 'node',
      url,
    ];

    return new Promise((resolve, reject) => {
      let stdoutBuffer = '';
      let stderrBuffer = '';
      let timedOut = false;

      const proc = spawn(ytdlp, args, {
        windowsHide: true,
      });

      processManager.register(taskId, proc, 'metadata');

      const timer = setTimeout(() => {
        timedOut = true;
        processManager.cancelTask(taskId);
        reject(new Error(`Metadata request timed out after ${Math.round(timeoutMs / 1000)} seconds.`));
      }, timeoutMs);

      proc.stdout.on('data', chunk => {
        stdoutBuffer += chunk.toString('utf-8');
      });

      proc.stderr.on('data', chunk => {
        stderrBuffer += chunk.toString('utf-8');
      });

      proc.on('close', code => {
        clearTimeout(timer);
        if (timedOut) return;

        if (code === 0) {
          try {
            const raw = JSON.parse(stdoutBuffer);
            const parsed = FormatService.parseMetadata(raw);
            metadataCache.set(url, parsed);
            resolve(parsed);
          } catch (err) {
            reject(new Error(`Failed to parse metadata JSON: ${err.message}`));
          }
        } else {
          let errorMsg = 'Failed to retrieve media metadata.';
          if (/private video|sign in|restricted|login/i.test(stderrBuffer)) {
            errorMsg = 'This video is private, restricted, or requires authentication.';
          } else if (/unavailable|removed|not available|does not exist/i.test(stderrBuffer)) {
            errorMsg = 'The requested video is unavailable or has been removed.';
          } else if (/unsupported url/i.test(stderrBuffer)) {
            errorMsg = 'Unsupported URL. Please provide a supported media link.';
          } else if (stderrBuffer) {
            const lines = stderrBuffer.split('\n').filter(l => l.includes('ERROR:'));
            if (lines.length > 0) {
              errorMsg = lines[0].replace(/ERROR:\s*(\[[^\]]+\]\s*)?/i, '').trim();
            }
          }
          reject(new Error(errorMsg));
        }
      });

      proc.on('error', err => {
        clearTimeout(timer);
        if (!timedOut) {
          reject(new Error(`Failed to execute yt-dlp binary: ${err.message}`));
        }
      });
    });
  }

  /**
   * Fast high-throughput single-pass download and merge for Video + Audio.
   * Downloads both streams in parallel with -N 5 concurrent connections,
   * invokes bundled FFmpeg for stream copy merging, and reports progress.
   */
  static downloadAndMerge({ url, formatSpecification, outputPath, container = 'mp4', onProgress, taskId }) {
    const { ytdlp, baseDir } = getBinaryPaths();

    return new Promise((resolve, reject) => {
      const progressTemplate = 'download:{"status":"%(progress.status)s","downloaded_bytes":%(progress.downloaded_bytes)d,"total_bytes":%(progress.total_bytes)d,"total_bytes_estimate":%(progress.total_bytes_estimate)d,"speed":%(progress.speed)d,"eta":%(progress.eta)d}';

      const args = [
        '-f', formatSpecification,
        '-o', outputPath,
        '--ffmpeg-location', baseDir,
        '--merge-output-format', container,
        '-N', '5', // 5 parallel fragment download streams
        '--buffer-size', '1024k',
        '--newline',
        '--no-playlist',
        '--no-check-certificates',
        '--progress-template', progressTemplate,
        '--js-runtimes', 'node',
        url,
      ];

      const proc = spawn(ytdlp, args, { windowsHide: true });
      processManager.register(taskId, proc, 'download-and-merge');

      let stderrOutput = '';
      let remainder = '';

      proc.stdout.on('data', chunk => {
        const text = remainder + chunk.toString('utf-8');
        const lines = text.split(/\r?\n/);
        remainder = lines.pop();

        for (const line of lines) {
          if (line.startsWith('download:')) {
            try {
              const jsonStr = line.substring('download:'.length).trim();
              const p = JSON.parse(jsonStr);

              const downloadedBytes = p.downloaded_bytes || 0;
              const totalBytes = p.total_bytes || p.total_bytes_estimate || 0;
              let percentage = 0;

              if (totalBytes > 0) {
                percentage = Math.min(100, Math.max(0, Math.round((downloadedBytes / totalBytes) * 100)));
              }

              if (onProgress) {
                onProgress({
                  status: p.status,
                  downloadedBytes,
                  totalBytes,
                  percentage,
                  speed: p.speed || 0,
                  eta: p.eta || 0,
                });
              }
            } catch (e) {}
          }
        }
      });

      proc.stderr.on('data', chunk => {
        stderrOutput += chunk.toString('utf-8');
      });

      proc.on('close', code => {
        if (processManager.isCanceled(taskId)) {
          return reject(new Error('Download task was canceled by user.'));
        }

        if (code === 0) {
          resolve(outputPath);
        } else {
          let errDetail = 'Download and merge failed.';
          if (stderrOutput) {
            const errLine = stderrOutput.split('\n').find(l => l.includes('ERROR:'));
            if (errLine) {
              errDetail = errLine.replace(/ERROR:\s*(\[[^\]]+\]\s*)?/i, '').trim();
            }
          }
          reject(new Error(errDetail));
        }
      });

      proc.on('error', err => {
        reject(new Error(`Download process error: ${err.message}`));
      });
    });
  }

  /**
   * Downloads an individual format/stream with parallel chunk acceleration (-N 5).
   */
  static downloadStream({ url, formatId, outputPath, onProgress, taskId }) {
    const { ytdlp } = getBinaryPaths();

    return new Promise((resolve, reject) => {
      const progressTemplate = 'download:{"status":"%(progress.status)s","downloaded_bytes":%(progress.downloaded_bytes)d,"total_bytes":%(progress.total_bytes)d,"total_bytes_estimate":%(progress.total_bytes_estimate)d,"speed":%(progress.speed)d,"eta":%(progress.eta)d}';

      const args = [
        '--format', formatId,
        '-o', outputPath,
        '-N', '5', // 5 parallel fragment download streams
        '--buffer-size', '1024k',
        '--newline',
        '--no-playlist',
        '--no-part',
        '--no-check-certificates',
        '--progress-template', progressTemplate,
        '--js-runtimes', 'node',
        url,
      ];

      const proc = spawn(ytdlp, args, {
        windowsHide: true,
      });

      processManager.register(taskId, proc, 'download');

      let stderrOutput = '';
      let remainder = '';

      proc.stdout.on('data', chunk => {
        const text = remainder + chunk.toString('utf-8');
        const lines = text.split(/\r?\n/);
        remainder = lines.pop();

        for (const line of lines) {
          if (line.startsWith('download:')) {
            try {
              const jsonStr = line.substring('download:'.length).trim();
              const p = JSON.parse(jsonStr);

              const downloadedBytes = p.downloaded_bytes || 0;
              const totalBytes = p.total_bytes || p.total_bytes_estimate || 0;
              let percentage = 0;

              if (totalBytes > 0) {
                percentage = Math.min(100, Math.max(0, Math.round((downloadedBytes / totalBytes) * 100)));
              }

              if (onProgress) {
                onProgress({
                  status: p.status,
                  downloadedBytes,
                  totalBytes,
                  percentage,
                  speed: p.speed || 0,
                  eta: p.eta || 0,
                });
              }
            } catch (e) {}
          }
        }
      });

      proc.stderr.on('data', chunk => {
        stderrOutput += chunk.toString('utf-8');
      });

      proc.on('close', code => {
        if (processManager.isCanceled(taskId)) {
          return reject(new Error('Download task was canceled by user.'));
        }

        if (code === 0) {
          resolve(outputPath);
        } else {
          let errDetail = 'Stream download failed.';
          if (stderrOutput) {
            const errLine = stderrOutput.split('\n').find(l => l.includes('ERROR:'));
            if (errLine) {
              errDetail = errLine.replace(/ERROR:\s*(\[[^\]]+\]\s*)?/i, '').trim();
            }
          }
          reject(new Error(errDetail));
        }
      });

      proc.on('error', err => {
        reject(new Error(`Download process error: ${err.message}`));
      });
    });
  }
}
