# CrewPortGlobal — CPG-MKT-003 Vacancy Detail and Application Flow Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-14
- Document type: Implementation report
- Status: Implemented, verified and published to the live site

## 1. Purpose

This report records the next marketplace slice for turning CrewPortGlobal from a reading-heavy website into a practical maritime application.

The slice adds a public reviewed vacancy detail page and a seafarer application action backed by database persistence and audit records.

## 2. Implemented Scope

Implemented changes:

1. added a reviewed public vacancy detail API endpoint;
2. added a public vacancy application API endpoint;
3. added a `crewportglobal.vacancy_applications` table for seafarer applications;
4. linked public vacancy cards to a detail page;
5. created `/vacancies/detail/` with vacancy facts, requirements and apply action;
6. pre-fills application profile reference and email from the stored seafarer draft;
7. records vacancy applications for human review;
8. writes an audit event when an application is submitted;
9. added API and browser regression coverage for detail and apply flow.

## 3. Safety and Product Boundaries

The implementation keeps these boundaries:

1. applications can be submitted only against published vacancies from verified companies;
2. rejected seafarer profiles cannot apply;
3. the application status starts as `submitted_for_human_review`;
4. CrewPortGlobal does not promise automatic employment, automatic approval or automatic employer contact;
5. duplicate applications by the same seafarer for the same vacancy are idempotently updated rather than creating duplicates;
6. seafarer applications are not yet visible to employers in a candidate pipeline.

## 4. Changed Files

Backend and DB:

- `projects/crewportglobal/app/backend/db/migrations/004_create_vacancy_applications.sql`
- `projects/crewportglobal/app/backend/db/README.md`
- `projects/crewportglobal/app/backend/api/public/index.php`
- `projects/crewportglobal/app/backend/api/README.md`

Frontend:

- `projects/crewportglobal/public/vacancies/index.html`
- `projects/crewportglobal/public/vacancies/detail/index.html`

Publication and test wiring:

- `projects/crewportglobal/scripts/publish_live_site.sh`
- `playwright.crewportglobal.config.ts`
- `playwright.crewportglobal.api.config.ts`

Test coverage:

- `tests/crewportglobal-registration-api.spec.ts`
- `tests/crewportglobal-vacancy-detail-apply.spec.ts`

Documentation:

- `docs/crewportglobal/75_cpg_mkt_003_vacancy_detail_and_apply_flow_report.md`
- `docs/crewportglobal/00_documentation_register.md`

## 5. Verification

Verification performed:

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
npm run check:cpg-i18n
npm run test:cpg-api
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-vacancy-detail-apply.spec.ts
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-vacancy-board.spec.ts tests/crewportglobal-post-vacancy-workspace.spec.ts tests/crewportglobal-homepage-live-dashboard.spec.ts tests/crewportglobal-register-routing.spec.ts tests/crewportglobal-operator-queue.spec.ts tests/crewportglobal-vacancy-detail-apply.spec.ts
git diff --check
```

The browser tests cover:

1. reviewed vacancy publication;
2. detail page navigation from the vacancy board;
3. seafarer profile prefill from stored draft data;
4. application submission;
5. duplicate application idempotency;
6. mobile-width overflow guard.

Live publication and checks:

```bash
./projects/crewportglobal/scripts/publish_live_site.sh
curl -k -fsS https://crewportglobal.com/api/v1/health
curl -k -fsS https://crewportglobal.com/vacancies/detail/
curl -k -fsS https://crewportglobal.com/api/v1/vacancies
```

Live result:

1. `/vacancies/detail/` is published;
2. API health returns `ok: true`;
3. public vacancies return `ok: true` with `count: 0`;
4. `crewportglobal.vacancy_applications` exists in Postgres;
5. mobile live smoke check shows no horizontal overflow and no console errors.

## 6. Next Recommended Work

Recommended next slice:

1. add an employer candidate pipeline placeholder backed by real application data;
2. add operator review visibility for vacancy applications;
3. add a seafarer application history panel;
4. replace temporary operator token access with account-based operator authentication.
