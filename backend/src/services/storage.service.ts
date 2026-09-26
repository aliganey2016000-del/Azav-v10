import fs from 'fs';
import { Readable } from 'stream';
import path from 'path';
import crypto from 'crypto';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
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

export interface StorageByteRange {
  start: number;
  end: number;
}

export interface IStorageProvider {
  uploadFile(file: FilePayload): Promise<StorageUploadResult>;
  getFile(storageKey: string): Promise<Buffer>;
  deleteFile(storageKey: string): Promise<void>;
  getFileSize(storageKey: string): Promise<number>;
  getFileStream(storageKey: string, range?: StorageByteRange): Promise<Readable>;
}

const createPrivateObjectKey = (originalname: string): string => {
  const ext = path.extname(originalname).toLowerCase() || '.bin';
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const randomName = `doc_${Date.now()}_${crypto.randomBytes(12).toString('hex')}${ext}`;
  return `documents/${yyyy}/${mm}/${randomName}`;
};

// Local storage is kept only for development/fallback environments.
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

  async getFileSize(storageKey: string): Promise<number> {
    const safeKey = path.basename(storageKey);
    const filePath = path.join(this.uploadDir, safeKey);

    try {
      const stat = await fs.promises.stat(filePath);
      return stat.size;
    } catch {
      const err: any = new Error('File not found on storage');
      err.statusCode = 404;
      throw err;
    }
  }

  async getFileStream(storageKey: string, range?: StorageByteRange): Promise<Readable> {
    const safeKey = path.basename(storageKey);
    const filePath = path.join(this.uploadDir, safeKey);

    if (!fs.existsSync(filePath)) {
      const err: any = new Error('File not found on storage');
      err.statusCode = 404;
      throw err;
    }

    return fs.createReadStream(filePath, range ? { start: range.start, end: range.end } : undefined);
  }
}

type ObjectStorageConfig = {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
};

// Private S3-compatible object storage provider.
// Cloudflare R2 uses the same S3 API and remains private; files are streamed
// through authenticated AZAAM download endpoints rather than public bucket URLs.
export class S3StorageProvider implements IStorageProvider {
  private client: S3Client;
  private bucket: string;

  constructor(config: ObjectStorageConfig) {
    this.bucket = config.bucket;
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async uploadFile(file: FilePayload): Promise<StorageUploadResult> {
    const storageKey = createPrivateObjectKey(file.originalname);

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          source: 'azaam-platform',
        },
      })
    );

    return {
      storageKey,
      fileSize: file.buffer.length,
    };
  }

  async getFile(storageKey: string): Promise<Buffer> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: storageKey,
        })
      );

      if (!response.Body) {
        const err: any = new Error('File not found on object storage');
        err.statusCode = 404;
        throw err;
      }

      const bytes = await (response.Body as any).transformToByteArray();
      return Buffer.from(bytes);
    } catch (error: any) {
      if (
        error?.name === 'NoSuchKey' ||
        error?.name === 'NotFound' ||
        error?.$metadata?.httpStatusCode === 404
      ) {
        const err: any = new Error('File not found on object storage');
        err.statusCode = 404;
        err.code = 'STORAGE_OBJECT_NOT_FOUND';
        throw err;
      }
      throw error;
    }
  }

  async deleteFile(storageKey: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
      })
    );
  }

  async getFileSize(storageKey: string): Promise<number> {
    try {
      const response = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: storageKey })
      );
      return response.ContentLength ?? 0;
    } catch (error: any) {
      if (
        error?.name === 'NoSuchKey' ||
        error?.name === 'NotFound' ||
        error?.$metadata?.httpStatusCode === 404
      ) {
        const err: any = new Error('File not found on object storage');
        err.statusCode = 404;
        err.code = 'STORAGE_OBJECT_NOT_FOUND';
        throw err;
      }
      throw error;
    }
  }

  async getFileStream(storageKey: string, range?: StorageByteRange): Promise<Readable> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: storageKey,
          Range: range ? `bytes=${range.start}-${range.end}` : undefined,
        })
      );

      if (!response.Body) {
        const err: any = new Error('File not found on object storage');
        err.statusCode = 404;
        throw err;
      }

      return response.Body as Readable;
    } catch (error: any) {
      if (
        error?.name === 'NoSuchKey' ||
        error?.name === 'NotFound' ||
        error?.$metadata?.httpStatusCode === 404
      ) {
        const err: any = new Error('File not found on object storage');
        err.statusCode = 404;
        err.code = 'STORAGE_OBJECT_NOT_FOUND';
        throw err;
      }
      throw error;
    }
  }
}

const required = (value: string | undefined, label: string): string => {
  if (!value?.trim()) {
    const err: any = new Error(`${label} is required for private object storage.`);
    err.statusCode = 500;
    err.code = 'STORAGE_CONFIGURATION_ERROR';
    throw err;
  }
  return value.trim();
};

export class StorageService {
  private static provider: IStorageProvider;

  static getProvider(): IStorageProvider {
    if (!this.provider) {
      const explicitProvider = (process.env.STORAGE_PROVIDER || '').trim().toLowerCase();

      const r2AccountId = (process.env.R2_ACCOUNT_ID || env.R2_ACCOUNT_ID || '').trim();
      const r2Endpoint = (process.env.R2_ENDPOINT || env.R2_ENDPOINT || '').trim()
        || (r2AccountId ? `https://${r2AccountId}.r2.cloudflarestorage.com` : '');
      const r2Bucket = (process.env.R2_BUCKET || env.R2_BUCKET || process.env.R2_BUCKET_NAME || env.R2_BUCKET_NAME || '').trim();
      const r2AccessKeyId = (process.env.R2_ACCESS_KEY_ID || env.R2_ACCESS_KEY_ID || '').trim();
      const r2SecretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || env.R2_SECRET_ACCESS_KEY || '').trim();

      const hasCompleteR2Config = Boolean(
        r2Endpoint && r2Bucket && r2AccessKeyId && r2SecretAccessKey
      );

      // In production, auto-select R2 when the Cloudflare credentials are present.
      // This keeps uploads persistent even when STORAGE_PROVIDER was not explicitly set.
      const providerType = explicitProvider || (hasCompleteR2Config ? 'r2' : (env.STORAGE_PROVIDER || 'local').toLowerCase());

      if (providerType === 'local') {
        this.provider = new LocalStorageProvider();
      } else if (providerType === 'r2') {
        this.provider = new S3StorageProvider({
          endpoint: required(r2Endpoint, 'R2_ENDPOINT or R2_ACCOUNT_ID'),
          bucket: required(r2Bucket, 'R2_BUCKET or R2_BUCKET_NAME'),
          accessKeyId: required(r2AccessKeyId, 'R2_ACCESS_KEY_ID'),
          secretAccessKey: required(r2SecretAccessKey, 'R2_SECRET_ACCESS_KEY'),
          region: 'auto',
        });
      } else if (providerType === 's3') {
        this.provider = new S3StorageProvider({
          endpoint: required(process.env.S3_ENDPOINT || env.S3_ENDPOINT, 'S3_ENDPOINT'),
          bucket: required(process.env.S3_BUCKET || env.S3_BUCKET, 'S3_BUCKET'),
          accessKeyId: required(process.env.S3_ACCESS_KEY || env.S3_ACCESS_KEY, 'S3_ACCESS_KEY'),
          secretAccessKey: required(process.env.S3_SECRET_KEY || env.S3_SECRET_KEY, 'S3_SECRET_KEY'),
          region: process.env.AWS_REGION || env.AWS_REGION || 'auto',
        });
      } else {
        const err: any = new Error(`Unsupported storage provider: ${providerType}`);
        err.statusCode = 500;
        err.code = 'INVALID_STORAGE_PROVIDER';
        throw err;
      }
    }
    return this.provider;
  }

  static ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]);

  static ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx']);

  static BANNED_EXTENSIONS = new Set([
    '.exe', '.sh', '.php', '.js', '.ts', '.py', '.bat', '.cmd', '.bin', '.pl',
    '.jar', '.html', '.htm', '.svg', '.vbs', '.ps1', '.cgi', '.asp', '.aspx',
  ]);

  static validateFile(originalname: string, mimetype: string, size: number): void {
    const rawMaxSize = process.env.MAX_FILE_SIZE || env.MAX_FILE_SIZE || '10485760';
    const parsedSize = parseInt(rawMaxSize, 10);
    const maxBytes = (isNaN(parsedSize) || parsedSize <= 0) ? 10485760 : parsedSize;

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
      const err: any = new Error('Unsupported file format. Allowed types: PDF, JPG, PNG, WEBP, DOC, DOCX');
      err.statusCode = 400;
      err.code = 'INVALID_MIME_TYPE';
      throw err;
    }
  }

  static sanitizeFilename(originalname: string): string {
    return originalname
      .replace(/[\/\x00-\x1f\x7f-\x9f\\]/g, '')
      .replace(/\.\./g, '')
      .trim();
  }
}
