import mongoose, { Schema, Document } from 'mongoose';
import { PlacementStatus, ClinicalAttachmentStatus } from '../types/index.js';

export interface IPlacement extends Document {
  applicationId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  departmentId?: mongoose.Types.ObjectId | null;
  supervisorId?: mongoose.Types.ObjectId | null;
  startDate: Date;
  endDate: Date;
  status: PlacementStatus;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PlacementSchema = new Schema<IPlacement>(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: 'Application', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    supervisorId: { type: Schema.Types.ObjectId, ref: 'ClinicalSupervisor', default: null },
    startDate: { type: Date, required: true },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (this: IPlacement, value: Date) {
          return !this.startDate || value >= this.startDate;
        },
        message: 'endDate must be on or after startDate',
      },
    },
    status: {
      type: String,
      enum: Object.values(PlacementStatus),
      default: PlacementStatus.PENDING,
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Compound index for capacity and rotation checks
PlacementSchema.index({ organizationId: 1, startDate: 1, endDate: 1, status: 1 });

export const Placement =
  (mongoose.models.Placement as mongoose.Model<IPlacement>) ||
  mongoose.model<IPlacement>('Placement', PlacementSchema);

export interface IClinicalAttachment extends Document {
  placementId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  departmentId?: mongoose.Types.ObjectId | null;
  supervisorId?: mongoose.Types.ObjectId | null;
  startDate: Date;
  endDate: Date;
  status: ClinicalAttachmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ClinicalAttachmentSchema = new Schema<IClinicalAttachment>(
  {
    placementId: { type: Schema.Types.ObjectId, ref: 'Placement', required: true, unique: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    supervisorId: { type: Schema.Types.ObjectId, ref: 'ClinicalSupervisor', default: null, index: true },
    startDate: { type: Date, required: true },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (this: IClinicalAttachment, value: Date) {
          return !this.startDate || value >= this.startDate;
        },
        message: 'endDate must be on or after startDate',
      },
    },
    status: {
      type: String,
      enum: Object.values(ClinicalAttachmentStatus),
      default: ClinicalAttachmentStatus.NOT_STARTED,
      index: true,
    },
  },
  { timestamps: true }
);

export const ClinicalAttachment =
  (mongoose.models.ClinicalAttachment as mongoose.Model<IClinicalAttachment>) ||
  mongoose.model<IClinicalAttachment>('ClinicalAttachment', ClinicalAttachmentSchema);
