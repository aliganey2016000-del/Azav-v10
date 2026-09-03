import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '../types/index.js';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  passwordHash: string;
  roles: UserRole[];
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  avatar?: string;
  universityId?: mongoose.Types.ObjectId | null;
  organizationId?: mongoose.Types.ObjectId | null;
  studentId?: mongoose.Types.ObjectId | null;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    roles: [{ type: String, enum: Object.values(UserRole), default: [UserRole.STUDENT] }],
    status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'PENDING'], default: 'ACTIVE' },
    avatar: { type: String },
    universityId: { type: Schema.Types.ObjectId, ref: 'University', default: null, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', default: null, index: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

UserSchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    delete ret.passwordHash;
    return ret;
  },
});

export const User =
  (mongoose.models.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>('User', UserSchema);
