import { expect, test } from '@playwright/test';

test('team translation review page loads queue and records protected decision', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('crewportglobal_team_session', 'ui-translation-review-session');
  });

  await page.route('**/api/v1/team/translations/review-queue**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        total: 1,
        count: 1,
        limit: 100,
        offset: 0,
        provider: 'google_translate_public',
        targets: ['ru'],
        status: 'review_required',
        queue: [
          {
            translation_key: 'legal.noFees.summary',
            source_language: 'en',
            target_language: 'ru',
            provider: 'google_translate_public',
            provider_version: 'google-public-web',
            translation_status: 'draft_machine',
            human_review_required: true,
            source_text: 'CrewPortGlobal does not charge seafarers recruitment or placement fees.',
            translated_text: 'CrewPortGlobal не взимает с моряков сборы за подбор или трудоустройство.',
            source_text_hash: 'hash',
            reviewed_by_user_id: null,
            reviewed_at: null,
            updated_at: '2026-06-02T00:00:00+00:00',
          },
        ],
      }),
    });
  });

  let decisionPayload: Record<string, unknown> | null = null;
  await page.route('**/api/v1/team/translations/review', async (route) => {
    decisionPayload = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        decision: 'approve',
        actor_user_id: 'ui-reviewer',
        entry: {
          translation_key: 'legal.noFees.summary',
          target_language: 'ru',
          provider: 'google_translate_public',
          translation_status: 'reviewed',
          human_review_required: false,
        },
      }),
    });
  });

  await page.goto('/team/translations/');

  await expect(page.getByRole('heading', { name: 'Sensitive machine translation review' })).toBeVisible();
  await expect(page.locator('#status-line')).toContainText('Queue loaded: 1 item');
  await expect(page.locator('#queue-list')).toContainText('legal.noFees.summary');
  await expect(page.locator('#queue-list')).toContainText('Official English source');
  await expect(page.locator('#queue-list')).toContainText('Machine localized draft');
  await expect(page.locator('#queue-list')).toContainText('review required');

  await page.getByRole('button', { name: 'Approve' }).click();

  expect(decisionPayload).toMatchObject({
    translation_key: 'legal.noFees.summary',
    target_language: 'ru',
    provider: 'google_translate_public',
    decision: 'approve',
  });
  await expect(page.locator('#status-line')).toContainText('Queue loaded: 1 item');
});
