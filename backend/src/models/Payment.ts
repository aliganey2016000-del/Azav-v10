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

export type FinancePayerType = 'UNIVERSITY' | 'STUDENT' | 'ORGANIZATION';

export interface IInvoiceLineItem {
  feeRuleId?: mongoose.Types.ObjectId | null;
  serviceCode?: string;
  serviceName: string;
  category?: string;
  billingBasis?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  notes?: string;
}

export interface IPayment extends Document {
  userId?: mongoose.Types.ObjectId | null;
  universityId?: mongoose.Types.ObjectId | null;
  batchId?: mongoose.Types.ObjectId | null;
  applicationId?: mongoose.Types.ObjectId | null;
  organizationId?: mongoose.Types.ObjectId | null;
  payerType?: FinancePayerType;
  originalPaymentId?: mongoose.Types.ObjectId | null;
  invoiceId?: mongoose.Types.ObjectId | null;
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
  lineItems?: IInvoiceLineItem[];
  voidReason?: string;
  voidedAt?: Date | null;
  voidedBy?: mongoose.Types.ObjectId | null;
  createdBy?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceLineItemSchema = new Schema<IInvoiceLineItem>(
  {
    feeRuleId: { type: Schema.Types.ObjectId, ref: 'FeeRule', default: null },
    serviceCode: { type: String, trim: true, uppercase: true },
    serviceName: { type: String, required: true, trim: true, maxlength: 160 },
    category: { type: String, trim: true },
    billingBasis: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 0.01, default: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { _id: false }
);

const PaymentSchema = new Schema<IPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    universityId: { type: Schema.Types.ObjectId, ref: 'University', default: null, index: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'TrainingBatch', default: null, index: true },
    applicationId: { type: Schema.Types.ObjectId, ref: 'Application', default: null, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null, index: true },
    payerType: {
      type: String,
      enum: ['UNIVERSITY', 'STUDENT', 'ORGANIZATION'],
      default: 'STUDENT',
      index: true,
    },
    originalPaymentId: { type: Schema.Types.ObjectId, ref: 'Payment', default: null, index: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Payment', default: null, index: true },
    invoiceNumber: { type: String, trim: true, index: true },
    type: {
      type: String,
      enum: ['FEE', 'PAYMENT', 'REFUND', 'SETTLEMENT'],
      required: true,
      index: true,
    },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    amount: { type: Number, required: true, min: 0.01 },
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
    lineItems: { type: [InvoiceLineItemSchema], default: [] },
    voidReason: { type: String, trim: true, maxlength: 1000 },
    voidedAt: { type: Date, default: null },
    voidedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

PaymentSchema.index({ type: 1, status: 1, createdAt: -1 });
PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ universityId: 1, type: 1, createdAt: -1 });
PaymentSchema.index({ batchId: 1, type: 1, createdAt: -1 });
PaymentSchema.index({ invoiceId: 1, type: 1, status: 1 });

export const Payment =
  (mongoose.models.Payment as mongoose.Model<IPayment>) ||
  mongoose.model<IPayment>('Payment', PaymentSchema);
