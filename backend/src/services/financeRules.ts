import { FinanceRecordStatus, FinanceRecordType } from '../models/Payment.js';

export const FINANCE_STATUS_BY_TYPE: Record<FinanceRecordType, FinanceRecordStatus[]> = {
  FEE: ['PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED'],
  PAYMENT: ['PAID', 'REFUNDED', 'CANCELLED'],
  REFUND: ['REFUNDED', 'CANCELLED'],
  SETTLEMENT: ['PENDING', 'PAID', 'CANCELLED'],
};

export const isFinanceStatusAllowed = (
  type: FinanceRecordType,
  status: FinanceRecordStatus
) => FINANCE_STATUS_BY_TYPE[type]?.includes(status) ?? false;

export const deriveInvoiceStatus = (input: {
  amount: number;
  netPaid: number;
  dueDate?: Date | string | null;
  currentStatus?: FinanceRecordStatus | null;
  now?: Date;
}): FinanceRecordStatus => {
  if (input.currentStatus === 'CANCELLED') return 'CANCELLED';

  const amount = Math.max(0, Number(input.amount) || 0);
  const netPaid = Math.max(0, Number(input.netPaid) || 0);

  if (amount > 0 && netPaid >= amount) return 'PAID';
  if (netPaid > 0) return 'PARTIAL';

  const now = input.now ?? new Date();
  const dueDate = input.dueDate ? new Date(input.dueDate) : null;

  if (dueDate && !Number.isNaN(dueDate.getTime()) && dueDate.getTime() < now.getTime()) {
    return 'OVERDUE';
  }

  return 'PENDING';
};
