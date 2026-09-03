import mongoose, { Schema, Document } from 'mongoose';
import { DocumentStatus } from '../types/index.js';

export interface IDocument extends Document {
  originalName: string;
  fileName?: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  type: string; // e.g. 'PASSPORT', 'MEDICAL_LICENSE', 'CV', 'UNIVERSITY_LETTER', etc.
  ownerType: string; // 'Student' | 'Application' | 'Placement' | 'ClinicalAttachment' | 'Certificate' | 'University' | 'Organization' | 'ClinicalSupervisor'
  ownerId: mongoose.Types.ObjectId;
  studentId?: mongoose.Types.ObjectId | null;
  applicationId?: mongoose.Types.ObjectId | null;
  universityId?: mongoose.Types.ObjectId | null;
  organizationId?: mongoose.Types.ObjectId | null;
  uploadedBy: mongoose.Types.ObjectId;
  verifiedBy?: mongoose.Types.ObjectId | null;
  verifiedAt?: Date;
  status: DocumentStatus;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    originalName: { type: String, required: true, trim: true },
    fileName: { type: String },
    storageKey: { type: String, required: true, unique: true, index: true },
    mimeType: { type: String, required: true, trim: true },
    fileSize: { type: Number, required: true },
    type: { type: String, required: true, uppercase: true, index: true },
    ownerType: { type: String, required: true, default: 'Student', index: true },
    ownerId: { type: Schema.Types.ObjectId, required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', default: null, index: true },
    applicationId: { type: Schema.Types.ObjectId, ref: 'Application', default: null, index: true },
    universityId: { type: Schema.Types.ObjectId, ref: 'University', default: null, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null, index: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    verifiedAt: { type: Date },
    status: {
      type: String,
      enum: Object.values(DocumentStatus),
      default: DocumentStatus.UPLOADED,
      index: true,
    },
    rejectionReason: { type: String, trim: true },
  },
  { timestamps: true }
);

DocumentSchema.index({ ownerType: 1, ownerId: 1 });
DocumentSchema.index({ status: 1, createdAt: -1 });

export const DocumentModel =
  (mongoose.models.Document as mongoose.Model<IDocument>) ||
  mongoose.model<IDocument>('Document', DocumentSchema);
