# CrewPortGlobal — CPG-OPS-017 Vacancy Application Operator Review Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-14
- Document type: Implementation report
- Status: Implemented, verified and published to the live site

## 1. Purpose

This report records the operator workflow improvement that makes seafarer vacancy applications visible and actionable after they are submitted from a reviewed public vacancy page.

The change closes the first operational gap after CPG-MKT-003: applications are no longer only stored in the database; they now enter the protected operator queue for manual handling.

## 2. Implemented Scope

Implemented changes:

1. added `vacancy_application` as a protected operator queue type;
2. added application rows to `GET /api/v1/operator/review-queue`;
3. added a protected application detail endpoint for operator review;
4. added operator decisions for vacancy applications:
   - `start_review` -> `in_review`;
   - `needs_correction` -> `rejected`;
   - `reviewed` -> `presented`;
5. added audit records for vacancy application operator decisions;
6. extended `/verify/` with a vacancy application filter and detail view;
7. added API and browser regression coverage.

## 3. Safety and Product Boundaries

The implementation keeps these boundaries:

1. application details are visible only through operator-token protected endpoints;
2. submitted applications are still handled by human review;
3. the public application action does not promise automatic employment;
4. the `presented` state records internal readiness to present a candidate, not a final employment outcome;
5. employer-facing candidate pipeline visibility remains a future task.

## 4. Changed Files

Backend:

- `projects/crewportglobal/app/backend/api/public/index.php`
- `projects/crewportglobal/app/backend/api/README.md`

Frontend:

- `projects/crewportglobal/public/verify/index.html`

Test coverage:

- `tests/crewportglobal-registration-api.spec.ts`
- `tests/crewportglobal-operator-queue.spec.ts`

Documentation:

- `docs/crewportglobal/76_cpg_ops_017_vacancy_application_operator_review_report.md`
- `docs/crewportglobal/00_documentation_register.md`

## 5. Verification

Verification performed:

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
npm run check:cpg-i18n
npm run test:cpg-api
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts tests/crewportglobal-vacancy-detail-apply.spec.ts
git diff --check
```

The tests cover:

1. vacancy application creation from a reviewed public vacancy;
2. application visibility in the protected operator queue;
3. application detail rendering in `/verify/`;
4. `start_review` transition to `in_review`;
5. `reviewed` transition to `presented`;
6. review note persistence and history rendering.

Live publication and checks:

```bash
./projects/crewportglobal/scripts/publish_live_site.sh
curl -k -fsS https://crewportglobal.com/api/v1/health
curl -k -fsS https://crewportglobal.com/verify/
curl -k -fsS -H "X-CPG-Operator-Token: <token>" https://crewportglobal.com/api/v1/operator/review-queue
```

Live result:

1. `/verify/` includes the `vacancy_application` queue filter and detail renderer;
2. API health returns `ok: true`;
3. protected operator queue returns `ok: true`;
4. current live queue contains 10 existing non-application items;
5. vacancy application detail route rejects invalid IDs with the expected 400 validation response;
6. mobile live smoke check shows no horizontal overflow and no console errors.

## 6. Next Recommended Work

Recommended next slice:

1. add employer-side candidate pipeline visibility for `presented` applications;
2. add seafarer application history on `/create-profile/`;
3. add account-based operator authentication to replace the temporary token boundary.
