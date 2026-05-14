import { expect, test } from '@playwright/test';

test('vacancy board renders reviewed public vacancies from API', async ({ page, request }) => {
  const unique = Date.now();
  const title = `Chief Officer ${unique}`;
  const imo = `IMO${9200000 + (unique % 700000)}`;

  const createResponse = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'employer',
      role_in_company: 'recruiter',
      email: `ui.vacancy.${unique}@example.com`,
      full_name: 'Vacancy Board Employer',
      company_name: `Vacancy Board Marine ${unique}`,
      country_code: 'AE',
      registration_number: `AE-UI-${unique}`,
      vessel: {
        vessel_name: `MV Board Star ${unique}`,
        vessel_type: 'Bulk Carrier',
        imo_number: imo,
      },
      vacancy: {
        vacancy_title: title,
        rank: title,
        department: 'deck',
        vessel_type: 'Bulk Carrier',
        join_date: '2026-08-20',
        contract_duration: '4 months +/- 1',
        salary_min_usd: 6500,
        salary_max_usd: 7200,
        currency: 'USD',
        employer_country_code: 'AE',
        requirements: 'COC, valid medical certificate and bulk carrier experience.',
      },
    },
  });
  expect(createResponse.ok()).toBeTruthy();
  const created = await createResponse.json();

  const companyDecision = await request.patch(`/api/v1/operator/review-queue/${created.draft_id}/status`, {
    data: {
      decision: 'reviewed',
      queue_type: 'company_verification',
    },
  });
  expect(companyDecision.ok()).toBeTruthy();

  const vacancyDecision = await request.patch(`/api/v1/operator/review-queue/${created.draft_id}/status`, {
    data: {
      decision: 'reviewed',
      queue_type: 'vacancy_request',
    },
  });
  expect(vacancyDecision.ok()).toBeTruthy();

  await page.goto('/vacancies/');

  await expect(page.locator('#vacancy-live-state')).toBeVisible();
  await expect(page.locator('#vacancy-live-list')).toContainText(title);
  await expect(page.locator('#vacancy-live-list')).toContainText('Bulk Carrier');
  await expect(page.locator('#vacancy-live-list')).toContainText('USD 6500.00 - 7200.00');

  await page.locator('#vacancy-filter-position').selectOption('deck');
  await expect(page.locator('#vacancy-live-list')).toContainText(title);
});
