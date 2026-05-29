import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { execSync } from 'node:child_process';

function cleanupPostVacancyWorkspaceTestData(): void {
  const sql = `
WITH ui_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.postvacancy.%@example.com'
),
ui_vacancies AS (
  SELECT vacancy_request_id
  FROM crewportglobal.vacancy_requests vr
  JOIN ui_users uu ON uu.user_id = vr.created_by_user_id
)
DELETE FROM crewportglobal.vacancy_applications va
WHERE va.seafarer_user_id IN (SELECT user_id FROM ui_users)
   OR va.vacancy_request_id IN (SELECT vacancy_request_id FROM ui_vacancies);

WITH ui_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.postvacancy.%@example.com'
)
UPDATE crewportglobal.vacancy_requests vr
SET publication_status = 'closed', updated_at = now()
FROM ui_users uu
WHERE vr.created_by_user_id = uu.user_id
  AND vr.publication_status IN ('submitted_for_human_review', 'in_review', 'published');

WITH ui_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.postvacancy.%@example.com'
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
  AND u.email LIKE 'ui.postvacancy.%@example.com'
  AND sp.review_status IN ('submitted_for_human_review', 'in_review', 'approved');
`;

  execSync(
    'PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql -v ON_ERROR_STOP=1 -q',
    { input: sql, encoding: 'utf8' }
  );
}

test.afterEach(() => {
  cleanupPostVacancyWorkspaceTestData();
});

async function selectMatchingValue(page: Page, selector: string, preferredValue: string): Promise<void> {
  const locator = page.locator(selector);
  await expect.poll(async () => locator.locator('option').count()).toBeGreaterThan(1);
  const values = await locator.locator('option').evaluateAll((options: HTMLOptionElement[]) => (
    options.map((option) => option.value).filter(Boolean)
  ));
  const selected = values.find((value) => value.toLowerCase() === preferredValue.toLowerCase()) || values[0];
  await locator.selectOption(selected);
}

test('post vacancy document upload shows exact file limit and type validation', async ({ page }) => {
  const unique = Date.now();
  const email = `ui.postvacancy.upload.${unique}@example.com`;

  await page.goto('/post-vacancy/');
  await page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem('crewportglobal.language', 'en');
  });
  await page.goto('/post-vacancy/');

  await expect(page.locator('#post-document-upload-status')).toContainText('Maximum size: 10 MB');
  await expect(page.locator('#post-document-upload-type')).toBeHidden();
  await expect(page.locator('#post-document-upload-file')).toBeHidden();
  await expect(page.locator('#post-vessel-document-upload-type')).toBeHidden();
  await expect(page.locator('#post-vessel-document-upload-file')).toBeHidden();
  await expect(page.locator('#post-document-upload-list .document-type-row[data-document-type="company_registration"] .document-type-row__title')).toBeVisible();
  await expect(page.locator('#post-vessel-document-upload-list .document-type-row[data-document-type="vessel_particulars"] .document-type-row__title')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => (
    document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2
  ))).toBe(true);

  await page.setViewportSize({ width: 390, height: 900 });
  await expect(page.locator('#post-document-upload-list .document-type-row[data-document-type="company_registration"] .document-type-row__title')).toBeVisible();
  await expect(page.locator('#post-vessel-document-upload-list .document-type-row[data-document-type="vessel_particulars"] .document-type-row__title')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => (
    document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2
  ))).toBe(true);
  await page.setViewportSize({ width: 1280, height: 720 });

  await page.locator('#post-email').fill(email);
  await page.locator('#post-full-name').fill('Upload Validation Manager');
  await page.locator('#post-company').fill(`Upload Validation Marine ${unique}`);
  await page.locator('#post-submit').click();
  await expect(page.locator('#post-status')).toContainText('saved successfully');

  const companyRegistrationInput = page.locator('.document-type-row[data-document-type="company_registration"] .document-type-row__file-input');
  await companyRegistrationInput.setInputFiles({
    name: 'too-large.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.concat([
      Buffer.from('%PDF-1.4\n'),
      Buffer.alloc((10 * 1024 * 1024) + 1),
      Buffer.from('\n%%EOF\n'),
    ]),
  });
  await expect(page.locator('#post-document-upload-status')).toContainText('too large');
  await expect(page.locator('#post-document-upload-status')).toContainText('10.0 MB');

  await companyRegistrationInput.setInputFiles({
    name: 'unsupported.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('plain text is not accepted authority evidence'),
  });
  await expect(page.locator('#post-document-upload-status')).toContainText('Unsupported file type');

  const vesselParticularsInput = page.locator('#post-vessel-document-upload-list .document-type-row[data-document-type="vessel_particulars"] .document-type-row__file-input');
  await vesselParticularsInput.setInputFiles({
    name: 'vessel-particulars.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n'),
  });
  await expect(page.locator('#post-vessel-document-upload-status')).toContainText('Document uploaded');
  await expect(page.locator('#post-vessel-document-upload-list .document-type-row[data-document-type="vessel_particulars"]')).toContainText('vessel-particulars.pdf');
});

test('post vacancy save confirm renders demand completeness items and opens exact fields', async ({ page }) => {
  const unique = Date.now();
  const email = `ui.postvacancy.completeness.${unique}@example.com`;

  await page.goto('/post-vacancy/');
  await page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem('crewportglobal.language', 'en');
  });
  await page.goto('/post-vacancy/');

  await page.locator('#post-email').fill(email);
  await page.locator('#post-company').fill(`Completeness Demand Marine ${unique}`);
  await selectMatchingValue(page, '#post-country', 'AE');
  await page.locator('#post-registration-number').fill(`AE-COMPLETE-${unique}`);
  await page.locator('#post-submit').click();

  await expect(page.locator('#post-status')).toContainText('saved successfully');
  await expect(page.locator('#post-completeness-summary')).toContainText('Complete numbered items');
  await expect(page.locator('#post-missing-list')).toContainText('E-1.2: Primary contact name');
  await expect(page.locator('#post-missing-list')).toContainText('E-4.D1: Company registration document');
  await expect(page.locator('#post-missing-list')).toContainText('V-2.1: Vessel type');
  await expect(page.locator('#post-missing-list')).toContainText('R-1.1: Requested rank');
  await expect(page.locator('#post-missing-list')).toContainText('R-3.1: Joining date');
  await expect(page.locator('label:has(#post-vessel-type)')).toHaveClass(/is-completeness-missing/);

  const draftId = await page.evaluate(() => new URLSearchParams(window.location.search).get('draft_id') || '');
  expect(draftId).not.toBe('');

  await page.locator('#post-missing-list a', { hasText: 'R-3.1' }).click();
  await expect(page).toHaveURL(new RegExp(`/post-vacancy/\\?draft_id=${draftId}#post-join-date$`));
  await expect(page.locator('label:has(#post-join-date)')).toHaveClass(/is-completeness-missing/);
  await expect(page.locator('#post-join-date')).toBeFocused();
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

test('post vacancy workspace saves, reloads and displays review publication status', async ({ page, request }) => {
  const unique = Date.now();
  const email = `ui.postvacancy.${unique}@example.com`;
  const company = `Post Vacancy Marine ${unique}`;
  const firstTitle = 'Chief Officer';
  const updatedTitle = 'Master';

  await page.goto('/post-vacancy/');
  await page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem('crewportglobal.language', 'en');
  });
  await page.goto('/post-vacancy/');

  await page.locator('#post-email').fill(email);
  await page.locator('#post-full-name').fill('Post Vacancy Manager');
  await page.locator('#post-role').selectOption('shipowner');
  await page.locator('#post-role-in-company').selectOption('owner');
  await page.locator('#post-company').fill(company);
  await selectMatchingValue(page, '#post-country', 'AE');
  await page.locator('#post-registration-number').fill(`AE-PV-${unique}`);
  await page.locator('#post-vessel-name').fill(`MV Workspace ${unique}`);
  await selectMatchingValue(page, '#post-vessel-type', 'BULK CARRIER');
  await page.locator('#post-vessel-flag-same-company').click();
  await expect(page.locator('#post-vessel-flag-country')).toHaveValue('AE');
  await page.locator('#post-imo').fill(`IMO${9400000 + (unique % 500000)}`);
  await selectMatchingValue(page, '#post-vacancy-title', firstTitle);
  await page.locator('#post-department').selectOption('deck');
  await page.locator('#post-join-date').fill('2026-10-15');
  await page.locator('#post-duration').fill('4 months +/- 1');
  await page.locator('#post-salary-min').fill('7000');
  await page.locator('#post-salary-max').fill('7600');
  await page.locator('#post-requirements').fill('COC, bulk carrier command experience and valid medical certificate.');

  await page.locator('#post-submit').click();

  await expect(page.locator('#post-status')).toContainText('saved successfully');
  await expect(page.locator('#post-company-status')).toHaveText('draft');
  await expect(page.locator('#post-vacancy-status')).toHaveText('draft');
  await expect(page.locator('#post-publication-status')).toHaveText('Not public');
  await expect(page).toHaveURL(/draft_id=/);

  const draftId = await page.evaluate(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('draft_id') || '';
  });
  expect(draftId).not.toBe('');

  for (const [formType, documentType, name] of [
    ['employer', 'company_registration', 'company-registration.pdf'],
    ['employer', 'representative_id', 'representative-id.pdf'],
    ['vessel', 'vessel_particulars', 'vessel-particulars.pdf'],
  ] as const) {
    const uploadResponse = await request.post(`/api/v1/registration/drafts/${draftId}/documents`, {
      multipart: {
        form_type: formType,
        document_type: documentType,
        file: {
          name,
          mimeType: 'application/pdf',
          buffer: Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n'),
        },
      },
    });
    expect(uploadResponse.ok()).toBeTruthy();
  }

  const submitReviewResponse = await request.post(`/api/v1/registration/drafts/${draftId}/submit-review`, {
    data: {
      role: 'shipowner',
    },
  });
  expect(submitReviewResponse.ok()).toBeTruthy();

  await page.goto(`/post-vacancy/?draft_id=${draftId}`);
  await expect(page.locator('#post-status')).toContainText('loaded');
  await expect(page.locator('#post-company-status')).toHaveText('submitted');
  await expect(page.locator('#post-vacancy-status')).toHaveText('submitted_for_human_review');
  await expect(page.locator('#post-next-action')).toContainText('waiting for operator review');
  await expect(page.locator('#post-email')).toHaveValue(email);
  await expect(page.locator('#post-role')).toHaveValue('shipowner');
  await expect(page.locator('#post-role-in-company')).toHaveValue('owner');
  await expect(page.locator('#post-company')).toHaveValue(company);
  await expect(page.locator('#post-vessel-flag-country')).toHaveValue('AE');
  await expect(page.locator('#post-vacancy-title')).toHaveValue(firstTitle);
  await expect(page.locator('#post-salary-min')).toHaveValue(/^7000(\.00)?$/);
  await expect(page.locator('#post-salary-max')).toHaveValue(/^7600(\.00)?$/);

  await selectMatchingValue(page, '#post-vacancy-title', updatedTitle);
  await page.locator('#post-submit').click();
  await expect(page.locator('#post-status')).toContainText('saved successfully');

  const companyDecision = await request.patch(`/api/v1/operator/review-queue/${draftId}/status`, {
    data: {
      decision: 'reviewed',
      queue_type: 'company_verification',
    },
  });
  expect(companyDecision.ok()).toBeTruthy();

  const vacancyDecision = await request.patch(`/api/v1/operator/review-queue/${draftId}/status`, {
    data: {
      decision: 'reviewed',
      queue_type: 'vacancy_request',
    },
  });
  expect(vacancyDecision.ok()).toBeTruthy();

  await page.goto(`/post-vacancy/?draft_id=${draftId}`);
  await expect(page.locator('#post-vacancy-title')).toHaveValue(updatedTitle);
  await expect(page.locator('#post-company-status')).toHaveText('verified');
  await expect(page.locator('#post-vacancy-status')).toHaveText('published');
  await expect(page.locator('#post-publication-status')).toHaveText('Published');
  await expect(page.locator('#post-next-action')).toContainText('visible on the public board');
  await expect(page.locator('#post-candidate-pipeline-status')).toContainText('No presented candidates yet');

  const draftResponse = await request.get(`/api/v1/registration/drafts/${draftId}`);
  expect(draftResponse.ok()).toBeTruthy();
  const draft = await draftResponse.json();
  const vacancyId = draft.payload.vacancy_request.vacancy_request_id as string;

  const seafarerEmail = `ui.postvacancy.seafarer.${unique}@example.com`;
  const seafarerCreate = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'seafarer',
      email: seafarerEmail,
      full_name: 'Presented Candidate',
      rank: 'Master',
      department: 'deck',
      availability_status: 'available_now',
      contact_phone: '+971500003333',
      document_metadata: {
        certificate_status: 'ready',
        stcw_status: 'ready',
        passport_expiry: '2029-02-02',
        medical_expiry: '2027-06-15',
        visa_status: 'not_required',
        notes: 'Documents checked for employer presentation.',
      },
    },
  });
  expect(seafarerCreate.ok()).toBeTruthy();
  const seafarer = await seafarerCreate.json();
  await acceptPresentationConsents(request, seafarer.draft_id);

  const candidateNote = 'Ready for interview and available immediately.';
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

  const applicationDecision = await request.patch(`/api/v1/operator/review-queue/${applicationId}/status`, {
    data: {
      decision: 'reviewed',
      queue_type: 'vacancy_application',
      note: 'Candidate can be shown in employer pipeline.',
    },
  });
  expect(applicationDecision.ok()).toBeTruthy();

  await page.goto(`/post-vacancy/?draft_id=${draftId}`);
  await expect(page.locator('#post-candidate-pipeline-status')).toContainText('1 presented candidate');
  await expect(page.locator('#post-candidate-list')).toContainText('Presented Candidate');
  await expect(page.locator('#post-candidate-list')).toContainText('Master');
  await expect(page.locator('#post-candidate-list')).not.toContainText(seafarerEmail);
  await expect(page.locator('#post-candidate-list')).toContainText('ready / ready / 2027-06-15 / 2029-02-02');
  await expect(page.locator('#post-candidate-list')).toContainText(candidateNote);
  const candidateCard = page.locator('.candidate-card', { hasText: 'Presented Candidate' }).first();
  await expect(candidateCard.locator('.candidate-card__meta')).toContainText('Employer status: Presented');

  await candidateCard.getByRole('button', { name: 'Mark contacted' }).click();
  await expect(page.locator('#post-status')).toContainText('Candidate status updated.');
  await expect(candidateCard.locator('.candidate-card__meta')).toContainText('Employer status: Contacted');

  const followupNote = 'Available for interview on 2027-05-10 at 10:00 UTC.';
  await candidateCard.locator('.candidate-note-input').fill(followupNote);
  await candidateCard.getByRole('button', { name: 'Request interview' }).click();
  await expect(page.locator('#post-status')).toContainText('Candidate status updated.');
  await expect(candidateCard.locator('.candidate-card__meta')).toContainText('Employer status: Interview requested');
  await expect(candidateCard.locator('.candidate-note-input')).toHaveValue(followupNote);

  await page.reload();
  await expect(candidateCard.locator('.candidate-card__meta')).toContainText('Employer status: Interview requested');
  await expect(candidateCard.locator('.candidate-note-input')).toHaveValue(followupNote);

  await candidateCard.locator('.candidate-note-input').fill('Not suitable for this rotation after salary review.');
  await candidateCard.getByRole('button', { name: 'Not suitable' }).click();
  await expect(page.locator('#post-status')).toContainText('Candidate status updated.');
  await expect(candidateCard.locator('.candidate-card__meta')).toContainText('Employer status: Not suitable');
  await expect(candidateCard.locator('.candidate-note-input')).toHaveValue('Not suitable for this rotation after salary review.');

  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(hasOverflow).toBe(false);
});
