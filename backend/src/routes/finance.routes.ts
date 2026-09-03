import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { FinanceController } from '../controllers/finance.controller.js';

export const financeRouter = Router();
financeRouter.use(authenticate);
financeRouter.get('/', FinanceController.list);
