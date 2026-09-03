import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { EvaluationService } from '../services/evaluation.service.js';

export class EvaluationController {
  static async submit(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not logged in' } });
        return;
      }

      const {
        attachmentId,
        studentId,
        supervisorId,
        type,
        clinicalCompetency,
        professionalism,
        patientCommunication,
        medicalKnowledge,
        comments,
      } = req.body;

      if (!attachmentId || !studentId || !supervisorId || !type) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'attachmentId, studentId, supervisorId, type are required' },
        });
        return;
      }

      const evaluation = await EvaluationService.submitEvaluation(req.user.userId, {
        attachmentId,
        studentId,
        supervisorId,
        type,
        clinicalCompetency: Number(clinicalCompetency) || 5,
        professionalism: Number(professionalism) || 5,
        patientCommunication: Number(patientCommunication) || 5,
        medicalKnowledge: Number(medicalKnowledge) || 5,
        comments,
      });

      res.status(201).json({
        success: true,
        data: { evaluation },
      });
    } catch (error) {
      next(error);
    }
  }

  static async listByAttachment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { attachmentId } = req.params;
      const evaluations = await EvaluationService.getEvaluations(attachmentId);
      res.status(200).json({
        success: true,
        data: { evaluations },
      });
    } catch (error) {
      next(error);
    }
  }
}
