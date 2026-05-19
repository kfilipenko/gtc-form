import { expect, test } from '@playwright/test';
import { execSync } from 'node:child_process';

function cleanupExcelReviewCardTestData(): void {
  const sql = `
WITH ui_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.excelreview.%@example.com'
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
  cleanupExcelReviewCardTestData();
});

test('Excel source review cards are primary while legacy cards remain fallback-compatible', async ({ page, request }) => {
  const unique = Date.now();
  const email = `ui.excelreview.${unique}@example.com`;

  const createResponse = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'seafarer',
      email,
      full_name: 'Excel Review Seafarer',
      rank: 'Second Officer',
      department: 'deck',
      availability_status: 'available_now',
      document_metadata: {
        seafarer_workspace: {
          family_details: {
            kin_surname: 'Ivanova',
            kin_first_name: 'Anna',
            kin_middle_name: 'Petrovna',
            kin_birthdate: '1975-06-12',
            kin_gender: 'FEMALE',
            kin_relation: 'Mother',
            kin_home_phone: '+995555100200',
            kin_email: 'anna.ivanova@example.com',
            kin_address: 'Batumi, Seaside Street 10',
            children_records: 'No children',
          },
          qualifications: {
            coc_type: 'Second Officer',
            coc_number: 'COC-EXCEL-REVIEW-001',
            coc_expiry: '2029-09-30',
            training_courses: ['Basic Training'],
          },
          qualification_details: {
            coc_institute: 'Maritime Academy',
            coc_issued: '2024-01-10',
            training_institute: 'Training Centre',
            training_number: 'TR-EXCEL-001',
          },
        },
      },
    },
  });
  expect(createResponse.status()).toBe(201);
  const created = await createResponse.json();

  const draftResponse = await request.get(`/api/v1/registration/drafts/${created.draft_id}`);
  expect(draftResponse.status()).toBe(200);
  const draft = await draftResponse.json();
  const readiness = draft.payload.seafarer_review_readiness as Array<Record<string, unknown>>;
  const cardCodes = readiness.map((item) => item.card_code);

  [
    'PERS-001',
    'PERS-002',
    'PERS-003',
    'PERS-004',
    'PERS-005',
    'PERS-006',
    'PERS-007',
    'PERS-008',
    'PERS-009',
    'QUAL-001',
    'QUAL-002',
    'QUAL-003',
    'QUAL-004',
    'QUAL-005',
    'EXP-001',
    'EXP-002',
    'MED-001',
    'MED-002',
    'MED-003',
    'MED-004',
    'MED-005',
  ].forEach((code) => expect(cardCodes).toContain(code));

  const legacyQualification = readiness.find((item) => item.card_code === 'qualifications');
  expect(legacyQualification?.legacy_fallback).toBe(true);

  const correctionNote = 'Please confirm next-of-kin mobile number separately from home phone.';
  const reviewResponse = await request.patch(`/api/v1/operator/seafarer-workspace-cards/${created.draft_id}/review`, {
    data: {
      decision: 'needs_correction',
      card_code: 'PERS-007',
      note: correctionNote,
    },
  });
  expect(reviewResponse.status()).toBe(200);
  const review = await reviewResponse.json();
  expect(review.card_name).toBe('PERS-007 Next of kin / beneficiary');
  expect(review.review_status).toBe('correction_requested');
  expect(review.workspace.card_review_states['PERS-007'].review_status).toBe('correction_requested');

  await page.goto(`/cabinet/?draft_id=${created.draft_id}`);
  await expect(page.locator('#cabinet-task-list')).toContainText('Action required: correct seafarer card');
  await expect(page.locator('#cabinet-task-list')).toContainText('Target card: PERS-007 Next of kin / beneficiary');
  await expect(page.locator('#cabinet-task-list')).toContainText(
    'Correction requested for a restricted source card. Open the relevant card and correct only the requested section.'
  );
  await expect(page.locator('#cabinet-task-list')).not.toContainText(correctionNote);
  await expect(page.locator('#cabinet-task-list').getByRole('link', { name: 'Open card' })).toHaveAttribute(
    'href',
    `/create-profile/?draft_id=${created.draft_id}#profile-section-family`
  );

  const resubmitResponse = await request.patch('/api/v1/seafarer/workspace/sections/family_details', {
    data: {
      draft_id: created.draft_id,
      data: {
        kin_surname: 'Ivanova',
        kin_first_name: 'Anna',
        kin_middle_name: 'Petrovna',
        kin_birthdate: '1975-06-12',
        kin_gender: 'FEMALE',
        kin_relation: 'Mother',
        kin_home_phone: '+995555100200',
        kin_email: 'anna.ivanova@example.com',
        kin_address: 'Batumi, Seaside Street 10, Apt 2',
        children_records: 'No children',
      },
    },
  });
  expect(resubmitResponse.status()).toBe(200);
  const resubmitted = await resubmitResponse.json();
  expect(resubmitted.workspace.card_review_states['PERS-007'].review_status).toBe('pending_human_review');
  expect(resubmitted.workspace.card_review_states['PERS-008'].review_status).toBe('pending_human_review');
  expect(resubmitted.workspace.card_review_states.personal_contact.review_status).toBe('pending_human_review');

  await page.goto(`/cabinet/?draft_id=${created.draft_id}`);
  await expect(page.locator('#cabinet-task-list')).not.toContainText('Action required: correct seafarer card');
});
