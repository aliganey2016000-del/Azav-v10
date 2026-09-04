import mongoose, { Document, Schema } from 'mongoose';

export type PaymentDirection = 'INBOUND' | 'OUTBOUND';
export type PaymentCounterpartyType = 'STUDENT' | 'UNIVERSITY' | 'AZAAM' | 'ORGANIZATION';

export interface IPayment extends Document {
  userId?: mongoose.Types.ObjectId;
  universityId?: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  applicationId?: mongoose.Types.ObjectId;
  invoiceNumber?: string;
  type: 'FEE' | 'PAYMENT' | 'REFUND';
  direction: PaymentDirection;
  counterpartyType: PaymentCounterpartyType;
  counterpartyId?: mongoose.Types.ObjectId;
  description: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'REFUNDED';
  dueDate?: Date;
  paidAt?: Date;
  reference?: string;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    universityId: { type: Schema.Types.ObjectId, ref: 'University', index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    applicationId: { type: Schema.Types.ObjectId, ref: 'Application', index: true },
    invoiceNumber: { type: String, trim: true },
    type: { type: String, enum: ['FEE', 'PAYMENT', 'REFUND'], required: true },
    direction: { type: String, enum: ['INBOUND', 'OUTBOUND'], default: 'INBOUND', required: true, index: true },
    counterpartyType: {
      type: String,
      enum: ['STUDENT', 'UNIVERSITY', 'AZAAM', 'ORGANIZATION'],
      default: 'STUDENT',
      required: true,
      index: true,
    },
    counterpartyId: { type: Schema.Types.ObjectId, index: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', uppercase: true },
    status: { type: String, enum: ['PENDING', 'PAID', 'PARTIAL', 'OVERDUE', 'REFUNDED'], default: 'PENDING' },
    dueDate: Date,
    paidAt: Date,
    reference: { type: String, trim: true },
  },
  { timestamps: true }
);

PaymentSchema.index({ direction: 1, status: 1, createdAt: -1 });
PaymentSchema.index({ universityId: 1, direction: 1, createdAt: -1 });
PaymentSchema.index({ organizationId: 1, direction: 1, createdAt: -1 });

export const Payment = (mongoose.models.Payment as mongoose.Model<IPayment>) || mongoose.model<IPayment>('Payment', PaymentSchema);
