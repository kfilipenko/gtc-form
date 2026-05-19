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

  await page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem('crewportglobal.language', 'en');
  });
  await page.goto(`/create-profile/?draft_id=${draftId}`);
  await expect(page.locator('#create-status')).toContainText('prefilled');

  await page.locator('#profile-section-contact > summary').click();
  await expect(page.locator('#create-date-of-birth')).toHaveValue('1990-04-12');
  await expect(page.locator('#create-emergency-contact-name')).toHaveValue('Maria Reyes');

  await page.locator('#profile-section-qualifications > summary').click();
  await expect(page.locator('#create-coc-number')).toHaveValue('COC-WS-123456');
  await expect(page.locator('#create-training-courses')).toHaveValue('Basic Training, Advanced Fire Fighting');

  await page.locator('#profile-section-sea-service > summary').click();
  await expect(page.locator('#create-last-vessel-name')).toHaveValue('MV Test Horizon');
  await expect(page.locator('#create-deadweight')).toHaveValue('52000 DWT');

  await page.locator('#profile-section-publication > summary').click();
  await expect(page.locator('#create-publish-to-matching')).toHaveValue('yes');
  await expect(page.locator('#create-data-processing-confirmation')).toHaveValue('i_confirm');
});
