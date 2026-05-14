import { expect, test } from '@playwright/test';
import { execSync } from 'node:child_process';

function cleanupCreateProfileUiTestData(): void {
  const sql = `
WITH ui_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.prefill.%@example.com'
     OR email LIKE 'ui.localprefill.%@example.com'
     OR email LIKE 'ui.correction.%@example.com'
     OR email LIKE 'ui.apphistory.%@example.com'
),
ui_vacancies AS (
  SELECT vacancy_request_id
  FROM crewportglobal.vacancy_requests vr
  JOIN ui_users uu ON uu.user_id = vr.created_by_user_id
)
DELETE FROM crewportglobal.vacancy_applications va
WHERE va.seafarer_user_id IN (SELECT user_id FROM ui_users)
   OR va.vacancy_request_id IN (SELECT vacancy_request_id FROM ui_vacancies);

WITH ui_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.prefill.%@example.com'
     OR email LIKE 'ui.localprefill.%@example.com'
     OR email LIKE 'ui.correction.%@example.com'
     OR email LIKE 'ui.apphistory.%@example.com'
)
UPDATE crewportglobal.seafarer_profiles sp
SET review_status = 'rejected', updated_at = now()
FROM ui_users uu
WHERE sp.user_id = uu.user_id
  AND sp.review_status IN ('submitted_for_human_review', 'in_review', 'approved');

WITH ui_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.apphistory.%@example.com'
)
UPDATE crewportglobal.vacancy_requests vr
SET publication_status = 'closed', updated_at = now()
FROM ui_users uu
WHERE vr.created_by_user_id = uu.user_id
  AND vr.publication_status IN ('submitted_for_human_review', 'in_review', 'published');

WITH ui_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.apphistory.%@example.com'
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
  cleanupCreateProfileUiTestData();
});

test('create profile prefill from draft_id preserves patch flow', async ({ page }) => {
  await page.goto('/create-profile/');
  await page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem('crewportglobal.language', 'en');
  });

  await page.goto('/create-profile/');

  await page.locator('#create-full-name').fill('Alex Marinov');
  await page.locator('#create-email').fill(`ui.prefill.${Date.now()}@example.com`);
  await page.locator('#create-country').fill('AE');
  await page.locator('#create-rank').fill('Second Officer');
  await page.locator('#create-department').selectOption('deck');
  await page.locator('#create-nationality').fill('PH');
  await page.locator('#create-residence').fill('AE');
  await page.locator('#create-availability').selectOption('available_later');
  await page.locator('#create-availability-date').fill('2026-08-15');
  await page.locator('#create-phone').fill('+971501112233');
  await page.locator('#create-salary').fill('4600');
  await page.locator('#create-vessel-types').fill('Bulk Carrier, Container');
  await page.locator('#create-certificate-status').selectOption('ready');
  await page.locator('#create-stcw-status').selectOption('collecting');
  await page.locator('#create-passport-expiry').fill('2028-08-15');
  await page.locator('#create-medical-expiry').fill('2026-12-20');
  await page.locator('#create-visa-status').selectOption('required');
  await page.locator('#create-document-notes').fill('Schengen visa appointment booked.');

  await page.locator('#create-submit').click();

  await expect(page.locator('#create-status')).toContainText('saved');
  await expect(page).toHaveURL(/draft_id=/);

  const draftId = await page.evaluate(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('draft_id') || '';
  });
  expect(draftId).not.toBe('');

  await page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem('crewportglobal.language', 'en');
  });

  await page.goto(`/create-profile/?draft_id=${draftId}`);
  await expect(page.locator('#create-status')).toContainText('prefilled');

  await expect(page.locator('#create-full-name')).toHaveValue('Alex Marinov');
  await expect(page.locator('#create-email')).toHaveValue(new RegExp('^ui\\.prefill\\..+@example\\.com$'));
  await expect(page.locator('#create-country')).toHaveValue('AE');
  await expect(page.locator('#create-rank')).toHaveValue('Second Officer');
  await expect(page.locator('#create-department')).toHaveValue('deck');
  await expect(page.locator('#create-nationality')).toHaveValue('PH');
  await expect(page.locator('#create-residence')).toHaveValue('AE');
  await expect(page.locator('#create-availability')).toHaveValue('available_later');
  await expect(page.locator('#create-availability-date')).toHaveValue('2026-08-15');
  await expect(page.locator('#create-phone')).toHaveValue('+971501112233');
  await expect(page.locator('#create-salary')).toHaveValue('4600.00');
  await expect(page.locator('#create-vessel-types')).toHaveValue('Bulk Carrier, Container');
  await expect(page.locator('#create-certificate-status')).toHaveValue('ready');
  await expect(page.locator('#create-stcw-status')).toHaveValue('collecting');
  await expect(page.locator('#create-passport-expiry')).toHaveValue('2028-08-15');
  await expect(page.locator('#create-medical-expiry')).toHaveValue('2026-12-20');
  await expect(page.locator('#create-visa-status')).toHaveValue('required');
  await expect(page.locator('#create-document-notes')).toHaveValue('Schengen visa appointment booked.');

  await page.locator('#create-rank').fill('Chief Officer');
  await page.locator('#create-submit').click();
  await expect(page.locator('#create-status')).toContainText('saved');

  await page.reload();
  await expect(page.locator('#create-rank')).toHaveValue('Chief Officer');
});

test('create profile prefill falls back to local draft when draft_id is missing', async ({ page }) => {
  await page.goto('/create-profile/');
  await page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem('crewportglobal.language', 'en');
  });

  const email = `ui.localprefill.${Date.now()}@example.com`;

  await page.goto('/create-profile/');
  await page.locator('#create-full-name').fill('Nikolai Sidorov');
  await page.locator('#create-email').fill(email);
  await page.locator('#create-country').fill('AE');
  await page.locator('#create-rank').fill('Electrical Officer');
  await page.locator('#create-department').selectOption('engine');
  await page.locator('#create-nationality').fill('IN');
  await page.locator('#create-residence').fill('AE');
  await page.locator('#create-availability').selectOption('available_now');
  await page.locator('#create-availability-date').fill('2026-09-01');
  await page.locator('#create-phone').fill('+971500009999');
  await page.locator('#create-salary').fill('5000');
  await page.locator('#create-vessel-types').fill('LNG, Tanker');
  await page.locator('#create-certificate-status').selectOption('ready');
  await page.locator('#create-stcw-status').selectOption('ready');
  await page.locator('#create-passport-expiry').fill('2029-01-10');
  await page.locator('#create-medical-expiry').fill('2027-02-05');
  await page.locator('#create-visa-status').selectOption('not_required');
  await page.locator('#create-document-notes').fill('All metadata ready for review.');

  await page.locator('#create-submit').click();
  await expect(page.locator('#create-status')).toContainText('saved');

  await page.goto('/create-profile/');

  await expect(page.locator('#create-full-name')).toHaveValue('Nikolai Sidorov');
  await expect(page.locator('#create-email')).toHaveValue(email);
  await expect(page.locator('#create-country')).toHaveValue('AE');
  await expect(page.locator('#create-rank')).toHaveValue('Electrical Officer');
  await expect(page.locator('#create-department')).toHaveValue('engine');
  await expect(page.locator('#create-nationality')).toHaveValue('IN');
  await expect(page.locator('#create-residence')).toHaveValue('AE');
  await expect(page.locator('#create-availability')).toHaveValue('available_now');
  await expect(page.locator('#create-availability-date')).toHaveValue('2026-09-01');
  await expect(page.locator('#create-phone')).toHaveValue('+971500009999');
  await expect(page.locator('#create-salary')).toHaveValue('5000.00');
  await expect(page.locator('#create-vessel-types')).toHaveValue('LNG, Tanker');
  await expect(page.locator('#create-certificate-status')).toHaveValue('ready');
  await expect(page.locator('#create-stcw-status')).toHaveValue('ready');
  await expect(page.locator('#create-passport-expiry')).toHaveValue('2029-01-10');
  await expect(page.locator('#create-medical-expiry')).toHaveValue('2027-02-05');
  await expect(page.locator('#create-visa-status')).toHaveValue('not_required');
  await expect(page.locator('#create-document-notes')).toHaveValue('All metadata ready for review.');
});

test('create profile shows needs correction status and latest correction note for existing draft', async ({ page, request }) => {
  const unique = Date.now();
  const email = `ui.correction.${unique}@example.com`;

  const createResponse = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'seafarer',
      email,
      full_name: 'Ivan Petrov',
      rank: 'Third Officer',
      department: 'deck',
      availability_status: 'available_later',
      availability_date: '2026-11-20',
      contact_phone: '+971500001111',
    },
  });
  expect(createResponse.ok()).toBeTruthy();
  const created = (await createResponse.json()) as { draft_id: string };

  const note = 'Missing certificate details and availability date.';
  const correctionResponse = await request.patch(`/api/v1/operator/review-queue/${created.draft_id}/status`, {
    data: {
      decision: 'needs_correction',
      note,
    },
  });
  expect(correctionResponse.ok()).toBeTruthy();

  await page.goto(`/create-profile/?draft_id=${created.draft_id}`);

  await expect(page.locator('#create-review-status')).toContainText('Needs correction');
  await expect(page.locator('#create-correction-note')).toContainText(note);

  await expect(page.locator('#create-full-name')).toHaveValue('Ivan Petrov');
  await expect(page.locator('#create-email')).toHaveValue(email);
  await expect(page.locator('#create-rank')).toHaveValue('Third Officer');
  await expect(page.locator('#create-department')).toHaveValue('deck');
});

test('create profile shows vacancy application history for existing draft', async ({ page, request }) => {
  const unique = Date.now();
  const title = `ETO Application History ${unique}`;
  const employerEmail = `ui.apphistory.employer.${unique}@example.com`;
  const seafarerEmail = `ui.apphistory.seafarer.${unique}@example.com`;
  const note = 'Available after current contract, documents ready.';

  const employerCreate = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'employer',
      role_in_company: 'recruiter',
      email: employerEmail,
      full_name: 'Application History Employer',
      company_name: `History Marine ${unique}`,
      country_code: 'SG',
      registration_number: `SG-HISTORY-${unique}`,
      vessel: {
        vessel_name: `MV History ${unique}`,
        vessel_type: 'Container Ship',
        imo_number: `IMO${9600000 + (unique % 300000)}`,
      },
      vacancy: {
        vacancy_title: title,
        rank: 'Electrical Technical Officer',
        department: 'engine',
        vessel_type: 'Container Ship',
        join_date: '2026-10-20',
        contract_duration: '5 months',
        salary_min_usd: 6400,
        salary_max_usd: 7200,
        currency: 'USD',
        employer_country_code: 'SG',
        requirements: 'ETO with container vessel experience and valid STCW documents.',
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
      full_name: 'Application History Seafarer',
      rank: 'Electrical Technical Officer',
      department: 'engine',
      availability_status: 'available_later',
      availability_date: '2026-09-30',
      contact_phone: '+971500004444',
    },
  });
  expect(seafarerCreate.ok()).toBeTruthy();
  const seafarer = await seafarerCreate.json();

  const applicationResponse = await request.post(`/api/v1/vacancies/${vacancyId}/applications`, {
    data: {
      seafarer_draft_id: seafarer.draft_id,
      email: seafarerEmail,
      note,
    },
  });
  expect(applicationResponse.ok()).toBeTruthy();
  const application = await applicationResponse.json();
  const applicationId = application.application.vacancy_application_id as string;

  const startReview = await request.patch(`/api/v1/operator/review-queue/${applicationId}/status`, {
    data: {
      decision: 'start_review',
      queue_type: 'vacancy_application',
      note: 'Application is being checked.',
    },
  });
  expect(startReview.ok()).toBeTruthy();

  await page.goto(`/create-profile/?draft_id=${seafarer.draft_id}`);
  await expect(page.locator('#create-applications-status')).toContainText('1 vacancy application');
  await expect(page.locator('#create-application-list')).toContainText(title);
  await expect(page.locator('#create-application-list')).toContainText(`History Marine ${unique}`);
  await expect(page.locator('#create-application-list')).toContainText('Electrical Technical Officer');
  await expect(page.locator('#create-application-list')).toContainText('Under review');
  await expect(page.locator('#create-application-list')).toContainText(note);
  await expect(page.locator('#create-application-list')).toContainText('Open vacancy');

  const reviewed = await request.patch(`/api/v1/operator/review-queue/${applicationId}/status`, {
    data: {
      decision: 'reviewed',
      queue_type: 'vacancy_application',
      note: 'Candidate presented to employer.',
    },
  });
  expect(reviewed.ok()).toBeTruthy();

  await page.reload();
  await expect(page.locator('#create-application-list')).toContainText('Presented to employer');

  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(hasOverflow).toBe(false);
});
