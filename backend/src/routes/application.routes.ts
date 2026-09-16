import { Router } from 'express';
import { ApplicationController } from '../controllers/application.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validateApplicationAccess } from '../middleware/idor.js';
import { UserRole } from '../types/index.js';

export const applicationRouter = Router();

applicationRouter.use(authenticate);

applicationRouter.post(
  '/',
  requireRole(UserRole.STUDENT, UserRole.INDEPENDENT_APPLICANT),
  ApplicationController.create
);
applicationRouter.get(
  '/',
  requireRole(
    UserRole.SUPER_ADMIN,
    UserRole.AZAAM_STAFF,
    UserRole.UNIVERSITY_ADMIN,
    UserRole.UNIVERSITY_STAFF,
    UserRole.STUDENT,
    UserRole.INDEPENDENT_APPLICANT
  ),
  ApplicationController.list
);
applicationRouter.get('/:id', validateApplicationAccess, ApplicationController.getById);

applicationRouter.patch(
  '/:id/status',
  requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF, UserRole.UNIVERSITY_ADMIN),
  validateApplicationAccess,
  ApplicationController.updateStatus
);
