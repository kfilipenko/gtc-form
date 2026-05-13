import { expect, test } from '@playwright/test';

test('register creates seafarer draft and redirects to create-profile', async ({ page, request }) => {
  await page.goto('/register/');

  const email = `ui.register.seafarer.${Date.now()}@example.com`;
  await page.locator('#email').fill(email);
  await page.locator('#full-name').fill('Seafarer Entry');
  await page.locator('#terms').check();
  await page.locator('#consent').check();

  await page.locator('#continue-button').click();
  await expect(page).toHaveURL(/\/create-profile\/\?draft_id=/);

  const draftId = await page.evaluate(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('draft_id') || '';
  });
  expect(draftId).not.toBe('');

  const draftResponse = await request.get(`/api/v1/registration/drafts/${draftId}`);
  expect(draftResponse.ok()).toBeTruthy();
  const draftBody = await draftResponse.json();
  expect(draftBody.role).toBe('seafarer');
  expect(draftBody.email).toBe(email);
});

test('register routes employer-side roles to post-vacancy with draft_id', async ({ page, request }) => {
  const roleCases = [
    { uiRole: 'employer', apiRole: 'employer' },
    { uiRole: 'shipowner', apiRole: 'shipowner' },
    { uiRole: 'crewing-manager', apiRole: 'crewing_manager' },
  ];

  for (const roleCase of roleCases) {
    await page.goto('/register/');

    const email = `ui.register.${roleCase.uiRole}.${Date.now()}@example.com`;
    await page.locator(`[data-role="${roleCase.uiRole}"]`).click();
    await page.locator('#email').fill(email);
    await page.locator('#full-name').fill('Employer Entry');
    await page.locator('#terms').check();
    await page.locator('#consent').check();

    await page.locator('#continue-button').click();
    await expect(page).toHaveURL(/\/post-vacancy\/\?draft_id=/);

    const draftId = await page.evaluate(() => {
      const params = new URLSearchParams(window.location.search);
      return params.get('draft_id') || '';
    });
    expect(draftId).not.toBe('');

    const draftResponse = await request.get(`/api/v1/registration/drafts/${draftId}`);
    expect(draftResponse.ok()).toBeTruthy();
    const draftBody = await draftResponse.json();
    expect(draftBody.role).toBe(roleCase.apiRole);
    expect(draftBody.email).toBe(email);
  }
});
