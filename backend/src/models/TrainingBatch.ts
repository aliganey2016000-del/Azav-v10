import mongoose, { Document, Schema } from 'mongoose';

export type TrainingBatchStatus = 'OPEN' | 'CLOSED';

export interface ITrainingBatch extends Document {
  universityId: mongoose.Types.ObjectId;
  batchNumber: string;
  name: string;
  intakeDate?: Date | null;
  status: TrainingBatchStatus;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TrainingBatchSchema = new Schema<ITrainingBatch>(
  {
    universityId: {
      type: Schema.Types.ObjectId,
      ref: 'University',
      required: true,
      index: true,
    },
    batchNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 80,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    intakeDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['OPEN', 'CLOSED'],
      default: 'OPEN',
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

TrainingBatchSchema.index({ universityId: 1, batchNumber: 1 }, { unique: true });
TrainingBatchSchema.index({ universityId: 1, status: 1, createdAt: -1 });

export const TrainingBatch =
  (mongoose.models.TrainingBatch as mongoose.Model<ITrainingBatch>) ||
  mongoose.model<ITrainingBatch>('TrainingBatch', TrainingBatchSchema);
