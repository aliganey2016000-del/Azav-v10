import crypto from 'crypto';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { RecognitionAccessCode, RecognitionEvidence } from '../models/RecognitionEvidence.js';
import { StorageService } from '../services/storage.service.js';

const MAX_EVIDENCE_BYTES = 32 * 1024 * 1024;
const VIEW_SESSION_MINUTES = 15;
const ALLOWED_MIME_TYPES = new Set(['application/pdf']);
const ALLOWED_MIME_PREFIXES = ['image/'];

const hashValue = (value: string) => crypto.createHash('sha256').update(value).digest('hex');
const isAllowedMime = (mimeType: string) =>
  ALLOWED_MIME_TYPES.has(mimeType) || ALLOWED_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix));

const serializeEvidence = (record: any) => ({
  id: String(record._id),
  recognitionName: record.recognitionName,
  updatedAt: record.updatedAt,
  documents: (record.documents || []).map((doc: any) => ({
    id: String(doc._id),
    title: doc.title || doc.originalName,
    originalName: doc.originalName,
    mimeType: doc.mimeType,
    fileSize: doc.fileSize,
    createdAt: doc.createdAt,
  })),
});

const codeStatus = (record: any) => {
  if (record.revokedAt) return 'REVOKED';
  if (record.usedAt) return 'USED';
  if (new Date(record.expiresAt).getTime() <= Date.now()) return 'EXPIRED';
  return 'ACTIVE';
};

const serializeCode = (record: any) => ({
  id: String(record._id),
  recognitionName: record.recognitionName,
  expiresAt: record.expiresAt,
  usedAt: record.usedAt || null,
  revokedAt: record.revokedAt || null,
  createdAt: record.createdAt,
  status: codeStatus(record),
});

const streamDocument = async (req: AuthenticatedRequest, res: Response, next: NextFunction, doc: any) => {
  try {
    const fileSize = Number(doc.fileSize || 0);
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(doc.originalName)}`);
    res.setHeader('Cache-Control', 'no-store, private, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const rangeHeader = req.headers.range;
    const match = typeof rangeHeader === 'string' ? rangeHeader.match(/^bytes=(\d*)-(\d*)$/) : null;

    if (!match || fileSize === 0) {
      if (fileSize) res.setHeader('Content-Length', String(fileSize));
      const stream = await StorageService.getProvider().getFileStream(doc.storageKey);
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
    const stream = await StorageService.getProvider().getFileStream(doc.storageKey, { start, end });
    stream.on('error', next);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

export class RecognitionEvidenceController {
  static async adminOverview(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const [evidence, codes] = await Promise.all([
        RecognitionEvidence.find().sort({ updatedAt: -1 }).lean(),
        RecognitionAccessCode.find().sort({ createdAt: -1 }).limit(100).lean(),
      ]);

      res.status(200).json({
        success: true,
        data: {
          evidence: evidence.map(serializeEvidence),
          codes: codes.map(serializeCode),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async uploadDocument(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const recognitionName = String(req.body?.recognitionName || '').trim();
      const originalName = String(req.body?.originalName || '').trim();
      const mimeType = String(req.body?.mimeType || '').trim();
      const base64Data = String(req.body?.base64Data || '');
      const title = String(req.body?.title || originalName).trim();

      if (!recognitionName || !originalName || !mimeType || !base64Data) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'recognitionName, originalName, mimeType and base64Data are required.' },
        });
        return;
      }
      if (!isAllowedMime(mimeType)) {
        res.status(400).json({
          success: false,
          error: { code: 'UNSUPPORTED_DOCUMENT_TYPE', message: 'Recognition evidence supports PDF and image files only.' },
        });
        return;
      }

      const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      if (buffer.length > MAX_EVIDENCE_BYTES) {
        res.status(413).json({
          success: false,
          error: { code: 'EVIDENCE_TOO_LARGE', message: 'Recognition evidence files must be 32MB or smaller.' },
        });
        return;
      }

      const uploaded = await StorageService.getProvider().uploadFile({
        originalname: originalName,
        mimetype: mimeType,
        buffer,
      });

      const record = await RecognitionEvidence.findOneAndUpdate(
        { recognitionName },
        {
          $setOnInsert: { recognitionName },
          $push: {
            documents: {
              title,
              originalName,
              storageKey: uploaded.storageKey,
              mimeType,
              fileSize: uploaded.fileSize,
              createdAt: new Date(),
            },
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();

      res.status(201).json({ success: true, data: { evidence: serializeEvidence(record) } });
    } catch (error) {
      next(error);
    }
  }

  static async deleteDocument(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const recognitionName = String(req.body?.recognitionName || '').trim();
      const documentId = String(req.params.documentId || '').trim();
      const record = await RecognitionEvidence.findOne({ recognitionName });
      const doc = record ? (record.documents as any).id(documentId) : null;

      if (!record || !doc) {
        res.status(404).json({ success: false, error: { code: 'DOCUMENT_NOT_FOUND', message: 'Evidence document not found.' } });
        return;
      }

      await StorageService.getProvider().deleteFile(doc.storageKey).catch(() => {});
      doc.deleteOne();
      await record.save();

      res.status(200).json({ success: true, data: { evidence: serializeEvidence(record.toObject()) } });
    } catch (error) {
      next(error);
    }
  }

  static async generateCode(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const recognitionName = String(req.body?.recognitionName || '').trim();
      const requestedMinutes = Number(req.body?.expiresInMinutes || 30);
      const expiresInMinutes = Math.max(5, Math.min(120, Number.isFinite(requestedMinutes) ? requestedMinutes : 30));

      if (!recognitionName) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Choose a recognition before generating a code.' } });
        return;
      }

      const evidence = await RecognitionEvidence.findOne({ recognitionName }).lean();
      if (!evidence?.documents?.length) {
        res.status(400).json({ success: false, error: { code: 'NO_EVIDENCE', message: 'Upload at least one evidence document before generating an access code.' } });
        return;
      }

      let code = '';
      let codeHash = '';
      for (let attempt = 0; attempt < 12; attempt += 1) {
        code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
        codeHash = hashValue(code);
        const collision = await RecognitionAccessCode.exists({
          codeHash,
          usedAt: null,
          revokedAt: null,
          expiresAt: { $gt: new Date() },
        });
        if (!collision) break;
        code = '';
      }

      if (!code) {
        const err: any = new Error('Unable to generate a unique access code. Please try again.');
        err.statusCode = 503;
        err.code = 'CODE_GENERATION_FAILED';
        throw err;
      }

      const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
      const record = await RecognitionAccessCode.create({
        recognitionName,
        codeHash,
        expiresAt,
        createdBy: req.user!.userId,
      });

      res.status(201).json({
        success: true,
        data: {
          code,
          accessCode: serializeCode(record.toObject()),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async revokeCode(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const record = await RecognitionAccessCode.findByIdAndUpdate(
        req.params.id,
        { $set: { revokedAt: new Date(), viewTokenHash: null, viewExpiresAt: null } },
        { new: true }
      ).lean();

      if (!record) {
        res.status(404).json({ success: false, error: { code: 'CODE_NOT_FOUND', message: 'Access code not found.' } });
        return;
      }

      res.status(200).json({ success: true, data: { accessCode: serializeCode(record) } });
    } catch (error) {
      next(error);
    }
  }

  static async verifyCode(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const recognitionName = String(req.body?.recognitionName || '').trim();
      const code = String(req.body?.code || '').trim();

      if (!recognitionName || !/^\d{6}$/.test(code)) {
        res.status(400).json({ success: false, error: { code: 'INVALID_CODE', message: 'Enter the 6-digit access code.' } });
        return;
      }

      const evidence = await RecognitionEvidence.findOne({ recognitionName }).lean();
      if (!evidence?.documents?.length) {
        res.status(404).json({ success: false, error: { code: 'NO_EVIDENCE', message: 'No evidence documents are currently available for this recognition.' } });
        return;
      }

      const now = new Date();
      const viewToken = crypto.randomBytes(32).toString('hex');
      const viewExpiresAt = new Date(Date.now() + VIEW_SESSION_MINUTES * 60 * 1000);

      const accessCode = await RecognitionAccessCode.findOneAndUpdate(
        {
          recognitionName,
          codeHash: hashValue(code),
          usedAt: null,
          revokedAt: null,
          expiresAt: { $gt: now },
        },
        {
          $set: {
            usedAt: now,
            viewTokenHash: hashValue(viewToken),
            viewExpiresAt,
          },
        },
        { new: true }
      ).lean();

      if (!accessCode) {
        res.status(401).json({
          success: false,
          error: { code: 'ACCESS_DENIED', message: 'This code is invalid, expired, revoked, or has already been used.' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          recognitionName,
          viewExpiresAt,
          documents: evidence.documents.map((doc: any) => ({
            id: String(doc._id),
            title: doc.title || doc.originalName,
            originalName: doc.originalName,
            mimeType: doc.mimeType,
            url: `/api/v1/recognition-evidence/view/${viewToken}/${doc._id}`,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async viewDocument(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = String(req.params.token || '');
      const documentId = String(req.params.documentId || '');

      const access = await RecognitionAccessCode.findOne({
        viewTokenHash: hashValue(token),
        revokedAt: null,
        viewExpiresAt: { $gt: new Date() },
      }).lean();

      if (!access) {
        res.status(401).json({ success: false, error: { code: 'VIEW_SESSION_EXPIRED', message: 'This protected viewing session has expired.' } });
        return;
      }

      const evidence = await RecognitionEvidence.findOne({ recognitionName: access.recognitionName });
      const doc = evidence ? (evidence.documents as any).id(documentId) : null;
      if (!evidence || !doc) {
        res.status(404).json({ success: false, error: { code: 'DOCUMENT_NOT_FOUND', message: 'Evidence document not found.' } });
        return;
      }

      await streamDocument(req, res, next, doc);
    } catch (error) {
      next(error);
    }
  }
}
