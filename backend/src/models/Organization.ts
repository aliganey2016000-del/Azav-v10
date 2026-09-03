import mongoose, { Schema, Document } from 'mongoose';
import { OrganizationType } from '../types/index.js';

export interface IOrganization extends Document {
  name: string; // organizationName maps here
  legalName?: string;
  type: OrganizationType;
  registrationNumber?: string;
  country?: string;
  city?: string;
  state?: string;
  address?: string;
  postalCode?: string;
  contactEmail: string; // officialEmail maps here
  contactPhone?: string;
  website?: string;
  accreditationNumber?: string;
  accreditationStatus?: 'PENDING' | 'VERIFIED' | 'EXPIRED' | 'REJECTED';
  contactPersonName?: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  capacity: number; // totalPlacementCapacity maps here
  description?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true },
    legalName: { type: String, trim: true },
    type: { type: String, enum: Object.values(OrganizationType), default: OrganizationType.HOSPITAL },
    registrationNumber: { type: String, trim: true },
    country: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    address: { type: String },
    postalCode: { type: String, trim: true },
    contactEmail: { type: String, required: true, lowercase: true, trim: true },
    contactPhone: { type: String },
    website: { type: String },
    accreditationNumber: { type: String, trim: true },
    accreditationStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'EXPIRED', 'REJECTED'], default: 'PENDING' },
    contactPersonName: { type: String, trim: true },
    contactPersonEmail: { type: String, trim: true, lowercase: true },
    contactPersonPhone: { type: String, trim: true },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED'], default: 'ACTIVE' },
    capacity: { type: Number, required: true, default: 20 },
    description: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Organization =
  (mongoose.models.Organization as mongoose.Model<IOrganization>) ||
  mongoose.model<IOrganization>('Organization', OrganizationSchema);
