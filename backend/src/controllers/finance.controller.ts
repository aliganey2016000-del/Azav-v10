import { Request, Response } from 'express';
import { Payment } from '../models/Payment.js';

export class FinanceController {
  static async list(req: Request, res: Response) {
    const records = await Payment.find({ userId: req.user.userId }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: records });
  }
}
