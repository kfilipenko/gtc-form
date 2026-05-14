# CrewPortGlobal — CPG-USER-017 Seafarer Application History Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-14
- Document type: Implementation report
- Status: Implemented, verified and published to the live site

## 1. Purpose

This report records the seafarer workspace improvement that lets a seafarer see their own vacancy application history inside `/create-profile/`.

The change turns the profile page into a more useful application workspace: after applying to a reviewed vacancy, the seafarer can return to the profile and see the vacancy, company, application note and current operator-review status.

## 2. Implemented Scope

Implemented changes:

1. added backend retrieval for vacancy applications owned by the seafarer draft user;
2. added `vacancy_applications` to seafarer draft responses;
3. added an application-history section to `/create-profile/`;
4. rendered vacancy title, company, rank, vessel context, join date, applied/updated dates, candidate note and application status;
5. added English and Russian interface text for the application-history section;
6. linked back to public vacancy detail when the vacancy remains published;
7. extended create-profile browser coverage to verify status changes from `in_review` to `presented`.

## 3. Safety and Product Boundaries

The implementation keeps these boundaries:

1. seafarers see only applications linked to their own draft user ID;
2. application history is informational and does not promise employment;
3. the public vacancy link appears only when the vacancy remains published;
4. operator review still controls application status changes;
5. the current draft-id workspace model remains temporary until account sessions are implemented.

## 4. Changed Files

Backend:

- `projects/crewportglobal/app/backend/api/public/index.php`
- `projects/crewportglobal/app/backend/api/README.md`

Frontend:

- `projects/crewportglobal/public/create-profile/index.html`

Test coverage:

- `tests/crewportglobal-create-profile-prefill.spec.ts`

Documentation:

- `docs/crewportglobal/78_cpg_user_017_seafarer_application_history_report.md`
- `docs/crewportglobal/00_documentation_register.md`

## 5. Verification

Verification performed:

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
npm run check:cpg-i18n
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-create-profile-prefill.spec.ts
npm run test:cpg-api
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-create-profile-prefill.spec.ts tests/crewportglobal-vacancy-detail-apply.spec.ts tests/crewportglobal-operator-queue.spec.ts tests/crewportglobal-post-vacancy-workspace.spec.ts
```

Local result:

1. PHP syntax check passed;
2. i18n key check passed with existing non-English fallback warnings;
3. create-profile browser regression passed: 4 tests;
4. API regression passed: 10 tests;
5. linked browser workflow regression passed: 8 tests.

Live publication and checks:

```bash
./projects/crewportglobal/scripts/publish_live_site.sh
curl -k -fsS https://crewportglobal.com/api/v1/health
curl -k -fsS https://crewportglobal.com/create-profile/
```

Live result:

1. `/create-profile/` includes the seafarer application-history section;
2. API health returns `ok: true`;
3. mobile live smoke check shows no horizontal overflow and no console errors;
4. empty live state displays "No vacancy applications yet." until the seafarer has applied to a vacancy.

The regression covers:

1. profile prefill from `draft_id`;
2. local draft prefill fallback;
3. correction status and correction note display;
4. seafarer vacancy application history display;
5. application status refresh from `Under review` to `Presented to employer`;
6. no horizontal overflow in the updated create-profile workspace.

## 6. Next Recommended Work

Recommended next slices:

1. add employer shortlist actions for presented candidates;
2. add seafarer application withdrawal or "not available" action;
3. add account-based seafarer sessions to replace draft-id workspace access.
