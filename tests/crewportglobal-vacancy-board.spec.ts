import { expect, test } from '@playwright/test';
import { execSync } from 'node:child_process';

function cleanupVacancyBoardTestData(): void {
  const sql = `
WITH ui_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.vacancy.%@example.com'
)
UPDATE crewportglobal.vacancy_requests vr
SET publication_status = 'closed', updated_at = now()
FROM ui_users uu
WHERE vr.created_by_user_id = uu.user_id
  AND vr.publication_status IN ('submitted_for_human_review', 'in_review', 'published');

WITH ui_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.vacancy.%@example.com'
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
  cleanupVacancyBoardTestData();
});

test('vacancy board renders reviewed public vacancies from API', async ({ page, request }) => {
  const unique = Date.now();
  const title = `Chief Officer ${unique}`;
  const imo = `IMO${9200000 + (unique % 700000)}`;

  const createResponse = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'employer',
      role_in_company: 'recruiter',
      email: `ui.vacancy.${unique}@example.com`,
      full_name: 'Vacancy Board Employer',
      company_name: `Vacancy Board Marine ${unique}`,
      country_code: 'AE',
      registration_number: `AE-UI-${unique}`,
      vessel: {
        vessel_name: `MV Board Star ${unique}`,
        vessel_type: 'Bulk Carrier',
        imo_number: imo,
      },
      vacancy: {
        vacancy_title: title,
        rank: title,
        department: 'deck',
        vessel_type: 'Bulk Carrier',
        join_date: '2026-08-20',
        contract_duration: '4 months +/- 1',
        salary_min_usd: 6500,
        salary_max_usd: 7200,
        currency: 'USD',
        employer_country_code: 'AE',
        requirements: 'COC, valid medical certificate and bulk carrier experience.',
      },
    },
  });
  expect(createResponse.ok()).toBeTruthy();
  const created = await createResponse.json();

  const companyDecision = await request.patch(`/api/v1/operator/review-queue/${created.draft_id}/status`, {
    data: {
      decision: 'reviewed',
      queue_type: 'company_verification',
    },
  });
  expect(companyDecision.ok()).toBeTruthy();

  const vacancyDecision = await request.patch(`/api/v1/operator/review-queue/${created.draft_id}/status`, {
    data: {
      decision: 'reviewed',
      queue_type: 'vacancy_request',
    },
  });
  expect(vacancyDecision.ok()).toBeTruthy();

  await page.goto('/vacancies/');

  await expect(page.locator('#vacancy-live-state')).toBeVisible();
  await expect(page.locator('#vacancy-live-list')).toContainText(title);
  await expect(page.locator('#vacancy-live-list')).toContainText('Bulk Carrier');
  await expect(page.locator('#vacancy-live-list')).toContainText('USD 6500.00 - 7200.00');
  await expect(page.locator('#vacancy-registered-state')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('Registered crew requests');
  await expect(page.locator('#vacancy-live-state')).not.toContainText(`ui.vacancy.${unique}@example.com`);
  await expect(page.locator('main input')).toHaveCount(0);
  await expect(page.locator('main select')).toHaveCount(0);
  await expect(page.locator('#vacancy-live-list a')).toHaveCount(0);
  await expect(page.locator('main a[href="https://crewportglobal.com/register/"]')).toHaveCount(0);
});
