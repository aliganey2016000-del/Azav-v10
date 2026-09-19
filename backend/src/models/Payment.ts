import mongoose, { Document, Schema } from 'mongoose';

export type FinanceRecordType = 'FEE' | 'PAYMENT' | 'REFUND' | 'SETTLEMENT';
export type FinanceRecordStatus =
  | 'PENDING'
  | 'PAID'
  | 'PARTIAL'
  | 'OVERDUE'
  | 'REFUNDED'
  | 'CANCELLED';
export type FinancePaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'MOBILE_MONEY'
  | 'CARD'
  | 'OTHER';

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  applicationId?: mongoose.Types.ObjectId | null;
  organizationId?: mongoose.Types.ObjectId | null;
  originalPaymentId?: mongoose.Types.ObjectId | null;
  invoiceNumber?: string;
  type: FinanceRecordType;
  description: string;
  amount: number;
  currency: string;
  status: FinanceRecordStatus;
  dueDate?: Date | null;
  paidAt?: Date | null;
  reference?: string;
  paymentMethod?: FinancePaymentMethod;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    applicationId: { type: Schema.Types.ObjectId, ref: 'Application', default: null, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null, index: true },
    originalPaymentId: { type: Schema.Types.ObjectId, ref: 'Payment', default: null, index: true },
    invoiceNumber: { type: String, trim: true, index: true },
    type: {
      type: String,
      enum: ['FEE', 'PAYMENT', 'REFUND', 'SETTLEMENT'],
      required: true,
      index: true,
    },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', uppercase: true, trim: true, maxlength: 8 },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'PARTIAL', 'OVERDUE', 'REFUNDED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    dueDate: { type: Date, default: null },
    paidAt: { type: Date, default: null },
    reference: { type: String, trim: true, index: true },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CARD', 'OTHER'],
    },
    notes: { type: String, trim: true, maxlength: 2000 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

PaymentSchema.index({ type: 1, status: 1, createdAt: -1 });
PaymentSchema.index({ userId: 1, createdAt: -1 });

export const Payment =
  (mongoose.models.Payment as mongoose.Model<IPayment>) ||
  mongoose.model<IPayment>('Payment', PaymentSchema);
