import { test, expect } from '@playwright/test';
import { mkdirSync } from 'fs';
import path from 'path';

const artifactsDir = path.resolve(__dirname, '..', 'artifacts');
mkdirSync(artifactsDir, { recursive: true });
const screenshotPath = path.join(artifactsDir, 'chat-sidebar.png');

const mockUser = {
  gtc_user_id: '123456',
  email: 'demo@gtstor.com',
  id: 'user-demo-uuid',
  jwt: 'mock-jwt-token',
  full_name: 'Demo User'
};

test.describe('Chat auth UI', () => {
  test('switches panels after login and captures sidebar screenshot', async ({ page }) => {
    await page.goto('/chat', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle' });

    const authSection = page.locator('#authSection');
    const userSection = page.locator('#userSection');
    const quickAuthSection = page.locator('#quickAuthSection');

  await expect(authSection, 'Auth form should be visible before login').toBeVisible();
  await expect(userSection, 'User card hidden before login').toHaveAttribute('hidden', '');
  await expect(quickAuthSection, 'Quick auth shortcuts visible before login').not.toHaveAttribute('hidden', '');

    await page.evaluate((user) => {
      localStorage.setItem('chat:user', JSON.stringify(user));
      localStorage.setItem('gtc_user_id', user.gtc_user_id);
    }, mockUser);

  await page.reload({ waitUntil: 'networkidle' });

  await expect(page.locator('#userIdDisplay')).toContainText(mockUser.gtc_user_id);
  await expect(authSection, 'Auth form hidden after login').toHaveAttribute('hidden', '');
  await expect(userSection, 'User card visible after login').not.toHaveAttribute('hidden', '');
  await expect(quickAuthSection, 'Quick auth shortcuts hidden after login').toHaveAttribute('hidden', '');
    await expect(page.locator('#stageLabel')).toContainText('Готов к диалогу');

    const sidebar = page.locator('aside');
    await sidebar.scrollIntoViewIfNeeded();
    await sidebar.screenshot({ path: screenshotPath });
    test.info().attach('chat-sidebar', { path: screenshotPath, contentType: 'image/png' });

    await page.evaluate(() => {
      localStorage.removeItem('chat:user');
      localStorage.removeItem('gtc_user_id');
    });
    await page.reload({ waitUntil: 'networkidle' });
    await expect(userSection, 'User card hides again after clearing session').toHaveAttribute('hidden', '');
    await expect(authSection, 'Auth form returns after clearing session').not.toHaveAttribute('hidden', '');
    await expect(quickAuthSection, 'Quick auth becomes visible again').not.toHaveAttribute('hidden', '');
  });
});
