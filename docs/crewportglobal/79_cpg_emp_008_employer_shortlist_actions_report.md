# CrewPortGlobal - CPG-EMP-008 Employer Shortlist Actions Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-14
- Document type: Implementation report
- Status: Implemented, verified and published to the live site

## 1. Purpose

This report records the employer workspace improvement that lets an employer record an action against an operator-presented candidate inside `/post-vacancy/`.

The change continues the move from a read-only website toward a practical maritime hiring application: after the operator presents a candidate, the employer can now mark the candidate as contacted, request an interview or mark the candidate as not suitable.

## 2. Implemented Scope

Implemented changes:

1. added employer shortlist fields to `vacancy_applications`;
2. added a draft-scoped employer API endpoint for shortlist status updates;
3. limited employer actions to applications owned by the employer company;
4. limited employer actions to applications already marked `presented` by the operator;
5. persisted employer action status, optional note and timestamp;
6. recorded employer shortlist actions in the audit trail;
7. displayed employer shortlist status inside the `/post-vacancy/` candidate pipeline;
8. added employer action buttons for contacted, interview requested and not suitable;
9. added English and Russian interface text for the new actions and statuses;
10. extended API and browser coverage for the employer action workflow.

## 3. Safety and Product Boundaries

The implementation keeps these boundaries:

1. employers cannot update applications from another company;
2. employers cannot update applications before operator presentation;
3. employer action does not replace operator review or final hiring workflow;
4. action history is recorded as an audit event;
5. the current draft-id workspace model remains temporary until full account sessions are implemented.

## 4. Changed Files

Database:

- `projects/crewportglobal/app/backend/db/migrations/005_extend_vacancy_applications_employer_shortlist.sql`
- `projects/crewportglobal/app/backend/db/README.md`

Backend:

- `projects/crewportglobal/app/backend/api/public/index.php`
- `projects/crewportglobal/app/backend/api/README.md`

Frontend:

- `projects/crewportglobal/public/post-vacancy/index.html`

Deployment and tests:

- `projects/crewportglobal/scripts/publish_live_site.sh`
- `playwright.crewportglobal.config.ts`
- `playwright.crewportglobal.api.config.ts`
- `tests/crewportglobal-registration-api.spec.ts`
- `tests/crewportglobal-post-vacancy-workspace.spec.ts`

Documentation:

- `docs/crewportglobal/79_cpg_emp_008_employer_shortlist_actions_report.md`
- `docs/crewportglobal/00_documentation_register.md`

## 5. Verification

Verification planned and performed during this slice:

```bash
PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql -v ON_ERROR_STOP=1 -f projects/crewportglobal/app/backend/db/migrations/005_extend_vacancy_applications_employer_shortlist.sql
php -l projects/crewportglobal/app/backend/api/public/index.php
npm run check:cpg-i18n
npm run test:cpg-api
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-post-vacancy-workspace.spec.ts
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-create-profile-prefill.spec.ts tests/crewportglobal-vacancy-detail-apply.spec.ts tests/crewportglobal-operator-queue.spec.ts tests/crewportglobal-post-vacancy-workspace.spec.ts
git diff --check
```

Local result:

1. database migration passed locally;
2. PHP syntax check passed;
3. i18n key check passed with existing non-English fallback warnings;
4. API regression passed;
5. post-vacancy browser regression passed;
6. linked browser workflow regression passed;
7. diff whitespace check passed.

The regression covers:

1. employer candidate pipeline remains empty before operator presentation;
2. seafarer applies to a reviewed public vacancy;
3. operator presents the application to the employer;
4. employer sees the presented candidate;
5. employer marks candidate as contacted;
6. employer requests interview;
7. employer reloads the workspace and keeps the selected status;
8. employer marks candidate as not suitable;
9. API exposes the persisted employer shortlist status in the employer draft payload;
10. no horizontal overflow appears in the updated workspace.

Live publication and checks:

```bash
./projects/crewportglobal/scripts/publish_live_site.sh
curl -k -fsS https://crewportglobal.com/api/v1/health
curl -k -fsS https://crewportglobal.com/post-vacancy/
```

Live result:

1. `/post-vacancy/` includes the employer shortlist action code and translated status labels;
2. API health returns `ok: true`;
3. mobile live smoke check shows no horizontal overflow and no console errors;
4. empty live state remains controlled until an operator presents a candidate.

## 6. Next Recommended Work

Recommended next slices:

1. add employer notes input for candidate follow-up context;
2. add seafarer application withdrawal or "not available" action;
3. add account-based employer sessions to replace draft-id workspace access.
