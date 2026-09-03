import mongoose, { Schema, Document } from 'mongoose';
import { CertificateStatus } from '../types/index.js';

export interface ICertificate extends Document {
  attachmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  certificateNumber: string;
  verificationCode: string;
  issueDate: Date;
  status: CertificateStatus;
  revokedAt?: Date;
  revokedBy?: mongoose.Types.ObjectId | null;
  revocationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CertificateSchema = new Schema<ICertificate>(
  {
    attachmentId: { type: Schema.Types.ObjectId, ref: 'ClinicalAttachment', required: true, unique: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    certificateNumber: { type: String, required: true, unique: true, index: true, uppercase: true },
    verificationCode: { type: String, required: true, unique: true, index: true, uppercase: true },
    issueDate: { type: Date, default: Date.now },
    status: { type: String, enum: Object.values(CertificateStatus), default: CertificateStatus.ISSUED },
    revokedAt: { type: Date },
    revokedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    revocationReason: { type: String },
  },
  { timestamps: true }
);

export const Certificate =
  (mongoose.models.Certificate as mongoose.Model<ICertificate>) ||
  mongoose.model<ICertificate>('Certificate', CertificateSchema);
