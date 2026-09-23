import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test('AZAAM can edit a completed review batch and decision on mobile', async ({ page }) => {
  const batches = [
    { _id: 'batch-1', batchNumber: 'JU-2026-01', name: 'First', status: 'OPEN' },
    { _id: 'batch-2', batchNumber: 'JU-2026-02', name: 'Second', status: 'OPEN' },
  ];
  let batch = batches[0];
  let status = 'COMPLETED';
  let reason = '';
  let writes = 0;
  const stage = () => ({ stageKey: 'AZAAM_REVIEW', status, title: 'AZAAM Review & Approval', description: 'Review student documents.', reason, documents: [], comments: [] });
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data: any = [];
    if (path.endsWith('/auth/me')) data = { user: { _id: 'admin', firstName: 'Admin', roles: ['SUPER_ADMIN'] } };
    else if (path.endsWith('/AZAAM_REVIEW/action')) {
      const payload = route.request().postDataJSON();
      writes++;
      if (payload.action === 'APPROVE') { batch = batches.find((item) => item._id === payload.batchId)!; status = 'COMPLETED'; }
      else { status = payload.action === 'REJECT' ? 'REJECTED' : 'CORRECTION_REQUESTED'; reason = payload.reason; }
      data = { stages: [stage()] };
    } else if (path.endsWith('/students/student')) data = { _id: 'student', firstName: 'Test', lastName: 'Student', status: 'ACTIVE', university: { _id: 'university', name: 'JU' }, batch };
    else if (path.endsWith('/journey')) data = { stages: [stage()] };
    else if (path.endsWith('/documents')) data = { documents: [{ _id: 'doc', originalName: 'nomination.pdf', type: 'NOMINATION_LETTER' }] };
    else if (path.endsWith('/chat')) data = { messages: [], unreadCount: 0 };
    else if (path.endsWith('/training-batches')) data = batches;
    else if (path.endsWith('/organizations')) data = { organizations: [] };
    await route.fulfill({ json: { success: true, data } });
  });
  await page.goto('/admin/students/student');
  await page.getByRole('button', { name: 'Edit Review & Batch' }).click();
  await page.getByRole('combobox', { name: 'Batch No' }).selectOption('batch-2');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(writes).toBe(0);
  await page.getByRole('button', { name: 'Edit Review & Batch' }).click();
  await page.getByRole('combobox', { name: 'Batch No' }).selectOption('batch-2');
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByRole('button', { name: 'Edit Review & Batch' })).toBeVisible();
  await page.reload();
  await expect(page.getByText('JU-2026-02', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit Review & Batch' }).click();
  await page.getByRole('combobox', { name: 'Review status' }).selectOption('REQUEST_CORRECTION');
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByText('A reason/comment is required for Request Correction or Reject.')).toBeVisible();
  await page.getByPlaceholder('Reason / comment (required)').fill('Please replace the document');
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByText('AZAAM comment: Please replace the document')).toBeVisible();
  expect(writes).toBe(2);
  await page.reload();
  await expect(page.getByText('AZAAM comment: Please replace the document')).toBeVisible();
});
