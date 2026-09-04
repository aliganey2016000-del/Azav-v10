import assert from 'assert';
import { buildApplicationListQuery } from '../controllers/application.controller.js';
import { isApplicationStatusTransitionAllowed } from '../services/application.service.js';
import { ApplicationStatus, UserRole } from '../types/index.js';

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`TEST: ${name} ... ✅ PASSED`);
  } catch (err) {
    console.error(`TEST: ${name} ... ❌ FAILED`);
    throw err;
  }
}

const baseUser = {
  userId: 'user-1',
  roles: [UserRole.STUDENT],
  studentId: 'student-1',
};

test('Application - student list is restricted to own student record', () => {
  const { query } = buildApplicationListQuery(baseUser);
  assert.deepStrictEqual(query, { studentId: 'student-1' });
});

test('Application - university list is restricted to its tenant', () => {
  const { query } = buildApplicationListQuery({
    userId: 'uni-1',
    roles: [UserRole.UNIVERSITY_ADMIN],
    universityId: 'university-1',
  });
  assert.deepStrictEqual(query, { universityId: 'university-1' });
});

test('Application - missing university context is denied', () => {
  const result = buildApplicationListQuery({ userId: 'uni-1', roles: [UserRole.UNIVERSITY_STAFF] });
  assert.deepStrictEqual(result.forbidden, {
    code: 'TENANT_CONTEXT_REQUIRED',
    message: 'University context is required.',
  });
});

test('Application - organization roles cannot list applications', () => {
  const result = buildApplicationListQuery({ userId: 'org-1', roles: [UserRole.ORGANIZATION_ADMIN] });
  assert.deepStrictEqual(result.forbidden, {
    code: 'FORBIDDEN_SCOPE',
    message: 'Your role does not have access to application records.',
  });
});

test('Application - valid lifecycle transition is allowed', () => {
  assert.strictEqual(
    isApplicationStatusTransitionAllowed(ApplicationStatus.UNDER_REVIEW, ApplicationStatus.APPROVED),
    true,
  );
});

test('Application - invalid lifecycle transition is blocked', () => {
  assert.strictEqual(
    isApplicationStatusTransitionAllowed(ApplicationStatus.REJECTED, ApplicationStatus.APPROVED),
    false,
  );
});

test('Application - certificate-issued status is terminal', () => {
  assert.strictEqual(
    isApplicationStatusTransitionAllowed(ApplicationStatus.CERTIFICATE_ISSUED, ApplicationStatus.ACTIVE),
    false,
  );
});
