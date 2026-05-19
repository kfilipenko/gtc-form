import { expect, test, type APIRequestContext } from '@playwright/test';
import { execSync } from 'node:child_process';

const operatorAccessToken =
  process.env.CREWPORTGLOBAL_OPERATOR_ACCESS_TOKEN ||
  process.env.CPG_OPERATOR_ACCESS_TOKEN ||
  'crewportglobal-local-operator';

function cleanupVisibilityTestData(): void {
  const sql = `
WITH visibility_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.visibility.%@example.com'
)
UPDATE crewportglobal.vacancy_applications va
SET application_status = 'withdrawn', updated_at = now()
FROM visibility_users vu
WHERE va.seafarer_user_id = vu.user_id
  AND va.application_status IN ('submitted_for_human_review', 'in_review', 'presented');

WITH visibility_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.visibility.%@example.com'
)
UPDATE crewportglobal.vacancy_requests vr
SET publication_status = 'rejected', updated_at = now()
FROM visibility_users vu
WHERE vr.created_by_user_id = vu.user_id
  AND vr.publication_status IN ('submitted_for_human_review', 'in_review', 'published');

WITH visibility_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.visibility.%@example.com'
)
UPDATE crewportglobal.seafarer_profiles sp
SET review_status = 'rejected', updated_at = now()
FROM visibility_users vu
WHERE sp.user_id = vu.user_id
  AND sp.review_status IN ('submitted_for_human_review', 'in_review', 'approved');

WITH visibility_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.visibility.%@example.com'
)
UPDATE crewportglobal.employer_companies ec
SET verification_status = 'rejected', updated_at = now()
FROM crewportglobal.company_users cu
JOIN visibility_users vu ON vu.user_id = cu.user_id
WHERE ec.company_id = cu.company_id
  AND ec.verification_status IN ('unverified', 'submitted', 'verified');
`;

  execSync(
    'PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql -v ON_ERROR_STOP=1 -q',
    { input: sql, encoding: 'utf8' }
  );
}

test.afterEach(() => {
  cleanupVisibilityTestData();
});

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

test('sensitive seafarer fields are minimized for operator, cabinet summary and employer payloads', async ({ page, request }) => {
  const unique = Date.now();
  const seafarerEmail = `ui.visibility.seafarer.${unique}@example.com`;
  const employerEmail = `ui.visibility.employer.${unique}@example.com`;

  const seafarerResponse = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'seafarer',
      email: seafarerEmail,
      full_name: 'Visibility Test Seafarer',
      rank: 'Chief Officer',
      department: 'deck',
      availability_status: 'available_now',
      nationality_code: 'GE',
      residence_country_code: 'AE',
      contact_phone: '+971509990001',
      document_metadata: {
        certificate_status: 'ready',
        stcw_status: 'ready',
        passport_expiry: '2031-12-31',
        medical_expiry: '2028-05-20',
        visa_status: 'ready',
        seafarer_workspace: {
          personal_details: {
            date_of_birth: '1988-01-02',
            place_of_birth: 'Batumi',
            gender: 'Male',
            civil_status: 'Married',
          },
          name_components: {
            surname: 'Visibility',
            first_name: 'Sensitive',
            middle_name: 'Scope',
            citizenship: 'GEORGIA',
            religion: 'Restricted Religion Value',
          },
          contact_and_addresses: {
            residence_country: 'AE',
            residence_city: 'Dubai',
            nearest_airport: 'DXB',
            secondary_mobile_number: '+971509990002',
            home_phone: '+995422990002',
            emergency_contact_name: 'Restricted Kin Name',
            emergency_contact_relation: 'Spouse',
            emergency_contact_phone: '+995555990001',
          },
          family_details: {
            kin_surname: 'Restricted',
            kin_first_name: 'Kin',
            kin_relation: 'Spouse',
            kin_mobile: '+995555990001',
            kin_email: 'restricted.kin@example.com',
            kin_address: 'Restricted family address',
            children_records: 'Child, Sensitive, Scope, Daughter, 2019-05-01, Female',
          },
          identity_documents: {
            civil_passport_series: 'CP',
            civil_passport_number: 'PASS-SECRET-999',
            civil_passport_issued: '2020-01-10',
            civil_passport_authority: 'Restricted Passport Authority',
            foreign_passport_number: 'FOREIGN-SECRET-777',
            foreign_passport_expiry: '2031-02-11',
            seafarer_id_number: 'SID-SECRET-555',
            seafarer_id_expiry: '2027-03-12',
            seamans_book_number: 'BOOK-SECRET-444',
            seamans_book_expiry: '2027-04-13',
            schengen_visa_number: 'VISA-SECRET-333',
            schengen_visa_expiry: '2026-06-15',
          },
          qualifications: {
            coc_type: 'Chief Officer',
            coc_number: 'COC-VIS-001',
            coc_expiry: '2029-09-30',
            training_courses: ['Basic Training'],
          },
          sea_service: {
            last_vessel_name: 'MV Visible Experience',
            last_vessel_type: 'Bulk Carrier',
            last_rank: 'Chief Officer',
            service_from: '2024-01-01',
            service_to: '2024-08-01',
          },
          previous_employer_references: {
            reference_company_1: 'Restricted Previous Employer',
            reference_person_1: 'Captain Restricted',
            reference_phone_1: '+995555999111',
            reference_email_1: 'captain.restricted@example.com',
          },
          medical_history: {
            signed_off_sick: 'yes',
            sick_details: 'Severe illness details for minimization test.',
            injury_details: 'Restricted injury details for minimization test.',
            operated: 'yes',
            surgery_details: 'Orthopedic surgery details for minimization test.',
          },
          matching_publication: {
            information_source: 'Referral',
            candidate_summary: 'Experienced Chief Officer available for reviewed matching.',
            publish_to_matching: 'yes',
            data_processing_confirmation: 'i_confirm',
          },
          consent_details: {
            obligation_date: '2026-05-19',
            obligation_place: 'Dubai',
            obligation_confirmation: 'i_confirm',
            agreement_date: '2026-05-19',
            agreement_value: 'i_agree',
            source_comments: 'Consent source comment stays internal.',
          },
        },
      },
    },
  });
  expect(seafarerResponse.status()).toBe(201);
  const seafarer = await seafarerResponse.json();
  await acceptPresentationConsents(request, seafarer.draft_id);

  const ownerWorkspaceResponse = await request.get(`/api/v1/seafarer/workspace?draft_id=${seafarer.draft_id}`);
  expect(ownerWorkspaceResponse.status()).toBe(200);
  const ownerWorkspace = await ownerWorkspaceResponse.json();
  expect(ownerWorkspace.workspace.visibility_scope).toBe('owner_full');
  expect(ownerWorkspace.workspace.source_repeated_records.children_records[0].first_name).toBe('Sensitive');
  expect(ownerWorkspace.workspace.source_repeated_records.medical_declarations[0].details).toContain('Severe illness');

  const operatorDraftResponse = await request.get(`/api/v1/registration/drafts/${seafarer.draft_id}?visibility=operator_general`);
  expect(operatorDraftResponse.status()).toBe(200);
  const operatorDraft = await operatorDraftResponse.json();
  expect(operatorDraft.visibility_scope).toBe('operator_general');
  const operatorSerialized = JSON.stringify(operatorDraft);
  expect(operatorSerialized).not.toContain('PASS-SECRET-999');
  expect(operatorSerialized).not.toContain('FOREIGN-SECRET-777');
  expect(operatorSerialized).not.toContain('Child, Sensitive');
  expect(operatorSerialized).not.toContain('Orthopedic surgery details');
  expect(operatorSerialized).not.toContain('Restricted Religion Value');
  expect(operatorSerialized).toContain('restricted_medical_details_hidden');
  expect(operatorSerialized).toContain('sensitive_fields_redacted');
  expect(operatorDraft.payload.seafarer_workspace_structured.consent_event_model.required_consent_types).toContain('employer_sharing');

  await page.addInitScript((token) => {
    window.sessionStorage.setItem('crewportglobal.operatorAccessToken', token);
  }, operatorAccessToken);
  await page.goto('/verify/');
  await expect(page.locator('#queue-status')).toContainText('Queue loaded');
  await page.locator('#filter-type').selectOption('seafarer_profile');
  const queueRow = page.locator('#queue-body tr', { hasText: seafarerEmail }).first();
  await queueRow.locator('.queue-open').click();
  await expect(page.locator('#details-json')).toContainText('operator_general');
  await expect(page.locator('#details-json')).not.toContainText('PASS-SECRET-999');
  await expect(page.locator('#details-json')).not.toContainText('Child, Sensitive');
  await expect(page.locator('#details-json')).not.toContainText('Orthopedic surgery details');

  const employerResponse = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'employer',
      role_in_company: 'recruiter',
      email: employerEmail,
      full_name: 'Visibility Employer',
      company_name: 'Visibility Marine Employer',
      country_code: 'AE',
      registration_number: `VIS-${unique}`,
      vacancy: {
        vacancy_title: 'Chief Officer',
        rank: 'Chief Officer',
        department: 'deck',
        vessel_type: 'Bulk Carrier',
        join_date: '2026-08-15',
        contract_duration: '4 months',
        salary_min_usd: 6500,
        salary_max_usd: 7200,
        currency: 'USD',
        employer_country_code: 'AE',
        requirements: 'COC, bulk carrier experience and valid medical certificate.',
      },
    },
  });
  expect(employerResponse.status()).toBe(201);
  const employer = await employerResponse.json();
  const vacancy = employer.payload.vacancy_request;

  const companyDecision = await request.patch(`/api/v1/operator/review-queue/${employer.draft_id}/status`, {
    data: {
      decision: 'reviewed',
      queue_type: 'company_verification',
    },
  });
  expect(companyDecision.status()).toBe(200);

  const vacancyDecision = await request.patch(`/api/v1/operator/review-queue/${employer.draft_id}/status`, {
    data: {
      decision: 'reviewed',
      queue_type: 'vacancy_request',
    },
  });
  expect(vacancyDecision.status()).toBe(200);

  const applicationResponse = await request.post(`/api/v1/vacancies/${vacancy.vacancy_request_id}/applications`, {
    data: {
      seafarer_draft_id: seafarer.draft_id,
      email: seafarerEmail,
      note: 'Please review this candidate without exposing restricted fields.',
    },
  });
  expect(applicationResponse.status()).toBe(201);
  const application = await applicationResponse.json();
  const applicationId = application.application.vacancy_application_id;

  const applicationReviewed = await request.patch(`/api/v1/operator/review-queue/${applicationId}/status`, {
    data: {
      decision: 'reviewed',
      queue_type: 'vacancy_application',
      note: 'Candidate can be presented with minimized employer payload.',
    },
  });
  expect(applicationReviewed.status()).toBe(200);

  const employerDraftResponse = await request.get(`/api/v1/registration/drafts/${employer.draft_id}`);
  expect(employerDraftResponse.status()).toBe(200);
  const employerDraft = await employerDraftResponse.json();
  const presented = employerDraft.payload.presented_candidates.find((item: Record<string, unknown>) => (
    item.vacancy_application_id === applicationId
  ));
  expect(presented).toBeTruthy();
  expect(presented.document_metadata).toBeUndefined();
  expect(presented.seafarer_email).toBeUndefined();
  expect(presented.contact_phone).toBeUndefined();
  expect(presented.document_summary.passport_expiry).toBe('2031-12-31');
  const presentedSerialized = JSON.stringify(presented);
  expect(presentedSerialized).not.toContain('PASS-SECRET-999');
  expect(presentedSerialized).not.toContain('SID-SECRET-555');
  expect(presentedSerialized).not.toContain('Child, Sensitive');
  expect(presentedSerialized).not.toContain('Orthopedic surgery details');
});
