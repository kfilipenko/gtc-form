import { expect, test } from '@playwright/test';

const forbiddenPublicTerms = [
  'static UX slice',
  'implementation slice',
  'future-scoped',
  'pending_human_review',
  'approval boundary',
  'placeholder',
  'not yet published',
  'waiting for approval',
  'publication pending',
  'future approval needed',
];

test('first visit uses supported browser language and updates html metadata', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window.navigator, 'language', {
      configurable: true,
      get: () => 'ru-RU',
    });
    Object.defineProperty(window.navigator, 'languages', {
      configurable: true,
      get: () => ['ru-RU', 'en-US'],
    });
    window.localStorage.removeItem('crewportglobal.language');
  });

  await page.goto('/index.html');

  await expect(page.locator('#current-language-label')).toHaveText('Русский');
  await expect(page.locator('.landing-title')).toContainText('CrewPortGlobal соединяет спрос работодателей с предложением моряков');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(page.locator('html')).toHaveAttribute('translate', 'yes');
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('crewportglobal.language'))).toBe('ru');
});

test('first visit falls back to English when browser language is unsupported', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window.navigator, 'language', {
      configurable: true,
      get: () => 'pl-PL',
    });
    Object.defineProperty(window.navigator, 'languages', {
      configurable: true,
      get: () => ['pl-PL'],
    });
    window.localStorage.removeItem('crewportglobal.language');
  });

  await page.goto('/index.html');

  await expect(page.locator('#current-language-label')).toHaveText('English');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('crewportglobal.language'))).toBe('en');
});

test('same-page selector translates the homepage and persists after reload', async ({ page }) => {
  await page.goto('/index.html');

  await expect(page.locator('.landing-title')).toContainText('CrewPortGlobal connects employer demand with seafarer supply');
  await expect(page.locator('#current-language-label')).toHaveText('English');

  await page.locator('#current-language-toggle').click();
  await page.locator('.language-option').filter({ hasText: 'Русский' }).click();

  await expect(page).toHaveURL(/\/index\.html/);
  await expect(page.locator('#current-language-label')).toHaveText('Русский');
  await expect(page.locator('.landing-title')).toContainText('CrewPortGlobal соединяет спрос работодателей с предложением моряков');
  await expect(page.locator('.site-nav')).toContainText('Документы');
  await page.locator('.nav-menu--documents > summary').click();
  await expect(page.locator('.nav-menu--documents')).toContainText('Для работодателей');
  await expect(page.locator('.site-nav')).toContainText('Вход / Регистрация');
  await expect(page.locator('.site-nav')).not.toContainText('Создать профиль');
  await expect(page.locator('.landing-lead')).toContainText('Публичный сайт объясняет модель сервиса');
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('crewportglobal.language'))).toBe('ru');

  await page.reload();

  await expect(page.locator('#current-language-label')).toHaveText('Русский');
  await expect(page.locator('.landing-title')).toContainText('CrewPortGlobal соединяет спрос работодателей с предложением моряков');
  await page.locator('.nav-menu--documents > summary').click();
  await expect(page.locator('.nav-menu--documents')).toContainText('Для работодателей');
  await expect(page.locator('.landing-lead')).toContainText('Публичный сайт объясняет модель сервиса');
});

test('same-page selector works on generated public pages and persists after reload', async ({ page }) => {
  await page.goto('/legal/complaints/index.html');

  await expect(page.locator('h1')).toContainText('Complaint Handling Procedure');
  await expect(page.locator('#current-language-label')).toHaveText('English');

  await page.locator('#current-language-toggle').click();
  await page.locator('.language-option').filter({ hasText: 'Русский' }).click();

  await expect(page.locator('#current-language-label')).toHaveText('Русский');
  await expect(page.locator('.site-nav')).toContainText('Для работодателей');
  await expect(page.locator('.hero-actions')).toContainText('Назад на главную');
  await expect(page.locator('.sidebar-panel')).toContainText('Публичная библиотека');
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('crewportglobal.language'))).toBe('ru');

  await page.reload();

  await expect(page.locator('#current-language-label')).toHaveText('Русский');
  await expect(page.locator('.site-nav')).toContainText('Для работодателей');
});

test('homepage falls back to English for missing non-English page translations', async ({ page }) => {
  await page.goto('/index.html');

  await page.locator('#current-language-toggle').click();
  await page.locator('.language-option').filter({ hasText: 'Português' }).click();

  await expect(page.locator('#current-language-label')).toHaveText('Português');
  await page.locator('.nav-menu--documents > summary').click();
  await expect(page.locator('.nav-menu--documents')).toContainText('Para empregadores');
  await expect(page.locator('.landing-title')).toContainText('CrewPortGlobal connects employer demand with seafarer supply');
  await expect(page.locator('.vacancy-board')).toContainText('Current public vacancy board');
});

test('homepage and vacancies pages avoid internal planning language', async ({ page }) => {
  for (const path of ['/index.html', '/vacancies/index.html']) {
    await page.goto(path);
    const bodyText = await page.locator('body').innerText();

    for (const term of forbiddenPublicTerms) {
      expect(bodyText).not.toContain(term);
    }
  }
});

test('homepage and vacancies CTAs match their destinations', async ({ page }) => {
  await page.goto('/index.html');

  const main = page.locator('main');

  await expect(page.getByRole('link', { name: 'Login / Register' }).first()).toHaveAttribute('href', 'https://crewportglobal.com/register/');
  await expect(main.locator('a[href="https://crewportglobal.com/how-it-works/"]').first()).toHaveText('How It Works');
  await expect(main.locator('a[href="https://crewportglobal.com/legal/verification-policy/"]').first()).toContainText('Trust');
  await expect(main.locator('a[href="https://crewportglobal.com/for-seafarers/"]').first()).toHaveText('For Seafarers');
  await expect(page.locator('main a[href="https://crewportglobal.com/vacancies/"]')).toHaveCount(0);
  await expect(page.locator('main a[href="https://crewportglobal.com/register/"]')).toHaveCount(0);
  await expect(page.locator('main a[href="https://crewportglobal.com/create-profile/"]')).toHaveCount(0);
  await expect(page.locator('main a[href="https://crewportglobal.com/post-vacancy/"]')).toHaveCount(0);
  await expect(main.locator('select')).toHaveCount(0);
  await expect(main.locator('input')).toHaveCount(0);
  await expect(main).not.toContainText('Create Seafarer Profile');
  await expect(main).not.toContainText('Prepare Vacancy Request');

  await page.goto('/vacancies/index.html');

  await expect(page.locator('#vacancy-empty-state')).toContainText('No public vacancies are available yet');
  await expect(page.locator('#vacancy-empty-state')).toContainText('read-only summary');
  await expect(page.locator('main a[href="https://crewportglobal.com/register/"]')).toHaveCount(0);
  await expect(page.locator('main input')).toHaveCount(0);
  await expect(page.locator('main select')).toHaveCount(0);
  await expect(page.locator('main a[href="https://crewportglobal.com/create-profile/"]')).toHaveCount(0);
  await expect(page.locator('main a[href="https://crewportglobal.com/post-vacancy/"]')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('View Details');
  await expect(page.locator('body')).not.toContainText('Create Seafarer Profile');
  await expect(page.locator('body')).not.toContainText('Prepare Vacancy Request');
});

test('register page records a physical person request without role routing', async ({ page }) => {
  await page.route('**/api/v1/registration/person/request', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        status: 'registration_email_confirmation_sent',
        person_id: '22222222-2222-4222-8222-222222222222',
        masked_email: body.email.replace(/^(.).+(@.+)$/, '$1***$2'),
        delivery_status: 'captured_test_only',
        next_step: 'open_email_confirmation_link',
        expires_at: '2026-05-17T15:00:00+00:00',
      }),
    });
  });

  await page.goto('/register/index.html');

  await expect(page.locator('h1')).toContainText('Create a physical person');
  await expect(page.locator('[data-role]')).toHaveCount(0);
  await expect(page.locator('main a[href="https://crewportglobal.com/create-profile/"]')).toHaveCount(0);
  await expect(page.locator('main a[href="https://crewportglobal.com/post-vacancy/"]')).toHaveCount(0);

  await page.locator('#full-name').fill('Alex Person');
  await page.locator('#email').fill('alex.person@example.com');
  await page.locator('#phone').fill('+15550100');
  await page.locator('#country').fill('United States');
  await page.locator('#terms').check();
  await page.locator('#consent').check();
  await page.locator('#register-submit').click();

  await expect(page).toHaveURL(/\/register\/index\.html/);
  await expect(page.locator('#register-status')).toContainText('Confirmation link sent');
  await expect(page.locator('#register-next-steps')).toBeVisible();
  await expect.poll(() => page.evaluate(() => {
    const payload = JSON.parse(window.localStorage.getItem('crewportglobal.registration.person') || '{}');
    return `${payload.registration_state}|${payload.authorization_state}|${payload.email}|${payload.person_id}`;
  })).toBe('email_confirmation_sent|not_granted|alex.person@example.com|22222222-2222-4222-8222-222222222222');
});

test('fallback language page remains accessible', async ({ page }) => {
  await page.goto('/language.html');
  await expect(page.locator('h1')).toContainText('Choose the display language');
});

test('onboarding page shows completeness feedback and saves pending human review locally', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('crewportglobal.language', 'ru');
    window.localStorage.removeItem('crewportglobal_seafarer_acceptance');
    window.localStorage.removeItem('crewportglobal_full_name');
    window.localStorage.removeItem('email');
  });

  await page.goto('/onboarding/seafarer-registration/index.html');

  await expect(page.locator('#current-language-label')).toHaveText('Русский');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await page.locator('.nav-menu--documents > summary').click();
  await expect(page.locator('.nav-menu--documents')).toContainText('Для моряков');
  await expect(page.locator('#route-final-value')).toHaveText('Not started');
  await expect(page.locator('#completeness-required-value')).toHaveText('0 / 6 complete');
  await expect(page.locator('#completeness-ready-value')).toHaveText('Not ready yet');
  await expect(page.locator('#submitButton')).toBeDisabled();
  await expect(page.locator('#completeness-list')).toContainText('Seafarer role is confirmed: Required • Missing');
  await expect(page.locator('#completeness-list')).toContainText('Availability is present: Required • Missing');

  await page.locator('#roleSeafarer').check();
  await page.locator('#fullName').fill('Ivan Petrov');
  await page.locator('#email').fill('ivan@example.com');
  await page.locator('#availability').selectOption('available_now');

  await expect(page.locator('#route-final-value')).toHaveText('Incomplete');
  await expect(page.locator('#completeness-required-value')).toHaveText('4 / 6 complete');

  await page.locator('input[name="ack_no_fee"]').check();
  await page.locator('input[name="ack_privacy"]').check();

  await expect(page.locator('#no-fee-state-value')).toHaveText('Acknowledged');
  await expect(page.locator('#consent-state-value')).toHaveText('Satisfied');
  await expect(page.locator('#route-final-value')).toHaveText('Pending consent');
  await expect(page.locator('#completeness-required-value')).toHaveText('6 / 6 complete');
  await expect(page.locator('#completeness-ready-value')).toHaveText('Ready for human review');
  await expect(page.locator('#submitButton')).toBeEnabled();
  await expect(page.locator('#completeness-list')).toContainText('Seafarer role is confirmed: Required • Complete');
  await expect(page.locator('#completeness-list')).toContainText('Basic profile draft is present: Required • Complete');
  await expect(page.locator('#completeness-list')).toContainText('Contact email is present: Required • Complete');
  await expect(page.locator('#completeness-list')).toContainText('Availability is present: Required • Complete');

  await page.locator('#submitButton').click();

  await expect(page.locator('#route-final-value')).toHaveText('Pending human review');
  await expect(page.locator('#statusMessage')).toContainText('pending human review');
  await expect.poll(() => page.evaluate(() => {
    const payload = JSON.parse(window.localStorage.getItem('crewportglobal_seafarer_acceptance') || '{}');
    return payload.routeState;
  })).toBe('pending_human_review');
});
