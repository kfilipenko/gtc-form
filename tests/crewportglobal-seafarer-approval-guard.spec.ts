import { expect, test, type APIRequestContext } from '@playwright/test';
import { execSync } from 'node:child_process';

function cleanupApprovalGuardTestData(): void {
  const sql = `
WITH approval_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.approval.%@example.com'
),
approval_vacancies AS (
  SELECT vacancy_request_id
  FROM crewportglobal.vacancy_requests vr
  JOIN approval_users au ON au.user_id = vr.created_by_user_id
)
DELETE FROM crewportglobal.vacancy_applications va
WHERE va.seafarer_user_id IN (SELECT user_id FROM approval_users)
   OR va.vacancy_request_id IN (SELECT vacancy_request_id FROM approval_vacancies);

WITH approval_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.approval.%@example.com'
)
UPDATE crewportglobal.vacancy_requests vr
SET publication_status = 'closed', updated_at = now()
FROM approval_users au
WHERE vr.created_by_user_id = au.user_id
  AND vr.publication_status IN ('submitted_for_human_review', 'in_review', 'published');

WITH approval_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.approval.%@example.com'
),
approval_companies AS (
  SELECT DISTINCT cu.company_id
  FROM crewportglobal.company_users cu
  JOIN approval_users au ON au.user_id = cu.user_id
)
UPDATE crewportglobal.employer_companies ec
SET verification_status = 'rejected', updated_at = now()
FROM approval_companies ac
WHERE ec.company_id = ac.company_id
  AND ec.verification_status IN ('unverified', 'submitted', 'verified');

WITH approval_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.approval.%@example.com'
)
UPDATE crewportglobal.seafarer_profiles sp
SET review_status = 'rejected', updated_at = now()
FROM approval_users au
WHERE sp.user_id = au.user_id
  AND sp.review_status IN ('submitted_for_human_review', 'in_review', 'approved');
`;

  execSync(
    'PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql -v ON_ERROR_STOP=1 -q',
    { input: sql, encoding: 'utf8' }
  );
}

async function acceptConsent(request: APIRequestContext, draftId: string, consentType: string) {
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
  return response.json();
}

test.afterEach(() => {
  cleanupApprovalGuardTestData();
});

test('approval guard blocks missing or withdrawn consent and unresolved source-card corrections before employer presentation', async ({ request }) => {
  const unique = Date.now();
  const employerEmail = `ui.approval.employer.${unique}@example.com`;
  const seafarerEmail = `ui.approval.seafarer.${unique}@example.com`;

  const employerCreate = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'employer',
      role_in_company: 'recruiter',
      email: employerEmail,
      full_name: 'Approval Guard Employer',
      company_name: `Approval Guard Marine ${unique}`,
      country_code: 'AE',
      registration_number: `AG-${unique}`,
      vacancy: {
        vacancy_title: 'Chief Officer',
        rank: 'Chief Officer',
        department: 'deck',
        vessel_type: 'Bulk Carrier',
        join_date: '2026-09-15',
        contract_duration: '4 months',
        salary_min_usd: 6400,
        salary_max_usd: 7000,
        currency: 'USD',
        employer_country_code: 'AE',
        requirements: 'COC, sea service and valid medical certificate.',
      },
    },
  });
  expect(employerCreate.status()).toBe(201);
  const employer = await employerCreate.json();
  const vacancyId = employer.payload.vacancy_request.vacancy_request_id;

  const companyDecision = await request.patch(`/api/v1/operator/review-queue/${employer.draft_id}/status`, {
    data: { decision: 'reviewed', queue_type: 'company_verification' },
  });
  expect(companyDecision.status()).toBe(200);
  const vacancyDecision = await request.patch(`/api/v1/operator/review-queue/${employer.draft_id}/status`, {
    data: { decision: 'reviewed', queue_type: 'vacancy_request' },
  });
  expect(vacancyDecision.status()).toBe(200);

  const seafarerCreate = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'seafarer',
      email: seafarerEmail,
      full_name: 'Approval Guard Seafarer',
      rank: 'Chief Officer',
      department: 'deck',
      availability_status: 'available_now',
      document_metadata: {
        certificate_status: 'ready',
        stcw_status: 'ready',
        passport_expiry: '2030-12-31',
        medical_expiry: '2028-05-20',
        visa_status: 'ready',
        seafarer_workspace: {
          medical_history: {
            signed_off_sick: 'yes',
            sick_details: 'Restricted medical detail must not be visible to a general operator.',
            operated: 'yes',
            surgery_details: 'Restricted surgery detail must not be visible to employer.',
          },
          matching_publication: {
            candidate_summary: 'Chief Officer ready for approved presentation.',
            publish_to_matching: 'yes',
            data_processing_confirmation: 'i_confirm',
          },
        },
      },
    },
  });
  expect(seafarerCreate.status()).toBe(201);
  const seafarer = await seafarerCreate.json();

  const applicationResponse = await request.post(`/api/v1/vacancies/${vacancyId}/applications`, {
    data: {
      seafarer_draft_id: seafarer.draft_id,
      email: seafarerEmail,
      note: 'Approval guard candidate note.',
    },
  });
  expect(applicationResponse.status()).toBe(201);
  const application = await applicationResponse.json();
  const applicationId = application.application.vacancy_application_id;

  const missingConsentDecision = await request.patch(`/api/v1/operator/review-queue/${applicationId}/status`, {
    data: {
      decision: 'reviewed',
      queue_type: 'vacancy_application',
      note: 'Should be blocked without purpose-specific consents.',
    },
  });
  expect(missingConsentDecision.status()).toBe(409);
  const missingConsentBody = await missingConsentDecision.json();
  expect(missingConsentBody.error).toBe('approval_guard_blocked');
  expect(JSON.stringify(missingConsentBody.approval_guard)).toContain('missing_active_consent');
  expect(JSON.stringify(missingConsentBody.approval_guard)).toContain('employer_sharing');
  expect(JSON.stringify(missingConsentBody.approval_guard)).toContain('matching_preparation');

  await acceptConsent(request, seafarer.draft_id, 'matching_preparation');
  await acceptConsent(request, seafarer.draft_id, 'employer_sharing');

  const correction = await request.patch(`/api/v1/operator/seafarer-workspace-cards/${seafarer.draft_id}/review`, {
    data: {
      decision: 'needs_correction',
      card_code: 'QUAL-003',
      note: 'Certificate number must be corrected before presentation.',
    },
  });
  expect(correction.status()).toBe(200);

  const blockedCorrectionDecision = await request.patch(`/api/v1/operator/review-queue/${applicationId}/status`, {
    data: {
      decision: 'reviewed',
      queue_type: 'vacancy_application',
      note: 'Should be blocked by unresolved source-card correction.',
    },
  });
  expect(blockedCorrectionDecision.status()).toBe(409);
  const blockedCorrectionBody = await blockedCorrectionDecision.json();
  expect(JSON.stringify(blockedCorrectionBody.approval_guard)).toContain('unresolved_source_card_correction');
  expect(JSON.stringify(blockedCorrectionBody.approval_guard)).toContain('QUAL-003');

  const verifiedCard = await request.patch(`/api/v1/operator/seafarer-workspace-cards/${seafarer.draft_id}/review`, {
    data: {
      decision: 'reviewed',
      card_code: 'QUAL-003',
      note: 'Certificate card verified for presentation guard test.',
    },
  });
  expect(verifiedCard.status()).toBe(200);

  const withdrawn = await request.patch('/api/v1/seafarer/consents/employer_sharing/withdraw', {
    data: {
      draft_id: seafarer.draft_id,
      reason: 'Guard regression checks withdrawn consent.',
    },
  });
  expect(withdrawn.status()).toBe(200);

  const withdrawnConsentDecision = await request.patch(`/api/v1/operator/review-queue/${applicationId}/status`, {
    data: {
      decision: 'reviewed',
      queue_type: 'vacancy_application',
      note: 'Should be blocked by withdrawn employer sharing consent.',
    },
  });
  expect(withdrawnConsentDecision.status()).toBe(409);
  expect(JSON.stringify(await withdrawnConsentDecision.json())).toContain('employer_sharing');

  await acceptConsent(request, seafarer.draft_id, 'employer_sharing');

  const medicalAccess = await request.get(`/api/v1/operator/seafarer-medical/${seafarer.draft_id}`);
  expect(medicalAccess.status()).toBe(403);
  const medicalAccessBody = await medicalAccess.json();
  expect(medicalAccessBody.error).toBe('restricted_medical_capability_required');
  expect(JSON.stringify(medicalAccessBody)).not.toContain('Restricted surgery detail');

  const approved = await request.patch(`/api/v1/operator/review-queue/${applicationId}/status`, {
    data: {
      decision: 'reviewed',
      queue_type: 'vacancy_application',
      note: 'Candidate can be presented after approval guard passes.',
    },
  });
  expect(approved.status()).toBe(200);
  const approvedBody = await approved.json();
  expect(approvedBody.new_status).toBe('presented');
  expect(approvedBody.approval_guard.approval_status).toBe('approved_for_employer_presentation');

  const employerDraftResponse = await request.get(`/api/v1/registration/drafts/${employer.draft_id}`);
  expect(employerDraftResponse.status()).toBe(200);
  const employerDraft = await employerDraftResponse.json();
  const presented = employerDraft.payload.presented_candidates.find((item: Record<string, unknown>) => (
    item.vacancy_application_id === applicationId
  ));
  expect(presented).toBeTruthy();
  const employerSerialized = JSON.stringify(presented);
  expect(presented.document_metadata).toBeUndefined();
  expect(presented.seafarer_workspace).toBeUndefined();
  expect(presented.contact_email).toBeUndefined();
  expect(presented.seafarer_email).toBeUndefined();
  expect(presented.contact_phone).toBeUndefined();
  expect(employerSerialized).not.toContain('Restricted medical detail');
  expect(employerSerialized).not.toContain('Restricted surgery detail');
});
