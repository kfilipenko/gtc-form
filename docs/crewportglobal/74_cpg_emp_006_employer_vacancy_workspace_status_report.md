# CrewPortGlobal — CPG-EMP-006 Employer Vacancy Workspace Status Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-14
- Document type: Implementation report
- Status: Implemented, verified and published to the live site

## 1. Purpose

This report records the employer-side improvement that turns `/post-vacancy/` from a simple save form into a more practical vacancy workspace.

The employer can now see whether the company and vacancy request are saved, whether the vacancy is public, and what the next operational step is.

## 2. Implemented Scope

Implemented changes:

1. added workspace status cards to `/post-vacancy/`;
2. displays company verification status;
3. displays vacancy request publication status;
4. displays whether the vacancy is public;
5. displays the backend draft reference;
6. displays a next-step message based on company, vacancy and operator review state;
7. loads an existing employer draft from `draft_id`;
8. pre-fills company, vessel and vacancy fields from the backend draft response;
9. refreshes the workspace status after each save;
10. keeps public publication gated by operator-reviewed company and vacancy status.

No database migration or new backend endpoint was required.

## 3. Safety and Product Boundaries

The implementation keeps these boundaries:

1. employers can save a vacancy request but cannot publish it directly;
2. public vacancy publication still requires company verification and vacancy approval;
3. `/post-vacancy/` uses existing draft create/update endpoints;
4. operator decisions remain in the protected operator review API;
5. saved test vacancies are closed after browser tests to avoid polluting public data.

## 4. Changed Files

Core implementation:

- `projects/crewportglobal/public/post-vacancy/index.html`

Test coverage:

- `tests/crewportglobal-post-vacancy-workspace.spec.ts`

## 5. Verification

Verification performed:

```bash
npm run check:cpg-i18n
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-post-vacancy-workspace.spec.ts
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-post-vacancy-workspace.spec.ts tests/crewportglobal-register-routing.spec.ts tests/crewportglobal-vacancy-board.spec.ts tests/crewportglobal-homepage-live-dashboard.spec.ts tests/crewportglobal-operator-queue.spec.ts
git diff --check
```

The browser test covers:

1. new vacancy workspace save;
2. reload by `draft_id`;
3. form prefill from backend data;
4. vacancy update;
5. operator company review;
6. operator vacancy review;
7. employer-visible `Published` state after review;
8. mobile-width overflow guard.

Live publication and checks:

```bash
./projects/crewportglobal/scripts/publish_live_site.sh
curl -k -fsS https://crewportglobal.com/api/v1/health
curl -k -fsS https://crewportglobal.com/post-vacancy/
curl -k -fsS https://crewportglobal.com/api/v1/vacancies
curl -k -fsS -H "X-CPG-Operator-Token: <token>" https://crewportglobal.com/api/v1/operator/review-queue
```

Live result:

1. `/post-vacancy/` contains the workspace status grid and draft prefill logic;
2. API health returns `ok: true`;
3. public vacancies return `ok: true` with `count: 0`;
4. operator queue contains 10 non-UI review items and 0 active `ui.*@example.com` test items;
5. desktop `1440x1000` and mobile `390x1000` live checks show no console errors and no horizontal overflow.

## 6. Next Recommended Work

Recommended next slice:

1. add a public vacancy detail page;
2. add a seafarer apply-to-vacancy action;
3. add employer-side candidate pipeline placeholders backed by real reviewed data only;
4. replace temporary operator token access with account-based operator authentication.
