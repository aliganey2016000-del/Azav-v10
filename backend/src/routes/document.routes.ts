import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { UserRole } from '../types/index.js';

export const documentRouter = Router();

// All document routes require authentication
documentRouter.use(authenticate);

documentRouter.post('/upload', DocumentController.upload);
documentRouter.get('/', DocumentController.list);
documentRouter.get('/:id', DocumentController.getById);
documentRouter.get('/:id/download', DocumentController.download);
documentRouter.patch(
  '/:id/status',
  requireRole(
    UserRole.SUPER_ADMIN,
    UserRole.AZAAM_STAFF,
    UserRole.UNIVERSITY_ADMIN,
    UserRole.UNIVERSITY_STAFF,
    UserRole.ORGANIZATION_ADMIN,
    UserRole.ORGANIZATION_STAFF,
    UserRole.CLINICAL_SUPERVISOR
  ),
  DocumentController.updateStatus
);
