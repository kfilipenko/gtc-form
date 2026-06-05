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
),
ui_profiles AS (
  SELECT seafarer_profile_id
  FROM crewportglobal.seafarer_profiles sp
  JOIN ui_users uu ON uu.user_id = sp.user_id
),
ui_vacancies AS (
  SELECT vacancy_request_id
  FROM crewportglobal.vacancy_requests vr
  JOIN ui_users uu ON uu.user_id = vr.created_by_user_id
)
DELETE FROM crewportglobal.contract_workspace_instances cwi
WHERE cwi.vacancy_request_id IN (SELECT vacancy_request_id FROM ui_vacancies)
   OR cwi.seafarer_profile_id IN (SELECT seafarer_profile_id FROM ui_profiles);

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

function ensureApprovedContractWorkspaceReferences(): void {
  const sql = `
INSERT INTO crewportglobal.master_contract_templates (
  template_code,
  template_version,
  template_title,
  authoritative_language,
  template_status,
  template_hash,
  approved_at
) VALUES (
  'ui_test_seafarer_shipowner_master_contract',
  'test-v1',
  'UI Test Seafarer Shipowner Master Contract',
  'en',
  'approved',
  repeat('b', 64),
  now()
)
ON CONFLICT (template_code, template_version)
DO UPDATE SET
  template_status = 'approved',
  template_hash = EXCLUDED.template_hash,
  approved_at = COALESCE(crewportglobal.master_contract_templates.approved_at, now()),
  updated_at = now();

INSERT INTO crewportglobal.contract_field_catalogs (
  catalog_code,
  catalog_version,
  catalog_title,
  catalog_status,
  approved_at
) VALUES (
  'ui_test_seafarer_shipowner_contract_fields',
  'test-v1',
  'UI Test Seafarer Shipowner Contract Fields',
  'approved',
  now()
)
ON CONFLICT (catalog_code, catalog_version)
DO UPDATE SET
  catalog_status = 'approved',
  approved_at = COALESCE(crewportglobal.contract_field_catalogs.approved_at, now()),
  updated_at = now();
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
  await expect.poll(async () => page.evaluate(() => {
    const flowGrid = document.querySelector('.flow-grid');
    const columns = flowGrid ? window.getComputedStyle(flowGrid).gridTemplateColumns.trim().split(/\s+/).filter(Boolean) : [];
    return columns.length;
  })).toBe(1);
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

  await page.goto(`/cabinet/?draft_id=${seafarer.draft_id}`);
  await expect(page.locator('#cabinet-task-list')).toContainText('Action required: search matching jobs');
  await expect(page.locator('#cabinet-task-list')).toContainText(/Matching vacancies: [1-9]\d*/);
  await expect(page.getByRole('link', { name: 'Open job search' })).toHaveAttribute(
    'href',
    `/seafarers/job-search/?draft_id=${seafarer.draft_id}`
  );

  await page.goto(`/seafarers/job-search/?draft_id=${seafarer.draft_id}`);
  await expect(page.locator('#job-search-status')).toContainText('Matching jobs loaded');
  await expect.poll(async () => Number(await page.locator('#matching-ready-count').textContent())).toBeGreaterThan(0);
  await expect.poll(async () => Number(await page.locator('#requestable-count').textContent())).toBeGreaterThan(0);
  await expect(page.locator('#job-search-results')).toContainText(updatedTitle);
  await expect(page.locator('#job-search-results')).toContainText(company);
  await expect(page.locator('#job-search-results')).not.toContainText(seafarerEmail);
  const jobCard = page.locator('.job-card', { hasText: updatedTitle }).filter({ hasText: company }).first();
  await expect(jobCard.getByRole('button', { name: 'Request contract consideration' })).toBeEnabled();

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

  await page.goto(`/cabinet/?draft_id=${draftId}`);
  await expect(page.locator('#cabinet-task-list')).toContainText('Action required: review incoming seafarer requests');
  await expect(page.locator('#cabinet-task-list')).toContainText('Incoming requests: 1');
  await expect(page.getByRole('link', { name: 'Open incoming requests' })).toHaveAttribute(
    'href',
    `/shipowners/candidates/?draft_id=${draftId}&vacancy_request_id=${vacancyId}#incoming-requests`
  );

  await page.goto(`/shipowners/candidates/?draft_id=${draftId}&vacancy_request_id=${vacancyId}#incoming-requests`);
  await expect(page.getByRole('heading', { name: 'Select candidate.' })).toBeVisible();
  await expect(page.locator('#incoming-list')).toContainText('Presented Candidate');
  await expect(page.locator('#incoming-list')).toContainText('Waiting for team review');
  await expect(page.locator('#incoming-list')).toContainText(candidateNote);
  await expect(page.locator('#incoming-list')).not.toContainText(seafarerEmail);
  await expect(page.locator('#candidate-list')).toContainText('Candidate presentation is being prepared.');

  const incomingRequestDetailResponse = await request.get(`/api/v1/operator/review-queue/vacancy-applications/${applicationId}`);
  expect(incomingRequestDetailResponse.ok()).toBeTruthy();
  const incomingRequestDetail = await incomingRequestDetailResponse.json();
  expect(incomingRequestDetail.application.request_source).toBe('seafarer_initiated_request');
  const incomingReviewOperation = incomingRequestDetail.computed_operations.find(
    (operation: Record<string, unknown>) => operation.operation_code === 'review_candidate_presentation'
  );
  expect(incomingReviewOperation).toEqual(
    expect.objectContaining({
      is_executable: true,
      request_source: 'seafarer_initiated_request',
      review_handoff: 'release_incoming_request_to_presented_candidate',
    })
  );

  const applicationDecision = await request.patch(`/api/v1/operator/vacancy-applications/${applicationId}/presentation-review`, {
    data: {
      note: 'Candidate can be shown in employer pipeline.',
    },
  });
  expect(applicationDecision.ok()).toBeTruthy();
  const applicationDecisionPayload = await applicationDecision.json();
  expect(applicationDecisionPayload).toEqual(expect.objectContaining({
    ok: true,
    previous_status: 'submitted_for_human_review',
    new_status: 'presented',
  }));
  const applicationDetailAfterReviewResponse = await request.get(`/api/v1/operator/review-queue/vacancy-applications/${applicationId}`);
  expect(applicationDetailAfterReviewResponse.ok()).toBeTruthy();
  const applicationDetailAfterReview = await applicationDetailAfterReviewResponse.json();
  expect(applicationDetailAfterReview.application.application_status).toBe('presented');
  const candidateSelectionAfterReviewResponse = await request.get(`/api/v1/employer/candidate-selection?draft_id=${draftId}`);
  expect(candidateSelectionAfterReviewResponse.ok()).toBeTruthy();
  const candidateSelectionAfterReview = await candidateSelectionAfterReviewResponse.json();
  const targetSelectionRequestAfterReview = candidateSelectionAfterReview.selection_requests.find(
    (requestItem: Record<string, unknown>) => requestItem.vacancy_request_id === vacancyId
  ) as Record<string, unknown>;
  expect(targetSelectionRequestAfterReview).toBeTruthy();
  expect(targetSelectionRequestAfterReview.incoming_candidate_requests).toEqual([]);
  expect(JSON.stringify(targetSelectionRequestAfterReview.presented_candidates)).toContain(applicationId);

  await page.reload();
  await expect(page.locator('#incoming-list')).toContainText('No incoming seafarer requests are waiting for team review.');
  await expect(page.locator('#candidate-list')).toContainText('Presented Candidate');
  await expect(page.locator('#candidate-list')).not.toContainText(seafarerEmail);

  await page.goto(`/post-vacancy/?draft_id=${draftId}`);
  await expect(page.locator('#post-candidate-pipeline-status')).toContainText('1 presented candidate');
  await expect(page.locator('#post-candidate-list')).toContainText('Presented Candidate');
  await expect(page.locator('#post-candidate-list')).toContainText('Master');
  await expect(page.locator('#post-candidate-list')).not.toContainText(seafarerEmail);
  await expect(page.locator('#post-candidate-list')).toContainText('ready / ready / 2027-06-15 / 2029-02-02');
  await expect(page.locator('#post-candidate-list')).toContainText(candidateNote);
  const candidateCard = page.locator('.candidate-card', { hasText: 'Presented Candidate' }).first();
  await expect(candidateCard.locator('.candidate-card__meta')).toContainText('Employer status: Presented');

  const correctionSeafarerEmail = `ui.postvacancy.correction.${unique}@example.com`;
  const correctionSeafarerCreate = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'seafarer',
      email: correctionSeafarerEmail,
      full_name: 'Correction Candidate',
      rank: 'Master',
      department: 'deck',
      availability_status: 'available_now',
      contact_phone: '+971500004444',
      document_metadata: {
        certificate_status: 'ready',
        stcw_status: 'ready',
        passport_expiry: '2029-02-02',
        medical_expiry: '2027-06-15',
        visa_status: 'not_required',
        notes: 'Documents require an incoming request correction reason check.',
      },
    },
  });
  expect(correctionSeafarerCreate.ok()).toBeTruthy();
  const correctionSeafarer = await correctionSeafarerCreate.json();
  await acceptPresentationConsents(request, correctionSeafarer.draft_id);

  const correctionApplicationResponse = await request.post(`/api/v1/vacancies/${vacancyId}/applications`, {
    data: {
      seafarer_draft_id: correctionSeafarer.draft_id,
      email: correctionSeafarerEmail,
      note: 'Please clarify document readiness before employer presentation.',
    },
  });
  expect(correctionApplicationResponse.ok()).toBeTruthy();
  const correctionApplication = await correctionApplicationResponse.json();
  const correctionApplicationId = correctionApplication.application.vacancy_application_id as string;

  const correctionDecision = await request.patch(`/api/v1/operator/review-queue/${correctionApplicationId}/status`, {
    data: {
      decision: 'needs_correction',
      queue_type: 'vacancy_application',
      note: 'Please clarify document readiness before employer presentation.',
      review_reason_code: 'document_readiness_missing',
    },
  });
  expect(correctionDecision.ok()).toBeTruthy();
  const correctionDecisionPayload = await correctionDecision.json();
  expect(correctionDecisionPayload).toEqual(expect.objectContaining({
    ok: true,
    decision: 'needs_correction',
    request_source: 'seafarer_initiated_request',
    review_reason_code: 'document_readiness_missing',
    new_status: 'rejected',
  }));

  await page.goto(`/cabinet/?draft_id=${correctionSeafarer.draft_id}`);
  await expect(page.locator('#cabinet-task-list')).toContainText('Action required: correct incoming request');
  await expect(page.locator('#cabinet-task-list')).toContainText('Review reason: Required document readiness is missing or not readable enough for this request');
  await expect(page.locator('#cabinet-task-list')).toContainText('Please clarify document readiness before employer presentation.');
  await expect(page.getByRole('link', { name: 'Open seafarer workspace' })).toHaveAttribute(
    'href',
    `/create-profile/?draft_id=${correctionSeafarer.draft_id}#profile-section-documents`
  );

  await page.goto(`/cabinet/?draft_id=${draftId}`);
  await expect(page.locator('#cabinet-task-list')).toContainText('Action required: review presented candidates');
  await expect(page.locator('#cabinet-task-list')).toContainText('Presented candidates: 1');
  await expect(page.getByRole('link', { name: 'Open candidate selection' })).toHaveAttribute(
    'href',
    `/shipowners/candidates/?draft_id=${draftId}`
  );

  await page.goto(`/cabinet/?draft_id=${seafarer.draft_id}`);
  await expect(page.locator('#cabinet-task-list')).toContainText('Action required: search matching jobs');
  await expect(page.locator('#cabinet-task-list')).toContainText('Ready to request: 0');

  await page.goto(`/post-vacancy/?draft_id=${draftId}`);
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

  ensureApprovedContractWorkspaceReferences();
  await candidateCard.locator('.candidate-note-input').fill('Employer wants to prepare contract terms.');
  await candidateCard.getByRole('button', { name: 'Proceed with candidate' }).click();
  await expect(page.locator('#post-status')).toContainText('Candidate status updated.');
  await expect(candidateCard.locator('.candidate-card__meta')).toContainText('Employer status: Proceed with candidate');

  await page.goto(`/cabinet/?draft_id=${draftId}`);
  await expect(page.locator('#cabinet-task-list')).toContainText('Action required: propose contract');
  await expect(page.locator('#cabinet-task-list')).toContainText('Candidates ready for contract proposal: 1');
  await expect(page.getByRole('link', { name: 'Open contract proposal' })).toHaveAttribute(
    'href',
    `/shipowners/candidates/?draft_id=${draftId}`
  );

  await page.goto(`/post-vacancy/?draft_id=${draftId}`);
  await candidateCard.getByRole('button', { name: 'Propose contract' }).click();
  await expect(page.locator('#post-status')).toContainText('Contract workspace prepared.');
  await expect(candidateCard.locator('.candidate-card__meta')).toContainText('Contract: Open contract workspace');

  await page.goto(`/cabinet/?draft_id=${draftId}`);
  await expect(page.locator('#cabinet-task-list')).toContainText('Action required: review contract workspace');
  await expect(page.locator('#cabinet-task-list')).toContainText('Contract workspaces: 1');
  await expect(page.getByRole('link', { name: 'Open contract workspace' })).toHaveAttribute(
    'href',
    /\/contracts\/workspace\/\?workspace_id=.*draft_id=/
  );

  await page.goto(`/post-vacancy/?draft_id=${draftId}`);
  await page.reload();
  await expect(candidateCard.locator('.candidate-card__meta')).toContainText('Employer status: Proceed with candidate');
  await expect(candidateCard.locator('.candidate-card__meta')).toContainText('Contract: Open contract workspace');

  await page.goto(`/shipowners/candidates/?draft_id=${draftId}`);
  await expect(page.getByRole('heading', { name: 'Select candidate.' })).toBeVisible();
  await expect(page.locator('#selection-status-title')).toContainText('1 request');
  await expect(page.locator('#request-list')).toContainText(updatedTitle);
  await expect(page.locator('#candidate-list')).toContainText('Presented Candidate');
  await expect(page.locator('#candidate-list')).toContainText('Master');
  await expect(page.locator('#candidate-list')).not.toContainText(seafarerEmail);
  await expect(page.locator('#candidate-list')).toContainText('Open contract workspace');
  await page.locator('#candidate-list').getByRole('button', { name: 'Open contract workspace' }).click();
  await expect(page).toHaveURL(/\/contracts\/workspace\/\?workspace_id=.*draft_id=/);
  await expect(page.getByRole('heading', { name: 'Contract workspace.' })).toBeVisible();
  await expect(page.locator('#workspace-status-title')).toContainText('CW-');
  await expect(page.locator('#facts-grid')).toContainText('Presented Candidate');
  await expect(page.locator('#facts-grid')).toContainText(company);
  await expect(page.locator('#facts-grid')).toContainText(`MV Workspace ${unique}`);
  await expect(page.locator('#facts-grid')).toContainText(updatedTitle);
  await expect(page.locator('#field-grid')).toContainText('C-1.1');
  await expect(page.locator('#field-grid')).toContainText('C-6.1');
  await expect(page.locator('#guard-line')).toContainText('No generation, signature, employment status or invoice is created.');

  await page.goto(`/post-vacancy/?draft_id=${draftId}`);
  await candidateCard.locator('.candidate-note-input').fill('Not suitable for this rotation after salary review.');
  await candidateCard.getByRole('button', { name: 'Not suitable' }).click();
  await expect(page.locator('#post-status')).toContainText('Candidate status updated.');
  await expect(candidateCard.locator('.candidate-card__meta')).toContainText('Employer status: Not suitable');
  await expect(candidateCard.locator('.candidate-note-input')).toHaveValue('Not suitable for this rotation after salary review.');

  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(hasOverflow).toBe(false);
});
