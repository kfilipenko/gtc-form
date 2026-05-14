import { expect, test } from '@playwright/test';
import { execSync } from 'node:child_process';

function cleanupPostVacancyWorkspaceTestData(): void {
  const sql = `
WITH ui_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.postvacancy.%@example.com'
)
UPDATE crewportglobal.vacancy_requests vr
SET publication_status = 'closed', updated_at = now()
FROM ui_users uu
WHERE vr.created_by_user_id = uu.user_id
  AND vr.publication_status IN ('submitted_for_human_review', 'in_review', 'published');

WITH ui_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.postvacancy.%@example.com'
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
`;

  execSync(
    'PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql -v ON_ERROR_STOP=1 -q',
    { input: sql, encoding: 'utf8' }
  );
}

test.afterEach(() => {
  cleanupPostVacancyWorkspaceTestData();
});

test('post vacancy workspace saves, reloads and displays review publication status', async ({ page, request }) => {
  const unique = Date.now();
  const email = `ui.postvacancy.${unique}@example.com`;
  const company = `Post Vacancy Marine ${unique}`;
  const firstTitle = `Chief Officer ${unique}`;
  const updatedTitle = `Master ${unique}`;

  await page.goto('/post-vacancy/');
  await page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem('crewportglobal.language', 'en');
  });
  await page.goto('/post-vacancy/');

  await page.locator('#post-email').fill(email);
  await page.locator('#post-full-name').fill('Post Vacancy Manager');
  await page.locator('#post-role').selectOption('shipowner');
  await page.locator('#post-role-in-company').selectOption('owner');
  await page.locator('#post-company').fill(company);
  await page.locator('#post-country').fill('AE');
  await page.locator('#post-registration-number').fill(`AE-PV-${unique}`);
  await page.locator('#post-vessel-name').fill(`MV Workspace ${unique}`);
  await page.locator('#post-vessel-type').fill('Bulk Carrier');
  await page.locator('#post-imo').fill(`IMO${9400000 + (unique % 500000)}`);
  await page.locator('#post-vacancy-title').fill(firstTitle);
  await page.locator('#post-department').selectOption('deck');
  await page.locator('#post-join-date').fill('2026-10-15');
  await page.locator('#post-duration').fill('4 months +/- 1');
  await page.locator('#post-salary-min').fill('7000');
  await page.locator('#post-salary-max').fill('7600');
  await page.locator('#post-requirements').fill('COC, bulk carrier command experience and valid medical certificate.');

  await page.locator('#post-submit').click();

  await expect(page.locator('#post-status')).toContainText('saved successfully');
  await expect(page.locator('#post-company-status')).toHaveText('unverified');
  await expect(page.locator('#post-vacancy-status')).toHaveText('submitted_for_human_review');
  await expect(page.locator('#post-publication-status')).toHaveText('Not public');
  await expect(page.locator('#post-next-action')).toContainText('waiting for operator review');
  await expect(page).toHaveURL(/draft_id=/);

  const draftId = await page.evaluate(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('draft_id') || '';
  });
  expect(draftId).not.toBe('');

  await page.goto(`/post-vacancy/?draft_id=${draftId}`);
  await expect(page.locator('#post-status')).toContainText('loaded');
  await expect(page.locator('#post-email')).toHaveValue(email);
  await expect(page.locator('#post-role')).toHaveValue('shipowner');
  await expect(page.locator('#post-role-in-company')).toHaveValue('owner');
  await expect(page.locator('#post-company')).toHaveValue(company);
  await expect(page.locator('#post-vacancy-title')).toHaveValue(firstTitle);
  await expect(page.locator('#post-salary-min')).toHaveValue(/^7000(\.00)?$/);
  await expect(page.locator('#post-salary-max')).toHaveValue(/^7600(\.00)?$/);

  await page.locator('#post-vacancy-title').fill(updatedTitle);
  await page.locator('#post-submit').click();
  await expect(page.locator('#post-status')).toContainText('saved successfully');

  const companyDecision = await request.patch(`/api/v1/operator/review-queue/${draftId}/status`, {
    data: {
      decision: 'reviewed',
      queue_type: 'company_verification',
    },
  });
  expect(companyDecision.ok()).toBeTruthy();

  const vacancyDecision = await request.patch(`/api/v1/operator/review-queue/${draftId}/status`, {
    data: {
      decision: 'reviewed',
      queue_type: 'vacancy_request',
    },
  });
  expect(vacancyDecision.ok()).toBeTruthy();

  await page.goto(`/post-vacancy/?draft_id=${draftId}`);
  await expect(page.locator('#post-vacancy-title')).toHaveValue(updatedTitle);
  await expect(page.locator('#post-company-status')).toHaveText('verified');
  await expect(page.locator('#post-vacancy-status')).toHaveText('published');
  await expect(page.locator('#post-publication-status')).toHaveText('Published');
  await expect(page.locator('#post-next-action')).toContainText('visible on the public board');

  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(hasOverflow).toBe(false);
});
