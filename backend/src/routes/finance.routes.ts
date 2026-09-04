import { Router } from 'express';
import { FinanceController } from '../controllers/finance.controller.js';
import { authenticate } from '../middleware/auth.js';

export const financeRouter = Router();
financeRouter.use(authenticate);

financeRouter.get('/overview', FinanceController.overview);
financeRouter.get('/', FinanceController.list);
