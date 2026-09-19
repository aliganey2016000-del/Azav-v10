import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { FinanceController } from '../controllers/finance.controller.js';
import { UserRole } from '../types/index.js';

export const financeRouter = Router();

financeRouter.use(authenticate);
financeRouter.get('/', FinanceController.list);

financeRouter.post(
  '/',
  requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF),
  FinanceController.create
);

financeRouter.patch(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF),
  FinanceController.update
);

financeRouter.post(
  '/:id/refund',
  requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF),
  FinanceController.refund
);

financeRouter.post(
  '/:id/void',
  requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF),
  FinanceController.voidRecord
);
