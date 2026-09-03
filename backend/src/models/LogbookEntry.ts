import mongoose, { Schema, Document } from 'mongoose';
import { LogbookStatus } from '../types/index.js';

export interface ILogbookEntry extends Document {
  attachmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  supervisorId?: mongoose.Types.ObjectId | null;
  date: Date;
  clinicalActivity: string;
  procedure: string;
  description: string;
  status: LogbookStatus;
  supervisorComment?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LogbookEntrySchema = new Schema<ILogbookEntry>(
  {
    attachmentId: { type: Schema.Types.ObjectId, ref: 'ClinicalAttachment', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    supervisorId: { type: Schema.Types.ObjectId, ref: 'ClinicalSupervisor', default: null, index: true },
    date: { type: Date, required: true },
    clinicalActivity: { type: String, required: true, trim: true },
    procedure: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    status: { type: String, enum: Object.values(LogbookStatus), default: LogbookStatus.DRAFT, index: true },
    supervisorComment: { type: String },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export const LogbookEntry =
  (mongoose.models.LogbookEntry as mongoose.Model<ILogbookEntry>) ||
  mongoose.model<ILogbookEntry>('LogbookEntry', LogbookEntrySchema);
