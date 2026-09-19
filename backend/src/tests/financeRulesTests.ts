import assert from 'assert';
import { Payment } from '../models/Payment.js';
import { deriveInvoiceStatus, isFinanceStatusAllowed } from '../services/financeRules.js';

async function test(name: string, fn: () => Promise<void> | void) {
  process.stdout.write(`FINANCE TEST: ${name} ... `);
  await fn();
  console.log('PASSED');
}

async function runTests() {
  let passed = 0;

  try {
    await test('Invoice status becomes PAID when net payments cover amount', () => {
      assert.strictEqual(
        deriveInvoiceStatus({
          amount: 100,
          netPaid: 100,
          dueDate: new Date('2026-12-31T00:00:00Z'),
          now: new Date('2026-09-19T00:00:00Z'),
        }),
        'PAID'
      );
    });
    passed++;

    await test('Invoice status becomes PARTIAL when some balance is paid', () => {
      assert.strictEqual(
        deriveInvoiceStatus({
          amount: 100,
          netPaid: 40,
          dueDate: new Date('2026-09-01T00:00:00Z'),
          now: new Date('2026-09-19T00:00:00Z'),
        }),
        'PARTIAL'
      );
    });
    passed++;

    await test('Unpaid past-due invoice becomes OVERDUE', () => {
      assert.strictEqual(
        deriveInvoiceStatus({
          amount: 100,
          netPaid: 0,
          dueDate: new Date('2026-09-01T00:00:00Z'),
          now: new Date('2026-09-19T00:00:00Z'),
        }),
        'OVERDUE'
      );
    });
    passed++;

    await test('Cancelled invoice remains CANCELLED regardless of balance', () => {
      assert.strictEqual(
        deriveInvoiceStatus({
          amount: 100,
          netPaid: 100,
          currentStatus: 'CANCELLED',
          now: new Date('2026-09-19T00:00:00Z'),
        }),
        'CANCELLED'
      );
    });
    passed++;

    await test('Status rules reject invalid type/status combinations', () => {
      assert.strictEqual(isFinanceStatusAllowed('FEE', 'OVERDUE'), true);
      assert.strictEqual(isFinanceStatusAllowed('PAYMENT', 'OVERDUE'), false);
      assert.strictEqual(isFinanceStatusAllowed('REFUND', 'PARTIAL'), false);
      assert.strictEqual(isFinanceStatusAllowed('SETTLEMENT', 'PAID'), true);
      assert.strictEqual(isFinanceStatusAllowed('SETTLEMENT', 'REFUNDED'), false);
    });
    passed++;

    await test('Finance schema includes invoice linkage and void audit fields', () => {
      const paths = Payment.schema.paths;
      assert.ok(paths.invoiceId, 'invoiceId must exist');
      assert.ok(paths.originalPaymentId, 'originalPaymentId must exist');
      assert.ok(paths.voidReason, 'voidReason must exist');
      assert.ok(paths.voidedAt, 'voidedAt must exist');
      assert.ok(paths.voidedBy, 'voidedBy must exist');
    });
    passed++;

    await test('Finance schema indexes invoice-linked activity', () => {
      const indexes = Payment.schema.indexes();
      assert.ok(
        indexes.some(
          ([fields]) =>
            fields.invoiceId === 1 &&
            fields.type === 1 &&
            fields.status === 1
        ),
        'Invoice activity index is required'
      );
    });
    passed++;

    console.log(`FINANCE TESTS: ${passed} PASSED, 0 FAILED.`);
  } catch (error: any) {
    console.error(`FINANCE TESTS FAILED: ${error.message}`);
    process.exitCode = 1;
  }
}

runTests();
