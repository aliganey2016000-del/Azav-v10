import assert from 'assert';
import { ApplicationController } from '../controllers/application.controller.js';
import { PlacementController } from '../controllers/placement.controller.js';
import { ApplicationService } from '../services/application.service.js';
import { PlacementService } from '../services/placement.service.js';
import { DocumentService } from '../services/document.service.js';
import { CertificateService } from '../services/certificate.service.js';
import { StorageService } from '../services/storage.service.js';
import { Application } from '../models/Application.js';
import { DocumentModel } from '../models/Document.js';
import { Certificate } from '../models/Certificate.js';
import { UserRole } from '../types/index.js';

function mockResponse() {
  let statusCode = 200;
  let body: any;
  return {
    status(code: number) { statusCode = code; return this; },
    json(value: any) { body = value; return this; },
    getStatus: () => statusCode,
    getBody: () => body,
  };
}

function queryResult<T>(value: T) {
  const query: any = {
    sort() { return query; },
    skip() { return query; },
    limit() { return query; },
    populate() { return query; },
    select() { return query; },
    then(resolve: any, reject: any) {
      return Promise.resolve(value).then(resolve, reject);
    },
  };
  return query;
}

async function test(name: string, fn: () => Promise<void>) {
  process.stdout.write(`AUTHORIZATION TEST: ${name} ... `);
  await fn();
  console.log('PASSED');
}

async function runTests() {
  let passed = 0;

  await test('Organization role cannot list all applications', async () => {
    const original = ApplicationService.getApplications;
    let serviceCalled = false;
    ApplicationService.getApplications = (async () => {
      serviceCalled = true;
      return [];
    }) as any;
    try {
      const req: any = {
        user: { userId: 'org-user', roles: [UserRole.ORGANIZATION_ADMIN], organizationId: 'org-1' },
      };
      const res = mockResponse();
      let nextError: any;
      await ApplicationController.list(req, res as any, ((error: any) => { nextError = error; }) as any);
      assert.strictEqual(nextError, undefined);
      assert.strictEqual(res.getStatus(), 403);
      assert.strictEqual(res.getBody().error.code, 'FORBIDDEN_SCOPE');
      assert.strictEqual(serviceCalled, false);
    } finally {
      ApplicationService.getApplications = original;
    }
  });
  passed++;

  await test('Organization admin cannot create placement for another organization', async () => {
    const original = PlacementService.createPlacement;
    let serviceCalled = false;
    PlacementService.createPlacement = (async () => {
      serviceCalled = true;
      return {} as any;
    }) as any;
    try {
      const req: any = {
        user: { userId: 'org-admin', roles: [UserRole.ORGANIZATION_ADMIN], organizationId: 'org-1' },
        body: {
          applicationId: 'app-1',
          studentId: 'student-1',
          organizationId: 'org-2',
          startDate: '2026-09-20',
          endDate: '2026-10-20',
        },
      };
      const res = mockResponse();
      let nextError: any;
      await PlacementController.create(req, res as any, ((error: any) => { nextError = error; }) as any);
      assert.strictEqual(nextError, undefined);
      assert.strictEqual(res.getStatus(), 403);
      assert.strictEqual(res.getBody().error.code, 'FORBIDDEN_TENANT');
      assert.strictEqual(serviceCalled, false);
    } finally {
      PlacementService.createPlacement = original;
    }
  });
  passed++;

  await test('Placement student must match application student', async () => {
    const originalFindById = Application.findById;
    Application.findById = (() => ({
      select: async () => ({ studentId: 'student-b' }),
    })) as any;
    try {
      let caught: any;
      try {
        await PlacementService.createPlacement('admin-1', {
          applicationId: 'app-1',
          studentId: 'student-a',
          organizationId: 'org-1',
          startDate: new Date('2026-09-20'),
          endDate: new Date('2026-10-20'),
        });
      } catch (error) {
        caught = error;
      }
      assert.ok(caught);
      assert.strictEqual(caught.code, 'APPLICATION_STUDENT_MISMATCH');
    } finally {
      Application.findById = originalFindById;
    }
  });
  passed++;

  await test('Document search preserves student ownership scope', async () => {
    const originalFind = DocumentModel.find;
    const originalCount = DocumentModel.countDocuments;
    let capturedFilter: any;
    DocumentModel.find = ((filter: any) => {
      capturedFilter = filter;
      return queryResult([]);
    }) as any;
    DocumentModel.countDocuments = (async () => 0) as any;
    try {
      await DocumentService.listDocuments(
        { search: 'passport' },
        { userId: 'user-1', email: 'student@example.test', roles: [UserRole.STUDENT], studentId: 'student-1' } as any,
      );
      assert.ok(Array.isArray(capturedFilter.$and));
      assert.strictEqual(capturedFilter.$and.length, 2);
      const ownershipOr = capturedFilter.$and[0].$or;
      assert.ok(ownershipOr.some((condition: any) => condition.uploadedBy === 'user-1'));
      assert.ok(ownershipOr.some((condition: any) => condition.studentId === 'student-1'));
      assert.ok(Array.isArray(capturedFilter.$and[1].$or));
    } finally {
      DocumentModel.find = originalFind;
      DocumentModel.countDocuments = originalCount;
    }
  });
  passed++;

  await test('Independent applicant certificate list is limited to own student record', async () => {
    const originalFind = Certificate.find;
    const originalCount = Certificate.countDocuments;
    let capturedFilter: any;
    Certificate.find = ((filter: any) => {
      capturedFilter = filter;
      return queryResult([]);
    }) as any;
    Certificate.countDocuments = (async () => 0) as any;
    try {
      await CertificateService.listCertificates(
        {},
        { userId: 'independent-1', email: 'independent@example.test', roles: [UserRole.INDEPENDENT_APPLICANT], studentId: 'student-9' } as any,
      );
      assert.strictEqual(capturedFilter.studentId, 'student-9');
    } finally {
      Certificate.find = originalFind;
      Certificate.countDocuments = originalCount;
    }
  });
  passed++;

  await test('Configured S3 provider fails closed when private object storage is not configured', async () => {
    const envKeys = [
      'STORAGE_PROVIDER',
      'S3_ENDPOINT',
      'S3_BUCKET',
      'S3_ACCESS_KEY',
      'S3_SECRET_KEY',
    ] as const;
    const previous = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

    process.env.STORAGE_PROVIDER = 's3';
    delete process.env.S3_ENDPOINT;
    delete process.env.S3_BUCKET;
    delete process.env.S3_ACCESS_KEY;
    delete process.env.S3_SECRET_KEY;
    (StorageService as any).provider = undefined;

    try {
      let caught: any;
      try {
        const provider = StorageService.getProvider();
        await provider.uploadFile({
          originalname: 'test.pdf',
          mimetype: 'application/pdf',
          buffer: Buffer.from('test'),
        });
      } catch (error) {
        caught = error;
      }

      assert.ok(caught);
      assert.strictEqual(caught.code, 'STORAGE_CONFIGURATION_ERROR');
    } finally {
      for (const key of envKeys) {
        const value = previous[key];
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
      (StorageService as any).provider = undefined;
    }
  });
  passed++;

  console.log(`AUTHORIZATION HARDENING TESTS: ${passed} PASSED, 0 FAILED.`);
}

runTests().catch((error) => {
  console.error(`AUTHORIZATION HARDENING TESTS FAILED: ${error?.message || error}`);
  process.exitCode = 1;
});
