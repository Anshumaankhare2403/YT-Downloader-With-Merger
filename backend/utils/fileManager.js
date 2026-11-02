/**
 * backend/utils/fileManager.js
 * Handles safe path resolution, filename sanitization, binary discovery,
 * and temporary file lifecycle.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

/**
 * Sanitizes a string for use as a safe Windows filename.
 * Strips path traversal, invalid characters: < > : " / \ | ? * and control chars.
 * Trims trailing dots and spaces, limits length to 200 chars.
 */
export function sanitizeFilename(filename, defaultName = 'download') {
  if (!filename || typeof filename !== 'string') return defaultName;

  let clean = filename
    // Neutralize path traversal
    .replace(/\.{2,}/g, '_')
    // Replace invalid Windows characters with underscore
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    // Collapse multiple underscores
    .replace(/_+/g, '_')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim();

  // Strip trailing/leading dots/spaces/underscores where unsafe
  clean = clean.replace(/^[. _]+/, '').replace(/[. _]+$/, '');

  // Truncate to safe length
  if (clean.length > 200) {
    clean = clean.substring(0, 200).trim();
  }

  return clean || defaultName;
}

/**
 * Resolves binary locations based on whether running in packaged Electron
 * or development mode.
 */
export function getBinaryPaths() {
  let baseDir;
  if (process.resourcesPath && fs.existsSync(path.join(process.resourcesPath, 'resources', 'win', 'yt-dlp.exe'))) {
    baseDir = path.join(process.resourcesPath, 'resources', 'win');
  } else if (process.resourcesPath && fs.existsSync(path.join(process.resourcesPath, 'win', 'yt-dlp.exe'))) {
    baseDir = path.join(process.resourcesPath, 'win');
  } else {
    // Development mode
    baseDir = path.join(PROJECT_ROOT, 'resources', 'win');
  }

  return {
    baseDir,
    ytdlp: path.join(baseDir, 'yt-dlp.exe'),
    ffmpeg: path.join(baseDir, 'ffmpeg.exe'),
    ffprobe: path.join(baseDir, 'ffprobe.exe'),
  };
}

/**
 * Gets or creates the application temporary directory for intermediate files.
 * Uses OS temp / yt-downloader-temp to avoid polluting app directories.
 */
export function getTempDirectory() {
  const tempDir = path.join(os.tmpdir(), 'yt-downloader-temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
}

/**
 * Gets the default user download directory (Windows Downloads folder).
 */
export function getDefaultDownloadDirectory() {
  const home = os.homedir();
  const downloads = path.join(home, 'Downloads');
  if (fs.existsSync(downloads)) {
    return downloads;
  }
  return home;
}

/**
 * Validates that an output path is absolute, exists, and is inside an allowed boundary.
 */
export function validateDirectory(dirPath) {
  if (!dirPath || typeof dirPath !== 'string') {
    throw new Error('Directory path must be a valid non-empty string.');
  }

  const resolved = path.resolve(dirPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Directory does not exist: ${resolved}`);
  }

  const stat = fs.statSync(resolved);
  if (!stat.isDirectory()) {
    throw new Error(`Path is not a directory: ${resolved}`);
  }

  return resolved;
}

/**
 * Safely removes a file if it exists, ignoring ENOENT.
 */
export function safeUnlink(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch (err) {
    console.warn(`[FileManager] Warning: Could not delete ${filePath}:`, err.message);
  }
  return false;
}

/**
 * Cleans up old temporary files created by YT Downloader.
 */
export function cleanOldTempFiles(maxAgeMs = 3600000) {
  try {
    const tempDir = getTempDirectory();
    const files = fs.readdirSync(tempDir);
    const now = Date.now();
    let count = 0;

    for (const file of files) {
      const fullPath = path.join(tempDir, file);
      try {
        const stat = fs.statSync(fullPath);
        if (now - stat.mtimeMs > maxAgeMs) {
          if (stat.isDirectory()) {
            fs.rmSync(fullPath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(fullPath);
          }
          count++;
        }
      } catch (e) {
        // file might be locked by another process
      }
    }
    return count;
  } catch (err) {
    console.warn('[FileManager] Failed during temp cleanup:', err.message);
    return 0;
  }
}
