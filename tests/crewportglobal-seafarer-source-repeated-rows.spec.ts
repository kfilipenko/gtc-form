import { expect, test, type APIRequestContext } from '@playwright/test';
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

function cleanupSourceRepeatedRowsTestData(): void {
  const sql = `
SELECT storage_root || '/' || storage_path
FROM crewportglobal.uploaded_documents ud
JOIN crewportglobal.users u ON u.user_id = ud.draft_id
WHERE u.email LIKE 'ui.excelrows.%@example.com';

DELETE FROM crewportglobal.uploaded_documents ud
USING crewportglobal.users u
WHERE u.user_id = ud.draft_id
  AND u.email LIKE 'ui.excelrows.%@example.com';

WITH ui_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.excelrows.%@example.com'
)
UPDATE crewportglobal.seafarer_profiles sp
SET review_status = 'rejected', updated_at = now()
FROM ui_users uu
WHERE sp.user_id = uu.user_id
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

async function uploadDocument(
  request: APIRequestContext,
  draftId: string,
  documentType: string,
  filename: string
): Promise<Record<string, any>> {
  const response = await request.post(`/api/v1/registration/drafts/${draftId}/documents`, {
    multipart: {
      form_type: 'seafarer',
      document_type: documentType,
      file: {
        name: filename,
        mimeType: 'application/pdf',
        buffer: minimalPdfBuffer(filename),
      },
    },
  });
  expect(response.status()).toBe(201);
  return response.json();
}

test.afterEach(() => {
  cleanupSourceRepeatedRowsTestData();
});

test('Excel source repeated rows are normalized, returned, visible and task-ready', async ({ page, request }) => {
  const unique = Date.now();
  const email = `ui.excelrows.${unique}@example.com`;

  const createResponse = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'seafarer',
      email,
      full_name: 'Excel Rows Seafarer',
      rank: 'Second Officer',
      department: 'deck',
      availability_status: 'available_now',
      nationality_code: 'GE',
      residence_country_code: 'AE',
      contact_phone: '+971501234567',
      document_metadata: {
        certificate_status: 'ready',
        stcw_status: 'ready',
        passport_expiry: '2031-12-31',
        medical_expiry: '2028-05-20',
        visa_status: 'ready',
        seafarer_workspace: {
          personal_details: {
            date_of_birth: '1990-04-15',
            place_of_birth: 'Batumi',
            gender: 'Male',
            civil_status: 'Married',
          },
          name_components: {
            surname: 'Rows',
            first_name: 'Excel',
            middle_name: 'Source',
            citizenship: 'GEORGIA',
            religion: 'None',
          },
          contact_and_addresses: {
            permanent_address: 'Batumi, Port Street 5',
            residence_country: 'AE',
            residence_city: 'Dubai',
            nearest_airport: 'DXB',
            secondary_mobile_number: '+995555100200',
            home_phone: '+995422100200',
            emergency_contact_name: 'Nino Rows',
            emergency_contact_relation: 'Spouse',
            emergency_contact_phone: '+995555100201',
          },
          address_details: {
            permanent_street: 'Port Street',
            permanent_house: '5',
            permanent_flat: '12',
            permanent_region: 'Adjara',
            permanent_post_code: '6000',
            registration_street: 'Registry Street',
            registration_house: '7',
            registration_flat: '4',
            registration_city: 'Batumi',
            registration_country: 'GE',
            registration_region: 'Adjara',
            registration_post_code: '6001',
          },
          family_details: {
            kin_surname: 'Rows',
            kin_first_name: 'Nino',
            kin_middle_name: 'Kin',
            kin_birthdate: '1991-02-01',
            kin_gender: 'Female',
            kin_relation: 'Spouse',
            kin_mobile: '+995555100201',
            kin_home_phone: '+995422100201',
            kin_email: 'nino.rows@example.com',
            kin_address: 'Batumi, Port Street 5',
            children_records: 'Rows, Mariam, Excel, Daughter, 2018-03-04, Female\nRows, Giorgi, Excel, Son, 2020-07-09, Male',
          },
          physical_details: {
            height_cm: '180',
            weight_kg: '82',
            hair_colour: 'Black',
            eyes_colour: 'Brown',
            uniform_size: 'L',
            shoes_size: '43',
          },
          identity_documents: {
            civil_passport_series: 'CP',
            civil_passport_number: '100200',
            civil_passport_issued: '2020-01-10',
            civil_passport_authority: 'Georgia PSA',
            foreign_passport_series: 'FP',
            foreign_passport_number: '300400',
            foreign_passport_issued: '2021-02-11',
            foreign_passport_expiry: '2031-02-11',
            foreign_passport_authority: 'Georgia PSA',
            seafarer_id_series: 'SID',
            seafarer_id_number: 'SID-500',
            seafarer_id_issued: '2022-03-12',
            seafarer_id_expiry: '2027-03-12',
            seafarer_id_authority: 'Maritime Authority',
            seamans_book_series: 'SB',
            seamans_book_number: 'SB-600',
            seamans_book_issued: '2022-04-13',
            seamans_book_expiry: '2027-04-13',
            seamans_book_authority: 'Maritime Authority',
            usa_visa_type: 'C1/D',
            usa_visa_issued: '2023-05-14',
            usa_visa_expiry: '2028-05-14',
            usa_visa_post: 'Tbilisi',
            schengen_visa_number: 'SCH-700',
            schengen_visa_issued: '2024-06-15',
            schengen_visa_expiry: '2026-06-15',
            schengen_visa_post: 'Tbilisi',
          },
          qualifications: {
            coc_type: 'Second Officer',
            coc_number: 'COC-ROWS-001',
            coc_issuing_country: 'GE',
            coc_expiry: '2029-09-30',
            education_institution: 'Batumi Maritime Academy',
            education_grade: 'Bachelor',
            training_courses: ['Basic Training', 'Advanced Fire Fighting'],
          },
          qualification_details: {
            coc_institute: 'Maritime Transport Agency',
            coc_issued: '2024-01-10',
            education_from: '2008-09-01',
            education_to: '2012-06-30',
            education_specialisation: 'Navigation',
            education_issued_on: '2012-06-30',
            education_comments: 'Diploma verified by source form copy.',
            endorsement_type: 'GMDSS Endorsement',
            endorsement_institute: 'Maritime Transport Agency',
            endorsement_number: 'END-ROWS-001',
            endorsement_issued: '2024-02-10',
            endorsement_expiry: '2029-02-10',
            endorsement_comments: 'National endorsement.',
            training_institute: 'Batumi Training Centre',
            training_number: 'TR-ROWS-001',
            training_issued: '2024-03-10',
            training_expiry: '2029-03-10',
            training_comments: 'Rows apply to both listed courses in current source slice.',
          },
          sea_service: {
            last_vessel_name: 'MV Source Primary',
            last_vessel_type: 'Bulk Carrier',
            last_rank: 'Second Officer',
            flag_country: 'PA',
            service_from: '2024-01-01',
            service_to: '2024-08-01',
            management_company: 'Primary Ship Manager',
            engine_type: 'MAN B&W',
            engine_power: '13350',
            deadweight: '50000 DWT',
            sea_service_history: 'MV Source History, Container Ship, 42000 DWT, Wartsila, 12000, LR, History Manager, Third Officer, 2023-01-01, 2023-08-01',
          },
          previous_employer_references: {
            reference_company_1: 'Primary Ship Manager',
            reference_person_1: 'Captain One',
            reference_phone_1: '+995555200001',
            reference_email_1: 'captain.one@example.com',
            reference_company_2: 'History Manager',
            reference_person_2: 'Captain Two',
            reference_phone_2: '+995555200002',
            reference_email_2: 'captain.two@example.com',
          },
          medical_history: {
            signed_off_sick: 'yes',
            sick_details: 'Signed off sick in 2021, fully recovered.',
            injury_details: 'Minor hand injury in 2019.',
            operated: 'no',
            surgery_details: 'No surgeries.',
          },
          matching_publication: {
            information_source: 'Referral',
            candidate_summary: 'Ready for normalized source-row review.',
            publish_to_matching: 'no',
            data_processing_confirmation: 'i_confirm',
          },
          consent_details: {
            obligation_date: '2026-05-19',
            obligation_place: 'Dubai',
            obligation_confirmation: 'i_confirm',
            agreement_date: '2026-05-19',
            agreement_value: 'i_agree',
            source_comments: 'Source-row normalization test.',
          },
        },
      },
    },
  });
  expect(createResponse.status()).toBe(201);
  const created = await createResponse.json();

  await uploadDocument(request, created.draft_id, 'certificate_of_competency', 'coc-source-rows.pdf');
  await uploadDocument(request, created.draft_id, 'experience_record', 'experience-source-rows.pdf');
  await uploadDocument(request, created.draft_id, 'medical_certificate', 'medical-source-rows.pdf');

  const workspaceResponse = await request.get(`/api/v1/seafarer/workspace?draft_id=${created.draft_id}`);
  expect(workspaceResponse.status()).toBe(200);
  const workspaceBody = await workspaceResponse.json();
  const workspace = workspaceBody.workspace as Record<string, any>;
  const repeated = workspace.source_repeated_records as Record<string, any[]>;
  expect(repeated.children_records).toHaveLength(2);
  expect(repeated.identity_documents_and_visas).toHaveLength(6);
  expect(repeated.education_records).toHaveLength(1);
  expect(repeated.coc_certificates).toHaveLength(1);
  expect(repeated.endorsements).toHaveLength(1);
  expect(repeated.training_courses).toHaveLength(2);
  expect(repeated.sea_service_history).toHaveLength(2);
  expect(repeated.previous_employer_references).toHaveLength(2);
  expect(repeated.medical_declarations).toHaveLength(3);
  expect(workspace.training_records).toHaveLength(2);
  expect(workspace.sea_service_records).toHaveLength(2);
  expect(workspace.certificates.some((record: Record<string, unknown>) => record.certificate_group === 'endorsement')).toBe(true);
  expect(workspace.medical_declarations).toHaveLength(1);
  expect(workspace.source_card_document_links['QUAL-003']).toHaveLength(1);
  expect(workspace.source_card_document_links['EXP-001']).toHaveLength(1);
  expect(workspace.source_card_document_links['MED-001']).toHaveLength(1);

  await page.goto(`/create-profile/?draft_id=${created.draft_id}`);
  await expect(page.locator('#create-permanent-region')).toHaveValue('Adjara');
  await expect(page.locator('#create-kin-mobile')).toHaveValue('+995555100201');
  await expect(page.locator('#create-seafarer-id-series')).toHaveValue('SID');
  await expect(page.locator('#create-seamans-book-expiry')).toHaveValue('2027-04-13');
  await expect(page.locator('#create-children-records')).toHaveValue(/Rows, Mariam/);

  await page.addInitScript((token) => {
    window.sessionStorage.setItem('crewportglobal.operatorAccessToken', token);
  }, operatorAccessToken);
  await page.goto('/verify/');
  await expect(page.locator('#queue-status')).toContainText('Queue loaded');
  await page.locator('#filter-type').selectOption('seafarer_profile');
  const queueRow = page.locator('#queue-body tr', { hasText: email }).first();
  await queueRow.locator('.queue-open').click();
  await expect(page.locator('#details-sections')).toContainText('Excel repeated rows');
  await expect(page.locator('#details-sections')).toContainText('children: 2');
  await expect(page.locator('#details-sections')).toContainText('identity/visas: 6');
  await expect(page.locator('#details-sections')).toContainText('sea service: 2');
  await expect(page.locator('#details-sections')).toContainText('Source card documents');
  await expect(page.locator('#details-sections')).toContainText('QUAL-003: 1');
  await expect(page.locator('#details-json')).toContainText('source_repeated_records');
  await expect(page.locator('#details-json')).toContainText('source_card_document_links');

  const correctionNote = 'Please recheck the second child row against the source file.';
  const reviewResponse = await request.patch(`/api/v1/operator/seafarer-workspace-cards/${created.draft_id}/review`, {
    data: {
      decision: 'needs_correction',
      card_code: 'PERS-008',
      note: correctionNote,
    },
  });
  expect(reviewResponse.status()).toBe(200);

  await page.goto(`/cabinet/?draft_id=${created.draft_id}`);
  await expect(page.locator('#cabinet-task-list')).toContainText('Target card: PERS-008 Children records');
  await page.locator('#cabinet-seafarer-workspace-card summary').click();
  await expect(page.locator('#cabinet-seafarer-workspace-summary')).toContainText('Children records');
  await expect(page.locator('#cabinet-seafarer-workspace-summary')).toContainText('Identity documents and visas');
  await expect(page.locator('#cabinet-seafarer-workspace-summary')).toContainText('Previous employer references');
  await expect(page.locator('#cabinet-seafarer-workspace-summary')).toContainText('Source card document links');
  await expect(page.locator('#cabinet-seafarer-workspace-summary')).toContainText('PERS-008');
  await expect(page.locator('#cabinet-seafarer-workspace-summary')).toContainText('QUAL-001');
  await expect(page.locator('#cabinet-seafarer-workspace-summary')).toContainText('EXP-002');
});
