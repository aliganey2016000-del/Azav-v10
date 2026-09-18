import { Router } from 'express';
import { RotationController } from '../controllers/rotation.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { UserRole } from '../types/index.js';

export const rotationRouter = Router();

rotationRouter.use(authenticate);
rotationRouter.get('/', RotationController.list);

rotationRouter.post(
  '/plan',
  requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF),
  RotationController.createPlan
);

rotationRouter.delete(
  '/placement/:placementId',
  requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF),
  RotationController.deletePlan
);
