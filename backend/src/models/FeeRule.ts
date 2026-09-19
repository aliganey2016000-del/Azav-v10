import mongoose, { Document, Schema } from 'mongoose';

export type FeeServiceCategory =
  | 'PLACEMENT'
  | 'VISA'
  | 'TRANSPORTATION'
  | 'RESIDENCE'
  | 'AIRPORT_PICKUP'
  | 'INSURANCE'
  | 'DOCUMENT_PROCESSING'
  | 'CERTIFICATION'
  | 'OTHER';

export type FeeBillingBasis =
  | 'PER_STUDENT'
  | 'PER_PLACEMENT'
  | 'PER_MONTH'
  | 'PER_TRIP'
  | 'ONE_TIME';

export type FeePayerType = 'UNIVERSITY' | 'STUDENT' | 'ORGANIZATION';
export type FeeRuleScope = 'GLOBAL' | 'UNIVERSITY';

export interface IFeeRule extends Document {
  serviceCode: string;
  serviceName: string;
  category: FeeServiceCategory;
  amount: number;
  currency: string;
  billingBasis: FeeBillingBasis;
  defaultPayer: FeePayerType;
  scope: FeeRuleScope;
  universityId?: mongoose.Types.ObjectId | null;
  effectiveFrom?: Date | null;
  effectiveTo?: Date | null;
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
  createdBy?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const FeeRuleSchema = new Schema<IFeeRule>(
  {
    serviceCode: { type: String, required: true, trim: true, uppercase: true, maxlength: 64 },
    serviceName: { type: String, required: true, trim: true, maxlength: 160 },
    category: {
      type: String,
      enum: [
        'PLACEMENT',
        'VISA',
        'TRANSPORTATION',
        'RESIDENCE',
        'AIRPORT_PICKUP',
        'INSURANCE',
        'DOCUMENT_PROCESSING',
        'CERTIFICATION',
        'OTHER',
      ],
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, default: 'USD', uppercase: true, trim: true, maxlength: 8 },
    billingBasis: {
      type: String,
      enum: ['PER_STUDENT', 'PER_PLACEMENT', 'PER_MONTH', 'PER_TRIP', 'ONE_TIME'],
      required: true,
      default: 'PER_STUDENT',
    },
    defaultPayer: {
      type: String,
      enum: ['UNIVERSITY', 'STUDENT', 'ORGANIZATION'],
      required: true,
      default: 'UNIVERSITY',
      index: true,
    },
    scope: {
      type: String,
      enum: ['GLOBAL', 'UNIVERSITY'],
      required: true,
      default: 'GLOBAL',
      index: true,
    },
    universityId: { type: Schema.Types.ObjectId, ref: 'University', default: null, index: true },
    effectiveFrom: { type: Date, default: null },
    effectiveTo: { type: Date, default: null },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', index: true },
    notes: { type: String, trim: true, maxlength: 2000 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

FeeRuleSchema.index(
  { serviceCode: 1, scope: 1, universityId: 1, defaultPayer: 1 },
  { unique: true }
);

FeeRuleSchema.pre('validate', function (this: IFeeRule) {
  if (this.scope === 'GLOBAL') {
    this.universityId = null;
  }
});

export const FeeRule =
  (mongoose.models.FeeRule as mongoose.Model<IFeeRule>) ||
  mongoose.model<IFeeRule>('FeeRule', FeeRuleSchema);
