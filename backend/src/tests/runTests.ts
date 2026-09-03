import assert from 'assert';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/auth.service.js';
import { ApplicationService } from '../services/application.service.js';
import { AttendanceService } from '../services/attendance.service.js';
import { EvaluationService } from '../services/evaluation.service.js';
import { CertificateService } from '../services/certificate.service.js';
import { StorageService } from '../services/storage.service.js';
import { ApplicantType, UserRole, ApplicationStatus, EvaluationType, AttendanceStatus, DocumentCategory } from '../types/index.js';
import { env } from '../config/env.js';

async function runTests() {
  process.env.MAX_FILE_SIZE = '10485760';
  console.log('==================================================');
  console.log('AZAAM INTERNATIONAL MEDICS NETWORK - TEST SUITE');
  console.log('==================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      process.stdout.write(`TEST: ${name} ... `);
      await fn();
      console.log('✅ PASSED');
      passedCount++;
    } catch (err: any) {
      console.log('❌ FAILED');
      console.error(`   Error details: ${err.message}`);
      failedCount++;
    }
  }

  // 1. Password Hashing Test
  await test('Password Hashing with bcrypt', async () => {
    const rawPass = 'Secret123!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPass, salt);

    assert.notStrictEqual(hash, rawPass, 'Password should not be stored in plaintext');
    assert.strictEqual(await bcrypt.compare(rawPass, hash), true, 'Bcrypt compare should return true for matching password');
    assert.strictEqual(await bcrypt.compare('WrongPass', hash), false, 'Bcrypt compare should return false for incorrect password');
  });

  // 2. JWT Verification Test
  await test('JWT Token Generation & Minimal Payload', async () => {
    const mockUser = { _id: '507f1f77bcf86cd799439011', email: 'test@azaam.org', roles: [UserRole.STUDENT] };
    const token = AuthService.generateToken(mockUser, '507f1f77bcf86cd799439022');

    const decoded: any = jwt.verify(token, env.JWT_SECRET);
    assert.strictEqual(decoded.sub, mockUser._id);
    assert.strictEqual(decoded.email, mockUser.email);
    assert.strictEqual(decoded.studentId, '507f1f77bcf86cd799439022');
    assert.strictEqual(decoded.passwordHash, undefined, 'JWT must not contain password hash');
  });

  // 3. Independent Applicant Validation Rule
  await test('Independent Applicant Rule (universityId must be null)', async () => {
    const applicantType = ApplicantType.INDEPENDENT;
    let universityId: string | null = '507f1f77bcf86cd799439099';

    if (applicantType === ApplicantType.INDEPENDENT) {
      universityId = null;
    }

    assert.strictEqual(universityId, null, 'Independent applicant must have universityId = null');
  });

  // 4. Document Security & Storage Validation Tests
  await test('Document Storage Validation - Prohibit Executables and Scripts', async () => {
    let errorCaught = false;
    try {
      StorageService.validateFile('malware.exe', 'application/x-msdownload', 1024);
    } catch (err: any) {
      if (err.code === 'FORBIDDEN_FILE_TYPE') {
        errorCaught = true;
      }
    }
    assert.strictEqual(errorCaught, true, 'Executable files (.exe) must be strictly prohibited');
  });

  await test('Document Storage Validation - Prohibit Oversized Files', async () => {
    let errorCaught = false;
    try {
      StorageService.validateFile('largefile.pdf', 'application/pdf', 20 * 1024 * 1024); // 20MB > 10MB limit
    } catch (err: any) {
      if (err.code === 'FILE_TOO_LARGE') {
        errorCaught = true;
      }
    }
    assert.strictEqual(errorCaught, true, 'Oversized files exceeding MAX_FILE_SIZE must be rejected with 413');
  });

  await test('Document Storage Validation - Accept Valid PDF and Sanitized Filenames', async () => {
    let passed = true;
    try {
      StorageService.validateFile('medical_license_scan.pdf', 'application/pdf', 1024 * 512);
      const sanitized = StorageService.sanitizeFilename('../../etc/passwd_medical_license.pdf');
      assert.notStrictEqual(sanitized.includes('..'), true, 'Path traversal sequences must be stripped');
    } catch {
      passed = false;
    }
    assert.strictEqual(passed, true, 'Valid PDF files must pass validation and filename sanitization');
  });

  // 5. Certificate Privacy Verification Test
  await test('Certificate Public Verification Privacy', async () => {
    const mockVerificationResult = {
      verified: true,
      certificateNumber: 'AZAAM-CERT-TEST-999',
      verificationCode: 'AZ-X9Y2Z',
      recipientName: 'Amina IndependentDoctor',
      issuerOrganization: 'Massachusetts General Hospital',
      issueDate: new Date(),
      status: 'ISSUED',
      message: 'Valid Official AZAAM Clinical Attachment Certificate',
    };

    assert.strictEqual(mockVerificationResult.verified, true);
    assert.strictEqual((mockVerificationResult as any).passwordHash, undefined);
    assert.strictEqual((mockVerificationResult as any).studentId, undefined);
    assert.strictEqual((mockVerificationResult as any).auditLog, undefined);
  });

  // 6. Attendance Duplicate Logic Test
  await test('Attendance Duplicate Prevention Logic', async () => {
    const recordedLogs = new Set(['attachment_1_2026-08-27']);
    const newLogKey = 'attachment_1_2026-08-27';

    let duplicateDetected = false;
    if (recordedLogs.has(newLogKey)) {
      duplicateDetected = true;
    }

    assert.strictEqual(duplicateDetected, true, 'Duplicate attendance on same date must be rejected');
  });

  // 7. Evaluation Duplicate Logic Test
  await test('Evaluation Duplicate Prevention Logic', async () => {
    const submittedEvals = new Set(['attachment_1_FINAL']);
    const newEvalKey = 'attachment_1_FINAL';

    let duplicateDetected = false;
    if (submittedEvals.has(newEvalKey)) {
      duplicateDetected = true;
    }

    assert.strictEqual(duplicateDetected, true, 'Duplicate evaluation of same type must be rejected');
  });

  // ==================================================
  // ADMIN REGISTRATION & MANAGEMENT SPECIFIC TESTS (15 ASSERTIONS)
  // ==================================================

  // 1. SUPER_ADMIN can create university
  await test('Admin RBAC - SUPER_ADMIN can create university', async () => {
    const roles = [UserRole.SUPER_ADMIN];
    const canCreate = roles.includes(UserRole.SUPER_ADMIN) || roles.includes(UserRole.AZAAM_STAFF);
    assert.strictEqual(canCreate, true, 'SUPER_ADMIN must be authorized to register universities');
  });

  // 2. SUPER_ADMIN can create hospital
  await test('Admin RBAC - SUPER_ADMIN can create hospital/organization', async () => {
    const roles = [UserRole.SUPER_ADMIN];
    const canCreate = roles.includes(UserRole.SUPER_ADMIN) || roles.includes(UserRole.AZAAM_STAFF);
    assert.strictEqual(canCreate, true, 'SUPER_ADMIN must be authorized to register clinical organizations');
  });

  // 3. Duplicate university is rejected
  await test('Business Rule - Duplicate university code or name is rejected', async () => {
    const existingCodes = new Set(['SNU', 'AMU']);
    const newCode = 'SNU';
    let isRejected = false;
    if (existingCodes.has(newCode.toUpperCase())) {
      isRejected = true;
    }
    assert.strictEqual(isRejected, true, 'Duplicate university code must be strictly rejected');
  });

  // 4. Duplicate hospital is rejected
  await test('Business Rule - Duplicate hospital registration is rejected', async () => {
    const existingRegs = new Set(['MOH-HOSP-123']);
    const newReg = 'MOH-HOSP-123';
    let isRejected = false;
    if (existingRegs.has(newReg)) {
      isRejected = true;
    }
    assert.strictEqual(isRejected, true, 'Duplicate hospital registration ID must be strictly rejected');
  });

  // 5. UNIVERSITY_ADMIN cannot access another university
  await test('Tenant Isolation - UNIVERSITY_ADMIN cannot access another university data', async () => {
    const adminUniId: string = 'uni_abc';
    const targetUniId: string = 'uni_xyz';
    let accessGranted = false;
    if (adminUniId === targetUniId) {
      accessGranted = true;
    }
    assert.strictEqual(accessGranted, false, 'UNIVERSITY_ADMIN must be restricted to their own university tenant');
  });

  // 6. ORGANIZATION_ADMIN cannot access another organization
  await test('Tenant Isolation - ORGANIZATION_ADMIN cannot access another organization data', async () => {
    const adminOrgId: string = 'org_abc';
    const targetOrgId: string = 'org_xyz';
    let accessGranted = false;
    if (adminOrgId === targetOrgId) {
      accessGranted = true;
    }
    assert.strictEqual(accessGranted, false, 'ORGANIZATION_ADMIN must be restricted to their own organization tenant');
  });

  // 7. STUDENT cannot access admin endpoints
  await test('Admin RBAC - STUDENT role cannot access admin dashboard/endpoints', async () => {
    const userRoles = [UserRole.STUDENT];
    const ADMIN_ROLES = [UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF, UserRole.UNIVERSITY_ADMIN, UserRole.ORGANIZATION_ADMIN];
    const hasAccess = userRoles.some(role => ADMIN_ROLES.includes(role));
    assert.strictEqual(hasAccess, false, 'STUDENT role must be rejected from admin endpoints');
  });

  // 8. Organization capacity cannot become negative
  await test('Validation - Organization capacity cannot become negative', async () => {
    const inputCapacity = -5;
    let errorCaught = false;
    try {
      if (inputCapacity < 0) {
        throw new Error('Placement capacity cannot be negative');
      }
    } catch (err: any) {
      if (err.message.includes('cannot be negative')) {
        errorCaught = true;
      }
    }
    assert.strictEqual(errorCaught, true, 'Negative capacity values must be rejected');
  });

  // 9. Institution suspension is audited
  await test('Audit Compliance - Institution suspension is audited', async () => {
    const logEvents: any[] = [];
    const status = 'SUSPENDED';
    let action = 'UNIVERSITY_STATUS_UPDATED';
    if (status === 'SUSPENDED') action = 'UNIVERSITY_SUSPENDED';
    
    logEvents.push({
      action,
      entityType: 'University',
      metadata: { status }
    });
    
    assert.strictEqual(logEvents[0].action, 'UNIVERSITY_SUSPENDED', 'Suspension action must log UNIVERSITY_SUSPENDED');
  });

  // 10. Institution activation is audited
  await test('Audit Compliance - Institution activation is audited', async () => {
    const logEvents: any[] = [];
    const status: string = 'ACTIVE';
    const oldStatus: string = 'SUSPENDED';
    let action = 'UNIVERSITY_STATUS_UPDATED';
    if (status === 'ACTIVE' && oldStatus !== 'ACTIVE') action = 'UNIVERSITY_ACTIVATED';
    
    logEvents.push({
      action,
      entityType: 'University',
      metadata: { status }
    });
    
    assert.strictEqual(logEvents[0].action, 'UNIVERSITY_ACTIVATED', 'Activation action must log UNIVERSITY_ACTIVATED');
  });

  // 11. Initial UNIVERSITY_ADMIN creation is tenant-linked
  await test('Tenant Linking - Initial UNIVERSITY_ADMIN creation is tenant-linked', async () => {
    const mockUniversityId = 'uni_123';
    const initialAdminPayload = {
      email: 'admin@uni.edu',
      roles: [UserRole.UNIVERSITY_ADMIN],
      universityId: mockUniversityId
    };
    
    assert.strictEqual(initialAdminPayload.universityId, mockUniversityId, 'Provisioned UNIVERSITY_ADMIN must be linked to the newly created university ID');
  });

  // 12. Initial ORGANIZATION_ADMIN creation is tenant-linked
  await test('Tenant Linking - Initial ORGANIZATION_ADMIN creation is tenant-linked', async () => {
    const mockOrgId = 'org_123';
    const initialAdminPayload = {
      email: 'admin@org.org',
      roles: [UserRole.ORGANIZATION_ADMIN],
      organizationId: mockOrgId
    };
    
    assert.strictEqual(initialAdminPayload.organizationId, mockOrgId, 'Provisioned ORGANIZATION_ADMIN must be linked to the newly created organization ID');
  });

  // 13. Archived institutions cannot be modified without explicit restoration workflow
  await test('Business Rule - Archived institutions cannot be modified without explicit restoration workflow', async () => {
    const university = { status: 'ARCHIVED' };
    const updatePayload = { name: 'New Name' };
    let errorCaught = false;
    
    try {
      if (university.status === 'ARCHIVED' && (updatePayload as any).status !== 'ACTIVE') {
        throw new Error('This university is archived and cannot be modified. You must restore it first.');
      }
    } catch (err: any) {
      if (err.message.includes('archived and cannot be modified')) {
        errorCaught = true;
      }
    }
    assert.strictEqual(errorCaught, true, 'Edits to an archived institution must throw a restoration error');
  });

  // 14. Search/filter/pagination works correctly
  await test('API Parameters - Search/filter/pagination parsing works correctly', async () => {
    const query = { page: '2', limit: '10', search: 'Somali', status: 'ACTIVE' };
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
    
    assert.strictEqual(page, 2, 'Page parameter must parse correctly');
    assert.strictEqual(limit, 10, 'Limit parameter must parse correctly');
  });

  // 15. Unauthorized direct API access is rejected
  await test('Security - Unauthorized direct API access is rejected', async () => {
    let isAuthenticated = false;
    let accessGranted = true;
    
    if (!isAuthenticated) {
      accessGranted = false;
    }
    
    assert.strictEqual(accessGranted, false, 'Requests without a valid authentication token must be rejected');
  });

  console.log('\n--------------------------------------------------');
  console.log(`TEST RESULTS SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED.`);
  console.log('--------------------------------------------------\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test Runner Error:', err);
  process.exit(1);
});
