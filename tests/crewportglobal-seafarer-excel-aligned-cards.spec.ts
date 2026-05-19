import { expect, test } from '@playwright/test';
import { execSync } from 'node:child_process';

function cleanupExcelAlignedCardTestData(): void {
  const sql = `
WITH ui_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.excelcards.%@example.com'
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
  cleanupExcelAlignedCardTestData();
});

test('Excel-aligned seafarer source cards persist and reload from draft metadata', async ({ page, request }) => {
  await page.goto('/create-profile/');
  await page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem('crewportglobal.language', 'en');
  });

  await page.goto('/create-profile/');
  const email = `ui.excelcards.${Date.now()}@example.com`;

  await page.locator('#create-full-name').fill('Vazgen Samvelovich Minasian');
  await page.locator('#create-email').fill(email);
  await page.locator('#create-country').fill('AE');
  await page.locator('#create-rank').fill('Wiper');
  await page.locator('#create-department').selectOption('engine');
  await page.locator('#create-availability').selectOption('available_later');
  await page.locator('#create-availability-date').fill('2026-09-20');
  await page.locator('#create-phone').fill('+971501234567');
  await page.locator('#create-vessel-types').fill('OIL TANKER');

  await page.locator('#profile-section-contact > summary').click();
  await page.locator('#create-surname').fill('MINASIAN');
  await page.locator('#create-first-name').fill('VAZGEN');
  await page.locator('#create-middle-name').fill('Samvelovich');
  await page.locator('#create-citizenship').fill('RUSSIAN FEDERATION');
  await page.locator('#create-religion').fill('Christian');
  await page.locator('#create-date-of-birth').fill('1998-02-28');
  await page.locator('#create-place-of-birth').fill('Novorossiysk');
  await page.locator('#create-gender').fill('MALE');
  await page.locator('#create-civil-status').fill('Single');

  await page.locator('#profile-section-addresses > summary').click();
  await page.locator('#create-permanent-street').fill('Paratrooper Heroes');
  await page.locator('#create-permanent-house').fill('12');
  await page.locator('#create-permanent-flat').fill('45');
  await page.locator('#create-permanent-post-code').fill('353900');
  await page.locator('#create-registration-street').fill('Registration Street');
  await page.locator('#create-registration-city').fill('NOVOROSSIYSK');
  await page.locator('#create-registration-country').fill('RUSSIAN FEDERATION');

  await page.locator('#profile-section-family > summary').click();
  await page.locator('#create-kin-surname').fill('MINASIAN');
  await page.locator('#create-kin-first-name').fill('ASMIK');
  await page.locator('#create-kin-relation').fill('Mother');
  await page.locator('#create-kin-email').fill('kin@example.com');
  await page.locator('#create-children-records').fill('Child One, First, Middle, Son, 2020-01-01, MALE');

  await page.locator('#profile-section-physical > summary').click();
  await page.locator('#create-height-cm').fill('180');
  await page.locator('#create-weight-kg').fill('80');
  await page.locator('#create-hair-colour').fill('DARK');
  await page.locator('#create-eyes-colour').fill('GREY');

  await page.locator('#profile-section-identity-documents > summary').click();
  await page.locator('#create-civil-passport-series').fill('0317');
  await page.locator('#create-civil-passport-number').fill('917675');
  await page.locator('#create-civil-passport-issued').fill('2018-03-02');
  await page.locator('#create-foreign-passport-number').fill('7534761');
  await page.locator('#create-foreign-passport-expiry').fill('2028-06-30');
  await page.locator('#create-seamans-book-number').fill('SB-123456');
  await page.locator('#create-usa-visa-type').fill('C1/D');
  await page.locator('#create-schengen-visa-number').fill('SCH-123');

  await page.locator('#profile-section-qualifications > summary').click();
  await page.locator('#create-coc-type').fill('Certificate of proficiency - OS/ Mortorman');
  await page.locator('#create-coc-number').fill('COC-EXCEL-001');
  await page.locator('#create-coc-institute').fill('SCF Novoship Training Centre');
  await page.locator('#create-coc-issued').fill('2024-01-10');
  await page.locator('#create-education-specialisation').fill('Marine engineering');
  await page.locator('#create-endorsement-type').fill('Endorsment - Oil and Chemical (operational) - Russia');
  await page.locator('#create-endorsement-number').fill('END-001');
  await page.locator('#create-training-courses').fill('Basic Safety Training');
  await page.locator('#create-training-number').fill('TR-001');

  await page.locator('#profile-section-sea-service > summary').click();
  await page.locator('#create-last-vessel-name').fill('NIKOLAY ZUYEV');
  await page.locator('#create-last-vessel-type').fill('OIL TANKER');
  await page.locator('#create-engine-type').fill('B&W');
  await page.locator('#create-engine-power').fill('13350');
  await page.locator('#create-sea-service-history').fill('NIKOLAY ZUYEV | OIL TANKER | 120000 | B&W | 13350 | LIBERIA | SCF | Wiper | 2023-10-10 | 2024-02-13');

  await page.locator('#profile-section-references > summary').click();
  await page.locator('#create-reference-company-1').fill('SCF');
  await page.locator('#create-reference-person-1').fill('Reference Officer');
  await page.locator('#create-reference-phone-1').fill('+78617791533');
  await page.locator('#create-reference-email-1').fill('reference@example.com');

  await page.locator('#profile-section-medical > summary').click();
  await page.locator('#create-signed-off-sick').selectOption('no');
  await page.locator('#create-injury-details').fill('No declared injury in the last 10 years.');
  await page.locator('#create-operated').selectOption('no');

  await page.locator('#profile-section-publication > summary').click();
  await page.locator('#create-information-source').fill('Referral');
  await page.locator('#create-data-processing-confirmation').selectOption('i_confirm');
  await page.locator('#create-obligation-date').fill('2026-05-19');
  await page.locator('#create-obligation-place').fill('Novorossiysk city');
  await page.locator('#create-obligation-confirmation').selectOption('i_confirm');
  await page.locator('#create-agreement-date').fill('2026-05-19');
  await page.locator('#create-agreement-value').selectOption('i_agree');

  await page.locator('#create-submit').click();
  await expect(page.locator('#create-status')).toContainText('saved');

  const draftId = await page.evaluate(() => new URLSearchParams(window.location.search).get('draft_id') || '');
  expect(draftId).not.toBe('');

  const response = await request.get(`/api/v1/registration/drafts/${draftId}`);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  const metadata = typeof body.payload.seafarer_profile.document_metadata === 'string'
    ? JSON.parse(body.payload.seafarer_profile.document_metadata)
    : body.payload.seafarer_profile.document_metadata;
  const workspace = metadata.seafarer_workspace;

  expect(workspace.name_components.surname).toBe('MINASIAN');
  expect(workspace.address_details.registration_city).toBe('NOVOROSSIYSK');
  expect(workspace.family_details.kin_relation).toBe('Mother');
  expect(workspace.family_details.children_records).toContain('Child One');
  expect(workspace.physical_details.hair_colour).toBe('DARK');
  expect(workspace.identity_documents.foreign_passport_number).toBe('7534761');
  expect(workspace.qualification_details.endorsement_number).toBe('END-001');
  expect(workspace.sea_service.engine_power).toBe('13350');
  expect(workspace.previous_employer_references.reference_company_1).toBe('SCF');
  expect(workspace.medical_history.signed_off_sick).toBe('no');
  expect(workspace.consent_details.obligation_place).toBe('Novorossiysk city');

  await page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem('crewportglobal.language', 'en');
  });
  await page.goto(`/create-profile/?draft_id=${draftId}`);
  await expect(page.locator('#create-status')).toContainText('prefilled');

  await page.locator('#profile-section-identity-documents > summary').click();
  await expect(page.locator('#create-foreign-passport-number')).toHaveValue('7534761');
  await page.locator('#profile-section-references > summary').click();
  await expect(page.locator('#create-reference-email-1')).toHaveValue('reference@example.com');
  await page.locator('#profile-section-medical > summary').click();
  await expect(page.locator('#create-injury-details')).toHaveValue('No declared injury in the last 10 years.');
});
