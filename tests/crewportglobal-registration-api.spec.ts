import { expect, test, type APIRequestContext } from '@playwright/test';
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
      }),
    })
  );
  expect(vacancy.demand_matching_foundation).toEqual(
    expect.objectContaining({
      required_rank_catalog_linked: true,
      vessel_type_catalog_linked: true,
      contract_duration_structured: true,
    })
  );

  const demandRequirementItems = created.payload.demand_requirement_items as Array<Record<string, unknown>>;
  const rankRequirement = demandRequirementItems.find((item) => item.requirement_group === 'rank');
  const vesselTypeRequirement = demandRequirementItems.find((item) => item.requirement_group === 'vessel_type');
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
  expect(search.search_model).toBe('cpg-demand-006-read-only-exact-foundation');
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
      matched_dimensions: ['rank', 'vessel_type', 'availability'],
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
    })
  );

  const mismatchCandidate = search.candidates.find((candidate) => candidate.candidate_user_id === mismatch.draft_id);
  expect(mismatchCandidate).toBeTruthy();
  expect(mismatchCandidate?.match_level).toBe('blocked');
  const mismatchBlockerCodes = ((mismatchCandidate?.blockers || []) as Array<Record<string, unknown>>).map((blocker) => blocker.code);
  expect(mismatchBlockerCodes).toContain('rank_mismatch');
  expect(mismatchBlockerCodes).toContain('vessel_type_mismatch');

  const serialized = JSON.stringify(search);
  expect(serialized).not.toContain(exactEmail);
  expect(serialized).not.toContain(mismatchEmail);
  expect(serialized).not.toContain('contact_email');
  expect(serialized).not.toContain('contact_phone');
  expect(serialized).not.toContain('document_metadata');

  const employerDraftResponse = await request.get(`/registration/drafts/${employer.draft_id}`);
  expect(employerDraftResponse.status()).toBe(200);
  const employerDraft = (await employerDraftResponse.json()) as DraftResponse;
  const presentedCandidates = employerDraft.payload.presented_candidates as Array<Record<string, unknown>>;
  expect(presentedCandidates).toEqual([]);
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
