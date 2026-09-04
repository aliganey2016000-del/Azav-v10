import { Request, Response } from 'express';
import { Notification } from '../models/Notification.js';

export class NotificationController {
  static async list(req: Request, res: Response) {
    const notifications = await Notification.find({ userId: (req as any).user?.userId }).sort({ createdAt: -1 }).limit(100).lean();
    res.json({ success: true, data: notifications });
  }

  static async markRead(req: Request, res: Response) {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: (req as any).user?.userId },
      { read: true },
      { new: true }
    ).lean();
    if (!notification) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } });
    res.json({ success: true, data: notification });
  }
}
