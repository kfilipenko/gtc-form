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
  await expect(page.locator('.landing-title')).toContainText('CrewPortGlobal сопоставляет спрос на экипаж с проверенными данными моряков.');
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

  await expect(page.locator('.landing-title')).toContainText('CrewPortGlobal matches crew demand with verified seafarer supply.');
  await expect(page.locator('#current-language-label')).toHaveText('English');

  await page.locator('#current-language-toggle').click();
  await page.locator('.language-option').filter({ hasText: 'Русский' }).click();

  await expect(page).toHaveURL(/\/index\.html/);
  await expect(page.locator('#current-language-label')).toHaveText('Русский');
  await expect(page.locator('.landing-title')).toContainText('CrewPortGlobal сопоставляет спрос на экипаж с проверенными данными моряков.');
  await expect(page.locator('.site-nav')).toContainText('Документы');
  await expect(page.locator('.site-menu-group--employers')).toContainText('Для работодателей');
  await expect(page.locator('.site-menu-group--employers a[href="https://crewportglobal.com/for-shipowners/"]')).toBeVisible();
  await expect(page.locator('.site-nav')).toContainText('Вход / Регистрация');
  await expect(page.locator('.landing-lead')).toContainText('Заявки, суда и профили моряков уже зарегистрированы в системе.');
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('crewportglobal.language'))).toBe('ru');

  await page.reload();

  await expect(page.locator('#current-language-label')).toHaveText('Русский');
  await expect(page.locator('.landing-title')).toContainText('CrewPortGlobal сопоставляет спрос на экипаж с проверенными данными моряков.');
  await expect(page.locator('.site-menu-group--employers')).toContainText('Для работодателей');
  await expect(page.locator('.landing-lead')).toContainText('Заявки, суда и профили моряков уже зарегистрированы в системе.');
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
  await expect(page.locator('.site-menu-group--employers')).toContainText('Para empregadores');
  await expect(page.locator('.landing-title')).toContainText('CrewPortGlobal matches crew demand with verified seafarer supply.');
  await expect(page.locator('.vacancy-board').filter({ hasText: 'Latest vacancies' })).toContainText('Current public vacancy board');
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

  await expect(page.locator('.site-menu-group--registration a[href="https://crewportglobal.com/register/"]').first()).toHaveText('Login / Register');
  await expect(main.locator('#home-process-cycle')).toContainText('BP-015 operating cycle');
  await expect(main.locator('a[href="#home-process-cycle"]').first()).toHaveText('View process cycle');
  await expect(main.locator('a[href="https://crewportglobal.com/legal/verification-policy/"]').first()).toContainText('Trust');
  await expect(main.locator('a[href="https://crewportglobal.com/for-seafarers/"]').first()).toHaveText('For Seafarers');
  await expect(main.locator('a[href="https://crewportglobal.com/vacancies/"]').first()).toHaveText('View vacancies');
  await expect(page.locator('main a[href="https://crewportglobal.com/register/"]')).toHaveText('Start registration');
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
  await page.route('**/api/v1/auth/register-password', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        status: 'password_credential_registered',
        draft_id: '33333333-3333-4333-8333-333333333333',
        user: {
          user_id: '22222222-2222-4222-8222-222222222222',
          email: body.email,
        },
        email_verification: {
          email_verification_status: 'pending',
          email_delivery_status: 'captured_test_only',
        },
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
  await page.locator('#password').fill('Password123!');
  await page.locator('#confirm-password').fill('Password123!');
  await page.locator('#terms').check();
  await page.locator('#consent').check();
  await page.locator('#register-submit').click();

  await expect(page).toHaveURL(/\/register\/index\.html/);
  await expect(page.locator('#register-status')).toContainText('Account created');
  await expect(page.locator('#register-next-steps')).toBeVisible();
  await expect.poll(() => page.evaluate(() => {
    const payload = JSON.parse(window.localStorage.getItem('crewportglobal.registration.person') || '{}');
    return `${payload.registration_state}|${payload.authorization_state}|${payload.email}|${payload.person_id}|${payload.draft_id}`;
  })).toBe('password_credential_registered|not_granted|alex.person@example.com|22222222-2222-4222-8222-222222222222|33333333-3333-4333-8333-333333333333');
});

test('fallback language page remains accessible', async ({ page }) => {
  await page.goto('/language.html');
  await expect(page.locator('h1')).toContainText('Choose the display language');
});

test('create-profile holds the consolidated seafarer final consent and no onboarding route link', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('crewportglobal.language', 'ru');
  });

  await page.goto('/create-profile/index.html');

  await expect(page.locator('#current-language-label')).toHaveText('Русский');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(page.locator('.site-menu-group--seafarers')).toContainText('Создать профиль');
  await expect(page.locator('body')).toContainText('правило отсутствия платы за трудоустройство');
  await expect(page.locator('body')).toContainText('дополнительные платные услуги не являются условием доступа к работе');
  await expect(page.locator('a[href="/legal/complaints/"]')).toHaveCount(1);
  await expect(page.locator('a[href="https://crewportglobal.com/onboarding/seafarer-registration/"]')).toHaveCount(0);
  await expect(page.locator('a[href="/onboarding/seafarer-registration/"]')).toHaveCount(0);
});
