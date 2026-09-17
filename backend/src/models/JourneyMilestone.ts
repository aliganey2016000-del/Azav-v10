import mongoose, { Schema, Document } from 'mongoose';

export enum JourneyStageKey {
  AZAAM_REVIEW = 'AZAAM_REVIEW',
  PERMIT = 'PERMIT',
  VISA = 'VISA',
  RESIDENCE = 'RESIDENCE',
  TRANSPORT = 'TRANSPORT',
  PLACEMENT = 'PLACEMENT',
  TRAINING = 'TRAINING',
  COMPLETION = 'COMPLETION',
}

export const JOURNEY_STAGE_ORDER: JourneyStageKey[] = [
  JourneyStageKey.AZAAM_REVIEW,
  JourneyStageKey.PERMIT,
  JourneyStageKey.VISA,
  JourneyStageKey.RESIDENCE,
  JourneyStageKey.TRANSPORT,
  JourneyStageKey.PLACEMENT,
  JourneyStageKey.TRAINING,
  JourneyStageKey.COMPLETION,
];

export enum JourneyStageStatus {
  LOCKED = 'LOCKED',
  CURRENT = 'CURRENT',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  CORRECTION_REQUESTED = 'CORRECTION_REQUESTED',
}

export enum JourneyStageAction {
  APPROVE = 'APPROVE',
  REQUEST_CORRECTION = 'REQUEST_CORRECTION',
  REJECT = 'REJECT',
}

export interface IJourneyMilestoneHistoryEntry {
  action: JourneyStageAction;
  fromStatus: JourneyStageStatus;
  toStatus: JourneyStageStatus;
  reason?: string;
  actedBy: mongoose.Types.ObjectId;
  actedAt: Date;
}

export interface IJourneyMilestone extends Document {
  studentId: mongoose.Types.ObjectId;
  stageKey: JourneyStageKey;
  order: number;
  status: JourneyStageStatus;
  reason?: string;
  actedBy?: mongoose.Types.ObjectId | null;
  actedAt?: Date | null;
  history: IJourneyMilestoneHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const JourneyMilestoneHistorySchema = new Schema<IJourneyMilestoneHistoryEntry>(
  {
    action: { type: String, enum: Object.values(JourneyStageAction), required: true },
    fromStatus: { type: String, enum: Object.values(JourneyStageStatus), required: true },
    toStatus: { type: String, enum: Object.values(JourneyStageStatus), required: true },
    reason: { type: String, trim: true },
    actedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actedAt: { type: Date, required: true },
  },
  { _id: false }
);

const JourneyMilestoneSchema = new Schema<IJourneyMilestone>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    stageKey: { type: String, enum: Object.values(JourneyStageKey), required: true },
    order: { type: Number, required: true },
    status: {
      type: String,
      enum: Object.values(JourneyStageStatus),
      default: JourneyStageStatus.LOCKED,
      index: true,
    },
    reason: { type: String, trim: true },
    actedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    actedAt: { type: Date, default: null },
    history: { type: [JourneyMilestoneHistorySchema], default: [] },
  },
  { timestamps: true }
);

JourneyMilestoneSchema.index({ studentId: 1, stageKey: 1 }, { unique: true });

export const JourneyMilestone =
  (mongoose.models.JourneyMilestone as mongoose.Model<IJourneyMilestone>) ||
  mongoose.model<IJourneyMilestone>('JourneyMilestone', JourneyMilestoneSchema);
