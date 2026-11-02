/**
 * backend/routes/settingsRoutes.js
 * Settings retrieval, persistence, and storage cleanup.
 */

import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { downloadService } from '../services/downloadService.js';
import { requireSessionToken } from '../middleware/validation.js';
import {
  getTempDirectory,
  cleanOldTempFiles,
  validateDirectory,
} from '../utils/fileManager.js';
import { formatBytes } from '../utils/sizeFormatter.js';

const router = Router();

router.get('/', requireSessionToken, (req, res) => {
  res.json({
    success: true,
    data: downloadService.getSettings(),
  });
});

router.post('/', requireSessionToken, (req, res) => {
  const { downloadDirectory, maxConcurrency, theme } = req.body;
  const updates = {};

  if (downloadDirectory) {
    try {
      updates.downloadDirectory = validateDirectory(downloadDirectory);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: `Invalid download directory: ${err.message}`,
      });
    }
  }

  if (maxConcurrency) {
    const num = parseInt(maxConcurrency, 10);
    if (!isNaN(num) && num >= 1 && num <= 10) {
      updates.maxConcurrency = num;
    }
  }

  if (theme && (theme === 'dark' || theme === 'light')) {
    updates.theme = theme;
  }

  const saved = downloadService.saveSettings(updates);
  res.json({
    success: true,
    data: saved,
  });
});

router.get('/temp-stats', requireSessionToken, (req, res) => {
  try {
    const tempDir = getTempDirectory();
    const files = fs.readdirSync(tempDir);
    let totalSize = 0;
    let fileCount = 0;

    for (const f of files) {
      try {
        const stat = fs.statSync(path.join(tempDir, f));
        if (!stat.isDirectory()) {
          totalSize += stat.size;
          fileCount++;
        }
      } catch (e) {}
    }

    res.json({
      success: true,
      data: {
        tempDirectory: tempDir,
        fileCount,
        totalSizeBytes: totalSize,
        totalSizeFormatted: formatBytes(totalSize),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/clean-temp', requireSessionToken, (req, res) => {
  try {
    const cleanedCount = cleanOldTempFiles(0); // clean all safe inactive temp files
    res.json({
      success: true,
      message: `Cleaned up ${cleanedCount} temporary files.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

