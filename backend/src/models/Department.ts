import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartment extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    description: { type: String },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

export const Department =
  (mongoose.models.Department as mongoose.Model<IDepartment>) ||
  mongoose.model<IDepartment>('Department', DepartmentSchema);
