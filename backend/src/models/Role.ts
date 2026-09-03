import mongoose, { Schema, Document } from 'mongoose';

export interface IPermission extends Document {
  code: string;
  name: string;
  category: string;
  description?: string;
}

const PermissionSchema = new Schema<IPermission>(
  {
    code: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    category: { type: String, required: true, index: true },
    description: { type: String },
  },
  { timestamps: true }
);

export const Permission =
  (mongoose.models.Permission as mongoose.Model<IPermission>) ||
  mongoose.model<IPermission>('Permission', PermissionSchema);

export interface IRole extends Document {
  name: string;
  code: string;
  permissions: string[]; // Permission codes e.g. 'applications.read'
  description?: string;
  isSystem: boolean;
}

const RoleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, index: true },
    permissions: [{ type: String }],
    description: { type: String },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Role =
  (mongoose.models.Role as mongoose.Model<IRole>) ||
  mongoose.model<IRole>('Role', RoleSchema);
