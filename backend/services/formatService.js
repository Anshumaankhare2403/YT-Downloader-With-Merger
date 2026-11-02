/**
 * backend/services/formatService.js
 * Analyzes, categorizes, and enriches raw yt-dlp format streams.
 */

import { calculateFormatSize, formatDuration, formatBytes } from '../utils/sizeFormatter.js';

export class FormatService {
  /**
   * Transforms raw yt-dlp JSON dump into a clean, structured metadata model.
   */
  static parseMetadata(rawInfo) {
    if (!rawInfo) {
      throw new Error('Metadata output is empty or invalid.');
    }

    const duration = rawInfo.duration || null;
    const rawFormats = Array.isArray(rawInfo.formats) ? rawInfo.formats : [];

    const parsedFormats = [];

    for (const f of rawFormats) {
      const hasVideo = f.vcodec && f.vcodec !== 'none';
      const hasAudio = f.acodec && f.acodec !== 'none';

      // Skip formats that have neither video nor audio (storyboards, manifests)
      if (!hasVideo && !hasAudio) continue;

      let type = 'muxed';
      if (hasVideo && !hasAudio) type = 'video_only';
      if (!hasVideo && hasAudio) type = 'audio_only';

      // Calculate exact or defensible estimated size
      const sizeInfo = calculateFormatSize(f, duration);

      // Clean resolution and quality labels
      let qualityLabel = 'Unknown';
      let resolutionStr = 'Unknown';

      if (hasVideo) {
        if (f.height) {
          qualityLabel = `${f.height}p`;
          resolutionStr = f.width ? `${f.width}x${f.height}` : `${f.height}p`;
        } else if (f.resolution) {
          resolutionStr = f.resolution;
          qualityLabel = f.resolution;
        }
      } else {
        qualityLabel = f.abr ? `${Math.round(f.abr)} kbps` : 'Audio';
        resolutionStr = 'Audio only';
      }

      parsedFormats.push({
        format_id: String(f.format_id),
        ext: f.ext || 'unknown',
        qualityLabel,
        resolution: resolutionStr,
        width: f.width || null,
        height: f.height || null,
        fps: f.fps ? Math.round(f.fps) : null,
        vcodec: hasVideo ? f.vcodec : 'none',
        acodec: hasAudio ? f.acodec : 'none',
        vbr: f.vbr ? Math.round(f.vbr) : null,
        abr: f.abr ? Math.round(f.abr) : null,
        tbr: f.tbr ? Math.round(f.tbr) : null,
        filesize: sizeInfo.bytes,
        sizeFormatted: sizeInfo.formatted,
        isEstimate: sizeInfo.isEstimate,
        type,
        hasVideo,
        hasAudio,
        note: f.format_note || '',
        container: f.container || f.ext,
        protocol: f.protocol || '',
      });
    }

    // Best thumbnail
    let thumbnail = rawInfo.thumbnail || '';
    if (Array.isArray(rawInfo.thumbnails) && rawInfo.thumbnails.length > 0) {
      const sortedThumbs = [...rawInfo.thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0));
      thumbnail = sortedThumbs[0].url || thumbnail;
    }

    // Separate lists
    const videoFormats = parsedFormats
      .filter(f => f.hasVideo)
      .sort((a, b) => {
        const hDiff = (b.height || 0) - (a.height || 0);
        if (hDiff !== 0) return hDiff;
        return (b.fps || 0) - (a.fps || 0);
      });

    const audioFormats = parsedFormats
      .filter(f => f.hasAudio && !f.hasVideo)
      .sort((a, b) => (b.abr || b.tbr || 0) - (a.abr || a.tbr || 0));

    const muxedFormats = parsedFormats
      .filter(f => f.type === 'muxed')
      .sort((a, b) => (b.height || 0) - (a.height || 0));

    return {
      id: rawInfo.id,
      title: rawInfo.title || 'Untitled Media',
      thumbnail,
      duration,
      durationFormatted: formatDuration(duration),
      uploader: rawInfo.uploader || rawInfo.channel || 'Unknown creator',
      webpage_url: rawInfo.webpage_url || rawInfo.original_url || '',
      description: rawInfo.description ? rawInfo.description.substring(0, 300) : '',
      formats: parsedFormats,
      videoFormats,
      audioFormats,
      muxedFormats,
    };
  }

  /**
   * Given a selected video format, finds the most compatible highest-quality audio stream.
   * e.g., MP4/AVC1 pairs best with M4A/AAC; WebM/VP9 pairs best with WebM/Opus.
   */
  static selectBestMatchingAudio(videoFormat, audioFormats) {
    if (!audioFormats || audioFormats.length === 0) return null;

    const isMp4Video = videoFormat.ext === 'mp4' || (videoFormat.vcodec && videoFormat.vcodec.startsWith('avc'));

    if (isMp4Video) {
      // Prefer m4a / aac
      const m4aAudio = audioFormats.find(a => a.ext === 'm4a' || (a.acodec && a.acodec.includes('mp4a')));
      if (m4aAudio) return m4aAudio;
    } else {
      // Prefer opus / webm
      const webmAudio = audioFormats.find(a => a.ext === 'webm' || (a.acodec && a.acodec.includes('opus')));
      if (webmAudio) return webmAudio;
    }

    // Fallback to highest bitrate audio
    return audioFormats[0];
  }

  /**
   * Calculates combined estimated size for video + audio merged download.
   */
  static getCombinedSize(videoFormat, audioFormat) {
    if (!videoFormat) return { bytes: null, formatted: 'Unknown', isEstimate: false };

    if (!audioFormat || videoFormat.type === 'muxed') {
      return {
        bytes: videoFormat.filesize,
        formatted: videoFormat.sizeFormatted,
        isEstimate: videoFormat.isEstimate,
      };
    }

    if (videoFormat.filesize && audioFormat.filesize) {
      const sum = videoFormat.filesize + audioFormat.filesize;
      const isEst = videoFormat.isEstimate || audioFormat.isEstimate;
      return {
        bytes: sum,
        formatted: isEst ? `~${formatBytes(sum)}` : formatBytes(sum),
        isEstimate: isEst,
      };
    }

    return {
      bytes: null,
      formatted: 'Estimated on download',
      isEstimate: true,
    };
  }
}

