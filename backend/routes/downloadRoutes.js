/**
 * backend/routes/downloadRoutes.js
 * Endpoints for downloads, cancellations, and download history.
 */

import { Router } from 'express';
import {
  createDownload,
  cancelDownload,
  getDownloadStatus,
  getAllDownloads,
  getDownloadHistory,
  deleteHistoryItem,
  clearDownloadHistory,
} from '../controllers/downloadController.js';
import { validateDownloadRequest, requireSessionToken } from '../middleware/validation.js';

const router = Router();

// Downloads
router.post('/', requireSessionToken, validateDownloadRequest, createDownload);
router.get('/', requireSessionToken, getAllDownloads);
router.get('/history', requireSessionToken, getDownloadHistory);
router.delete('/history/:id', requireSessionToken, deleteHistoryItem);
router.delete('/history', requireSessionToken, clearDownloadHistory);
router.get('/:id', requireSessionToken, getDownloadStatus);
router.post('/:id/cancel', requireSessionToken, cancelDownload);

export default router;

