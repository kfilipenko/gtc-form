import { expect, test } from '@playwright/test';

test('published reference catalogs populate seafarer and employer form suggestions', async ({ page }) => {
  await page.goto('/create-profile/');

  await expect.poll(async () => page.locator('#create-rank-options option').count()).toBeGreaterThan(0);
  await expect(page.locator('#create-rank-options option[value="Chief Officer"]')).toHaveCount(1);
  await expect.poll(async () => page.locator('#create-vessel-types option').count()).toBeGreaterThan(1);
  await expect(page.locator('#create-vessel-types option[value="BULK CARRIER"]')).toHaveCount(1);

  await page.locator('#create-rank').fill('Chief Officer');
  await page.locator('#create-vessel-types-options .multi-choice-option', { hasText: 'BULK CARRIER' }).click();
  await page.locator('#create-vessel-types-options .multi-choice-option', { hasText: 'LNG' }).click();
  await expect(page.locator('#create-rank')).toHaveValue('Chief Officer');
  const selectedVesselTypes = await page.locator('#create-vessel-types').evaluate((select: HTMLSelectElement) => (
    Array.from(select.selectedOptions).map((option) => option.value)
  ));
  expect(selectedVesselTypes).toEqual(expect.arrayContaining(['BULK CARRIER', 'LNG']));

  await page.goto('/post-vacancy/');

  await expect.poll(async () => page.locator('#post-vacancy-title option').count()).toBeGreaterThan(1);
  await expect(page.locator('#post-vacancy-title option[value="Chief Officer"]')).toHaveCount(1);
  await expect(page.locator('#post-vessel-type option[value="BULK CARRIER"]')).toHaveCount(1);
  await expect(page.locator('#post-country option[value="AE"]')).toHaveCount(1);
  await expect(page.locator('#post-vessel-flag-country option[value="AE"]')).toHaveCount(1);

  await page.locator('#post-vacancy-title').selectOption('Chief Officer');
  await page.locator('#post-vessel-type').selectOption('BULK CARRIER');
  await page.locator('#post-country').selectOption('AE');
  await page.locator('#post-vessel-flag-same-company').click();
  await expect(page.locator('#post-vacancy-title')).toHaveValue('Chief Officer');
  await expect(page.locator('#post-vessel-type')).toHaveValue('BULK CARRIER');
  await expect(page.locator('#post-country')).toHaveValue('AE');
  await expect(page.locator('#post-vessel-flag-country')).toHaveValue('AE');
});

test('standard form lifecycle blocks non-English letters in intake forms', async ({ page }) => {
  await page.goto('/create-profile/');
  await page.locator('#create-full-name').click();
  await page.keyboard.type('Иван Иванов');
  await expect(page.locator('#create-full-name')).not.toHaveValue(/[\u0400-\u04FF]/);

  await page.locator('#create-full-name').evaluate((element: HTMLInputElement) => {
    element.value = 'Иван Иванов';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#create-submit').click();
  await expect(page.locator('#create-status')).toContainText('Use English and Latin characters');
  await expect(page.locator('#create-full-name')).toHaveAttribute('aria-invalid', 'true');

  await page.goto('/post-vacancy/');
  await page.locator('#post-company').click();
  await page.keyboard.type('Компания');
  await expect(page.locator('#post-company')).not.toHaveValue(/[\u0400-\u04FF]/);

  await page.locator('#post-email').fill('english.only.form@example.com');
  await page.locator('#post-company').evaluate((element: HTMLInputElement) => {
    element.value = 'Компания';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#post-submit').click();
  await expect(page.locator('#post-status')).toContainText('Use English and Latin characters');
  await expect(page.locator('#post-company')).toHaveAttribute('aria-invalid', 'true');
});
