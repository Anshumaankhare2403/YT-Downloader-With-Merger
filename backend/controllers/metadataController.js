/**
 * backend/controllers/metadataController.js
 * Handles metadata queries and format detection.
 */

import { YtDlpService } from '../services/ytDlpService.js';

export async function getMetadata(req, res, next) {
  try {
    const url = req.validatedUrl;
    console.log(`[MetadataController] Fetching metadata for: ${url}`);
    const metadata = await YtDlpService.fetchMetadata(url);

    res.json({
      success: true,
      data: metadata,
    });
  } catch (err) {
    // Return clean 400 Bad Request with user-friendly error message
    return res.status(400).json({
      success: false,
      error: err.message || 'Unable to retrieve media metadata at this time.',
    });
  }
}
