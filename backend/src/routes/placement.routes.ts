import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { PlacementController } from '../controllers/placement.controller.js';
import { AttendanceController } from '../controllers/attendance.controller.js';
import { LogbookController } from '../controllers/logbook.controller.js';
import { EvaluationController } from '../controllers/evaluation.controller.js';
import { CertificateController } from '../controllers/certificate.controller.js';
import { UniversityController, OrganizationController } from '../controllers/university.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validatePlacementAccess, validateAttachmentAccess } from '../middleware/idor.js';
import { UserRole } from '../types/index.js';

export const placementRouter = Router();
placementRouter.use(authenticate);
placementRouter.get('/', PlacementController.list);
placementRouter.post(
  '/',
  requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF, UserRole.ORGANIZATION_ADMIN),
  PlacementController.create
);

export const attendanceRouter = Router();
attendanceRouter.use(authenticate);
attendanceRouter.post('/', validateAttachmentAccess, AttendanceController.record);
attendanceRouter.get('/attachment/:attachmentId', validateAttachmentAccess, AttendanceController.listByAttachment);

export const logbookRouter = Router();
logbookRouter.use(authenticate);
logbookRouter.post('/', validateAttachmentAccess, LogbookController.create);
logbookRouter.get('/attachment/:attachmentId', validateAttachmentAccess, LogbookController.listByAttachment);
logbookRouter.patch(
  '/:id/review',
  requireRole(UserRole.CLINICAL_SUPERVISOR, UserRole.ORGANIZATION_ADMIN, UserRole.SUPER_ADMIN),
  LogbookController.review
);

export const evaluationRouter = Router();
evaluationRouter.use(authenticate);
evaluationRouter.post(
  '/',
  requireRole(UserRole.CLINICAL_SUPERVISOR, UserRole.ORGANIZATION_ADMIN, UserRole.SUPER_ADMIN),
  validateAttachmentAccess,
  EvaluationController.submit
);
evaluationRouter.get('/attachment/:attachmentId', validateAttachmentAccess, EvaluationController.listByAttachment);

const verifyRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    error: { code: 'TOO_MANY_REQUESTS', message: 'Too many certificate verification attempts. Please try again later.' },
  },
});

export const certificateRouter = Router();
// Public verification route with strict rate limiting - NO AUTH REQUIRED!
certificateRouter.get('/verify/:code', verifyRateLimiter, CertificateController.verifyPublic);

// Authenticated certificate routes
certificateRouter.use(authenticate);
certificateRouter.get('/', CertificateController.list);
certificateRouter.post(
  '/',
  requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF, UserRole.ORGANIZATION_ADMIN),
  CertificateController.issue
);
certificateRouter.post(
  '/:id/revoke',
  requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF, UserRole.ORGANIZATION_ADMIN),
  CertificateController.revoke
);

export const universityRouter = Router();
universityRouter.get('/', UniversityController.list);
universityRouter.post('/', authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF), UniversityController.create);

export const organizationRouter = Router();
organizationRouter.get('/', OrganizationController.list);
organizationRouter.post('/', authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF), OrganizationController.create);
organizationRouter.get('/:organizationId/departments', OrganizationController.listDepartments);
organizationRouter.get('/:organizationId/supervisors', OrganizationController.listSupervisors);
