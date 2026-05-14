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
  await page.locator('#create-certificate-status').selectOption('ready');
  await page.locator('#create-stcw-status').selectOption('collecting');
  await page.locator('#create-passport-expiry').fill('2028-08-15');
  await page.locator('#create-medical-expiry').fill('2026-12-20');
  await page.locator('#create-visa-status').selectOption('required');
  await page.locator('#create-document-notes').fill('Schengen visa appointment booked.');

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
  await expect(page.locator('#create-certificate-status')).toHaveValue('ready');
  await expect(page.locator('#create-stcw-status')).toHaveValue('collecting');
  await expect(page.locator('#create-passport-expiry')).toHaveValue('2028-08-15');
  await expect(page.locator('#create-medical-expiry')).toHaveValue('2026-12-20');
  await expect(page.locator('#create-visa-status')).toHaveValue('required');
  await expect(page.locator('#create-document-notes')).toHaveValue('Schengen visa appointment booked.');

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
  await page.locator('#create-certificate-status').selectOption('ready');
  await page.locator('#create-stcw-status').selectOption('ready');
  await page.locator('#create-passport-expiry').fill('2029-01-10');
  await page.locator('#create-medical-expiry').fill('2027-02-05');
  await page.locator('#create-visa-status').selectOption('not_required');
  await page.locator('#create-document-notes').fill('All metadata ready for review.');

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
  await expect(page.locator('#create-certificate-status')).toHaveValue('ready');
  await expect(page.locator('#create-stcw-status')).toHaveValue('ready');
  await expect(page.locator('#create-passport-expiry')).toHaveValue('2029-01-10');
  await expect(page.locator('#create-medical-expiry')).toHaveValue('2027-02-05');
  await expect(page.locator('#create-visa-status')).toHaveValue('not_required');
  await expect(page.locator('#create-document-notes')).toHaveValue('All metadata ready for review.');
});

test('create profile shows needs correction status and latest correction note for existing draft', async ({ page, request }) => {
  const unique = Date.now();
  const email = `ui.correction.${unique}@example.com`;

  const createResponse = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'seafarer',
      email,
      full_name: 'Ivan Petrov',
      rank: 'Third Officer',
      department: 'deck',
      availability_status: 'available_later',
      availability_date: '2026-11-20',
      contact_phone: '+971500001111',
    },
  });
  expect(createResponse.ok()).toBeTruthy();
  const created = (await createResponse.json()) as { draft_id: string };

  const note = 'Missing certificate details and availability date.';
  const correctionResponse = await request.patch(`/api/v1/operator/review-queue/${created.draft_id}/status`, {
    data: {
      decision: 'needs_correction',
      note,
    },
  });
  expect(correctionResponse.ok()).toBeTruthy();

  await page.goto(`/create-profile/?draft_id=${created.draft_id}`);

  await expect(page.locator('#create-review-status')).toContainText('Needs correction');
  await expect(page.locator('#create-correction-note')).toContainText(note);

  await expect(page.locator('#create-full-name')).toHaveValue('Ivan Petrov');
  await expect(page.locator('#create-email')).toHaveValue(email);
  await expect(page.locator('#create-rank')).toHaveValue('Third Officer');
  await expect(page.locator('#create-department')).toHaveValue('deck');
});
