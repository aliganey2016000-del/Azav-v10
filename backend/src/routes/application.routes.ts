import { Router } from 'express';
import { ApplicationController } from '../controllers/application.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validateApplicationAccess } from '../middleware/idor.js';
import { UserRole } from '../types/index.js';

export const applicationRouter = Router();

applicationRouter.use(authenticate);

applicationRouter.post('/', ApplicationController.create);
applicationRouter.get('/', ApplicationController.list);
applicationRouter.get('/:id', validateApplicationAccess, ApplicationController.getById);

applicationRouter.patch(
  '/:id/status',
  requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF, UserRole.UNIVERSITY_ADMIN, UserRole.ORGANIZATION_ADMIN),
  validateApplicationAccess,
  ApplicationController.updateStatus
);
