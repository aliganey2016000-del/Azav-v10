import { Router } from 'express';
import { LandingPageController } from '../controllers/landingPage.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { UserRole } from '../types/index.js';

export const landingPageRouter = Router();

landingPageRouter.get('/', LandingPageController.getPublic);

landingPageRouter.get(
  '/preview',
  authenticate,
  requireRole(UserRole.SUPER_ADMIN),
  LandingPageController.getPreview
);

landingPageRouter.get(
  '/admin',
  authenticate,
  requireRole(UserRole.SUPER_ADMIN),
  LandingPageController.getAdmin
);

landingPageRouter.put(
  '/admin/draft',
  authenticate,
  requireRole(UserRole.SUPER_ADMIN),
  LandingPageController.saveDraft
);

landingPageRouter.post(
  '/admin/publish',
  authenticate,
  requireRole(UserRole.SUPER_ADMIN),
  LandingPageController.publish
);

landingPageRouter.post(
  '/admin/reset',
  authenticate,
  requireRole(UserRole.SUPER_ADMIN),
  LandingPageController.resetDraft
);
