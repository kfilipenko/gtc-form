import { expect, test } from '@playwright/test';

const operatorAccessToken =
  process.env.CREWPORTGLOBAL_OPERATOR_ACCESS_TOKEN ||
  process.env.CPG_OPERATOR_ACCESS_TOKEN ||
  'crewportglobal-local-operator';

test('protected registry detail exposes paginated safe rows only', async ({ page, request }) => {
  const invalidTokenResponse = await request.get('/api/v1/operator/registry-detail?type=all&page_size=10', {
    headers: {
      'X-CPG-Operator-Token': '',
      Authorization: 'Bearer invalid-registry-token',
    },
  });
  expect(invalidTokenResponse.status()).toBe(401);

  const response = await request.get('/api/v1/operator/registry-detail?type=all&readiness=all&page=1&page_size=10', {
    headers: {
      Authorization: `Bearer ${operatorAccessToken}`,
    },
  });
  const bodyText = await response.text();
  expect(response.ok(), bodyText).toBeTruthy();
  const body = JSON.parse(bodyText) as {
    ok: boolean;
    total_count: number;
    total_pages: number;
    rows: Array<Record<string, unknown>>;
    privacy_boundary: Record<string, unknown>;
  };
  expect(body.ok).toBe(true);
  expect(body.total_count).toBeGreaterThan(0);
  expect(body.total_pages).toBeGreaterThanOrEqual(1);
  expect(body.privacy_boundary.contact_fields_excluded).toBe(true);
  expect(body.privacy_boundary.seafarer_names_excluded).toBe(true);

  const rowPayload = JSON.stringify(body.rows);
  expect(rowPayload).not.toContain('contact_email');
  expect(rowPayload).not.toContain('seafarer_email');
  expect(rowPayload).not.toContain('contact_phone');
  expect(rowPayload).not.toContain('document_metadata');
  expect(rowPayload).not.toContain('passport_number');
  expect(rowPayload).not.toContain('medical_details');

  await page.goto(`/team/registry/?operator_token=${encodeURIComponent(operatorAccessToken)}`);
  await expect(page.locator('#registry-status')).toContainText('Showing');
  await expect(page.locator('#registry-counts')).toContainText('Crew requests');
  await expect(page.locator('#registry-list .registry-card').first()).toBeVisible();
  await expect(page.locator('body')).not.toContainText('contact_email');
  await expect(page.locator('body')).not.toContainText('document_metadata');

  await page.locator('#registry-type').selectOption('seafarers');
  await expect(page.locator('#registry-status')).toContainText('Showing');
  await expect(page.locator('#registry-list')).toContainText('Seafarer');

  await page.locator('#registry-readiness').selectOption('matching_ready');
  await expect(page.locator('#registry-status')).toContainText('Showing');
});
