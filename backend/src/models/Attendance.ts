import mongoose, { Schema, Document } from 'mongoose';
import { AttendanceStatus } from '../types/index.js';

export interface IAttendance extends Document {
  attachmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  date: Date;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  notes?: string;
  recordedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    attachmentId: { type: Schema.Types.ObjectId, ref: 'ClinicalAttachment', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    date: { type: Date, required: true },
    status: { type: String, enum: Object.values(AttendanceStatus), default: AttendanceStatus.PRESENT },
    checkIn: { type: String },
    checkOut: { type: String },
    notes: { type: String },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Prevent duplicate attendance for attachmentId + date
AttendanceSchema.index({ attachmentId: 1, date: 1 }, { unique: true });

export const Attendance =
  (mongoose.models.Attendance as mongoose.Model<IAttendance>) ||
  mongoose.model<IAttendance>('Attendance', AttendanceSchema);
