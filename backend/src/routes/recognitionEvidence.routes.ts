import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { RecognitionEvidenceController } from '../controllers/recognitionEvidence.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { UserRole } from '../types/index.js';

export const recognitionEvidenceRouter = Router();

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    error: { code: 'TOO_MANY_ATTEMPTS', message: 'Too many access-code attempts. Please try again later.' },
  },
});

// Public verification is intentionally narrow: a short-lived, single-use code is required.
recognitionEvidenceRouter.post('/verify', verifyLimiter, RecognitionEvidenceController.verifyCode);
recognitionEvidenceRouter.get('/view/:token/:documentId', RecognitionEvidenceController.viewDocument);

recognitionEvidenceRouter.get(
  '/admin',
  authenticate,
  requireRole(UserRole.SUPER_ADMIN),
  RecognitionEvidenceController.adminOverview
);
recognitionEvidenceRouter.post(
  '/admin/documents',
  authenticate,
  requireRole(UserRole.SUPER_ADMIN),
  RecognitionEvidenceController.uploadDocument
);
recognitionEvidenceRouter.delete(
  '/admin/documents/:documentId',
  authenticate,
  requireRole(UserRole.SUPER_ADMIN),
  RecognitionEvidenceController.deleteDocument
);
recognitionEvidenceRouter.post(
  '/admin/codes',
  authenticate,
  requireRole(UserRole.SUPER_ADMIN),
  RecognitionEvidenceController.generateCode
);
recognitionEvidenceRouter.post(
  '/admin/codes/:id/revoke',
  authenticate,
  requireRole(UserRole.SUPER_ADMIN),
  RecognitionEvidenceController.revokeCode
);
