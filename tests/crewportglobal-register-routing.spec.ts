import { expect, test } from '@playwright/test';

test('public register page creates a platform participant request and routes by role', async ({ page }) => {
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

  await page.goto('/register/?role=seafarer');

  await expect(page.locator('h1')).toContainText('Create your platform participant account');
  await expect(page.locator('#role')).toHaveValue('seafarer');
  await expect(page.locator('main a[href="https://crewportglobal.com/create-profile/"]')).toHaveCount(0);
  await expect(page.locator('main a[href="https://crewportglobal.com/post-vacancy/"]')).toHaveCount(0);

  await page.locator('#register-submit').click();
  await expect(page.locator('#register-status')).toContainText('Complete full name');

  const email = `ui.register.person.${Date.now()}@example.com`;
  await page.locator('#full-name').fill('Person Registration');
  await page.locator('#email').fill(email);
  await page.locator('#phone').fill('+15550123');
  await page.locator('#country').fill('United States');
  await page.locator('#password').fill('SecurePass123!');
  await page.locator('#confirm-password').fill('SecurePass123!');
  await page.locator('#terms').check();
  await page.locator('#consent').check();
  await page.locator('#register-submit').click();

  await expect(page).toHaveURL(/\/create-profile\/\?draft_id=[0-9a-f-]{36}$/);

  await expect.poll(() => page.evaluate(() => {
    const payload = JSON.parse(window.localStorage.getItem('crewportglobal.registration.person') || '{}');
    return [
      payload.registration_state,
      payload.authorization_state,
      payload.capability_state,
      payload.email,
      payload.role,
      Boolean(payload.person_id),
    ].join('|');
  })).toBe(`password_credential_registered|not_granted|not_requested|${email}|seafarer|true`);
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

test('authorization selection routes multiple selected forms without embedded form fields', async ({ page }) => {
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

  await expect(page.locator('h1')).toContainText('Choose authorization forms');
  await expect(page.locator('.auth-card')).toHaveCount(2);
  await expect(page.locator('.auth-card[open] summary')).toContainText('My tasks');
  await expect(page.locator('.auth-card:not([open])')).toHaveCount(1);
  await expect(page.locator('text=Phone confirmation')).toBeVisible();
  await expect(page.locator('text=To configure')).toBeVisible();
  await expect(page.locator('#seafarer-rank')).toHaveCount(0);
  await expect(page.locator('#buyer-company')).toHaveCount(0);

  await page.locator('#card-seafarer-specialist').check();
  await page.locator('#card-buyer-employer').check();
  await page.locator('#continue-authorization').click();

  await expect(page).toHaveURL(/\/register\/authorization\/selected\//);
  await expect(page.locator('h1')).toContainText('Complete the selected authorization forms');
  await expect(page.locator('#selected-seafarer')).toBeVisible();
  await expect(page.locator('#selected-employer')).toBeVisible();

  await expect.poll(() => page.evaluate(() => {
    const payload = JSON.parse(window.localStorage.getItem('crewportglobal.authorization.selectedCards') || '{}');
    const request = JSON.parse(window.localStorage.getItem('crewportglobal.authorization.requests') || '{}');
    return [
      payload.phone_verification_state,
      payload.authorization_state,
      payload.selected_cards.sort().join('|'),
      request.cards.map((card: { card_type: string }) => card.card_type).sort().join('|'),
    ].join('::');
  })).toBe('to_be_configured::forms_selected_not_submitted::buyer_employer|seafarer_specialist::buyer_employer|seafarer_specialist');
});

test('seafarer authorization form saves a separate draft with document metadata', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('crewportglobal.registration.person', JSON.stringify({
      person_id: '11111111-1111-4111-8111-111111111111',
      email: 'person@example.com',
      registration_state: 'email_confirmed'
    }));
  });

  await page.goto('/register/authorization/seafarer-specialist/');
  await expect(page.locator('h1')).toContainText('Complete the seafarer / specialist form');
  await expect(page.locator('#seafarer-file-passport')).toHaveCount(1);

  await page.locator('#seafarer-rank').fill('Chief Officer');
  await page.locator('#seafarer-department').selectOption('deck');
  await page.locator('#seafarer-nationality').fill('Philippines');
  await page.locator('#seafarer-residence').fill('United Arab Emirates');
  await page.locator('#seafarer-salary').fill('USD 4500');
  await page.locator('#seafarer-vessels').fill('Container, bulk carrier');
  await page.locator('#seafarer-experience').fill('6 years, 2 contracts in rank');
  await page.locator('#seafarer-languages').fill('English');
  await page.locator('#seafarer-documents').selectOption('ready');
  await page.locator('#seafarer-note').fill('Ready for reviewed matching.');
  await page.locator('#seafarer-file-passport').setInputFiles({
    name: 'passport.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('passport')
  });

  await page.locator('#save-seafarer-form').click();
  await expect(page.locator('#seafarer-status')).toContainText('Seafarer / Specialist authorization form draft saved');

  await expect.poll(() => page.evaluate(() => {
    const payload = JSON.parse(window.localStorage.getItem('crewportglobal.authorization.form.seafarerSpecialist') || '{}');
    return [
      payload.card_type,
      payload.authorization_state,
      payload.fields.rank,
      payload.fields.department,
      payload.documents.passport[0]?.name,
    ].join('::');
  })).toBe('seafarer_specialist::requested_not_granted::Chief Officer::deck::passport.pdf');
});

test('buyer authorization form saves a separate draft with authority document metadata', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('crewportglobal.registration.person', JSON.stringify({
      person_id: '11111111-1111-4111-8111-111111111111',
      email: 'person@example.com',
      registration_state: 'email_confirmed'
    }));
  });

  await page.goto('/register/authorization/buyer-employer/');
  await expect(page.locator('h1')).toContainText('Complete the buyer / employer form');
  await expect(page.locator('#buyer-file-authority')).toHaveCount(1);

  await page.locator('#buyer-company').fill('Ocean Example Ltd');
  await page.locator('#buyer-country').fill('United Arab Emirates');
  await page.locator('#buyer-position').fill('Crewing manager');
  await page.locator('#buyer-authority').selectOption('employee');
  await page.locator('#buyer-type').selectOption('ship_manager');
  await page.locator('#buyer-request-status').selectOption('planning');
  await page.locator('#buyer-vessel').fill('Container fleet');
  await page.locator('#buyer-ranks').fill('Chief Officer, 2/E');
  await page.locator('#buyer-note').fill('Planning a crew request after evidence review.');
  await page.locator('#buyer-file-authority').setInputFiles({
    name: 'authority-letter.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('authority')
  });

  await page.locator('#save-buyer-form').click();
  await expect(page.locator('#buyer-status')).toContainText('Buyer / Employer authorization form draft saved');

  await expect.poll(() => page.evaluate(() => {
    const payload = JSON.parse(window.localStorage.getItem('crewportglobal.authorization.form.buyerEmployer') || '{}');
    return [
      payload.card_type,
      payload.authorization_state,
      payload.fields.company_name,
      payload.fields.authority_basis,
      payload.documents.authority[0]?.name,
    ].join('::');
  })).toBe('buyer_employer::requested_not_granted::Ocean Example Ltd::employee::authority-letter.pdf');
});
