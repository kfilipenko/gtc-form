# CrewPortGlobal - CPG-ACCESS-002 Backend Access Guard Foundation Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-15
- Document type: Implementation report
- Status: Implemented and verified locally, not wired into runtime enforcement

## 1. Purpose

This report records Phase 2 from document 88: backend access guard planning and tests.

The goal of this slice is to prepare the backend permission-checking layer without replacing the current temporary operator token and without enabling account-session based enforcement yet.

## 2. Implemented Scope

Implemented changes:

1. added `projects/crewportglobal/app/backend/api/lib/access_control.php`;
2. added normalized permission scope helpers;
3. added effective-permission matching:
   - `cpg_access_effective_permissions_allow(...)`;
   - `cpg_access_permission_allows(...)`;
   - `cpg_access_scope_allows(...)`;
4. added database-backed helper stubs for future approved runtime use:
   - `cpg_access_load_effective_permissions(user_id)`;
   - `cpg_access_require_permission(user_id, permission_code, scope)`;
   - `cpg_access_write_audit_event(...)`;
5. added operator review queue permission mapping:
   - view permissions by queue type;
   - action permissions by queue type and decision;
6. added isolated PHP tests that do not connect to PostgreSQL;
7. updated backend API documentation to mark the guard as prepared but not wired into runtime routes.

## 3. Current Guard Boundary

The guard module is present, but runtime behavior is unchanged:

1. `/verify/` still uses the existing temporary operator-token boundary;
2. operator API routes still call `require_operator_access()`;
3. no public route calls `cpg_access_require_permission(...)` yet;
4. no account session is introduced;
5. no email one-time-code flow is introduced;
6. no `/admin/access/` page or API is introduced;
7. the access-control SQL draft remains a draft until separately reviewed and applied under approval.

## 4. Permission Mapping Baseline

Initial operator queue mapping:

| Queue type | View permission |
|---|---|
| `seafarer_profile` | `view_verification_queue` |
| `company_verification` | `view_verification_queue` |
| `vacancy_request` | `view_review_queue` |
| `vacancy_application` | `view_review_queue` |

Initial action examples:

| Queue type | Decision | Permission |
|---|---|---|
| `seafarer_profile` | `reviewed` | `approve_seafarer_profile` |
| `seafarer_profile` | `needs_correction` | `return_profile_for_correction` |
| `company_verification` | `reviewed` | `approve_company_profile` |
| `vacancy_request` | `reviewed` | `approve_vacancy_request` |
| `vacancy_application` | `reviewed` | `approve_candidate_presentation` |

This mapping is a Phase 2 baseline and should be re-reviewed before wiring it into production enforcement.

## 5. Changed Files

Backend:

- `projects/crewportglobal/app/backend/api/lib/access_control.php`
- `projects/crewportglobal/app/backend/api/tests/access_control_guard_test.php`
- `projects/crewportglobal/app/backend/api/README.md`
- `projects/crewportglobal/app/backend/README.md`

Documentation:

- `docs/crewportglobal/89_cpg_access_002_backend_access_guard_foundation_report.md`
- `docs/crewportglobal/00_documentation_register.md`

## 6. Verification

Verification performed:

```bash
php -l projects/crewportglobal/app/backend/api/lib/access_control.php
php -l projects/crewportglobal/app/backend/api/tests/access_control_guard_test.php
php projects/crewportglobal/app/backend/api/tests/access_control_guard_test.php
git diff --check
```

Local result:

1. PHP syntax check passed for the new guard module;
2. PHP syntax check passed for the isolated test;
3. access-control guard test passed without a database connection;
4. whitespace diff check passed.

## 7. Explicit Non-Changes

This slice did not change:

1. production database;
2. migration application state;
3. runtime backend route enforcement;
4. frontend pages;
5. auth/session logic;
6. email sending;
7. payment;
8. OpenClaw;
9. nginx or server configuration;
10. deployment.

## 8. Next Recommended Work

Recommended next slice:

1. review and finalize the operator queue permission mapping;
2. add approved non-production migration application for access-control tables;
3. add account-session identity planning before wiring `cpg_access_require_permission(...)` into routes;
4. then begin Phase 3: administrative email-code protection planning and tests.
