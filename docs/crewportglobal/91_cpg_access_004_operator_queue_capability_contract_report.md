# CrewPortGlobal - CPG-ACCESS-004 Operator Queue Capability Contract Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-15
- Document type: Implementation report and UI/API contract
- Status: Implemented and verified locally, runtime enforcement unchanged

## 1. Purpose

This report records the next access-control preparation step after document 90.

The goal is to expose an operator queue capability contract that can be used by `/verify/` before account-session based access enforcement is enabled.

The contract lets the backend describe:

1. which permission and scope are required to view a queue item;
2. which permission and scope are required for each queue action;
3. whether each action is currently allowed for the acting operator.

## 2. Implemented Scope

Implemented changes:

1. added `cpg_access_operator_queue_capabilities(...)` to `access_control.php`;
2. added backend `operator_access` metadata to operator queue items;
3. added `access_model: temporary_operator_token` to the operator queue response;
4. preserved current token-based runtime behavior by marking existing token-protected actions as allowed;
5. updated `/verify/` to read `operator_access.actions[decision].allowed`;
6. disabled action buttons when a future permission-checked response returns `allowed: false`;
7. added Playwright coverage for disabled action buttons using a mocked permission-checked response;
8. updated isolated PHP guard tests for the capability contract.

## 3. Current Contract Shape

Example queue item field:

```json
{
  "operator_access": {
    "mode": "temporary_operator_token",
    "view": {
      "permission_code": "view_review_queue",
      "scope": "queue",
      "allowed": true
    },
    "actions": {
      "start_review": {
        "permission_code": "start_human_review",
        "scope": "queue",
        "allowed": true
      },
      "needs_correction": {
        "permission_code": "create_review_note",
        "scope": "queue",
        "allowed": true
      },
      "reviewed": {
        "permission_code": "approve_vacancy_request",
        "scope": "queue",
        "allowed": true
      }
    }
  }
}
```

## 4. Boundary

This change does not enable final access enforcement.

Current boundaries:

1. `/verify/` still requires the temporary operator token;
2. runtime routes still call `require_operator_access()`;
3. no protected route calls `cpg_access_require_permission(...)`;
4. no account session is introduced;
5. no access-control SQL migration was applied;
6. no admin console was implemented;
7. no email-code flow was implemented;
8. no deployment was performed by this implementation slice.

## 5. Changed Files

Backend:

- `projects/crewportglobal/app/backend/api/lib/access_control.php`
- `projects/crewportglobal/app/backend/api/public/index.php`
- `projects/crewportglobal/app/backend/api/tests/access_control_guard_test.php`
- `projects/crewportglobal/app/backend/api/README.md`

Frontend:

- `projects/crewportglobal/public/verify/index.html`
- `tests/crewportglobal-operator-access-contract.spec.ts`

Documentation:

- `docs/crewportglobal/91_cpg_access_004_operator_queue_capability_contract_report.md`
- `docs/crewportglobal/00_documentation_register.md`

## 6. Verification

Verification performed:

```bash
php -l projects/crewportglobal/app/backend/api/lib/access_control.php
php -l projects/crewportglobal/app/backend/api/public/index.php
php -l projects/crewportglobal/app/backend/api/tests/access_control_guard_test.php
php -l projects/crewportglobal/app/backend/api/tests/access_control_operator_queue_matrix_test.php
php projects/crewportglobal/app/backend/api/tests/access_control_guard_test.php
php projects/crewportglobal/app/backend/api/tests/access_control_operator_queue_matrix_test.php
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-access-contract.spec.ts
npm run check:cpg-i18n
git diff --check
```

## 7. Next Recommended Work

Recommended next slice:

1. prepare account-session identity planning for operator users;
2. define a safe non-production migration application review for the access-control draft;
3. only after that, wire one read-only operator endpoint to permission-checked enforcement as a pilot.
