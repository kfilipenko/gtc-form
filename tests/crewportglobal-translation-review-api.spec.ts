import { expect, test } from '@playwright/test';

test('protected translation review queue API returns current cache-backed items', async ({ request }) => {
  const response = await request.get('/api/v1/team/translations/review-queue?provider=google_translate_public&targets=ru&limit=3');
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body.ok).toBe(true);
  expect(body.provider).toBe('google_translate_public');
  expect(body.targets).toEqual(['ru']);
  expect(body.status).toBe('review_required');
  expect(body.total).toBeGreaterThan(0);
  expect(body.queue.length).toBeLessThanOrEqual(3);

  for (const entry of body.queue) {
    expect(entry.target_language).toBe('ru');
    expect(entry.provider).toBe('google_translate_public');
    expect(entry.human_review_required).toBe(true);
    expect(entry.source_text).toEqual(expect.any(String));
    expect(entry.translated_text).toEqual(expect.any(String));
  }
});
