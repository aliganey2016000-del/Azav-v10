import mongoose, { Schema, Document } from 'mongoose';
import { EvaluationType } from '../types/index.js';

export interface IEvaluation extends Document {
  attachmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  supervisorId: mongoose.Types.ObjectId;
  type: EvaluationType;
  clinicalCompetency: number; // 1 to 5 scale
  professionalism: number; // 1 to 5 scale
  patientCommunication: number; // 1 to 5 scale
  medicalKnowledge: number; // 1 to 5 scale
  overallScore: number; // calculated score out of 100 or 5
  comments?: string;
  status: 'SUBMITTED' | 'APPROVED';
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EvaluationSchema = new Schema<IEvaluation>(
  {
    attachmentId: { type: Schema.Types.ObjectId, ref: 'ClinicalAttachment', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    supervisorId: { type: Schema.Types.ObjectId, ref: 'ClinicalSupervisor', required: true, index: true },
    type: { type: String, enum: Object.values(EvaluationType), required: true },
    clinicalCompetency: { type: Number, required: true, min: 1, max: 5 },
    professionalism: { type: Number, required: true, min: 1, max: 5 },
    patientCommunication: { type: Number, required: true, min: 1, max: 5 },
    medicalKnowledge: { type: Number, required: true, min: 1, max: 5 },
    overallScore: { type: Number, required: true },
    comments: { type: String },
    status: { type: String, enum: ['SUBMITTED', 'APPROVED'], default: 'SUBMITTED' },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Prevent duplicate evaluation of the same type for one attachment
EvaluationSchema.index({ attachmentId: 1, type: 1 }, { unique: true });

export const Evaluation =
  (mongoose.models.Evaluation as mongoose.Model<IEvaluation>) ||
  mongoose.model<IEvaluation>('Evaluation', EvaluationSchema);
