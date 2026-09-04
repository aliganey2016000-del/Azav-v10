import mongoose, { Schema, Document } from 'mongoose';
import { ApplicationStatus, ApplicantType } from '../types/index.js';

export interface IApplication extends Document {
  studentId: mongoose.Types.ObjectId;
  universityId?: mongoose.Types.ObjectId | null;
  applicantType: ApplicantType;
  programmeId?: mongoose.Types.ObjectId | null;
  specialtyId?: mongoose.Types.ObjectId | null;
  preferredStartDate?: Date;
  preferredEndDate?: Date;
  status: ApplicationStatus;
  submissionDate?: Date;
  reviewedBy?: mongoose.Types.ObjectId | null;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    universityId: { type: Schema.Types.ObjectId, ref: 'University', default: null, index: true },
    applicantType: { type: String, enum: Object.values(ApplicantType), required: true, default: ApplicantType.UNIVERSITY },
    programmeId: { type: Schema.Types.ObjectId, ref: 'Programme', default: null },
    specialtyId: { type: Schema.Types.ObjectId, ref: 'Specialty', default: null },
    preferredStartDate: { type: Date },
    preferredEndDate: {
      type: Date,
      validate: {
        validator: function (this: IApplication, value: Date) {
          return !this.preferredStartDate || value >= this.preferredStartDate;
        },
        message: 'preferredEndDate must be on or after preferredStartDate',
      },
    },
    status: {
      type: String,
      enum: Object.values(ApplicationStatus),
      default: ApplicationStatus.DRAFT,
      index: true,
    },
    submissionDate: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

export const Application =
  (mongoose.models.Application as mongoose.Model<IApplication>) ||
  mongoose.model<IApplication>('Application', ApplicationSchema);

export interface IApplicationStatusHistory extends Document {
  applicationId: mongoose.Types.ObjectId;
  fromStatus: ApplicationStatus;
  toStatus: ApplicationStatus;
  changedBy: mongoose.Types.ObjectId;
  reason?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const ApplicationStatusHistorySchema = new Schema<IApplicationStatusHistory>(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: 'Application', required: true, index: true },
    fromStatus: { type: String, enum: Object.values(ApplicationStatus), required: true },
    toStatus: { type: String, enum: Object.values(ApplicationStatus), required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ApplicationStatusHistory =
  (mongoose.models.ApplicationStatusHistory as mongoose.Model<IApplicationStatusHistory>) ||
  mongoose.model<IApplicationStatusHistory>('ApplicationStatusHistory', ApplicationStatusHistorySchema);
