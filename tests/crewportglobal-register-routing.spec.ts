import { expect, test } from '@playwright/test';

test('public register page creates a physical-person request without role routing', async ({ page }) => {
  await page.route('**/api/v1/registration/person/request', async (route) => {
    const request = route.request();
    const body = JSON.parse(request.postData() || '{}');
    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        status: 'registration_email_confirmation_sent',
        person_id: '11111111-1111-4111-8111-111111111111',
        masked_email: body.email.replace(/^(.).+(@.+)$/, '$1***$2'),
        delivery_status: 'captured_test_only',
        next_step: 'open_email_confirmation_link',
        expires_at: '2026-05-17T15:00:00+00:00',
      }),
    });
  });

  await page.goto('/register/');

  await expect(page.locator('h1')).toContainText('Create a physical person');
  await expect(page.locator('[data-role]')).toHaveCount(0);
  await expect(page.locator('main a[href="https://crewportglobal.com/create-profile/"]')).toHaveCount(0);
  await expect(page.locator('main a[href="https://crewportglobal.com/post-vacancy/"]')).toHaveCount(0);

  await page.locator('#register-submit').click();
  await expect(page.locator('#register-status')).toContainText('Complete full name');

  const email = `ui.register.person.${Date.now()}@example.com`;
  await page.locator('#full-name').fill('Person Registration');
  await page.locator('#email').fill(email);
  await page.locator('#phone').fill('+15550123');
  await page.locator('#country').fill('United States');
  await page.locator('#terms').check();
  await page.locator('#consent').check();
  await page.locator('#register-submit').click();

  await expect(page).toHaveURL(/\/register\/$/);
  await expect(page.locator('#register-status')).toContainText('Confirmation link sent');
  await expect(page.locator('#register-next-steps')).toBeVisible();

  await expect.poll(() => page.evaluate(() => {
    const payload = JSON.parse(window.localStorage.getItem('crewportglobal.registration.person') || '{}');
    return [
      payload.registration_state,
      payload.authorization_state,
      payload.capability_state,
      payload.email,
      payload.person_id,
    ].join('|');
  })).toBe(`email_confirmation_sent|not_granted|not_requested|${email}|11111111-1111-4111-8111-111111111111`);
});

test('email confirmation page posts token and routes to registration sequence', async ({ page }) => {
  await page.route('**/api/v1/registration/person/confirm', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        status: 'registration_email_confirmed',
        person_id: '11111111-1111-4111-8111-111111111111',
        email: 'person@example.com',
        display_name: 'Person Registration',
        email_verified_at: '2026-05-17T14:00:00+00:00',
        next_url: '/register/next/',
      }),
    });
  });

  await page.goto('/register/confirm/?token=test-token');
  await expect(page.locator('#confirm-status')).toContainText('Email confirmed');
  await expect(page).toHaveURL(/\/register\/next\//);
  await expect(page.locator('h1')).toContainText('Continue step by step');
  await expect(page.locator('.sequence-card[open] summary')).toContainText('My tasks');
  await expect(page.locator('.sequence-card')).toHaveCount(5);
});
