import { expect, test } from '@playwright/test';

test('create profile prefill from draft_id preserves patch flow', async ({ page }) => {
  await page.goto('/create-profile/');
  await page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem('crewportglobal.language', 'en');
  });

  await page.goto('/create-profile/');

  await page.locator('#create-full-name').fill('Alex Marinov');
  await page.locator('#create-email').fill(`ui.prefill.${Date.now()}@example.com`);
  await page.locator('#create-country').fill('AE');
  await page.locator('#create-rank').fill('Second Officer');
  await page.locator('#create-department').selectOption('deck');
  await page.locator('#create-nationality').fill('PH');
  await page.locator('#create-residence').fill('AE');
  await page.locator('#create-availability').selectOption('available_later');
  await page.locator('#create-availability-date').fill('2026-08-15');
  await page.locator('#create-phone').fill('+971501112233');
  await page.locator('#create-salary').fill('4600');
  await page.locator('#create-vessel-types').fill('Bulk Carrier, Container');

  await page.locator('#create-submit').click();

  await expect(page.locator('#create-status')).toContainText('saved');
  await expect(page).toHaveURL(/draft_id=/);

  const draftId = await page.evaluate(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('draft_id') || '';
  });
  expect(draftId).not.toBe('');

  await page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem('crewportglobal.language', 'en');
  });

  await page.goto(`/create-profile/?draft_id=${draftId}`);
  await expect(page.locator('#create-status')).toContainText('prefilled');

  await expect(page.locator('#create-full-name')).toHaveValue('Alex Marinov');
  await expect(page.locator('#create-email')).toHaveValue(new RegExp('^ui\\.prefill\\..+@example\\.com$'));
  await expect(page.locator('#create-country')).toHaveValue('AE');
  await expect(page.locator('#create-rank')).toHaveValue('Second Officer');
  await expect(page.locator('#create-department')).toHaveValue('deck');
  await expect(page.locator('#create-nationality')).toHaveValue('PH');
  await expect(page.locator('#create-residence')).toHaveValue('AE');
  await expect(page.locator('#create-availability')).toHaveValue('available_later');
  await expect(page.locator('#create-availability-date')).toHaveValue('2026-08-15');
  await expect(page.locator('#create-phone')).toHaveValue('+971501112233');
  await expect(page.locator('#create-salary')).toHaveValue('4600.00');
  await expect(page.locator('#create-vessel-types')).toHaveValue('Bulk Carrier, Container');

  await page.locator('#create-rank').fill('Chief Officer');
  await page.locator('#create-submit').click();
  await expect(page.locator('#create-status')).toContainText('saved');

  await page.reload();
  await expect(page.locator('#create-rank')).toHaveValue('Chief Officer');
});

test('create profile prefill falls back to local draft when draft_id is missing', async ({ page }) => {
  await page.goto('/create-profile/');
  await page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem('crewportglobal.language', 'en');
  });

  const email = `ui.localprefill.${Date.now()}@example.com`;

  await page.goto('/create-profile/');
  await page.locator('#create-full-name').fill('Nikolai Sidorov');
  await page.locator('#create-email').fill(email);
  await page.locator('#create-country').fill('AE');
  await page.locator('#create-rank').fill('Electrical Officer');
  await page.locator('#create-department').selectOption('engine');
  await page.locator('#create-nationality').fill('IN');
  await page.locator('#create-residence').fill('AE');
  await page.locator('#create-availability').selectOption('available_now');
  await page.locator('#create-availability-date').fill('2026-09-01');
  await page.locator('#create-phone').fill('+971500009999');
  await page.locator('#create-salary').fill('5000');
  await page.locator('#create-vessel-types').fill('LNG, Tanker');

  await page.locator('#create-submit').click();
  await expect(page.locator('#create-status')).toContainText('saved');

  await page.goto('/create-profile/');

  await expect(page.locator('#create-full-name')).toHaveValue('Nikolai Sidorov');
  await expect(page.locator('#create-email')).toHaveValue(email);
  await expect(page.locator('#create-country')).toHaveValue('AE');
  await expect(page.locator('#create-rank')).toHaveValue('Electrical Officer');
  await expect(page.locator('#create-department')).toHaveValue('engine');
  await expect(page.locator('#create-nationality')).toHaveValue('IN');
  await expect(page.locator('#create-residence')).toHaveValue('AE');
  await expect(page.locator('#create-availability')).toHaveValue('available_now');
  await expect(page.locator('#create-availability-date')).toHaveValue('2026-09-01');
  await expect(page.locator('#create-phone')).toHaveValue('+971500009999');
  await expect(page.locator('#create-salary')).toHaveValue('5000.00');
  await expect(page.locator('#create-vessel-types')).toHaveValue('LNG, Tanker');
});
