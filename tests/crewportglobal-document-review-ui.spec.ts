import { expect, test } from '@playwright/test';
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const operatorAccessToken =
  process.env.CREWPORTGLOBAL_OPERATOR_ACCESS_TOKEN ||
  process.env.CPG_OPERATOR_ACCESS_TOKEN ||
  'crewportglobal-local-operator';

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

function cleanupDocumentReviewUiTestData(): void {
  const sql = `
SELECT storage_root || '/' || storage_path
FROM crewportglobal.uploaded_documents ud
JOIN crewportglobal.users u ON u.user_id = ud.draft_id
WHERE u.email LIKE 'ui.documentreview.%@example.com';

DELETE FROM crewportglobal.uploaded_documents ud
USING crewportglobal.users u
WHERE u.user_id = ud.draft_id
  AND u.email LIKE 'ui.documentreview.%@example.com';

UPDATE crewportglobal.seafarer_profiles sp
SET review_status = 'rejected', updated_at = now()
FROM crewportglobal.users u
WHERE sp.user_id = u.user_id
  AND u.email LIKE 'ui.documentreview.%@example.com'
  AND sp.review_status IN ('submitted_for_human_review', 'in_review', 'approved');
`;

  const output = execSync(
    'PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql -v ON_ERROR_STOP=1 -qAt',
    { input: sql, encoding: 'utf8' }
  ).trim();

  for (const filePath of output.split('\n').map((item) => item.trim()).filter(Boolean)) {
    fs.rmSync(filePath, { force: true });
  }
}

test.afterEach(() => {
  cleanupDocumentReviewUiTestData();
});

test('team document review page shows clean document and records correction request', async ({ page, request }) => {
  const unique = Date.now();
  const email = `ui.documentreview.${unique}@example.com`;
  const fileName = `ui-document-review-${unique}.pdf`;

  const createResponse = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'seafarer',
      email,
      full_name: 'UI Document Review Seafarer',
      rank: 'Chief Officer',
      department: 'deck',
    },
  });
  expect(createResponse.status()).toBe(201);
  const created = await createResponse.json();

  const uploadResponse = await request.post(`/api/v1/registration/drafts/${created.draft_id}/documents`, {
    multipart: {
      form_type: 'seafarer',
      document_type: 'passport_or_id',
      file: {
        name: fileName,
        mimeType: 'application/pdf',
        buffer: minimalPdfBuffer('UI document review clean file.'),
      },
    },
  });
  expect(uploadResponse.status()).toBe(201);

  await page.addInitScript((token) => {
    window.sessionStorage.setItem('crewportglobal.operatorAccessToken', token);
  }, operatorAccessToken);

  await page.goto('/team/documents/');
  await expect(page.locator('#queue-status')).toContainText('Queue loaded');
  await expect(page.locator('#document-queue-body')).toContainText(fileName);
  await expect(page.locator('#document-queue-body')).toContainText('pending_human_review');

  const row = page.locator('#document-queue-body tr', { hasText: fileName }).first();
  await row.getByRole('button', { name: 'Open' }).click();
  await expect(page.locator('#selected-title')).toContainText(fileName);

  await page.getByRole('button', { name: 'Start review' }).click();
  await expect(page.locator('#review-status')).toContainText('under_review');
  await expect(page.locator('#document-queue-body')).toContainText('under_review');

  const note = 'Please upload the expiry page before final document verification.';
  await page.locator('#review-note').fill(note);
  await page.getByRole('button', { name: 'Needs correction' }).click();
  await expect(page.locator('#review-status')).toContainText('correction_requested');
  await expect(page.locator('#document-queue-body')).toContainText('correction_requested');
});
