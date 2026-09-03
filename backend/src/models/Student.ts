import mongoose, { Schema, Document } from 'mongoose';
import { ApplicantType } from '../types/index.js';

export interface IStudent extends Document {
  userId: mongoose.Types.ObjectId;
  universityId?: mongoose.Types.ObjectId | null;
  programmeId?: mongoose.Types.ObjectId | null;
  specialtyId?: mongoose.Types.ObjectId | null;
  studentNumber?: string;
  dateOfBirth?: Date;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  countryId?: mongoose.Types.ObjectId | null;
  cityId?: mongoose.Types.ObjectId | null;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  applicantType: ApplicantType;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    universityId: { type: Schema.Types.ObjectId, ref: 'University', default: null, index: true },
    programmeId: { type: Schema.Types.ObjectId, ref: 'Programme', default: null },
    specialtyId: { type: Schema.Types.ObjectId, ref: 'Specialty', default: null },
    studentNumber: { type: String, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'] },
    countryId: { type: Schema.Types.ObjectId, ref: 'Country', default: null },
    cityId: { type: Schema.Types.ObjectId, ref: 'City', default: null },
    phone: { type: String, trim: true },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'], default: 'ACTIVE' },
    applicantType: {
      type: String,
      enum: Object.values(ApplicantType),
      required: true,
      default: ApplicantType.UNIVERSITY,
    },
  },
  { timestamps: true }
);

// Mongoose validation rule: If applicantType = INDEPENDENT => universityId = null
StudentSchema.pre('save', function (this: IStudent) {
  if (this.applicantType === ApplicantType.INDEPENDENT) {
    this.universityId = null;
  }
});

export const Student =
  (mongoose.models.Student as mongoose.Model<IStudent>) ||
  mongoose.model<IStudent>('Student', StudentSchema);
