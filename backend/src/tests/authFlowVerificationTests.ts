import assert from 'assert';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth.js';
import { HealthController } from '../controllers/health.controller.js';
import { AuthService } from '../services/auth.service.js';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
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

async function runAuthFlowVerification() {
  console.log('==================================================');
  console.log('PHASE A — AUTH & RUNTIME VERIFICATION SUITE');
  console.log('==================================================\n');

  // 1. Health & Ready Endpoints
  {
    const req = {} as any;
    const res = mockResponse();
    HealthController.getHealth(req, res as any);
    assert.strictEqual(res.getStatus(), 200);
    assert.strictEqual(res.getBody().success, true);
    assert.strictEqual(res.getBody().data.status, 'UP');
    assert.ok(res.getBody().data.timestamp);
    console.log('TEST: Backend Health Endpoint (/health) ... ✅ PASSED');
  }

  // 2. Unauthenticated Request Rejected
  {
    const req = { headers: {} } as any;
    const res = mockResponse();
    let nextCalled = false;
    await authenticate(req, res as any, (() => { nextCalled = true; }) as any);
    assert.strictEqual(res.getStatus(), 401);
    assert.strictEqual(res.getBody().error.code, 'UNAUTHENTICATED');
    assert.strictEqual(nextCalled, false);
    console.log('TEST: Unauthenticated Request Blocked ... ✅ PASSED');
  }

  // 3. Expired JWT Token Rejected
  {
    const expiredToken = jwt.sign({ sub: 'user-expired', email: 'expired@azaam.org', roles: [UserRole.STUDENT] }, env.JWT_SECRET, { expiresIn: -10 });
    const req = { headers: { authorization: `Bearer ${expiredToken}` } } as any;
    const res = mockResponse();
    let nextCalled = false;
    await authenticate(req, res as any, (() => { nextCalled = true; }) as any);
    assert.strictEqual(res.getStatus(), 401);
    assert.strictEqual(res.getBody().error.code, 'INVALID_TOKEN');
    assert.strictEqual(nextCalled, false);
    console.log('TEST: Expired JWT Rejected ... ✅ PASSED');
  }

  // 4. Invalid Signature JWT Rejected
  {
    const forgedToken = jwt.sign({ sub: 'user-forged', email: 'attacker@evil.com', roles: [UserRole.SUPER_ADMIN] }, 'wrong-secret-key-123');
    const req = { headers: { authorization: `Bearer ${forgedToken}` } } as any;
    const res = mockResponse();
    let nextCalled = false;
    await authenticate(req, res as any, (() => { nextCalled = true; }) as any);
    assert.strictEqual(res.getStatus(), 401);
    assert.strictEqual(res.getBody().error.code, 'INVALID_TOKEN');
    assert.strictEqual(nextCalled, false);
    console.log('TEST: Forged/Tampered JWT Rejected ... ✅ PASSED');
  }

  // 5. Inactive User Rejection in Authentication Middleware
  {
    const originalFindById = (User as any).findById;
    try {
      (User as any).findById = () => ({
        select: async () => ({
          _id: 'user-inactive-id',
          email: 'inactive@azaam.org',
          roles: [UserRole.STUDENT],
          status: 'INACTIVE',
        }),
      });

      const validToken = jwt.sign({ sub: 'user-inactive-id', email: 'inactive@azaam.org', roles: [UserRole.STUDENT] }, env.JWT_SECRET, { expiresIn: '1h' });
      const req = { headers: { authorization: `Bearer ${validToken}` } } as any;
      const res = mockResponse();
      let nextCalled = false;
      await authenticate(req, res as any, (() => { nextCalled = true; }) as any);
      assert.strictEqual(res.getStatus(), 403);
      assert.strictEqual(res.getBody().error.code, 'ACCOUNT_INACTIVE');
      assert.strictEqual(nextCalled, false);
      console.log('TEST: Inactive User Access Denied (403 ACCOUNT_INACTIVE) ... ✅ PASSED');
    } finally {
      (User as any).findById = originalFindById;
    }
  }

  // 6. Active Authenticated User Populates req.user
  {
    const originalFindById = (User as any).findById;
    try {
      (User as any).findById = () => ({
        select: async () => ({
          _id: 'user-active-id',
          email: 'active@azaam.org',
          roles: [UserRole.STUDENT],
          status: 'ACTIVE',
          universityId: 'uni-1',
          studentId: 'student-1',
        }),
      });

      const validToken = jwt.sign({ sub: 'user-active-id', email: 'active@azaam.org', roles: [UserRole.STUDENT] }, env.JWT_SECRET, { expiresIn: '1h' });
      const req = { headers: { authorization: `Bearer ${validToken}` } } as any;
      const res = mockResponse();
      let nextCalled = false;
      await authenticate(req, res as any, (() => { nextCalled = true; }) as any);
      assert.strictEqual(nextCalled, true);
      assert.strictEqual(req.user.userId, 'user-active-id');
      assert.strictEqual(req.user.email, 'active@azaam.org');
      assert.deepStrictEqual(req.user.roles, [UserRole.STUDENT]);
      assert.strictEqual(req.user.universityId, 'uni-1');
      console.log('TEST: Active User Passes Authentication & Context Populated ... ✅ PASSED');
    } finally {
      (User as any).findById = originalFindById;
    }
  }

  // 7. Seed Admin Login Verification
  {
    const loginResult = await AuthService.loginUser('admin@azaammedics.org', 'Password123!');
    assert.ok(loginResult.token, 'Must return JWT token');
    assert.strictEqual(loginResult.user.email, 'admin@azaammedics.org');
    assert.ok(loginResult.user.roles.includes(UserRole.SUPER_ADMIN));
    console.log('TEST: Super Admin Authentication & Seed Fallback ... ✅ PASSED');
  }

  // 8. Inactive Account Rejected at Login
  {
    const originalFindOne = (User as any).findOne;
    try {
      (User as any).findOne = async () => ({
        email: 'blocked@azaam.org',
        comparePassword: async () => true,
        status: 'INACTIVE',
      });
      let threw = false;
      try {
        await AuthService.loginUser('blocked@azaam.org', 'AnyPassword123!');
      } catch (err: any) {
        threw = true;
        assert.strictEqual(err.code, 'ACCOUNT_INACTIVE');
        assert.strictEqual(err.statusCode, 403);
      }
      assert.strictEqual(threw, true, 'Inactive account must be rejected during login');
      console.log('TEST: Inactive Account Login Prevention ... ✅ PASSED');
    } finally {
      (User as any).findOne = originalFindOne;
    }
  }

  console.log('\n--------------------------------------------------');
  console.log('PHASE A VERIFICATION SUITE: ALL 8 TESTS PASSED');
  console.log('--------------------------------------------------\n');
}

runAuthFlowVerification().catch((err) => {
  console.error('Phase A Verification FAILED:', err);
  process.exit(1);
});
