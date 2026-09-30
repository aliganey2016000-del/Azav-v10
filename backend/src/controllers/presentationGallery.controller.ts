import crypto from 'crypto';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { PresentationGallery } from '../models/PresentationGallery.js';
import { StorageService } from '../services/storage.service.js';

const MAX_MEDIA_BYTES = 32 * 1024 * 1024;
const ALLOWED_PREFIXES = ['image/', 'video/'];

const createToken = () => crypto.randomBytes(24).toString('hex');

const assertGalleryAvailable = (gallery: any) => {
  if (!gallery || !gallery.isActive) {
    const err: any = new Error('This presentation is not available.');
    err.statusCode = 404;
    err.code = 'PRESENTATION_NOT_AVAILABLE';
    throw err;
  }
  if (gallery.expiresAt && new Date(gallery.expiresAt).getTime() < Date.now()) {
    const err: any = new Error('This presentation link has expired.');
    err.statusCode = 410;
    err.code = 'PRESENTATION_EXPIRED';
    throw err;
  }
};

const adminMediaPath = (galleryId: string, mediaId: string) =>
  `/api/v1/presentation-galleries/${galleryId}/media/${mediaId}/stream`;

const sharedMediaPath = (token: string, mediaId: string) =>
  `/api/v1/presentation-galleries/share/${token}/media/${mediaId}`;

const serializeAdmin = (gallery: any) => ({
  id: String(gallery._id),
  title: gallery.title,
  description: gallery.description || '',
  audienceNote: gallery.audienceNote || '',
  shareToken: gallery.shareToken,
  sharePath: `/presentation/${gallery.shareToken}`,
  isActive: Boolean(gallery.isActive),
  expiresAt: gallery.expiresAt || null,
  createdAt: gallery.createdAt,
  updatedAt: gallery.updatedAt,
  media: (gallery.media || []).map((item: any) => ({
    id: String(item._id),
    type: item.type,
    title: item.title || '',
    caption: item.caption || '',
    originalName: item.originalName,
    mimeType: item.mimeType,
    fileSize: item.fileSize,
    createdAt: item.createdAt,
    url: adminMediaPath(String(gallery._id), String(item._id)),
  })),
});

const serializeShared = (gallery: any) => ({
  id: String(gallery._id),
  title: gallery.title,
  description: gallery.description || '',
  audienceNote: gallery.audienceNote || '',
  expiresAt: gallery.expiresAt || null,
  media: (gallery.media || []).map((item: any) => ({
    id: String(item._id),
    type: item.type,
    title: item.title || '',
    caption: item.caption || '',
    originalName: item.originalName,
    mimeType: item.mimeType,
    url: sharedMediaPath(gallery.shareToken, String(item._id)),
  })),
});

const streamStoredMedia = async (req: AuthenticatedRequest, res: Response, next: NextFunction, media: any) => {
  try {
    res.setHeader('Content-Type', media.mimeType);
    res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(media.originalName)}`);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    const rangeHeader = req.headers.range;
    const match = typeof rangeHeader === 'string' ? rangeHeader.match(/^bytes=(\d*)-(\d*)$/) : null;
    const fileSize = Number(media.fileSize || 0);

    if (!match || fileSize === 0) {
      res.setHeader('Content-Length', String(fileSize));
      const stream = await StorageService.getProvider().getFileStream(media.storageKey);
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
    const stream = await StorageService.getProvider().getFileStream(media.storageKey, { start, end });
    stream.on('error', next);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

export class PresentationGalleryController {
  static async list(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const galleries = await PresentationGallery.find().sort({ updatedAt: -1 }).lean();
      res.status(200).json({ success: true, data: { galleries: galleries.map(serializeAdmin) } });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const title = String(req.body?.title || '').trim();
      if (!title) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Presentation title is required.' } });
        return;
      }

      const gallery = await PresentationGallery.create({
        title,
        description: String(req.body?.description || '').trim(),
        audienceNote: String(req.body?.audienceNote || '').trim(),
        shareToken: createToken(),
        isActive: true,
        expiresAt: req.body?.expiresAt ? new Date(req.body.expiresAt) : null,
        media: [],
        createdBy: req.user!.userId,
      });

      res.status(201).json({ success: true, data: { gallery: serializeAdmin(gallery.toObject()) } });
    } catch (error) {
      next(error);
    }
  }

  static async getOne(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const gallery = await PresentationGallery.findById(req.params.id).lean();
      if (!gallery) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Presentation not found.' } });
        return;
      }
      res.status(200).json({ success: true, data: { gallery: serializeAdmin(gallery) } });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const patch: Record<string, unknown> = {};
      if (typeof req.body?.title === 'string') patch.title = req.body.title.trim();
      if (typeof req.body?.description === 'string') patch.description = req.body.description.trim();
      if (typeof req.body?.audienceNote === 'string') patch.audienceNote = req.body.audienceNote.trim();
      if (typeof req.body?.isActive === 'boolean') patch.isActive = req.body.isActive;
      if ('expiresAt' in (req.body || {})) patch.expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : null;

      const gallery = await PresentationGallery.findByIdAndUpdate(req.params.id, { $set: patch }, { new: true }).lean();
      if (!gallery) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Presentation not found.' } });
        return;
      }
      res.status(200).json({ success: true, data: { gallery: serializeAdmin(gallery) } });
    } catch (error) {
      next(error);
    }
  }

  static async regenerateLink(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const gallery = await PresentationGallery.findByIdAndUpdate(
        req.params.id,
        { $set: { shareToken: createToken(), isActive: true } },
        { new: true }
      ).lean();
      if (!gallery) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Presentation not found.' } });
        return;
      }
      res.status(200).json({ success: true, data: { gallery: serializeAdmin(gallery) } });
    } catch (error) {
      next(error);
    }
  }

  static async remove(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const gallery = await PresentationGallery.findById(req.params.id);
      if (!gallery) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Presentation not found.' } });
        return;
      }
      await Promise.all(gallery.media.map((item) => StorageService.getProvider().deleteFile(item.storageKey).catch(() => {})));
      await gallery.deleteOne();
      res.status(200).json({ success: true, data: { deleted: true } });
    } catch (error) {
      next(error);
    }
  }

  static async uploadMedia(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const gallery = await PresentationGallery.findById(req.params.id);
      if (!gallery) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Presentation not found.' } });
        return;
      }

      const originalName = String(req.body?.originalName || '').trim();
      const mimeType = String(req.body?.mimeType || '').trim();
      const base64Data = String(req.body?.base64Data || '');
      if (!originalName || !mimeType || !base64Data) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'originalName, mimeType and base64Data are required.' } });
        return;
      }
      if (!ALLOWED_PREFIXES.some((prefix) => mimeType.startsWith(prefix))) {
        res.status(400).json({ success: false, error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Only image and video files are supported.' } });
        return;
      }

      const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      if (buffer.length > MAX_MEDIA_BYTES) {
        res.status(413).json({ success: false, error: { code: 'MEDIA_TOO_LARGE', message: 'Presentation media must be 32MB or smaller per file.' } });
        return;
      }

      const uploaded = await StorageService.getProvider().uploadFile({ originalname: originalName, mimetype: mimeType, buffer });
      gallery.media.push({
        type: mimeType.startsWith('video/') ? 'VIDEO' : 'IMAGE',
        title: String(req.body?.title || '').trim(),
        caption: String(req.body?.caption || '').trim(),
        originalName,
        storageKey: uploaded.storageKey,
        mimeType,
        fileSize: uploaded.fileSize,
        createdAt: new Date(),
      });
      await gallery.save();

      res.status(201).json({ success: true, data: { gallery: serializeAdmin(gallery.toObject()) } });
    } catch (error) {
      next(error);
    }
  }

  static async removeMedia(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const gallery = await PresentationGallery.findById(req.params.id);
      if (!gallery) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Presentation not found.' } });
        return;
      }
      const media = (gallery.media as any).id(req.params.mediaId) as any;
      if (!media) {
        res.status(404).json({ success: false, error: { code: 'MEDIA_NOT_FOUND', message: 'Media item not found.' } });
        return;
      }

      await StorageService.getProvider().deleteFile(media.storageKey).catch(() => {});
      media.deleteOne();
      await gallery.save();
      res.status(200).json({ success: true, data: { gallery: serializeAdmin(gallery.toObject()) } });
    } catch (error) {
      next(error);
    }
  }

  static async adminStream(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const gallery = await PresentationGallery.findById(req.params.id);
      const media = gallery ? (gallery.media as any).id(req.params.mediaId) as any : null;
      if (!gallery || !media) {
        res.status(404).json({ success: false, error: { code: 'MEDIA_NOT_FOUND', message: 'Media item not found.' } });
        return;
      }
      await streamStoredMedia(req, res, next, media);
    } catch (error) {
      next(error);
    }
  }

  static async getShared(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const gallery = await PresentationGallery.findOne({ shareToken: req.params.token }).lean();
      assertGalleryAvailable(gallery);
      res.status(200).json({ success: true, data: { gallery: serializeShared(gallery) } });
    } catch (error) {
      next(error);
    }
  }

  static async sharedStream(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const gallery = await PresentationGallery.findOne({ shareToken: req.params.token });
      assertGalleryAvailable(gallery);
      const media = gallery?.media.id(req.params.mediaId) as any;
      if (!media) {
        res.status(404).json({ success: false, error: { code: 'MEDIA_NOT_FOUND', message: 'Media item not found.' } });
        return;
      }
      await streamStoredMedia(req, res, next, media);
    } catch (error) {
      next(error);
    }
  }
}
