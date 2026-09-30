import mongoose, { Schema, Document } from 'mongoose';

export interface IRecognitionEvidenceDocument {
  _id?: mongoose.Types.ObjectId;
  title: string;
  originalName: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  createdAt: Date;
}

export interface IRecognitionEvidence extends Document {
  recognitionName: string;
  documents: IRecognitionEvidenceDocument[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IRecognitionAccessCode extends Document {
  recognitionName: string;
  codeHash: string;
  expiresAt: Date;
  usedAt?: Date | null;
  revokedAt?: Date | null;
  viewTokenHash?: string | null;
  viewExpiresAt?: Date | null;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RecognitionEvidenceDocumentSchema = new Schema<IRecognitionEvidenceDocument>(
  {
    title: { type: String, trim: true, default: '' },
    originalName: { type: String, required: true, trim: true },
    storageKey: { type: String, required: true },
    mimeType: { type: String, required: true, trim: true },
    fileSize: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const RecognitionEvidenceSchema = new Schema<IRecognitionEvidence>(
  {
    recognitionName: { type: String, required: true, unique: true, index: true, trim: true },
    documents: { type: [RecognitionEvidenceDocumentSchema], default: [] },
  },
  { timestamps: true }
);

const RecognitionAccessCodeSchema = new Schema<IRecognitionAccessCode>(
  {
    recognitionName: { type: String, required: true, index: true, trim: true },
    codeHash: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date, default: null, index: true },
    revokedAt: { type: Date, default: null, index: true },
    viewTokenHash: { type: String, default: null, index: true },
    viewExpiresAt: { type: Date, default: null, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

RecognitionAccessCodeSchema.index({ codeHash: 1, recognitionName: 1, expiresAt: 1 });

export const RecognitionEvidence =
  (mongoose.models.RecognitionEvidence as mongoose.Model<IRecognitionEvidence>) ||
  mongoose.model<IRecognitionEvidence>('RecognitionEvidence', RecognitionEvidenceSchema);

export const RecognitionAccessCode =
  (mongoose.models.RecognitionAccessCode as mongoose.Model<IRecognitionAccessCode>) ||
  mongoose.model<IRecognitionAccessCode>('RecognitionAccessCode', RecognitionAccessCodeSchema);
