import { expect, request as playwrightRequest, test, type APIRequestContext, type Page } from '@playwright/test';
import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

const operatorAccessToken =
  process.env.CREWPORTGLOBAL_OPERATOR_ACCESS_TOKEN ||
  process.env.CPG_OPERATOR_ACCESS_TOKEN ||
  'crewportglobal-local-operator';

async function expectQueueTableFitsWorkbench(page: Page): Promise<void> {
  const metrics = await page.locator('.queue-table-wrap').evaluate((wrap) => ({
    pageClientWidth: document.documentElement.clientWidth,
    pageScrollWidth: document.documentElement.scrollWidth,
    wrapClientWidth: wrap.clientWidth,
    wrapScrollWidth: wrap.scrollWidth,
  }));
  expect(metrics.wrapScrollWidth).toBeLessThanOrEqual(metrics.wrapClientWidth + 2);
  expect(metrics.pageScrollWidth).toBeLessThanOrEqual(metrics.pageClientWidth + 2);
}

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
DELETE FROM crewportglobal.operator_shortlist_drafts osd
WHERE osd.vacancy_request_id IN (SELECT vacancy_request_id FROM ui_vacancies);

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

DO $$
BEGIN
  IF to_regclass('crewportglobal.admin_sessions') IS NOT NULL THEN
    DELETE FROM crewportglobal.admin_sessions s
    WHERE s.user_id IN (
      SELECT user_id
      FROM crewportglobal.users
      WHERE email LIKE 'ui.queue.%@example.com'
    );
  END IF;

  IF to_regclass('crewportglobal.access_group_members') IS NOT NULL THEN
    DELETE FROM crewportglobal.access_group_members gm
    WHERE gm.user_id IN (
      SELECT user_id
      FROM crewportglobal.users
      WHERE email LIKE 'ui.queue.%@example.com'
    );
  END IF;
END $$;

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

function runPsql(sql: string): string {
  return execSync(
    'PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql -v ON_ERROR_STOP=1 -qAt',
    { input: sql, encoding: 'utf8' }
  ).trim();
}

function accessControlTablesReady(): boolean {
  return runPsql(`
SELECT CASE
  WHEN to_regclass('crewportglobal.access_groups') IS NOT NULL
   AND to_regclass('crewportglobal.access_group_members') IS NOT NULL
   AND to_regclass('crewportglobal.admin_sessions') IS NOT NULL
  THEN '1'
  ELSE '0'
END;
`) === '1';
}

function readVacancyRequestIdForUser(userId: string): string {
  const safeUserId = userId.replace(/'/g, "''");
  return runPsql(`
SELECT vacancy_request_id::text
FROM crewportglobal.vacancy_requests
WHERE created_by_user_id = '${safeUserId}'::uuid
ORDER BY created_at DESC
LIMIT 1;
`);
}

function createReviewTeamAdminSession(userId: string): string | null {
  if (!accessControlTablesReady()) {
    return null;
  }

  const safeUserId = userId.replace(/'/g, "''");
  const sessionId = randomUUID();
  runPsql(`
WITH target_group AS (
  SELECT group_id
  FROM crewportglobal.access_groups
  WHERE group_code = 'review_team'
    AND is_active = TRUE
  LIMIT 1
),
target_user AS (
  SELECT '${safeUserId}'::uuid AS user_id
)
INSERT INTO crewportglobal.access_group_members (group_id, user_id, reason)
SELECT target_group.group_id, target_user.user_id, 'playwright review team session test'
FROM target_group, target_user
WHERE NOT EXISTS (
  SELECT 1
  FROM crewportglobal.access_group_members existing
  WHERE existing.group_id = target_group.group_id
    AND existing.user_id = target_user.user_id
    AND existing.membership_state = 'active'
);

INSERT INTO crewportglobal.admin_sessions (admin_session_id, user_id, expires_at, ip_address, user_agent)
VALUES (
  '${sessionId}'::uuid,
  '${safeUserId}'::uuid,
  now() + interval '30 minutes',
  '127.0.0.1',
  'playwright-review-team-session'
);
`);

  return sessionId;
}

function createOwnerAdminSession(userId: string): string | null {
  if (!accessControlTablesReady()) {
    return null;
  }

  const safeUserId = userId.replace(/'/g, "''");
  const sessionId = randomUUID();
  runPsql(`
WITH target_group AS (
  SELECT group_id
  FROM crewportglobal.access_groups
  WHERE group_code = 'owners'
    AND is_active = TRUE
  LIMIT 1
),
target_user AS (
  SELECT '${safeUserId}'::uuid AS user_id
)
INSERT INTO crewportglobal.access_group_members (group_id, user_id, reason)
SELECT target_group.group_id, target_user.user_id, 'playwright owner deletion confirmation test'
FROM target_group, target_user
WHERE NOT EXISTS (
  SELECT 1
  FROM crewportglobal.access_group_members existing
  WHERE existing.group_id = target_group.group_id
    AND existing.user_id = target_user.user_id
    AND existing.membership_state = 'active'
);

INSERT INTO crewportglobal.admin_sessions (admin_session_id, user_id, expires_at, ip_address, user_agent)
VALUES (
  '${sessionId}'::uuid,
  '${safeUserId}'::uuid,
  now() + interval '30 minutes',
  '127.0.0.1',
  'playwright-owner-deletion-confirmation-session'
);
`);

  return sessionId;
}

async function acceptPresentationConsents(request: APIRequestContext, draftId: string): Promise<void> {
  for (const consentType of ['matching_preparation', 'employer_sharing']) {
    const response = await request.post('/api/v1/seafarer/consents', {
      data: {
        draft_id: draftId,
        consent_type: consentType,
        accepted: true,
        text_version: 'cpg-seafarer-consent-2026-05-19-test',
        source_page: '/create-profile/',
        metadata: {
          test_control: 'CPG-SEAFARER-018',
        },
      },
    });
    expect(response.status()).toBe(201);
  }
}

function insertUiCandidateStructuredEvidence(draftId: string): void {
  const safeDraftId = draftId.replace(/'/g, "''");
  const sql = `
WITH profile AS (
  SELECT seafarer_profile_id, user_id
  FROM crewportglobal.seafarer_profiles
  WHERE user_id = '${safeDraftId}'::uuid
  LIMIT 1
),
coc_value AS (
  SELECT rv.reference_value_id
  FROM crewportglobal.reference_catalog_values rv
  JOIN crewportglobal.reference_catalogs rc ON rc.reference_catalog_id = rv.reference_catalog_id
  WHERE rc.catalog_code = 'certificate_of_competence_types'
    AND lower(rv.display_name) = lower('Chief Officer')
  LIMIT 1
)
INSERT INTO crewportglobal.seafarer_certificates (
  seafarer_profile_id,
  user_id,
  source_draft_id,
  certificate_group,
  certificate_type_value_id,
  certificate_type_label,
  certificate_number,
  expires_at,
  record_state,
  review_status,
  metadata
)
SELECT profile.seafarer_profile_id,
       profile.user_id,
       profile.user_id,
       'competency',
       coc_value.reference_value_id,
       'Chief Officer',
       'UI-STRUCTURED-COC',
       '2029-12-31'::date,
       'active',
       'verified',
       '{"test_control":"CPG-DEMAND-011"}'::jsonb
FROM profile, coc_value;

WITH profile AS (
  SELECT seafarer_profile_id, user_id
  FROM crewportglobal.seafarer_profiles
  WHERE user_id = '${safeDraftId}'::uuid
  LIMIT 1
),
training_value AS (
  SELECT rv.reference_value_id
  FROM crewportglobal.reference_catalog_values rv
  JOIN crewportglobal.reference_catalogs rc ON rc.reference_catalog_id = rv.reference_catalog_id
  WHERE rc.catalog_code = 'training_course_types'
    AND lower(rv.display_name) = lower('Basic Safety Training')
  LIMIT 1
)
INSERT INTO crewportglobal.seafarer_training_records (
  seafarer_profile_id,
  user_id,
  source_draft_id,
  training_type_value_id,
  training_type_label,
  certificate_number,
  expires_at,
  record_state,
  review_status,
  metadata
)
SELECT profile.seafarer_profile_id,
       profile.user_id,
       profile.user_id,
       training_value.reference_value_id,
       'Basic Safety Training',
       'UI-STRUCTURED-TRAINING',
       '2029-12-31'::date,
       'active',
       'verified',
       '{"test_control":"CPG-DEMAND-011"}'::jsonb
FROM profile, training_value;

WITH profile AS (
  SELECT seafarer_profile_id, user_id
  FROM crewportglobal.seafarer_profiles
  WHERE user_id = '${safeDraftId}'::uuid
  LIMIT 1
),
rank_value AS (
  SELECT rv.reference_value_id
  FROM crewportglobal.reference_catalog_values rv
  JOIN crewportglobal.reference_catalogs rc ON rc.reference_catalog_id = rv.reference_catalog_id
  WHERE rc.catalog_code = 'seafarer_positions'
    AND lower(rv.display_name) = lower('Chief Officer')
  LIMIT 1
),
vessel_type_value AS (
  SELECT rv.reference_value_id
  FROM crewportglobal.reference_catalog_values rv
  JOIN crewportglobal.reference_catalogs rc ON rc.reference_catalog_id = rv.reference_catalog_id
  WHERE rc.catalog_code = 'vessel_types'
    AND lower(rv.display_name) = lower('Bulk Carrier')
  LIMIT 1
)
INSERT INTO crewportglobal.seafarer_sea_service_records (
  seafarer_profile_id,
  user_id,
  source_draft_id,
  vessel_name,
  vessel_type_value_id,
  vessel_type_label,
  rank_value_id,
  rank_label,
  department,
  service_from,
  service_to,
  record_state,
  review_status,
  metadata
)
SELECT profile.seafarer_profile_id,
       profile.user_id,
       profile.user_id,
       'MV UI Structured Evidence',
       vessel_type_value.reference_value_id,
       'Bulk Carrier',
       rank_value.reference_value_id,
       'Chief Officer',
       'deck',
       '2024-01-01'::date,
       '2026-02-01'::date,
       'active',
       'verified',
       '{"test_control":"CPG-DEMAND-011"}'::jsonb
FROM profile, rank_value, vessel_type_value;
`;

  execSync(
    'PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql -v ON_ERROR_STOP=1 -q',
    { input: sql, encoding: 'utf8' }
  );
}

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
  await expectQueueTableFitsWorkbench(page);

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

test('owner team task opens pending vacancy deletion confirmation panel', async ({ page, request, baseURL }) => {
  const unique = Date.now();
  const employerEmail = `ui.queue.deletion.owner.${unique}@example.com`;
  const vacancyTitle = `UI Deletion Manager Review ${unique}`;

  const createResponse = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'employer',
      email: employerEmail,
      full_name: 'UI Deletion Owner Employer',
      company_name: 'UI Deletion Owner Marine LLC',
      country_code: 'AE',
      registration_number: `AE-UI-DEL-${unique}`,
      vessel: {
        vessel_name: 'MV UI Deletion Owner',
        vessel_type: 'Bulk Carrier',
        imo_number: 'IMO9401234',
      },
      vacancy: {
        vacancy_title: vacancyTitle,
        rank: 'Bosun',
        department: 'deck',
        vessel_type: 'Bulk Carrier',
        join_date: '2026-10-10',
        contract_duration: '3 months',
        requirements: 'UI deletion manager confirmation test.',
      },
    },
  });
  expect(createResponse.ok()).toBeTruthy();
  const employer = await createResponse.json();
  const vacancyRequestId = readVacancyRequestIdForUser(employer.draft_id);

  const deletionResponse = await request.patch(`/api/v1/operator/vacancy-requests/${vacancyRequestId}/deletion-request`, {
    data: {
      note: 'UI deletion request pending manager confirmation.',
    },
  });
  expect(deletionResponse.ok()).toBeTruthy();

  const ownerSession = createOwnerAdminSession(employer.draft_id);
  if (!ownerSession || !baseURL) {
    return;
  }

  await page.addInitScript((token) => {
    window.localStorage.setItem('crewportglobal_team_session', token);
  }, ownerSession);
  await page.goto('/team/');
  await expect(page.locator('#team-task-status')).toContainText('computed task');
  const deletionTask = page.locator('#team-task-list .team-task', { hasText: vacancyTitle }).first();
  await expect(deletionTask).toContainText('confirm_vacancy_deletion');
  await expect(deletionTask).toContainText('approve_access_policy_change');
  const taskLink = deletionTask.locator('.team-task__link');
  await expect(taskLink).toHaveAttribute('href', /task_operation=confirm_vacancy_deletion/);
  await expect(taskLink).toHaveAttribute('href', /record_type=vacancy_deletion_request/);
  await expect(taskLink).toHaveAttribute('href', new RegExp(`record_id=${vacancyRequestId}`));

  await taskLink.click();
  await expect(page).toHaveURL(/task_operation=confirm_vacancy_deletion/);
  const deletionPanel = page.locator('.shortlist-task-panel');
  await expect(deletionPanel).toContainText('Task action');
  await expect(deletionPanel).toContainText('Confirm deletion');
  await expect(deletionPanel).toContainText('Reject deletion');
  await deletionPanel.getByRole('button', { name: 'Reject deletion' }).click();
  await expect(deletionPanel).toContainText('Deletion decision recorded: rejected. Hidden from queue: false.');
  await expect(deletionPanel.getByRole('link', { name: 'Return to team tasks' })).toBeVisible();
  await deletionPanel.getByRole('link', { name: 'Return to team tasks' }).click();
  await expect(page.locator('#team-task-feedback')).toContainText('Operation completed: reject_vacancy_deletion');
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
  await acceptPresentationConsents(request, seafarer.draft_id);

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

  const reviewTeamSession = createReviewTeamAdminSession(employer.draft_id);
  if (reviewTeamSession) {
    await page.addInitScript((token) => {
      window.localStorage.setItem('crewportglobal_team_session', token);
    }, reviewTeamSession);
    await page.goto('/team/');
    await expect(page.locator('#team-tasks-title')).toContainText('My tasks');
    await expect(page.locator('#team-task-list')).toContainText(title);
    await expect(page.locator('#team-task-list')).toContainText('review_candidate_presentation');
    const presentationTask = page.locator('#team-task-list .team-task', { hasText: title }).first();
    await expect(presentationTask).toContainText('approve_candidate_presentation');
    await presentationTask.locator('.team-task__link').click();
    await expect(page).toHaveURL(/task_operation=review_candidate_presentation/);
    await expect(page.locator('#queue-status')).toContainText('Task target opened');
    await expectQueueTableFitsWorkbench(page);
    const presentationTaskPanel = page.locator('.shortlist-task-panel', { hasText: 'Approve candidate presentation' });
    await expect(presentationTaskPanel).toContainText('Task action');
    await expect(presentationTaskPanel).toContainText('Approve candidate presentation');
    const note = 'Candidate presentation approved from team task panel.';
    await page.locator('#review-note').fill(note);
    await presentationTaskPanel.getByRole('button', { name: 'Approve candidate presentation' }).click();
    await expect(presentationTaskPanel).toContainText('Candidate presentation approved: presented');
    await expect(presentationTaskPanel.getByRole('link', { name: 'Return to team tasks' })).toBeVisible();
    await presentationTaskPanel.getByRole('link', { name: 'Return to team tasks' }).click();
    await expect(page.locator('#team-task-feedback')).toContainText('Operation completed: review_candidate_presentation');
    await expect(page.locator('#team-task-feedback')).toContainText('next group: employer');
    await expect(page.locator('#team-task-list')).not.toContainText('review_candidate_presentation');

    const employerDraftAfterPresentation = await request.get(`/api/v1/registration/drafts/${employer.draft_id}`);
    expect(employerDraftAfterPresentation.ok()).toBeTruthy();
    const employerDraft = await employerDraftAfterPresentation.json();
    const presentedCandidates = employerDraft.payload.presented_candidates as Array<Record<string, unknown>>;
    const presentedCandidate = presentedCandidates.find((item) => item.vacancy_application_id === applicationId);
    expect(presentedCandidate).toBeTruthy();
    const serializedCandidate = JSON.stringify(presentedCandidate);
    expect(serializedCandidate).not.toContain(seafarerEmail);
    expect(serializedCandidate).not.toContain('contact_email');
    expect(serializedCandidate).not.toContain('contact_phone');
    expect(serializedCandidate).not.toContain('document_metadata');
    return;
  }

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
  await expectQueueTableFitsWorkbench(page);

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

test('operator vacancy detail runs read-only candidate search without sensitive candidate contacts', async ({ page, request, baseURL }) => {
  const unique = Date.now();
  const employerEmail = `ui.queue.search.employer.${unique}@example.com`;
  const exactEmail = `ui.queue.search.exact.${unique}@example.com`;
  const mismatchEmail = `ui.queue.search.mismatch.${unique}@example.com`;
  const vacancyTitle = `Chief Officer Search ${unique}`;

  const employerCreate = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'employer',
      role_in_company: 'recruiter',
      email: employerEmail,
      full_name: 'Operator Search Employer',
      company_name: `Operator Search Marine ${unique}`,
      country_code: 'AE',
      registration_number: `AE-OQS-${unique}`,
      vessel: {
        vessel_name: `MV Operator Search ${unique}`,
        vessel_type: 'Bulk Carrier',
        imo_number: `IMO${9400000 + (unique % 400000)}`,
      },
      vacancy: {
        vacancy_title: vacancyTitle,
        rank: 'Chief Officer',
        department: 'deck',
        vessel_type: 'Bulk Carrier',
        join_date: '2026-08-15',
        contract_duration: '4 months +/- 1',
        salary_min_usd: 6500,
        salary_max_usd: 7200,
        currency: 'USD',
        employer_country_code: 'AE',
        requirements: 'COC, bulk carrier experience and valid medical certificate.',
        required_coc_values: ['Chief Officer'],
        required_training_values: ['Basic Safety Training'],
        required_sea_service_months: [
          {
            months: 12,
            rank: 'Chief Officer',
            vessel_type: 'Bulk Carrier',
          },
        ],
      },
    },
  });
  expect(employerCreate.ok()).toBeTruthy();
  const employer = await employerCreate.json();

  const exactCreate = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'seafarer',
      email: exactEmail,
      full_name: `UI Exact Candidate ${unique}`,
      rank: 'Chief Officer',
      department: 'deck',
      availability_status: 'available_now',
      preferred_vessel_types: ['Bulk Carrier'],
      document_metadata: {
        certificate_status: 'ready',
        stcw_status: 'ready',
        passport_expiry: '2029-12-31',
        medical_expiry: '2027-12-31',
        visa_status: 'ready',
      },
    },
  });
  expect(exactCreate.ok()).toBeTruthy();
  const exact = await exactCreate.json();

  const exactApproval = await request.patch(`/api/v1/operator/review-queue/${exact.draft_id}/status`, {
    data: {
      decision: 'reviewed',
    },
  });
  expect(exactApproval.ok()).toBeTruthy();
  await acceptPresentationConsents(request, exact.draft_id);
  insertUiCandidateStructuredEvidence(exact.draft_id);

  const mismatchCreate = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'seafarer',
      email: mismatchEmail,
      full_name: `UI Mismatch Candidate ${unique}`,
      rank: 'Master',
      department: 'deck',
      availability_status: 'available_now',
      preferred_vessel_types: ['Oil/Chemical Tanker'],
      document_metadata: {
        certificate_status: 'ready',
        stcw_status: 'ready',
        passport_expiry: '2029-12-31',
        medical_expiry: '2027-12-31',
        visa_status: 'ready',
      },
    },
  });
  expect(mismatchCreate.ok()).toBeTruthy();
  const mismatch = await mismatchCreate.json();

  const mismatchApproval = await request.patch(`/api/v1/operator/review-queue/${mismatch.draft_id}/status`, {
    data: {
      decision: 'reviewed',
    },
  });
  expect(mismatchApproval.ok()).toBeTruthy();

  const reviewTeamSession = createReviewTeamAdminSession(employer.draft_id);
  const vacancyRequestId = readVacancyRequestIdForUser(employer.draft_id);
  if (reviewTeamSession && baseURL) {
    const teamRequest = await playwrightRequest.newContext({
      baseURL,
      extraHTTPHeaders: {
        Authorization: `Bearer ${reviewTeamSession}`,
      },
    });
    try {
      const teamQueueResponse = await teamRequest.get('/api/v1/operator/review-queue');
      const teamQueueBody = await teamQueueResponse.text();
      expect(teamQueueResponse.ok(), teamQueueBody).toBeTruthy();
      const teamQueue = JSON.parse(teamQueueBody);
      expect(teamQueue.access_model).toBe('team_admin_session');
      expect(teamQueue.actor_user_id).toBe(employer.draft_id);
      expect(
        teamQueue.queue.every((item: { queue_type?: string }) =>
          item.queue_type === 'vacancy_request' || item.queue_type === 'vacancy_application'
        )
      ).toBeTruthy();
      expect(JSON.stringify(teamQueue.queue)).toContain(vacancyTitle);

      const teamSearchResponse = await teamRequest.get(`/api/v1/operator/vacancies/${vacancyRequestId}/candidate-search?limit=25`);
      const teamSearchBody = await teamSearchResponse.text();
      expect(teamSearchResponse.ok(), teamSearchBody).toBeTruthy();
      const teamSearch = JSON.parse(teamSearchBody);
      const shortlistOperation = teamSearch.computed_operations.find(
        (operation: { operation_code?: string }) => operation.operation_code === 'create_internal_shortlist_draft'
      );
      expect(teamSearch.access_model).toBe('team_admin_session');
      expect(teamSearch.actor_user_id).toBe(employer.draft_id);
      expect(shortlistOperation.required_access.permission_boundary).toBe('group_permission_check');
      expect(shortlistOperation.required_access.target_group_code).toBe('review_team');
      expect(shortlistOperation.required_access.required_permission_code).toBe('view_review_queue');
      expect(shortlistOperation.required_access.actor_user_id).toBe(employer.draft_id);
      expect(shortlistOperation.required_access.allowed).toBe(true);

      await page.addInitScript((token) => {
        window.localStorage.setItem('crewportglobal_team_session', token);
      }, reviewTeamSession);
      await page.goto(`/team/matching/?vacancy_request_id=${vacancyRequestId}`);
      await expect(page.locator('#matching-status')).toContainText('Comparison loaded');
      await expect(page.locator('#demand-panel')).toContainText(vacancyTitle);
      await expect(page.locator('#summary-grid')).toContainText('Match-ready');
      await expect(page.locator('#candidate-list')).toContainText(`UI Exact Candidate ${unique}`);
      await expect(page.locator('#candidate-list')).toContainText('match_ready');
      await expect(page.locator('#candidate-list')).toContainText('matched: Rank');
      await expect(page.locator('#candidate-list')).toContainText('COC');
      await expect(page.locator('#candidate-list')).toContainText(`UI Mismatch Candidate ${unique}`);
      await expect(page.locator('#candidate-list')).toContainText('rank_mismatch');
      await expect(page.locator('#candidate-list')).toContainText('vessel_type_mismatch');
      await expect(page.locator('body')).not.toContainText(exactEmail);
      await expect(page.locator('body')).not.toContainText(mismatchEmail);
      await expect(page.locator('body')).not.toContainText('contact_email');
      await expect(page.locator('body')).not.toContainText('document_metadata');
      await expect(page.locator('#shortlist-panel')).toContainText('Controlled shortlist handoff');
      await expect(page.locator('#shortlist-panel')).toContainText(`UI Exact Candidate ${unique}`);
      await expect(page.locator('#shortlist-panel')).toContainText('blockers: none');
      await expect(page.locator('#shortlist-panel')).toContainText(`UI Mismatch Candidate ${unique}`);
      await expect(page.locator('#shortlist-panel')).toContainText('rank_mismatch');
      await page.locator('#create-shortlist').click();
      await expect(page.locator('#shortlist-result')).toContainText('Internal shortlist draft created');
      await expect(page.locator('#shortlist-result')).toContainText('Employer visible: false');
      await expect(page.locator('#shortlist-result')).toContainText(`UI Exact Candidate ${unique}: include; guard ready_for_internal_shortlist`);
      await expect(page.locator('#shortlist-result')).toContainText(`UI Mismatch Candidate ${unique}: hold; guard blocked`);
      await expect(page.locator('#open-draft-task')).toBeVisible();

      const shortlistHistoryResponse = await teamRequest.get('/api/v1/operator/shortlist-drafts?status=all&page=1&page_size=25');
      const shortlistHistoryBody = await shortlistHistoryResponse.text();
      expect(shortlistHistoryResponse.ok(), shortlistHistoryBody).toBeTruthy();
      const shortlistHistory = JSON.parse(shortlistHistoryBody);
      expect(shortlistHistory.privacy_boundary.candidate_contact_fields_excluded).toBe(true);
      expect(shortlistHistory.privacy_boundary.candidate_document_metadata_excluded).toBe(true);
      const createdDraftRow = shortlistHistory.rows.find(
        (row: { vacancy_request_id?: string }) => row.vacancy_request_id === vacancyRequestId
      );
      expect(createdDraftRow.draft_status).toBe('needs_review');
      expect(createdDraftRow.employer_visible).toBe(false);
      expect(createdDraftRow.next_operation.operation_code).toBe('approve_internal_shortlist');
      expect(createdDraftRow.next_operation.responsible_group).toBe('review_team');
      expect(JSON.stringify(createdDraftRow)).not.toContain(exactEmail);
      expect(JSON.stringify(createdDraftRow)).not.toContain('document_metadata');

      await page.goto('/team/shortlists/');
      await expect(page.locator('#shortlist-history-status')).toContainText('Showing');
      await expect(page.locator('#shortlist-history-list')).toContainText(vacancyTitle);
      await expect(page.locator('#shortlist-history-list')).toContainText('needs_review');
      await expect(page.locator('#shortlist-history-list')).toContainText('approve_internal_shortlist');
      await expect(page.locator('#shortlist-history-list')).toContainText('review_team');
      await expect(page.locator('#shortlist-history-list')).not.toContainText(exactEmail);
      await expect(page.locator('#shortlist-history-list')).not.toContainText('contact_email');
      await expect(page.locator('#shortlist-history-list')).not.toContainText('document_metadata');

      await page.goto('/team/');
      await expect(page.locator('#team-tasks-title')).toContainText('My tasks');
      await expect(page.locator('#team-task-status')).toContainText('computed task');
      await expect(page.locator('#team-task-list')).toContainText(vacancyTitle);
      const updatedTeamTask = page.locator('#team-task-list .team-task', { hasText: vacancyTitle }).first();
      await expect(updatedTeamTask.locator('.team-task__number')).toHaveText(/^#\d+$/);
      await expect(updatedTeamTask).toContainText('approve_internal_shortlist');
      await expect(updatedTeamTask).not.toContainText('create_internal_shortlist_draft');

      await updatedTeamTask.locator('.team-task__link').click();
      await expect(page).toHaveURL(/task_operation=approve_internal_shortlist/);
      const shortlistTaskPanel = page.locator('.shortlist-task-panel');
      await expect(shortlistTaskPanel).toContainText('Task action');
      await expect(shortlistTaskPanel).toContainText('Approve internal shortlist');
      await shortlistTaskPanel.getByRole('button', { name: 'Approve internal shortlist' }).click();
      await expect(shortlistTaskPanel).toContainText('Task operation completed: approved_internal');
      await expect(shortlistTaskPanel.getByRole('link', { name: 'Return to team tasks' })).toBeVisible();
      await shortlistTaskPanel.getByRole('link', { name: 'Return to team tasks' }).click();
      await expect(page.locator('#team-task-feedback')).toContainText('Operation completed: approve_internal_shortlist');
      const reviewApplicationsTeamTask = page.locator('#team-task-list .team-task', { hasText: vacancyTitle }).first();
      await expect(reviewApplicationsTeamTask).toContainText('create_review_applications');
      await expect(reviewApplicationsTeamTask).not.toContainText('approve_internal_shortlist');

      await reviewApplicationsTeamTask.locator('.team-task__link').click();
      await expect(page).toHaveURL(/task_operation=create_review_applications/);
      const reviewApplicationsTaskPanel = page.locator('.shortlist-task-panel');
      await expect(reviewApplicationsTaskPanel).toContainText('Task action');
      await expect(reviewApplicationsTaskPanel).toContainText('Create review applications');
      await reviewApplicationsTaskPanel.getByRole('button', { name: 'Create review applications' }).click();
      await expect(reviewApplicationsTaskPanel).toContainText('Task operation completed: submitted_for_human_review');
      await reviewApplicationsTaskPanel.getByRole('link', { name: 'Return to team tasks' }).click();
      await expect(page.locator('#team-task-feedback')).toContainText('Operation completed: create_review_applications');
      await expect(page.locator('#team-task-feedback')).toContainText('next group: review_team');
      await expect(page.locator('#team-task-list')).not.toContainText('create_review_applications');

      return;
    } finally {
      await teamRequest.dispose();
    }
  }

  await page.addInitScript((token) => {
    window.sessionStorage.setItem('crewportglobal.operatorAccessToken', token);
  }, operatorAccessToken);
  await page.goto('/verify/');

  await expect(page.locator('#queue-status')).toContainText('Queue loaded');
  await page.locator('.operator-lane-button[data-operator-lane="reviewer"]').click();
  await page.locator('#filter-type').selectOption('vacancy_request');
  await expect(page.locator('#queue-body')).toContainText(employerEmail);
  await expect(page.locator('#queue-body')).toContainText(vacancyTitle);

  const vacancyRow = page.locator('#queue-body tr', { hasText: employerEmail }).first();
  await expect(vacancyRow.locator('td').first()).toHaveText(/^\d+$/);
  await expect(vacancyRow.getByRole('button', { name: 'Request deletion' })).toBeVisible();
  await vacancyRow.locator('.queue-open').click();

  const candidateSearch = page.locator('.candidate-search-panel');
  await expect(candidateSearch).toContainText('Candidate search');
  await expect(candidateSearch).toContainText('No side effects');
  await candidateSearch.getByRole('button', { name: 'Run candidate search' }).click();

  await expect(candidateSearch).toContainText('Candidate search loaded');
  await expect(candidateSearch).toContainText(`UI Exact Candidate ${unique}`);
  await expect(candidateSearch).toContainText('match_ready');
  await expect(candidateSearch).toContainText('rank, vessel_type, availability');
  await expect(candidateSearch).toContainText('Structured requirements');
  await expect(candidateSearch).toContainText('COC requirements: matched 1/1');
  await expect(candidateSearch).toContainText('Training requirements: matched 1/1');
  await expect(candidateSearch).toContainText('Sea service requirements: matched 1/1');
  await expect(candidateSearch).toContainText(`UI Mismatch Candidate ${unique}`);
  await expect(candidateSearch).toContainText('blocked');
  await expect(candidateSearch).toContainText('rank_mismatch');
  await expect(candidateSearch).toContainText('vessel_type_mismatch');
  await expect(candidateSearch).toContainText('coc_requirement_missing');
  await expect(candidateSearch).toContainText('training_requirement_missing');
  await expect(candidateSearch).toContainText('sea_service_months_below_requirement');
  await expect(candidateSearch).toContainText('COC requirements: blocked 0/1');
  await expect(candidateSearch).toContainText('Training requirements: blocked 0/1');
  await expect(candidateSearch).toContainText('Sea service requirements: blocked 0/1');
  await expect(candidateSearch).toContainText('COC ready');

  await candidateSearch.getByRole('button', { name: 'Create internal shortlist draft' }).click();
  await expect(candidateSearch).toContainText('Internal shortlist draft created');
  await expect(candidateSearch).toContainText('Employer visible: false');
  await expect(candidateSearch).toContainText('needs_review');
  await expect(candidateSearch).toContainText(`UI Exact Candidate ${unique}: include; guard ready_for_internal_shortlist`);
  await expect(candidateSearch).toContainText(`UI Mismatch Candidate ${unique}: hold; guard blocked`);
  await expect(candidateSearch).toContainText('candidate_search_blocked');
  await expect(candidateSearch).toContainText('structured_requirement_unmatched');

  await candidateSearch.getByRole('button', { name: 'Approve internal shortlist' }).click();
  await expect(candidateSearch).toContainText('Internal shortlist approved');
  await expect(candidateSearch).toContainText('approved_internal');
  await expect(candidateSearch).toContainText('Employer visible: false');
  await expect(candidateSearch).toContainText('Computed operation: Create internal review applications');
  await expect(candidateSearch).toContainText('Group: review_team');
  await expect(candidateSearch).toContainText('Permission: start_human_review');

  await candidateSearch.getByRole('button', { name: 'Create review applications' }).click();
  await expect(candidateSearch).toContainText('Review applications created');
  await expect(candidateSearch).toContainText('submitted_for_human_review');
  await expect(candidateSearch).toContainText('Employer visible: false');
  await expect(candidateSearch).toContainText('Computed operation: Review candidate presentation');
  await expect(candidateSearch).toContainText('Permission: approve_candidate_presentation');

  await expect(candidateSearch).not.toContainText(exactEmail);
  await expect(candidateSearch).not.toContainText(mismatchEmail);
  await expect(candidateSearch).not.toContainText('contact_email');
  await expect(candidateSearch).not.toContainText('contact_phone');
  await expect(candidateSearch).not.toContainText('document_metadata');
});
