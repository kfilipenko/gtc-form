# CrewPortGlobal - CPG-EMP-009 Employer Candidate Follow-up Note Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-14
- Document type: Implementation report
- Status: Implemented, verified and published to the live site

## 1. Purpose

This report records the employer workspace improvement that lets an employer add a follow-up note to an operator-presented candidate inside `/post-vacancy/`.

The change makes the candidate pipeline more operational: employer actions now carry context such as interview window, contact result or reason why the candidate is not suitable for the current rotation.

## 2. Implemented Scope

Implemented changes:

1. added a follow-up note textarea to each presented candidate card;
2. prefilled the note from the saved `employer_action_note`;
3. submitted the note together with contacted, interview requested and not suitable actions;
4. reused the existing draft-scoped employer shortlist API boundary;
5. kept the note limited to the employer-owned company and operator-presented application workflow;
6. added English and Russian interface text for the follow-up note label and placeholder;
7. extended API and browser coverage so the note persists and appears after workspace reload.

## 3. Safety and Product Boundaries

The implementation keeps these boundaries:

1. the note can be saved only through the employer draft workspace;
2. the employer still cannot update applications from another company;
3. the employer still cannot update applications before operator presentation;
4. the note is operational context only and does not represent a final hiring decision;
5. the current draft-id workspace model remains temporary until full account sessions are implemented.

## 4. Changed Files

Backend documentation:

- `projects/crewportglobal/app/backend/api/README.md`

Frontend:

- `projects/crewportglobal/public/post-vacancy/index.html`

Test coverage:

- `tests/crewportglobal-registration-api.spec.ts`
- `tests/crewportglobal-post-vacancy-workspace.spec.ts`

Documentation:

- `docs/crewportglobal/81_cpg_emp_009_employer_candidate_followup_note_report.md`
- `docs/crewportglobal/00_documentation_register.md`

## 5. Verification

Verification planned and performed during this slice:

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
npm run check:cpg-i18n
npm run test:cpg-api
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-post-vacancy-workspace.spec.ts
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-create-profile-prefill.spec.ts tests/crewportglobal-vacancy-detail-apply.spec.ts tests/crewportglobal-operator-queue.spec.ts tests/crewportglobal-post-vacancy-workspace.spec.ts
git diff --check
```

Local result:

1. PHP syntax check passed;
2. i18n key check passed with existing non-English fallback warnings;
3. API regression passed: 10 tests;
4. post-vacancy browser regression passed: 1 test;
5. linked browser workflow regression passed: 8 tests.
6. diff whitespace check passed.

The regression must cover:

1. employer sees a follow-up note textarea on a presented candidate;
2. employer saves a note when requesting interview;
3. note remains visible after the workspace reloads;
4. employer can replace the note when marking the candidate not suitable;
5. API exposes the persisted `employer_action_note` in the employer draft payload;
6. no horizontal overflow appears in the updated workspace.

Live publication and checks:

```bash
./projects/crewportglobal/scripts/publish_live_site.sh
curl -k -fsS https://crewportglobal.com/api/v1/health
curl -k -fsS https://crewportglobal.com/post-vacancy/
```

Live result:

1. `/post-vacancy/` includes the employer follow-up note textarea code and translated labels;
2. API health returns `ok: true`;
3. mobile live smoke check shows no horizontal overflow and no console errors;
4. empty live state remains controlled until an operator presents a candidate.

## 6. Next Recommended Work

Recommended next slices:

1. add seafarer application withdrawal or "not available" action;
2. add account-based employer sessions to replace draft-id workspace access;
3. add employer-side filter tabs for presented, contacted, interview requested and not suitable candidates.
