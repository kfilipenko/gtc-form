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

function cleanupCabinetTestData(): void {
  const sql = `
SELECT storage_root || '/' || storage_path
FROM crewportglobal.uploaded_documents ud
JOIN crewportglobal.users u ON u.user_id = ud.draft_id
WHERE u.email LIKE 'ui.cabinet.%@example.com';

DELETE FROM crewportglobal.uploaded_documents ud
USING crewportglobal.users u
WHERE u.user_id = ud.draft_id
  AND u.email LIKE 'ui.cabinet.%@example.com';

WITH ui_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.cabinet.%@example.com'
)
UPDATE crewportglobal.seafarer_profiles sp
SET review_status = 'rejected', updated_at = now()
FROM ui_users uu
WHERE sp.user_id = uu.user_id
  AND sp.review_status IN ('submitted_for_human_review', 'in_review', 'approved');

WITH ui_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.cabinet.%@example.com'
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
  WHERE email LIKE 'ui.cabinet.%@example.com'
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

async function requestCorrection(request: APIRequestContext, documentId: string, note: string): Promise<void> {
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

test.afterEach(() => {
  cleanupCabinetTestData();
});

test('cabinet shows empty registration task when no draft is available', async ({ page }) => {
  await page.goto('/cabinet/');
  await page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem('crewportglobal.language', 'en');
  });
  await page.goto('/cabinet/');

  await expect(page.locator('#cabinet-task-list')).toContainText('Action required: open registration');
  await expect(page.locator('#cabinet-summary-tasks')).toHaveText('1');
  await expect(page.getByRole('link', { name: 'Open registration' })).toHaveAttribute('href', '/register/');

  const account = page.locator('.cabinet-header .cpg-account');
  await expect(account).toBeVisible();
  await expect(account.locator('summary')).toContainText('Account / Login');
  await expect(account.locator('.cpg-account__avatar')).toHaveCount(0);
  await account.locator('summary').click();
  await expect(account.getByRole('link', { name: 'Registration' })).toHaveAttribute('href', 'https://crewportglobal.com/register/');
  await account.getByRole('button', { name: 'Login' }).click();
  await expect(account.locator('input[name="email"]')).toBeEnabled();
  await expect(account.locator('input[name="password"]')).toBeEnabled();
});

test('cabinet lets seafarer upload corrected replacement and returns document to review', async ({ page, request }) => {
  const unique = Date.now();
  const email = `ui.cabinet.seafarer.${unique}@example.com`;

  const createResponse = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'seafarer',
      email,
      full_name: 'Cabinet Seafarer',
      rank: 'Chief Officer',
      department: 'deck',
    },
  });
  expect(createResponse.status()).toBe(201);
  const created = await createResponse.json();

  const upload = await uploadDocument(
    request,
    created.draft_id,
    'seafarer',
    'medical_certificate',
    'cabinet-old-medical.pdf',
    minimalPdfBuffer('Cabinet old medical certificate.')
  );
  const note = 'Medical certificate expired. Please upload a valid medical certificate.';
  await requestCorrection(request, upload.document.document_id, note);

  await page.goto(`/cabinet/?draft_id=${created.draft_id}`);
  await expect(page.locator('#cabinet-summary-user')).toHaveText(email);
  await expect(page.locator('#cabinet-summary-role')).toContainText('Seafarer');
  await page.locator('#cabinet-user-card > summary').click();
  await expect(page.locator('#cabinet-user-summary')).toContainText('Cabinet Seafarer');
  await expect(page.locator('#cabinet-user-summary')).toContainText('No profile photo uploaded yet');
  await expect(page.locator('#cabinet-summary-tasks')).toHaveText('1');
  await expect(page.locator('#cabinet-task-list')).toContainText('Action required: upload corrected document');
  await expect(page.locator('#cabinet-task-list')).toContainText(note);
  await expect(page.locator('#cabinet-task-list')).toContainText('medical_certificate');

  await page.locator('#cabinet-task-list input[type="file"]').setInputFiles({
    name: 'cabinet-unsafe-medical.pdf',
    mimeType: 'application/pdf',
    buffer: eicarBuffer(),
  });
  await page.locator('#cabinet-task-list').getByRole('button', { name: 'Upload replacement' }).click();
  await expect(page.locator('#cabinet-task-list')).toContainText('Replacement upload failed');
  await expect(page.locator('#cabinet-task-list')).toContainText('Action required: upload corrected document');

  await page.locator('#cabinet-task-list input[type="file"]').setInputFiles({
    name: 'cabinet-new-medical.pdf',
    mimeType: 'application/pdf',
    buffer: minimalPdfBuffer('Cabinet new medical certificate.'),
  });
  await page.locator('#cabinet-task-list').getByRole('button', { name: 'Upload replacement' }).click();
  await expect(page.locator('#cabinet-task-list')).toContainText('Waiting for team review');
  await expect(page.locator('#cabinet-task-list')).not.toContainText('Action required: upload corrected document');
  await expect(page.locator('#cabinet-summary-tasks')).toHaveText('0');

  await page.locator('#cabinet-documents-card > summary').click();
  await expect(page.locator('#cabinet-document-list')).toContainText('cabinet-new-medical.pdf');
  await expect(page.locator('#cabinet-document-list')).toContainText('Waiting for team review');

  await page.locator('#cabinet-services-card > summary').click();
  await expect(page.locator('#cabinet-service-list')).toContainText('Request buyer / employer capability');
  await expect(page.getByRole('link', { name: 'Open authorization cards' })).toHaveAttribute('href', '/register/authorization/');

  const documents = await visibleDocuments(request, created.draft_id, 'seafarer');
  expect(documents).toHaveLength(1);
  expect(documents[0].original_filename).toBe('cabinet-new-medical.pdf');
  expect(documents[0].review_status).toBe('pending_human_review');
});

test('cabinet shows card-level seafarer correction task from operator review', async ({ page, request }) => {
  const unique = Date.now();
  const email = `ui.cabinet.card.${unique}@example.com`;

  const createResponse = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'seafarer',
      email,
      full_name: 'Cabinet Card Seafarer',
      rank: 'Second Officer',
      department: 'deck',
      document_metadata: {
        seafarer_workspace: {
          qualifications: {
            coc_type: 'Second Officer'
          }
        }
      }
    },
  });
  expect(createResponse.status()).toBe(201);
  const created = await createResponse.json();

  const note = 'COC number is missing. Please complete the qualifications card.';
  const correctionResponse = await request.patch(`/api/v1/operator/review-queue/${created.draft_id}/status`, {
    data: {
      decision: 'needs_correction',
      note,
      correction_card_code: 'qualifications',
    },
  });
  expect(correctionResponse.status()).toBe(200);

  await page.goto(`/cabinet/?draft_id=${created.draft_id}`);
  await expect(page.locator('#cabinet-task-list')).toContainText('Action required: correct seafarer card');
  await expect(page.locator('#cabinet-task-list')).toContainText('Target card: Qualifications and training');
  await expect(page.locator('#cabinet-task-list')).toContainText(note);
  await expect(page.locator('#cabinet-task-list').getByRole('link', { name: 'Open card' })).toHaveAttribute(
    'href',
    `/create-profile/?draft_id=${created.draft_id}#profile-section-qualifications`
  );
});

test('cabinet supports employer-side correction task and service area', async ({ page, request }) => {
  const unique = Date.now();
  const email = `ui.cabinet.employer.${unique}@example.com`;

  const createResponse = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'employer',
      role_in_company: 'manager',
      email,
      full_name: 'Cabinet Employer',
      company_name: `Cabinet Marine ${unique}`,
      country_code: 'AE',
      registration_number: `AE-CAB-${unique}`,
    },
  });
  expect(createResponse.status()).toBe(201);
  const created = await createResponse.json();

  const upload = await uploadDocument(
    request,
    created.draft_id,
    'employer',
    'authorization_letter',
    'cabinet-old-authorization.pdf',
    minimalPdfBuffer('Cabinet old authorization.')
  );
  const note = 'Upload an updated authorization letter that confirms crew request authority.';
  await requestCorrection(request, upload.document.document_id, note);

  await page.goto(`/cabinet/?draft_id=${created.draft_id}`);
  await expect(page.locator('#cabinet-summary-role')).toContainText('Buyer / employer');
  await expect(page.locator('#cabinet-task-list')).toContainText('Action required: upload corrected document');
  await expect(page.locator('#cabinet-task-list')).toContainText(note);

  await page.locator('#cabinet-task-list input[type="file"]').setInputFiles({
    name: 'cabinet-new-authorization.pdf',
    mimeType: 'application/pdf',
    buffer: minimalPdfBuffer('Cabinet new authorization.'),
  });
  await page.locator('#cabinet-task-list').getByRole('button', { name: 'Upload replacement' }).click();
  await expect(page.locator('#cabinet-task-list')).toContainText('Waiting for team review');

  await page.locator('#cabinet-services-card > summary').click();
  await expect(page.locator('#cabinet-service-list')).toContainText('Request seafarer / specialist capability');
  await expect(page.getByRole('link', { name: 'Open employer workspace' })).toHaveAttribute('href', `/post-vacancy/?draft_id=${created.draft_id}`);

  const documents = await visibleDocuments(request, created.draft_id, 'employer');
  expect(documents).toHaveLength(1);
  expect(documents[0].original_filename).toBe('cabinet-new-authorization.pdf');
  expect(documents[0].review_status).toBe('pending_human_review');
});
