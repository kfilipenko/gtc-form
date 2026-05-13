import { expect, test } from '@playwright/test';

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
  await expect(page.locator('.landing-title')).toContainText('Морские кадровые процессы');
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

  await expect(page.locator('.landing-title')).toContainText('Maritime crew workflows');
  await expect(page.locator('#current-language-label')).toHaveText('English');

  await page.locator('#current-language-toggle').click();
  await page.locator('.language-option').filter({ hasText: 'Русский' }).click();

  await expect(page).toHaveURL(/\/index\.html/);
  await expect(page.locator('#current-language-label')).toHaveText('Русский');
  await expect(page.locator('.landing-title')).toContainText('Морские кадровые процессы');
  await expect(page.locator('.site-nav')).toContainText('Для судовладельцев');
  await expect(page.locator('.hero-panel')).toContainText('Профессиональный профиль и готовность документов');
  await expect(page.locator('.docs')).toContainText('Публичные документы');
  await expect(page.locator('.doc-list')).toContainText('Для судовладельцев');
  await expect(page.locator('.doc-list')).toContainText('Обработка жалоб');
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('crewportglobal.language'))).toBe('ru');

  await page.reload();

  await expect(page.locator('#current-language-label')).toHaveText('Русский');
  await expect(page.locator('.landing-title')).toContainText('Морские кадровые процессы');
  await expect(page.locator('.docs')).toContainText('Публичные документы');
});

test('same-page selector works on generated public pages and persists after reload', async ({ page }) => {
  await page.goto('/legal/complaints/index.html');

  await expect(page.locator('h1')).toContainText('Complaint Handling Procedure');
  await expect(page.locator('#current-language-label')).toHaveText('English');

  await page.locator('#current-language-toggle').click();
  await page.locator('.language-option').filter({ hasText: 'Русский' }).click();

  await expect(page.locator('#current-language-label')).toHaveText('Русский');
  await expect(page.locator('.site-nav')).toContainText('Жалобы');
  await expect(page.locator('.hero-actions')).toContainText('Назад на главную');
  await expect(page.locator('.sidebar-panel')).toContainText('Публичная библиотека');
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('crewportglobal.language'))).toBe('ru');

  await page.reload();

  await expect(page.locator('#current-language-label')).toHaveText('Русский');
  await expect(page.locator('.site-nav')).toContainText('Жалобы');
});

test('homepage falls back to English for missing non-English page translations', async ({ page }) => {
  await page.goto('/index.html');

  await page.locator('#current-language-toggle').click();
  await page.locator('.language-option').filter({ hasText: 'Português' }).click();

  await expect(page.locator('#current-language-label')).toHaveText('Português');
  await expect(page.locator('.site-nav')).toContainText('Para armadores');
  await expect(page.locator('.docs .docs-head h2')).toHaveText('Initial client-facing Markdown package');
  await expect(page.locator('.doc-list')).toContainText('Complaint Handling');
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
  await expect(page.locator('.site-nav')).toContainText('Для моряков');
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