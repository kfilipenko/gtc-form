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
  await expect(page.locator('a[href="https://crewportglobal.com/register/authorization/"]')).toHaveCount(2);
  await expect(page.locator('text=To configure')).toBeVisible();
});

test('authorization page supports multiple card requests without granting authority', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('crewportglobal.registration.person', JSON.stringify({
      person_id: '11111111-1111-4111-8111-111111111111',
      email: 'person@example.com',
      masked_email: 'p***@example.com',
      registration_state: 'email_confirmed',
      authorization_state: 'not_granted'
    }));
  });

  await page.goto('/register/authorization/');

  await expect(page.locator('h1')).toContainText('Request one or more authorization cards');
  await expect(page.locator('.auth-card')).toHaveCount(4);
  await expect(page.locator('.auth-card[open] summary')).toContainText('My tasks');
  await expect(page.locator('.auth-card:not([open])')).toHaveCount(3);
  await expect(page.locator('text=Phone confirmation')).toBeVisible();
  await expect(page.locator('text=To configure')).toBeVisible();

  await page.locator('#card-seafarer-specialist').check();
  await page.locator('#card-buyer-employer').check();

  await page.locator('.auth-card').nth(1).locator('summary').click();
  await page.locator('#seafarer-rank').fill('Chief Officer');
  await page.locator('#seafarer-department').selectOption('deck');
  await page.locator('#seafarer-documents').selectOption('ready');
  await page.locator('#seafarer-note').fill('Ready for reviewed matching.');

  await page.locator('.auth-card').nth(2).locator('summary').click();
  await page.locator('#employer-company').fill('Ocean Example Ltd');
  await page.locator('#employer-position').fill('Crewing manager');
  await page.locator('#employer-authority').selectOption('manager');
  await page.locator('#employer-request-ready').selectOption('planning');
  await page.locator('#employer-note').fill('Planning a crew request after evidence review.');

  await page.locator('#save-authorization').click();
  await expect(page.locator('#authorization-status')).toContainText('Authorization card requests saved');

  await expect.poll(() => page.evaluate(() => {
    const payload = JSON.parse(window.localStorage.getItem('crewportglobal.authorization.requests') || '{}');
    return [
      payload.phone_verification_state,
      payload.authorization_state,
      payload.cards.map((card: { card_type: string }) => card.card_type).sort().join('|'),
      payload.cards.find((card: { card_type: string }) => card.card_type === 'seafarer_specialist')?.rank,
      payload.cards.find((card: { card_type: string }) => card.card_type === 'buyer_employer')?.company_name,
    ].join('::');
  })).toBe('to_be_configured::requested_not_granted::buyer_employer|seafarer_specialist::Chief Officer::Ocean Example Ltd');

  await page.reload();
  await expect(page.locator('#card-seafarer-specialist')).toBeChecked();
  await expect(page.locator('#card-buyer-employer')).toBeChecked();
});
