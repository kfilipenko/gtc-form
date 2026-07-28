import { expect, test } from '@playwright/test';

test.describe('TravelGTC Mira-first funnel', () => {
  test('selected first question requires registration and returns to Mira chat', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/mira/', { waitUntil: 'domcontentloaded' });

    await page.locator('[data-ai-question-select]').selectOption({ label: 'Получить презентацию' });
    await page.locator('[data-ai-form]').locator('button[type="submit"]').click();

    await expect(page.locator('[data-ai-messages]')).toContainText(/сначала войдите или зарегистрируйтесь/i);
    await expect(page).toHaveURL(/\/auth\/\?mode=register&next=%2Fmira%2F%23ai-consultant/);
    await expect
      .poll(() => page.evaluate(() => sessionStorage.getItem('travelgtc_ai_pending_question') || ''))
      .toContain('официальные материалы');
  });
});
