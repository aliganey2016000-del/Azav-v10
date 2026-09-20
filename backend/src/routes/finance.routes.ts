import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { FinanceController } from '../controllers/finance.controller.js';
import { FinancePricingController } from '../controllers/financePricing.controller.js';
import { UserRole } from '../types/index.js';

export const financeRouter = Router();

financeRouter.use(authenticate);

financeRouter.get('/pricing', FinancePricingController.list);
financeRouter.get('/pricing/resolved', FinancePricingController.resolved);
financeRouter.get('/pricing/profile', FinancePricingController.profile);
financeRouter.post(
  '/pricing',
  requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF),
  FinancePricingController.create
);
financeRouter.post(
  '/pricing/university-bulk',
  requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF),
  FinancePricingController.bulkUniversity
);
financeRouter.patch(
  '/pricing/:id',
  requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF),
  FinancePricingController.update
);
financeRouter.patch(
  '/pricing/:id/status',
  requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF),
  FinancePricingController.toggleStatus
);

financeRouter.get(
  '/settlement-context',
  requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF),
  FinanceController.settlementContext
);

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
