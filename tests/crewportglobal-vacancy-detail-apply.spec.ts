import { expect, test } from '@playwright/test';
import { execSync } from 'node:child_process';

function cleanupVacancyDetailApplyTestData(): void {
  const sql = `
WITH ui_employer_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.apply.employer.%@example.com'
),
ui_seafarer_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.apply.seafarer.%@example.com'
),
ui_vacancies AS (
  SELECT vacancy_request_id
  FROM crewportglobal.vacancy_requests vr
  JOIN ui_employer_users uu ON uu.user_id = vr.created_by_user_id
)
DELETE FROM crewportglobal.vacancy_applications va
USING ui_seafarer_users su
WHERE va.seafarer_user_id = su.user_id
   OR va.vacancy_request_id IN (SELECT vacancy_request_id FROM ui_vacancies);

WITH ui_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.apply.employer.%@example.com'
)
UPDATE crewportglobal.vacancy_requests vr
SET publication_status = 'closed', updated_at = now()
FROM ui_users uu
WHERE vr.created_by_user_id = uu.user_id
  AND vr.publication_status IN ('submitted_for_human_review', 'in_review', 'published');

WITH ui_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.apply.employer.%@example.com'
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

UPDATE crewportglobal.seafarer_profiles sp
SET review_status = 'rejected', updated_at = now()
FROM crewportglobal.users u
WHERE sp.user_id = u.user_id
  AND u.email LIKE 'ui.apply.seafarer.%@example.com'
  AND sp.review_status IN ('submitted_for_human_review', 'in_review', 'approved');
`;

  execSync(
    'PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql -v ON_ERROR_STOP=1 -q',
    { input: sql, encoding: 'utf8' }
  );
}

test.afterEach(() => {
  cleanupVacancyDetailApplyTestData();
});

test('seafarer opens reviewed vacancy detail and submits application', async ({ page, request }) => {
  const unique = Date.now();
  const title = `Chief Engineer ${unique}`;
  const employerEmail = `ui.apply.employer.${unique}@example.com`;
  const seafarerEmail = `ui.apply.seafarer.${unique}@example.com`;
  const imo = `IMO${9500000 + (unique % 400000)}`;

  const employerCreate = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'employer',
      role_in_company: 'recruiter',
      email: employerEmail,
      full_name: 'Vacancy Detail Employer',
      company_name: `Detail Apply Marine ${unique}`,
      country_code: 'CY',
      registration_number: `CY-APPLY-${unique}`,
      vessel: {
        vessel_name: `MV Detail Star ${unique}`,
        vessel_type: 'Chemical Tanker',
        imo_number: imo,
      },
      vacancy: {
        vacancy_title: title,
        rank: title,
        department: 'engine',
        vessel_type: 'Chemical Tanker',
        join_date: '2026-12-10',
        contract_duration: '4 months',
        salary_min_usd: 8200,
        salary_max_usd: 9000,
        currency: 'USD',
        employer_country_code: 'CY',
        requirements: 'Chief engineer license, tanker endorsement and valid medical certificate.',
      },
    },
  });
  expect(employerCreate.ok()).toBeTruthy();
  const employer = await employerCreate.json();
  const vacancyId = employer.payload.vacancy_request.vacancy_request_id as string;

  const companyDecision = await request.patch(`/api/v1/operator/review-queue/${employer.draft_id}/status`, {
    data: {
      decision: 'reviewed',
      queue_type: 'company_verification',
    },
  });
  expect(companyDecision.ok()).toBeTruthy();

  const vacancyDecision = await request.patch(`/api/v1/operator/review-queue/${employer.draft_id}/status`, {
    data: {
      decision: 'reviewed',
      queue_type: 'vacancy_request',
    },
  });
  expect(vacancyDecision.ok()).toBeTruthy();

  const seafarerCreate = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'seafarer',
      email: seafarerEmail,
      full_name: 'Vacancy Detail Seafarer',
      rank: 'Chief Engineer',
      department: 'engine',
      availability_status: 'available_now',
      country_code: 'PH',
      contact_phone: '+971500002222',
    },
  });
  expect(seafarerCreate.ok()).toBeTruthy();
  const seafarer = await seafarerCreate.json();

  const detailResponse = await request.get(`/api/v1/vacancies/${vacancyId}`);
  expect(detailResponse.ok()).toBeTruthy();
  const detail = await detailResponse.json();
  expect(detail.vacancy.vacancy_title).toBe(title);

  await page.addInitScript(({ draftId, email }) => {
    window.localStorage.setItem('crewportglobal.language', 'en');
    window.localStorage.setItem('crewportglobal.registration.draft_id', draftId);
    window.localStorage.setItem('crewportglobal.registration.role', 'seafarer');
    window.localStorage.setItem('crewportglobal.registration.email', email);
  }, { draftId: seafarer.draft_id, email: seafarerEmail });

  await page.goto('/vacancies/');
  const card = page.locator('#vacancy-live-list .live-vacancy-item', { hasText: title });
  await expect(card).toBeVisible();
  await card.getByRole('link', { name: 'View Details' }).click();

  await expect(page).toHaveURL(new RegExp(`/vacancies/detail/\\?vacancy_id=${vacancyId}`));
  await expect(page.locator('#detail-title')).toHaveText(title);
  await expect(page.locator('#detail-company')).toContainText(`Detail Apply Marine ${unique}`);
  await expect(page.locator('#detail-vessel')).toContainText(`MV Detail Star ${unique}`);
  await expect(page.locator('#detail-salary')).toContainText('USD 8200.00 - 9000.00');
  await expect(page.locator('#apply-draft-id')).toHaveValue(seafarer.draft_id);
  await expect(page.locator('#apply-email')).toHaveValue(seafarerEmail);
  await expect(page.locator('#apply-status')).toContainText('Profile data found');

  await page.locator('#apply-note').fill('Available now. Tanker documents are ready for operator review.');
  await page.locator('#apply-submit').click();
  await expect(page.locator('#apply-status')).toContainText('Application submitted for human review');

  const duplicateApplication = await request.post(`/api/v1/vacancies/${vacancyId}/applications`, {
    data: {
      seafarer_draft_id: seafarer.draft_id,
      email: seafarerEmail,
      note: 'Updated availability note.',
    },
  });
  expect(duplicateApplication.status()).toBe(201);
  const duplicateBody = await duplicateApplication.json();
  expect(duplicateBody.application.application_status).toBe('submitted_for_human_review');

  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(hasOverflow).toBe(false);
});
