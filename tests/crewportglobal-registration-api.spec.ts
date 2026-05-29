import { expect, request as playwrightRequest, test, type APIRequestContext } from '@playwright/test';
import { execSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

type DraftResponse = {
  ok: boolean;
  draft_id: string;
  role: string;
  email: string;
  status: string;
  payload: Record<string, unknown>;
};

type UploadedDocumentRow = {
  uploadState: string;
  reviewStatus: string;
  scanStatus: string;
  sha256Hash: string;
  storageRoot: string;
  storagePath: string;
  fileSizeBytes: number;
};

function minimalPdfBuffer(extra = ''): Buffer {
  return Buffer.from([
    '%PDF-1.4',
    '1 0 obj',
    '<< /Type /Catalog >>',
    'endobj',
    extra,
    '%%EOF',
    '',
  ].join('\n'));
}

function tinyPngBuffer(): Buffer {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
    'base64'
  );
}

function sha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

function readUploadedDocumentRow(documentId: string): UploadedDocumentRow {
  const safeDocumentId = documentId.replace(/'/g, "''");
  const sql = [
    'SELECT upload_state,',
    '       review_status,',
    '       scan_status,',
    '       sha256_hash,',
    '       storage_root,',
    '       storage_path,',
    '       file_size_bytes',
    'FROM crewportglobal.uploaded_documents',
    `WHERE document_id = '${safeDocumentId}'::uuid`,
    'LIMIT 1;',
  ].join(' ');

  const output = execSync(
    `PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql -qAt -F '|' -c "${sql}"`,
    { encoding: 'utf8' }
  ).trim();

  const [uploadState, reviewStatus, scanStatus, sha256Hash, storageRoot, storagePath, fileSizeBytes] = output.split('|');
  return {
    uploadState,
    reviewStatus,
    scanStatus,
    sha256Hash,
    storageRoot,
    storagePath,
    fileSizeBytes: Number(fileSizeBytes),
  };
}

function cleanupUploadedApiDocuments(): void {
  const sql = `
SELECT storage_root || '/' || storage_path
FROM crewportglobal.uploaded_documents ud
JOIN crewportglobal.users u ON u.user_id = ud.draft_id
WHERE u.email LIKE 'api.%@example.com';

DELETE FROM crewportglobal.uploaded_documents ud
USING crewportglobal.users u
WHERE u.user_id = ud.draft_id
  AND u.email LIKE 'api.%@example.com';
`;

  const output = execSync(
    'PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql -v ON_ERROR_STOP=1 -qAt',
    { input: sql, encoding: 'utf8' }
  ).trim();

  for (const filePath of output.split('\n').map((item) => item.trim()).filter(Boolean)) {
    fs.rmSync(filePath, { force: true });
  }
}

function readLatestOperatorAuditForDraft(draftId: string): {
  source: string;
  decision: string;
  previousStatus: string;
  newStatus: string;
  queueType: string;
  role: string;
  reviewNote: string;
  correctionCardCode: string;
  correctionCardName: string;
} {
  const safeDraftId = draftId.replace(/'/g, "''");
  const sql = [
    "SELECT source,",
    "       event_payload->>'decision',",
    "       event_payload->>'previous_status',",
    "       event_payload->>'new_status',",
    "       event_payload->>'queue_type',",
    "       event_payload->>'role',",
    "       event_payload->>'review_note',",
    "       COALESCE(event_payload->>'correction_card_code', ''),",
    "       COALESCE(event_payload->>'correction_card_name', '')",
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

  const [source, decision, previousStatus, newStatus, queueType, role, reviewNote, correctionCardCode, correctionCardName] = output.split('|');
  return {
    source: source || '',
    decision: decision || '',
    previousStatus: previousStatus || '',
    newStatus: newStatus || '',
    queueType: queueType || '',
    role: role || '',
    reviewNote: reviewNote || '',
    correctionCardCode: correctionCardCode || '',
    correctionCardName: correctionCardName || '',
  };
}

async function acceptPresentationConsents(request: APIRequestContext, draftId: string): Promise<void> {
  for (const consentType of ['matching_preparation', 'employer_sharing']) {
    const response = await request.post('/seafarer/consents', {
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

async function uploadCleanApiDocument(
  request: APIRequestContext,
  draftId: string,
  formType: string,
  documentType: string,
  name: string
): Promise<Record<string, unknown>> {
  const response = await request.post(`/registration/drafts/${draftId}/documents`, {
    multipart: {
      form_type: formType,
      document_type: documentType,
      file: {
        name,
        mimeType: 'application/pdf',
        buffer: minimalPdfBuffer(`${formType}-${documentType}`),
      },
    },
  });
  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body.document.scan_status).toBe('clean');
  expect(body.document.review_status).toBe('pending_human_review');
  expect(body.document.upload_state).toBe('stored_protected');
  return body.document as Record<string, unknown>;
}

async function uploadRequiredSeafarerDocuments(request: APIRequestContext, draftId: string, prefix: string): Promise<void> {
  await uploadCleanApiDocument(request, draftId, 'seafarer', 'passport_or_id', `${prefix}-passport.pdf`);
  await uploadCleanApiDocument(request, draftId, 'seafarer', 'medical_certificate', `${prefix}-medical.pdf`);
  await uploadCleanApiDocument(request, draftId, 'seafarer', 'maritime_cv', `${prefix}-cv.pdf`);
}

async function uploadRequiredDemandDocuments(
  request: APIRequestContext,
  draftId: string,
  prefix: string,
  options: { includeVessel?: boolean } = {}
): Promise<void> {
  await uploadCleanApiDocument(request, draftId, 'employer', 'company_registration', `${prefix}-company-registration.pdf`);
  await uploadCleanApiDocument(request, draftId, 'employer', 'representative_id', `${prefix}-representative-id.pdf`);
  await uploadCleanApiDocument(request, draftId, 'employer', 'authorization_letter', `${prefix}-authorization-letter.pdf`);
  if (options.includeVessel !== false) {
    await uploadCleanApiDocument(request, draftId, 'vessel', 'vessel_particulars', `${prefix}-vessel-particulars.pdf`);
  }
}

async function submitDraftForOperatorReview(
  request: APIRequestContext,
  draftId: string,
  role: 'seafarer' | 'employer'
): Promise<Record<string, any>> {
  const submitResponse = await request.post(`/registration/drafts/${draftId}/submit-review`, {
    data: {
      role,
    },
  });
  const submitBodyText = await submitResponse.text();
  expect(submitResponse.ok(), submitBodyText).toBeTruthy();
  return JSON.parse(submitBodyText) as Record<string, any>;
}

function readLatestDocumentAudit(documentId: string, eventType: string): Record<string, string> {
  const safeDocumentId = documentId.replace(/'/g, "''");
  const safeEventType = eventType.replace(/'/g, "''");
  const sql = [
    "SELECT source,",
    "       event_payload->>'document_id',",
    "       event_payload->>'draft_id',",
    "       event_payload->>'form_type',",
    "       event_payload->>'document_type',",
    "       event_payload->>'previous_review_status',",
    "       event_payload->>'new_review_status',",
    "       event_payload->>'decision',",
    "       COALESCE(event_payload->>'review_note', ''),",
    "       event_payload->>'scan_status'",
    "FROM crewportglobal.registration_audit_events",
    `WHERE event_type = '${safeEventType}'`,
    `  AND event_payload->>'document_id' = '${safeDocumentId}'`,
    'ORDER BY created_at DESC',
    'LIMIT 1;',
  ].join(' ');

  const output = execSync(
    `PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql -qAt -F '|' -c \"${sql}\"`,
    { encoding: 'utf8' }
  ).trim();

  const [
    source,
    auditDocumentId,
    draftId,
    formType,
    documentType,
    previousReviewStatus,
    newReviewStatus,
    decision,
    reviewNote,
    scanStatus,
  ] = output.split('|');

  return {
    source: source || '',
    documentId: auditDocumentId || '',
    draftId: draftId || '',
    formType: formType || '',
    documentType: documentType || '',
    previousReviewStatus: previousReviewStatus || '',
    newReviewStatus: newReviewStatus || '',
    decision: decision || '',
    reviewNote: reviewNote || '',
    scanStatus: scanStatus || '',
  };
}

function insertBlockedUploadedDocument(draftId: string, documentId: string): void {
  const safeDraftId = draftId.replace(/'/g, "''");
  const safeDocumentId = documentId.replace(/'/g, "''");
  const sql = `
INSERT INTO crewportglobal.uploaded_documents (
  document_id,
  person_id,
  user_id,
  draft_id,
  form_type,
  document_type,
  original_filename,
  stored_filename,
  storage_root,
  storage_path,
  safe_extension,
  mime_type,
  file_size_bytes,
  sha256_hash,
  upload_state,
  review_status,
  scan_status,
  scan_checked_at,
  uploaded_by_user_id
) VALUES (
  '${safeDocumentId}'::uuid,
  '${safeDraftId}'::uuid,
  '${safeDraftId}'::uuid,
  '${safeDraftId}'::uuid,
  'seafarer',
  'passport_or_id',
  'eicar.pdf',
  '${safeDocumentId}.pdf',
  '/srv/crewportglobal/storage/documents',
  '_quarantine/seafarer/drafts/${safeDraftId}/${safeDocumentId}.pdf',
  'pdf',
  'application/pdf',
  68,
  '${createHash('sha256').update('blocked-eicar-placeholder').digest('hex')}',
  'scan_failed',
  'rejected',
  'infected',
  now(),
  '${safeDraftId}'::uuid
);
`;

  execSync(
    'PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql -v ON_ERROR_STOP=1 -q',
    { input: sql, encoding: 'utf8' }
  );
}

function insertCandidateSearchStructuredEvidence(draftId: string): void {
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
),
training_value AS (
  SELECT rv.reference_value_id
  FROM crewportglobal.reference_catalog_values rv
  JOIN crewportglobal.reference_catalogs rc ON rc.reference_catalog_id = rv.reference_catalog_id
  WHERE rc.catalog_code = 'training_course_types'
    AND lower(rv.display_name) = lower('Basic Safety Training')
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
       'TEST-COC-STRUCTURED',
       '2029-12-31'::date,
       'active',
       'verified',
       '{"test_control":"CPG-DEMAND-010"}'::jsonb
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
       'TEST-TRAINING-STRUCTURED',
       '2029-12-31'::date,
       'active',
       'verified',
       '{"test_control":"CPG-DEMAND-010"}'::jsonb
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
       'MV Structured Evidence',
       vessel_type_value.reference_value_id,
       'Bulk Carrier',
       rank_value.reference_value_id,
       'Chief Officer',
       'deck',
       '2024-01-01'::date,
       '2026-02-01'::date,
       'active',
       'verified',
       '{"test_control":"CPG-DEMAND-010"}'::jsonb
FROM profile, rank_value, vessel_type_value;
`;

  execSync(
    'PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql -v ON_ERROR_STOP=1 -q',
    { input: sql, encoding: 'utf8' }
  );
}

function cleanupApiTestData(): void {
  cleanupUploadedApiDocuments();

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
DELETE FROM crewportglobal.operator_shortlist_drafts osd
WHERE to_regclass('crewportglobal.operator_shortlist_drafts') IS NOT NULL
  AND osd.vacancy_request_id IN (SELECT vacancy_request_id FROM api_vacancies);

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

function runApiPsql(sql: string): string {
  return execSync(
    'PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql -v ON_ERROR_STOP=1 -qAt',
    { input: sql, encoding: 'utf8' }
  ).trim();
}

function addAccessGroupMembership(userId: string, groupCode: string): void {
  const safeUserId = userId.replace(/'/g, "''");
  const safeGroupCode = groupCode.replace(/'/g, "''");
  runApiPsql(`
WITH target_group AS (
  SELECT group_id
  FROM crewportglobal.access_groups
  WHERE group_code = '${safeGroupCode}'
    AND is_active = TRUE
  LIMIT 1
),
target_user AS (
  SELECT '${safeUserId}'::uuid AS user_id
)
INSERT INTO crewportglobal.access_group_members (group_id, user_id, reason)
SELECT target_group.group_id, target_user.user_id, 'playwright account team session test'
FROM target_group, target_user
WHERE NOT EXISTS (
  SELECT 1
  FROM crewportglobal.access_group_members existing
  WHERE existing.group_id = target_group.group_id
    AND existing.user_id = target_user.user_id
    AND existing.membership_state = 'active'
);
`);
}

function addReviewTeamMembership(userId: string): void {
  addAccessGroupMembership(userId, 'review_team');
}

function addOwnerMembership(userId: string): void {
  addAccessGroupMembership(userId, 'owners');
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

test('questionnaire completeness endpoint reports numbered seafarer missing items without side effects', async ({ request }) => {
  const unique = Date.now();
  const email = `api.completeness.seafarer.${unique}@example.com`;

  const createResponse = await request.post('/registration/drafts', {
    data: {
      role: 'seafarer',
      email,
      rank: 'Able Seaman',
    },
  });
  expect(createResponse.status()).toBe(201);
  const created = (await createResponse.json()) as DraftResponse;

  const completenessResponse = await request.get(`/registration/drafts/${created.draft_id}/completeness`);
  expect(completenessResponse.status()).toBe(200);
  const body = await completenessResponse.json();

  expect(body.ok).toBe(true);
  expect(body.draft_id).toBe(created.draft_id);
  expect(body.role).toBe('seafarer');
  expect(body.side_effects).toEqual({
    created_operator_task: false,
    changed_review_status: false,
    changed_publication_status: false,
    changed_document_status: false,
  });

  const completeness = body.completeness as Record<string, unknown>;
  expect(completeness.object_type).toBe('seafarer_profile');
  expect(completeness.streams).toEqual(['S']);
  expect(completeness.overall_status).toBe('incomplete');
  expect(completeness.can_save).toBe(true);
  expect(completeness.can_submit_to_operator).toBe(false);

  const missingCodes = (completeness.missing_items as Array<Record<string, unknown>>).map((item) => item.field_code);
  expect(missingCodes).toContain('S-1.1');
  expect(missingCodes).toContain('S-1.3');
  expect(missingCodes).toContain('S-12.D1');
  expect(missingCodes).toContain('S-12.D2');
  expect(missingCodes).toContain('S-12.D5');
  expect(JSON.stringify(body)).not.toContain('storage_path');
  expect(JSON.stringify(body)).not.toContain('document_metadata');
});

test('questionnaire completeness endpoint reports demand streams and required documents', async ({ request }) => {
  const unique = Date.now();
  const email = `api.completeness.employer.${unique}@example.com`;

  const createResponse = await request.post('/registration/drafts', {
    data: {
      role: 'employer',
      role_in_company: 'manager',
      email,
      full_name: 'Completeness Employer',
      company_name: `Completeness Marine ${unique}`,
      country_code: 'AE',
      registration_number: `AE-COMP-${unique}`,
    },
  });
  expect(createResponse.status()).toBe(201);
  const created = (await createResponse.json()) as DraftResponse;

  const completenessResponse = await request.get(`/registration/drafts/${created.draft_id}/completeness`);
  expect(completenessResponse.status()).toBe(200);
  const body = await completenessResponse.json();
  const completeness = body.completeness as Record<string, unknown>;

  expect(completeness.object_type).toBe('demand_questionnaire');
  expect(completeness.streams).toEqual(['E', 'V', 'R']);
  expect(completeness.overall_status).toBe('incomplete');
  expect(completeness.can_submit_to_operator).toBe(false);

  const missingCodes = (completeness.missing_items as Array<Record<string, unknown>>).map((item) => item.field_code);
  expect(missingCodes).toContain('E-4.D1');
  expect(missingCodes).toContain('E-4.D2');
  expect(missingCodes).toContain('E-4.D3');
  expect(missingCodes).toContain('V-2.1');
  expect(missingCodes).toContain('R-1.1');
  expect(missingCodes).toContain('R-3.1');

  const requiredDocuments = completeness.required_documents as Array<Record<string, unknown>>;
  expect(requiredDocuments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ document_type: 'company_registration', status: 'missing' }),
      expect.objectContaining({ document_type: 'representative_id', status: 'missing' }),
    ])
  );
  expect(body.side_effects.created_operator_task).toBe(false);
});

test('submit review gate blocks incomplete seafarer draft without creating operator task', async ({ request }) => {
  const unique = Date.now();
  const email = `api.submitgate.blocked.${unique}@example.com`;

  const createResponse = await request.post('/registration/drafts', {
    data: {
      role: 'seafarer',
      email,
      full_name: 'Blocked Submit Candidate',
    },
  });
  expect(createResponse.status()).toBe(201);
  const created = (await createResponse.json()) as DraftResponse;
  expect((created.payload.seafarer_profile as Record<string, unknown>).review_status).toBe('draft');

  const submitResponse = await request.post(`/registration/drafts/${created.draft_id}/submit-review`, {
    data: {
      role: 'seafarer',
    },
  });
  expect(submitResponse.status()).toBe(409);
  const body = await submitResponse.json();
  expect(body.error).toBe('submit_review_gate_blocked');
  expect(body.completeness.can_submit_to_operator).toBe(false);
  expect(body.side_effects).toEqual(
    expect.objectContaining({
      created_operator_task: false,
      changed_review_status: false,
      changed_publication_status: false,
    })
  );

  const queueResponse = await request.get('/operator/review-queue');
  expect(queueResponse.status()).toBe(200);
  const queueBody = await queueResponse.json();
  const queueItem = queueBody.queue.find((item: Record<string, unknown>) => item.draft_id === created.draft_id);
  expect(queueItem).toBeUndefined();
});

test('submit review gate submits complete seafarer draft after required documents are present', async ({ request }) => {
  const unique = Date.now();
  const email = `api.submitgate.seafarer.${unique}@example.com`;

  const createResponse = await request.post('/registration/drafts', {
    data: {
      role: 'seafarer',
      email,
      full_name: 'Complete Submit Candidate',
      rank: 'Able Seaman',
      department: 'deck',
      availability_status: 'available_now',
      nationality_code: 'UA',
      residence_country_code: 'AE',
      preferred_vessel_types: ['Bulk Carrier'],
      salary_expectation_usd: 3200,
      contact_phone: '+971500000123',
      document_metadata: {
        passport_expiry: '2030-01-01',
        medical_expiry: '2028-01-01',
        seafarer_workspace: {
          matching_publication: {
            data_processing_confirmation: 'i_confirm',
          },
        },
      },
    },
  });
  expect(createResponse.status()).toBe(201);
  const created = (await createResponse.json()) as DraftResponse;
  expect((created.payload.seafarer_profile as Record<string, unknown>).review_status).toBe('draft');

  await uploadRequiredSeafarerDocuments(request, created.draft_id, 'submit');

  const completenessResponse = await request.get(`/registration/drafts/${created.draft_id}/completeness?role=seafarer`);
  expect(completenessResponse.status()).toBe(200);
  const completenessBody = await completenessResponse.json();
  expect(completenessBody.completeness.can_submit_to_operator).toBe(true);

  const submitBody = await submitDraftForOperatorReview(request, created.draft_id, 'seafarer');
  expect(submitBody.submit_review_gate.gate_status).toBe('passed');
  expect(submitBody.side_effects.changed_review_status).toBe(true);
  expect((submitBody.payload.seafarer_profile as Record<string, unknown>).review_status).toBe('submitted_for_human_review');

  const queueResponse = await request.get('/operator/review-queue');
  expect(queueResponse.status()).toBe(200);
  const queueBody = await queueResponse.json();
  const queueItem = queueBody.queue.find((item: Record<string, unknown>) => item.draft_id === created.draft_id && item.queue_type === 'seafarer_profile');
  expect(queueItem).toBeTruthy();
  expect(queueItem.status).toBe('submitted_for_human_review');
});

test('seafarer document upload stores clean PDF metadata and protected file', async ({ request }) => {
  const unique = Date.now();
  const email = `api.upload.seafarer.${unique}@example.com`;
  const fileBuffer = minimalPdfBuffer('Clean seafarer passport metadata test.');

  const createResponse = await request.post('/registration/drafts', {
    data: {
      role: 'seafarer',
      email,
      full_name: 'API Upload Seafarer',
      rank: 'Chief Officer',
      department: 'deck',
      availability_status: 'available_now',
      contact_phone: '+971500000777',
    },
  });
  expect(createResponse.status()).toBe(201);
  const created = (await createResponse.json()) as DraftResponse;

  const uploadResponse = await request.post(`/registration/drafts/${created.draft_id}/documents`, {
    multipart: {
      form_type: 'seafarer',
      document_type: 'passport_or_id',
      file: {
        name: 'api-passport.pdf',
        mimeType: 'application/pdf',
        buffer: fileBuffer,
      },
    },
  });
  expect(uploadResponse.status()).toBe(201);

  const uploaded = await uploadResponse.json();
  expect(uploaded.document.scan_status).toBe('clean');
  expect(uploaded.document.review_status).toBe('pending_human_review');
  expect(uploaded.document.upload_state).toBe('stored_protected');
  expect(uploaded.document.sha256_hash).toBe(sha256(fileBuffer));

  const row = readUploadedDocumentRow(uploaded.document.document_id);
  expect(row.scanStatus).toBe('clean');
  expect(row.reviewStatus).toBe('pending_human_review');
  expect(row.uploadState).toBe('stored_protected');
  expect(row.sha256Hash).toBe(sha256(fileBuffer));
  expect(fs.existsSync(path.join(row.storageRoot, row.storagePath))).toBeTruthy();

  const listResponse = await request.get(`/registration/drafts/${created.draft_id}/documents?form_type=seafarer`);
  expect(listResponse.status()).toBe(200);
  const listed = await listResponse.json();
  expect(listed.documents).toHaveLength(1);
  expect(listed.documents[0].document_id).toBe(uploaded.document.document_id);
  expect(listed.documents[0].storage_path).toBeUndefined();
  expect(listed.documents[0].storage_root).toBeUndefined();
});

test('employer document upload stores clean PNG metadata and protected file', async ({ request }) => {
  const unique = Date.now();
  const email = `api.upload.employer.${unique}@example.com`;
  const fileBuffer = tinyPngBuffer();

  const createResponse = await request.post('/registration/drafts', {
    data: {
      role: 'employer',
      email,
      full_name: 'API Upload Employer',
      company_name: `Upload Employer ${unique}`,
      country_code: 'AE',
      registration_number: `AE-UP-${unique}`,
    },
  });
  expect(createResponse.status()).toBe(201);
  const created = (await createResponse.json()) as DraftResponse;

  const uploadResponse = await request.post(`/registration/drafts/${created.draft_id}/documents`, {
    multipart: {
      form_type: 'employer',
      document_type: 'company_registration',
      file: {
        name: 'company-registration.png',
        mimeType: 'image/png',
        buffer: fileBuffer,
      },
    },
  });
  expect(uploadResponse.status()).toBe(201);

  const uploaded = await uploadResponse.json();
  expect(uploaded.document.scan_status).toBe('clean');
  expect(uploaded.document.review_status).toBe('pending_human_review');

  const row = readUploadedDocumentRow(uploaded.document.document_id);
  expect(row.scanStatus).toBe('clean');
  expect(row.reviewStatus).toBe('pending_human_review');
  expect(row.sha256Hash).toBe(sha256(fileBuffer));
  expect(fs.existsSync(path.join(row.storageRoot, row.storagePath))).toBeTruthy();
});

test('document upload validation rejects invalid inputs and EICAR is blocked', async ({ request }) => {
  const unique = Date.now();
  const email = `api.upload.negative.${unique}@example.com`;
  const createResponse = await request.post('/registration/drafts', {
    data: {
      role: 'seafarer',
      email,
      full_name: 'API Negative Upload',
      rank: 'Second Engineer',
      department: 'engine',
    },
  });
  expect(createResponse.status()).toBe(201);
  const created = (await createResponse.json()) as DraftResponse;

  const missingType = await request.post(`/registration/drafts/${created.draft_id}/documents`, {
    multipart: {
      form_type: 'seafarer',
      file: {
        name: 'missing-type.pdf',
        mimeType: 'application/pdf',
        buffer: minimalPdfBuffer('Missing type'),
      },
    },
  });
  expect(missingType.status()).toBe(400);
  expect((await missingType.json()).error).toBe('invalid_document_type');

  const invalidForm = await request.post(`/registration/drafts/${created.draft_id}/documents`, {
    multipart: {
      form_type: 'employer',
      document_type: 'company_registration',
      file: {
        name: 'wrong-form.pdf',
        mimeType: 'application/pdf',
        buffer: minimalPdfBuffer('Wrong form'),
      },
    },
  });
  expect(invalidForm.status()).toBe(400);

  const unsupported = await request.post(`/registration/drafts/${created.draft_id}/documents`, {
    multipart: {
      form_type: 'seafarer',
      document_type: 'passport_or_id',
      file: {
        name: 'notes.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('plain text is not an allowed upload type'),
      },
    },
  });
  expect(unsupported.status()).toBe(400);
  expect((await unsupported.json()).error).toBe('unsupported_file_type');

  const tooLarge = await request.post(`/registration/drafts/${created.draft_id}/documents`, {
    multipart: {
      form_type: 'seafarer',
      document_type: 'passport_or_id',
      file: {
        name: 'too-large.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.alloc(10 * 1024 * 1024 + 1, 65),
      },
    },
  });
  expect(tooLarge.status()).toBe(413);

  const eicar = [
    'X5O!P%@AP[4\\PZX54(P^)7CC)7}',
    '$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!',
    '$H+H*',
  ].join('');
  const eicarResponse = await request.post(`/registration/drafts/${created.draft_id}/documents`, {
    multipart: {
      form_type: 'seafarer',
      document_type: 'passport_or_id',
      file: {
        name: 'eicar.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from(eicar),
      },
    },
  });
  expect(eicarResponse.status()).toBe(400);
  const blocked = await eicarResponse.json();
  expect(blocked.error).toBe('malware_detected');
});

test('operator document review queue download and decisions work for clean files', async ({ request }) => {
  const unique = Date.now();
  const email = `api.document.review.${unique}@example.com`;
  const fileBuffer = minimalPdfBuffer('Clean document review queue test.');

  const createResponse = await request.post('/registration/drafts', {
    data: {
      role: 'seafarer',
      email,
      full_name: 'API Document Review Seafarer',
      rank: 'Chief Engineer',
      department: 'engine',
    },
  });
  expect(createResponse.status()).toBe(201);
  const created = (await createResponse.json()) as DraftResponse;

  const uploadResponse = await request.post(`/registration/drafts/${created.draft_id}/documents`, {
    multipart: {
      form_type: 'seafarer',
      document_type: 'passport_or_id',
      file: {
        name: 'review-passport.pdf',
        mimeType: 'application/pdf',
        buffer: fileBuffer,
      },
    },
  });
  expect(uploadResponse.status()).toBe(201);
  const uploaded = await uploadResponse.json();
  const documentId = uploaded.document.document_id as string;

  const queueResponse = await request.get('/operator/document-review-queue');
  expect(queueResponse.status()).toBe(200);
  const queueBody = (await queueResponse.json()) as {
    ok: boolean;
    queue: Array<Record<string, unknown>>;
  };
  expect(queueBody.ok).toBe(true);
  const queueItem = queueBody.queue.find((item) => item.document_id === documentId);
  expect(queueItem).toBeTruthy();
  expect(queueItem?.scan_status).toBe('clean');
  expect(queueItem?.review_status).toBe('pending_human_review');
  expect(queueItem?.storage_path).toBeUndefined();

  const downloadResponse = await request.get(`/operator/documents/${documentId}/download`);
  expect(downloadResponse.status()).toBe(200);
  expect(downloadResponse.headers()['content-disposition']).toContain('review-passport.pdf');
  const downloadedBody = await downloadResponse.body();
  expect(sha256(downloadedBody)).toBe(sha256(fileBuffer));

  const viewAudit = readLatestDocumentAudit(documentId, 'document_viewed');
  expect(viewAudit.source).toBe('operator_document_review');
  expect(viewAudit.documentId).toBe(documentId);
  expect(viewAudit.decision).toBe('download');
  expect(viewAudit.scanStatus).toBe('clean');

  const startReview = await request.patch(`/operator/documents/${documentId}/review`, {
    data: {
      decision: 'start_review',
    },
  });
  expect(startReview.status()).toBe(200);
  const startBody = await startReview.json();
  expect(startBody.document.review_status).toBe('under_review');
  expect(startBody.previous_review_status).toBe('pending_human_review');
  expect(startBody.new_review_status).toBe('under_review');

  const needsCorrectionWithoutNote = await request.patch(`/operator/documents/${documentId}/review`, {
    data: {
      decision: 'needs_correction',
    },
  });
  expect(needsCorrectionWithoutNote.status()).toBe(400);
  expect((await needsCorrectionWithoutNote.json()).error).toBe('review_note_required');

  const note = 'Passport scan is readable, but the expiry page must be uploaded separately.';
  const needsCorrection = await request.patch(`/operator/documents/${documentId}/review`, {
    data: {
      decision: 'needs_correction',
      review_note: note,
    },
  });
  expect(needsCorrection.status()).toBe(200);
  const correctionBody = await needsCorrection.json();
  expect(correctionBody.document.review_status).toBe('correction_requested');
  expect(correctionBody.document.review_note).toBe(note);
  expect(correctionBody.previous_review_status).toBe('under_review');
  expect(correctionBody.new_review_status).toBe('correction_requested');

  const decisionAudit = readLatestDocumentAudit(documentId, 'document_review_decision_recorded');
  expect(decisionAudit.source).toBe('operator_document_review');
  expect(decisionAudit.documentId).toBe(documentId);
  expect(decisionAudit.draftId).toBe(created.draft_id);
  expect(decisionAudit.formType).toBe('seafarer');
  expect(decisionAudit.documentType).toBe('passport_or_id');
  expect(decisionAudit.previousReviewStatus).toBe('under_review');
  expect(decisionAudit.newReviewStatus).toBe('correction_requested');
  expect(decisionAudit.decision).toBe('needs_correction');
  expect(decisionAudit.reviewNote).toBe(note);
  expect(decisionAudit.scanStatus).toBe('clean');

  const listResponse = await request.get(`/registration/drafts/${created.draft_id}/documents?form_type=seafarer`);
  expect(listResponse.status()).toBe(200);
  const listed = await listResponse.json();
  const listedDocument = listed.documents.find((item: Record<string, unknown>) => item.document_id === documentId);
  expect(listedDocument.review_status).toBe('correction_requested');
  expect(listedDocument.review_note).toBe(note);
});

test('operator document review rejects infected documents from queue, download and review', async ({ request }) => {
  const unique = Date.now();
  const email = `api.document.blocked.${unique}@example.com`;
  const documentId = randomUUID();

  const createResponse = await request.post('/registration/drafts', {
    data: {
      role: 'seafarer',
      email,
      full_name: 'API Blocked Document Seafarer',
      rank: 'Second Officer',
      department: 'deck',
    },
  });
  expect(createResponse.status()).toBe(201);
  const created = (await createResponse.json()) as DraftResponse;

  insertBlockedUploadedDocument(created.draft_id, documentId);

  const queueResponse = await request.get('/operator/document-review-queue');
  expect(queueResponse.status()).toBe(200);
  const queueBody = (await queueResponse.json()) as {
    queue: Array<Record<string, unknown>>;
  };
  expect(queueBody.queue.some((item) => item.document_id === documentId)).toBe(false);

  const downloadResponse = await request.get(`/operator/documents/${documentId}/download`);
  expect(downloadResponse.status()).toBe(403);
  expect((await downloadResponse.json()).error).toBe('document_not_clean');

  const reviewResponse = await request.patch(`/operator/documents/${documentId}/review`, {
    data: {
      decision: 'start_review',
    },
  });
  expect(reviewResponse.status()).toBe(403);
  expect((await reviewResponse.json()).error).toBe('document_not_clean');
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
        required_coc_values: ['Chief Officer'],
        required_endorsement_values: ['GMDSS Endorsment'],
        required_training_values: ['Basic Safety Training', 'Advanced Fire Fighting'],
        required_visa_values: ['Schengen visa'],
        required_language_levels: [{ language: 'English', level: 'operational' }],
        required_sea_service_months: [{ months: 12, rank: 'Chief Officer', vessel_type: 'Bulk Carrier' }],
        must_have_requirements: ['Bulk carrier experience'],
        nice_to_have_requirements: ['ECDIS type-specific experience'],
        disqualifying_requirements: ['No valid medical certificate'],
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
  expect(vacancy.publication_status).toBe('draft');
  expect(vacancy.required_rank_label).toBe('Chief Officer');
  expect(typeof vacancy.required_rank_value_id).toBe('string');
  expect(vacancy.vessel_type_label).toBe('Bulk Carrier');
  expect(typeof vacancy.vessel_type_value_id).toBe('string');
  expect(Number(vacancy.contract_duration_value)).toBe(4);
  expect(vacancy.contract_duration_unit).toBe('month');
  expect(vacancy.demand_workspace).toEqual(
    expect.objectContaining({
      legacy: expect.objectContaining({
        rank_text: 'Chief Officer',
        vessel_type_text: 'Bulk Carrier',
        contract_duration_text: '4 months +/- 1',
      }),
      matching_foundation: expect.objectContaining({
        required_rank_catalog_linked: true,
        vessel_type_catalog_linked: true,
        contract_duration_structured: true,
        structured_requirements_ready: true,
      }),
      structured_requirements: expect.arrayContaining([
        expect.objectContaining({
          requirement_group: 'coc',
          requirement_label: 'Chief Officer',
        }),
        expect.objectContaining({
          requirement_group: 'training',
          requirement_label: 'Basic Safety Training',
        }),
        expect.objectContaining({
          requirement_group: 'language',
          requirement_label: 'English operational',
        }),
      ]),
    })
  );
  expect(vacancy.demand_matching_foundation).toEqual(
    expect.objectContaining({
      required_rank_catalog_linked: true,
      vessel_type_catalog_linked: true,
      contract_duration_structured: true,
      structured_requirements_ready: true,
    })
  );

  const demandRequirementItems = created.payload.demand_requirement_items as Array<Record<string, unknown>>;
  const rankRequirement = demandRequirementItems.find((item) => item.requirement_group === 'rank');
  const vesselTypeRequirement = demandRequirementItems.find((item) => item.requirement_group === 'vessel_type');
  const cocRequirement = demandRequirementItems.find((item) => item.requirement_group === 'coc');
  const endorsementRequirement = demandRequirementItems.find((item) => item.requirement_group === 'endorsement');
  const basicTrainingRequirement = demandRequirementItems.find((item) => {
    return item.requirement_group === 'training' && item.requirement_label === 'Basic Safety Training';
  });
  const visaRequirement = demandRequirementItems.find((item) => item.requirement_group === 'visa');
  const languageRequirement = demandRequirementItems.find((item) => item.requirement_group === 'language');
  const seaServiceRequirement = demandRequirementItems.find((item) => item.requirement_group === 'sea_service');
  const mustHaveGeneralRequirement = demandRequirementItems.find((item) => {
    return item.requirement_group === 'general' && item.requirement_kind === 'must_have';
  });
  const niceToHaveGeneralRequirement = demandRequirementItems.find((item) => {
    return item.requirement_group === 'general' && item.requirement_kind === 'nice_to_have';
  });
  const disqualifyingGeneralRequirement = demandRequirementItems.find((item) => {
    return item.requirement_group === 'general' && item.requirement_kind === 'disqualifying';
  });
  expect(rankRequirement).toEqual(
    expect.objectContaining({
      reference_catalog_code: 'seafarer_positions',
      requirement_label: 'Chief Officer',
      source: 'legacy_mapping',
    })
  );
  expect(typeof rankRequirement?.reference_value_id).toBe('string');
  expect(vesselTypeRequirement).toEqual(
    expect.objectContaining({
      reference_catalog_code: 'vessel_types',
      requirement_label: 'Bulk Carrier',
      source: 'legacy_mapping',
    })
  );
  expect(typeof vesselTypeRequirement?.reference_value_id).toBe('string');
  expect(cocRequirement).toEqual(
    expect.objectContaining({
      requirement_key: 'coc_must_have_chief_officer',
      reference_catalog_code: 'certificate_of_competence_types',
      requirement_label: 'Chief Officer',
      source: 'operator_structured',
    })
  );
  expect(typeof cocRequirement?.reference_value_id).toBe('string');
  expect(endorsementRequirement).toEqual(
    expect.objectContaining({
      reference_catalog_code: 'national_document_types',
      requirement_label: 'GMDSS Endorsment',
      source: 'operator_structured',
    })
  );
  expect(typeof endorsementRequirement?.reference_value_id).toBe('string');
  expect(basicTrainingRequirement).toEqual(
    expect.objectContaining({
      reference_catalog_code: 'training_course_types',
      requirement_label: 'Basic Safety Training',
      source: 'operator_structured',
    })
  );
  expect(typeof basicTrainingRequirement?.reference_value_id).toBe('string');
  expect(visaRequirement).toEqual(
    expect.objectContaining({
      reference_catalog_code: 'national_document_types',
      requirement_label: 'Schengen visa',
      source: 'operator_structured',
    })
  );
  expect(visaRequirement?.reference_value_id).toBeNull();
  expect(languageRequirement).toEqual(
    expect.objectContaining({
      requirement_label: 'English operational',
      source: 'operator_structured',
    })
  );
  expect(languageRequirement?.reference_catalog_code).toBeNull();
  expect(languageRequirement?.metadata).toEqual(
    expect.objectContaining({
      language: 'English',
      level: 'operational',
    })
  );
  expect(seaServiceRequirement).toEqual(
    expect.objectContaining({
      requirement_label: '12 months Chief Officer Bulk Carrier sea service',
      source: 'operator_structured',
    })
  );
  expect(seaServiceRequirement?.metadata).toEqual(
    expect.objectContaining({
      minimum_months: 12,
      rank: 'Chief Officer',
      vessel_type: 'Bulk Carrier',
    })
  );
  expect(mustHaveGeneralRequirement).toEqual(
    expect.objectContaining({
      requirement_label: 'Bulk carrier experience',
      source: 'operator_structured',
    })
  );
  expect(niceToHaveGeneralRequirement).toEqual(
    expect.objectContaining({
      requirement_label: 'ECDIS type-specific experience',
      source: 'operator_structured',
    })
  );
  expect(disqualifyingGeneralRequirement).toEqual(
    expect.objectContaining({
      requirement_label: 'No valid medical certificate',
      source: 'operator_structured',
    })
  );

  await uploadRequiredDemandDocuments(request, created.draft_id, 'company', { includeVessel: true });

  const submitted = (await submitDraftForOperatorReview(request, created.draft_id, 'employer')) as DraftResponse & {
    side_effects: Record<string, unknown>;
  };
  expect(submitted.side_effects.changed_publication_status).toBe(true);
  expect((submitted.payload.vacancy_request as Record<string, unknown>).publication_status).toBe('submitted_for_human_review');

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
  expect(publicVacancy?.required_rank_label).toBe('Chief Officer');
  expect(typeof publicVacancy?.required_rank_value_id).toBe('string');
  expect(publicVacancy?.vessel_type_label).toBe('Bulk Carrier');
  expect(typeof publicVacancy?.vessel_type_value_id).toBe('string');
  expect(Number(publicVacancy?.contract_duration_value)).toBe(4);
  expect(publicVacancy?.contract_duration_unit).toBe('month');
  expect(publicVacancy?.demand_matching_foundation).toEqual(
    expect.objectContaining({
      required_rank_catalog_linked: true,
      vessel_type_catalog_linked: true,
      contract_duration_structured: true,
    })
  );
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
  expect(publicVacancyDetail.vacancy.demand_workspace).toBeUndefined();

  const seafarerCreate = await request.post('/registration/drafts', {
    data: {
      role: 'seafarer',
      email: `api.vacancy.application.${unique}@example.com`,
      full_name: 'Vacancy Application Seafarer',
      rank: 'Chief Officer',
      department: 'deck',
      availability_status: 'available_now',
      document_metadata: {
        certificate_status: 'ready',
        stcw_status: 'ready',
        passport_expiry: '2029-12-31',
        medical_expiry: '2027-12-31',
        visa_status: 'ready',
      },
    },
  });
  expect(seafarerCreate.status()).toBe(201);
  const seafarer = (await seafarerCreate.json()) as DraftResponse;
  await acceptPresentationConsents(request, seafarer.draft_id);

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

  const applicationId = applicationBody.application.vacancy_application_id as string;
  const applicationQueueResponse = await request.get('/operator/review-queue');
  expect(applicationQueueResponse.status()).toBe(200);
  const applicationQueueBody = (await applicationQueueResponse.json()) as {
    queue: Array<Record<string, unknown>>;
  };
  const applicationQueueItem = applicationQueueBody.queue.find((item) => {
    return item.queue_type === 'vacancy_application' && item.queue_item_id === applicationId;
  });
  expect(applicationQueueItem).toBeTruthy();
  expect(applicationQueueItem?.status).toBe('submitted_for_human_review');

  const applicationDetailResponse = await request.get(`/operator/review-queue/vacancy-applications/${applicationId}`);
  expect(applicationDetailResponse.status()).toBe(200);
  const applicationDetail = (await applicationDetailResponse.json()) as Record<string, unknown>;
  expect(applicationDetail.queue_type).toBe('vacancy_application');
  expect((applicationDetail.application as Record<string, unknown>).candidate_note).toBe('Available now with documents ready for review.');

  const applicationStartReview = await request.patch(`/operator/review-queue/${applicationId}/status`, {
    data: {
      decision: 'start_review',
      queue_type: 'vacancy_application',
    },
  });
  expect(applicationStartReview.status()).toBe(200);
  const applicationStartReviewBody = (await applicationStartReview.json()) as Record<string, unknown>;
  expect(applicationStartReviewBody.new_status).toBe('in_review');
  expect(applicationStartReviewBody.vacancy_application_id).toBe(applicationId);

  const applicationReviewed = await request.patch(`/operator/review-queue/${applicationId}/status`, {
    data: {
      decision: 'reviewed',
      queue_type: 'vacancy_application',
      note: 'Candidate can be presented to employer.',
    },
  });
  expect(applicationReviewed.status()).toBe(200);
  const applicationReviewedBody = (await applicationReviewed.json()) as Record<string, unknown>;
  expect(applicationReviewedBody.new_status).toBe('presented');

  const employerShortlist = await request.patch(`/employer/vacancy-applications/${applicationId}/shortlist`, {
    data: {
      employer_draft_id: created.draft_id,
      shortlist_status: 'interview_requested',
      note: 'Interview proposed by employer.',
    },
  });
  expect(employerShortlist.status()).toBe(200);
  const employerShortlistBody = (await employerShortlist.json()) as Record<string, unknown>;
  expect(employerShortlistBody.employer_shortlist_status).toBe('interview_requested');
  expect(employerShortlistBody.employer_action_note).toBe('Interview proposed by employer.');

  const employerDraftAfterShortlist = await request.get(`/registration/drafts/${created.draft_id}`);
  expect(employerDraftAfterShortlist.status()).toBe(200);
  const employerDraftBody = (await employerDraftAfterShortlist.json()) as DraftResponse;
  const presentedCandidates = employerDraftBody.payload.presented_candidates as Array<Record<string, unknown>>;
  const presentedCandidate = presentedCandidates.find((item) => item.vacancy_application_id === applicationId);
  expect(presentedCandidate).toBeTruthy();
  expect(presentedCandidate?.employer_shortlist_status).toBe('interview_requested');
  expect(presentedCandidate?.employer_action_note).toBe('Interview proposed by employer.');

  const seafarerWithdraw = await request.patch(`/seafarer/vacancy-applications/${applicationId}/status`, {
    data: {
      seafarer_draft_id: seafarer.draft_id,
      action: 'not_available',
    },
  });
  expect(seafarerWithdraw.status()).toBe(200);
  const seafarerWithdrawBody = (await seafarerWithdraw.json()) as Record<string, unknown>;
  expect(seafarerWithdrawBody.previous_status).toBe('presented');
  expect(seafarerWithdrawBody.application_status).toBe('withdrawn');
  expect(seafarerWithdrawBody.action).toBe('not_available');

  const seafarerDraftAfterWithdraw = await request.get(`/registration/drafts/${seafarer.draft_id}`);
  expect(seafarerDraftAfterWithdraw.status()).toBe(200);
  const seafarerDraftBody = (await seafarerDraftAfterWithdraw.json()) as DraftResponse;
  const seafarerApplications = seafarerDraftBody.payload.vacancy_applications as Array<Record<string, unknown>>;
  const seafarerApplication = seafarerApplications.find((item) => item.vacancy_application_id === applicationId);
  expect(seafarerApplication?.application_status).toBe('withdrawn');

  const employerDraftAfterWithdraw = await request.get(`/registration/drafts/${created.draft_id}`);
  expect(employerDraftAfterWithdraw.status()).toBe(200);
  const employerDraftAfterWithdrawBody = (await employerDraftAfterWithdraw.json()) as DraftResponse;
  const candidatesAfterWithdraw = employerDraftAfterWithdrawBody.payload.presented_candidates as Array<Record<string, unknown>>;
  expect(candidatesAfterWithdraw.find((item) => item.vacancy_application_id === applicationId)).toBeFalsy();

  const withdrawnOperatorMove = await request.patch(`/operator/review-queue/${applicationId}/status`, {
    data: {
      decision: 'reviewed',
      queue_type: 'vacancy_application',
    },
  });
  expect(withdrawnOperatorMove.status()).toBe(400);

  const mismatchedEmailResponse = await request.post(`/vacancies/${vacancy.vacancy_request_id}/applications`, {
    data: {
      seafarer_draft_id: seafarer.draft_id,
      email: 'wrong.application@example.com',
    },
  });
  expect(mismatchedEmailResponse.status()).toBe(400);
});

test('operator candidate search returns read-only exact matches and blockers', async ({ request }) => {
  const unique = Date.now();
  const employerEmail = `api.match.employer.${unique}@example.com`;
  const exactEmail = `api.match.exact.${unique}@example.com`;
  const mismatchEmail = `api.match.mismatch.${unique}@example.com`;
  const documentBlockedEmail = `api.match.document.blocked.${unique}@example.com`;

  const employerCreate = await request.post('/registration/drafts', {
    data: {
      role: 'employer',
      role_in_company: 'recruiter',
      email: employerEmail,
      full_name: 'Candidate Search Employer',
      company_name: `Candidate Search Marine ${unique}`,
      country_code: 'AE',
      registration_number: `AE-MATCH-${unique}`,
      vessel: {
        vessel_name: `MV Search ${unique}`,
        vessel_type: 'Bulk Carrier',
        imo_number: `IMO${9300000 + (unique % 600000)}`,
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
        required_passport_validity_days: 180,
        required_medical_validity_days: 90,
        required_coc_values: ['Chief Officer'],
        required_training_values: ['Basic Safety Training'],
        required_sea_service_months: [{ months: 12, rank: 'Chief Officer', vessel_type: 'Bulk Carrier' }],
        requirements: 'COC, bulk carrier experience and valid medical certificate.',
      },
    },
  });
  expect(employerCreate.status()).toBe(201);
  const employer = (await employerCreate.json()) as DraftResponse;
  const vacancy = employer.payload.vacancy_request as Record<string, unknown>;
  const vacancyId = vacancy.vacancy_request_id as string;
  expect(typeof vacancy.required_rank_value_id).toBe('string');
  expect(typeof vacancy.vessel_type_value_id).toBe('string');

  const companyDecision = await request.patch(`/operator/review-queue/${employer.draft_id}/status`, {
    data: {
      decision: 'reviewed',
      queue_type: 'company_verification',
    },
  });
  expect(companyDecision.status()).toBe(200);

  const vacancyDecision = await request.patch(`/operator/review-queue/${employer.draft_id}/status`, {
    data: {
      decision: 'reviewed',
      queue_type: 'vacancy_request',
    },
  });
  expect(vacancyDecision.status()).toBe(200);

  const exactCreate = await request.post('/registration/drafts', {
    data: {
      role: 'seafarer',
      email: exactEmail,
      full_name: `Exact Candidate ${unique}`,
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
  expect(exactCreate.status()).toBe(201);
  const exact = (await exactCreate.json()) as DraftResponse;

  const exactApproval = await request.patch(`/operator/review-queue/${exact.draft_id}/status`, {
    data: {
      decision: 'reviewed',
    },
  });
  expect(exactApproval.status()).toBe(200);
  await acceptPresentationConsents(request, exact.draft_id);
  insertCandidateSearchStructuredEvidence(exact.draft_id);

  const mismatchCreate = await request.post('/registration/drafts', {
    data: {
      role: 'seafarer',
      email: mismatchEmail,
      full_name: `Mismatch Candidate ${unique}`,
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
  expect(mismatchCreate.status()).toBe(201);
  const mismatch = (await mismatchCreate.json()) as DraftResponse;

  const mismatchApproval = await request.patch(`/operator/review-queue/${mismatch.draft_id}/status`, {
    data: {
      decision: 'reviewed',
    },
  });
  expect(mismatchApproval.status()).toBe(200);

  const documentBlockedCreate = await request.post('/registration/drafts', {
    data: {
      role: 'seafarer',
      email: documentBlockedEmail,
      full_name: `Document Blocked Candidate ${unique}`,
      rank: 'Chief Officer',
      department: 'deck',
      availability_status: 'available_now',
      preferred_vessel_types: ['Bulk Carrier'],
      document_metadata: {
        certificate_status: 'ready',
        stcw_status: 'ready',
        passport_expiry: '2026-09-15',
        medical_expiry: '2026-09-01',
        visa_status: 'ready',
      },
    },
  });
  expect(documentBlockedCreate.status()).toBe(201);
  const documentBlocked = (await documentBlockedCreate.json()) as DraftResponse;

  const documentBlockedApproval = await request.patch(`/operator/review-queue/${documentBlocked.draft_id}/status`, {
    data: {
      decision: 'reviewed',
    },
  });
  expect(documentBlockedApproval.status()).toBe(200);

  const searchResponse = await request.get(`/operator/vacancies/${vacancyId}/candidate-search?limit=100`);
  expect(searchResponse.status()).toBe(200);
  const search = (await searchResponse.json()) as {
    ok: boolean;
    search_model: string;
    side_effects: Record<string, unknown>;
    demand_readiness: Record<string, unknown>;
    candidates: Array<Record<string, unknown>>;
  };

  expect(search.ok).toBe(true);
  expect(search.search_model).toBe('cpg-demand-010-structured-requirement-evaluator');
  expect(search.side_effects).toEqual(
    expect.objectContaining({
      creates_vacancy_applications: false,
      changes_statuses: false,
      employer_visible: false,
      writes_audit_events: false,
    })
  );
  expect(search.demand_readiness).toEqual(
    expect.objectContaining({
      status: 'search_ready',
      blockers: [],
    })
  );

  const exactCandidate = search.candidates.find((candidate) => candidate.candidate_user_id === exact.draft_id);
  expect(exactCandidate).toBeTruthy();
  expect(exactCandidate).toEqual(
    expect.objectContaining({
      display_name: `Exact Candidate ${unique}`,
      primary_rank: 'Chief Officer',
      match_level: 'match_ready',
      matched_dimensions: [
        'rank',
        'vessel_type',
        'availability',
        'department',
        'coc_requirements',
        'training_requirements',
        'sea_service_requirements',
        'passport_validity',
        'medical_validity',
      ],
      blockers: [],
    })
  );
  expect(exactCandidate?.dimension_results).toEqual(
    expect.objectContaining({
      rank: expect.objectContaining({
        matched: true,
        match_source: 'catalog_exact',
      }),
      vessel_type: expect.objectContaining({
        matched: true,
      }),
      availability: expect.objectContaining({
        matched: true,
      }),
      department: expect.objectContaining({
        required: true,
        matched: true,
      }),
      coc_requirements: expect.objectContaining({
        required: true,
        matched: true,
        required_count: 1,
        matched_count: 1,
      }),
      training_requirements: expect.objectContaining({
        required: true,
        matched: true,
        required_count: 1,
        matched_count: 1,
      }),
      sea_service_requirements: expect.objectContaining({
        required: true,
        matched: true,
        required_count: 1,
        matched_count: 1,
      }),
      passport_validity: expect.objectContaining({
        required: true,
        matched: true,
        minimum_validity_days: 180,
      }),
      medical_validity: expect.objectContaining({
        required: true,
        matched: true,
        minimum_validity_days: 90,
      }),
    })
  );

  const mismatchCandidate = search.candidates.find((candidate) => candidate.candidate_user_id === mismatch.draft_id);
  expect(mismatchCandidate).toBeTruthy();
  expect(mismatchCandidate?.match_level).toBe('blocked');
  const mismatchBlockerCodes = ((mismatchCandidate?.blockers || []) as Array<Record<string, unknown>>).map((blocker) => blocker.code);
  expect(mismatchBlockerCodes).toContain('rank_mismatch');
  expect(mismatchBlockerCodes).toContain('vessel_type_mismatch');

  const documentBlockedCandidate = search.candidates.find((candidate) => candidate.candidate_user_id === documentBlocked.draft_id);
  expect(documentBlockedCandidate).toBeTruthy();
  expect(documentBlockedCandidate?.match_level).toBe('blocked');
  const documentBlockerCodes = ((documentBlockedCandidate?.blockers || []) as Array<Record<string, unknown>>).map((blocker) => blocker.code);
  expect(documentBlockerCodes).toContain('passport_validity_below_requirement');
  expect(documentBlockerCodes).toContain('medical_validity_below_requirement');
  expect(documentBlockedCandidate?.dimension_results).toEqual(
    expect.objectContaining({
      passport_validity: expect.objectContaining({
        required: true,
        matched: false,
        minimum_validity_days: 180,
      }),
      medical_validity: expect.objectContaining({
        required: true,
        matched: false,
        minimum_validity_days: 90,
      }),
    })
  );

  const serialized = JSON.stringify(search);
  expect(serialized).not.toContain(exactEmail);
  expect(serialized).not.toContain(mismatchEmail);
  expect(serialized).not.toContain(documentBlockedEmail);
  expect(serialized).not.toContain('contact_email');
  expect(serialized).not.toContain('contact_phone');
  expect(serialized).not.toContain('"document_metadata":');

  const blockedShortlistResponse = await request.post(`/operator/vacancies/${vacancyId}/shortlist-drafts`, {
    data: {
      candidates: [
        {
          candidate_user_id: mismatch.draft_id,
          operator_decision: 'include',
          operator_note: 'Attempting to include a blocked candidate must fail.',
        },
      ],
    },
  });
  expect(blockedShortlistResponse.status()).toBe(409);
  const blockedShortlist = (await blockedShortlistResponse.json()) as Record<string, unknown>;
  expect(blockedShortlist).toEqual(
    expect.objectContaining({
      ok: false,
      error: 'shortlist_guard_blocked',
      side_effects: expect.objectContaining({
        created_internal_shortlist_draft: false,
        changes_statuses: false,
        employer_visible: false,
      }),
    })
  );
  expect(JSON.stringify(blockedShortlist)).toContain('candidate_search_blocked');
  expect(JSON.stringify(blockedShortlist)).toContain('structured_requirement_unmatched');

  const shortlistResponse = await request.post(`/operator/vacancies/${vacancyId}/shortlist-drafts`, {
    data: {
      candidates: [
        {
          candidate_user_id: exact.draft_id,
          operator_decision: 'include',
          operator_note: 'Structured evidence satisfies current demand requirements.',
        },
        {
          candidate_user_id: mismatch.draft_id,
          operator_decision: 'hold',
          operator_note: 'Keep visible internally as a blocked comparison candidate.',
        },
      ],
    },
  });
  expect(shortlistResponse.status()).toBe(201);
  const shortlist = (await shortlistResponse.json()) as {
    ok: boolean;
    shortlist_draft: Record<string, unknown>;
    side_effects: Record<string, unknown>;
  };
  expect(shortlist.ok).toBe(true);
  expect(shortlist.side_effects).toEqual(
    expect.objectContaining({
      created_internal_shortlist_draft: true,
      creates_vacancy_applications: false,
      changes_statuses: false,
      employer_visible: false,
    })
  );
  expect(shortlist.shortlist_draft).toEqual(
    expect.objectContaining({
      vacancy_request_id: vacancyId,
      search_model: 'cpg-demand-010-structured-requirement-evaluator',
      draft_status: 'needs_review',
      employer_visible: false,
    })
  );
  const shortlistCandidates = shortlist.shortlist_draft.candidates as Array<Record<string, unknown>>;
  expect(shortlistCandidates).toHaveLength(2);
  const includedShortlistCandidate = shortlistCandidates.find((candidate) => candidate.candidate_user_id === exact.draft_id);
  const heldShortlistCandidate = shortlistCandidates.find((candidate) => candidate.candidate_user_id === mismatch.draft_id);
  expect(includedShortlistCandidate).toEqual(
    expect.objectContaining({
      operator_decision: 'include',
      employer_visible: false,
      approval_guard_result: expect.objectContaining({
        approval_status: 'ready_for_internal_shortlist',
      }),
    })
  );
  expect(heldShortlistCandidate).toEqual(
    expect.objectContaining({
      operator_decision: 'hold',
      employer_visible: false,
      approval_guard_result: expect.objectContaining({
        approval_status: 'blocked',
      }),
    })
  );
  expect(JSON.stringify(heldShortlistCandidate)).toContain('candidate_search_blocked');

  const shortlistDraftId = shortlist.shortlist_draft.shortlist_draft_id as string;
  const shortlistReadResponse = await request.get(`/operator/shortlist-drafts/${shortlistDraftId}`);
  expect(shortlistReadResponse.status()).toBe(200);
  const shortlistRead = await shortlistReadResponse.json();
  expect(shortlistRead.shortlist_draft.shortlist_draft_id).toBe(shortlistDraftId);

  const approvalResponse = await request.patch(`/operator/shortlist-drafts/${shortlistDraftId}/approval`, {
    data: {
      decision: 'approve_internal',
      operator_note: 'Internal shortlist is ready for the next controlled workflow step.',
    },
  });
  expect(approvalResponse.status()).toBe(200);
  const approval = await approvalResponse.json();
  expect(approval).toEqual(
    expect.objectContaining({
      ok: true,
      internal_approval_guard: expect.objectContaining({
        internal_approval_status: 'ready_for_internal_approval',
        employer_visibility: false,
        creates_vacancy_applications: false,
        changes_application_statuses: false,
      }),
      side_effects: expect.objectContaining({
        changed_internal_shortlist_status: true,
        creates_vacancy_applications: false,
        changes_application_statuses: false,
        employer_visible: false,
      }),
    })
  );
  expect(approval.shortlist_draft).toEqual(
    expect.objectContaining({
      shortlist_draft_id: shortlistDraftId,
      draft_status: 'approved_internal',
      employer_visible: false,
    })
  );
  expect(approval.computed_operations).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        operation_code: 'create_review_applications',
        operation_status: 'available',
        required_access: expect.objectContaining({
          target_group_code: 'review_team',
          target_role_code: 'reviewer',
          required_permission_code: 'start_human_review',
          permission_boundary: 'temporary_operator_token_compatibility',
        }),
      }),
    ])
  );

  const reviewApplicationsResponse = await request.post(`/operator/shortlist-drafts/${shortlistDraftId}/review-applications`, {
    data: {
      operator_note: 'Stage included shortlist candidates for vacancy application review only.',
    },
  });
  expect(reviewApplicationsResponse.status()).toBe(201);
  const reviewApplications = await reviewApplicationsResponse.json();
  expect(reviewApplications).toEqual(
    expect.objectContaining({
      ok: true,
      shortlist_draft_id: shortlistDraftId,
      vacancy_request_id: vacancyId,
      review_application_guard: expect.objectContaining({
        review_application_status: 'ready_for_review_application_staging',
        employer_visibility: false,
        moves_applications_to_presented: false,
        presented_to_employer: false,
      }),
      side_effects: expect.objectContaining({
        creates_vacancy_applications: true,
        created_review_applications_count: 1,
        moves_applications_to_presented: false,
        presented_to_employer: false,
        employer_visible: false,
      }),
    })
  );
  expect(reviewApplications.applications).toHaveLength(1);
  expect(reviewApplications.applications[0]).toEqual(
    expect.objectContaining({
      candidate_user_id: exact.draft_id,
      vacancy_request_id: vacancyId,
      application_status: 'submitted_for_human_review',
      action: 'created',
      employer_visible: false,
      presented_to_employer: false,
    })
  );
  expect(reviewApplications.computed_operations).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        operation_code: 'review_candidate_presentation',
        operation_status: 'available',
        required_access: expect.objectContaining({
          target_group_code: 'review_team',
          target_role_code: 'reviewer',
          required_permission_code: 'approve_candidate_presentation',
          permission_boundary: 'temporary_operator_token_compatibility',
        }),
      }),
    ])
  );

  const holdOnlyResponse = await request.post(`/operator/vacancies/${vacancyId}/shortlist-drafts`, {
    data: {
      candidates: [
        {
          candidate_user_id: mismatch.draft_id,
          operator_decision: 'hold',
          operator_note: 'Hold-only draft should not be internally approvable.',
        },
      ],
    },
  });
  expect(holdOnlyResponse.status()).toBe(201);
  const holdOnly = await holdOnlyResponse.json();
  const holdOnlyDraftId = holdOnly.shortlist_draft.shortlist_draft_id as string;
  const holdOnlyReviewApplicationsResponse = await request.post(`/operator/shortlist-drafts/${holdOnlyDraftId}/review-applications`, {
    data: {},
  });
  expect(holdOnlyReviewApplicationsResponse.status()).toBe(409);
  const holdOnlyReviewApplications = await holdOnlyReviewApplicationsResponse.json();
  expect(holdOnlyReviewApplications).toEqual(
    expect.objectContaining({
      ok: false,
      error: 'shortlist_review_application_guard_blocked',
      review_application_guard: expect.objectContaining({
        review_application_status: 'blocked',
      }),
      side_effects: expect.objectContaining({
        creates_vacancy_applications: false,
        moves_applications_to_presented: false,
        presented_to_employer: false,
        employer_visible: false,
      }),
    })
  );
  expect(JSON.stringify(holdOnlyReviewApplications)).toContain('shortlist_draft_not_approved_internal');

  const holdOnlyApprovalResponse = await request.patch(`/operator/shortlist-drafts/${holdOnlyDraftId}/approval`, {
    data: {
      decision: 'approve_internal',
    },
  });
  expect(holdOnlyApprovalResponse.status()).toBe(409);
  const holdOnlyApproval = await holdOnlyApprovalResponse.json();
  expect(holdOnlyApproval).toEqual(
    expect.objectContaining({
      ok: false,
      error: 'shortlist_internal_approval_blocked',
      internal_approval_guard: expect.objectContaining({
        internal_approval_status: 'blocked',
      }),
      side_effects: expect.objectContaining({
        changed_internal_shortlist_status: false,
        creates_vacancy_applications: false,
        changes_application_statuses: false,
        employer_visible: false,
      }),
    })
  );
  expect(JSON.stringify(holdOnlyApproval)).toContain('no_included_candidates');

  const serializedShortlist = JSON.stringify(shortlistRead);
  expect(serializedShortlist).not.toContain(exactEmail);
  expect(serializedShortlist).not.toContain(mismatchEmail);
  expect(serializedShortlist).not.toContain(documentBlockedEmail);
  expect(serializedShortlist).not.toContain('contact_email');
  expect(serializedShortlist).not.toContain('contact_phone');
  expect(serializedShortlist).not.toContain('"document_metadata":');

  const serializedApproval = JSON.stringify(approval);
  expect(serializedApproval).not.toContain(exactEmail);
  expect(serializedApproval).not.toContain(mismatchEmail);
  expect(serializedApproval).not.toContain(documentBlockedEmail);
  expect(serializedApproval).not.toContain('contact_email');
  expect(serializedApproval).not.toContain('contact_phone');
  expect(serializedApproval).not.toContain('"document_metadata":');

  const serializedReviewApplications = JSON.stringify(reviewApplications);
  expect(serializedReviewApplications).not.toContain(exactEmail);
  expect(serializedReviewApplications).not.toContain(mismatchEmail);
  expect(serializedReviewApplications).not.toContain(documentBlockedEmail);
  expect(serializedReviewApplications).not.toContain('contact_email');
  expect(serializedReviewApplications).not.toContain('contact_phone');
  expect(serializedReviewApplications).not.toContain('"document_metadata":');

  const employerDraftResponse = await request.get(`/registration/drafts/${employer.draft_id}`);
  expect(employerDraftResponse.status()).toBe(200);
  const employerDraft = (await employerDraftResponse.json()) as DraftResponse;
  const presentedCandidates = employerDraft.payload.presented_candidates as Array<Record<string, unknown>>;
  expect(presentedCandidates).toEqual([]);

  const presentationApplicationId = reviewApplications.applications[0].vacancy_application_id as string;
  const presentationResponse = await request.patch(`/operator/vacancy-applications/${presentationApplicationId}/presentation-review`, {
    data: {
      note: 'Candidate presentation approved from task-specific endpoint.',
    },
  });
  expect(presentationResponse.status()).toBe(200);
  const presentation = await presentationResponse.json();
  expect(presentation).toEqual(
    expect.objectContaining({
      ok: true,
      vacancy_application_id: presentationApplicationId,
      decision: 'reviewed',
      queue_type: 'vacancy_application',
      previous_status: 'submitted_for_human_review',
      new_status: 'presented',
      side_effects: expect.objectContaining({
        creates_vacancy_applications: false,
        changes_application_statuses: true,
        moves_applications_to_presented: true,
        presented_to_employer: true,
        employer_visible: true,
      }),
      operation_access: expect.objectContaining({
        operation_code: 'review_candidate_presentation',
        required_permission_code: 'approve_candidate_presentation',
      }),
    })
  );
  expect((presentation.approval_guard as Record<string, unknown>).approval_status).toBe('approved_for_employer_presentation');
  const serializedPresentation = JSON.stringify(presentation);
  expect(serializedPresentation).not.toContain(exactEmail);
  expect(serializedPresentation).not.toContain('contact_email');
  expect(serializedPresentation).not.toContain('contact_phone');
  expect(serializedPresentation).not.toContain('"document_metadata":');

  const employerDraftAfterPresentationResponse = await request.get(`/registration/drafts/${employer.draft_id}`);
  expect(employerDraftAfterPresentationResponse.status()).toBe(200);
  const employerDraftAfterPresentation = (await employerDraftAfterPresentationResponse.json()) as DraftResponse;
  const presentedCandidatesAfter = employerDraftAfterPresentation.payload.presented_candidates as Array<Record<string, unknown>>;
  const presentedCandidate = presentedCandidatesAfter.find((item) => item.vacancy_application_id === presentationApplicationId);
  expect(presentedCandidate).toBeTruthy();
  const serializedEmployerCandidate = JSON.stringify(presentedCandidate);
  expect(serializedEmployerCandidate).not.toContain(exactEmail);
  expect(serializedEmployerCandidate).not.toContain('contact_email');
  expect(serializedEmployerCandidate).not.toContain('contact_phone');
  expect(serializedEmployerCandidate).not.toContain('"document_metadata":');
});

test('operator review queue returns submitted seafarer and company drafts', async ({ request }) => {
  const unique = Date.now();
  const seafarerEmail = `api.queue.seafarer.${unique}@example.com`;
  const employerEmail = `api.queue.employer.${unique}@example.com`;
  const vacancyTitle = `Queue Request Chief Officer ${unique}`;

  const seafarerCreate = await request.post('/registration/drafts', {
    data: {
      role: 'seafarer',
      email: seafarerEmail,
      full_name: 'Queue Seafarer',
      rank: 'Able Seaman',
      department: 'deck',
      availability_status: 'available_now',
      nationality_code: 'UA',
      residence_country_code: 'AE',
      preferred_vessel_types: ['Bulk Carrier'],
      salary_expectation_usd: 3200,
      contact_phone: '+971500000221',
      document_metadata: {
        passport_expiry: '2030-01-01',
        medical_expiry: '2028-01-01',
        seafarer_workspace: {
          matching_publication: {
            data_processing_confirmation: 'i_confirm',
          },
        },
      },
    },
  });
  expect(seafarerCreate.status()).toBe(201);
  const seafarer = (await seafarerCreate.json()) as DraftResponse;
  await uploadRequiredSeafarerDocuments(request, seafarer.draft_id, 'queue-seafarer');
  await submitDraftForOperatorReview(request, seafarer.draft_id, 'seafarer');

  const companyCreate = await request.post('/registration/drafts', {
    data: {
      role: 'employer',
      role_in_company: 'manager',
      email: employerEmail,
      full_name: 'Queue Employer',
      company_name: 'Queue Marine LLC',
      country_code: 'AE',
      registration_number: `AE-QUEUE-${unique}`,
      vessel: {
        vessel_name: 'MV Queue Review',
        vessel_type: 'Bulk Carrier',
        imo_number: 'IMO9304321',
      },
      vacancy: {
        vacancy_title: vacancyTitle,
        rank: 'Chief Officer',
        department: 'deck',
        vessel_type: 'Bulk Carrier',
        join_date: '2026-08-15',
        contract_duration: '4 months',
        salary_min_usd: 6500,
        salary_max_usd: 7200,
        currency: 'USD',
        requirements: 'Synthetic queue visibility test.',
      },
    },
  });
  expect(companyCreate.status()).toBe(201);
  const company = (await companyCreate.json()) as DraftResponse;
  await uploadRequiredDemandDocuments(request, company.draft_id, 'queue-employer', { includeVessel: true });
  await submitDraftForOperatorReview(request, company.draft_id, 'employer');

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

  const hasSeafarer = queueBody.queue.some((item) => {
    return item.queue_type === 'seafarer_profile' && item.role === 'seafarer' && item.draft_id === seafarer.draft_id;
  });
  const hasCompany = queueBody.queue.some((item) => {
    return item.queue_type === 'company_verification' && item.role === 'employer' && item.draft_id === company.draft_id;
  });
  const hasVacancy = queueBody.queue.some((item) => {
    return item.queue_type === 'vacancy_request' && item.role === 'employer' && JSON.stringify(item).includes(vacancyTitle);
  });

  expect(hasSeafarer).toBe(true);
  expect(hasCompany).toBe(true);
  expect(hasVacancy).toBe(true);
});

test('operator queue accepts account session with review team membership', async () => {
  const unique = Date.now();
  const email = `api.account.team.${unique}@example.com`;
  const title = `Account Session Electrician ${unique}`;

  const accountContext = await playwrightRequest.newContext({
    baseURL: 'http://127.0.0.1:38124/api/v1',
    extraHTTPHeaders: {
      Authorization: '',
      'X-CPG-Operator-Token': '',
    },
  });

  const createResponse = await accountContext.post('/auth/register-password', {
    data: {
      role: 'employer',
      role_in_company: 'crewing manager',
      email,
      full_name: 'Account Session Reviewer',
      password: 'CrewPortGlobal123!',
      confirm_password: 'CrewPortGlobal123!',
      terms_accepted: true,
      consent_accepted: true,
      company_name: 'Account Session Marine LLC',
      country_code: 'AE',
      registration_number: `AE-ACCOUNT-${unique}`,
      vacancy: {
        vacancy_title: title,
        rank: 'Electrician',
        department: 'engine',
        vessel_type: 'Container Ship',
        join_date: '2026-10-10',
        contract_duration: '4 months',
        salary_min_usd: 4200,
        salary_max_usd: 4800,
        currency: 'USD',
        requirements: 'Synthetic account-session operator access test.',
      },
    },
  });
  expect(createResponse.status()).toBe(201);
  const created = (await createResponse.json()) as DraftResponse & { user: { user_id: string } };
  const accountUserId = created.user.user_id;
  addReviewTeamMembership(accountUserId);
  const accessSnapshot = runApiPsql(`
SELECT
  COALESCE(string_agg(DISTINCT g.group_code, ',' ORDER BY g.group_code), ''),
  COALESCE(string_agg(DISTINCT p.permission_code, ',' ORDER BY p.permission_code), '')
FROM crewportglobal.users u
LEFT JOIN crewportglobal.access_group_members gm
  ON gm.user_id = u.user_id
 AND gm.membership_state = 'active'
LEFT JOIN crewportglobal.access_groups g
  ON g.group_id = gm.group_id
 AND g.is_active = TRUE
LEFT JOIN crewportglobal.access_group_roles gr
  ON gr.group_id = g.group_id
 AND gr.assignment_state = 'active'
LEFT JOIN crewportglobal.access_roles r
  ON r.role_id = gr.role_id
 AND r.is_active = TRUE
LEFT JOIN crewportglobal.access_role_permissions rp
  ON rp.role_id = r.role_id
LEFT JOIN crewportglobal.access_permissions p
  ON p.permission_id = rp.permission_id
 AND p.is_active = TRUE
WHERE u.user_id = '${accountUserId.replace(/'/g, "''")}'::uuid;
`);
  expect(accessSnapshot).toContain('review_team');
  expect(accessSnapshot).toContain('view_review_queue');

  const meResponse = await accountContext.get('/auth/me');
  const meBody = await meResponse.text();
  expect(meResponse.ok(), meBody).toBeTruthy();
  expect(JSON.parse(meBody).authenticated).toBe(true);

  await uploadRequiredDemandDocuments(accountContext, created.draft_id, 'account-session', { includeVessel: false });
  const submitBody = await submitDraftForOperatorReview(accountContext, created.draft_id, 'employer');
  expect(submitBody.submit_review_gate.gate_status).toBe('passed');

  const queueResponse = await accountContext.get('/operator/review-queue');
  const queueBody = await queueResponse.text();
  expect(queueResponse.ok(), queueBody).toBeTruthy();
  const queue = JSON.parse(queueBody) as {
    access_model: string;
    actor_user_id: string;
    queue: Array<Record<string, unknown>>;
  };
  expect(queue.access_model).toBe('account_team_session');
  expect(queue.actor_user_id).toBe(accountUserId);
  expect(JSON.stringify(queue.queue)).toContain(title);

  const tasksResponse = await accountContext.get('/team/workbench/tasks');
  const tasksBody = await tasksResponse.text();
  expect(tasksResponse.ok(), tasksBody).toBeTruthy();
  const tasks = JSON.parse(tasksBody) as { tasks: Array<Record<string, unknown>> };
  expect(JSON.stringify(tasks.tasks)).toContain(title);

  await accountContext.dispose();
});

test('operator can request vacancy deletion without physical delete', async ({ request }) => {
  const unique = Date.now();
  const email = `api.vacancy.delete.${unique}@example.com`;

  const createResponse = await request.post('/registration/drafts', {
    data: {
      role: 'employer',
      role_in_company: 'manager',
      email,
      full_name: 'Delete Request API Employer',
      company_name: 'Delete Request Marine LLC',
      country_code: 'AE',
      registration_number: `AE-DEL-${unique}`,
      vessel: {
        vessel_name: 'MV Delete Request',
        vessel_type: 'Bulk Carrier',
        imo_number: 'IMO9301234',
      },
      vacancy: {
        vacancy_title: `Delete Request Bosun ${unique}`,
        rank: 'Bosun',
        department: 'deck',
        vessel_type: 'Bulk Carrier',
        join_date: '2026-09-20',
        contract_duration: '3 months',
        salary_min_usd: 3800,
        salary_max_usd: 4200,
        currency: 'USD',
        requirements: 'Synthetic vacancy deletion request test.',
      },
    },
  });
  expect(createResponse.status()).toBe(201);
  const created = (await createResponse.json()) as DraftResponse;
  const vacancy = created.payload.vacancy_request as Record<string, unknown>;
  const vacancyId = vacancy.vacancy_request_id as string;

  await uploadRequiredDemandDocuments(request, created.draft_id, 'delete-request', { includeVessel: true });
  await submitDraftForOperatorReview(request, created.draft_id, 'employer');

  const queueBeforeResponse = await request.get('/operator/review-queue');
  expect(queueBeforeResponse.status()).toBe(200);
  const queueBefore = (await queueBeforeResponse.json()) as { queue: Array<Record<string, unknown>> };
  expect(
    queueBefore.queue.some((item) => item.queue_type === 'vacancy_request' && item.queue_item_id === vacancyId)
  ).toBe(true);

  const deletionResponse = await request.patch(`/operator/vacancy-requests/${vacancyId}/deletion-request`, {
    data: {
      note: 'Synthetic operator deletion request requiring manager confirmation.',
    },
  });
  expect(deletionResponse.status()).toBe(200);
  const deletionBody = (await deletionResponse.json()) as Record<string, any>;
  expect(deletionBody.ok).toBe(true);
  expect(deletionBody.new_status).toBe('closed');
  expect(deletionBody.deletion_request).toEqual(
    expect.objectContaining({
      status: 'pending_manager_confirmation',
      requires_manager_confirmation: true,
      physical_delete: false,
      hidden_from_operator_queue: true,
    })
  );
  expect(deletionBody.side_effects).toEqual(
    expect.objectContaining({
      hidden_from_operator_queue: true,
      requires_manager_confirmation: true,
      physical_delete: false,
      employer_visible: false,
    })
  );

  const safeVacancyId = vacancyId.replace(/'/g, "''");
  const storedDeletion = execSync(
    `PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql -qAt -F '|' -c "SELECT publication_status, demand_workspace->'deletion_request'->>'status', demand_workspace->'deletion_request'->>'manager_confirmation_status' FROM crewportglobal.vacancy_requests WHERE vacancy_request_id = '${safeVacancyId}'::uuid LIMIT 1;"`,
    { encoding: 'utf8' }
  ).trim();
  expect(storedDeletion).toBe('closed|pending_manager_confirmation|pending');

  const auditCount = Number(execSync(
    `PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql -qAt -c "SELECT count(*) FROM crewportglobal.registration_audit_events WHERE event_type = 'operator_vacancy_deletion_requested' AND event_payload->>'vacancy_request_id' = '${safeVacancyId}';"`,
    { encoding: 'utf8' }
  ).trim());
  expect(auditCount).toBeGreaterThan(0);

  const queueAfterResponse = await request.get('/operator/review-queue');
  expect(queueAfterResponse.status()).toBe(200);
  const queueAfter = (await queueAfterResponse.json()) as { queue: Array<Record<string, unknown>> };
  expect(
    queueAfter.queue.some((item) => item.queue_type === 'vacancy_request' && item.queue_item_id === vacancyId)
  ).toBe(false);

  const ownerContext = await playwrightRequest.newContext({
    baseURL: 'http://127.0.0.1:38124/api/v1',
    extraHTTPHeaders: {
      Authorization: '',
      'X-CPG-Operator-Token': '',
    },
  });

  try {
    const ownerResponse = await ownerContext.post('/auth/register-password', {
      data: {
        role: 'employer',
        role_in_company: 'manager',
        email: `api.owner.delete.${unique}@example.com`,
        full_name: 'Deletion Confirmation Owner',
        password: 'CrewPortGlobal123!',
        confirm_password: 'CrewPortGlobal123!',
        terms_accepted: true,
        consent_accepted: true,
        company_name: 'Deletion Owner Marine LLC',
        country_code: 'AE',
        registration_number: `AE-OWNER-DEL-${unique}`,
      },
    });
    expect(ownerResponse.status()).toBe(201);
    const owner = (await ownerResponse.json()) as { user: { user_id: string } };
    addOwnerMembership(owner.user.user_id);

    const tasksResponse = await ownerContext.get('/team/workbench/tasks');
    const tasksBody = await tasksResponse.text();
    expect(tasksResponse.ok(), tasksBody).toBeTruthy();
    const tasks = JSON.parse(tasksBody) as { tasks: Array<Record<string, any>> };
    const deletionTask = tasks.tasks.find((task) => task.operation_code === 'confirm_vacancy_deletion' && task.record_id === vacancyId);
    expect(deletionTask).toEqual(
      expect.objectContaining({
        task_type: 'vacancy_deletion_confirmation',
        operation_code: 'confirm_vacancy_deletion',
        record_type: 'vacancy_deletion_request',
        record_id: vacancyId,
      })
    );

    const detailResponse = await ownerContext.get(`/operator/vacancy-requests/${vacancyId}/deletion-review`);
    const detailBody = await detailResponse.text();
    expect(detailResponse.ok(), detailBody).toBeTruthy();
    const detail = JSON.parse(detailBody) as Record<string, any>;
    expect(detail.deletion_request).toEqual(
      expect.objectContaining({
        status: 'pending_manager_confirmation',
        manager_confirmation_status: 'pending',
      })
    );
    expect(JSON.stringify(detail.computed_operations)).toContain('confirm_vacancy_deletion');
    expect(JSON.stringify(detail.computed_operations)).toContain('reject_vacancy_deletion');

    const rejectResponse = await ownerContext.patch(`/operator/vacancy-requests/${vacancyId}/deletion-review`, {
      data: {
        decision: 'reject',
        note: 'Synthetic manager rejects deletion and restores workflow.',
      },
    });
    const rejectBodyText = await rejectResponse.text();
    expect(rejectResponse.ok(), rejectBodyText).toBeTruthy();
    const rejectBody = JSON.parse(rejectBodyText) as Record<string, any>;
    expect(rejectBody.decision).toBe('reject');
    expect(rejectBody.deletion_request).toEqual(
      expect.objectContaining({
        status: 'rejected_by_manager',
        manager_confirmation_status: 'rejected',
        physical_delete: false,
        hidden_from_operator_queue: false,
      })
    );
    expect(rejectBody.actor_context.actor_user_id).toBe(owner.user.user_id);

    const restoredDeletion = execSync(
      `PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql -qAt -F '|' -c "SELECT publication_status, demand_workspace->'deletion_request'->>'status', demand_workspace->'deletion_request'->>'manager_confirmation_status' FROM crewportglobal.vacancy_requests WHERE vacancy_request_id = '${safeVacancyId}'::uuid LIMIT 1;"`,
      { encoding: 'utf8' }
    ).trim();
    expect(restoredDeletion).toBe(`${deletionBody.previous_status}|rejected_by_manager|rejected`);

    const queueRestoredResponse = await request.get('/operator/review-queue');
    expect(queueRestoredResponse.status()).toBe(200);
    const queueRestored = (await queueRestoredResponse.json()) as { queue: Array<Record<string, unknown>> };
    expect(
      queueRestored.queue.some((item) => item.queue_type === 'vacancy_request' && item.queue_item_id === vacancyId)
    ).toBe(true);

    const secondDeletionResponse = await request.patch(`/operator/vacancy-requests/${vacancyId}/deletion-request`, {
      data: {
        note: 'Synthetic second deletion request for manager confirmation.',
      },
    });
    expect(secondDeletionResponse.status()).toBe(200);

    const confirmResponse = await ownerContext.patch(`/operator/vacancy-requests/${vacancyId}/deletion-review`, {
      data: {
        decision: 'confirm',
        note: 'Synthetic manager confirms deletion.',
      },
    });
    const confirmBodyText = await confirmResponse.text();
    expect(confirmResponse.ok(), confirmBodyText).toBeTruthy();
    const confirmBody = JSON.parse(confirmBodyText) as Record<string, any>;
    expect(confirmBody.decision).toBe('confirm');
    expect(confirmBody.new_status).toBe('closed');
    expect(confirmBody.deletion_request).toEqual(
      expect.objectContaining({
        status: 'confirmed_deleted',
        manager_confirmation_status: 'confirmed',
        physical_delete: false,
        hidden_from_operator_queue: true,
      })
    );
    expect(confirmBody.actor_context.actor_user_id).toBe(owner.user.user_id);

    const confirmedDeletion = execSync(
      `PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql -qAt -F '|' -c "SELECT publication_status, demand_workspace->'deletion_request'->>'status', demand_workspace->'deletion_request'->>'manager_confirmation_status' FROM crewportglobal.vacancy_requests WHERE vacancy_request_id = '${safeVacancyId}'::uuid LIMIT 1;"`,
      { encoding: 'utf8' }
    ).trim();
    expect(confirmedDeletion).toBe('closed|confirmed_deleted|confirmed');

    const managerAuditCount = Number(execSync(
      `PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql -qAt -c "SELECT count(*) FROM crewportglobal.registration_audit_events WHERE event_type IN ('manager_vacancy_deletion_confirmed', 'manager_vacancy_deletion_rejected') AND event_payload->>'vacancy_request_id' = '${safeVacancyId}' AND event_payload->'actor_context'->>'actor_user_id' = '${owner.user.user_id.replace(/'/g, "''")}';"`,
      { encoding: 'utf8' }
    ).trim());
    expect(managerAuditCount).toBeGreaterThanOrEqual(2);
  } finally {
    await ownerContext.dispose();
  }
});

test('operator decision endpoint updates draft review status', async ({ request }) => {
  const unique = Date.now();
  const email = `api.operator.decision.${unique}@example.com`;

  const createResponse = await request.post('/registration/drafts', {
    data: {
      role: 'seafarer',
      email,
      full_name: 'Operator Decision Seafarer',
      rank: 'Able Seaman',
      department: 'deck',
      availability_status: 'available_now',
      nationality_code: 'UA',
      residence_country_code: 'AE',
      preferred_vessel_types: ['Bulk Carrier'],
      salary_expectation_usd: 3200,
      contact_phone: '+971500000331',
      document_metadata: {
        passport_expiry: '2030-01-01',
        medical_expiry: '2028-01-01',
        seafarer_workspace: {
          matching_publication: {
            data_processing_confirmation: 'i_confirm',
          },
        },
      },
    },
  });
  expect(createResponse.status()).toBe(201);

  const created = (await createResponse.json()) as DraftResponse;
  await uploadRequiredSeafarerDocuments(request, created.draft_id, 'operator-decision');
  await submitDraftForOperatorReview(request, created.draft_id, 'seafarer');

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
  const reviewedQueueItem = queueBody.queue.find((item) => item.draft_id === created.draft_id);
  expect(reviewedQueueItem).toBeTruthy();
  expect(reviewedQueueItem?.status).toBe('approved');
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
      correction_card_code: 'qualifications',
    },
  });
  expect(needsCorrectionWithNote.status()).toBe(200);
  const correctionBody = (await needsCorrectionWithNote.json()) as Record<string, unknown>;
  expect(correctionBody.ok).toBe(true);
  expect(correctionBody.new_status).toBe('rejected');
  expect(correctionBody.review_note).toBe(note);
  expect(correctionBody.correction_card_code).toBe('qualifications');
  expect(correctionBody.correction_card_name).toBe('Qualifications and training');

  const audit = readLatestOperatorAuditForDraft(created.draft_id);
  expect(audit.source).toBe('operator_review_queue');
  expect(audit.decision).toBe('needs_correction');
  expect(audit.previousStatus).toBe('in_review');
  expect(audit.newStatus).toBe('rejected');
  expect(audit.queueType).toBe('seafarer_profile');
  expect(audit.role).toBe('seafarer');
  expect(audit.reviewNote).toBe(note);
  expect(audit.correctionCardCode).toBe('qualifications');
  expect(audit.correctionCardName).toBe('Qualifications and training');

  const draftResponse = await request.get(`/registration/drafts/${created.draft_id}`);
  expect(draftResponse.status()).toBe(200);
  const draftBody = (await draftResponse.json()) as DraftResponse;
  const history = (draftBody.payload.operator_review_history as Array<Record<string, unknown>>) || [];
  expect(Array.isArray(history)).toBe(true);
  expect(history.length).toBeGreaterThanOrEqual(2);
  expect(history[0].decision).toBe('needs_correction');
  expect(history[0].review_note).toBe(note);
  expect(history[0].correction_card_code).toBe('qualifications');
  expect(history[0].correction_card_name).toBe('Qualifications and training');
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
