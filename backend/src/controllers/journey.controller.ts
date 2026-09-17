import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { JourneyService } from '../services/journey.service.js';
import { JourneyStageAction, JourneyStageKey } from '../models/JourneyMilestone.js';

export class JourneyController {
  static async getJourney(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await JourneyService.getJourney(req.params.id);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: { code: error.code || 'SERVER_ERROR', message: error.message },
      });
    }
  }

  static async actOnStage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'User not authenticated' } });
        return;
      }

      const stageKey = req.params.stageKey as JourneyStageKey;
      const { action, reason } = req.body;

      if (!action || !Object.values(JourneyStageAction).includes(action)) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'A valid action (APPROVE, REQUEST_CORRECTION, REJECT) is required.' },
        });
        return;
      }

      const data = await JourneyService.actOnStage(req.params.id, stageKey, action, reason, req.user);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: { code: error.code || 'SERVER_ERROR', message: error.message },
      });
    }
  }
}
