import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  applicationId?: mongoose.Types.ObjectId;
  invoiceNumber?: string;
  type: 'FEE' | 'PAYMENT' | 'REFUND';
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
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    applicationId: { type: Schema.Types.ObjectId, ref: 'Application', index: true },
    invoiceNumber: { type: String, trim: true },
    type: { type: String, enum: ['FEE', 'PAYMENT', 'REFUND'], required: true },
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

export const Payment = (mongoose.models.Payment as mongoose.Model<IPayment>) || mongoose.model<IPayment>('Payment', PaymentSchema);
