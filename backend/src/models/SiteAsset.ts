import mongoose, { Schema, Document } from 'mongoose';

export interface ISiteAsset extends Document {
  originalName: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SiteAssetSchema = new Schema<ISiteAsset>(
  {
    originalName: { type: String, required: true, trim: true },
    storageKey: { type: String, required: true, unique: true, index: true },
    mimeType: { type: String, required: true, trim: true },
    fileSize: { type: Number, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

export const SiteAsset =
  (mongoose.models.SiteAsset as mongoose.Model<ISiteAsset>) ||
  mongoose.model<ISiteAsset>('SiteAsset', SiteAssetSchema);
