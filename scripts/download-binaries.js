/**
 * scripts/download-binaries.js
 * Downloads official pre-built Windows binaries for yt-dlp, FFmpeg, and FFprobe.
 * Places them into resources/win/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync, spawnSync } from 'child_process';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const TARGET_DIR = path.join(ROOT_DIR, 'resources', 'win');
const TEMP_DIR = path.join(ROOT_DIR, 'resources', 'temp_download');

if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

async function downloadFile(url, destPath, label) {
  console.log(`[Download] Starting download of ${label}...`);
  console.log(`  Source: ${url}`);
  console.log(`  Target: ${destPath}`);

  const res = await fetch(url, {
    headers: { 'User-Agent': 'YTDownloader-Setup' },
    redirect: 'follow',
  });

  if (!res.ok) {
    throw new Error(`Failed to download ${label}: HTTP ${res.status} ${res.statusText}`);
  }

  const contentLength = Number(res.headers.get('content-length') || 0);
  let downloaded = 0;
  let lastReport = 0;

  const fileStream = fs.createWriteStream(destPath);
  const reader = res.body.getReader();

  const nodeReadable = new Readable({
    async read() {
      try {
        const { done, value } = await reader.read();
        if (done) {
          this.push(null);
        } else {
          downloaded += value.length;
          const now = Date.now();
          if (contentLength > 0 && now - lastReport > 1000) {
            lastReport = now;
            const pct = ((downloaded / contentLength) * 100).toFixed(1);
            const mb = (downloaded / (1024 * 1024)).toFixed(1);
            const totalMb = (contentLength / (1024 * 1024)).toFixed(1);
            process.stdout.write(`\r  Progress: ${pct}% (${mb}/${totalMb} MB)`);
          }
          this.push(value);
        }
      } catch (err) {
        this.destroy(err);
      }
    },
  });

  await pipeline(nodeReadable, fileStream);
  console.log(`\n[Download] Finished downloading ${label}. (${(fs.statSync(destPath).size / (1024 * 1024)).toFixed(1)} MB)`);
}

async function getLatestFFmpegZipUrl() {
  console.log('[FFmpeg] Querying GitHub releases for GyanD/codexffmpeg latest build...');
  const res = await fetch('https://api.github.com/repos/GyanD/codexffmpeg/releases/latest', {
    headers: { 'User-Agent': 'YTDownloader-Setup' },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch FFmpeg releases: ${res.statusText}`);
  }
  const data = await res.json();
  const asset = data.assets.find(a => a.name.endsWith('essentials_build.zip'));
  if (!asset) {
    throw new Error('Could not find essentials_build.zip in latest FFmpeg release.');
  }
  return asset.browser_download_url;
}

async function main() {
  try {
    const ytdlpDest = path.join(TARGET_DIR, 'yt-dlp.exe');
    const ffmpegDest = path.join(TARGET_DIR, 'ffmpeg.exe');
    const ffprobeDest = path.join(TARGET_DIR, 'ffprobe.exe');

    // 1. Download yt-dlp if not already present
    if (!fs.existsSync(ytdlpDest)) {
      const ytdlpUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
      await downloadFile(ytdlpUrl, ytdlpDest, 'yt-dlp.exe');
    } else {
      console.log(`[Cache] yt-dlp.exe already present at ${ytdlpDest}`);
    }

    // 2. Download and extract ffmpeg & ffprobe if needed
    if (!fs.existsSync(ffmpegDest) || !fs.existsSync(ffprobeDest)) {
      const ffmpegUrl = await getLatestFFmpegZipUrl();
      const zipPath = path.join(TEMP_DIR, 'ffmpeg-essentials.zip');
      await downloadFile(ffmpegUrl, zipPath, 'FFmpeg Essentials Zip');

      console.log('[Extract] Extracting ffmpeg.exe and ffprobe.exe using bsdtar...');
      // Extract with tar: tar -xf <zip> --wildcards "*/bin/ffmpeg.exe" "*/bin/ffprobe.exe" -C <TEMP_DIR>
      const tarRes = spawnSync('tar', ['-xf', zipPath, '-C', TEMP_DIR], { stdio: 'inherit' });
      if (tarRes.status !== 0) {
        throw new Error('tar extraction failed.');
      }

      // Locate the extracted files in TEMP_DIR
      function findFile(dir, fileName) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            const found = findFile(fullPath, fileName);
            if (found) return found;
          } else if (entry.name.toLowerCase() === fileName.toLowerCase()) {
            return fullPath;
          }
        }
        return null;
      }

      const extractedFfmpeg = findFile(TEMP_DIR, 'ffmpeg.exe');
      const extractedFfprobe = findFile(TEMP_DIR, 'ffprobe.exe');

      if (!extractedFfmpeg || !extractedFfprobe) {
        throw new Error('Could not find ffmpeg.exe or ffprobe.exe inside extracted archive.');
      }

      fs.copyFileSync(extractedFfmpeg, ffmpegDest);
      fs.copyFileSync(extractedFfprobe, ffprobeDest);
      console.log(`[Extracted] Copied ffmpeg.exe -> ${ffmpegDest}`);
      console.log(`[Extracted] Copied ffprobe.exe -> ${ffprobeDest}`);

      // Cleanup temp
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
      console.log('[Cleanup] Removed temporary download archive and extraction files.');
    } else {
      console.log(`[Cache] ffmpeg.exe and ffprobe.exe already present in ${TARGET_DIR}`);
    }

    console.log('\n[Success] All binary dependencies downloaded successfully!');
  } catch (err) {
    console.error('\n[Error] Binary download failed:', err);
    process.exit(1);
  }
}

main();

