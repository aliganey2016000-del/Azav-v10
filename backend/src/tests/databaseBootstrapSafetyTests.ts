import assert from 'assert';
import { assertSeedIsSafe } from '../seed.js';

function withEnv(values: Record<string, string | undefined>, fn: () => void) {
  const previous: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(values)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    fn();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function expectThrow(name: string, values: Record<string, string | undefined>, messagePart: string) {
  process.stdout.write(`DATABASE BOOTSTRAP TEST: ${name} ... `);
  withEnv(values, () => {
    let caught: any;
    try {
      assertSeedIsSafe();
    } catch (error) {
      caught = error;
    }
    assert.ok(caught, 'Expected seed guard to throw');
    assert.ok(String(caught.message).includes(messagePart), `Expected error to mention ${messagePart}`);
  });
  console.log('PASSED');
}

expectThrow(
  'Production seeding is always blocked',
  { NODE_ENV: 'production', ALLOW_DATABASE_SEED: 'true', SEED_PASSWORD: 'LongEnoughSeedPassword123!' },
  'NODE_ENV=production',
);

expectThrow(
  'Explicit seed opt-in is required',
  { NODE_ENV: 'test', ALLOW_DATABASE_SEED: undefined, SEED_PASSWORD: 'LongEnoughSeedPassword123!' },
  'ALLOW_DATABASE_SEED=true',
);

expectThrow(
  'Strong seed password is required',
  { NODE_ENV: 'test', ALLOW_DATABASE_SEED: 'true', SEED_PASSWORD: 'short' },
  'at least 12 characters',
);

process.stdout.write('DATABASE BOOTSTRAP TEST: Explicit non-production seed config is accepted ... ');
withEnv(
  { NODE_ENV: 'test', ALLOW_DATABASE_SEED: 'true', SEED_PASSWORD: 'LongEnoughSeedPassword123!' },
  () => {
    assert.strictEqual(assertSeedIsSafe(), 'LongEnoughSeedPassword123!');
  },
);
console.log('PASSED');

console.log('DATABASE BOOTSTRAP SAFETY TESTS: 4 PASSED, 0 FAILED.');
