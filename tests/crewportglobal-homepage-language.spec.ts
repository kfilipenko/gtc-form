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
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('crewportglobal.language'))).toBe('ru');

  await page.reload();

  await expect(page.locator('#current-language-label')).toHaveText('Русский');
  await expect(page.locator('.landing-title')).toContainText('Морские кадровые процессы');
});

test('fallback language page remains accessible', async ({ page }) => {
  await page.goto('/projects/crewportglobal/public/language.html');
  await expect(page.locator('h1')).toContainText('Choose the display language');
});