import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { StudentAdminService } from '../services/studentAdmin.service.js';

export class StudentAdminController {
  static async nominate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'User not authenticated' } });
        return;
      }
      const data = await StudentAdminService.nominateStudent(req.body, req.user, req.body.universityId);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: { code: error.code || 'SERVER_ERROR', message: error.message } });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'User not authenticated' } });
        return;
      }
      const data = await StudentAdminService.updateNomination(req.params.id, req.body, req.user);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: { code: error.code || 'SERVER_ERROR', message: error.message } });
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'User not authenticated' } });
        return;
      }
      const data = await StudentAdminService.getStudentById(req.params.id, req.user);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: { code: error.code || 'SERVER_ERROR', message: error.message } });
    }
  }

  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'User not authenticated' } });
        return;
      }
      const { page, limit, search, universityId } = req.query;
      const result = await StudentAdminService.listStudents(
        { page: Number(page) || undefined, limit: Number(limit) || undefined, search: search as string, universityId: universityId as string },
        req.user
      );
      res.json({ success: true, data: result.students, pagination: result.pagination });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, error: { code: error.code || 'SERVER_ERROR', message: error.message } });
    }
  }
}
