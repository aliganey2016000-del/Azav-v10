import { expect, test } from '@playwright/test';

const user = { _id: 'refresh-test', firstName: 'Refresh', lastName: 'Test', roles: ['SUPER_ADMIN'] };

test('placements remains visible after a full browser refresh', async ({ page }) => {
  await page.route('**/api/v1/**', (route) => route.fulfill({ json: { success: true, data: [] } }));
  await page.route('**/api/v1/auth/me', (route) => route.fulfill({ json: { success: true, data: { user } } }));
  await page.goto('/admin/placements');
  await expect(page.getByRole('heading', { name: 'Placements', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Placements', exact: true })).toBeVisible();
});

test('failed session restoration offers retry and preserves the requested page', async ({ page }) => {
  await page.route('**/api/v1/**', (route) => route.fulfill({ json: { success: true, data: [] } }));
  let unavailable = true;
  await page.route('**/api/v1/auth/me', (route) => unavailable
    ? route.abort('failed')
    : route.fulfill({ json: { success: true, data: { user } } }));
  await page.goto('/admin/placements');
  await expect(page.getByRole('heading', { name: 'Unable to connect' })).toBeVisible();
  unavailable = false;
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: 'Placements', exact: true })).toBeVisible();
});

test('expired sessions show login instead of a blank page', async ({ page }) => {
  await page.route('**/api/v1/auth/me', (route) => route.fulfill({ status: 401, json: { success: false } }));
  await page.goto('/admin/placements');
  await expect(page.getByRole('heading', { name: 'Sign In to Portal' })).toBeVisible();
});

test('failed JavaScript loading leaves a visible recovery link', async ({ page }) => {
  await page.route(/\.(?:js|tsx)(?:\?.*)?$/, (route) => route.abort());
  await page.goto('/admin/placements');
  await expect(page.getByText('Loading your app...')).toBeVisible();
  await expect(page.getByRole('link', { name: 'reload this page' })).toBeVisible({ timeout: 20000 });
});

test('a stalled session check stops waiting and offers retry', async ({ page }) => {
  await page.route('**/api/v1/auth/me', () => {});
  await page.goto('/admin/placements');
  await expect(page.getByText('Authenticating session...')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible({ timeout: 20000 });
});

test('render failures display a reload action', async ({ page }) => {
  await page.route('**/api/v1/auth/me', (route) => route.fulfill({
    json: { success: true, data: { user: { ...user, roles: {} } } },
  }));
  await page.goto('/admin/placements');
  await expect(page.getByRole('button', { name: 'Reload page' })).toBeVisible();
});
