import mongoose, { Schema, Document } from 'mongoose';

export interface IUniversity extends Document {
  name: string;
  code: string;
  officialName?: string;
  abbreviation?: string;
  country?: string;
  city?: string;
  state?: string;
  address?: string;
  postalCode?: string;
  email: string; // officialEmail maps here
  phone?: string;
  website?: string;
  accreditationNumber?: string;
  accreditationStatus?: 'PENDING' | 'VERIFIED' | 'EXPIRED' | 'REJECTED';
  contactPersonName?: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;
  notes?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  capacity: number; // studentCapacity maps here
  createdAt: Date;
  updatedAt: Date;
}

const UniversitySchema = new Schema<IUniversity>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    officialName: { type: String, trim: true },
    abbreviation: { type: String, trim: true },
    country: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    address: { type: String },
    postalCode: { type: String, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String },
    website: { type: String },
    accreditationNumber: { type: String, trim: true },
    accreditationStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'EXPIRED', 'REJECTED'], default: 'PENDING' },
    contactPersonName: { type: String, trim: true },
    contactPersonEmail: { type: String, trim: true, lowercase: true },
    contactPersonPhone: { type: String, trim: true },
    notes: { type: String },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED'], default: 'ACTIVE' },
    capacity: { type: Number, default: 100 },
  },
  { timestamps: true }
);

export const University =
  (mongoose.models.University as mongoose.Model<IUniversity>) ||
  mongoose.model<IUniversity>('University', UniversitySchema);
