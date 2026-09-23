import { expect, Page, test } from '@playwright/test';

const password = process.env.E2E_PASSWORD;
if (!password) {
  throw new Error('E2E_PASSWORD must be provided to run role portal tests.');
}

const roleCases = [
  { name: 'Super Admin', email: 'admin@azaammedics.org', expectedPath: '/admin/dashboard' },
  { name: 'AZAAM Staff', email: 'staff@azaammedics.org', expectedPath: '/admin/dashboard' },
  { name: 'University Admin', email: 'admin@hms.harvard.edu', expectedPath: '/university/dashboard' },
  { name: 'Organization Admin', email: 'admin@massgeneral.org', expectedPath: '/organization/dashboard' },
  { name: 'Clinical Supervisor', email: 'sjenkins@massgeneral.org', expectedPath: '/supervisor/dashboard' },
  { name: 'University Student', email: 'student.harvard@azaammedics.org', expectedPath: '/student/dashboard' },
  { name: 'Independent Applicant', email: 'independent.student@azaammedics.org', expectedPath: '/student/dashboard' },
] as const;

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password!);
  await page.locator('button[type="submit"]').click();
}

test('anonymous users are redirected away from protected admin pages', async ({ page }) => {
  await page.goto('/admin/dashboard');
  await expect(page).toHaveURL(/\/login$/);
});

for (const roleCase of roleCases) {
  test(`${roleCase.name} signs in and lands in the correct portal`, async ({ page }) => {
    await login(page, roleCase.email);
    await expect(page).toHaveURL(
      new RegExp(`${roleCase.expectedPath.replaceAll('/', '\\/')}$`),
      { timeout: 15_000 }
    );
    await expect(page.locator('body')).not.toContainText('Invalid credentials');

    if (roleCase.expectedPath === '/admin/dashboard') {
      await expect(page.getByText('Failed to load data')).toHaveCount(0, { timeout: 15_000 });
      await expect(page.getByText('Super Admin Dashboard')).toBeVisible({ timeout: 15_000 });
    }
  });
}

test('student cannot browse directly into the admin portal', async ({ page }) => {
  await login(page, 'student.harvard@azaammedics.org');
  await expect(page).toHaveURL(/\/student\/dashboard$/);

  await page.goto('/admin/dashboard');
  await expect(page).toHaveURL(/\/student\/dashboard$/);
});

test('organization admin cannot browse directly into university portal', async ({ page }) => {
  await login(page, 'admin@massgeneral.org');
  await expect(page).toHaveURL(/\/organization\/dashboard$/);

  await page.goto('/university/dashboard');
  await expect(page).toHaveURL(/\/organization\/dashboard$/);
});
