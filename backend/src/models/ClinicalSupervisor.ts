import mongoose, { Schema, Document } from 'mongoose';

export interface IClinicalSupervisor extends Document {
  userId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  departmentId?: mongoose.Types.ObjectId | null;
  specialtyId?: mongoose.Types.ObjectId | null;
  licenseNumber?: string;
  qualification?: string;
  yearsOfExperience?: number;
  verified: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const ClinicalSupervisorSchema = new Schema<IClinicalSupervisor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    specialtyId: { type: Schema.Types.ObjectId, ref: 'Specialty', default: null },
    licenseNumber: { type: String, trim: true },
    qualification: { type: String, trim: true },
    yearsOfExperience: { type: Number, default: 0 },
    verified: { type: Boolean, default: true },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

export const ClinicalSupervisor =
  (mongoose.models.ClinicalSupervisor as mongoose.Model<IClinicalSupervisor>) ||
  mongoose.model<IClinicalSupervisor>('ClinicalSupervisor', ClinicalSupervisorSchema);
