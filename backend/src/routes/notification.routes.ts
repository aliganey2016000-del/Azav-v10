import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { NotificationController } from '../controllers/notification.controller.js';

export const notificationRouter = Router();
notificationRouter.use(authenticate);
notificationRouter.get('/', NotificationController.list);
notificationRouter.patch('/:id/read', NotificationController.markRead);
