import { expect, test } from '@playwright/test';
import { execSync } from 'node:child_process';

function cleanupSeafarerWorkspaceTestData(): void {
  const sql = `
WITH ui_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.workspace.%@example.com'
)
UPDATE crewportglobal.seafarer_profiles sp
SET review_status = 'rejected', updated_at = now()
FROM ui_users uu
WHERE sp.user_id = uu.user_id
  AND sp.review_status IN ('submitted_for_human_review', 'in_review', 'approved');
`;

  execSync(
    'PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql -v ON_ERROR_STOP=1 -q',
    { input: sql, encoding: 'utf8' }
  );
}

test.afterEach(() => {
  cleanupSeafarerWorkspaceTestData();
});

test('extended seafarer workspace cards persist through draft save and reload', async ({ page, request }) => {
  await page.goto('/create-profile/');
  await page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem('crewportglobal.language', 'en');
  });

  await page.goto('/create-profile/');

  const email = `ui.workspace.${Date.now()}@example.com`;

  await page.locator('#create-full-name').fill('Jordan Reyes');
  await page.locator('#create-email').fill(email);
  await page.locator('#create-country').fill('AE');
  await page.locator('#create-rank').fill('Chief Officer');
  await page.locator('#create-department').selectOption('deck');
  await page.locator('#create-availability').selectOption('available_later');
  await page.locator('#create-availability-date').fill('2026-09-20');
  await page.locator('#create-phone').fill('+971501234000');
  await page.locator('#create-certificate-status').selectOption('ready');
  await page.locator('#create-passport-expiry').fill('2029-01-15');
  await page.locator('#create-medical-expiry').fill('2027-02-10');

  await page.locator('#profile-section-contact > summary').click();
  await page.locator('#create-date-of-birth').fill('1990-04-12');
  await page.locator('#create-place-of-birth').fill('Manila');
  await page.locator('#create-gender').fill('Male');
  await page.locator('#create-civil-status').fill('Single');
  await page.locator('#create-permanent-address').fill('12 Port Street, Manila');
  await page.locator('#create-residence-city').fill('Dubai');
  await page.locator('#create-nearest-airport').fill('DXB');
  await page.locator('#create-emergency-contact-name').fill('Maria Reyes');
  await page.locator('#create-emergency-contact-relation').fill('Spouse');
  await page.locator('#create-emergency-contact-phone').fill('+639171112233');

  await page.locator('#profile-section-qualifications > summary').click();
  await page.locator('#create-coc-type').fill('Chief Officer');
  await page.locator('#create-coc-number').fill('COC-WS-123456');
  await page.locator('#create-coc-issuing-country').fill('PH');
  await page.locator('#create-coc-expiry').fill('2028-05-30');
  await page.locator('#create-education-institution').fill('Maritime Academy');
  await page.locator('#create-education-grade').fill('Bachelor');
  await page.locator('#create-training-courses').fill('Basic Training, Advanced Fire Fighting');

  await page.locator('#profile-section-sea-service > summary').click();
  await page.locator('#create-last-vessel-name').fill('MV Test Horizon');
  await page.locator('#create-last-vessel-type').fill('BULK CARRIER');
  await page.locator('#create-last-rank').fill('Second Officer');
  await page.locator('#create-flag-country').fill('PA');
  await page.locator('#create-service-from').fill('2025-01-10');
  await page.locator('#create-service-to').fill('2025-09-10');
  await page.locator('#create-management-company').fill('Test Ship Management');
  await page.locator('#create-engine-type').fill('MAN B&W');
  await page.locator('#create-deadweight').fill('52000 DWT');

  await page.locator('#profile-section-publication > summary').click();
  await page.locator('#create-information-source').fill('Referral');
  await page.locator('#create-publish-to-matching').selectOption('yes');
  await page.locator('#create-candidate-summary').fill('Chief Officer with bulk carrier experience and valid documents.');
  await page.locator('#create-data-processing-confirmation').selectOption('i_confirm');

  await page.locator('#create-submit').click();
  await expect(page.locator('#create-status')).toContainText('saved');
  await expect(page).toHaveURL(/draft_id=/);

  const draftId = await page.evaluate(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('draft_id') || '';
  });
  expect(draftId).not.toBe('');

  const apiResponse = await request.get(`/api/v1/registration/drafts/${draftId}`);
  expect(apiResponse.ok()).toBeTruthy();
  const apiBody = await apiResponse.json();
  const profile = apiBody.payload.seafarer_profile;
  const metadata = typeof profile.document_metadata === 'string'
    ? JSON.parse(profile.document_metadata)
    : profile.document_metadata;
  expect(metadata.seafarer_workspace.personal_details.date_of_birth).toBe('1990-04-12');
  expect(metadata.seafarer_workspace.qualifications.training_courses).toEqual([
    'Basic Training',
    'Advanced Fire Fighting',
  ]);
  expect(metadata.seafarer_workspace.matching_publication.publish_to_matching).toBe('yes');

  const workspaceResponse = await request.get(`/api/v1/seafarer/workspace?draft_id=${draftId}`);
  expect(workspaceResponse.ok()).toBeTruthy();
  const workspaceBody = await workspaceResponse.json();
  expect(workspaceBody.workspace.schema_ready).toBe(true);
  expect(workspaceBody.workspace.person_details.date_of_birth).toBe('1990-04-12');
  expect(workspaceBody.workspace.person_details.residence_city_label).toBe('Dubai');
  expect(workspaceBody.workspace.emergency_contacts[0].contact_name).toBe('Maria Reyes');
  expect(workspaceBody.workspace.certificates[0].certificate_number).toBe('COC-WS-123456');
  expect(workspaceBody.workspace.training_records.map((item: { training_type_label: string }) => item.training_type_label)).toEqual([
    'Basic Training',
    'Advanced Fire Fighting',
  ]);
  expect(workspaceBody.workspace.sea_service_records[0].vessel_name).toBe('MV Test Horizon');
  expect(workspaceBody.workspace.matching_preferences.publish_to_matching).toBe('yes');

  await page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem('crewportglobal.language', 'en');
  });
  await page.goto(`/create-profile/?draft_id=${draftId}`);
  await expect(page.locator('#create-status')).toContainText('prefilled');

  await page.locator('#profile-section-contact > summary').click();
  await expect(page.locator('#create-date-of-birth')).toHaveValue('1990-04-12');
  await expect(page.locator('#create-emergency-contact-name')).toHaveValue('Maria Reyes');
  await page.locator('#create-residence-city').fill('Sharjah');
  await page.locator('#profile-section-contact .workspace-section-save').click();
  await expect(page.locator('#create-contact-save-status')).toContainText('Section saved.');

  const sectionSavedWorkspaceResponse = await request.get(`/api/v1/seafarer/workspace?draft_id=${draftId}`);
  expect(sectionSavedWorkspaceResponse.ok()).toBeTruthy();
  const sectionSavedWorkspaceBody = await sectionSavedWorkspaceResponse.json();
  expect(sectionSavedWorkspaceBody.workspace.person_details.residence_city_label).toBe('Sharjah');

  await page.locator('#create-stcw-status').selectOption('ready');
  await page.locator('#create-passport-expiry').fill('2030-03-20');
  await page.locator('#create-visa-status').selectOption('not_required');
  await page.locator('#create-document-notes').fill('Passport renewed and visa not required for the current target route.');
  await page.locator('#create-document-readiness-save').click();
  await expect(page.locator('#create-document-readiness-save-status')).toContainText('Section saved.');

  const documentReadinessDraftResponse = await request.get(`/api/v1/registration/drafts/${draftId}`);
  expect(documentReadinessDraftResponse.ok()).toBeTruthy();
  const documentReadinessDraftBody = await documentReadinessDraftResponse.json();
  const documentReadinessMetadata = typeof documentReadinessDraftBody.payload.seafarer_profile.document_metadata === 'string'
    ? JSON.parse(documentReadinessDraftBody.payload.seafarer_profile.document_metadata)
    : documentReadinessDraftBody.payload.seafarer_profile.document_metadata;
  expect(documentReadinessMetadata.stcw_status).toBe('ready');
  expect(documentReadinessMetadata.passport_expiry).toBe('2030-03-20');
  expect(documentReadinessMetadata.visa_status).toBe('not_required');
  expect(documentReadinessMetadata.notes).toContain('Passport renewed');

  await page.locator('#profile-section-qualifications > summary').click();
  await expect(page.locator('#create-coc-number')).toHaveValue('COC-WS-123456');
  await expect(page.locator('#create-training-courses')).toHaveValue('Basic Training, Advanced Fire Fighting');

  await page.locator('#profile-section-sea-service > summary').click();
  await expect(page.locator('#create-last-vessel-name')).toHaveValue('MV Test Horizon');
  await expect(page.locator('#create-deadweight')).toHaveValue('52000 DWT');

  await page.locator('#profile-section-publication > summary').click();
  await expect(page.locator('#create-publish-to-matching')).toHaveValue('yes');
  await expect(page.locator('#create-data-processing-confirmation')).toHaveValue('i_confirm');

  await page.goto(`/cabinet/?draft_id=${draftId}`);
  await expect(page.locator('#cabinet-task-list')).toContainText('Action required: upload supporting documents');
  const workspaceCard = page.locator('#cabinet-seafarer-workspace-card');
  await expect(workspaceCard).toBeVisible();
  await expect(workspaceCard).not.toHaveAttribute('open', '');
  await workspaceCard.locator('> summary').click();
  await expect(page.locator('#cabinet-seafarer-workspace-summary')).toContainText('Personal and contact details');
  await expect(page.locator('#cabinet-seafarer-workspace-summary')).toContainText('1990-04-12');
  await expect(page.locator('#cabinet-seafarer-workspace-summary')).toContainText('Sharjah');
  await expect(page.locator('#cabinet-seafarer-workspace-summary')).toContainText('Emergency contact');
  await expect(page.locator('#cabinet-seafarer-workspace-summary')).toContainText('Family and beneficiary details are restricted');
  await expect(page.locator('#cabinet-seafarer-workspace-summary')).not.toContainText('Maria Reyes');
  await expect(page.locator('#cabinet-seafarer-workspace-summary')).not.toContainText('+639171112233');
  await expect(page.locator('#cabinet-seafarer-workspace-summary')).toContainText('Certificates');
  await expect(page.locator('#cabinet-seafarer-workspace-summary')).toContainText('COC-WS-123456');
  await expect(page.locator('#cabinet-seafarer-workspace-summary')).toContainText('Training');
  await expect(page.locator('#cabinet-seafarer-workspace-summary')).toContainText('Advanced Fire Fighting');
  await expect(page.locator('#cabinet-seafarer-workspace-summary')).toContainText('Sea service');
  await expect(page.locator('#cabinet-seafarer-workspace-summary')).toContainText('MV Test Horizon');
  await expect(page.locator('#cabinet-seafarer-workspace-summary')).toContainText('Matching preferences');
  await expect(page.locator('#cabinet-seafarer-workspace-summary')).toContainText('yes');
});

test('cabinet derives seafarer completeness tasks from partial structured workspace', async ({ page, request }) => {
  const email = `ui.workspace.partial.${Date.now()}@example.com`;

  const createResponse = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'seafarer',
      email,
      full_name: 'Partial Workspace Seafarer',
      rank: 'Second Officer',
      department: 'deck',
      document_metadata: {
        seafarer_workspace: {
          personal_details: {
            date_of_birth: '1991-02-03',
          },
          matching_publication: {
            data_processing_confirmation: 'not_confirmed',
          },
        },
      },
    },
  });
  expect(createResponse.status()).toBe(201);
  const created = await createResponse.json();

  await page.goto(`/cabinet/?draft_id=${created.draft_id}`);
  await expect(page.locator('#cabinet-summary-user')).toHaveText(email);
  await expect(page.locator('#cabinet-summary-tasks')).toHaveText('5');
  await expect(page.locator('#cabinet-task-list')).toContainText('Action required: complete seafarer workspace');
  await expect(page.locator('#cabinet-task-list')).toContainText('Add personal/contact details and primary emergency contact.');
  await expect(page.locator('#cabinet-task-list')).toContainText('Add certificate of competency and training details.');
  await expect(page.locator('#cabinet-task-list')).toContainText('Add the latest sea-service record.');
  await expect(page.locator('#cabinet-task-list')).toContainText('Add candidate summary and data processing confirmation for reviewed matching.');
  await expect(page.locator('#cabinet-task-list')).toContainText('Action required: upload supporting documents');

  const contactLink = page.locator('#cabinet-task-list').getByRole('link', { name: 'Open section' }).first();
  await expect(contactLink).toHaveAttribute('href', `/create-profile/?draft_id=${created.draft_id}#profile-section-contact`);
  await contactLink.click();
  await expect(page).toHaveURL(new RegExp(`/create-profile/\\?draft_id=${created.draft_id}#profile-section-contact`));
  await expect(page.locator('#profile-section-contact')).toHaveAttribute('open', '');
});

test('seafarer workspace section endpoint updates JSON fallback and structured records', async ({ request }) => {
  const email = `ui.workspace.section.${Date.now()}@example.com`;

  const createResponse = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'seafarer',
      email,
      full_name: 'Section Contract Seafarer',
      rank: 'Chief Engineer',
      department: 'engine',
    },
  });
  expect(createResponse.status()).toBe(201);
  const created = await createResponse.json();

  const contactResponse = await request.patch('/api/v1/seafarer/workspace/sections/contact_and_addresses', {
    data: {
      draft_id: created.draft_id,
      data: {
        residence_city: 'Limassol',
        permanent_address: 'Harbor Road 7',
        emergency_contact_name: 'Nina Section',
        emergency_contact_relation: 'Spouse',
        emergency_contact_phone: '+35799111222',
      },
    },
  });
  expect(contactResponse.status()).toBe(200);
  const contactBody = await contactResponse.json();
  expect(contactBody.access_model).toBe('draft_id_transition');
  expect(contactBody.workspace.person_details.residence_city_label).toBe('Limassol');
  expect(contactBody.workspace.emergency_contacts[0].contact_name).toBe('Nina Section');

  const qualificationResponse = await request.patch('/api/v1/seafarer/workspace/sections/qualifications', {
    data: {
      draft_id: created.draft_id,
      data: {
        coc_type: 'Chief Engineer',
        coc_number: 'COC-SECTION-001',
        coc_issuing_country: 'CY',
        coc_expiry: '2029-12-31',
        training_courses: ['Basic Training', 'Engine Resource Management'],
      },
    },
  });
  expect(qualificationResponse.status()).toBe(200);
  const qualificationBody = await qualificationResponse.json();
  expect(qualificationBody.workspace.certificates[0].certificate_number).toBe('COC-SECTION-001');
  expect(qualificationBody.workspace.training_records.map((item: { training_type_label: string }) => item.training_type_label)).toEqual([
    'Basic Training',
    'Engine Resource Management',
  ]);

  const invalidResponse = await request.patch('/api/v1/seafarer/workspace/sections/unknown_section', {
    data: {
      draft_id: created.draft_id,
      data: {
        value: 'ignored',
      },
    },
  });
  expect(invalidResponse.status()).toBe(400);

  const draftResponse = await request.get(`/api/v1/registration/drafts/${created.draft_id}`);
  expect(draftResponse.status()).toBe(200);
  const draftBody = await draftResponse.json();
  const metadata = typeof draftBody.payload.seafarer_profile.document_metadata === 'string'
    ? JSON.parse(draftBody.payload.seafarer_profile.document_metadata)
    : draftBody.payload.seafarer_profile.document_metadata;
  expect(metadata.seafarer_workspace.contact_and_addresses.residence_city).toBe('Limassol');
  expect(metadata.seafarer_workspace.qualifications.coc_number).toBe('COC-SECTION-001');
});
