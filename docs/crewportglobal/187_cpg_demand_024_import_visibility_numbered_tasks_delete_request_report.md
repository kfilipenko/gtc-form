# CPG-DEMAND-024 - Import Visibility, Numbered Tasks and Vacancy Deletion Request Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: continuation after CPG-DEMAND-023
- Version: 1.0
- Date: 2026-05-24
- Status: Implemented and verified on GTC1

## 1. Purpose

This report records the implementation slice requested after visual review of the operator and team task interfaces.

The purpose of this slice is to make imported testing data visible in the operator workflow, add explicit numbering to task lists and queue rows, and add a controlled vacancy deletion request action.

This slice does not physically delete records, does not create a final manager-confirmation workflow, does not change matching scores, does not bypass approval guards and does not publish hidden candidates or vacancies to employers.

## 2. Why Imported Records Were Not Visible

Read-only inspection showed that the database already contained imported and test records, but many of them were outside the original operator queue status filters.

Examples found during inspection:

| Object | Imported/current statuses found | Previous queue visibility |
|---|---|---|
| `seafarer_profiles` | `submitted_for_human_review`, `rejected` | Only `submitted_for_human_review`, `in_review` were shown. |
| `employer_companies` | `unverified`, `rejected` | Only `unverified`, `submitted` were shown. |
| `vacancy_requests` | `closed`, `rejected` | Only `submitted_for_human_review`, `in_review` were shown. |
| `vacancy_applications` | `withdrawn` | Only `submitted_for_human_review`, `in_review` were shown. |

Therefore, imported records were not missing from PostgreSQL. They were filtered out because the operator queue previously showed only active review statuses.

## 3. Operator Queue Visibility Change

The operator queue now includes imported/test inventory statuses required for matching and workflow testing.

| Object | Statuses now visible in `/verify/` |
|---|---|
| `seafarer_profiles` | `submitted_for_human_review`, `in_review`, `approved`, `rejected` |
| `employer_companies` | `unverified`, `submitted`, `verified`, `rejected` |
| `vacancy_requests` | `draft`, `submitted_for_human_review`, `in_review`, `published`, `rejected`, `closed` |
| `vacancy_applications` | `submitted_for_human_review`, `in_review`, `presented`, `rejected`, `withdrawn` |

The per-object queue read limit was increased from `200` to `2000` so the imported test set can be used without immediately truncating the review surface.

Vacancy requests with a pending deletion request are intentionally hidden from the operator queue:

```text
demand_workspace.deletion_request.status = pending_manager_confirmation
```

## 4. Numbering

Explicit numbering was added in two user-facing places:

| Page | Numbering behavior |
|---|---|
| `/team/` | Each computed task now shows a visible number such as `#1`, `#2`, `#3`. |
| `/verify/` | The operator queue table now has a first `#` column with row numbers for the current filtered/sorted list. |

This avoids manual counting by operators when reviewing long imported/test lists.

## 5. Vacancy Deletion Request

A controlled delete action was added for vacancy request rows in `/verify/`.

The button label is:

```text
Удалить заявку / Request deletion
```

This is not a physical delete.

When an operator requests deletion:

1. The browser asks for confirmation.
2. The backend requires the `request_vacancy_deletion` operation.
3. The operation requires the `review_team` / `reviewer` boundary and `approve_vacancy_request` permission.
4. The vacancy request is marked as `closed`.
5. A deletion request object is stored in `vacancy_requests.demand_workspace`.
6. The vacancy is hidden from the operator queue and public vacancy listing.
7. Manager confirmation remains pending.
8. An audit event is written with actor context.

Stored deletion request fields:

```text
status = pending_manager_confirmation
requested_at
requested_by
requested_by_user_id
operation_code = request_vacancy_deletion
previous_publication_status
reason
hidden_from_operator_queue = true
requires_manager_confirmation = true
physical_delete = false
manager_confirmation_status = pending
```

The protected endpoint is:

```text
PATCH /api/v1/operator/vacancy-requests/{vacancy_request_id}/deletion-request
```

## 6. Audit And Access Control

The deletion request operation is registered as a workflow operation:

| Operation | Group | Role | Permission |
|---|---|---|---|
| `request_vacancy_deletion` | `review_team` | `reviewer` | `approve_vacancy_request` |

The audit event is:

```text
operator_vacancy_deletion_requested
```

The audit payload includes:

1. vacancy request ID;
2. vacancy title;
3. company name;
4. previous status;
5. new status;
6. deletion request object;
7. actor context;
8. side effects.

Side effects are explicitly constrained:

```text
hidden_from_operator_queue = true
requires_manager_confirmation = true
physical_delete = false
employer_visible = false
creates_vacancy_applications = false
changes_application_statuses = false
```

## 7. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Expanded imported/test record visibility in the operator queue, added the `request_vacancy_deletion` operation, protected deletion request endpoint, public-vacancy exclusion for pending deletion and audit event writing. |
| `projects/crewportglobal/public/verify/index.html` | Added queue row numbering, localized delete-request button, confirmation prompt, deletion request API call and queue reload after hiding the vacancy. |
| `projects/crewportglobal/public/team/index.html` | Added visible numbering for computed tasks and safer title wrapping. |
| `tests/crewportglobal-registration-api.spec.ts` | Added API coverage for deletion request behavior and updated the queue-visibility assertion after approved/rejected imported statuses became visible by design. |
| `tests/crewportglobal-operator-queue.spec.ts` | Added UI assertions for team task numbering, queue row numbering and the vacancy deletion request button. |
| `docs/crewportglobal/00_documentation_register.md` | Added document 187 to the documentation register. |
| `docs/crewportglobal/187_cpg_demand_024_import_visibility_numbered_tasks_delete_request_report.md` | Added this implementation report. |

## 8. Verification

### 8.1 Backend Syntax

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

### 8.2 Embedded Frontend Syntax

```bash
node - <<'NODE'
const fs = require('fs');
for (const file of [
  'projects/crewportglobal/public/verify/index.html',
  'projects/crewportglobal/public/team/index.html',
]) {
  const html = fs.readFileSync(file, 'utf8');
  const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)).map((match) => match[1]).filter((script) => script.trim());
  scripts.forEach((script) => new Function(script));
  console.log(`${file}: checked ${scripts.length} inline script(s)`);
}
NODE
```

Result: passed.

### 8.3 Focused API Check

```bash
npx playwright test -c playwright.crewportglobal.api.config.ts tests/crewportglobal-registration-api.spec.ts -g "operator can request vacancy deletion"
```

Result: 1 passed.

The focused API check confirms:

1. a vacancy request is visible in the operator queue before deletion request;
2. the deletion request endpoint returns `new_status = closed`;
3. `requires_manager_confirmation = true`;
4. `physical_delete = false`;
5. the audit event is recorded;
6. the vacancy request is hidden from the operator queue after the request.

### 8.4 Focused UI Check

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts -g "operator vacancy detail runs read-only candidate search"
```

Result: 1 passed.

The focused UI check confirms:

1. `/team/` computed tasks show visible numbering;
2. `/verify/` queue rows show visible numbering;
3. vacancy request rows expose the `Request deletion` action;
4. existing candidate-search, shortlist and presentation task flow remains usable.

### 8.5 Focused Operator UI Suite

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
```

Result: 3 passed.

### 8.6 API Regression

```bash
npm run test:cpg-api
```

Result: 17 passed.

One earlier concurrent Playwright server start encountered a PostgreSQL migration concurrency error. The test was rerun in isolation and then the full API suite passed.

## 9. Portal Verification Path

Recommended manual verification path after publication:

1. Sign in through `/team/` with a named user who belongs to the `review_team` group and has the `reviewer` role / `approve_vacancy_request` permission.
2. Confirm that `Мои задачи` shows numbered tasks.
3. Open a task link or go directly to `/verify/`.
4. Confirm that the operator queue has a visible `#` column.
5. Filter by vacancy request if needed.
6. Confirm imported/test vacancy requests with historical statuses are visible.
7. Click `Удалить заявку`.
8. Confirm the browser prompt.
9. Confirm that the row disappears from the queue and the status message says manager confirmation is required.

## 10. Remaining Controlled Gap

The manager confirmation step is not implemented in this slice.

The next implementation step should add a manager-only confirmation operation for pending deletion requests:

```text
confirm_vacancy_deletion
reject_vacancy_deletion
restore_hidden_vacancy_request
```

That step should keep deletion soft by default and continue to write actor-context audit events for every decision.
