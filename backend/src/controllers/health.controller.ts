import { Request, Response } from 'express';
import { isDatabaseConnected } from '../config/database.js';

export class HealthController {
  static getHealth(_req: Request, res: Response): void {
    res.status(200).json({
      success: true,
      data: {
        status: 'UP',
        timestamp: new Date().toISOString(),
        service: 'AZAAM International Medics Network Backend',
      },
    });
  }

  static getReady(_req: Request, res: Response): void {
    const dbConnected = isDatabaseConnected();

    if (dbConnected) {
      res.status(200).json({
        success: true,
        data: {
          status: 'READY',
          database: 'MongoDB Connected',
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      res.status(503).json({
        success: false,
        error: {
          code: 'DATABASE_DISCONNECTED',
          message: 'MongoDB database connectivity is not available',
        },
      });
    }
  }
}
