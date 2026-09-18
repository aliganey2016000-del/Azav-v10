import mongoose, { Schema, Document } from 'mongoose';

export interface IRotationTemplateItem {
  title: string;
  departmentId: mongoose.Types.ObjectId;
  supervisorId?: mongoose.Types.ObjectId | null;
  durationDays: number;
  capacity?: number | null;
  notes?: string;
}

export interface IRotationTemplate extends Document {
  name: string;
  organizationId: mongoose.Types.ObjectId;
  description?: string;
  items: IRotationTemplateItem[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RotationTemplateItemSchema = new Schema<IRotationTemplateItem>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    supervisorId: { type: Schema.Types.ObjectId, ref: 'ClinicalSupervisor', default: null },
    durationDays: { type: Number, required: true, min: 1, max: 365 },
    capacity: { type: Number, default: null, min: 1, max: 10000 },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { _id: false }
);

const RotationTemplateSchema = new Schema<IRotationTemplate>(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    description: { type: String, trim: true, maxlength: 1000 },
    items: {
      type: [RotationTemplateItemSchema],
      validate: {
        validator: (items: IRotationTemplateItem[]) => Array.isArray(items) && items.length > 0 && items.length <= 30,
        message: 'Rotation template must contain between 1 and 30 items',
      },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

RotationTemplateSchema.index({ organizationId: 1, name: 1 }, { unique: true });

export const RotationTemplate =
  (mongoose.models.RotationTemplate as mongoose.Model<IRotationTemplate>) ||
  mongoose.model<IRotationTemplate>('RotationTemplate', RotationTemplateSchema);
