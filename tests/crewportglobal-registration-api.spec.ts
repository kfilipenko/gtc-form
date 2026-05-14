import { expect, test } from '@playwright/test';
import { execSync } from 'node:child_process';

type DraftResponse = {
  ok: boolean;
  draft_id: string;
  role: string;
  email: string;
  status: string;
  payload: Record<string, unknown>;
};

function readLatestOperatorAuditForDraft(draftId: string): {
  source: string;
  decision: string;
  previousStatus: string;
  newStatus: string;
  queueType: string;
  role: string;
  reviewNote: string;
} {
  const safeDraftId = draftId.replace(/'/g, "''");
  const sql = [
    "SELECT source,",
    "       event_payload->>'decision',",
    "       event_payload->>'previous_status',",
    "       event_payload->>'new_status',",
    "       event_payload->>'queue_type',",
    "       event_payload->>'role',",
    "       event_payload->>'review_note'",
    "FROM crewportglobal.registration_audit_events",
    "WHERE event_type = 'operator_review_decision_recorded'",
    `  AND user_id = '${safeDraftId}'::uuid`,
    'ORDER BY created_at DESC',
    'LIMIT 1;',
  ].join(' ');

  const output = execSync(
    `PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql -qAt -F '|' -c \"${sql}\"`,
    { encoding: 'utf8' }
  ).trim();

  const [source, decision, previousStatus, newStatus, queueType, role, reviewNote] = output.split('|');
  return {
    source: source || '',
    decision: decision || '',
    previousStatus: previousStatus || '',
    newStatus: newStatus || '',
    queueType: queueType || '',
    role: role || '',
    reviewNote: reviewNote || '',
  };
}

function cleanupApiTestData(): void {
  const sql = `
WITH api_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'api.%@example.com'
),
api_vacancies AS (
  SELECT vacancy_request_id
  FROM crewportglobal.vacancy_requests vr
  JOIN api_users au ON au.user_id = vr.created_by_user_id
)
DELETE FROM crewportglobal.vacancy_applications va
WHERE va.seafarer_user_id IN (SELECT user_id FROM api_users)
   OR va.vacancy_request_id IN (SELECT vacancy_request_id FROM api_vacancies);

WITH api_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'api.%@example.com'
)
UPDATE crewportglobal.vacancy_requests vr
SET publication_status = 'closed', updated_at = now()
FROM api_users au
WHERE vr.created_by_user_id = au.user_id
  AND vr.publication_status IN ('submitted_for_human_review', 'in_review', 'published');

WITH api_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'api.%@example.com'
)
UPDATE crewportglobal.seafarer_profiles sp
SET review_status = 'rejected', updated_at = now()
FROM api_users au
WHERE sp.user_id = au.user_id
  AND sp.review_status IN ('submitted_for_human_review', 'in_review', 'approved');

WITH api_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'api.%@example.com'
),
api_companies AS (
  SELECT DISTINCT cu.company_id
  FROM crewportglobal.company_users cu
  JOIN api_users au ON au.user_id = cu.user_id
)
UPDATE crewportglobal.employer_companies ec
SET verification_status = 'rejected', updated_at = now()
FROM api_companies ac
WHERE ec.company_id = ac.company_id
  AND ec.verification_status IN ('unverified', 'submitted', 'verified');
`;

  execSync(
    'PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql -v ON_ERROR_STOP=1 -q',
    { input: sql, encoding: 'utf8' }
  );
}

test.afterEach(() => {
  cleanupApiTestData();
});

test('health endpoint returns service status', async ({ request }) => {
  const response = await request.get('/health');
  expect(response.ok()).toBeTruthy();

  const body = await response.json();
  expect(body.ok).toBe(true);
  expect(body.service).toBe('crewportglobal-registration-api');
});

test('operator review endpoints require access token', async ({ request }) => {
  const noTokenResponse = await request.get('/operator/review-queue', {
    headers: {
      'X-CPG-Operator-Token': '',
    },
  });
  expect(noTokenResponse.status()).toBe(401);
  const noTokenBody = await noTokenResponse.json();
  expect(noTokenBody.error).toBe('operator_access_required');

  const wrongTokenResponse = await request.get('/operator/review-queue', {
    headers: {
      'X-CPG-Operator-Token': 'wrong-token',
    },
  });
  expect(wrongTokenResponse.status()).toBe(401);
});

test('seafarer draft create, get and patch flow works', async ({ request }) => {
  const unique = Date.now();
  const email = `api.seafarer.${unique}@example.com`;

  const createResponse = await request.post('/registration/drafts', {
    data: {
      role: 'seafarer',
      email,
      full_name: 'API Test Seafarer',
      rank: 'Second Officer',
      department: 'deck',
      country_code: 'AE',
      nationality_code: 'PH',
      residence_country_code: 'AE',
      availability_status: 'available_later',
      availability_date: '2026-07-10',
      preferred_vessel_types: ['Bulk Carrier', 'Container'],
      salary_expectation_usd: 4200,
      contact_phone: '+971500000001',
      document_metadata: {
        certificate_status: 'ready',
        stcw_status: 'collecting',
        passport_expiry: '2028-07-10',
        medical_expiry: '2027-01-15',
        visa_status: 'required',
        notes: 'Schengen visa appointment booked.',
      },
    },
  });
  expect(createResponse.status()).toBe(201);

  const created = (await createResponse.json()) as DraftResponse;
  expect(created.ok).toBe(true);
  expect(created.role).toBe('seafarer');
  expect(created.email).toBe(email);
  expect(typeof created.draft_id).toBe('string');

  const getResponse = await request.get(`/registration/drafts/${created.draft_id}`);
  expect(getResponse.status()).toBe(200);

  const fetched = (await getResponse.json()) as DraftResponse;
  expect(fetched.ok).toBe(true);
  expect(fetched.draft_id).toBe(created.draft_id);
  const fetchedSeafarerProfile = fetched.payload.seafarer_profile as Record<string, unknown>;
  expect(fetchedSeafarerProfile.primary_rank).toBe('Second Officer');
  expect(fetchedSeafarerProfile.department).toBe('deck');
  expect(fetchedSeafarerProfile.nationality_code).toBe('PH');
  expect(fetchedSeafarerProfile.residence_country_code).toBe('AE');
  expect(fetchedSeafarerProfile.availability_date).toBe('2026-07-10');
  expect(fetchedSeafarerProfile.salary_expectation_usd).toBe('4200.00');
  expect(fetchedSeafarerProfile.contact_phone).toBe('+971500000001');
  expect(typeof fetchedSeafarerProfile.document_metadata).toBe('string');
  const fetchedDocumentMetadata = JSON.parse(fetchedSeafarerProfile.document_metadata as string) as Record<string, unknown>;
  expect(fetchedDocumentMetadata.certificate_status).toBe('ready');
  expect(fetchedDocumentMetadata.stcw_status).toBe('collecting');
  expect(fetchedDocumentMetadata.passport_expiry).toBe('2028-07-10');
  expect(fetchedDocumentMetadata.medical_expiry).toBe('2027-01-15');
  expect(fetchedDocumentMetadata.visa_status).toBe('required');

  const patchResponse = await request.patch(`/registration/drafts/${created.draft_id}`, {
    data: {
      availability_status: 'available_now',
      rank: 'Chief Officer',
      department: 'deck',
      preferred_vessel_types: ['LNG'],
      salary_expectation_usd: 5100,
      contact_phone: '+971500000999',
    },
  });
  expect(patchResponse.status()).toBe(200);

  const patched = (await patchResponse.json()) as DraftResponse;
  expect(patched.ok).toBe(true);
  expect(patched.draft_id).toBe(created.draft_id);

  const seafarerProfile = patched.payload.seafarer_profile as Record<string, unknown>;
  expect(seafarerProfile.availability_status).toBe('available_now');
  expect(seafarerProfile.primary_rank).toBe('Chief Officer');
  expect(seafarerProfile.department).toBe('deck');
  expect(seafarerProfile.salary_expectation_usd).toBe('5100.00');
  expect(seafarerProfile.contact_phone).toBe('+971500000999');
  expect(seafarerProfile.availability_date).toBe('2026-07-10');
  expect(typeof seafarerProfile.preferred_vessel_types).toBe('string');
  expect(seafarerProfile.preferred_vessel_types).toBe('["LNG"]');
  const patchedDocumentMetadata = JSON.parse(seafarerProfile.document_metadata as string) as Record<string, unknown>;
  expect(patchedDocumentMetadata.certificate_status).toBe('ready');
  expect(patchedDocumentMetadata.passport_expiry).toBe('2028-07-10');
});

test('shipowner flow normalizes IMO and updates vessel context', async ({ request }) => {
  const unique = Date.now();
  const email = `api.shipowner.${unique}@example.com`;

  const createResponse = await request.post('/registration/drafts', {
    data: {
      role: 'shipowner',
      role_in_company: 'owner',
      email,
      company_name: 'API Blue Horizon',
      country_code: 'SG',
      registration_number: `SG-${unique}`,
      vessel: {
        vessel_name: 'MV Test Aurora',
        vessel_type: 'Bulk Carrier',
        imo_number: 'IMO9001234',
      },
    },
  });
  expect(createResponse.status()).toBe(201);

  const created = (await createResponse.json()) as DraftResponse;
  expect(created.ok).toBe(true);
  expect(created.role).toBe('shipowner');

  const company = created.payload.company as Record<string, unknown>;
  const vessel = created.payload.vessel as Record<string, unknown>;
  expect(company.company_type).toBe('shipowner');
  expect(company.role_in_company).toBe('owner');
  expect(vessel.imo_number).toBe('9001234');

  const patchResponse = await request.patch(`/registration/drafts/${created.draft_id}`, {
    data: {
      company_name: 'API Blue Horizon Group',
      role_in_company: 'recruiter',
      vessel: {
        vessel_name: 'MV Test Aurora II',
        vessel_type: 'Bulk Carrier',
        imo_number: 'IMO9001234',
      },
    },
  });
  expect(patchResponse.status()).toBe(200);

  const patched = (await patchResponse.json()) as DraftResponse;
  const patchedCompany = patched.payload.company as Record<string, unknown>;
  const patchedVessel = patched.payload.vessel as Record<string, unknown>;
  expect(patchedCompany.company_name).toBe('API Blue Horizon Group');
  expect(patchedCompany.role_in_company).toBe('recruiter');
  expect(patchedVessel.vessel_name).toBe('MV Test Aurora II');
  expect(patchedVessel.imo_number).toBe('9001234');
});

test('employer flow creates and updates company draft context', async ({ request }) => {
  const unique = Date.now();
  const email = `api.employer.${unique}@example.com`;

  const createResponse = await request.post('/registration/drafts', {
    data: {
      role: 'employer',
      role_in_company: 'manager',
      email,
      company_name: 'Atlas Marine Crewing',
      country_code: 'AE',
    },
  });
  expect(createResponse.status()).toBe(201);

  const created = (await createResponse.json()) as DraftResponse;
  expect(created.ok).toBe(true);
  expect(created.role).toBe('employer');

  const createdCompany = created.payload.company as Record<string, unknown>;
  expect(createdCompany.company_name).toBe('Atlas Marine Crewing');
  expect(createdCompany.company_type).toBe('employer');
  expect(createdCompany.role_in_company).toBe('manager');

  const patchResponse = await request.patch(`/registration/drafts/${created.draft_id}`, {
    data: {
      company_name: 'Atlas Marine Crewing LLC',
      role_in_company: 'owner',
    },
  });
  expect(patchResponse.status()).toBe(200);

  const patched = (await patchResponse.json()) as DraftResponse;
  const patchedCompany = patched.payload.company as Record<string, unknown>;
  expect(patchedCompany.company_name).toBe('Atlas Marine Crewing LLC');
  expect(patchedCompany.company_type).toBe('employer');
  expect(patchedCompany.role_in_company).toBe('owner');
});

test('employer vacancy request flows through review to public vacancy board', async ({ request }) => {
  const unique = Date.now();
  const email = `api.vacancy.${unique}@example.com`;

  const createResponse = await request.post('/registration/drafts', {
    data: {
      role: 'employer',
      role_in_company: 'recruiter',
      email,
      full_name: 'Vacancy API Employer',
      company_name: 'Verified Vacancy Marine',
      country_code: 'AE',
      registration_number: `AE-VAC-${unique}`,
      vessel: {
        vessel_name: 'MV Published Star',
        vessel_type: 'Bulk Carrier',
        imo_number: 'IMO9101234',
      },
      vacancy: {
        vacancy_title: 'Chief Officer',
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
      },
    },
  });
  expect(createResponse.status()).toBe(201);

  const created = (await createResponse.json()) as DraftResponse;
  expect(created.ok).toBe(true);
  expect(created.role).toBe('employer');
  const vacancy = created.payload.vacancy_request as Record<string, unknown>;
  expect(vacancy.vacancy_title).toBe('Chief Officer');
  expect(vacancy.department).toBe('deck');
  expect(vacancy.publication_status).toBe('submitted_for_human_review');

  const queueResponse = await request.get('/operator/review-queue');
  expect(queueResponse.status()).toBe(200);
  const queueBody = (await queueResponse.json()) as {
    queue: Array<Record<string, unknown>>;
  };
  const vacancyQueueItem = queueBody.queue.find((item) => {
    return item.draft_id === created.draft_id && item.queue_type === 'vacancy_request';
  });
  expect(vacancyQueueItem).toBeTruthy();

  const companyDecision = await request.patch(`/operator/review-queue/${created.draft_id}/status`, {
    data: {
      decision: 'reviewed',
      queue_type: 'company_verification',
    },
  });
  expect(companyDecision.status()).toBe(200);
  const companyDecisionBody = (await companyDecision.json()) as Record<string, unknown>;
  expect(companyDecisionBody.new_status).toBe('verified');

  const vacancyDecision = await request.patch(`/operator/review-queue/${created.draft_id}/status`, {
    data: {
      decision: 'reviewed',
      queue_type: 'vacancy_request',
    },
  });
  expect(vacancyDecision.status()).toBe(200);
  const vacancyDecisionBody = (await vacancyDecision.json()) as Record<string, unknown>;
  expect(vacancyDecisionBody.new_status).toBe('published');
  expect(vacancyDecisionBody.vacancy_request_id).toBe(vacancy.vacancy_request_id);

  const publicVacanciesResponse = await request.get('/vacancies');
  expect(publicVacanciesResponse.status()).toBe(200);
  const publicVacanciesBody = (await publicVacanciesResponse.json()) as {
    ok: boolean;
    vacancies: Array<Record<string, unknown>>;
  };
  expect(publicVacanciesBody.ok).toBe(true);
  const publicVacancy = publicVacanciesBody.vacancies.find((item) => {
    return item.vacancy_request_id === vacancy.vacancy_request_id;
  });
  expect(publicVacancy).toBeTruthy();
  expect(publicVacancy?.company_name).toBe('Verified Vacancy Marine');
  expect(publicVacancy?.vessel_type).toBe('Bulk Carrier');
  expect(publicVacancy?.salary_min_usd).toBe('6500.00');
  expect(publicVacancy?.salary_max_usd).toBe('7200.00');

  const publicVacancyDetailResponse = await request.get(`/vacancies/${vacancy.vacancy_request_id}`);
  expect(publicVacancyDetailResponse.status()).toBe(200);
  const publicVacancyDetail = (await publicVacancyDetailResponse.json()) as {
    ok: boolean;
    vacancy: Record<string, unknown>;
  };
  expect(publicVacancyDetail.ok).toBe(true);
  expect(publicVacancyDetail.vacancy.vacancy_title).toBe('Chief Officer');

  const seafarerCreate = await request.post('/registration/drafts', {
    data: {
      role: 'seafarer',
      email: `api.vacancy.application.${unique}@example.com`,
      full_name: 'Vacancy Application Seafarer',
      rank: 'Chief Officer',
      department: 'deck',
      availability_status: 'available_now',
    },
  });
  expect(seafarerCreate.status()).toBe(201);
  const seafarer = (await seafarerCreate.json()) as DraftResponse;

  const applicationResponse = await request.post(`/vacancies/${vacancy.vacancy_request_id}/applications`, {
    data: {
      seafarer_draft_id: seafarer.draft_id,
      email: seafarer.email,
      note: 'Available now with documents ready for review.',
    },
  });
  expect(applicationResponse.status()).toBe(201);
  const applicationBody = (await applicationResponse.json()) as {
    ok: boolean;
    application: Record<string, unknown>;
  };
  expect(applicationBody.ok).toBe(true);
  expect(applicationBody.application.application_status).toBe('submitted_for_human_review');

  const mismatchedEmailResponse = await request.post(`/vacancies/${vacancy.vacancy_request_id}/applications`, {
    data: {
      seafarer_draft_id: seafarer.draft_id,
      email: 'wrong.application@example.com',
    },
  });
  expect(mismatchedEmailResponse.status()).toBe(400);
});

test('operator review queue returns submitted seafarer and company drafts', async ({ request }) => {
  const unique = Date.now();

  const seafarerCreate = await request.post('/registration/drafts', {
    data: {
      role: 'seafarer',
      email: `api.queue.seafarer.${unique}@example.com`,
      full_name: 'Queue Seafarer',
      availability_status: 'available_now',
    },
  });
  expect(seafarerCreate.status()).toBe(201);

  const companyCreate = await request.post('/registration/drafts', {
    data: {
      role: 'employer',
      email: `api.queue.employer.${unique}@example.com`,
      full_name: 'Queue Employer',
      company_name: 'Queue Marine LLC',
      country_code: 'AE',
    },
  });
  expect(companyCreate.status()).toBe(201);

  const queueResponse = await request.get('/operator/review-queue');
  expect(queueResponse.status()).toBe(200);

  const queueBody = (await queueResponse.json()) as {
    ok: boolean;
    count: number;
    queue: Array<Record<string, unknown>>;
  };

  expect(queueBody.ok).toBe(true);
  expect(Array.isArray(queueBody.queue)).toBe(true);
  expect(queueBody.count).toBeGreaterThan(0);

  const hasSeafarer = queueBody.queue.some((item) => item.queue_type === 'seafarer_profile' && item.role === 'seafarer');
  const hasCompany = queueBody.queue.some((item) => item.queue_type === 'company_verification' && item.role === 'employer');

  expect(hasSeafarer).toBe(true);
  expect(hasCompany).toBe(true);
});

test('operator decision endpoint updates draft review status', async ({ request }) => {
  const unique = Date.now();
  const email = `api.operator.decision.${unique}@example.com`;

  const createResponse = await request.post('/registration/drafts', {
    data: {
      role: 'seafarer',
      email,
      full_name: 'Operator Decision Seafarer',
      availability_status: 'available_now',
    },
  });
  expect(createResponse.status()).toBe(201);

  const created = (await createResponse.json()) as DraftResponse;

  const decisionResponse = await request.patch(`/operator/review-queue/${created.draft_id}/status`, {
    data: {
      decision: 'reviewed',
    },
  });
  expect(decisionResponse.status()).toBe(200);

  const decisionBody = (await decisionResponse.json()) as Record<string, unknown>;
  expect(decisionBody.ok).toBe(true);
  expect(decisionBody.draft_id).toBe(created.draft_id);
  expect(decisionBody.new_status).toBe('approved');

  const audit = readLatestOperatorAuditForDraft(created.draft_id);
  expect(audit.source).toBe('operator_review_queue');
  expect(audit.decision).toBe('reviewed');
  expect(audit.previousStatus).toBe('submitted_for_human_review');
  expect(audit.newStatus).toBe('approved');
  expect(audit.queueType).toBe('seafarer_profile');
  expect(audit.role).toBe('seafarer');
  expect(audit.reviewNote).toBe('');

  const getResponse = await request.get(`/registration/drafts/${created.draft_id}`);
  expect(getResponse.status()).toBe(200);
  const fetched = (await getResponse.json()) as DraftResponse;
  const seafarerProfile = fetched.payload.seafarer_profile as Record<string, unknown>;
  expect(seafarerProfile.review_status).toBe('approved');

  const queueResponse = await request.get('/operator/review-queue');
  expect(queueResponse.status()).toBe(200);
  const queueBody = (await queueResponse.json()) as {
    queue: Array<Record<string, unknown>>;
  };
  const stillInQueue = queueBody.queue.some((item) => item.draft_id === created.draft_id);
  expect(stillInQueue).toBe(false);
});

test('operator decision note validation and persistence works', async ({ request }) => {
  const unique = Date.now();
  const email = `api.operator.note.${unique}@example.com`;

  const createResponse = await request.post('/registration/drafts', {
    data: {
      role: 'seafarer',
      email,
      full_name: 'Operator Note Seafarer',
      availability_status: 'available_now',
    },
  });
  expect(createResponse.status()).toBe(201);
  const created = (await createResponse.json()) as DraftResponse;

  const needsCorrectionWithoutNote = await request.patch(`/operator/review-queue/${created.draft_id}/status`, {
    data: {
      decision: 'needs_correction',
    },
  });
  expect(needsCorrectionWithoutNote.status()).toBe(400);

  const startReviewWithoutNote = await request.patch(`/operator/review-queue/${created.draft_id}/status`, {
    data: {
      decision: 'start_review',
    },
  });
  expect(startReviewWithoutNote.status()).toBe(200);

  const note = 'Missing certificate details and availability date.';
  const needsCorrectionWithNote = await request.patch(`/operator/review-queue/${created.draft_id}/status`, {
    data: {
      decision: 'needs_correction',
      note,
    },
  });
  expect(needsCorrectionWithNote.status()).toBe(200);
  const correctionBody = (await needsCorrectionWithNote.json()) as Record<string, unknown>;
  expect(correctionBody.ok).toBe(true);
  expect(correctionBody.new_status).toBe('rejected');
  expect(correctionBody.review_note).toBe(note);

  const audit = readLatestOperatorAuditForDraft(created.draft_id);
  expect(audit.source).toBe('operator_review_queue');
  expect(audit.decision).toBe('needs_correction');
  expect(audit.previousStatus).toBe('in_review');
  expect(audit.newStatus).toBe('rejected');
  expect(audit.queueType).toBe('seafarer_profile');
  expect(audit.role).toBe('seafarer');
  expect(audit.reviewNote).toBe(note);

  const draftResponse = await request.get(`/registration/drafts/${created.draft_id}`);
  expect(draftResponse.status()).toBe(200);
  const draftBody = (await draftResponse.json()) as DraftResponse;
  const history = (draftBody.payload.operator_review_history as Array<Record<string, unknown>>) || [];
  expect(Array.isArray(history)).toBe(true);
  expect(history.length).toBeGreaterThanOrEqual(2);
  expect(history[0].decision).toBe('needs_correction');
  expect(history[0].review_note).toBe(note);
  expect(history[1].decision).toBe('start_review');
});

test('invalid payloads are rejected with 4xx', async ({ request }) => {
  const noJson = await request.post('/registration/drafts', {
    headers: { 'Content-Type': 'text/plain' },
    data: 'not-json',
  });
  expect(noJson.status()).toBe(415);

  const badRole = await request.post('/registration/drafts', {
    data: {
      role: 'captain',
      email: 'bad-role@example.com',
    },
  });
  expect(badRole.status()).toBe(400);

  const badDraftId = await request.get('/registration/drafts/not-a-uuid');
  expect(badDraftId.status()).toBe(400);
});
