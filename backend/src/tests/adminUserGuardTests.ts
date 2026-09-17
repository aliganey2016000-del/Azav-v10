import assert from 'assert';
import { authorizeManagedUserTarget, validateManagedUserCreate } from '../middleware/adminUserGuard.js';
import { memoryUsers } from '../services/memoryStore.js';
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

async function runMiddleware(fn: any, req: any) {
  const res = mockResponse();
  let nextCalled = false;
  await fn(req, res as any, () => { nextCalled = true; });
  return { res, nextCalled };
}

async function test(name: string, fn: () => Promise<void>) {
  process.stdout.write(`ADMIN USER GUARD TEST: ${name} ... `);
  await fn();
  console.log('PASSED');
}

async function runTests() {
  let passed = 0;

  await test('Created users require an explicit strong password', async () => {
    const { res, nextCalled } = await runMiddleware(validateManagedUserCreate, {
      user: { userId: 'root', roles: [UserRole.SUPER_ADMIN] },
      body: { roles: [UserRole.STUDENT], password: 'short' },
    });
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.getStatus(), 400);
    assert.strictEqual(res.getBody().error.code, 'WEAK_PASSWORD');
  });
  passed++;

  await test('University admin cannot create organization accounts', async () => {
    const { res, nextCalled } = await runMiddleware(validateManagedUserCreate, {
      user: { userId: 'ua-1', roles: [UserRole.UNIVERSITY_ADMIN], universityId: 'uni-1' },
      body: { roles: [UserRole.ORGANIZATION_STAFF], password: 'StrongPassword9!' },
    });
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.getStatus(), 403);
  });
  passed++;

  await test('University admin student creation is forced into own tenant', async () => {
    const req: any = {
      user: { userId: 'ua-1', roles: [UserRole.UNIVERSITY_ADMIN], universityId: 'uni-1' },
      body: { roles: [UserRole.STUDENT], password: 'StrongPassword9!' },
    };
    const { nextCalled } = await runMiddleware(validateManagedUserCreate, req);
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.body.universityId, 'uni-1');
    assert.strictEqual(req.body.organizationId, null);
  });
  passed++;

  const crossTenantId = `guard-cross-${Date.now()}`;
  const privilegedId = `guard-privileged-${Date.now()}`;
  memoryUsers.push({
    _id: crossTenantId,
    id: crossTenantId,
    firstName: 'Other',
    lastName: 'Tenant',
    email: `${crossTenantId}@example.test`,
    roles: [UserRole.STUDENT],
    status: 'ACTIVE',
    universityId: { _id: 'uni-2' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  memoryUsers.push({
    _id: privilegedId,
    id: privilegedId,
    firstName: 'Peer',
    lastName: 'Admin',
    email: `${privilegedId}@example.test`,
    roles: [UserRole.UNIVERSITY_ADMIN],
    status: 'ACTIVE',
    universityId: { _id: 'uni-1' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  try {
    await test('University admin cannot read a user in another tenant', async () => {
      const { res, nextCalled } = await runMiddleware(authorizeManagedUserTarget, {
        method: 'GET',
        params: { id: crossTenantId },
        body: {},
        user: { userId: 'ua-1', roles: [UserRole.UNIVERSITY_ADMIN], universityId: 'uni-1' },
      });
      assert.strictEqual(nextCalled, false);
      assert.strictEqual(res.getStatus(), 403);
    });
    passed++;

    await test('University admin cannot manage a peer privileged admin', async () => {
      const { res, nextCalled } = await runMiddleware(authorizeManagedUserTarget, {
        method: 'PATCH',
        params: { id: privilegedId },
        body: { status: 'INACTIVE' },
        user: { userId: 'ua-1', roles: [UserRole.UNIVERSITY_ADMIN], universityId: 'uni-1' },
      });
      assert.strictEqual(nextCalled, false);
      assert.strictEqual(res.getStatus(), 403);
    });
    passed++;

    await test('System admin may manage any existing target', async () => {
      const { nextCalled } = await runMiddleware(authorizeManagedUserTarget, {
        method: 'PATCH',
        params: { id: crossTenantId },
        body: { status: 'INACTIVE' },
        user: { userId: 'root', roles: [UserRole.SUPER_ADMIN] },
      });
      assert.strictEqual(nextCalled, true);
    });
    passed++;
  } finally {
    for (const id of [crossTenantId, privilegedId]) {
      const index = memoryUsers.findIndex((user) => user._id === id || user.id === id);
      if (index >= 0) memoryUsers.splice(index, 1);
    }
  }

  console.log(`ADMIN USER GUARD TESTS: ${passed} PASSED, 0 FAILED.`);
}

runTests().catch((error) => {
  console.error(`ADMIN USER GUARD TESTS FAILED: ${error?.message || error}`);
  process.exitCode = 1;
});
