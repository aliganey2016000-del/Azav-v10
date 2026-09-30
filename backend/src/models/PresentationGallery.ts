import mongoose, { Schema, Document } from 'mongoose';

export type PresentationMediaType = 'IMAGE' | 'VIDEO';

export interface IPresentationMedia {
  _id?: mongoose.Types.ObjectId;
  type: PresentationMediaType;
  title: string;
  caption: string;
  originalName: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  createdAt: Date;
}

export interface IPresentationGallery extends Document {
  title: string;
  description: string;
  audienceNote: string;
  shareToken: string;
  isActive: boolean;
  expiresAt?: Date | null;
  media: IPresentationMedia[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PresentationMediaSchema = new Schema<IPresentationMedia>(
  {
    type: { type: String, enum: ['IMAGE', 'VIDEO'], required: true },
    title: { type: String, trim: true, default: '' },
    caption: { type: String, trim: true, default: '' },
    originalName: { type: String, required: true, trim: true },
    storageKey: { type: String, required: true },
    mimeType: { type: String, required: true, trim: true },
    fileSize: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const PresentationGallerySchema = new Schema<IPresentationGallery>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    audienceNote: { type: String, trim: true, default: '' },
    shareToken: { type: String, required: true, unique: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    expiresAt: { type: Date, default: null, index: true },
    media: { type: [PresentationMediaSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

export const PresentationGallery =
  (mongoose.models.PresentationGallery as mongoose.Model<IPresentationGallery>) ||
  mongoose.model<IPresentationGallery>('PresentationGallery', PresentationGallerySchema);
