import { expect, test } from '@playwright/test';

test.describe('TravelGTC Mira registered-first funnel', () => {
  test('guest receives the registration entry before a question selector is available', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/mira/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('[data-ai-entry-gate]')).toBeVisible();
    await expect(page.locator('[data-ai-question-select]')).toBeHidden();
    await page.locator('[data-ai-entry-register]').click();

    await expect(page).toHaveURL(/\/auth\/\?mode=register&next=%2Fmira%2F%3Fsource%3Dmira%23ai-consultant/);
    await expect(page.locator('[data-auth-entry-context]')).toBeVisible();
  });
});
