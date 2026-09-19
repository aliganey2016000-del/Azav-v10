import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { JourneyService } from '../services/journey.service.js';
import { JourneyStageAction, JourneyStageKey } from '../models/JourneyMilestone.js';

export class JourneyController {
  static async getJourney(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'User not authenticated' } });
        return;
      }

      const data = await JourneyService.getJourney(req.params.id, req.user);
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
      const { action, reason, batchId } = req.body;

      if (!action || !Object.values(JourneyStageAction).includes(action)) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'A valid action (APPROVE, REQUEST_CORRECTION, REJECT) is required.' },
        });
        return;
      }

      const data = await JourneyService.actOnStage(
        req.params.id,
        stageKey,
        action,
        reason,
        batchId,
        req.user
      );
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: { code: error.code || 'SERVER_ERROR', message: error.message },
      });
    }
  }

  static async confirmPlacement(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'User not authenticated' } });
        return;
      }

      const data = await JourneyService.confirmPlacement(
        req.params.id,
        {
          organizationId: req.body.organizationId,
          departmentId: req.body.departmentId,
          supervisorId: req.body.supervisorId,
          startDate: req.body.startDate,
          endDate: req.body.endDate,
          documentIds: Array.isArray(req.body.documentIds) ? req.body.documentIds : [],
          comment: req.body.comment,
        },
        req.user
      );

      res.json({ success: true, data });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: { code: error.code || 'SERVER_ERROR', message: error.message },
      });
    }
  }

  static async addStageUpdate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'User not authenticated' } });
        return;
      }

      const stageKey = req.params.stageKey as JourneyStageKey;
      const { documentIds, comment } = req.body;

      const data = await JourneyService.addStageUpdate(
        req.params.id,
        stageKey,
        {
          documentIds: Array.isArray(documentIds) ? documentIds : [],
          comment,
        },
        req.user
      );

      res.json({ success: true, data });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: { code: error.code || 'SERVER_ERROR', message: error.message },
      });
    }
  }

  static async getChat(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'User not authenticated' } });
        return;
      }
      const data = await JourneyService.getChat(req.params.id, req.user);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: { code: error.code || 'SERVER_ERROR', message: error.message },
      });
    }
  }

  static async markChatRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'User not authenticated' } });
        return;
      }
      const data = await JourneyService.markChatRead(req.params.id, req.user);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: { code: error.code || 'SERVER_ERROR', message: error.message },
      });
    }
  }

  static async addComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'User not authenticated' } });
        return;
      }

      const stageKey = req.params.stageKey as JourneyStageKey;
      const { message } = req.body;

      const data = await JourneyService.addComment(req.params.id, stageKey, message, req.user);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: { code: error.code || 'SERVER_ERROR', message: error.message },
      });
    }
  }
}
