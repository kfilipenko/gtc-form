# CrewPortGlobal - CPG-ACCESS-003 Operator Queue Permission Matrix Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-15
- Document type: Implementation report and permission contract
- Status: Implemented and verified locally, not wired into runtime enforcement

## 1. Purpose

This report records the next access-control preparation step after document 89.

The goal is to make the operator queue permission mapping explicit and testable before any future runtime enforcement is connected to `/verify/` or operator API routes.

## 2. Implemented Scope

Implemented changes:

1. replaced separate operator queue permission constants with one explicit matrix in `access_control.php`;
2. represented each queue permission requirement as:
   - `permission_code`;
   - `scope`;
3. added helper functions:
   - `cpg_access_operator_queue_permission_matrix()`;
   - `cpg_access_operator_queue_view_requirement(queue_type)`;
   - `cpg_access_operator_queue_action_requirement(queue_type, decision)`;
4. preserved compatibility helpers that return only the permission code:
   - `cpg_access_operator_queue_view_permission(queue_type)`;
   - `cpg_access_operator_queue_action_permission(queue_type, decision)`;
5. added a static matrix test that checks:
   - all current queue types have view requirements;
   - all current queue types have `start_review`, `needs_correction` and `reviewed` action requirements;
   - all requirements use `queue` scope;
   - all mapped permission codes exist in the access-control SQL draft seed permissions;
   - unknown queue types and unknown decisions return `null`.

## 3. Current Matrix

| Queue type | View permission | `start_review` | `needs_correction` | `reviewed` |
|---|---|---|---|---|
| `seafarer_profile` | `view_verification_queue` | `start_human_review` | `return_profile_for_correction` | `approve_seafarer_profile` |
| `company_verification` | `view_verification_queue` | `mark_document_under_review` | `request_document_correction` | `approve_company_profile` |
| `vacancy_request` | `view_review_queue` | `start_human_review` | `create_review_note` | `approve_vacancy_request` |
| `vacancy_application` | `view_review_queue` | `start_human_review` | `create_review_note` | `approve_candidate_presentation` |

All entries currently use `queue` scope.

## 4. Boundary

This change is still preparation only:

1. runtime routes do not call `cpg_access_require_permission(...)`;
2. the temporary operator token remains active;
3. the access-control SQL migration remains a draft;
4. no database migration was applied;
5. no account session, email code, admin console or deployment change was introduced.

## 5. Changed Files

Backend:

- `projects/crewportglobal/app/backend/api/lib/access_control.php`
- `projects/crewportglobal/app/backend/api/tests/access_control_guard_test.php`
- `projects/crewportglobal/app/backend/api/tests/access_control_operator_queue_matrix_test.php`
- `projects/crewportglobal/app/backend/api/README.md`

Documentation:

- `docs/crewportglobal/90_cpg_access_003_operator_queue_permission_matrix_report.md`
- `docs/crewportglobal/00_documentation_register.md`

## 6. Verification

Verification performed:

```bash
php -l projects/crewportglobal/app/backend/api/lib/access_control.php
php -l projects/crewportglobal/app/backend/api/tests/access_control_guard_test.php
php -l projects/crewportglobal/app/backend/api/tests/access_control_operator_queue_matrix_test.php
php projects/crewportglobal/app/backend/api/tests/access_control_guard_test.php
php projects/crewportglobal/app/backend/api/tests/access_control_operator_queue_matrix_test.php
git diff --check
```

Local result:

1. PHP syntax checks passed;
2. isolated guard test passed;
3. static operator queue matrix test passed without database connection;
4. whitespace diff check passed.

The full API suite was not required for this slice because runtime routes were not changed and the SQL access-control migration is still a draft.

## 7. Next Recommended Work

Recommended next slice:

1. prepare account-session identity planning before runtime enforcement;
2. design how `/verify/` should hide or disable action buttons when the current operator can view a queue item but lacks the action-specific permission;
3. only after approved non-production migration application, wire one read-only endpoint to the guard as a pilot.
