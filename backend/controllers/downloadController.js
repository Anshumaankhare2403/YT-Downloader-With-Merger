/**
 * backend/controllers/downloadController.js
 * Controls download creation, progress queries, cancellation, and history.
 */

import { downloadService } from '../services/downloadService.js';

export async function createDownload(req, res, next) {
  try {
    const task = await downloadService.createDownloadTask(req.validatedDownload);
    res.status(201).json({
      success: true,
      message: 'Download task created and enqueued.',
      data: task,
    });
  } catch (err) {
    next(err);
  }
}

export function cancelDownload(req, res, next) {
  try {
    const { id } = req.params;
    const canceled = downloadService.cancelTask(id);

    if (!canceled) {
      return res.status(404).json({
        success: false,
        error: `Task ${id} not found or already completed.`,
      });
    }

    res.json({
      success: true,
      message: `Task ${id} has been canceled.`,
    });
  } catch (err) {
    next(err);
  }
}

export function getDownloadStatus(req, res, next) {
  try {
    const { id } = req.params;
    const task = downloadService.getTask(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: `Task ${id} not found.`,
      });
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (err) {
    next(err);
  }
}

export function getAllDownloads(req, res, next) {
  try {
    const tasks = downloadService.getAllTasks();
    res.json({
      success: true,
      data: tasks,
    });
  } catch (err) {
    next(err);
  }
}

export function getDownloadHistory(req, res, next) {
  try {
    const history = downloadService.getHistory();
    res.json({
      success: true,
      data: history,
    });
  } catch (err) {
    next(err);
  }
}

export function deleteHistoryItem(req, res, next) {
  try {
    const { id } = req.params;
    const history = downloadService.deleteHistoryItem(id);
    res.json({
      success: true,
      data: history,
    });
  } catch (err) {
    next(err);
  }
}

export function clearDownloadHistory(req, res, next) {
  try {
    const history = downloadService.clearHistory();
    res.json({
      success: true,
      data: history,
    });
  } catch (err) {
    next(err);
  }
}

