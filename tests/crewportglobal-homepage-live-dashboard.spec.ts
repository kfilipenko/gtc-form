import { expect, test } from '@playwright/test';
import { execSync } from 'node:child_process';

function cleanupHomepageDashboardTestData(): void {
  const sql = `
WITH ui_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.home.vacancy.%@example.com'
)
UPDATE crewportglobal.vacancy_requests vr
SET publication_status = 'closed', updated_at = now()
FROM ui_users uu
WHERE vr.created_by_user_id = uu.user_id
  AND vr.publication_status IN ('submitted_for_human_review', 'in_review', 'published');

WITH ui_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.home.vacancy.%@example.com'
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

WITH ui_users AS (
  SELECT user_id
  FROM crewportglobal.users
  WHERE email LIKE 'ui.home.seafarer.%@example.com'
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
  cleanupHomepageDashboardTestData();
});

test('homepage dashboard shows live API status and latest reviewed vacancy', async ({ page, request }) => {
  const unique = Date.now();
  const title = `Second Engineer ${unique}`;
  const imo = `IMO${9300000 + (unique % 600000)}`;
  const seafarerEmail = `ui.home.seafarer.${unique}@example.com`;
  const seafarerPhone = `+1555${unique}`;
  const seafarerRank = `Motorman ${unique}`;

  const createResponse = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'employer',
      role_in_company: 'recruiter',
      email: `ui.home.vacancy.${unique}@example.com`,
      full_name: 'Homepage Dashboard Employer',
      company_name: `Homepage Marine ${unique}`,
      country_code: 'SG',
      registration_number: `SG-HOME-${unique}`,
      vessel: {
        vessel_name: `MV Dashboard Star ${unique}`,
        vessel_type: 'Container',
        imo_number: imo,
      },
      vacancy: {
        vacancy_title: title,
        rank: title,
        department: 'engine',
        vessel_type: 'Container',
        join_date: '2026-09-01',
        contract_duration: '5 months',
        salary_min_usd: 5200,
        salary_max_usd: 5800,
        currency: 'USD',
        employer_country_code: 'SG',
        requirements: 'Engine watchkeeping, valid medical certificate and container experience.',
      },
    },
  });
  expect(createResponse.ok()).toBeTruthy();
  const created = await createResponse.json();

  const seafarerResponse = await request.post('/api/v1/registration/drafts', {
    data: {
      role: 'seafarer',
      email: seafarerEmail,
      full_name: `Homepage Seafarer ${unique}`,
      rank: seafarerRank,
      department: 'engine',
      availability_status: 'available_now',
      country_code: 'PH',
      contact_phone: seafarerPhone,
    },
  });
  expect(seafarerResponse.ok()).toBeTruthy();

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

  const registryResponse = await request.get('/api/v1/registry-summary');
  expect(registryResponse.ok()).toBeTruthy();
  const registryPayload = await registryResponse.json();
  expect(JSON.stringify(registryPayload)).not.toContain(seafarerEmail);
  expect(JSON.stringify(registryPayload)).not.toContain(seafarerPhone);
  expect(registryPayload.counts.matching_ready).toBeGreaterThan(0);
  expect(registryPayload.counts.with_blockers).toBeGreaterThanOrEqual(0);
  expect(
    registryPayload.samples.vacancy_requests.some(
      (row: { title?: string; readiness_status?: string }) =>
        row.title === title && row.readiness_status === 'matching_ready'
    )
  ).toBeTruthy();

  await page.goto('/');

  await expect(page.locator('#home-api-status')).toContainText('Online');
  await expect(page.locator('#home-board-status')).toContainText('published');
  await expect(page.locator('#home-live-vacancy-count')).not.toHaveText('0');
  await expect(page.locator('#home-live-vacancies')).toContainText(title);
  await expect(page.locator('#home-live-vacancies')).toContainText('Homepage Marine');
  await expect(page.locator('#home-live-vacancies')).toContainText('USD 5200.00 - 5800.00');
  await expect(page.locator('#home-registry-vacancy-count')).not.toHaveText('0');
  await expect(page.locator('#home-registry-vessel-count')).not.toHaveText('0');
  await expect(page.locator('#home-registry-seafarer-count')).not.toHaveText('0');
  await expect(page.locator('[data-i18n="home.hero.registryCta"]')).toBeVisible();
  await page.locator('[data-i18n="home.hero.registryCta"]').click();
  await expect(page.locator('#home-registry-summary')).toBeInViewport({ ratio: 0.2 });
  const registryAppearsBeforeServiceModel = await page.evaluate(() => {
    const registry = document.getElementById('home-registry-summary');
    const serviceModel = document.getElementById('vacancy-search-block')?.closest('section');
    if (!registry || !serviceModel) {
      return false;
    }

    return registry.getBoundingClientRect().top + window.scrollY < serviceModel.getBoundingClientRect().top + window.scrollY;
  });
  expect(registryAppearsBeforeServiceModel).toBeTruthy();
  await expect(page.locator('#home-registry-vacancies')).toContainText(title);
  await expect(page.locator('#home-registry-vessels')).toContainText(`MV Dashboard Star ${unique}`);
  await expect(page.locator('#home-registry-seafarers')).toContainText(seafarerRank);
  await expect(page.locator('#home-registry-summary')).not.toContainText(seafarerEmail);
  await expect(page.locator('#home-registry-summary')).not.toContainText(seafarerPhone);
  await expect(page.locator('[data-registry-filter="all"]')).toBeVisible();
  await page.locator('[data-registry-filter="vacancy_requests"]').click();
  await expect(page.locator('[data-registry-filter="vacancy_requests"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#home-registry-vacancy-card')).toBeVisible();
  await expect(page.locator('#home-registry-vessel-card')).toBeHidden();
  await expect(page.locator('#home-registry-seafarer-card')).toBeHidden();
  await expect(page.locator('#home-registry-vacancies')).toContainText(title);

  await page.locator('[data-registry-filter="matching_ready"]').click();
  await expect(page.locator('#home-registry-vacancies')).toContainText(title);
  await expect(page.locator('#home-registry-vessels')).toContainText(`MV Dashboard Star ${unique}`);
  await expect(page.locator('#home-registry-seafarers')).toContainText(seafarerRank);
  await expect(page.locator('#home-registry-summary')).not.toContainText(seafarerEmail);
  await expect(page.locator('#home-registry-summary')).not.toContainText(seafarerPhone);

  await page.locator('[data-registry-filter="has_blockers"]').click();
  await expect(page.locator('[data-registry-filter="has_blockers"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#home-registry-summary')).not.toContainText(seafarerEmail);
  await expect(page.locator('#home-registry-summary')).not.toContainText(seafarerPhone);

  await page.locator('[data-registry-filter="all"]').click();
  await expect(page.locator('main')).not.toContainText('for demonstration');
  await expect(page.locator('#vacancy-search-block details').first()).not.toHaveAttribute('open', '');
  await expect(page.locator('#vacancy-search-block .field-note').first()).not.toBeVisible();

  await page.locator('#vacancy-search-block summary').first().click();
  await expect(page.locator('#vacancy-search-block .field-note').first()).toBeVisible();

  await page.evaluate(() => {
    window.localStorage.setItem('crewportglobal.language', 'ru');
  });
  await page.reload();
  await expect(page.locator('#current-language-label')).toHaveText('Русский');
  await expect(page.locator('[data-registry-filter="all"]')).toContainText('Все записи');
  const registryCounterLabelsFit = await page.locator('.registry-count-card span').evaluateAll((nodes) =>
    nodes.every((node) => {
      const label = node as HTMLElement;
      const card = label.closest('.registry-count-card') as HTMLElement | null;
      return label.scrollWidth <= label.clientWidth + 1 && (!card || card.scrollWidth <= card.clientWidth + 1);
    })
  );
  expect(registryCounterLabelsFit).toBeTruthy();
});
