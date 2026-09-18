import mongoose, { Schema, Document } from 'mongoose';

export type ClinicalRotationStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface IClinicalRotation extends Document {
  placementId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  departmentId?: mongoose.Types.ObjectId | null;
  supervisorId?: mongoose.Types.ObjectId | null;
  title: string;
  sequence: number;
  startDate: Date;
  endDate: Date;
  status: ClinicalRotationStatus;
  notes?: string;
  batchId?: mongoose.Types.ObjectId | null;
  groupCode?: string;
  templateId?: mongoose.Types.ObjectId | null;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ClinicalRotationSchema = new Schema<IClinicalRotation>(
  {
    placementId: { type: Schema.Types.ObjectId, ref: 'Placement', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null, index: true },
    supervisorId: { type: Schema.Types.ObjectId, ref: 'ClinicalSupervisor', default: null, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    sequence: { type: Number, required: true, min: 1 },
    startDate: { type: Date, required: true, index: true },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (this: IClinicalRotation, value: Date) {
          return !this?.startDate || value >= this.startDate;
        },
        message: 'Rotation end date must be on or after start date',
      },
    },
    status: {
      type: String,
      enum: ['UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
      default: 'UPCOMING',
      index: true,
    },
    notes: { type: String, trim: true, maxlength: 1000 },
    batchId: { type: Schema.Types.ObjectId, default: null, index: true },
    groupCode: { type: String, trim: true, uppercase: true, maxlength: 8 },
    templateId: { type: Schema.Types.ObjectId, ref: 'RotationTemplate', default: null, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

ClinicalRotationSchema.index({ placementId: 1, sequence: 1 }, { unique: true });
ClinicalRotationSchema.index({ studentId: 1, startDate: 1, endDate: 1 });
ClinicalRotationSchema.index({ batchId: 1, groupCode: 1, sequence: 1 });

export const ClinicalRotation =
  (mongoose.models.ClinicalRotation as mongoose.Model<IClinicalRotation>) ||
  mongoose.model<IClinicalRotation>('ClinicalRotation', ClinicalRotationSchema);
