import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { DocumentService } from '../services/document.service.js';
import { DocumentStatus, DocumentCategory, DocumentOwnerType } from '../types/index.js';

export class DocumentController {
  static async upload(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not logged in' } });
        return;
      }

      const {
        originalName,
        mimeType,
        base64Data,
        type,
        ownerType,
        ownerId,
        studentId,
        applicationId,
        universityId,
        organizationId,
      } = req.body;

      if (!originalName || !mimeType || !base64Data) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'originalName, mimeType, and base64Data payload are required.' },
        });
        return;
      }

      // Convert base64 payload to buffer
      const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');

      const doc = await DocumentService.uploadDocument(
        { originalname: originalName, mimetype: mimeType, buffer },
        {
          type: (type as DocumentCategory) || DocumentCategory.OTHER,
          ownerType: ownerType as DocumentOwnerType,
          ownerId,
          studentId,
          applicationId,
          universityId,
          organizationId,
        },
        req.user,
        req.ip,
        req.get('user-agent')
      );

      res.status(201).json({
        success: true,
        data: { document: doc },
      });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not logged in' } });
        return;
      }

      const result = await DocumentService.listDocuments(
        {
          page: Number(req.query.page),
          limit: Number(req.query.limit),
          type: req.query.type as string,
          status: req.query.status as string,
          search: req.query.search as string,
          studentId: req.query.studentId as string,
          applicationId: req.query.applicationId as string,
          universityId: req.query.universityId as string,
          organizationId: req.query.organizationId as string,
        },
        req.user
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not logged in' } });
        return;
      }

      const doc = await DocumentService.getDocumentById(req.params.id, req.user);

      res.status(200).json({
        success: true,
        data: { document: doc },
      });
    } catch (error) {
      next(error);
    }
  }

  static async download(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not logged in' } });
        return;
      }

      const { buffer, document: doc } = await DocumentService.downloadDocument(
        req.params.id,
        req.user,
        req.ip,
        req.get('user-agent')
      );

      res.setHeader('Content-Type', doc.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.originalName)}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not logged in' } });
        return;
      }

      const { status, rejectionReason } = req.body;
      if (!status || !Object.values(DocumentStatus).includes(status)) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Valid document status is required' },
        });
        return;
      }

      const updatedDoc = await DocumentService.updateDocumentStatus(
        req.params.id,
        status,
        rejectionReason,
        req.user,
        req.ip,
        req.get('user-agent')
      );

      res.status(200).json({
        success: true,
        data: { document: updatedDoc },
      });
    } catch (error) {
      next(error);
    }
  }
}
