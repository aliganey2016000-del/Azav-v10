import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { CertificateService } from '../services/certificate.service.js';

export class CertificateController {
  static async issue(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not logged in' } });
        return;
      }

      const { attachmentId } = req.body;
      if (!attachmentId) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'attachmentId is required' } });
        return;
      }

      const certificate = await CertificateService.issueCertificate(
        req.user.userId,
        attachmentId,
        req.ip,
        req.get('user-agent')
      );
      res.status(201).json({
        success: true,
        data: { certificate },
      });
    } catch (error) {
      next(error);
    }
  }

  static async revoke(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not logged in' } });
        return;
      }

      const { reason } = req.body;
      const certId = req.params.id;

      if (!reason) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Revocation reason is required.' },
        });
        return;
      }

      const updatedCert = await CertificateService.revokeCertificate(
        certId,
        reason,
        req.user,
        req.ip,
        req.get('user-agent')
      );

      res.status(200).json({
        success: true,
        data: { certificate: updatedCert },
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

      const result = await CertificateService.listCertificates(
        {
          page: Number(req.query.page),
          limit: Number(req.query.limit),
          status: req.query.status as string,
          organizationId: req.query.organizationId as string,
          search: req.query.search as string,
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

  static async verifyPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const code = req.params.code || (req.query.code as string);
      if (!code) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Certificate number or verification code is required.' },
        });
        return;
      }

      const result = await CertificateService.verifyCertificatePublic(code);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
