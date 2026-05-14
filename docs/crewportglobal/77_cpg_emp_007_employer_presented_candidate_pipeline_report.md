# CrewPortGlobal — CPG-EMP-007 Employer Presented Candidate Pipeline Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-14
- Document type: Implementation report
- Status: Implemented, verified and published to the live site

## 1. Purpose

This report records the employer workspace improvement that shows candidates only after a seafarer application has passed operator review and has been marked ready for presentation.

The change continues the product move from a documentation-heavy website toward a practical maritime hiring application: the employer no longer sees only publication status, but also gets the first controlled candidate pipeline inside `/post-vacancy/`.

## 2. Implemented Scope

Implemented changes:

1. added backend retrieval for employer-owned `presented` vacancy applications;
2. limited employer candidate visibility to the employer company and the current vacancy workspace;
3. added `presented_candidates` to employer draft responses;
4. added a candidate pipeline panel to `/post-vacancy/`;
5. rendered candidate name, rank, availability, email, document readiness summary, status and candidate note;
6. added English and Russian interface text for the pipeline;
7. extended the post-vacancy browser regression to create a seafarer, apply to the vacancy, approve the application through the operator API and verify employer-side visibility.

## 3. Safety and Product Boundaries

The implementation keeps these boundaries:

1. employers do not see submitted applications automatically;
2. candidate cards appear only after a human operator marks an application as `presented`;
3. the employer workspace is scoped to the employer company and current vacancy;
4. candidate presentation does not represent a final hiring decision;
5. the current draft-id workspace model remains temporary until full account sessions are implemented.

## 4. Changed Files

Backend:

- `projects/crewportglobal/app/backend/api/public/index.php`
- `projects/crewportglobal/app/backend/api/README.md`

Frontend:

- `projects/crewportglobal/public/post-vacancy/index.html`

Test coverage:

- `tests/crewportglobal-post-vacancy-workspace.spec.ts`

Documentation:

- `docs/crewportglobal/77_cpg_emp_007_employer_presented_candidate_pipeline_report.md`
- `docs/crewportglobal/00_documentation_register.md`

## 5. Verification

Verification performed:

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
npm run check:cpg-i18n
npm run test:cpg-api
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-post-vacancy-workspace.spec.ts tests/crewportglobal-vacancy-detail-apply.spec.ts tests/crewportglobal-operator-queue.spec.ts
git diff --check
```

The regression must cover:

1. empty employer candidate pipeline before any operator-presented application exists;
2. seafarer application submission against a reviewed public vacancy;
3. operator decision from submitted application to `presented`;
4. employer pipeline visibility after the decision;
5. no horizontal overflow in the updated workspace.

Local result:

1. PHP syntax check passed;
2. i18n key check passed with existing non-English fallback warnings;
3. API regression passed: 10 tests;
4. browser regression passed: 4 tests.

Live publication and checks:

```bash
./projects/crewportglobal/scripts/publish_live_site.sh
curl -k -fsS https://crewportglobal.com/api/v1/health
curl -k -fsS https://crewportglobal.com/post-vacancy/
```

Live result:

1. `/post-vacancy/` includes the employer presented-candidate pipeline block;
2. API health returns `ok: true`;
3. mobile live smoke check shows no horizontal overflow and no console errors;
4. empty live state displays "No presented candidates yet" until an operator presents a candidate.

## 6. Next Recommended Work

Recommended next slices:

1. add seafarer-side application history on `/create-profile/`;
2. add employer shortlist actions such as mark contacted, interview requested and not suitable;
3. add account-based employer sessions to replace draft-id workspace access.
