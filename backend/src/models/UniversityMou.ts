import mongoose, { Document, Schema } from 'mongoose';

export interface IUniversityMou extends Document {
  universityId: mongoose.Types.ObjectId;
  mouNumber: string;
  representative?: string;
  representativeTitle?: string;
  signedAt?: Date | null;
  status: 'DRAFT' | 'PENDING_SIGNATURE' | 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  validityStart?: Date | null;
  validityEnd?: Date | null;
  annualQuota?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UniversityMouSchema = new Schema<IUniversityMou>(
  {
    universityId: { type: Schema.Types.ObjectId, ref: 'University', required: true, unique: true, index: true },
    mouNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    representative: { type: String, trim: true },
    representativeTitle: { type: String, trim: true },
    signedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_SIGNATURE', 'ACTIVE', 'EXPIRED', 'REVOKED'],
      default: 'DRAFT',
      index: true,
    },
    validityStart: { type: Date, default: null },
    validityEnd: { type: Date, default: null },
    annualQuota: { type: Number, min: 0 },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export const UniversityMou =
  (mongoose.models.UniversityMou as mongoose.Model<IUniversityMou>) ||
  mongoose.model<IUniversityMou>('UniversityMou', UniversityMouSchema);
