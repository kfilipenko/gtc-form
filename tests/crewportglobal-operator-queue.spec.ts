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

function expectConcreteComputedTaskLink(task: Record<string, unknown>): void {
  const rawUrl = String(task.target_url || task.action_url || '');
  expect(rawUrl).toBeTruthy();
  const url = new URL(rawUrl, 'https://crewportglobal.test');
  const operationCode = String(task.operation_code || '');
  const visibleTarget = `${url.pathname}${url.search}${url.hash}`;
  expect(visibleTarget).not.toBe('/verify/');
  expect(visibleTarget).not.toBe('/team/');

  if (operationCode === 'create_internal_shortlist_draft') {
    expect(url.pathname).toBe('/team/matching/');
    expect(url.searchParams.get('vacancy_request_id')).toBeTruthy();
    return;
  }

  if (operationCode === 'approve_internal_shortlist' || operationCode === 'create_review_applications') {
    expect(url.pathname).toBe('/verify/');
    expect(url.searchParams.get('task_operation')).toBe(operationCode);
    expect(url.searchParams.get('shortlist_draft_id')).toBeTruthy();
    return;
  }

  if (operationCode === 'review_candidate_presentation') {
    expect(url.pathname).toBe('/verify/');
    expect(url.searchParams.get('task_operation')).toBe(operationCode);
    expect(url.searchParams.get('queue_type')).toBe('vacancy_application');
    expect(url.searchParams.get('queue_item_id')).toBeTruthy();
    return;
  }

  if (operationCode === 'confirm_vacancy_deletion' || operationCode === 'reject_vacancy_deletion') {
    expect(url.pathname).toBe('/verify/');
    expect(url.searchParams.get('task_operation')).toBe(operationCode);
    expect(url.searchParams.get('record_type')).toBe('vacancy_deletion_request');
    expect(url.searchParams.get('record_id')).toBeTruthy();
    return;
  }

  expect(
    url.searchParams.get('queue_item_id') ||
      url.searchParams.get('record_id') ||
      url.searchParams.get('shortlist_draft_id')
  ).toBeTruthy();
}

function expectTaskRequiredAccess(
  task: Record<string, unknown>,
  targetGroupCode: string,
  requiredPermissionCode: string,
  allowed = true
): void {
  const access = task.required_access as Record<string, unknown> | undefined;
  expect(access).toBeTruthy();
  expect(access?.target_group_code).toBe(targetGroupCode);
  expect(access?.required_permission_code).toBe(requiredPermissionCode);
  expect(access?.allowed).toBe(allowed);
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

function createVerificationTeamAdminSession(userId: string): string | null {
  if (!accessControlTablesReady()) {
    return null;
  }

  const safeUserId = userId.replace(/'/g, "''");
  const sessionId = randomUUID();
  runPsql(`
WITH target_group AS (
  SELECT group_id
  FROM crewportglobal.access_groups
  WHERE group_code = 'verification_team'
    AND is_active = TRUE
  LIMIT 1
),
target_user AS (
  SELECT '${safeUserId}'::uuid AS user_id
)
INSERT INTO crewportglobal.access_group_members (group_id, user_id, reason)
SELECT target_group.group_id, target_user.user_id, 'playwright verification team task-link test'
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
  'playwright-verification-team-session'
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

test('operator queue page renders submitted drafts from API', async ({ page, request, baseURL }) => {
  test.setTimeout(120_000);

  const unique = Date.now();
  const seafarerName = `Operator Queue Seafarer ${unique}`;
  const seafarerEmail = `ui.queue.seafarer.${unique}@example.com`;
  const employerEmail = `ui.queue.verification.employer.${unique}@example.com`;

  const createResponse = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'seafarer',
      email: seafarerEmail,
      full_name: seafarerName,
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
            emergency_contact_name: 'Supply Scope Kin Hidden',
            emergency_contact_relation: 'Sister',
            emergency_contact_phone: '+995555240024',
          },
          family_details: {
            kin_surname: 'Supply',
            kin_first_name: 'Scope Kin Hidden',
            kin_relation: 'Sister',
            kin_mobile: '+995555240024',
            kin_email: 'supply.scope.kin.hidden@example.com',
            children_records: 'Supply Hidden Child, Queue, Son, 2019-05-01, Male',
          },
          identity_documents: {
            civil_passport_number: 'SUPPLY-PASS-SECRET-024',
            civil_passport_authority: 'Supply Restricted Passport Authority',
            seafarer_id_number: 'SUPPLY-SID-SECRET-024',
            seafarer_id_expiry: '2028-02-20',
            schengen_visa_number: 'SUPPLY-VISA-SECRET-024',
            schengen_visa_expiry: '2026-10-10',
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
          previous_employer_references: {
            reference_company_1: 'Supply Previous Employer Safe Company',
            reference_person_1: 'Supply Hidden Captain',
            reference_phone_1: '+995555240025',
            reference_email_1: 'supply.hidden.reference@example.com',
          },
          medical_history: {
            signed_off_sick: 'yes',
            sick_details: 'Supply restricted illness details hidden from verifier summary.',
            operated: 'yes',
            surgery_details: 'Supply restricted surgery details hidden from verifier summary.',
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
  const seafarer = await createResponse.json();

  const employerCreate = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'employer',
      role_in_company: 'crew_manager',
      email: employerEmail,
      full_name: 'Verification Queue Employer',
      company_name: `Verification Queue Marine ${unique}`,
      country_code: 'AE',
      registration_number: `VQ-${unique}`,
    },
  });
  expect(employerCreate.ok()).toBeTruthy();
  const employer = await employerCreate.json();

  const verificationTeamSession = createVerificationTeamAdminSession(seafarer.draft_id);
  if (verificationTeamSession && baseURL) {
    const teamRequest = await playwrightRequest.newContext({
      baseURL,
      extraHTTPHeaders: {
        Authorization: `Bearer ${verificationTeamSession}`,
      },
    });
    try {
      const workbenchResponse = await teamRequest.get('/api/v1/team/workbench/tasks');
      const workbenchBody = await workbenchResponse.text();
      expect(workbenchResponse.ok(), workbenchBody).toBeTruthy();
      const workbench = JSON.parse(workbenchBody);
      const seafarerTaskPayload = (workbench.tasks as Array<Record<string, unknown>>).find((task) =>
        task.operation_code === 'review_seafarer_profile_completeness' &&
        (task.context as Record<string, unknown> | undefined)?.draft_id === seafarer.draft_id
      );
      const companyTaskPayload = (workbench.tasks as Array<Record<string, unknown>>).find((task) =>
        task.operation_code === 'review_company_verification' &&
        (task.context as Record<string, unknown> | undefined)?.draft_id === employer.draft_id
      );
      expect(seafarerTaskPayload).toBeTruthy();
      expect(companyTaskPayload).toBeTruthy();
      expectConcreteComputedTaskLink(seafarerTaskPayload as Record<string, unknown>);
      expectConcreteComputedTaskLink(companyTaskPayload as Record<string, unknown>);
      expectTaskRequiredAccess(
        seafarerTaskPayload as Record<string, unknown>,
        'verification_team',
        'view_verification_queue'
      );
      expectTaskRequiredAccess(
        companyTaskPayload as Record<string, unknown>,
        'verification_team',
        'view_verification_queue'
      );
    } finally {
      await teamRequest.dispose();
    }

    await page.goto('/');
    await page.evaluate((token) => {
      window.localStorage.setItem('crewportglobal_team_session', token);
    }, verificationTeamSession);
    await page.goto('/team/');
    await expect(page.locator('#team-tasks-title')).toContainText('My tasks', { timeout: 40_000 });
    const seafarerTeamTask = page.locator('#team-task-list .team-task', { hasText: seafarerName }).first();
    await expect(seafarerTeamTask).toContainText('Review seafarer profile completeness.', { timeout: 40_000 });
    await expect(seafarerTeamTask).toContainText('Stage: Seafarer supply readiness review');
    await expect(seafarerTeamTask).toContainText('Group: verification_team');
    await expect(seafarerTeamTask).toContainText('Permission: view_verification_queue');
    await seafarerTeamTask.locator('.team-task__link').click();
    await expect(page).toHaveURL(/task_operation=review_seafarer_profile_completeness/);
    await expect(page.locator('#queue-status')).toContainText('Task target opened');
    await expect(page.locator('#review-workspace')).toContainText('Seafarer profile');
    await expect(page.locator('#review-workspace')).toContainText(seafarerName);
    await expect(page.locator('#review-workspace')).toContainText('Workspace actions');
    await expect(page.locator('#review-workspace')).toContainText('children: 1');
    await expect(page.locator('#review-workspace')).toContainText('medical: 2');
    await expect(page.locator('#review-workspace')).not.toContainText('Supply Scope Kin Hidden');
    await expect(page.locator('#review-workspace')).not.toContainText('+995555240024');
    await expect(page.locator('#review-workspace')).not.toContainText('Supply Hidden Child');
    await expect(page.locator('#review-workspace')).not.toContainText('SUPPLY-PASS-SECRET-024');
    await expect(page.locator('#review-workspace')).not.toContainText('SUPPLY-VISA-SECRET-024');
    await expect(page.locator('#review-workspace')).not.toContainText('Supply Hidden Captain');
    await expect(page.locator('#review-workspace')).not.toContainText('supply.hidden.reference@example.com');
    await expect(page.locator('#review-workspace')).not.toContainText('Supply restricted surgery details hidden from verifier summary.');

    await page.goto('/team/');
    const companyTeamTask = page.locator('#team-task-list .team-task', { hasText: `Verification Queue Marine ${unique}` }).first();
    await expect(companyTeamTask).toContainText('Review company verification.', { timeout: 40_000 });
    await expect(companyTeamTask).toContainText('Stage: Employer and authority setup');
    await expect(companyTeamTask).toContainText('Group: verification_team');
    await expect(companyTeamTask).toContainText('Permission: view_verification_queue');
    await companyTeamTask.locator('.team-task__link').click();
    await expect(page).toHaveURL(/task_operation=review_company_verification/);
    await expect(page.locator('#queue-status')).toContainText('Task target opened');
    await expect(page.locator('#review-workspace')).toContainText('Company');
    await expect(page.locator('#review-workspace')).toContainText(`Verification Queue Marine ${unique}`);
    await expect(page.locator('#review-workspace')).toContainText('Workspace actions');
  }

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
  await expect(page.locator('#queue-body')).not.toContainText(seafarerEmail);
  await expect(page.locator('#queue-body')).toContainText('Review seafarer profile completeness.');
  await expect(page.locator('#queue-body')).toContainText('Second Officer');
  await expectQueueTableFitsWorkbench(page);

  await page.locator('#filter-type').selectOption('seafarer_profile');
  await expect(page.locator('#queue-body')).toContainText('Review seafarer profile completeness.');

  await page.locator('#filter-role').selectOption('seafarer');
  const queueRow = page.locator('#queue-body tr', { hasText: seafarerName }).first();
  await expect(queueRow).toContainText('Stage: Seafarer supply readiness review');
  await expect(queueRow).toContainText('Visible because submitted data requires a human review outcome.');
  await expect(queueRow.getByRole('button', { name: /Open review workspace/ })).toHaveCount(0);
  await queueRow.locator('.queue-task-link.queue-open').click();
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
  await expect(page.locator('#details-sections')).toContainText('children: 1');
  await expect(page.locator('#details-sections')).toContainText('medical: 2');
  await expect(page.locator('#details-sections')).not.toContainText('Supply Scope Kin Hidden');
  await expect(page.locator('#details-sections')).not.toContainText('+995555240024');
  await expect(page.locator('#details-sections')).not.toContainText('Supply Hidden Child');
  await expect(page.locator('#details-sections')).not.toContainText('SUPPLY-PASS-SECRET-024');
  await expect(page.locator('#details-sections')).not.toContainText('SUPPLY-VISA-SECRET-024');
  await expect(page.locator('#details-sections')).not.toContainText('Supply Hidden Captain');
  await expect(page.locator('#details-sections')).not.toContainText('supply.hidden.reference@example.com');
  await expect(page.locator('#details-sections')).not.toContainText('Supply restricted surgery details hidden from verifier summary.');
  await expect(page.locator('#details-json')).toContainText('seafarer_review_readiness');
  await expect(page.locator('#details-json')).toContainText('sensitive_fields_redacted');
  await expect(page.locator('#details-json')).toContainText('restricted_family_record');
  await expect(page.locator('#details-json')).toContainText('restricted_medical_details_hidden');
  await expect(page.locator('#details-json')).toContainText(seafarerEmail);
  await expect(page.locator('#details-json')).toContainText('seafarer_profile');
  await expect(page.locator('#details-json')).not.toContainText('Supply Scope Kin Hidden');
  await expect(page.locator('#details-json')).not.toContainText('+995555240024');
  await expect(page.locator('#details-json')).not.toContainText('Supply Hidden Child');
  await expect(page.locator('#details-json')).not.toContainText('SUPPLY-PASS-SECRET-024');
  await expect(page.locator('#details-json')).not.toContainText('SUPPLY-VISA-SECRET-024');
  await expect(page.locator('#details-json')).not.toContainText('Supply Hidden Captain');
  await expect(page.locator('#details-json')).not.toContainText('supply.hidden.reference@example.com');
  await expect(page.locator('#details-json')).not.toContainText('Supply restricted surgery details hidden from verifier summary.');

  const restrictedMedicalResponse = await request.get(`/api/v1/operator/seafarer-medical/${seafarer.draft_id}`, {
    headers: {
      Authorization: `Bearer ${operatorAccessToken}`,
    },
  });
  expect(restrictedMedicalResponse.status()).toBe(403);
  const restrictedMedicalPayload = await restrictedMedicalResponse.json();
  expect(restrictedMedicalPayload.error).toBe('restricted_medical_capability_required');
  expect(restrictedMedicalPayload.audit_recorded).toBe(true);

  await page.locator('#review-note').fill('');
  const workspaceActions = page.locator('.workspace-actions-section');
  await expect(workspaceActions).toContainText('Workspace actions');
  await workspaceActions.locator('.queue-decision[data-decision="needs_correction"]').click();
  await expect(page.locator('#review-note-feedback')).toContainText('requires a review note');

  const note = 'Missing certificate details and availability date.';
  await page.locator('#review-target').selectOption('QUAL-003');
  await page.locator('.review-card-action[data-card-decision="start_review"]').click();
  await expect(page.locator('#review-note-feedback')).toContainText('QUAL-003 Certificate of competence -> under_review');
  await expect(page.locator('#details-sections')).toContainText('review: under_review');

  await page.locator('#review-note').fill(note);
  await workspaceActions.locator('.queue-decision[data-decision="needs_correction"]').click();
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

  const actorContextSummary = runPsql(`
SELECT concat_ws('|',
  event_payload->'actor_context'->>'queue_type',
  event_payload->'actor_context'->>'decision',
  event_payload->'actor_context'->>'target_group_code',
  event_payload->'actor_context'->>'required_permission_code'
)
FROM crewportglobal.registration_audit_events
WHERE user_id = '${String(seafarer.draft_id).replace(/'/g, "''")}'::uuid
  AND event_type = 'operator_review_decision_recorded'
ORDER BY created_at DESC
LIMIT 1;
`);
  expect(actorContextSummary).toContain('seafarer_profile|needs_correction|verification_team|');
});

test('owner team task opens pending vacancy deletion confirmation panel', async ({ page, request, baseURL }) => {
  test.setTimeout(120_000);

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

  const reviewTeamSession = createReviewTeamAdminSession(employer.draft_id);
  if (reviewTeamSession && baseURL) {
    const reviewTeamRequest = await playwrightRequest.newContext({
      baseURL,
      extraHTTPHeaders: {
        Authorization: `Bearer ${reviewTeamSession}`,
      },
    });
    try {
      const workbenchResponse = await reviewTeamRequest.get('/api/v1/team/workbench/tasks');
      const workbenchBody = await workbenchResponse.text();
      expect(workbenchResponse.ok(), workbenchBody).toBeTruthy();
      const workbench = JSON.parse(workbenchBody);
      const reviewTeamDeletionTask = (workbench.tasks as Array<Record<string, unknown>>).find((task) =>
        task.operation_code === 'confirm_vacancy_deletion' && task.record_id === vacancyRequestId
      );
      expect(reviewTeamDeletionTask).toBeFalsy();

      const deletionReviewResponse = await reviewTeamRequest.get(
        `/api/v1/operator/vacancy-requests/${vacancyRequestId}/deletion-review`
      );
      const deletionReviewBody = await deletionReviewResponse.text();
      expect(deletionReviewResponse.status(), deletionReviewBody).toBe(403);
      const deletionReview = JSON.parse(deletionReviewBody);
      expect(deletionReview.error).toBe('workflow_operation_permission_required');
      expect(deletionReview.operation_access.target_group_code).toBe('owners');
      expect(deletionReview.operation_access.required_permission_code).toBe('approve_access_policy_change');
      expect(deletionReview.operation_access.allowed).toBe(false);

      const blockedExecutionResponse = await reviewTeamRequest.patch(
        `/api/v1/operator/vacancy-requests/${vacancyRequestId}/deletion-review`,
        {
          data: {
            decision: 'confirm',
            note: 'Review team must not confirm manager deletion.',
          },
        }
      );
      const blockedExecutionBody = await blockedExecutionResponse.text();
      expect(blockedExecutionResponse.status(), blockedExecutionBody).toBe(403);
    } finally {
      await reviewTeamRequest.dispose();
    }
  }

  const ownerSession = createOwnerAdminSession(employer.draft_id);
  if (!ownerSession || !baseURL) {
    return;
  }

  const ownerRequest = await playwrightRequest.newContext({
    baseURL,
    extraHTTPHeaders: {
      Authorization: `Bearer ${ownerSession}`,
    },
  });
  try {
    const workbenchResponse = await ownerRequest.get('/api/v1/team/workbench/tasks');
    const workbenchBody = await workbenchResponse.text();
    expect(workbenchResponse.ok(), workbenchBody).toBeTruthy();
    const workbench = JSON.parse(workbenchBody);
    expect(workbench.persisted_task_table_created).toBe(false);
    const deletionTaskPayload = (workbench.tasks as Array<Record<string, unknown>>).find((task) =>
      task.operation_code === 'confirm_vacancy_deletion' && task.record_id === vacancyRequestId
    );
    expect(deletionTaskPayload).toBeTruthy();
    expectConcreteComputedTaskLink(deletionTaskPayload as Record<string, unknown>);
    expectTaskRequiredAccess(
      deletionTaskPayload as Record<string, unknown>,
      'owners',
      'approve_access_policy_change'
    );
    expect((deletionTaskPayload as Record<string, unknown>).context).not.toHaveProperty('assigned_user_label');
  } finally {
    await ownerRequest.dispose();
  }

  await page.goto('/');
  await page.evaluate((token) => {
    window.localStorage.setItem('crewportglobal_team_session', token);
  }, ownerSession);
  await page.goto('/team/');
  await expect(page.locator('#team-task-status')).toContainText('computed task', { timeout: 40_000 });
  const deletionTask = page.locator('#team-task-list .team-task', { hasText: vacancyTitle }).first();
  await expect(deletionTask).toContainText('Confirm deletion request.', { timeout: 40_000 });
  await expect(deletionTask).toContainText('Stage: Controlled deletion confirmation');
  await expect(deletionTask).toContainText('Visible until manager confirms or rejects the deletion request.');
  await expect(deletionTask).toContainText('Assigned employee: group queue');
  await expect(deletionTask).toContainText('Permission: approve_access_policy_change');
  await expect(deletionTask).not.toContainText('confirm_vacancy_deletion');
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
  await expect(page.locator('#team-task-feedback')).toContainText('Operation completed: reject_vacancy_deletion', {
    timeout: 40_000,
  });
});

test('operator queue page renders and reviews vacancy applications', async ({ page, request, baseURL }) => {
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
    if (baseURL) {
      const teamRequest = await playwrightRequest.newContext({
        baseURL,
        extraHTTPHeaders: {
          Authorization: `Bearer ${reviewTeamSession}`,
        },
      });
      try {
        const workbenchResponse = await teamRequest.get('/api/v1/team/workbench/tasks');
        const workbenchBody = await workbenchResponse.text();
        expect(workbenchResponse.ok(), workbenchBody).toBeTruthy();
        const workbench = JSON.parse(workbenchBody);
        expect(workbench.persisted_task_table_created).toBe(false);
        const presentationTaskPayload = (workbench.tasks as Array<Record<string, unknown>>).find((task) =>
          task.operation_code === 'review_candidate_presentation' &&
          (task.context as Record<string, unknown> | undefined)?.queue_item_id === applicationId
        );
        expect(presentationTaskPayload).toBeTruthy();
        expectConcreteComputedTaskLink(presentationTaskPayload as Record<string, unknown>);
        expectTaskRequiredAccess(
          presentationTaskPayload as Record<string, unknown>,
          'review_team',
          'approve_candidate_presentation'
        );
        expect((presentationTaskPayload as Record<string, unknown>).context).not.toHaveProperty('assigned_user_label');
      } finally {
        await teamRequest.dispose();
      }
    }

    await page.addInitScript((token) => {
      window.localStorage.setItem('crewportglobal_team_session', token);
    }, reviewTeamSession);
    await page.goto('/team/');
    await expect(page.locator('#team-tasks-title')).toContainText('My tasks');
    await expect(page.locator('#team-task-list')).toContainText(title);
    const presentationTask = page.locator('#team-task-list .team-task', { hasText: title }).first();
    await expect(presentationTask).toContainText('Approve candidate for employer presentation.');
    await expect(presentationTask).toContainText('Stage: Employer-facing candidate presentation review');
    await expect(presentationTask).toContainText('Visible until this computed operation is completed or blocked by guard.');
    await expect(presentationTask).toContainText('Assigned employee: group queue');
    await expect(presentationTask).toContainText('Permission: approve_candidate_presentation');
    await expect(presentationTask).not.toContainText('review_candidate_presentation');
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
    expect(serializedCandidate).not.toContain('"document_metadata":');
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
  await expect(page.locator('#queue-body')).not.toContainText(seafarerEmail);
  await expect(page.locator('#queue-body')).toContainText('Review candidate application.');
  await expect(page.locator('#queue-body')).toContainText(title);
  await expectQueueTableFitsWorkbench(page);

  let applicationRow = page.locator('#queue-body tr', { hasText: title }).first();
  await applicationRow.locator('.queue-task-link.queue-open').click();
  await expect(page.locator('#details-sections')).toContainText('Vacancy application');
  await expect(page.locator('#details-sections')).toContainText(applicationId);
  await expect(page.locator('#details-sections')).toContainText(candidateNote);
  await expect(page.locator('#details-sections')).toContainText(title);
  await expect(page.locator('#details-sections')).toContainText('Operator Queue Applicant');
  await expect(page.locator('#details-json')).toContainText('vacancy_application');

  const applicationWorkspaceActions = page.locator('.workspace-actions-section');
  await expect(applicationWorkspaceActions).toContainText('Workspace actions');
  await applicationWorkspaceActions.locator('.queue-decision[data-decision="start_review"]').click();
  await expect(page.locator('#queue-status')).toContainText('in_review');
  await expect(page.locator('#details-sections')).toContainText('in_review');

  applicationRow = page.locator('#queue-body tr', { hasText: title }).first();
  const note = 'Candidate can be presented to employer after document check.';
  await page.locator('#review-note').fill(note);
  await applicationWorkspaceActions.locator('.queue-decision[data-decision="reviewed"]').click();
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

      const initialWorkbenchResponse = await teamRequest.get('/api/v1/team/workbench/tasks');
      const initialWorkbenchBody = await initialWorkbenchResponse.text();
      expect(initialWorkbenchResponse.ok(), initialWorkbenchBody).toBeTruthy();
      const initialWorkbench = JSON.parse(initialWorkbenchBody);
      expect(initialWorkbench.persisted_task_table_created).toBe(false);
      expect(initialWorkbench.task_assignment_model).toBe('historical_active_executor_or_group_queue');
      const createShortlistTaskPayload = (initialWorkbench.tasks as Array<Record<string, unknown>>).find((task) =>
        task.operation_code === 'create_internal_shortlist_draft' &&
        (task.context as Record<string, unknown> | undefined)?.queue_item_id === vacancyRequestId
      );
      expect(createShortlistTaskPayload).toBeTruthy();
      expectConcreteComputedTaskLink(createShortlistTaskPayload as Record<string, unknown>);
      expectTaskRequiredAccess(
        createShortlistTaskPayload as Record<string, unknown>,
        'review_team',
        'view_review_queue'
      );
      expect((createShortlistTaskPayload as Record<string, unknown>).context).not.toHaveProperty('assigned_user_label');

      await page.addInitScript((token) => {
        window.localStorage.setItem('crewportglobal_team_session', token);
      }, reviewTeamSession);

      await page.goto(`/verify/?queue_type=vacancy_request&queue_item_id=${vacancyRequestId}#review-workspace`);
      await expect(page.locator('#queue-status')).toContainText('Task target opened');
      await expect(page.locator('#review-workspace')).toContainText(vacancyTitle);
      await expect(page.locator('#review-workspace')).toContainText('Candidate search');
      await expect(page.locator('#review-workspace')).toContainText('Run candidate search');
      const workspaceVisibleAfterDeepLink = await page.locator('#review-workspace').evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return rect.top >= 0 && rect.top < window.innerHeight;
      });
      expect(workspaceVisibleAfterDeepLink).toBeTruthy();

      await page.goto('/team/');
      await expect(page.locator('#team-tasks-title')).toContainText('My tasks');
      await expect(page.locator('#team-task-list')).toContainText(vacancyTitle);
      const createShortlistTask = page.locator('#team-task-list .team-task', { hasText: vacancyTitle }).first();
      await expect(createShortlistTask).toContainText('Create internal shortlist draft.');
      await expect(createShortlistTask).toContainText('Stage: Request-supply matching and shortlist preparation');
      await expect(createShortlistTask).toContainText('Assigned employee: group queue');
      await expect(createShortlistTask.locator('.team-task__link')).toHaveAttribute(
        'href',
        new RegExp(`/team/matching/\\?vacancy_request_id=${vacancyRequestId}`)
      );
      await createShortlistTask.locator('.team-task__link').click();
      await expect(page).toHaveURL(new RegExp(`/team/matching/\\?vacancy_request_id=${vacancyRequestId}`));
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
      expect(JSON.stringify(createdDraftRow)).not.toContain('"document_metadata":');

      const approvalWorkbenchResponse = await teamRequest.get('/api/v1/team/workbench/tasks');
      const approvalWorkbenchBody = await approvalWorkbenchResponse.text();
      expect(approvalWorkbenchResponse.ok(), approvalWorkbenchBody).toBeTruthy();
      const approvalWorkbench = JSON.parse(approvalWorkbenchBody);
      expect(approvalWorkbench.persisted_task_table_created).toBe(false);
      expect(approvalWorkbench.task_assignment_model).toBe('historical_active_executor_or_group_queue');
      const approveInternalTaskPayload = (approvalWorkbench.tasks as Array<Record<string, unknown>>).find((task) =>
        task.operation_code === 'approve_internal_shortlist' &&
        (task.context as Record<string, unknown> | undefined)?.shortlist_draft_id === createdDraftRow.shortlist_draft_id
      );
      expect(approveInternalTaskPayload).toBeTruthy();
      expectConcreteComputedTaskLink(approveInternalTaskPayload as Record<string, unknown>);
      expectTaskRequiredAccess(
        approveInternalTaskPayload as Record<string, unknown>,
        'review_team',
        'approve_candidate_presentation'
      );
      expect((approveInternalTaskPayload as Record<string, unknown>).context).toHaveProperty(
        'assigned_user_id',
        employer.draft_id
      );
      expect((approveInternalTaskPayload as Record<string, unknown>).context).toHaveProperty(
        'assignment_mode',
        'historical_active_executor'
      );

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
      await expect(updatedTeamTask).toContainText('Approve internal shortlist.');
      await expect(updatedTeamTask).toContainText('Stage: Internal shortlist approval');
      await expect(updatedTeamTask).toContainText('Assigned employee: Operator Search Employer');
      await expect(updatedTeamTask).toContainText('Permission: approve_candidate_presentation');
      await expect(updatedTeamTask).not.toContainText('approve_internal_shortlist');
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

      const approvedDraftDetailResponse = await teamRequest.get(`/api/v1/operator/shortlist-drafts/${createdDraftRow.shortlist_draft_id}`);
      const approvedDraftDetailBody = await approvedDraftDetailResponse.text();
      expect(approvedDraftDetailResponse.ok(), approvedDraftDetailBody).toBeTruthy();
      const approvedDraftDetail = JSON.parse(approvedDraftDetailBody);
      expect(approvedDraftDetail.drill_down.created.actor_context.operation_code).toBe('create_internal_shortlist_draft');
      expect(approvedDraftDetail.drill_down.internal_approval.decision).toBe('approve_internal');
      expect(approvedDraftDetail.drill_down.internal_approval.actor_context.operation_code).toBe('approve_internal_shortlist');
      expect(approvedDraftDetail.drill_down.current_guards.internal_approval_status).toBe('ready_for_internal_approval');
      expect(approvedDraftDetail.drill_down.privacy_boundary.candidate_document_metadata_excluded).toBe(true);
      expect(JSON.stringify(approvedDraftDetail.drill_down)).toContain('rank_mismatch');
      expect(JSON.stringify(approvedDraftDetail.drill_down)).not.toContain(exactEmail);
      expect(JSON.stringify(approvedDraftDetail.drill_down)).not.toContain('contact_email');
      expect(JSON.stringify(approvedDraftDetail.drill_down)).not.toContain('"document_metadata":');

      await page.goto('/team/shortlists/');
      const approvedDraftCard = page.locator('#shortlist-history-list .shortlist-card', { hasText: vacancyTitle }).first();
      await approvedDraftCard.getByRole('button', { name: 'View drill-down' }).click();
      await expect(approvedDraftCard.locator('.shortlist-drilldown')).toContainText('Created by');
      await expect(approvedDraftCard.locator('.shortlist-drilldown')).toContainText('Approved by');
      await expect(approvedDraftCard.locator('.shortlist-drilldown')).toContainText('approve_internal');
      await expect(approvedDraftCard.locator('.shortlist-drilldown')).toContainText('rank_mismatch');
      await expect(approvedDraftCard.locator('.shortlist-drilldown')).not.toContainText(exactEmail);
      await expect(approvedDraftCard.locator('.shortlist-drilldown')).not.toContainText('contact_email');
      await expect(approvedDraftCard.locator('.shortlist-drilldown')).not.toContainText('document_metadata');

      const reviewApplicationsWorkbenchResponse = await teamRequest.get('/api/v1/team/workbench/tasks');
      const reviewApplicationsWorkbenchBody = await reviewApplicationsWorkbenchResponse.text();
      expect(reviewApplicationsWorkbenchResponse.ok(), reviewApplicationsWorkbenchBody).toBeTruthy();
      const reviewApplicationsWorkbench = JSON.parse(reviewApplicationsWorkbenchBody);
      expect(reviewApplicationsWorkbench.persisted_task_table_created).toBe(false);
      expect(reviewApplicationsWorkbench.task_assignment_model).toBe('historical_active_executor_or_group_queue');
      const createReviewApplicationsTaskPayload = (reviewApplicationsWorkbench.tasks as Array<Record<string, unknown>>).find((task) =>
        task.operation_code === 'create_review_applications' &&
        (task.context as Record<string, unknown> | undefined)?.shortlist_draft_id === createdDraftRow.shortlist_draft_id
      );
      expect(createReviewApplicationsTaskPayload).toBeTruthy();
      expectConcreteComputedTaskLink(createReviewApplicationsTaskPayload as Record<string, unknown>);
      expectTaskRequiredAccess(
        createReviewApplicationsTaskPayload as Record<string, unknown>,
        'review_team',
        'start_human_review'
      );
      expect((createReviewApplicationsTaskPayload as Record<string, unknown>).context).toHaveProperty(
        'assigned_user_id',
        employer.draft_id
      );
      expect((createReviewApplicationsTaskPayload as Record<string, unknown>).context).toHaveProperty(
        'assignment_mode',
        'historical_active_executor'
      );

      await page.goto('/team/');
      const reviewApplicationsTeamTask = page.locator('#team-task-list .team-task', { hasText: vacancyTitle }).first();
      await expect(reviewApplicationsTeamTask).toContainText('Create candidate presentation review.');
      await expect(reviewApplicationsTeamTask).toContainText('Stage: Candidate presentation review preparation');
      await expect(reviewApplicationsTeamTask).toContainText('Assigned employee: Operator Search Employer');
      await expect(reviewApplicationsTeamTask).not.toContainText('create_review_applications');
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
  await expect(page.locator('#queue-body')).not.toContainText(employerEmail);
  await expect(page.locator('#queue-body')).toContainText('Review crew request completeness.');
  await expect(page.locator('#queue-body')).toContainText(vacancyTitle);

  const vacancyRow = page.locator('#queue-body tr', { hasText: vacancyTitle }).first();
  await expect(vacancyRow.locator('td').first()).toHaveText(/^\d+$/);
  await expect(vacancyRow.getByRole('button', { name: 'Request deletion' })).toHaveCount(0);
  await expect(vacancyRow.locator('.queue-decision')).toHaveCount(0);
  await vacancyRow.locator('.queue-task-link.queue-open').click();
  const vacancyWorkspaceActions = page.locator('.workspace-actions-section');
  await expect(vacancyWorkspaceActions).toContainText('Workspace actions');
  await expect(vacancyWorkspaceActions.getByRole('button', { name: 'Request deletion' })).toBeVisible();

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
