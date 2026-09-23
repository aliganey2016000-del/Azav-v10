import { Router } from 'express';
import { SiteAssetController } from '../controllers/siteAsset.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { UserRole } from '../types/index.js';

export const siteAssetRouter = Router();

// Public read: landing page images/videos must render without authentication.
siteAssetRouter.get('/:id', SiteAssetController.serve);

siteAssetRouter.post(
  '/upload',
  authenticate,
  requireRole(UserRole.SUPER_ADMIN),
  SiteAssetController.upload
);
