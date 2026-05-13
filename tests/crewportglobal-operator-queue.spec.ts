import { expect, test } from '@playwright/test';

test('operator queue page renders submitted drafts from API', async ({ page, request }) => {
  const unique = Date.now();
  const seafarerEmail = `ui.queue.seafarer.${unique}@example.com`;

  const createResponse = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'seafarer',
      email: seafarerEmail,
      full_name: 'Operator Queue Seafarer',
      availability_status: 'available_now',
    },
  });
  expect(createResponse.ok()).toBeTruthy();

  await page.goto('/verify/');

  await expect(page.locator('#queue-status')).toContainText('Queue loaded');
  await expect(page.locator('#queue-body')).toContainText(seafarerEmail);
  await expect(page.locator('#queue-body')).toContainText('seafarer_profile');

  await page.locator('#filter-type').selectOption('seafarer_profile');
  await expect(page.locator('#queue-body')).toContainText(seafarerEmail);

  await page.locator('#filter-role').selectOption('seafarer');
  await page.locator('.queue-open').first().click();
  await expect(page.locator('#details-json')).toContainText(seafarerEmail);
  await expect(page.locator('#details-json')).toContainText('seafarer_profile');
});
