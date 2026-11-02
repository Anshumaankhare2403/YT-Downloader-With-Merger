/**
 * backend/services/downloadService.js
 * High-performance download engine managing lifecycle, concurrency queues,
 * multi-connection accelerated streams (-N 5), metadata caching, and verification.
 */

import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { YtDlpService } from './ytDlpService.js';
import { FFmpegService } from './ffmpegService.js';
import { FormatService } from './formatService.js';
import { processManager } from '../utils/processManager.js';
import { metadataCache } from './metadataCache.js';
import {
  getTempDirectory,
  getDefaultDownloadDirectory,
  sanitizeFilename,
  safeUnlink,
} from '../utils/fileManager.js';
import { formatBytes, formatSpeed, formatEta } from '../utils/sizeFormatter.js';

class DownloadService extends EventEmitter {
  constructor() {
    super();
    this.tasks = new Map();
    this.queue = [];
    this.activeTaskCount = 0;
    this.maxConcurrency = 3;

    this.settings = {
      downloadDirectory: getDefaultDownloadDirectory(),
      maxConcurrency: 3,
      theme: 'dark',
    };

    this.history = [];
    this.storageDir = path.join(getTempDirectory(), 'storage');
    this.initStorage();
  }

  initStorage(customDir = null) {
    if (customDir) {
      this.storageDir = customDir;
    }
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }

    const settingsFile = path.join(this.storageDir, 'settings.json');
    if (fs.existsSync(settingsFile)) {
      try {
        const loaded = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
        this.settings = { ...this.settings, ...loaded };
        this.maxConcurrency = this.settings.maxConcurrency || 3;
      } catch (e) {
        console.warn('[DownloadService] Failed to parse settings.json:', e.message);
      }
    }

    const historyFile = path.join(this.storageDir, 'history.json');
    if (fs.existsSync(historyFile)) {
      try {
        this.history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
      } catch (e) {
        console.warn('[DownloadService] Failed to parse history.json:', e.message);
      }
    }
  }

  saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    if (this.settings.maxConcurrency) {
      this.maxConcurrency = this.settings.maxConcurrency;
    }
    const settingsFile = path.join(this.storageDir, 'settings.json');
    fs.writeFileSync(settingsFile, JSON.stringify(this.settings, null, 2), 'utf-8');
    return this.settings;
  }

  getSettings() {
    return this.settings;
  }

  saveHistory() {
    try {
      if (!fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
      }
      const historyFile = path.join(this.storageDir, 'history.json');
      fs.writeFileSync(historyFile, JSON.stringify(this.history.slice(0, 100), null, 2), 'utf-8');
    } catch (err) {
      console.warn('[DownloadService] Could not save history:', err.message);
    }
  }

  getHistory() {
    return this.history;
  }

  deleteHistoryItem(id) {
    this.history = this.history.filter(item => item.id !== id);
    this.saveHistory();
    return this.history;
  }

  clearHistory() {
    this.history = [];
    this.saveHistory();
    return this.history;
  }

  /**
   * Enqueues or starts a new download task.
   */
  async createDownloadTask({
    url,
    mode,
    videoFormatId,
    audioFormatId,
    outputDirectory,
    customFilename,
    title,
    thumbnail,
    convertToMp3 = false,
  }) {
    const taskId = processManager.generateTaskId();
    const targetDir = outputDirectory || this.settings.downloadDirectory;

    const task = {
      id: taskId,
      url,
      mode,
      videoFormatId,
      audioFormatId,
      outputDirectory: targetDir,
      customFilename,
      convertToMp3,
      status: 'queued',
      progress: 0,
      phase: 'Queued',
      downloadedBytes: 0,
      totalBytes: 0,
      speed: 0,
      speedFormatted: '0 KB/s',
      eta: 0,
      etaFormatted: '--',
      title: customFilename || title || 'Preparing download...',
      thumbnail: thumbnail || '',
      outputPath: null,
      error: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
      tempFiles: [],
    };

    this.tasks.set(taskId, task);
    this.emitProgress(task);

    this.queue.push(taskId);
    this.processQueue();

    return task;
  }

  emitProgress(task) {
    this.emit('progress', {
      id: task.id,
      status: task.status,
      phase: task.phase,
      progress: task.progress,
      downloadedBytes: task.downloadedBytes,
      totalBytes: task.totalBytes,
      speed: task.speed,
      speedFormatted: task.speedFormatted,
      eta: task.eta,
      etaFormatted: task.etaFormatted,
      title: task.title,
      thumbnail: task.thumbnail,
      outputPath: task.outputPath,
      error: task.error,
    });
  }

  async processQueue() {
    if (this.activeTaskCount >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    const taskId = this.queue.shift();
    const task = this.tasks.get(taskId);
    if (!task || task.status === 'canceled') {
      return this.processQueue();
    }

    this.activeTaskCount++;
    this.executeTask(task)
      .finally(() => {
        this.activeTaskCount--;
        this.processQueue();
      });
  }

  async executeTask(task) {
    const tempDir = getTempDirectory();
    try {
      // 1. Instant metadata resolution: check cache first to eliminate 10s redundant extraction
      let meta = metadataCache.get(task.url);
      if (!meta) {
        task.status = 'fetching_info';
        task.phase = 'Retrieving media info...';
        this.emitProgress(task);
        meta = await YtDlpService.fetchMetadata(task.url);
      }

      task.title = task.customFilename || meta.title;
      task.thumbnail = meta.thumbnail;

      const safeBaseName = sanitizeFilename(task.customFilename || meta.title);

      if (task.mode === 'merged') {
        await this.handleMergedDownload(task, meta, tempDir, safeBaseName);
      } else if (task.mode === 'video') {
        await this.handleVideoOnlyDownload(task, meta, tempDir, safeBaseName);
      } else if (task.mode === 'audio') {
        await this.handleAudioOnlyDownload(task, meta, tempDir, safeBaseName);
      }

      task.status = 'completed';
      task.phase = 'Download complete';
      task.progress = 100;
      task.completedAt = new Date().toISOString();
      this.emitProgress(task);

      // Record in history
      const stat = fs.existsSync(task.outputPath) ? fs.statSync(task.outputPath) : null;
      this.history.unshift({
        id: task.id,
        title: task.title,
        url: task.url,
        mode: task.mode,
        resolution: task.resolutionLabel || 'Standard',
        outputPath: task.outputPath,
        fileName: path.basename(task.outputPath),
        fileSize: stat ? stat.size : task.totalBytes,
        fileSizeFormatted: formatBytes(stat ? stat.size : task.totalBytes),
        completedAt: task.completedAt,
        status: 'completed',
      });
      this.saveHistory();

    } catch (err) {
      if (task.status === 'canceled') {
        console.log(`[DownloadService] Task ${task.id} was canceled.`);
      } else {
        console.error(`[DownloadService] Task ${task.id} failed:`, err);
        task.status = 'failed';
        task.phase = 'Failed';
        task.error = err.message;
        this.emitProgress(task);

        this.history.unshift({
          id: task.id,
          title: task.title || 'Download Failed',
          url: task.url,
          mode: task.mode,
          resolution: task.resolutionLabel || 'Unknown',
          outputPath: null,
          fileName: null,
          fileSize: 0,
          fileSizeFormatted: '0 B',
          completedAt: new Date().toISOString(),
          status: 'failed',
          error: err.message,
        });
        this.saveHistory();
      }
    } finally {
      for (const tmp of task.tempFiles) {
        safeUnlink(tmp);
      }
    }
  }

  async handleMergedDownload(task, meta, tempDir, safeBaseName) {
    const videoFormat = meta.formats.find(f => f.format_id === task.videoFormatId) || meta.videoFormats[0];
    if (!videoFormat) throw new Error('Selected video format was not found.');

    let audioFormat;
    if (task.audioFormatId) {
      audioFormat = meta.formats.find(f => f.format_id === task.audioFormatId);
    }
    if (!audioFormat) {
      audioFormat = FormatService.selectBestMatchingAudio(videoFormat, meta.audioFormats);
    }

    task.resolutionLabel = videoFormat.qualityLabel;

    // Target container
    const isWebm = (videoFormat.ext === 'webm' || videoFormat.vcodec?.includes('vp9')) && audioFormat?.ext === 'webm';
    const container = isWebm ? 'webm' : 'mp4';
    const finalDest = path.join(task.outputDirectory, `${safeBaseName}.${container}`);
    task.outputPath = finalDest;

    // If format is already muxed
    if (videoFormat.type === 'muxed' || !audioFormat) {
      task.status = 'downloading';
      task.phase = `Downloading video (${videoFormat.qualityLabel})...`;
      this.emitProgress(task);

      await YtDlpService.downloadStream({
        url: task.url,
        formatId: videoFormat.format_id,
        outputPath: finalDest,
        taskId: task.id,
        onProgress: p => this.updateDownloadProgress(task, p, 95, 0),
      });

      task.status = 'verifying';
      task.phase = 'Verifying media streams...';
      task.progress = 98;
      this.emitProgress(task);

      await FFmpegService.verifyMediaStreams(finalDest);
      return;
    }

    // High-speed single-pass parallel download and merge
    task.status = 'downloading';
    task.phase = `Downloading & merging ${videoFormat.qualityLabel}...`;
    this.emitProgress(task);

    const formatSpec = `${videoFormat.format_id}+${audioFormat.format_id}`;

    try {
      await YtDlpService.downloadAndMerge({
        url: task.url,
        formatSpecification: formatSpec,
        outputPath: finalDest,
        container,
        taskId: task.id,
        onProgress: p => this.updateDownloadProgress(task, p, 95, 0),
      });

      task.status = 'verifying';
      task.phase = 'Verifying media output...';
      task.progress = 98;
      this.emitProgress(task);

      await FFmpegService.verifyMediaStreams(finalDest);
    } catch (singlePassErr) {
      // Fallback: If single pass merger hit container codec mismatch, fallback to separate streams
      console.warn('[DownloadService] Single-pass merge fallback triggered:', singlePassErr.message);

      const tempVideo = path.join(tempDir, `${task.id}_video.${videoFormat.ext}`);
      const tempAudio = path.join(tempDir, `${task.id}_audio.${audioFormat.ext}`);
      task.tempFiles.push(tempVideo, tempAudio);

      task.phase = `Downloading video (${videoFormat.qualityLabel})...`;
      this.emitProgress(task);
      await YtDlpService.downloadStream({
        url: task.url,
        formatId: videoFormat.format_id,
        outputPath: tempVideo,
        taskId: task.id,
        onProgress: p => this.updateDownloadProgress(task, p, 60, 0),
      });

      task.phase = 'Downloading audio stream...';
      this.emitProgress(task);
      await YtDlpService.downloadStream({
        url: task.url,
        formatId: audioFormat.format_id,
        outputPath: tempAudio,
        taskId: task.id,
        onProgress: p => this.updateDownloadProgress(task, p, 30, 60),
      });

      task.status = 'merging';
      task.phase = 'Merging streams with FFmpeg...';
      task.progress = 92;
      this.emitProgress(task);

      await FFmpegService.mergeStreams({
        videoPath: tempVideo,
        audioPath: tempAudio,
        outputPath: finalDest,
        container,
        taskId: task.id,
        onStatus: s => {
          task.phase = s;
          this.emitProgress(task);
        },
      });
    }
  }

  async handleVideoOnlyDownload(task, meta, tempDir, safeBaseName) {
    const videoFormat = meta.formats.find(f => f.format_id === task.videoFormatId) || meta.videoFormats[0];
    if (!videoFormat) throw new Error('Selected video format was not found.');

    task.resolutionLabel = videoFormat.qualityLabel;
    const ext = videoFormat.ext || 'mp4';
    const finalDest = path.join(task.outputDirectory, `${safeBaseName}_video_only.${ext}`);
    task.outputPath = finalDest;

    task.status = 'downloading';
    task.phase = `Downloading video only (${videoFormat.qualityLabel})...`;
    this.emitProgress(task);

    await YtDlpService.downloadStream({
      url: task.url,
      formatId: videoFormat.format_id,
      outputPath: finalDest,
      taskId: task.id,
      onProgress: p => this.updateDownloadProgress(task, p, 95, 0),
    });

    task.status = 'verifying';
    task.phase = 'Verifying video stream...';
    task.progress = 98;
    this.emitProgress(task);

    await FFmpegService.verifyMediaStreams(finalDest);
  }

  async handleAudioOnlyDownload(task, meta, tempDir, safeBaseName) {
    const audioFormat = meta.formats.find(f => f.format_id === task.audioFormatId) || meta.audioFormats[0];
    if (!audioFormat) throw new Error('Selected audio stream was not found.');

    task.resolutionLabel = 'Audio';

    if (task.convertToMp3) {
      const tempAudio = path.join(tempDir, `${task.id}_raw_audio.${audioFormat.ext}`);
      task.tempFiles.push(tempAudio);

      const finalDest = path.join(task.outputDirectory, `${safeBaseName}.mp3`);
      task.outputPath = finalDest;

      task.status = 'downloading';
      task.phase = 'Downloading audio stream...';
      this.emitProgress(task);

      await YtDlpService.downloadStream({
        url: task.url,
        formatId: audioFormat.format_id,
        outputPath: tempAudio,
        taskId: task.id,
        onProgress: p => this.updateDownloadProgress(task, p, 70, 0),
      });

      task.status = 'merging';
      task.phase = 'Encoding high-quality MP3...';
      task.progress = 85;
      this.emitProgress(task);

      await FFmpegService.convertAudioToMp3({
        inputPath: tempAudio,
        outputPath: finalDest,
        bitrate: '256k',
        taskId: task.id,
        onStatus: s => {
          task.phase = s;
          this.emitProgress(task);
        },
      });
    } else {
      const ext = audioFormat.ext || 'm4a';
      const finalDest = path.join(task.outputDirectory, `${safeBaseName}.${ext}`);
      task.outputPath = finalDest;

      task.status = 'downloading';
      task.phase = 'Downloading original audio...';
      this.emitProgress(task);

      await YtDlpService.downloadStream({
        url: task.url,
        formatId: audioFormat.format_id,
        outputPath: finalDest,
        taskId: task.id,
        onProgress: p => this.updateDownloadProgress(task, p, 95, 0),
      });

      task.status = 'verifying';
      task.phase = 'Verifying audio stream...';
      task.progress = 98;
      this.emitProgress(task);

      await FFmpegService.verifyMediaStreams(finalDest);
    }
  }

  updateDownloadProgress(task, p, weightScale = 100, offset = 0) {
    const rawPct = p.percentage || 0;
    task.progress = Math.min(100, Math.round(offset + (rawPct * (weightScale / 100))));
    task.downloadedBytes = p.downloadedBytes;
    task.totalBytes = p.totalBytes;
    task.speed = p.speed;
    task.speedFormatted = formatSpeed(p.speed);
    task.eta = p.eta;
    task.etaFormatted = formatEta(p.eta);
    this.emitProgress(task);
  }

  cancelTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    task.status = 'canceled';
    task.phase = 'Canceled by user';
    task.progress = 0;
    this.emitProgress(task);

    processManager.cancelTask(taskId);

    for (const tmp of task.tempFiles) {
      safeUnlink(tmp);
    }

    this.queue = this.queue.filter(id => id !== taskId);
    return true;
  }

  getTask(taskId) {
    return this.tasks.get(taskId) || null;
  }

  getAllTasks() {
    return Array.from(this.tasks.values());
  }
}

export const downloadService = new DownloadService();
