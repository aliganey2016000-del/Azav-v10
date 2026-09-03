import assert from 'assert';
import { requireRole } from '../middleware/rbac.js';
import { UserRole } from '../types/index.js';

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

function mockRequest(user: any) {
  return { user } as any;
}

async function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`TEST: ${name} ... ✅ PASSED`);
  } catch (err: any) {
    console.error(`TEST: ${name} ... ❌ FAILED`);
    throw err;
  }
}

async function runRbacTests() {
  await test('RBAC - Unauthenticated request returns 401', () => {
    const req = mockRequest(undefined);
    const res = mockResponse();
    let nextCalled = false;

    requireRole(UserRole.SUPER_ADMIN)(req, res as any, (() => { nextCalled = true; }) as any);

    assert.strictEqual(res.getStatus(), 401);
    assert.strictEqual(res.getBody().error.code, 'UNAUTHENTICATED');
    assert.strictEqual(nextCalled, false);
  });

  await test('RBAC - Unauthorized role returns 403', () => {
    const req = mockRequest({
      userId: 'student-1',
      email: 'student@azaam.org',
      roles: [UserRole.STUDENT],
    });
    const res = mockResponse();
    let nextCalled = false;

    requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF)(
      req,
      res as any,
      (() => { nextCalled = true; }) as any,
    );

    assert.strictEqual(res.getStatus(), 403);
    assert.strictEqual(res.getBody().error.code, 'FORBIDDEN');
    assert.strictEqual(nextCalled, false);
  });

  await test('RBAC - Allowed role reaches controller', () => {
    const req = mockRequest({
      userId: 'admin-1',
      email: 'admin@azaam.org',
      roles: [UserRole.SUPER_ADMIN],
    });
    const res = mockResponse();
    let nextCalled = false;

    requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF)(
      req,
      res as any,
      (() => { nextCalled = true; }) as any,
    );

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(res.getStatus(), 200);
  });

  await test('RBAC - Any matching role is sufficient for multi-role user', () => {
    const req = mockRequest({
      userId: 'staff-1',
      email: 'staff@azaam.org',
      roles: [UserRole.STUDENT, UserRole.UNIVERSITY_STAFF],
    });
    const res = mockResponse();
    let nextCalled = false;

    requireRole(UserRole.UNIVERSITY_STAFF)(
      req,
      res as any,
      (() => { nextCalled = true; }) as any,
    );

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(res.getStatus(), 200);
  });
}

runRbacTests().catch(() => {
  process.exitCode = 1;
});
