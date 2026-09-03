import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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

  constructor(uploadDirRelative = 'uploads') {
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

// 2. S3 Storage Provider Abstraction (Fallback/Configurable)
export class S3StorageProvider implements IStorageProvider {
  private bucket: string;

  constructor() {
    this.bucket = process.env.STORAGE_BUCKET || 'azaam-documents';
  }

  async uploadFile(file: FilePayload): Promise<StorageUploadResult> {
    // If AWS SDK is not configured, fallback to LocalStorageProvider
    console.warn('[S3StorageProvider] S3 AWS credentials not directly linked; using Local Storage Provider fallback.');
    const local = new LocalStorageProvider();
    return local.uploadFile(file);
  }

  async getFile(storageKey: string): Promise<Buffer> {
    const local = new LocalStorageProvider();
    return local.getFile(storageKey);
  }

  async deleteFile(storageKey: string): Promise<void> {
    const local = new LocalStorageProvider();
    return local.deleteFile(storageKey);
  }
}

// 3. Storage Service Factory & Validation Utility
export class StorageService {
  private static provider: IStorageProvider;

  static getProvider(): IStorageProvider {
    if (!this.provider) {
      const providerType = process.env.STORAGE_PROVIDER || 'local';
      if (providerType === 's3' && process.env.AWS_ACCESS_KEY_ID) {
        this.provider = new S3StorageProvider();
      } else {
        this.provider = new LocalStorageProvider();
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
