import mongoose, { Schema, Document } from 'mongoose';

export interface ILandingPageSettings extends Document {
  key: string;
  draft?: Record<string, unknown> | null;
  published?: Record<string, unknown> | null;
  draftUpdatedAt?: Date | null;
  publishedAt?: Date | null;
  updatedBy?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const LandingPageSettingsSchema = new Schema<ILandingPageSettings>(
  {
    key: { type: String, required: true, unique: true, default: 'main', index: true },
    draft: { type: Schema.Types.Mixed, default: null },
    published: { type: Schema.Types.Mixed, default: null },
    draftUpdatedAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export const LandingPageSettings =
  (mongoose.models.LandingPageSettings as mongoose.Model<ILandingPageSettings>) ||
  mongoose.model<ILandingPageSettings>('LandingPageSettings', LandingPageSettingsSchema);
