import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { execSync } from 'node:child_process';
import fs from 'node:fs';

function cleanupCreateProfileUiTestData(): void {
  const sql = `
SELECT ud.storage_root || '/' || ud.storage_path
FROM crewportglobal.uploaded_documents ud
JOIN crewportglobal.users u ON u.user_id = ud.draft_id
WHERE u.email LIKE 'ui.prefill.%@example.com'
   OR u.email LIKE 'ui.localprefill.%@example.com'
   OR u.email LIKE 'ui.correction.%@example.com'
   OR u.email LIKE 'ui.apphistory.%@example.com'
   OR u.email LIKE 'ui.completeness.%@example.com'
   OR u.email LIKE 'ui.demandlink.%@example.com'
   OR u.email LIKE 'ui.autosave.%@example.com'
   OR u.email LIKE 'ui.localrestore.%@example.com'
   OR u.email LIKE 'ui.savebutton.%@example.com'
   OR u.email LIKE 'ui.multirole.%@example.com';

DELETE FROM crewportglobal.uploaded_documents ud
USING crewportglobal.users u
WHERE u.user_id = ud.draft_id
  AND (
    u.email LIKE 'ui.prefill.%@example.com'
    OR u.email LIKE 'ui.localprefill.%@example.com'
    OR u.email LIKE 'ui.correction.%@example.com'
    OR u.email LIKE 'ui.apphistory.%@example.com'
    OR u.email LIKE 'ui.completeness.%@example.com'
    OR u.email LIKE 'ui.demandlink.%@example.com'
    OR u.email LIKE 'ui.autosave.%@example.com'
    OR u.email LIKE 'ui.localrestore.%@example.com'
    OR u.email LIKE 'ui.savebutton.%@example.com'
    OR u.email LIKE 'ui.multirole.%@example.com'
  );

WITH ui_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.prefill.%@example.com'
     OR email LIKE 'ui.localprefill.%@example.com'
     OR email LIKE 'ui.correction.%@example.com'
     OR email LIKE 'ui.apphistory.%@example.com'
     OR email LIKE 'ui.completeness.%@example.com'
     OR email LIKE 'ui.demandlink.%@example.com'
     OR email LIKE 'ui.autosave.%@example.com'
     OR email LIKE 'ui.localrestore.%@example.com'
     OR email LIKE 'ui.savebutton.%@example.com'
     OR email LIKE 'ui.multirole.%@example.com'
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
  WHERE email LIKE 'ui.prefill.%@example.com'
     OR email LIKE 'ui.localprefill.%@example.com'
     OR email LIKE 'ui.correction.%@example.com'
     OR email LIKE 'ui.apphistory.%@example.com'
     OR email LIKE 'ui.completeness.%@example.com'
     OR email LIKE 'ui.demandlink.%@example.com'
     OR email LIKE 'ui.autosave.%@example.com'
     OR email LIKE 'ui.localrestore.%@example.com'
     OR email LIKE 'ui.savebutton.%@example.com'
     OR email LIKE 'ui.multirole.%@example.com'
)
UPDATE crewportglobal.seafarer_profiles sp
SET review_status = 'rejected', updated_at = now()
FROM ui_users uu
WHERE sp.user_id = uu.user_id
  AND sp.review_status IN ('submitted_for_human_review', 'in_review', 'approved');

WITH ui_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.apphistory.%@example.com'
     OR email LIKE 'ui.demandlink.%@example.com'
     OR email LIKE 'ui.autosave.%@example.com'
     OR email LIKE 'ui.localrestore.%@example.com'
     OR email LIKE 'ui.savebutton.%@example.com'
     OR email LIKE 'ui.multirole.%@example.com'
)
UPDATE crewportglobal.vacancy_requests vr
SET publication_status = 'closed', updated_at = now()
FROM ui_users uu
WHERE vr.created_by_user_id = uu.user_id
  AND vr.publication_status IN ('submitted_for_human_review', 'in_review', 'published');

WITH ui_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.apphistory.%@example.com'
     OR email LIKE 'ui.demandlink.%@example.com'
     OR email LIKE 'ui.autosave.%@example.com'
     OR email LIKE 'ui.localrestore.%@example.com'
     OR email LIKE 'ui.savebutton.%@example.com'
     OR email LIKE 'ui.multirole.%@example.com'
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
  cleanupCreateProfileUiTestData();
});

async function selectFirstCatalogOption(page: Page, selector: string): Promise<string> {
  await expect.poll(async () => page.locator(`${selector} option`).count(), { timeout: 7000 }).toBeGreaterThan(1);
  const value = await page.locator(selector).evaluate((element) => {
    const select = element as HTMLSelectElement;
    const option = Array.from(select.options).find((item) => item.value.trim() !== '');
    return option ? option.value : '';
  });
  expect(value).not.toBe('');
  await page.locator(selector).selectOption(value);
  return value;
}

async function selectPreferredVesselTypes(page: Page, values: string[]): Promise<void> {
  await expect.poll(async () => page.locator('#create-vessel-types-options input[type="checkbox"]').count(), { timeout: 7000 }).toBeGreaterThan(1);
  for (const value of values) {
    await page.locator('#create-vessel-types-options').getByLabel(value, { exact: true }).check();
  }
  await expect(page.locator('#create-vessel-types')).toHaveValues(values);
}

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

test('create profile prefill from draft_id preserves patch flow', async ({ page }) => {
  await page.goto('/create-profile/');
  await page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem('crewportglobal.language', 'en');
  });

  await page.goto('/create-profile/');

  await page.locator('#create-full-name').fill('Alex Marinov');
  await page.locator('#create-email').fill(`ui.prefill.${Date.now()}@example.com`);
  await page.locator('#create-country').fill('AE');
  await page.locator('#create-rank').fill('Second Officer');
  await page.locator('#create-department').selectOption('deck');
  await page.locator('#create-nationality').fill('PH');
  await page.locator('#create-residence').fill('AE');
  await page.locator('#create-availability').selectOption('available_later');
  await page.locator('#create-availability-date').fill('2026-08-15');
  await page.locator('#create-phone').fill('+971501112233');
  await page.locator('#create-salary').fill('4600');
  await selectPreferredVesselTypes(page, ['BULK CARRIER', 'CONTAINER SHIP']);
  await page.locator('#create-certificate-status').selectOption('ready');
  await page.locator('#create-stcw-status').selectOption('collecting');
  await page.locator('#create-passport-expiry').fill('2028-08-15');
  await page.locator('#create-medical-expiry').fill('2026-12-20');
  await page.locator('#create-visa-status').selectOption('required');
  await page.locator('#create-document-notes').fill('Schengen visa appointment booked.');

  await page.locator('#create-submit').click();

  await expect(page.locator('#create-status')).toContainText('saved');
  await expect(page).toHaveURL(/draft_id=/);

  const draftId = await page.evaluate(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('draft_id') || '';
  });
  expect(draftId).not.toBe('');

  await page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem('crewportglobal.language', 'en');
  });

  await page.goto(`/create-profile/?draft_id=${draftId}`);
  await expect(page.locator('#create-status')).toContainText('prefilled');

  await expect(page.locator('#create-full-name')).toHaveValue('Alex Marinov');
  await expect(page.locator('#create-email')).toHaveValue(new RegExp('^ui\\.prefill\\..+@example\\.com$'));
  await expect(page.locator('#create-country')).toHaveValue('AE');
  await expect(page.locator('#create-rank')).toHaveValue('Second Officer');
  await expect(page.locator('#create-department')).toHaveValue('deck');
  await expect(page.locator('#create-nationality')).toHaveValue('PH');
  await expect(page.locator('#create-residence')).toHaveValue('AE');
  await expect(page.locator('#create-availability')).toHaveValue('available_later');
  await expect(page.locator('#create-availability-date')).toHaveValue('2026-08-15');
  await expect(page.locator('#create-phone')).toHaveValue('+971501112233');
  await expect(page.locator('#create-salary')).toHaveValue('4600.00');
  await expect(page.locator('#create-vessel-types')).toHaveValues(['BULK CARRIER', 'CONTAINER SHIP']);
  await expect(page.locator('#create-certificate-status')).toHaveValue('ready');
  await expect(page.locator('#create-stcw-status')).toHaveValue('collecting');
  await expect(page.locator('#create-passport-expiry')).toHaveValue('2028-08-15');
  await expect(page.locator('#create-medical-expiry')).toHaveValue('2026-12-20');
  await expect(page.locator('#create-visa-status')).toHaveValue('required');
  await expect(page.locator('#create-document-notes')).toHaveValue('Schengen visa appointment booked.');

  await page.locator('#create-rank').fill('Chief Officer');
  await page.locator('#create-submit').click();
  await expect(page.locator('#create-status')).toContainText('saved');

  await page.reload();
  await expect(page.locator('#create-rank')).toHaveValue('Chief Officer');
});

test('create profile save confirm renders backend S-code missing items and highlights fields', async ({ page }) => {
  await page.goto('/create-profile/');
  await page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem('crewportglobal.language', 'en');
  });

  await page.goto('/create-profile/');
  await expect(page.locator('#create-submit')).toHaveText('Save / confirm data');
  await expect(page.locator('#profile-section-contact .workspace-section-save')).toBeHidden();
  await expect(page.locator('#create-document-readiness-save')).toBeHidden();

  await page.locator('#create-full-name').fill('Completeness Gate Seafarer');
  await page.locator('#create-email').fill(`ui.completeness.${Date.now()}@example.com`);
  await page.locator('#create-submit').click();

  await expect(page).toHaveURL(/draft_id=/);
  await expect(page.locator('#create-missing-list')).toContainText('S-1.3: Contact phone');
  await expect(page.locator('#create-missing-list')).toContainText('S-12.D1: Passport / ID document upload');
  await expect(page.locator('label:has(#create-phone)')).toHaveClass(/is-completeness-missing/);
  await expect(page.locator('#profile-section-document-upload')).toHaveClass(/is-completeness-missing/);

  await page.locator('#create-missing-list a', { hasText: 'S-12.D1' }).click();
  await expect(page).toHaveURL(/#profile-section-document-upload$/);
});

test('create profile document upload shows exact file limit and type validation', async ({ page, request }) => {
  const email = `ui.savebutton.upload.${Date.now()}@example.com`;
  const createResponse = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'seafarer',
      email,
      full_name: 'Upload Validation Seafarer',
      rank: 'Able Seaman',
      department: 'deck',
    },
  });
  expect(createResponse.status()).toBe(201);
  const created = await createResponse.json();

  await page.goto(`/create-profile/?draft_id=${created.draft_id}`);
  await page.evaluate(() => {
    window.localStorage.setItem('crewportglobal.language', 'en');
  });
  await page.reload();

  await expect(page.locator('#profile-section-document-upload')).toHaveAttribute('data-extraction-mode', 'future_ai_assisted_confirmation');
  await expect(page.locator('#create-document-upload-type')).toBeHidden();
  await expect(page.locator('#create-document-upload-list .document-type-row')).toHaveCount(10);
  const medicalDocumentRow = page.locator('#create-document-upload-list .document-type-row', { hasText: 'Medical certificate' });
  await medicalDocumentRow.locator('.document-type-row__title').click();
  await expect(page.locator('#create-document-upload-type')).toHaveValue('medical_certificate');
  await expect(page.locator('#create-document-upload-status')).toContainText('Medical certificate selected');
  await expect.poll(async () => page.evaluate(() => {
    const upload = document.getElementById('profile-section-document-upload');
    const contact = document.getElementById('profile-section-contact');
    return Boolean(upload && contact && upload.compareDocumentPosition(contact) & Node.DOCUMENT_POSITION_FOLLOWING);
  })).toBe(true);
  await expect(page.locator('#create-document-upload-status')).toContainText('Maximum size: 10 MB');

  await expect(medicalDocumentRow.locator('.document-type-row__file')).toHaveCount(0);
  const medicalUploadButton = medicalDocumentRow.locator('.document-type-row__upload button');
  await expect(medicalUploadButton).toHaveText('Upload');
  const tooLargeChooserPromise = page.waitForEvent('filechooser');
  await medicalUploadButton.click();
  const tooLargeChooser = await tooLargeChooserPromise;
  await tooLargeChooser.setFiles({
    name: 'too-large.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.concat([
      Buffer.from('%PDF-1.4\n'),
      Buffer.alloc((10 * 1024 * 1024) + 1),
      Buffer.from('\n%%EOF\n'),
    ]),
  });
  await expect(page.locator('#create-document-upload-status')).toContainText('too large');
  await expect(page.locator('#create-document-upload-status')).toContainText('10.0 MB');

  await medicalDocumentRow.locator('input[type="file"]').setInputFiles({
    name: 'unsupported.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('plain text is not an accepted evidence upload'),
  });
  await expect(page.locator('#create-document-upload-status')).toContainText('Unsupported file type');
});

test('create profile keeps seafarer save and upload active for multi-role account', async ({ page, request }) => {
  const unique = Date.now();
  const email = `ui.multirole.${unique}@example.com`;

  const employerResponse = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'crewing_manager',
      email,
      full_name: 'Multi Role Account',
      role_in_company: 'manager',
      company_name: `Multi Role Marine ${unique}`,
      country_code: 'AE',
      registration_number: `MR-${unique}`,
    },
  });
  expect(employerResponse.status()).toBe(201);

  const seafarerResponse = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'seafarer',
      email,
      full_name: 'Multi Role Seafarer',
      rank: 'Able Seaman',
      department: 'deck',
      contact_phone: '+971501234567',
    },
  });
  expect(seafarerResponse.status()).toBe(201);
  const created = await seafarerResponse.json();

  await page.goto(`/create-profile/?draft_id=${created.draft_id}`);
  await page.evaluate(() => {
    window.localStorage.setItem('crewportglobal.language', 'en');
  });
  await page.reload();

  await expect(page.locator('#create-status')).toContainText('prefilled');
  await expect(page.locator('#create-document-upload-status')).toContainText('Maximum size: 10 MB');
  await expect(page.locator('#create-document-upload-status')).not.toContainText('employer/vacancy form');
  await expect(page.locator('#create-document-upload-submit')).toBeEnabled();

  await page.locator('#profile-section-contact > summary').click();
  await page.locator('#create-permanent-address').fill('Multi Role Seafarer Address');
  await page.locator('#create-submit').click();
  await expect(page.locator('#create-status')).toContainText(/saved|Complete/);

  await expect.poll(async () => {
    const draftResponse = await request.get(`/api/v1/registration/drafts/${created.draft_id}?role=seafarer`);
    expect(draftResponse.status()).toBe(200);
    const draftBody = await draftResponse.json();
    const metadata = typeof draftBody.payload.seafarer_profile.document_metadata === 'string'
      ? JSON.parse(draftBody.payload.seafarer_profile.document_metadata)
      : draftBody.payload.seafarer_profile.document_metadata;
    return metadata?.seafarer_workspace?.contact_and_addresses?.permanent_address || '';
  }, { timeout: 7000 }).toBe('Multi Role Seafarer Address');

  const passportDocumentRow = page.locator('#create-document-upload-list .document-type-row', { hasText: 'Passport / ID' });
  const passportChooserPromise = page.waitForEvent('filechooser');
  await passportDocumentRow.locator('.document-type-row__upload button').click();
  const passportChooser = await passportChooserPromise;
  await passportChooser.setFiles({
    name: 'multi-role-passport.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n'),
  });
  await expect(page.locator('#create-document-upload-status')).not.toContainText('form_type');
  await expect(page.locator('#create-document-upload-status')).toContainText('multi-role-passport.pdf');
  await expect(page.locator('#create-document-upload-status')).toContainText('document list');
  await expect(page.locator('#create-document-upload-list')).toContainText('multi-role-passport.pdf', { timeout: 7000 });
  await expect(page.locator('#create-document-upload-list')).toContainText('Passport / ID', { timeout: 7000 });
  await expect(page.locator('#create-document-upload-list')).toContainText('Pending team review', { timeout: 7000 });
});

test('create profile keeps local-only field edits before backend draft exists', async ({ page }) => {
  await page.goto('/create-profile/');
  await page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem('crewportglobal.language', 'en');
  });

  await page.goto('/create-profile/');
  await page.locator('#create-rank').fill('Motorman');
  await page.locator('#create-department').selectOption('engine');
  await page.locator('#profile-section-contact > summary').click();
  await page.locator('#create-permanent-address').fill('Local Autosave Port Road 7');
  await page.locator('#create-emergency-contact-name').fill('Local Contact');
  await page.locator('#profile-section-addresses > summary').click();
  await page.locator('#create-permanent-street').fill('Local Street');
  await page.locator('#create-registration-city').fill('Batumi');

  await page.locator('#create-submit').click();
  await expect(page.locator('#create-status')).toContainText('browser');
  await page.reload();
  await expect(page.locator('#create-status')).toContainText('local changes');
  await expect(page.locator('#create-rank')).toHaveValue('Motorman');
  await expect(page.locator('#create-department')).toHaveValue('engine');
  await page.locator('#profile-section-contact > summary').click();
  await expect(page.locator('#create-permanent-address')).toHaveValue('Local Autosave Port Road 7');
  await expect(page.locator('#create-emergency-contact-name')).toHaveValue('Local Contact');
  await page.locator('#profile-section-addresses > summary').click();
  await expect(page.locator('#create-permanent-street')).toHaveValue('Local Street');
  await expect(page.locator('#create-registration-city')).toHaveValue('Batumi');
});

test('create profile restores existing draft edits immediately after reload', async ({ page, request }) => {
  const email = `ui.localrestore.${Date.now()}@example.com`;
  const createResponse = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'seafarer',
      email,
      full_name: 'Immediate Restore Seafarer',
      rank: 'Ordinary Seaman',
      department: 'deck',
    },
  });
  expect(createResponse.status()).toBe(201);
  const created = await createResponse.json();

  await page.goto(`/create-profile/?draft_id=${created.draft_id}`);
  await page.evaluate(() => {
    window.localStorage.setItem('crewportglobal.language', 'en');
  });
  await expect(page.locator('#create-status')).toContainText('prefilled');
  await page.locator('#create-rank').fill('Bosun');
  await page.locator('#profile-section-contact > summary').click();
  await page.locator('#create-permanent-address').fill('Immediate Restore Address');
  await page.locator('#create-residence-city').fill('Poti');

  await page.reload();
  await expect(page.locator('#create-status')).toContainText(/local changes|autosaved/);
  await expect(page.locator('#create-rank')).toHaveValue('Bosun');
  await page.locator('#profile-section-contact > summary').click();
  await expect(page.locator('#create-permanent-address')).toHaveValue('Immediate Restore Address');
  await expect(page.locator('#create-residence-city')).toHaveValue('Poti');
  await expect(page.locator('#create-status')).toContainText('autosaved', { timeout: 7000 });
});

test('create profile save confirm persists existing draft edits when visible email is empty', async ({ page, request }) => {
  const email = `ui.savebutton.${Date.now()}@example.com`;
  const createResponse = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'seafarer',
      email,
      full_name: 'Save Button Seafarer',
      rank: 'Able Seaman',
      department: 'deck',
    },
  });
  expect(createResponse.status()).toBe(201);
  const created = await createResponse.json();

  await page.goto(`/create-profile/?draft_id=${created.draft_id}`);
  await page.evaluate(() => {
    window.localStorage.setItem('crewportglobal.language', 'en');
  });
  await expect(page.locator('#create-status')).toContainText('prefilled');

  await page.locator('#create-email').fill('');
  await page.locator('#profile-section-contact > summary').click();
  await page.locator('#create-permanent-address').fill('Save Button Pier 22');
  await page.locator('#create-emergency-contact-name').fill('Save Button Contact');
  await page.locator('#profile-section-addresses > summary').click();
  await page.locator('#create-registration-city').fill('Riga');

  await page.locator('#create-submit').click();
  await expect(page.locator('#create-status')).toContainText(/saved|Complete/);

  await expect.poll(async () => {
    const draftResponse = await request.get(`/api/v1/registration/drafts/${created.draft_id}`);
    expect(draftResponse.status()).toBe(200);
    const draftBody = await draftResponse.json();
    const metadata = typeof draftBody.payload.seafarer_profile.document_metadata === 'string'
      ? JSON.parse(draftBody.payload.seafarer_profile.document_metadata)
      : draftBody.payload.seafarer_profile.document_metadata;
    return {
      permanent_address: metadata?.seafarer_workspace?.contact_and_addresses?.permanent_address || '',
      registration_city: metadata?.seafarer_workspace?.address_details?.registration_city || '',
    };
  }, { timeout: 7000 }).toEqual({
    permanent_address: 'Save Button Pier 22',
    registration_city: 'Riga',
  });

  await page.reload();
  await expect(page.locator('#create-status')).toContainText(/prefilled|local changes/);
  await page.locator('#profile-section-contact > summary').click();
  await expect(page.locator('#create-permanent-address')).toHaveValue('Save Button Pier 22');
  await page.locator('#profile-section-addresses > summary').click();
  await expect(page.locator('#create-registration-city')).toHaveValue('Riga');
});

test('create profile save confirm keeps backend data after hard reload and supports any vessel type', async ({ page, request }) => {
  const email = `ui.savebutton.${Date.now()}.reload@example.com`;
  const createResponse = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'seafarer',
      email,
      full_name: 'Reload Persistence Seafarer',
      rank: 'Able Seaman',
      department: 'deck',
    },
  });
  expect(createResponse.status()).toBe(201);
  const created = await createResponse.json();

  await page.goto(`/create-profile/?draft_id=${created.draft_id}`);
  await page.evaluate(() => {
    window.localStorage.setItem('crewportglobal.language', 'en');
  });
  await expect(page.locator('#create-status')).toContainText('prefilled');

  await selectPreferredVesselTypes(page, ['Any vessel type']);
  await page.locator('#profile-section-contact').evaluate((element) => element.setAttribute('open', ''));
  await page.locator('#create-permanent-address').fill('Reload Persistence Deck 7');
  await page.locator('#create-residence-city').fill('Limassol');
  await page.locator('#create-submit').click();
  await expect(page.locator('#create-status')).toContainText(/saved|Complete/);

  await expect.poll(async () => {
    const draftResponse = await request.get(`/api/v1/registration/drafts/${created.draft_id}`);
    expect(draftResponse.status()).toBe(200);
    const draftBody = await draftResponse.json();
    const profile = draftBody.payload.seafarer_profile;
    const metadata = typeof profile.document_metadata === 'string'
      ? JSON.parse(profile.document_metadata)
      : profile.document_metadata;
    const preferredVesselTypes = typeof profile.preferred_vessel_types === 'string'
      ? JSON.parse(profile.preferred_vessel_types)
      : profile.preferred_vessel_types;
    return {
      permanent_address: metadata?.seafarer_workspace?.contact_and_addresses?.permanent_address || '',
      residence_city: metadata?.seafarer_workspace?.contact_and_addresses?.residence_city || '',
      preferred_vessel_types: Array.isArray(preferredVesselTypes) ? preferredVesselTypes : [],
    };
  }, { timeout: 7000 }).toEqual({
    permanent_address: 'Reload Persistence Deck 7',
    residence_city: 'Limassol',
    preferred_vessel_types: ['Any vessel type'],
  });

  await page.evaluate((draftId) => {
    window.localStorage.setItem(`crewportglobal.createProfile.localDraft.${draftId}`, JSON.stringify({
      version: 1,
      draft_id: draftId,
      saved_at: '2000-01-01T00:00:00.000Z',
      fields: {
        'create-permanent-address': '',
        'create-residence-city': '',
        'create-vessel-types': [],
      },
    }));
  }, created.draft_id);

  await page.reload();
  await expect(page.locator('#create-status')).toContainText('prefilled');
  await expect(page.locator('#create-vessel-types')).toHaveValues(['Any vessel type']);
  await page.locator('#profile-section-contact').evaluate((element) => element.setAttribute('open', ''));
  await expect(page.locator('#create-permanent-address')).toHaveValue('Reload Persistence Deck 7');
  await expect(page.locator('#create-residence-city')).toHaveValue('Limassol');
});

test('create profile uses catalog selects and copies permanent address to registration', async ({ page, request }) => {
  const email = `ui.savebutton.${Date.now()}.catalogs@example.com`;
  const createResponse = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'seafarer',
      email,
      full_name: 'Catalog Select Seafarer',
      rank: 'Able Seaman',
      department: 'deck',
    },
  });
  expect(createResponse.status()).toBe(201);
  const created = await createResponse.json();

  await page.goto(`/create-profile/?draft_id=${created.draft_id}`);
  await page.evaluate(() => {
    window.localStorage.setItem('crewportglobal.language', 'en');
  });
  await expect(page.locator('#create-status')).toContainText('prefilled');

  for (const selector of [
    '#create-gender',
    '#create-civil-status',
    '#create-emergency-contact-relation',
    '#create-kin-gender',
    '#create-kin-relation',
    '#create-last-vessel-type',
  ]) {
    await expect(page.locator(selector)).toHaveJSProperty('tagName', 'SELECT');
  }
  await expect(page.locator('#create-vessel-types')).toHaveJSProperty('multiple', true);
  await expect(page.locator('#create-vessel-types')).toBeHidden();
  await expect(page.locator('#create-vessel-types-options')).toBeVisible();
  await expect.poll(async () => page.locator('#create-vessel-types-options input[type="checkbox"]').count(), { timeout: 7000 }).toBeGreaterThan(1);

  await page.locator('#profile-section-contact > summary').click();
  const gender = await selectFirstCatalogOption(page, '#create-gender');
  const civilStatus = await selectFirstCatalogOption(page, '#create-civil-status');
  const emergencyRelation = await selectFirstCatalogOption(page, '#create-emergency-contact-relation');
  await page.locator('#create-residence').fill('CY');
  await page.locator('#create-residence-city').fill('Limassol');

  await page.locator('#profile-section-addresses > summary').click();
  await page.locator('#create-permanent-street').fill('Catalog Street');
  await page.locator('#create-permanent-house').fill('9');
  await page.locator('#create-permanent-flat').fill('12');
  await page.locator('#create-permanent-region').fill('Limassol District');
  await page.locator('#create-permanent-post-code').fill('4040');
  await page.locator('#create-permanent-comments').fill('Reception entrance');
  await page.locator('#create-registration-same-as-permanent').check();

  await expect(page.locator('#create-registration-street')).toHaveValue('Catalog Street');
  await expect(page.locator('#create-registration-house')).toHaveValue('9');
  await expect(page.locator('#create-registration-flat')).toHaveValue('12');
  await expect(page.locator('#create-registration-city')).toHaveValue('Limassol');
  await expect(page.locator('#create-registration-country')).toHaveValue('CY');
  await expect(page.locator('#create-registration-region')).toHaveValue('Limassol District');
  await expect(page.locator('#create-registration-post-code')).toHaveValue('4040');

  await page.locator('#profile-section-family > summary').click();
  const kinGender = await selectFirstCatalogOption(page, '#create-kin-gender');
  const kinRelation = await selectFirstCatalogOption(page, '#create-kin-relation');
  await page.locator('#profile-section-sea-service > summary').click();
  const lastVesselType = await selectFirstCatalogOption(page, '#create-last-vessel-type');

  await page.locator('#create-submit').click();
  await expect(page.locator('#create-status')).toContainText(/saved|Complete/);

  await expect.poll(async () => {
    const draftResponse = await request.get(`/api/v1/registration/drafts/${created.draft_id}`);
    expect(draftResponse.status()).toBe(200);
    const draftBody = await draftResponse.json();
    const metadata = typeof draftBody.payload.seafarer_profile.document_metadata === 'string'
      ? JSON.parse(draftBody.payload.seafarer_profile.document_metadata)
      : draftBody.payload.seafarer_profile.document_metadata;
    return {
      gender: metadata?.seafarer_workspace?.personal_details?.gender || '',
      civil_status: metadata?.seafarer_workspace?.personal_details?.civil_status || '',
      emergency_contact_relation: metadata?.seafarer_workspace?.contact_and_addresses?.emergency_contact_relation || '',
      registration_street: metadata?.seafarer_workspace?.address_details?.registration_street || '',
      registration_city: metadata?.seafarer_workspace?.address_details?.registration_city || '',
      registration_country: metadata?.seafarer_workspace?.address_details?.registration_country || '',
      kin_gender: metadata?.seafarer_workspace?.family_details?.kin_gender || '',
      kin_relation: metadata?.seafarer_workspace?.family_details?.kin_relation || '',
      last_vessel_type: metadata?.seafarer_workspace?.sea_service?.last_vessel_type || '',
    };
  }, { timeout: 7000 }).toEqual({
    gender,
    civil_status: civilStatus,
    emergency_contact_relation: emergencyRelation,
    registration_street: 'Catalog Street',
    registration_city: 'Limassol',
    registration_country: 'CY',
    kin_gender: kinGender,
    kin_relation: kinRelation,
    last_vessel_type: lastVesselType,
  });

  await page.reload();
  await expect(page.locator('#create-status')).toContainText(/prefilled|local changes/);
  await page.locator('#profile-section-contact').evaluate((element) => element.setAttribute('open', ''));
  await expect(page.locator('#create-civil-status')).toHaveValue(civilStatus);
  await page.locator('#profile-section-addresses').evaluate((element) => element.setAttribute('open', ''));
  await expect(page.locator('#create-registration-street')).toHaveValue('Catalog Street');
  await expect(page.locator('#create-registration-city')).toHaveValue('Limassol');
});

test('create profile autosaves contact and address edits before reload', async ({ page, request }) => {
  const email = `ui.autosave.${Date.now()}@example.com`;
  const createResponse = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'seafarer',
      email,
      full_name: 'Autosave Contact Seafarer',
      rank: 'Able Seaman',
      department: 'deck',
    },
  });
  expect(createResponse.status()).toBe(201);
  const created = await createResponse.json();

  await page.goto(`/create-profile/?draft_id=${created.draft_id}`);
  await page.evaluate(() => {
    window.localStorage.setItem('crewportglobal.language', 'en');
  });
  await expect(page.locator('#create-status')).toContainText('prefilled');

  await page.locator('#profile-section-contact > summary').click();
  await page.locator('#create-permanent-address').fill('Autosave Pier 12, Limassol');
  await page.locator('#create-residence-city').fill('Limassol');
  await page.locator('#create-emergency-contact-name').fill('Nina Autosave');
  await selectFirstCatalogOption(page, '#create-emergency-contact-relation');
  await page.locator('#create-emergency-contact-phone').fill('+35799123456');

  await page.locator('#profile-section-addresses > summary').click();
  await page.locator('#create-permanent-street').fill('Autosave Street');
  await page.locator('#create-permanent-house').fill('12A');
  await page.locator('#create-registration-city').fill('Larnaca');
  await page.locator('#create-registration-country').fill('Cyprus');

  await expect(page.locator('#create-status')).toContainText('autosaved', { timeout: 7000 });

  await expect.poll(async () => {
    const draftResponse = await request.get(`/api/v1/registration/drafts/${created.draft_id}`);
    expect(draftResponse.status()).toBe(200);
    const draftBody = await draftResponse.json();
    const metadata = typeof draftBody.payload.seafarer_profile.document_metadata === 'string'
      ? JSON.parse(draftBody.payload.seafarer_profile.document_metadata)
      : draftBody.payload.seafarer_profile.document_metadata;
    return {
      emergency_contact_name: metadata?.seafarer_workspace?.contact_and_addresses?.emergency_contact_name || '',
      permanent_address: metadata?.seafarer_workspace?.contact_and_addresses?.permanent_address || '',
      registration_city: metadata?.seafarer_workspace?.address_details?.registration_city || '',
    };
  }, { timeout: 7000 }).toEqual({
    emergency_contact_name: 'Nina Autosave',
    permanent_address: 'Autosave Pier 12, Limassol',
    registration_city: 'Larnaca',
  });

  await page.reload();
  await expect(page.locator('#create-status')).toContainText(/prefilled|local changes|autosaved/);
  await page.locator('#profile-section-contact > summary').click();
  await expect(page.locator('#create-permanent-address')).toHaveValue('Autosave Pier 12, Limassol');
  await expect(page.locator('#create-residence-city')).toHaveValue('Limassol');
  await expect(page.locator('#create-emergency-contact-name')).toHaveValue('Nina Autosave');
  await page.locator('#profile-section-addresses > summary').click();
  await expect(page.locator('#create-permanent-street')).toHaveValue('Autosave Street');
  await expect(page.locator('#create-registration-city')).toHaveValue('Larnaca');
});

test('create profile demand completeness link opens exact post vacancy salary field', async ({ page, request }) => {
  const unique = Date.now();
  const email = `ui.demandlink.${unique}@example.com`;

  const createResponse = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'employer',
      role_in_company: 'manager',
      email,
      full_name: 'Demand Link Employer',
      company_name: `Demand Link Marine ${unique}`,
      country_code: 'SG',
      registration_number: `SG-DEMAND-LINK-${unique}`,
      vessel: {
        vessel_type: 'Bulk Carrier',
      },
      vacancy: {
        vacancy_title: 'Demand Link Chief Officer',
        rank: 'Chief Officer',
        department: 'deck',
        vessel_type: 'Bulk Carrier',
        join_date: '2026-08-15',
        contract_duration: '4 months +/- 1',
        salary_max_usd: 7200,
        currency: 'USD',
        employer_country_code: 'SG',
        requirements: 'Demand link test request with salary minimum intentionally missing.',
      },
    },
  });
  expect(createResponse.ok()).toBeTruthy();
  const created = (await createResponse.json()) as { draft_id: string };

  await page.goto(`/create-profile/?draft_id=${created.draft_id}`);
  await expect(page.locator('#create-missing-list')).toContainText('R-4.2: Salary minimum');
  await expect(page.locator('#create-document-upload-status')).toContainText('employer/vacancy form');
  await expect(page.locator('#create-document-upload-status a')).toHaveAttribute('href', `/post-vacancy/?draft_id=${created.draft_id}#post-document-upload-title`);
  await expect(page.locator('#create-document-upload-submit')).toBeDisabled();

  await page.locator('#create-missing-list a', { hasText: 'R-4.2' }).click();
  await expect(page).toHaveURL(new RegExp(`/post-vacancy/\\?draft_id=${created.draft_id}#post-salary-min$`));
  await expect(page.locator('#post-salary-min')).toBeVisible();
  await expect(page.locator('label:has(#post-salary-min)')).toHaveClass(/is-completeness-target/);
});

test('create profile prefill falls back to local draft when draft_id is missing', async ({ page }) => {
  await page.goto('/create-profile/');
  await page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem('crewportglobal.language', 'en');
  });

  const email = `ui.localprefill.${Date.now()}@example.com`;

  await page.goto('/create-profile/');
  await page.locator('#create-full-name').fill('Nikolai Sidorov');
  await page.locator('#create-email').fill(email);
  await page.locator('#create-country').fill('AE');
  await page.locator('#create-rank').fill('Electrical Officer');
  await page.locator('#create-department').selectOption('engine');
  await page.locator('#create-nationality').fill('IN');
  await page.locator('#create-residence').fill('AE');
  await page.locator('#create-availability').selectOption('available_now');
  await page.locator('#create-availability-date').fill('2026-09-01');
  await page.locator('#create-phone').fill('+971500009999');
  await page.locator('#create-salary').fill('5000');
  await selectPreferredVesselTypes(page, ['LNG', 'OIL TANKER']);
  await page.locator('#create-certificate-status').selectOption('ready');
  await page.locator('#create-stcw-status').selectOption('ready');
  await page.locator('#create-passport-expiry').fill('2029-01-10');
  await page.locator('#create-medical-expiry').fill('2027-02-05');
  await page.locator('#create-visa-status').selectOption('not_required');
  await page.locator('#create-document-notes').fill('All metadata ready for review.');

  await page.locator('#create-submit').click();
  await expect(page.locator('#create-status')).toContainText('saved');

  await page.goto('/create-profile/');

  await expect(page.locator('#create-full-name')).toHaveValue('Nikolai Sidorov');
  await expect(page.locator('#create-email')).toHaveValue(email);
  await expect(page.locator('#create-country')).toHaveValue('AE');
  await expect(page.locator('#create-rank')).toHaveValue('Electrical Officer');
  await expect(page.locator('#create-department')).toHaveValue('engine');
  await expect(page.locator('#create-nationality')).toHaveValue('IN');
  await expect(page.locator('#create-residence')).toHaveValue('AE');
  await expect(page.locator('#create-availability')).toHaveValue('available_now');
  await expect(page.locator('#create-availability-date')).toHaveValue('2026-09-01');
  await expect(page.locator('#create-phone')).toHaveValue('+971500009999');
  await expect(page.locator('#create-salary')).toHaveValue('5000.00');
  await expect(page.locator('#create-vessel-types')).toHaveValues(['LNG', 'OIL TANKER']);
  await expect(page.locator('#create-certificate-status')).toHaveValue('ready');
  await expect(page.locator('#create-stcw-status')).toHaveValue('ready');
  await expect(page.locator('#create-passport-expiry')).toHaveValue('2029-01-10');
  await expect(page.locator('#create-medical-expiry')).toHaveValue('2027-02-05');
  await expect(page.locator('#create-visa-status')).toHaveValue('not_required');
  await expect(page.locator('#create-document-notes')).toHaveValue('All metadata ready for review.');
});

test('create profile shows needs correction status and latest correction note for existing draft', async ({ page, request }) => {
  const unique = Date.now();
  const email = `ui.correction.${unique}@example.com`;

  const createResponse = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'seafarer',
      email,
      full_name: 'Ivan Petrov',
      rank: 'Third Officer',
      department: 'deck',
      availability_status: 'available_later',
      availability_date: '2026-11-20',
      contact_phone: '+971500001111',
    },
  });
  expect(createResponse.ok()).toBeTruthy();
  const created = (await createResponse.json()) as { draft_id: string };

  const note = 'Missing certificate details and availability date.';
  const correctionResponse = await request.patch(`/api/v1/operator/review-queue/${created.draft_id}/status`, {
    data: {
      decision: 'needs_correction',
      note,
    },
  });
  expect(correctionResponse.ok()).toBeTruthy();

  await page.goto(`/create-profile/?draft_id=${created.draft_id}`);

  await expect(page.locator('#create-review-status')).toContainText('Needs correction');
  await expect(page.locator('#create-correction-note')).toContainText(note);

  await expect(page.locator('#create-full-name')).toHaveValue('Ivan Petrov');
  await expect(page.locator('#create-email')).toHaveValue(email);
  await expect(page.locator('#create-rank')).toHaveValue('Third Officer');
  await expect(page.locator('#create-department')).toHaveValue('deck');
});

test('create profile shows vacancy application history for existing draft', async ({ page, request }) => {
  const unique = Date.now();
  const title = `ETO Application History ${unique}`;
  const employerEmail = `ui.apphistory.employer.${unique}@example.com`;
  const seafarerEmail = `ui.apphistory.seafarer.${unique}@example.com`;
  const note = 'Available after current contract, documents ready.';

  const employerCreate = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'employer',
      role_in_company: 'recruiter',
      email: employerEmail,
      full_name: 'Application History Employer',
      company_name: `History Marine ${unique}`,
      country_code: 'SG',
      registration_number: `SG-HISTORY-${unique}`,
      vessel: {
        vessel_name: `MV History ${unique}`,
        vessel_type: 'Container Ship',
        imo_number: `IMO${9600000 + (unique % 300000)}`,
      },
      vacancy: {
        vacancy_title: title,
        rank: 'Electrical Technical Officer',
        department: 'engine',
        vessel_type: 'Container Ship',
        join_date: '2026-10-20',
        contract_duration: '5 months',
        salary_min_usd: 6400,
        salary_max_usd: 7200,
        currency: 'USD',
        employer_country_code: 'SG',
        requirements: 'ETO with container vessel experience and valid STCW documents.',
      },
    },
  });
  expect(employerCreate.ok()).toBeTruthy();
  const employer = await employerCreate.json();
  const vacancyId = employer.payload.vacancy_request.vacancy_request_id as string;

  const companyDecision = await request.patch(`/api/v1/operator/review-queue/${employer.draft_id}/status`, {
    data: {
      decision: 'reviewed',
      queue_type: 'company_verification',
    },
  });
  expect(companyDecision.ok()).toBeTruthy();

  const vacancyDecision = await request.patch(`/api/v1/operator/review-queue/${employer.draft_id}/status`, {
    data: {
      decision: 'reviewed',
      queue_type: 'vacancy_request',
    },
  });
  expect(vacancyDecision.ok()).toBeTruthy();

  const seafarerCreate = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'seafarer',
      email: seafarerEmail,
      full_name: 'Application History Seafarer',
      rank: 'Electrical Technical Officer',
      department: 'engine',
      availability_status: 'available_later',
      availability_date: '2026-09-30',
      contact_phone: '+971500004444',
      document_metadata: {
        certificate_status: 'ready',
        stcw_status: 'ready',
        passport_expiry: '2029-10-10',
        medical_expiry: '2027-10-10',
        visa_status: 'not_required',
      },
    },
  });
  expect(seafarerCreate.ok()).toBeTruthy();
  const seafarer = await seafarerCreate.json();
  await acceptPresentationConsents(request, seafarer.draft_id);

  const applicationResponse = await request.post(`/api/v1/vacancies/${vacancyId}/applications`, {
    data: {
      seafarer_draft_id: seafarer.draft_id,
      email: seafarerEmail,
      note,
    },
  });
  expect(applicationResponse.ok()).toBeTruthy();
  const application = await applicationResponse.json();
  const applicationId = application.application.vacancy_application_id as string;

  const startReview = await request.patch(`/api/v1/operator/review-queue/${applicationId}/status`, {
    data: {
      decision: 'start_review',
      queue_type: 'vacancy_application',
      note: 'Application is being checked.',
    },
  });
  expect(startReview.ok()).toBeTruthy();

  await page.goto(`/create-profile/?draft_id=${seafarer.draft_id}`);
  await expect(page.locator('#create-applications-status')).toContainText('1 vacancy application');
  await expect(page.locator('#create-application-list')).toContainText(title);
  await expect(page.locator('#create-application-list')).toContainText(`History Marine ${unique}`);
  await expect(page.locator('#create-application-list')).toContainText('Electrical Technical Officer');
  await expect(page.locator('#create-application-list')).toContainText('Under review');
  await expect(page.locator('#create-application-list')).toContainText(note);
  await expect(page.locator('#create-application-list')).toContainText('Open vacancy');
  await expect(page.locator('#create-application-list')).toContainText('Withdraw application');

  const reviewed = await request.patch(`/api/v1/operator/review-queue/${applicationId}/status`, {
    data: {
      decision: 'reviewed',
      queue_type: 'vacancy_application',
      note: 'Candidate presented to employer.',
    },
  });
  expect(reviewed.ok()).toBeTruthy();

  await page.reload();
  await expect(page.locator('#create-application-list')).toContainText('Presented to employer');
  await page.getByRole('button', { name: 'Mark not available' }).click();
  await expect(page.locator('#create-status')).toContainText('Application status updated.');
  await expect(page.locator('#create-application-list')).toContainText('Withdrawn');
  await expect(page.getByRole('button', { name: 'Mark not available' })).toHaveCount(0);

  await page.reload();
  await expect(page.locator('#create-application-list')).toContainText('Withdrawn');

  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(hasOverflow).toBe(false);
});
