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
      const { storageKey, mimeType, originalName, fileSize } = await SiteAssetService.getAssetMeta(req.params.id);

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(originalName)}`);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Accept-Ranges', 'bytes');

      const rangeHeader = req.headers.range;
      const match = typeof rangeHeader === 'string' ? rangeHeader.match(/^bytes=(\d*)-(\d*)$/) : null;

      if (!match || fileSize === 0) {
        res.setHeader('Content-Length', String(fileSize));
        const stream = await SiteAssetService.getAssetStream(storageKey);
        stream.on('error', next);
        stream.pipe(res);
        return;
      }

      const start = match[1] ? parseInt(match[1], 10) : Math.max(fileSize - parseInt(match[2], 10), 0);
      const end = match[2] && match[1] ? Math.min(parseInt(match[2], 10), fileSize - 1) : fileSize - 1;

      if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= fileSize) {
        res.status(416).setHeader('Content-Range', `bytes */${fileSize}`).end();
        return;
      }

      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Content-Length', String(end - start + 1));

      const stream = await SiteAssetService.getAssetStream(storageKey, { start, end });
      stream.on('error', next);
      stream.pipe(res);
    } catch (error) {
      next(error);
    }
  }
}
