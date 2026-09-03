/**
 * AZAAM Prompt 1 - Navigation Verification Tests
 * Verifies that all 8 roles have correct sidebar navigation
 * and that university/hospital separation is enforced
 */

import { PORTAL_CONFIGS, getNavItemsForRole, getPortalRoot } from '../config/navigation';
import { UserRole } from '../types/frontend';

/**
 * Verification Test Results
 */
interface VerificationResult {
  role: UserRole;
  passed: boolean;
  tests: {
    name: string;
    passed: boolean;
    details: string;
  }[];
}

/**
 * Expected navigation requirements per role
 */
const ROLE_REQUIREMENTS: Record<UserRole, {
  portalTitle: string;
  portalRoot: string;
  mustHaveItems: string[];
  mustNotHaveItems: string[];
  sectionCount: number;
}> = {
  [UserRole.SUPER_ADMIN]: {
    portalTitle: 'AZAAM ADMIN',
    portalRoot: '/admin',
    mustHaveItems: [
      'Dashboard',
      'Users',
      'Universities',
      'Hospitals & Organizations',
      'Clinical Supervisors',
      'Applications',
      'Placements',
      'Audit Logs',
      'Settings',
    ],
    mustNotHaveItems: ['University Profile', 'Organization Profile', 'Assigned Trainees'],
    sectionCount: 9,
  },
  [UserRole.AZAAM_STAFF]: {
    portalTitle: 'AZAAM OPERATIONS',
    portalRoot: '/admin',
    mustHaveItems: [
      'Dashboard',
      'Universities',
      'Hospitals & Organizations',
      'Students',
      'Clinical Supervisors',
      'Applications',
      'Placements',
      'Audit Logs',
    ],
    mustNotHaveItems: ['Settings', 'Users', 'University Profile', 'Organization Profile'],
    sectionCount: 9,
  },
  [UserRole.UNIVERSITY_ADMIN]: {
    portalTitle: 'UNIVERSITY PORTAL',
    portalRoot: '/university',
    mustHaveItems: [
      'Dashboard',
      'Nominate Student',
      'Students',
      'Student Status',
      'Clinical Attachments',
      'Attendance',
      'Logsheet / Logbook',
      'Evaluation & Grade',
      'Fees & Invoices',
      'Payments',
      'Payment History',
      'Student Documents',
      'Certificates',
      'University Profile',
      'University Staff',
      'Student Report',
      'Training Report',
      'Financial Report',
      'Notifications',
    ],
    mustNotHaveItems: [
      'Hospital Management',
      'Hospital Departments',
      'Hospital Capacity',
      'Clinical Supervisor Management',
      'Visa Management',
      'Accommodation Management',
      'Placement Administration',
      'Hospital Financial Settlement',
      'Users',
      'Audit Logs',
    ],
    sectionCount: 9,
  },
  [UserRole.UNIVERSITY_STAFF]: {
    portalTitle: 'UNIVERSITY PORTAL',
    portalRoot: '/university',
    mustHaveItems: [
      'Dashboard',
      'Nominate Student',
      'Students',
      'Student Status',
      'Clinical Attachments',
      'Attendance',
      'Logsheet / Logbook',
      'Evaluation & Grade',
      'Fees & Invoices',
      'Payments',
      'Student Documents',
      'Certificates',
      'Notifications',
    ],
    mustNotHaveItems: [
      'Hospital Management',
      'Hospital Departments',
      'Hospital Capacity',
      'Clinical Supervisor Management',
      'Visa Management',
      'Accommodation Management',
      'Placement Administration',
      'Hospital Financial Settlement',
      'Users',
      'Audit Logs',
      'University Staff',
    ],
    sectionCount: 9,
  },
  [UserRole.ORGANIZATION_ADMIN]: {
    portalTitle: 'HEALTHCARE ORGANIZATION',
    portalRoot: '/organization',
    mustHaveItems: [
      'Dashboard',
      'Placements',
      'Clinical Attachments',
      'Departments',
      'Capacity',
      'Assigned Trainees',
      'Clinical Supervisors',
      'Organization Staff',
      'Organization Profile',
    ],
    mustNotHaveItems: [
      'Universities',
      'Students',
      'University',
      'University Profile',
      'University Staff',
      'Audit Logs',
      'Users',
      'Settings',
    ],
    sectionCount: 9,
  },
  [UserRole.ORGANIZATION_STAFF]: {
    portalTitle: 'HEALTHCARE ORGANIZATION',
    portalRoot: '/organization',
    mustHaveItems: [
      'Dashboard',
      'Placements',
      'Clinical Attachments',
      'Departments',
      'Assigned Trainees',
      'Clinical Supervisors',
    ],
    mustNotHaveItems: [
      'Universities',
      'Students',
      'University',
      'Organization Profile',
      'Organization Staff',
      'Audit Logs',
      'Users',
      'Settings',
    ],
    sectionCount: 8,
  },
  [UserRole.CLINICAL_SUPERVISOR]: {
    portalTitle: 'CLINICAL SUPERVISOR',
    portalRoot: '/supervisor',
    mustHaveItems: [
      'Dashboard',
      'Assigned Trainees',
      'Clinical Attachments',
      'Attendance',
      'Logbook Review',
      'Evaluations',
    ],
    mustNotHaveItems: [
      'Universities',
      'Users',
      'Audit Logs',
      'Settings',
      'Hospital',
      'Organization',
      'University',
      'Students',
      'Applications',
    ],
    sectionCount: 6,
  },
  [UserRole.STUDENT]: {
    portalTitle: 'STUDENT PORTAL',
    portalRoot: '/student',
    mustHaveItems: [
      'Dashboard',
      'Applications',
      'Application Status',
      'Clinical Attachment',
      'Attendance',
      'Logbook',
      'Evaluations',
    ],
    mustNotHaveItems: [
      'Universities',
      'Users',
      'Audit Logs',
      'Settings',
      'Hospital',
      'Organization',
      'Supervisors',
      'Departments',
      'Capacity',
    ],
    sectionCount: 7,
  },
  [UserRole.INDEPENDENT_APPLICANT]: {
    portalTitle: 'STUDENT PORTAL',
    portalRoot: '/student',
    mustHaveItems: [
      'Dashboard',
      'Applications',
      'Application Status',
      'Clinical Attachment',
      'Attendance',
      'Logbook',
      'Evaluations',
    ],
    mustNotHaveItems: [
      'Universities',
      'Users',
      'Audit Logs',
      'Settings',
      'Hospital',
      'Organization',
      'Supervisors',
      'Departments',
      'Capacity',
    ],
    sectionCount: 7,
  },
};

/**
 * Run verification tests for a role
 */
function verifyRole(role: UserRole): VerificationResult {
  const config = PORTAL_CONFIGS[role];
  const items = getNavItemsForRole(role);
  const portalRoot = getPortalRoot(role);
  const requirements = ROLE_REQUIREMENTS[role];

  const tests = [];

  // Test 1: Portal title
  tests.push({
    name: 'Portal Title Correct',
    passed: config.portalTitle === requirements.portalTitle,
    details: `Expected: "${requirements.portalTitle}", Got: "${config.portalTitle}"`,
  });

  // Test 2: Portal root path
  tests.push({
    name: 'Portal Root Path Correct',
    passed: portalRoot === requirements.portalRoot,
    details: `Expected: "${requirements.portalRoot}", Got: "${portalRoot}"`,
  });

  // Test 3: Section count
  tests.push({
    name: 'Section Count Correct',
    passed: config.sections.length === requirements.sectionCount,
    details: `Expected: ${requirements.sectionCount} sections, Got: ${config.sections.length}`,
  });

  // Test 4: Must-have items
  const itemLabels = items.map(i => i.label);
  const missingItems = requirements.mustHaveItems.filter(
    item => !itemLabels.includes(item)
  );
  tests.push({
    name: 'Must-Have Navigation Items Present',
    passed: missingItems.length === 0,
    details: missingItems.length === 0 
      ? 'All required items present'
      : `Missing items: ${missingItems.join(', ')}`,
  });

  // Test 5: Must-not-have items
  const forbiddenItems = requirements.mustNotHaveItems.filter(
    item => itemLabels.includes(item)
  );
  tests.push({
    name: 'Forbidden Navigation Items Absent',
    passed: forbiddenItems.length === 0,
    details: forbiddenItems.length === 0
      ? 'No forbidden items found'
      : `Found forbidden items: ${forbiddenItems.join(', ')}`,
  });

  // Test 6: All items have valid paths
  const invalidPaths = items.filter(i => !i.path || !i.path.startsWith('/'));
  tests.push({
    name: 'All Navigation Items Have Valid Paths',
    passed: invalidPaths.length === 0,
    details: invalidPaths.length === 0
      ? 'All paths valid'
      : `Invalid paths: ${invalidPaths.map(i => i.label).join(', ')}`,
  });

  // Test 7: Routes match portal root
  const routesMatchRoot = items.every(i => i.path.startsWith(requirements.portalRoot));
  tests.push({
    name: 'All Routes Start With Portal Root',
    passed: routesMatchRoot,
    details: routesMatchRoot
      ? `All routes start with ${requirements.portalRoot}`
      : 'Some routes do not match portal root',
  });

  // Test 8: University/Hospital Separation (if applicable)
  if (role === UserRole.UNIVERSITY_ADMIN || role === UserRole.UNIVERSITY_STAFF) {
    const hasUniversityItems = itemLabels.some(l => 
      l.includes('University') || l.includes('Students') || l.includes('Applications')
    );
    const hasOrgItems = itemLabels.some(l =>
      l.includes('Organization') || l.includes('Hospitals') || l.includes('Hospital')
    );
    tests.push({
      name: 'University Separation: No Hospital/Org Access',
      passed: hasUniversityItems && !hasOrgItems,
      details: `Has University items: ${hasUniversityItems}, Has Org items: ${hasOrgItems}`,
    });
  }

  if (role === UserRole.ORGANIZATION_ADMIN || role === UserRole.ORGANIZATION_STAFF) {
    const hasOrgItems = itemLabels.some(l =>
      l.includes('Organization') || l.includes('Placement') || l.includes('Departments')
    );
    const hasUniversityItems = itemLabels.some(l =>
      l.includes('Students') && !l.includes('Trainees') || l.includes('University') || l.includes('Applications')
    );
    tests.push({
      name: 'Organization Separation: No University Access',
      passed: hasOrgItems && !hasUniversityItems,
      details: `Has Org items: ${hasOrgItems}, Has University items: ${hasUniversityItems}`,
    });
  }

  const allPassed = tests.every(t => t.passed);

  return {
    role,
    passed: allPassed,
    tests,
  };
}

/**
 * Run all verification tests
 */
export function runAllVerifications(): VerificationResult[] {
  const roles = Object.values(UserRole);
  return roles.map(role => verifyRole(role as UserRole));
}

/**
 * Print verification results
 */
export function printVerificationResults(results: VerificationResult[]): void {
  console.log('\n═════════════════════════════════════════════════════════════');
  console.log('AZAAM PROMPT 1 - NAVIGATION VERIFICATION RESULTS');
  console.log('═════════════════════════════════════════════════════════════\n');

  let totalPassed = 0;
  let totalRoles = results.length;

  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${result.role}`);
    
    result.tests.forEach(test => {
      const testStatus = test.passed ? '  ✓' : '  ✗';
      console.log(`${testStatus} ${test.name}`);
      console.log(`     ${test.details}`);
    });

    if (result.passed) totalPassed++;
    console.log();
  });

  console.log('═════════════════════════════════════════════════════════════');
  console.log(`SUMMARY: ${totalPassed}/${totalRoles} roles verified successfully`);
  console.log('═════════════════════════════════════════════════════════════\n');

  if (totalPassed === totalRoles) {
    console.log('✅ ALL VERIFICATION TESTS PASSED');
    console.log('\nNavigation Architecture:\n');
    console.log('  • Centralized navigation configuration: VERIFIED');
    console.log('  • Role-based portal access: VERIFIED');
    console.log('  • University/Hospital separation: VERIFIED');
    console.log('  • Route structure standardization: VERIFIED');
    console.log('  • Portal identity branding: VERIFIED');
  } else {
    console.log('⚠️  SOME TESTS FAILED - REVIEW ABOVE FOR DETAILS');
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const results = runAllVerifications();
  printVerificationResults(results);
}
