import { expect, test } from '@playwright/test';
import { execSync } from 'node:child_process';

const operatorAccessToken =
  process.env.CREWPORTGLOBAL_OPERATOR_ACCESS_TOKEN ||
  process.env.CPG_OPERATOR_ACCESS_TOKEN ||
  'crewportglobal-local-operator';

function cleanupOperatorQueueTestData(): void {
  const sql = `
WITH ui_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.queue.%@example.com'
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
  WHERE email LIKE 'ui.queue.%@example.com'
)
UPDATE crewportglobal.vacancy_requests vr
SET publication_status = 'closed', updated_at = now()
FROM ui_users uu
WHERE vr.created_by_user_id = uu.user_id
  AND vr.publication_status IN ('submitted_for_human_review', 'in_review', 'published');

WITH ui_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.queue.%@example.com'
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
  AND u.email LIKE 'ui.queue.%@example.com'
  AND sp.review_status IN ('submitted_for_human_review', 'in_review', 'approved');
`;

  execSync(
    'PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql -v ON_ERROR_STOP=1 -q',
    { input: sql, encoding: 'utf8' }
  );
}

test.afterEach(() => {
  cleanupOperatorQueueTestData();
});

test('operator queue page renders submitted drafts from API', async ({ page, request }) => {
  const unique = Date.now();
  const seafarerEmail = `ui.queue.seafarer.${unique}@example.com`;

  const createResponse = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'seafarer',
      email: seafarerEmail,
      full_name: 'Operator Queue Seafarer',
      rank: 'Second Officer',
      department: 'deck',
      availability_status: 'available_now',
      document_metadata: {
        certificate_status: 'ready',
        stcw_status: 'ready',
        passport_expiry: '2028-02-20',
        medical_expiry: '2027-03-15',
        visa_status: 'required',
        notes: 'Visa appointment scheduled.',
        seafarer_workspace: {
          personal_details: {
            date_of_birth: '1992-06-15',
          },
          contact_and_addresses: {
            residence_city: 'Batumi',
            emergency_contact_name: 'Nino Queue',
            emergency_contact_relation: 'Sister',
            emergency_contact_phone: '+995555000111',
          },
          qualifications: {
            coc_type: 'Second Officer',
            coc_number: 'COC-VERIFY-001',
            coc_expiry: '2029-09-30',
            training_courses: ['Basic Training', 'ECDIS'],
          },
          sea_service: {
            last_vessel_name: 'MV Verify Horizon',
            last_vessel_type: 'Container Ship',
            last_rank: 'Third Officer',
            service_to: '2026-01-20',
          },
          matching_publication: {
            candidate_summary: 'Second Officer ready for reviewed matching after document verification.',
            publish_to_matching: 'yes',
            data_processing_confirmation: 'i_confirm',
          },
        },
      },
    },
  });
  expect(createResponse.ok()).toBeTruthy();

  await page.addInitScript((token) => {
    window.sessionStorage.setItem('crewportglobal.operatorAccessToken', token);
  }, operatorAccessToken);
  await page.goto('/verify/');

  await expect(page.locator('#queue-status')).toContainText('Queue loaded');
  await expect
    .poll(async () => Number((await page.locator('[data-operator-lane-count="verifier"]').first().textContent()) || '0'))
    .toBeGreaterThanOrEqual(1);
  await page.locator('.operator-lane-button[data-operator-lane="verifier"]').click();
  await expect(page.locator('#queue-status')).toContainText('Verifier');
  await expect(page.locator('#queue-body')).toContainText(seafarerEmail);
  await expect(page.locator('#queue-body')).toContainText('seafarer_profile');

  await page.locator('#filter-type').selectOption('seafarer_profile');
  await expect(page.locator('#queue-body')).toContainText(seafarerEmail);

  await page.locator('#filter-role').selectOption('seafarer');
  const queueRow = page.locator('#queue-body tr', { hasText: seafarerEmail }).first();
  await queueRow.locator('.queue-open').click();
  await expect(page.locator('#details-sections')).toContainText('Registration');
  await expect(page.locator('#details-sections')).toContainText('Seafarer profile');
  await expect(page.locator('#details-sections')).toContainText('Document readiness');
  await expect(page.locator('#details-sections')).toContainText('Structured seafarer workspace');
  await expect(page.locator('#details-sections')).toContainText('Review readiness checklist');
  await expect(page.locator('#details-sections')).toContainText(seafarerEmail);
  await expect(page.locator('#details-sections')).toContainText('Second Officer');
  await expect(page.locator('#details-sections')).toContainText('2028-02-20');
  await expect(page.locator('#details-sections')).not.toContainText('Visa appointment scheduled.');
  await expect(page.locator('#details-sections')).toContainText('COC-VERIFY-001');
  await expect(page.locator('#details-sections')).toContainText('MV Verify Horizon');
  await expect(page.locator('#details-sections')).toContainText('QUAL-001 National identity documents / visa');
  await expect(page.locator('#details-json')).toContainText('seafarer_review_readiness');
  await expect(page.locator('#details-json')).toContainText('sensitive_fields_redacted');
  await expect(page.locator('#details-json')).toContainText(seafarerEmail);
  await expect(page.locator('#details-json')).toContainText('seafarer_profile');

  await page.locator('#review-note').fill('');
  await queueRow.locator('.queue-decision[data-decision="needs_correction"]').click();
  await expect(page.locator('#review-note-feedback')).toContainText('requires a review note');

  const note = 'Missing certificate details and availability date.';
  await page.locator('#review-target').selectOption('QUAL-003');
  await page.locator('.review-card-action[data-card-decision="start_review"]').click();
  await expect(page.locator('#review-note-feedback')).toContainText('QUAL-003 Certificate of competence -> under_review');
  await expect(page.locator('#details-sections')).toContainText('review: under_review');

  await page.locator('#review-note').fill(note);
  await queueRow.locator('.queue-decision[data-decision="needs_correction"]').click();
  await expect(page.locator('#queue-status')).toContainText('rejected');
  await expect(page.locator('#latest-review-note')).toContainText(note);
  await expect(page.locator('#latest-review-note')).toContainText('QUAL-003 Certificate of competence');
  await expect(page.locator('#review-history-list')).toContainText('needs_correction');
  await expect(page.locator('#review-history-list')).toContainText(note);
  await expect(page.locator('#review-history-list')).toContainText('Target: QUAL-003 Certificate of competence');
  await expect(page.locator('#details-sections')).toContainText('review: correction_requested');
  await page.locator('#review-card-status-filter').selectOption('correction_requested');
  await expect(page.locator('#details-sections')).toContainText('QUAL-003 Certificate of competence');
  await page.locator('#review-card-status-filter').selectOption('verified');
  await expect(page.locator('#details-sections')).not.toContainText('QUAL-003 Certificate of competence');
});

test('operator queue page renders and reviews vacancy applications', async ({ page, request }) => {
  const unique = Date.now();
  const employerEmail = `ui.queue.employer.${unique}@example.com`;
  const seafarerEmail = `ui.queue.application.seafarer.${unique}@example.com`;
  const title = `ETO ${unique}`;

  const employerCreate = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'employer',
      role_in_company: 'recruiter',
      email: employerEmail,
      full_name: 'Operator Queue Employer',
      company_name: `Operator Queue Marine ${unique}`,
      country_code: 'SG',
      registration_number: `SG-OQ-${unique}`,
      vessel: {
        vessel_name: `MV Operator Queue ${unique}`,
        vessel_type: 'Container',
        imo_number: `IMO${9600000 + (unique % 300000)}`,
      },
      vacancy: {
        vacancy_title: title,
        rank: title,
        department: 'engine',
        vessel_type: 'Container',
        join_date: '2026-12-20',
        contract_duration: '5 months',
        salary_min_usd: 5600,
        salary_max_usd: 6200,
        currency: 'USD',
        employer_country_code: 'SG',
        requirements: 'ETO license, container experience and valid medical certificate.',
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
      full_name: 'Operator Queue Applicant',
      rank: 'Electrical Technical Officer',
      department: 'engine',
      availability_status: 'available_now',
      document_metadata: {
        certificate_status: 'ready',
        stcw_status: 'ready',
        passport_expiry: '2029-05-10',
        medical_expiry: '2027-08-12',
        visa_status: 'not_required',
        notes: 'Documents are ready for presentation.',
      },
    },
  });
  expect(seafarerCreate.ok()).toBeTruthy();
  const seafarer = await seafarerCreate.json();

  const candidateNote = 'Available now. ETO documents are ready.';
  const applicationResponse = await request.post(`/api/v1/vacancies/${vacancyId}/applications`, {
    data: {
      seafarer_draft_id: seafarer.draft_id,
      email: seafarerEmail,
      note: candidateNote,
    },
  });
  expect(applicationResponse.ok()).toBeTruthy();
  const application = await applicationResponse.json();
  const applicationId = application.application.vacancy_application_id as string;

  await page.addInitScript((token) => {
    window.sessionStorage.setItem('crewportglobal.operatorAccessToken', token);
  }, operatorAccessToken);
  await page.goto('/verify/');

  await expect(page.locator('#queue-status')).toContainText('Queue loaded');
  await expect
    .poll(async () => Number((await page.locator('[data-operator-lane-count="reviewer"]').first().textContent()) || '0'))
    .toBeGreaterThanOrEqual(1);
  await page.locator('.operator-lane-button[data-operator-lane="reviewer"]').click();
  await expect(page.locator('#queue-status')).toContainText('Reviewer');
  await page.locator('#filter-type').selectOption('vacancy_application');
  await expect(page.locator('#queue-body')).toContainText(seafarerEmail);
  await expect(page.locator('#queue-body')).toContainText(title);

  let applicationRow = page.locator('#queue-body tr', { hasText: seafarerEmail }).first();
  await applicationRow.locator('.queue-open').click();
  await expect(page.locator('#details-sections')).toContainText('Vacancy application');
  await expect(page.locator('#details-sections')).toContainText(applicationId);
  await expect(page.locator('#details-sections')).toContainText(candidateNote);
  await expect(page.locator('#details-sections')).toContainText(title);
  await expect(page.locator('#details-sections')).toContainText('Operator Queue Applicant');
  await expect(page.locator('#details-json')).toContainText('vacancy_application');

  await applicationRow.locator('.queue-decision[data-decision="start_review"]').click();
  await expect(page.locator('#queue-status')).toContainText('in_review');
  await expect(page.locator('#details-sections')).toContainText('in_review');

  applicationRow = page.locator('#queue-body tr', { hasText: seafarerEmail }).first();
  const note = 'Candidate can be presented to employer after document check.';
  await page.locator('#review-note').fill(note);
  await applicationRow.locator('.queue-decision[data-decision="reviewed"]').click();
  await expect(page.locator('#queue-status')).toContainText('presented');
  await expect(page.locator('#details-sections')).toContainText('presented');
  await expect(page.locator('#latest-review-note')).toContainText(note);
  await expect(page.locator('#review-history-list')).toContainText('vacancy_application');
  await expect(page.locator('#review-history-list')).toContainText(note);
});
