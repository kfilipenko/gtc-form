import { expect, test } from '@playwright/test';

test.describe('TravelGTC authenticated funnel', () => {
  test('home request form requires registration before creating a lead', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const form = page.locator('form[data-travelgtc-lead-form]').first();
    await expect(form).toBeVisible();

    await form.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/auth\/\?mode=register/);
    await expect(page.locator('form[data-auth-register-form]')).toBeVisible();

    const uniqueEmail = `travelgtc-${Date.now()}@example.test`;
    const registerForm = page.locator('form[data-auth-register-form]');
    await registerForm.locator('[name="display_name"]').fill('Тестовый Пользователь');
    await registerForm.locator('[name="email"]').fill(uniqueEmail);
    await registerForm.locator('[name="password"]').fill('StrongPass123');
    await registerForm.locator('[name="primary_channel"]').selectOption('phone');
    await registerForm.locator('[name="phone"]').fill('+70000000000');
    await registerForm.locator('[name="account_terms_consent"]').check();
    await registerForm.locator('[name="privacy_consent"]').check();
    await registerForm.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/#lead-form/);
    await expect(form).toBeVisible();
    await expect(form.locator('[data-lead-auth-note]')).toContainText('Вы вошли как Тестовый Пользователь');

    await form.locator('[name="primary_interest"]').selectOption('create_trip');
    await form.locator('[name="message"]').fill('Хочу обсудить тестовую travel-идею и понять следующий шаг.');
    await form.locator('[name="personal_data_consent"]').check();
    await form.locator('[name="communication_consent"]').check();

    const submitButton = form.locator('button').first();
    await submitButton.click();
    await expect(form.locator('[data-form-status]')).toContainText('Номер заявки:');
    await expect(submitButton).toHaveText('Вернуться на главную');
    await submitButton.click();
    await expect(page).toHaveURL(/\/$/);
  });
});
