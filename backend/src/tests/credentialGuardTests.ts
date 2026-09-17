import assert from 'assert';
import { validateAdminPasswordReset, validateInstitutionInitialAdminPassword } from '../middleware/credentialGuard.js';

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

async function test(name: string, fn: () => void | Promise<void>) {
  process.stdout.write(`CREDENTIAL GUARD TEST: ${name} ... `);
  await fn();
  console.log('PASSED');
}

async function runTests() {
  let passed = 0;

  await test('rejects weak initial organization admin password', () => {
    const req: any = { body: { initialAdminEmail: 'admin@example.test', initialAdminPassword: 'short123' } };
    const res = mockResponse();
    let nextCalled = false;
    validateInstitutionInitialAdminPassword(req, res as any, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.getStatus(), 400);
    assert.strictEqual(res.getBody().error.code, 'WEAK_PASSWORD');
  });
  passed++;

  await test('accepts strong initial organization admin password', () => {
    const req: any = { body: { initialAdminEmail: 'admin@example.test', initialAdminPassword: 'StrongPass12!' } };
    const res = mockResponse();
    let nextCalled = false;
    validateInstitutionInitialAdminPassword(req, res as any, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(res.getStatus(), 200);
  });
  passed++;

  await test('allows institution creation without an initial admin', () => {
    const req: any = { body: {} };
    const res = mockResponse();
    let nextCalled = false;
    validateInstitutionInitialAdminPassword(req, res as any, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
  });
  passed++;

  await test('rejects weak admin password reset', () => {
    const req: any = { body: { newPassword: '12345678' } };
    const res = mockResponse();
    let nextCalled = false;
    validateAdminPasswordReset(req, res as any, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.getStatus(), 400);
    assert.strictEqual(res.getBody().error.code, 'WEAK_PASSWORD');
  });
  passed++;

  await test('accepts strong admin password reset', () => {
    const req: any = { body: { newPassword: 'AnotherStrong12!' } };
    const res = mockResponse();
    let nextCalled = false;
    validateAdminPasswordReset(req, res as any, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
  });
  passed++;

  console.log(`CREDENTIAL GUARD TESTS: ${passed} PASSED, 0 FAILED.`);
}

runTests().catch((error) => {
  console.error(`CREDENTIAL GUARD TESTS FAILED: ${error?.message || error}`);
  process.exitCode = 1;
});
