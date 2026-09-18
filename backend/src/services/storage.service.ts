import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { env } from '../config/env.js';

export interface FilePayload {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

export interface StorageUploadResult {
  storageKey: string;
  fileSize: number;
}

export interface IStorageProvider {
  uploadFile(file: FilePayload): Promise<StorageUploadResult>;
  getFile(storageKey: string): Promise<Buffer>;
  deleteFile(storageKey: string): Promise<void>;
}

// 1. Local Storage Implementation
export class LocalStorageProvider implements IStorageProvider {
  private uploadDir: string;

  constructor(uploadDirRelative = process.env.STORAGE_LOCAL_DIR || 'uploads') {
    this.uploadDir = path.resolve(process.cwd(), uploadDirRelative);
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: FilePayload): Promise<StorageUploadResult> {
    const ext = path.extname(file.originalname).toLowerCase() || '.bin';
    const randomName = `doc_${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`;
    const filePath = path.join(this.uploadDir, randomName);

    // Prevent path traversal outside uploadDir
    if (!filePath.startsWith(this.uploadDir)) {
      const err: any = new Error('Invalid storage path detection');
      err.statusCode = 400;
      throw err;
    }

    await fs.promises.writeFile(filePath, file.buffer);

    return {
      storageKey: randomName,
      fileSize: file.buffer.length,
    };
  }

  async getFile(storageKey: string): Promise<Buffer> {
    const safeKey = path.basename(storageKey);
    const filePath = path.join(this.uploadDir, safeKey);

    if (!fs.existsSync(filePath)) {
      const err: any = new Error('File not found on storage');
      err.statusCode = 404;
      throw err;
    }

    return await fs.promises.readFile(filePath);
  }

  async deleteFile(storageKey: string): Promise<void> {
    const safeKey = path.basename(storageKey);
    const filePath = path.join(this.uploadDir, safeKey);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }
}

// Durable MongoDB GridFS storage. Production uses this by default so files survive
// application container rebuilds/redeployments as long as MongoDB itself is persistent.
export class MongoGridFSStorageProvider implements IStorageProvider {
  private bucketName = process.env.STORAGE_BUCKET || env.STORAGE_BUCKET || 'azaam_documents';

  private getBucket(): mongoose.mongo.GridFSBucket {
    const db = mongoose.connection.db;
    if (!db) {
      const err: any = new Error('Document storage is not ready because MongoDB is not connected.');
      err.statusCode = 503;
      err.code = 'STORAGE_NOT_READY';
      throw err;
    }
    return new mongoose.mongo.GridFSBucket(db, { bucketName: this.bucketName });
  }

  async uploadFile(file: FilePayload): Promise<StorageUploadResult> {
    const bucket = this.getBucket();
    const stream = bucket.openUploadStream(
      `doc_${Date.now()}_${crypto.randomBytes(8).toString('hex')}${path.extname(file.originalname).toLowerCase() || '.bin'}`,
      {
        metadata: {
          originalName: file.originalname,
          mimeType: file.mimetype,
        },
      }
    );

    await new Promise<void>((resolve, reject) => {
      stream.on('error', reject);
      stream.on('finish', () => resolve());
      stream.end(file.buffer);
    });

    return {
      storageKey: `gridfs:${stream.id.toString()}`,
      fileSize: file.buffer.length,
    };
  }

  async getFile(storageKey: string): Promise<Buffer> {
    const rawId = storageKey.replace(/^gridfs:/, '');
    if (!mongoose.Types.ObjectId.isValid(rawId)) {
      const err: any = new Error('Invalid document storage key.');
      err.statusCode = 400;
      err.code = 'INVALID_STORAGE_KEY';
      throw err;
    }

    const bucket = this.getBucket();
    const chunks: Buffer[] = [];

    return await new Promise<Buffer>((resolve, reject) => {
      const stream = bucket.openDownloadStream(new mongoose.Types.ObjectId(rawId));
      stream.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
      stream.on('error', (error: any) => {
        const err: any = new Error(
          error?.code === 'ENOENT' ? 'File not found in durable storage.' : 'Unable to read document from durable storage.'
        );
        err.statusCode = error?.code === 'ENOENT' ? 404 : 500;
        err.code = error?.code === 'ENOENT' ? 'FILE_NOT_FOUND' : 'STORAGE_READ_ERROR';
        reject(err);
      });
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  async deleteFile(storageKey: string): Promise<void> {
    const rawId = storageKey.replace(/^gridfs:/, '');
    if (!mongoose.Types.ObjectId.isValid(rawId)) return;
    const bucket = this.getBucket();
    try {
      await bucket.delete(new mongoose.Types.ObjectId(rawId));
    } catch (error: any) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
}

// Production compatibility provider:
// - all NEW uploads go to durable MongoDB GridFS;
// - legacy local keys are still readable if their files remain on disk.
export class DurableProductionStorageProvider implements IStorageProvider {
  private durable = new MongoGridFSStorageProvider();
  private legacyLocal = new LocalStorageProvider();

  async uploadFile(file: FilePayload): Promise<StorageUploadResult> {
    return this.durable.uploadFile(file);
  }

  async getFile(storageKey: string): Promise<Buffer> {
    if (storageKey.startsWith('gridfs:')) {
      return this.durable.getFile(storageKey);
    }

    try {
      return await this.legacyLocal.getFile(storageKey);
    } catch (error: any) {
      if (error?.statusCode === 404) {
        const err: any = new Error(
          'This legacy file is no longer present on the old container storage. Please re-upload the document once; new uploads are now stored durably.'
        );
        err.statusCode = 410;
        err.code = 'LEGACY_FILE_MISSING';
        throw err;
      }
      throw error;
    }
  }

  async deleteFile(storageKey: string): Promise<void> {
    if (storageKey.startsWith('gridfs:')) {
      return this.durable.deleteFile(storageKey);
    }
    return this.legacyLocal.deleteFile(storageKey);
  }
}

// 2. S3 provider placeholder. Do not silently fall back to local disk: doing so
// would make operators believe documents are durable in object storage when they
// are actually tied to an ephemeral container filesystem.
export class S3StorageProvider implements IStorageProvider {
  private unavailable(): never {
    const err: any = new Error('S3 storage is not implemented in this build. Configure STORAGE_PROVIDER=local with persistent storage, or install a real S3 provider before selecting s3.');
    err.statusCode = 503;
    err.code = 'STORAGE_PROVIDER_UNAVAILABLE';
    throw err;
  }

  async uploadFile(_file: FilePayload): Promise<StorageUploadResult> {
    return this.unavailable();
  }

  async getFile(_storageKey: string): Promise<Buffer> {
    return this.unavailable();
  }

  async deleteFile(_storageKey: string): Promise<void> {
    return this.unavailable();
  }
}

// 3. Storage Service Factory & Validation Utility
export class StorageService {
  private static provider: IStorageProvider;

  static getProvider(): IStorageProvider {
    if (!this.provider) {
      const providerType = (process.env.STORAGE_PROVIDER || env.STORAGE_PROVIDER || 'local').toLowerCase();
      if (providerType === 'local') {
        this.provider = env.NODE_ENV === 'production'
          ? new DurableProductionStorageProvider()
          : new LocalStorageProvider();
      } else if (providerType === 'mongodb' || providerType === 'gridfs') {
        this.provider = new MongoGridFSStorageProvider();
      } else if (providerType === 's3') {
        this.provider = new S3StorageProvider();
      } else {
        const err: any = new Error(`Unsupported storage provider: ${providerType}`);
        err.statusCode = 500;
        err.code = 'INVALID_STORAGE_PROVIDER';
        throw err;
      }
    }
    return this.provider;
  }

  // Allowed MIME Types
  static ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]);

  // Allowed Extensions
  static ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx']);

  // Dangerous Script Extensions to explicitly ban
  static BANNED_EXTENSIONS = new Set([
    '.exe', '.sh', '.php', '.js', '.ts', '.py', '.bat', '.cmd', '.bin', '.pl',
    '.jar', '.html', '.htm', '.svg', '.vbs', '.ps1', '.cgi', '.asp', '.aspx',
  ]);

  static validateFile(originalname: string, mimetype: string, size: number): void {
    const rawMaxSize = process.env.MAX_FILE_SIZE || env.MAX_FILE_SIZE || '10485760';
    const parsedSize = parseInt(rawMaxSize, 10);
    const maxBytes = (isNaN(parsedSize) || parsedSize <= 0) ? 10485760 : parsedSize; // Default 10MB

    if (size > maxBytes) {
      const err: any = new Error(`File size exceeds maximum allowed limit of ${(maxBytes / (1024 * 1024)).toFixed(1)}MB`);
      err.statusCode = 413;
      err.code = 'FILE_TOO_LARGE';
      throw err;
    }

    const cleanName = path.basename(originalname);
    const ext = path.extname(cleanName).toLowerCase();

    if (this.BANNED_EXTENSIONS.has(ext)) {
      const err: any = new Error(`Executable or script file type (${ext}) is strictly prohibited.`);
      err.statusCode = 400;
      err.code = 'FORBIDDEN_FILE_TYPE';
      throw err;
    }

    if (!this.ALLOWED_EXTENSIONS.has(ext) || !this.ALLOWED_MIME_TYPES.has(mimetype.toLowerCase())) {
      const err: any = new Error(`Unsupported file format. Allowed types: PDF, JPG, PNG, WEBP, DOC, DOCX`);
      err.statusCode = 400;
      err.code = 'INVALID_MIME_TYPE';
      throw err;
    }
  }

  static sanitizeFilename(originalname: string): string {
    return originalname
      .replace(/[\/\x00-\x1f\x7f-\x9f\\]/g, '') // remove path separators and control chars
      .replace(/\.\./g, '') // remove parent directory traversal
      .trim();
  }
}
