import { expect, test } from '@playwright/test';

test('same-page selector translates the homepage and persists after reload', async ({ page }) => {
  await page.goto('/projects/crewportglobal/public/index.html');

  await expect(page.locator('.landing-title')).toContainText('Maritime crew workflows');
  await expect(page.locator('#current-language-label')).toHaveText('English');

  await page.locator('#current-language-toggle').click();
  await page.locator('.language-option').filter({ hasText: 'Русский' }).click();

  await expect(page).toHaveURL(/projects\/crewportglobal\/public\/index\.html/);
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
  await page.goto('/projects/crewportglobal/public/legal/complaints/index.html');

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
  await page.goto('/projects/crewportglobal/public/index.html');

  await page.locator('#current-language-toggle').click();
  await page.locator('.language-option').filter({ hasText: 'Português' }).click();

  await expect(page.locator('#current-language-label')).toHaveText('Português');
  await expect(page.locator('.site-nav')).toContainText('Para armadores');
  await expect(page.locator('.docs .docs-head h2')).toHaveText('Initial client-facing Markdown package');
  await expect(page.locator('.doc-list')).toContainText('Complaint Handling');
});

test('fallback language page remains accessible', async ({ page }) => {
  await page.goto('/projects/crewportglobal/public/language.html');
  await expect(page.locator('h1')).toContainText('Choose the display language');
});