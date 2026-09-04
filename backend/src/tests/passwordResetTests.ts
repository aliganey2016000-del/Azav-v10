import assert from 'assert';
import { AuthService } from '../services/auth.service.js';
import { User } from '../models/User.js';

type TestUser = {
  status: string;
  passwordHash: string;
  passwordResetTokenHash: string | null;
  passwordResetExpiresAt: Date | null;
  save: () => Promise<void>;
};

async function run() {
  const originalFindOne = (User as any).findOne;
  const saved: TestUser = {
    status: 'ACTIVE',
    passwordHash: 'old-hash',
    passwordResetTokenHash: null,
    passwordResetExpiresAt: null,
    save: async () => undefined,
  };

  try {
    (User as any).findOne = () => ({ select: async () => saved });
    const requested = await AuthService.requestPasswordReset('TEST@EXAMPLE.ORG');
    assert.ok(requested.resetToken, 'Development reset flow must expose a local test token');
    assert.strictEqual(requested.resetToken.length, 64, 'Reset token must be 32 random bytes encoded as hex');
    assert.ok(saved.passwordResetTokenHash, 'Only a hash of the reset token must be stored');
    assert.notStrictEqual(saved.passwordResetTokenHash, requested.resetToken, 'Stored reset value must not equal raw token');
    assert.ok(saved.passwordResetExpiresAt && saved.passwordResetExpiresAt.getTime() > Date.now(), 'Reset token must expire in the future');

    const result = await AuthService.resetPassword(requested.resetToken, 'NewSecurePassword123!');
    assert.strictEqual(result.message.includes('reset successfully'), true);
    assert.strictEqual(saved.passwordResetTokenHash, null, 'Reset token must be single-use');
    assert.strictEqual(saved.passwordResetExpiresAt, null, 'Reset expiry must be cleared after use');
    assert.notStrictEqual(saved.passwordHash, 'old-hash', 'Password hash must change after reset');

    (User as any).findOne = () => ({ select: async () => null });
    const generic = await AuthService.requestPasswordReset('missing@example.org');
    assert.strictEqual(generic.resetToken, undefined, 'Unknown accounts must not disclose reset tokens');

    console.log('Password reset lifecycle tests: PASS');
  } finally {
    (User as any).findOne = originalFindOne;
  }
}

run().catch((error) => {
  console.error('Password reset lifecycle tests: FAIL');
  console.error(error);
  process.exitCode = 1;
});
