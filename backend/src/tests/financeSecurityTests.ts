import assert from 'assert';
import { buildFinanceQuery } from '../controllers/finance.controller.js';
import { UserRole } from '../types/index.js';

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`TEST: ${name} ... ✅ PASSED`);
  } catch (err: any) {
    console.error(`TEST: ${name} ... ❌ FAILED`);
    throw err;
  }
}

function user(overrides: Partial<Parameters<typeof buildFinanceQuery>[0]> = {}) {
  return {
    userId: 'user-1',
    roles: [UserRole.STUDENT],
    ...overrides,
  };
}

test('Finance - student scope is limited to own inbound records', () => {
  const { query } = buildFinanceQuery(user());
  assert.deepStrictEqual(query, {
    userId: 'user-1',
    direction: 'INBOUND',
  });
});

test('Finance - university scope is tenant-bound and inbound-only', () => {
  const { query } = buildFinanceQuery(user({
    roles: [UserRole.UNIVERSITY_ADMIN],
    universityId: 'university-1',
  }), { direction: 'OUTBOUND' });

  assert.strictEqual(query.universityId, 'university-1');
  assert.strictEqual(query.direction, 'INBOUND');
  assert.deepStrictEqual(query.counterpartyType, { $in: ['UNIVERSITY', 'STUDENT'] });
});

test('Finance - organization scope is tenant-bound and outbound-only', () => {
  const { query } = buildFinanceQuery(user({
    roles: [UserRole.ORGANIZATION_STAFF],
    organizationId: 'organization-1',
  }), { direction: 'INBOUND' });

  assert.strictEqual(query.organizationId, 'organization-1');
  assert.strictEqual(query.direction, 'OUTBOUND');
  assert.strictEqual(query.counterpartyType, 'ORGANIZATION');
});

test('Finance - system finance roles can select inbound or outbound', () => {
  const inbound = buildFinanceQuery(user({ roles: [UserRole.AZAAM_STAFF] }), { direction: 'INBOUND' });
  const outbound = buildFinanceQuery(user({ roles: [UserRole.SUPER_ADMIN] }), { direction: 'OUTBOUND' });

  assert.strictEqual(inbound.query.direction, 'INBOUND');
  assert.strictEqual(outbound.query.direction, 'OUTBOUND');
});

test('Finance - missing university context is forbidden', () => {
  const result = buildFinanceQuery(user({ roles: [UserRole.UNIVERSITY_STAFF] }));
  assert.deepStrictEqual(result.forbidden, {
    code: 'TENANT_CONTEXT_REQUIRED',
    message: 'University context is required.',
  });
});

test('Finance - missing organization context is forbidden', () => {
  const result = buildFinanceQuery(user({ roles: [UserRole.ORGANIZATION_ADMIN] }));
  assert.deepStrictEqual(result.forbidden, {
    code: 'TENANT_CONTEXT_REQUIRED',
    message: 'Organization context is required.',
  });
});

test('Finance - pagination is bounded', () => {
  const { pageNumber, pageSize } = buildFinanceQuery(user(), { page: '-4', limit: '5000' });
  assert.strictEqual(pageNumber, 1);
  assert.strictEqual(pageSize, 100);
});
