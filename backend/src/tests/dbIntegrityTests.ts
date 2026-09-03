import assert from 'assert';
import { Placement, ClinicalAttachment } from '../models/Placement.js';
import { Attendance } from '../models/Attendance.js';
import { Evaluation } from '../models/Evaluation.js';
import { Certificate } from '../models/Certificate.js';

async function test(name: string, fn: () => Promise<void>) {
  process.stdout.write(`DB INTEGRITY TEST: ${name} ... `);
  await fn();
  console.log('PASSED');
}

async function runTests() {
  let passed = 0;
  try {
    await test('Placement rejects endDate before startDate', async () => {
      const doc = new Placement({
        applicationId: '507f1f77bcf86cd799439011',
        studentId: '507f1f77bcf86cd799439012',
        organizationId: '507f1f77bcf86cd799439013',
        startDate: new Date('2026-09-10T00:00:00Z'),
        endDate: new Date('2026-09-09T00:00:00Z'),
        createdBy: '507f1f77bcf86cd799439014',
      });
      const error = doc.validateSync();
      assert.ok(error?.errors.endDate, 'Invalid placement date range must fail validation');
    });
    passed++;

    await test('Clinical attachment rejects endDate before startDate', async () => {
      const doc = new ClinicalAttachment({
        placementId: '507f1f77bcf86cd799439011',
        studentId: '507f1f77bcf86cd799439012',
        organizationId: '507f1f77bcf86cd799439013',
        startDate: new Date('2026-09-10T00:00:00Z'),
        endDate: new Date('2026-09-09T00:00:00Z'),
      });
      const error = doc.validateSync();
      assert.ok(error?.errors.endDate, 'Invalid attachment date range must fail validation');
    });
    passed++;

    await test('Attendance has unique attachment/date constraint', async () => {
      const indexes = Attendance.schema.indexes();
      assert.ok(indexes.some(([fields, options]) =>
        fields.attachmentId === 1 && fields.date === 1 && options?.unique === true
      ));
    });
    passed++;

    await test('Evaluation has unique attachment/type constraint', async () => {
      const indexes = Evaluation.schema.indexes();
      assert.ok(indexes.some(([fields, options]) =>
        fields.attachmentId === 1 && fields.type === 1 && options?.unique === true
      ));
    });
    passed++;

    await test('Certificate has unique verification identifiers', async () => {
      const indexes = Certificate.schema.indexes();
      assert.ok(indexes.some(([fields, options]) => fields.certificateNumber === 1 && options?.unique === true));
      assert.ok(indexes.some(([fields, options]) => fields.verificationCode === 1 && options?.unique === true));
    });
    passed++;

    console.log(`DB INTEGRITY TESTS: ${passed} PASSED, 0 FAILED.`);
  } catch (err: any) {
    console.error(`DB INTEGRITY TESTS FAILED: ${err.message}`);
    process.exitCode = 1;
  }
}

runTests();
