import { expect, test, type APIRequestContext } from '@playwright/test';
import { execSync } from 'node:child_process';
import fs from 'node:fs';

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

function eicarBuffer(): Buffer {
  return Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*');
}

function cleanupDocumentTaskTestData(): void {
  const sql = `
SELECT storage_root || '/' || storage_path
FROM crewportglobal.uploaded_documents ud
JOIN crewportglobal.users u ON u.user_id = ud.draft_id
WHERE u.email LIKE 'ui.doctask.%@example.com';

DELETE FROM crewportglobal.uploaded_documents ud
USING crewportglobal.users u
WHERE u.user_id = ud.draft_id
  AND u.email LIKE 'ui.doctask.%@example.com';

WITH ui_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.doctask.%@example.com'
)
UPDATE crewportglobal.seafarer_profiles sp
SET review_status = 'rejected', updated_at = now()
FROM ui_users uu
WHERE sp.user_id = uu.user_id
  AND sp.review_status IN ('submitted_for_human_review', 'in_review', 'approved');

WITH ui_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.doctask.%@example.com'
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

WITH ui_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.doctask.%@example.com'
)
UPDATE crewportglobal.vacancy_requests vr
SET publication_status = 'closed', updated_at = now()
FROM ui_users uu
WHERE vr.created_by_user_id = uu.user_id
  AND vr.publication_status IN ('submitted_for_human_review', 'in_review', 'published');
`;

  const output = execSync(
    'PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql -v ON_ERROR_STOP=1 -qAt',
    { input: sql, encoding: 'utf8' }
  ).trim();

  for (const filePath of output.split('\n').map((item) => item.trim()).filter(Boolean)) {
    fs.rmSync(filePath, { force: true });
  }
}

async function uploadDocument(
  request: APIRequestContext,
  draftId: string,
  formType: 'seafarer' | 'employer',
  documentType: string,
  name: string,
  buffer: Buffer
): Promise<Record<string, any>> {
  const response = await request.post(`/api/v1/registration/drafts/${draftId}/documents`, {
    multipart: {
      form_type: formType,
      document_type: documentType,
      file: {
        name,
        mimeType: 'application/pdf',
        buffer,
      },
    },
  });
  expect(response.status()).toBe(201);
  return response.json();
}

async function requestCorrection(
  request: APIRequestContext,
  documentId: string,
  note: string
): Promise<void> {
  const response = await request.patch(`/api/v1/operator/documents/${documentId}/review`, {
    data: {
      decision: 'needs_correction',
      review_note: note,
    },
  });
  expect(response.status()).toBe(200);
}

async function visibleDocuments(
  request: APIRequestContext,
  draftId: string,
  formType: 'seafarer' | 'employer'
): Promise<Array<Record<string, any>>> {
  const response = await request.get(`/api/v1/registration/drafts/${draftId}/documents?form_type=${formType}`);
  expect(response.status()).toBe(200);
  const body = await response.json();
  return body.documents || [];
}

async function queueContainsDocument(
  request: APIRequestContext,
  documentId: string
): Promise<boolean> {
  const response = await request.get('/api/v1/operator/document-review-queue');
  expect(response.status()).toBe(200);
  const body = await response.json();
  return (body.queue || []).some((item: Record<string, unknown>) => item.document_id === documentId);
}

test.afterEach(() => {
  cleanupDocumentTaskTestData();
});

test('seafarer document correction task remains after unsafe replacement and closes after clean replacement', async ({ page, request }) => {
  const unique = Date.now();
  const email = `ui.doctask.seafarer.${unique}@example.com`;

  const createResponse = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'seafarer',
      email,
      full_name: 'Document Task Seafarer',
      rank: 'Chief Officer',
      department: 'deck',
    },
  });
  expect(createResponse.status()).toBe(201);
  const created = await createResponse.json();

  const firstUpload = await uploadDocument(
    request,
    created.draft_id,
    'seafarer',
    'medical_certificate',
    'old-medical.pdf',
    minimalPdfBuffer('Old medical certificate.')
  );
  const oldDocumentId = firstUpload.document.document_id as string;
  const note = 'The document is expired. Please upload a valid medical certificate.';
  await requestCorrection(request, oldDocumentId, note);

  const unsafeReplacement = await request.post(`/api/v1/registration/drafts/${created.draft_id}/documents`, {
    multipart: {
      form_type: 'seafarer',
      document_type: 'medical_certificate',
      file: {
        name: 'unsafe-medical.pdf',
        mimeType: 'application/pdf',
        buffer: eicarBuffer(),
      },
    },
  });
  expect(unsafeReplacement.status()).toBe(400);
  expect((await unsafeReplacement.json()).error).toBe('malware_detected');

  await page.goto(`/create-profile/?draft_id=${created.draft_id}`);
  await expect(page.locator('#create-document-action-list')).toContainText('Action required: upload corrected document');
  await expect(page.locator('#create-document-action-list')).toContainText('Medical certificate');
  await expect(page.locator('#create-document-action-list')).toContainText(note);
  await expect(page.locator('#create-document-action-list')).toContainText('Upload replacement');

  await page.locator('#create-document-action-list .document-replacement-action').click();
  await expect(page.locator('#create-document-upload-type')).toHaveValue('medical_certificate');
  await page.locator('#create-document-upload-file').setInputFiles({
    name: 'new-medical.pdf',
    mimeType: 'application/pdf',
    buffer: minimalPdfBuffer('New valid medical certificate.'),
  });
  await page.locator('#create-document-upload-submit').click();
  await expect(page.locator('#create-document-upload-status')).toContainText('uploaded and scanned');
  await expect(page.locator('#create-document-action-list')).toBeHidden();
  await expect(page.locator('#create-document-upload-list')).toContainText('new-medical.pdf');
  await expect(page.locator('#create-document-upload-list')).toContainText('Pending human review');

  const documents = await visibleDocuments(request, created.draft_id, 'seafarer');
  expect(documents).toHaveLength(1);
  expect(documents[0].original_filename).toBe('new-medical.pdf');
  expect(documents[0].review_status).toBe('pending_human_review');
  expect(await queueContainsDocument(request, documents[0].document_id)).toBe(true);
  expect(await queueContainsDocument(request, oldDocumentId)).toBe(false);
});

test('employer document correction task closes after authority evidence replacement', async ({ page, request }) => {
  const unique = Date.now();
  const email = `ui.doctask.employer.${unique}@example.com`;

  const createResponse = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'employer',
      role_in_company: 'manager',
      email,
      full_name: 'Document Task Employer',
      company_name: `Document Task Marine ${unique}`,
      country_code: 'AE',
      registration_number: `AE-DOC-TASK-${unique}`,
      vacancy: {
        vacancy_title: `Crew request ${unique}`,
        rank: 'Chief Engineer',
        department: 'engine',
        vessel_type: 'Container Ship',
        join_date: '2026-10-10',
        contract_duration: '4 months',
        salary_min_usd: 7000,
        salary_max_usd: 8200,
        currency: 'USD',
        employer_country_code: 'AE',
        requirements: 'Valid COC and container vessel experience.',
      },
    },
  });
  expect(createResponse.status()).toBe(201);
  const created = await createResponse.json();

  const firstUpload = await uploadDocument(
    request,
    created.draft_id,
    'employer',
    'authorization_letter',
    'old-authorization.pdf',
    minimalPdfBuffer('Old authorization letter.')
  );
  const oldDocumentId = firstUpload.document.document_id as string;
  const note = 'Authority evidence does not show the right to request crew. Upload an updated authorization letter.';
  await requestCorrection(request, oldDocumentId, note);

  await page.goto(`/post-vacancy/?draft_id=${created.draft_id}`);
  await expect(page.locator('#post-document-action-list')).toContainText('Action required: upload corrected document');
  await expect(page.locator('#post-document-action-list')).toContainText('Authorization letter');
  await expect(page.locator('#post-document-action-list')).toContainText(note);

  await page.locator('#post-document-action-list .document-replacement-action').click();
  await expect(page.locator('#post-document-upload-type')).toHaveValue('authorization_letter');
  await page.locator('#post-document-upload-file').setInputFiles({
    name: 'new-authorization.pdf',
    mimeType: 'application/pdf',
    buffer: minimalPdfBuffer('New valid authorization letter.'),
  });
  await page.locator('#post-document-upload-submit').click();
  await expect(page.locator('#post-document-upload-status')).toContainText('uploaded and scanned');
  await expect(page.locator('#post-document-action-list')).toBeHidden();
  await expect(page.locator('#post-document-upload-list')).toContainText('new-authorization.pdf');
  await expect(page.locator('#post-document-upload-list')).toContainText('Pending human review');

  const documents = await visibleDocuments(request, created.draft_id, 'employer');
  expect(documents).toHaveLength(1);
  expect(documents[0].original_filename).toBe('new-authorization.pdf');
  expect(documents[0].review_status).toBe('pending_human_review');
  expect(await queueContainsDocument(request, documents[0].document_id)).toBe(true);
  expect(await queueContainsDocument(request, oldDocumentId)).toBe(false);
});
