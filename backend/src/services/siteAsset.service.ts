import { SiteAsset } from '../models/SiteAsset.js';
import { StorageService, FilePayload } from './storage.service.js';

const MAX_ASSET_BYTES = 6 * 1024 * 1024; // 6MB raw (~8MB base64, under the 12MB JSON body limit)
const ALLOWED_MIME_PREFIXES = ['image/', 'video/'];

export class SiteAssetService {
  static async uploadAsset(file: FilePayload, uploadedBy: string): Promise<{ id: string; url: string; mimeType: string; originalName: string }> {
    if (!ALLOWED_MIME_PREFIXES.some((prefix) => file.mimetype.startsWith(prefix))) {
      const err: any = new Error('Only image or video files can be uploaded as website assets.');
      err.statusCode = 400;
      err.code = 'UNSUPPORTED_ASSET_TYPE';
      throw err;
    }

    if (file.buffer.length > MAX_ASSET_BYTES) {
      const err: any = new Error('Website asset files must be 8MB or smaller.');
      err.statusCode = 400;
      err.code = 'ASSET_TOO_LARGE';
      throw err;
    }

    const provider = StorageService.getProvider();
    const { storageKey, fileSize } = await provider.uploadFile(file);

    const asset = await SiteAsset.create({
      originalName: file.originalname,
      storageKey,
      mimeType: file.mimetype,
      fileSize,
      uploadedBy,
    });

    return {
      id: String(asset._id),
      url: `/api/v1/site-assets/${asset._id}`,
      mimeType: asset.mimeType,
      originalName: asset.originalName,
    };
  }

  static async getAssetFile(id: string): Promise<{ buffer: Buffer; mimeType: string; originalName: string }> {
    const asset = await SiteAsset.findById(id).lean();
    if (!asset) {
      const err: any = new Error('Asset not found.');
      err.statusCode = 404;
      err.code = 'ASSET_NOT_FOUND';
      throw err;
    }

    const provider = StorageService.getProvider();
    const buffer = await provider.getFile(asset.storageKey);

    return { buffer, mimeType: asset.mimeType, originalName: asset.originalName };
  }
}
