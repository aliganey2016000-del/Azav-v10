import assert from 'assert';
import { UserRole } from '../types/index.js';
import {
  validateAttachmentAccess,
  validateLogbookEntryAccess,
} from '../middleware/idor.js';
import { ClinicalAttachment } from '../models/Placement.js';
import { ClinicalSupervisor } from '../models/ClinicalSupervisor.js';
import { Student } from '../models/Student.js';
import { LogbookEntry } from '../models/LogbookEntry.js';

function mockResponse() {
  let statusCode = 200;
  let body: any;
  return {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(value: any) {
      body = value;
      return this;
    },
    getStatus: () => statusCode,
    getBody: () => body,
  };
}

function mockRequest(user: any, params: Record<string, string> = {}, body: any = {}) {
  return { user, params, body } as any;
}

async function test(name: string, fn: () => Promise<void>) {
  process.stdout.write(`SECURITY TEST: ${name} ... `);
  await fn();
  console.log('✅ PASSED');
}

async function run() {
  let passed = 0;
  try {
    await test('Attachment unauthenticated request is rejected', async () => {
      const req = mockRequest(undefined, { attachmentId: 'attachment-1' });
      const res = mockResponse();
      let nextCalled = false;
      await validateAttachmentAccess(req, res as any, (() => { nextCalled = true; }) as any);
      assert.strictEqual(res.getStatus(), 401);
      assert.strictEqual(nextCalled, false);
    });
    passed++;

    await test('Attachment missing ID cannot bypass authorization', async () => {
      const req = mockRequest({ userId: 'user-1', roles: [UserRole.STUDENT], studentId: 'student-1' });
      const res = mockResponse();
      let nextCalled = false;
      await validateAttachmentAccess(req, res as any, (() => { nextCalled = true; }) as any);
      assert.strictEqual(res.getStatus(), 400);
      assert.strictEqual(res.getBody().error.code, 'MISSING_RESOURCE_ID');
      assert.strictEqual(nextCalled, false);
    });

    await test('Student cannot access another student attachment', async () => {
      const originalFindById = ClinicalAttachment.findById;
      ClinicalAttachment.findById = (async () => ({
        select: async () => ({ studentId: 'student-2', organizationId: 'org-1', supervisorId: 'supervisor-1' }),
      })) as any;
      try {
        const req = mockRequest({ userId: 'user-1', roles: [UserRole.STUDENT], studentId: 'student-1' }, { attachmentId: 'attachment-2' });
        const res = mockResponse();
        let nextCalled = false;
        await validateAttachmentAccess(req, res as any, (() => { nextCalled = true; }) as any);
        assert.strictEqual(res.getStatus(), 403);
        assert.strictEqual(res.getBody().error.code, 'FORBIDDEN_SCOPE');
        assert.strictEqual(nextCalled, false);
      } finally {
        ClinicalAttachment.findById = originalFindById;
      }
    });
    passed++;

    await test('Student can access own attachment', async () => {
      const originalFindById = ClinicalAttachment.findById;
      ClinicalAttachment.findById = (async () => ({
        select: async () => ({ studentId: 'student-1', organizationId: 'org-1', supervisorId: 'supervisor-1' }),
      })) as any;
      try {
        const req = mockRequest({ userId: 'user-1', roles: [UserRole.STUDENT], studentId: 'student-1' }, { attachmentId: 'attachment-1' });
        const res = mockResponse();
        let nextCalled = false;
        await validateAttachmentAccess(req, res as any, (() => { nextCalled = true; }) as any);
        assert.strictEqual(nextCalled, true);
        assert.strictEqual(res.getStatus(), 200);
      } finally {
        ClinicalAttachment.findById = originalFindById;
      }
    });
    passed++;

    await test('Organization staff cannot cross organization boundary', async () => {
      const originalFindById = ClinicalAttachment.findById;
      ClinicalAttachment.findById = (async () => ({
        select: async () => ({ studentId: 'student-2', organizationId: 'org-2', supervisorId: 'supervisor-1' }),
      })) as any;
      try {
        const req = mockRequest({ userId: 'org-user', roles: [UserRole.ORGANIZATION_STAFF], organizationId: 'org-1' }, { attachmentId: 'attachment-2' });
        const res = mockResponse();
        let nextCalled = false;
        await validateAttachmentAccess(req, res as any, (() => { nextCalled = true; }) as any);
        assert.strictEqual(res.getStatus(), 403);
        assert.strictEqual(res.getBody().error.code, 'FORBIDDEN_TENANT');
        assert.strictEqual(nextCalled, false);
      } finally {
        ClinicalAttachment.findById = originalFindById;
      }
    });
    passed++;

    await test('Clinical supervisor is restricted to assigned attachment', async () => {
      const originalAttachmentFind = ClinicalAttachment.findById;
      const originalSupervisorFind = ClinicalSupervisor.findOne;
      ClinicalAttachment.findById = (async () => ({
        select: async () => ({ studentId: 'student-1', organizationId: 'org-1', supervisorId: 'supervisor-2' }),
      })) as any;
      ClinicalSupervisor.findOne = (async () => ({ select: async () => ({ _id: 'supervisor-1' }) })) as any;
      try {
        const req = mockRequest({ userId: 'user-supervisor-1', roles: [UserRole.CLINICAL_SUPERVISOR] }, { attachmentId: 'attachment-2' });
        const res = mockResponse();
        let nextCalled = false;
        await validateAttachmentAccess(req, res as any, (() => { nextCalled = true; }) as any);
        assert.strictEqual(res.getStatus(), 403);
        assert.strictEqual(res.getBody().error.code, 'FORBIDDEN_SUPERVISOR_SCOPE');
        assert.strictEqual(nextCalled, false);
      } finally {
        ClinicalAttachment.findById = originalAttachmentFind;
        ClinicalSupervisor.findOne = originalSupervisorFind;
      }
    });
    passed++;

    await test('Clinical supervisor can access assigned attachment', async () => {
      const originalAttachmentFind = ClinicalAttachment.findById;
      const originalSupervisorFind = ClinicalSupervisor.findOne;
      ClinicalAttachment.findById = (async () => ({
        select: async () => ({ studentId: 'student-1', organizationId: 'org-1', supervisorId: 'supervisor-1' }),
      })) as any;
      ClinicalSupervisor.findOne = (async () => ({ select: async () => ({ _id: 'supervisor-1' }) })) as any;
      try {
        const req = mockRequest({ userId: 'user-supervisor-1', roles: [UserRole.CLINICAL_SUPERVISOR] }, { attachmentId: 'attachment-1' });
        const res = mockResponse();
        let nextCalled = false;
        await validateAttachmentAccess(req, res as any, (() => { nextCalled = true; }) as any);
        assert.strictEqual(nextCalled, true);
        assert.strictEqual(res.getStatus(), 200);
      } finally {
        ClinicalAttachment.findById = originalAttachmentFind;
        ClinicalSupervisor.findOne = originalSupervisorFind;
      }
    });
    passed++;

    await test('University staff cannot cross university boundary', async () => {
      const originalAttachmentFind = ClinicalAttachment.findById;
      const originalStudentFind = Student.findById;
      ClinicalAttachment.findById = (async () => ({
        select: async () => ({ studentId: 'student-2', organizationId: 'org-2', supervisorId: 'supervisor-2' }),
      })) as any;
      Student.findById = (async () => ({ select: async () => ({ universityId: 'university-2' }) })) as any;
      try {
        const req = mockRequest({ userId: 'uni-user', roles: [UserRole.UNIVERSITY_STAFF], universityId: 'university-1' }, { attachmentId: 'attachment-2' });
        const res = mockResponse();
        let nextCalled = false;
        await validateAttachmentAccess(req, res as any, (() => { nextCalled = true; }) as any);
        assert.strictEqual(res.getStatus(), 403);
        assert.strictEqual(res.getBody().error.code, 'FORBIDDEN_TENANT');
        assert.strictEqual(nextCalled, false);
      } finally {
        ClinicalAttachment.findById = originalAttachmentFind;
        Student.findById = originalStudentFind;
      }
    });
    passed++;

    await test('Logbook review uses the entry attachment, not client-supplied scope', async () => {
      const originalEntryFind = LogbookEntry.findById;
      const originalAttachmentFind = ClinicalAttachment.findById;
      LogbookEntry.findById = (async () => ({ select: async () => ({ attachmentId: 'attachment-2' }) })) as any;
      ClinicalAttachment.findById = (async () => ({
        select: async () => ({ organizationId: 'org-2', supervisorId: 'supervisor-2' }),
      })) as any;
      try {
        const req = mockRequest({ userId: 'org-admin', roles: [UserRole.ORGANIZATION_ADMIN], organizationId: 'org-1' }, { id: 'logbook-2' }, { attachmentId: 'attachment-1' });
        const res = mockResponse();
        let nextCalled = false;
        await validateLogbookEntryAccess(req, res as any, (() => { nextCalled = true; }) as any);
        assert.strictEqual(res.getStatus(), 403);
        assert.strictEqual(res.getBody().error.code, 'FORBIDDEN_TENANT');
        assert.strictEqual(nextCalled, false);
      } finally {
        LogbookEntry.findById = originalEntryFind;
        ClinicalAttachment.findById = originalAttachmentFind;
      }
    });
    passed++;

    await test('Logbook review rejects unassigned clinical supervisor', async () => {
      const originalEntryFind = LogbookEntry.findById;
      const originalAttachmentFind = ClinicalAttachment.findById;
      const originalSupervisorFind = ClinicalSupervisor.findOne;
      LogbookEntry.findById = (async () => ({ select: async () => ({ attachmentId: 'attachment-2' }) })) as any;
      ClinicalAttachment.findById = (async () => ({
        select: async () => ({ organizationId: 'org-1', supervisorId: 'supervisor-2' }),
      })) as any;
      ClinicalSupervisor.findOne = (async () => ({ select: async () => ({ _id: 'supervisor-1' }) })) as any;
      try {
        const req = mockRequest({ userId: 'user-supervisor-1', roles: [UserRole.CLINICAL_SUPERVISOR] }, { id: 'logbook-2' });
        const res = mockResponse();
        let nextCalled = false;
        await validateLogbookEntryAccess(req, res as any, (() => { nextCalled = true; }) as any);
        assert.strictEqual(res.getStatus(), 403);
        assert.strictEqual(res.getBody().error.code, 'FORBIDDEN_SUPERVISOR_SCOPE');
        assert.strictEqual(nextCalled, false);
      } finally {
        LogbookEntry.findById = originalEntryFind;
        ClinicalAttachment.findById = originalAttachmentFind;
        ClinicalSupervisor.findOne = originalSupervisorFind;
      }
    });
    passed++;

    console.log(`\nAttachment/logbook security tests: ${passed} passed`);
  } catch (err) {
    console.error('\nAttachment/logbook security tests FAILED');
    throw err;
  }
}

run().catch(() => process.exitCode = 1);
