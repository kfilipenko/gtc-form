# CrewPortGlobal - CPG-USER-018 Seafarer Application Withdrawal Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-14
- Document type: Implementation report
- Status: Implemented and under final publication verification

## 1. Purpose

This report records the seafarer workspace improvement that lets a seafarer withdraw an active vacancy application or mark themselves not available inside `/create-profile/`.

The change makes application history more practical and respects the role separation recorded in document 80: the seafarer can control their own availability signal, while operator review remains responsible for internal review and candidate presentation decisions.

## 2. Implemented Scope

Implemented changes:

1. added a draft-scoped seafarer API endpoint for application status updates;
2. allowed seafarers to withdraw active applications from `submitted_for_human_review`, `in_review` or `presented`;
3. mapped both `withdraw` and `not_available` user actions to the existing `withdrawn` application status;
4. recorded seafarer withdrawal actions in the audit trail;
5. prevented operator review from moving already withdrawn applications back through review;
6. added application action buttons to `/create-profile/`;
7. refreshed seafarer application history after the action;
8. removed employer presented-candidate visibility when an application is withdrawn;
9. added English and Russian interface text for the new actions;
10. extended API and browser coverage for withdrawal persistence.

## 3. Safety and Product Boundaries

The implementation keeps these boundaries:

1. seafarers can update only applications linked to their own draft user ID;
2. rejected or already withdrawn applications cannot be changed through this endpoint;
3. the action does not approve, reject or alter operator review history;
4. a withdrawn application is no longer visible in the employer presented-candidate pipeline;
5. the current draft-id workspace model remains temporary until full account sessions are implemented.

## 4. Changed Files

Backend:

- `projects/crewportglobal/app/backend/api/public/index.php`
- `projects/crewportglobal/app/backend/api/README.md`

Frontend:

- `projects/crewportglobal/public/create-profile/index.html`

Test coverage:

- `tests/crewportglobal-registration-api.spec.ts`
- `tests/crewportglobal-create-profile-prefill.spec.ts`

Documentation:

- `docs/crewportglobal/82_cpg_user_018_seafarer_application_withdrawal_report.md`
- `docs/crewportglobal/00_documentation_register.md`

## 5. Verification

Verification planned and performed during this slice:

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
npm run check:cpg-i18n
npm run test:cpg-api
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-create-profile-prefill.spec.ts
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-create-profile-prefill.spec.ts tests/crewportglobal-vacancy-detail-apply.spec.ts tests/crewportglobal-operator-queue.spec.ts tests/crewportglobal-post-vacancy-workspace.spec.ts
git diff --check
```

Local result:

1. pending final verification.

The regression must cover:

1. seafarer sees active application actions in application history;
2. seafarer marks an application not available;
3. application status changes to `withdrawn`;
4. the withdrawn status remains visible after workspace reload;
5. employer presented-candidate payload no longer includes the withdrawn application;
6. operator review cannot move a withdrawn application back to presented;
7. no horizontal overflow appears in the updated workspace.

## 6. Next Recommended Work

Recommended next slices:

1. add role-aware operator queues aligned with document 80;
2. add account-based seafarer sessions to replace draft-id workspace access;
3. add employer-side filter tabs for presented, contacted, interview requested and not suitable candidates.
