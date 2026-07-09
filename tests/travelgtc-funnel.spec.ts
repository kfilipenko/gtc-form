import { expect, test } from '@playwright/test';

test.describe('TravelGTC public funnel', () => {
  test('home role form submits a test lead through the API', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const form = page.locator('form[data-travelgtc-lead-form]').first();
    await expect(form).toBeVisible();

    await form.locator('[data-role-option="trip_author"]').click();
    await form.locator('[name="name"]').fill('Тестовый Пользователь');
    await form.locator('[name="preferred_channel"]').selectOption('whatsapp');
    await form.locator('[name="contact_value"]').fill('+70000000000');
    await form.locator('[name="primary_interest"]').selectOption('create_trip');
    await form.locator('[name="travel_format"]').selectOption('retreat');
    await form.locator('[name="destination_interest"]').fill('Тестовое направление');
    await form.locator('[name="audience_type"]').selectOption('community');
    await form.locator('[name="estimated_group_size"]').fill('8');
    await form.locator('[name="business_interest_level"]').selectOption('curious_later');
    await form.locator('[name="message"]').fill('Тестовая travel-идея для проверки API и воронки.');
    await form.locator('[name="personal_data_consent"]').check();
    await form.locator('[name="communication_consent"]').check();

    await form.locator('button[type="submit"]').click();
    await expect(form.locator('[data-form-status]')).toContainText('Номер заявки:');
  });
});
