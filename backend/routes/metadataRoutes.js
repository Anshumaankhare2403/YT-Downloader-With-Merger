/**
 * backend/routes/metadataRoutes.js
 * Routing for URL format detection and metadata inspection.
 */

import { Router } from 'express';
import { getMetadata } from '../controllers/metadataController.js';
import { validateUrlMiddleware, requireSessionToken } from '../middleware/validation.js';

const router = Router();

router.post('/', requireSessionToken, validateUrlMiddleware, getMetadata);
router.get('/', requireSessionToken, validateUrlMiddleware, getMetadata);

export default router;

