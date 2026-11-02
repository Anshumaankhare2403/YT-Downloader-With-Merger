/**
 * backend/middleware/validation.js
 * Security middleware for URL validation, session token authorization,
 * and download request sanity checking.
 */

import { validateDirectory, sanitizeFilename } from '../utils/fileManager.js';

let serverSessionToken = process.env.SESSION_TOKEN || null;

export function setSessionToken(token) {
  serverSessionToken = token;
}

export function getSessionToken() {
  return serverSessionToken;
}

/**
 * Validates a media URL strictly.
 * Allows only http/https URLs, rejects non-URL characters, prevents command injection flags.
 */
export function isValidMediaUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return false;

  // Reject newlines, carriage returns, null bytes anywhere in raw input
  if (/[\r\n\0]/.test(urlStr)) {
    return false;
  }

  const trimmed = urlStr.trim();
  if (trimmed.length < 8 || trimmed.length > 2048) return false;

  // Prevent flag injection (e.g. starting with -)
  if (trimmed.startsWith('-')) return false;

  // Reject dangerous shell characters that could attempt command injection
  if (/[;&|`$(){}<>]/.test(trimmed)) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    // Must have a valid hostname with at least one dot (or localhost for controlled tests)
    if (!parsed.hostname || (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost')) {
      return false;
    }

    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Express middleware to verify session token on all protected endpoints.
 */
export function requireSessionToken(req, res, next) {
  if (!serverSessionToken) {
    return next();
  }

  const clientToken = req.headers['x-session-token'] || req.query.token;

  if (!clientToken || clientToken !== serverSessionToken) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or missing session token.',
    });
  }

  next();
}

/**
 * Express middleware to validate URL queries/bodies.
 */
export function validateUrlMiddleware(req, res, next) {
  const url = req.body?.url || req.query?.url;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'URL parameter is required.',
    });
  }

  if (!isValidMediaUrl(url)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid URL. Only HTTP and HTTPS URLs are supported.',
    });
  }

  req.validatedUrl = url.trim();
  next();
}

/**
 * Express middleware to validate download initiation request.
 */
export function validateDownloadRequest(req, res, next) {
  const { url, mode, videoFormatId, audioFormatId, formatId, outputDirectory, customFilename } = req.body;

  if (!url || !isValidMediaUrl(url)) {
    return res.status(400).json({
      success: false,
      error: 'A valid HTTP/HTTPS media URL is required.',
    });
  }

  const validModes = ['merged', 'video', 'audio'];
  if (!mode || !validModes.includes(mode)) {
    return res.status(400).json({
      success: false,
      error: `Invalid download mode. Must be one of: ${validModes.join(', ')}`,
    });
  }

  if (mode === 'merged') {
    if (!videoFormatId && !formatId) {
      return res.status(400).json({
        success: false,
        error: 'Merged mode requires videoFormatId (or formatId) and optional audioFormatId.',
      });
    }
  } else if (mode === 'video') {
    if (!videoFormatId && !formatId) {
      return res.status(400).json({
        success: false,
        error: 'Video mode requires videoFormatId or formatId.',
      });
    }
  } else if (mode === 'audio') {
    if (!audioFormatId && !formatId) {
      return res.status(400).json({
        success: false,
        error: 'Audio mode requires audioFormatId or formatId.',
      });
    }
  }

  let resolvedDir;
  if (outputDirectory) {
    try {
      resolvedDir = validateDirectory(outputDirectory);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: `Invalid output directory: ${err.message}`,
      });
    }
  }

  req.validatedDownload = {
    url: url.trim(),
    mode,
    videoFormatId: videoFormatId || formatId,
    audioFormatId: audioFormatId || (mode === 'audio' ? formatId : null),
    outputDirectory: resolvedDir,
    customFilename: customFilename ? sanitizeFilename(customFilename) : null,
    title: req.body.title || null,
    thumbnail: req.body.thumbnail || null,
  };

  next();
}
