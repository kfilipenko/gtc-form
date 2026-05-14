import { expect, test } from '@playwright/test';
import { execSync } from 'node:child_process';

function cleanupRegisterUiTestData(): void {
  const sql = `
WITH ui_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.register.%@example.com'
)
UPDATE crewportglobal.seafarer_profiles sp
SET review_status = 'rejected', updated_at = now()
FROM ui_users uu
WHERE sp.user_id = uu.user_id
  AND sp.review_status IN ('submitted_for_human_review', 'in_review', 'approved');

WITH ui_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.register.%@example.com'
),
ui_companies AS (
  SELECT DISTINCT cu.company_id
  FROM crewportglobal.company_users cu
  JOIN ui_users uu ON uu.user_id = cu.user_id
)
UPDATE crewportglobal.employer_companies ec
SET verification_status = 'rejected', updated_at = now()
FROM ui_companies uc
WHERE ec.company_id = uc.company_id
  AND ec.verification_status IN ('unverified', 'submitted', 'verified');

WITH ui_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.register.%@example.com'
)
UPDATE crewportglobal.vacancy_requests vr
SET publication_status = 'closed', updated_at = now()
FROM ui_users uu
WHERE vr.created_by_user_id = uu.user_id
  AND vr.publication_status IN ('submitted_for_human_review', 'in_review', 'published');
`;

  execSync(
    'PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql -v ON_ERROR_STOP=1 -q',
    { input: sql, encoding: 'utf8' }
  );
}

test.afterEach(() => {
  cleanupRegisterUiTestData();
});

test('register creates seafarer draft and redirects to create-profile', async ({ page, request }) => {
  await page.goto('/register/');

  const email = `ui.register.seafarer.${Date.now()}@example.com`;
  await page.locator('#email').fill(email);
  await page.locator('#full-name').fill('Seafarer Entry');
  await page.locator('#terms').check();
  await page.locator('#consent').check();

  await page.locator('#continue-button').click();
  await expect(page).toHaveURL(/\/create-profile\/\?draft_id=/);

  const draftId = await page.evaluate(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('draft_id') || '';
  });
  expect(draftId).not.toBe('');

  const draftResponse = await request.get(`/api/v1/registration/drafts/${draftId}`);
  expect(draftResponse.ok()).toBeTruthy();
  const draftBody = await draftResponse.json();
  expect(draftBody.role).toBe('seafarer');
  expect(draftBody.email).toBe(email);
});

test('register routes employer-side roles to post-vacancy with draft_id', async ({ page, request }) => {
  const roleCases = [
    { uiRole: 'employer', apiRole: 'employer' },
    { uiRole: 'shipowner', apiRole: 'shipowner' },
    { uiRole: 'crewing-manager', apiRole: 'crewing_manager' },
  ];

  for (const roleCase of roleCases) {
    await page.goto('/register/');

    const email = `ui.register.${roleCase.uiRole}.${Date.now()}@example.com`;
    await page.locator(`[data-role="${roleCase.uiRole}"]`).click();
    await page.locator('#email').fill(email);
    await page.locator('#full-name').fill('Employer Entry');
    await page.locator('#terms').check();
    await page.locator('#consent').check();

    await page.locator('#continue-button').click();
    await expect(page).toHaveURL(/\/post-vacancy\/\?draft_id=/);

    const draftId = await page.evaluate(() => {
      const params = new URLSearchParams(window.location.search);
      return params.get('draft_id') || '';
    });
    expect(draftId).not.toBe('');

    const draftResponse = await request.get(`/api/v1/registration/drafts/${draftId}`);
    expect(draftResponse.ok()).toBeTruthy();
    const draftBody = await draftResponse.json();
    expect(draftBody.role).toBe(roleCase.apiRole);
    expect(draftBody.email).toBe(email);
  }
});
