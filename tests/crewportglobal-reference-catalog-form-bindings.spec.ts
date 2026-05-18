import { expect, test } from '@playwright/test';

test('published reference catalogs populate seafarer and employer form suggestions', async ({ page }) => {
  await page.goto('/create-profile/');

  await expect.poll(async () => page.locator('#create-rank-options option').count()).toBeGreaterThan(0);
  await expect(page.locator('#create-rank-options option[value="Chief Officer"]')).toHaveCount(1);
  await expect(page.locator('#create-vessel-type-options option[value="BULK CARRIER"]')).toHaveCount(1);

  await page.locator('#create-rank').fill('Chief Officer');
  await page.locator('#create-vessel-types').fill('BULK CARRIER, LNG');
  await expect(page.locator('#create-rank')).toHaveValue('Chief Officer');
  await expect(page.locator('#create-vessel-types')).toHaveValue('BULK CARRIER, LNG');

  await page.goto('/post-vacancy/');

  await expect.poll(async () => page.locator('#post-rank-options option').count()).toBeGreaterThan(0);
  await expect(page.locator('#post-rank-options option[value="Chief Officer"]')).toHaveCount(1);
  await expect(page.locator('#post-vessel-type-options option[value="BULK CARRIER"]')).toHaveCount(1);

  await page.locator('#post-vacancy-title').fill('Chief Officer');
  await page.locator('#post-vessel-type').fill('BULK CARRIER');
  await expect(page.locator('#post-vacancy-title')).toHaveValue('Chief Officer');
  await expect(page.locator('#post-vessel-type')).toHaveValue('BULK CARRIER');
});
