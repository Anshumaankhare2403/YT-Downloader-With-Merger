/**
 * backend/services/ffmpegService.js
 * Merges video and audio streams, converts audio, and verifies output
 * using bundled FFmpeg and FFprobe binaries.
 */

import { spawn } from 'child_process';
import { getBinaryPaths } from '../utils/fileManager.js';
import { processManager } from '../utils/processManager.js';

export class FFmpegService {
  /**
   * Verifies media streams in a file using ffprobe.
   * Ensures output is valid and contains expected video/audio streams.
   */
  static async verifyMediaStreams(filePath) {
    const { ffprobe } = getBinaryPaths();

    return new Promise((resolve, reject) => {
      const args = [
        '-v', 'error',
        '-show_streams',
        '-show_format',
        '-of', 'json',
        filePath,
      ];

      const proc = spawn(ffprobe, args, { windowsHide: true });
      let stdoutBuffer = '';
      let stderrBuffer = '';

      proc.stdout.on('data', chunk => {
        stdoutBuffer += chunk.toString('utf-8');
      });

      proc.stderr.on('data', chunk => {
        stderrBuffer += chunk.toString('utf-8');
      });

      proc.on('close', code => {
        if (code === 0) {
          try {
            const data = JSON.parse(stdoutBuffer);
            const streams = data.streams || [];
            const videoStream = streams.find(s => s.codec_type === 'video');
            const audioStream = streams.find(s => s.codec_type === 'audio');

            resolve({
              valid: true,
              hasVideo: !!videoStream,
              hasAudio: !!audioStream,
              videoCodec: videoStream?.codec_name || null,
              audioCodec: audioStream?.codec_name || null,
              width: videoStream?.width || null,
              height: videoStream?.height || null,
              duration: parseFloat(data.format?.duration || '0'),
              size: parseInt(data.format?.size || '0', 10),
            });
          } catch (err) {
            reject(new Error(`Failed to parse ffprobe stream verification: ${err.message}`));
          }
        } else {
          reject(new Error(`ffprobe failed with code ${code}: ${stderrBuffer.trim()}`));
        }
      });

      proc.on('error', err => {
        reject(new Error(`Failed to run ffprobe: ${err.message}`));
      });
    });
  }

  /**
   * Merges a video stream and an audio stream into a single container.
   * Attempts fast stream copy first; falls back to audio transcode if codecs incompatible with container.
   */
  static async mergeStreams({ videoPath, audioPath, outputPath, container = 'mp4', taskId, onStatus }) {
    const { ffmpeg } = getBinaryPaths();

    if (onStatus) onStatus('Analyzing stream compatibility...');

    // First attempt: Stream copy without re-encoding (-c copy)
    // For MP4 with opus audio, standard MP4 requires AAC audio or movflags
    return new Promise((resolve, reject) => {
      let args = [
        '-y',
        '-i', videoPath,
        '-i', audioPath,
        '-c', 'copy',
        '-movflags', '+faststart',
        outputPath,
      ];

      console.log(`[FFmpeg] Merging streams with copy: ${args.join(' ')}`);
      let proc = spawn(ffmpeg, args, { windowsHide: true });

      if (taskId) {
        processManager.register(taskId, proc, 'ffmpeg-merge');
      }

      let stderrOutput = '';

      proc.stderr.on('data', chunk => {
        stderrOutput += chunk.toString('utf-8');
      });

      proc.on('close', async code => {
        if (processManager.isCanceled(taskId)) {
          return reject(new Error('Merge canceled by user.'));
        }

        if (code === 0) {
          try {
            if (onStatus) onStatus('Verifying output streams...');
            const verification = await FFmpegService.verifyMediaStreams(outputPath);
            if (!verification.hasVideo || !verification.hasAudio) {
              return reject(new Error('Stream copy produced a file missing video or audio streams.'));
            }
            return resolve(outputPath);
          } catch (verErr) {
            return reject(verErr);
          }
        }

        // If stream copy failed due to codec mismatch in container (e.g. Opus in MP4),
        // fallback to copying video and transcoding audio to AAC
        console.warn('[FFmpeg] Stream copy failed. Retrying with video copy and audio AAC transcode...');
        if (onStatus) onStatus('Stream copy incompatible. Merging with audio adaptation...');

        const fallbackArgs = [
          '-y',
          '-i', videoPath,
          '-i', audioPath,
          '-c:v', 'copy',
          '-c:a', 'aac',
          '-b:a', '192k',
          '-movflags', '+faststart',
          outputPath,
        ];

        const fallbackProc = spawn(ffmpeg, fallbackArgs, { windowsHide: true });
        if (taskId) {
          processManager.register(taskId, fallbackProc, 'ffmpeg-fallback');
        }

        let fallbackErr = '';
        fallbackProc.stderr.on('data', chunk => {
          fallbackErr += chunk.toString('utf-8');
        });

        fallbackProc.on('close', async fbCode => {
          if (processManager.isCanceled(taskId)) {
            return reject(new Error('Merge canceled by user.'));
          }

          if (fbCode === 0) {
            try {
              if (onStatus) onStatus('Verifying merged output...');
              const verification = await FFmpegService.verifyMediaStreams(outputPath);
              if (!verification.hasVideo || !verification.hasAudio) {
                return reject(new Error('Merged file failed stream verification.'));
              }
              resolve(outputPath);
            } catch (err) {
              reject(err);
            }
          } else {
            reject(new Error(`FFmpeg merge failed: ${fallbackErr || stderrOutput}`));
          }
        });

        fallbackProc.on('error', err => {
          reject(new Error(`FFmpeg process execution failed: ${err.message}`));
        });
      });

      proc.on('error', err => {
        reject(new Error(`Failed to spawn FFmpeg: ${err.message}`));
      });
    });
  }

  /**
   * Converts an audio track to high-quality MP3 (320kbps CBR or 256kbps).
   */
  static async convertAudioToMp3({ inputPath, outputPath, bitrate = '256k', taskId, onStatus }) {
    const { ffmpeg } = getBinaryPaths();

    if (onStatus) onStatus('Converting audio to MP3...');

    return new Promise((resolve, reject) => {
      const args = [
        '-y',
        '-i', inputPath,
        '-vn',
        '-c:a', 'libmp3lame',
        '-b:a', bitrate,
        outputPath,
      ];

      const proc = spawn(ffmpeg, args, { windowsHide: true });
      if (taskId) {
        processManager.register(taskId, proc, 'ffmpeg-audio-convert');
      }

      let stderrOutput = '';
      proc.stderr.on('data', chunk => {
        stderrOutput += chunk.toString('utf-8');
      });

      proc.on('close', async code => {
        if (processManager.isCanceled(taskId)) {
          return reject(new Error('Audio conversion canceled by user.'));
        }

        if (code === 0) {
          try {
            const verification = await FFmpegService.verifyMediaStreams(outputPath);
            if (!verification.hasAudio) {
              return reject(new Error('Converted MP3 failed audio stream verification.'));
            }
            resolve(outputPath);
          } catch (err) {
            reject(err);
          }
        } else {
          reject(new Error(`Audio conversion failed: ${stderrOutput}`));
        }
      });

      proc.on('error', err => {
        reject(new Error(`Failed to spawn FFmpeg for conversion: ${err.message}`));
      });
    });
  }
}

