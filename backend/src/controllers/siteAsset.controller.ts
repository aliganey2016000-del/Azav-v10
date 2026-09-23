import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { SiteAssetService } from '../services/siteAsset.service.js';

export class SiteAssetController {
  static async upload(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { originalName, mimeType, base64Data } = req.body;

      if (!originalName || !mimeType || !base64Data) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'originalName, mimeType, and base64Data are required.' },
        });
        return;
      }

      const cleanBase64 = String(base64Data).replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');

      const asset = await SiteAssetService.uploadAsset(
        { originalname: originalName, mimetype: mimeType, buffer },
        req.user!.userId
      );

      res.status(201).json({ success: true, data: asset });
    } catch (error) {
      next(error);
    }
  }

  static async serve(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { buffer, mimeType, originalName } = await SiteAssetService.getAssetFile(req.params.id);
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(originalName)}`);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
}
