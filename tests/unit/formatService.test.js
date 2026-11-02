import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { FormatService } from '../../backend/services/formatService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('FormatService Unit Tests', () => {
  const sampleMeta = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../fixtures/sampleMetadata.json'), 'utf-8')
  );

  it('correctly parses raw metadata and extracts key video information', () => {
    const result = FormatService.parseMetadata(sampleMeta);

    expect(result.id).toBe('sample_video_123');
    expect(result.title).toBe('Creative Commons 4K Nature Showcase');
    expect(result.duration).toBe(180);
    expect(result.durationFormatted).toBe('3:00');
    expect(result.uploader).toBe('Earth Observatories');
    expect(result.formats.length).toBe(7);
  });

  it('accurately categorizes video_only, audio_only, and muxed streams', () => {
    const result = FormatService.parseMetadata(sampleMeta);

    // Format 18 has both AVC1 video and AAC audio
    const muxed = result.formats.find(f => f.format_id === '18');
    expect(muxed.type).toBe('muxed');
    expect(muxed.hasVideo).toBe(true);
    expect(muxed.hasAudio).toBe(true);

    // Format 401 has AV1 video and no audio
    const videoOnly = result.formats.find(f => f.format_id === '401');
    expect(videoOnly.type).toBe('video_only');
    expect(videoOnly.hasVideo).toBe(true);
    expect(videoOnly.hasAudio).toBe(false);

    // Format 140 has AAC audio and no video
    const audioOnly = result.formats.find(f => f.format_id === '140');
    expect(audioOnly.type).toBe('audio_only');
    expect(audioOnly.hasVideo).toBe(false);
    expect(audioOnly.hasAudio).toBe(true);
  });

  it('selects the most compatible audio stream for MP4 and WebM video formats', () => {
    const result = FormatService.parseMetadata(sampleMeta);

    // For MP4 video (AVC/H264), should select M4A/AAC
    const mp4Video = result.videoFormats.find(f => f.ext === 'mp4');
    const bestMp4Audio = FormatService.selectBestMatchingAudio(mp4Video, result.audioFormats);
    expect(bestMp4Audio.ext).toBe('m4a');
    expect(bestMp4Audio.format_id).toBe('140');

    // For WebM video (VP9), should select WebM/Opus
    const webmVideo = result.videoFormats.find(f => f.ext === 'webm');
    const bestWebmAudio = FormatService.selectBestMatchingAudio(webmVideo, result.audioFormats);
    expect(bestWebmAudio.ext).toBe('webm');
    expect(bestWebmAudio.format_id).toBe('251');
  });

  it('calculates combined size accurately when combining video and audio', () => {
    const result = FormatService.parseMetadata(sampleMeta);
    const video = result.videoFormats.find(f => f.format_id === '137'); // 85 MB
    const audio = result.audioFormats.find(f => f.format_id === '140'); // ~2.88 MB

    const combined = FormatService.getCombinedSize(video, audio);
    expect(combined.bytes).toBe(85000000 + 2880000);
    expect(combined.isEstimate).toBe(false);
  });
});

