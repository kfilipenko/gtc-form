# CPG-SEAFARER-018 - Endpoint, Guard and Consent Addendum

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report addendum
- Parent report: `152_cpg_seafarer_018_approval_consent_medical_report.md`
- Source task: #27 - CPG-SEAFARER-018
- Version: 1.0
- Date: 2026-05-19
- Status: Implemented and verified on GTC1

## 1. Purpose

This addendum provides endpoint-level, guard-level and consent-level details for CPG-SEAFARER-018.

It is intentionally explicit. It records exact changed files, migration 013 structure, consent endpoints, blocker codes, vacancy-application transition behavior, employer payload allow/deny rules and test traceability.

## 2. Changed Files Matrix

| File | Change type | Purpose |
|---|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Backend API | Added consent event helpers/endpoints, approval guard, restricted medical denial endpoint, non-owner visibility checks, approval audit payloads and employer payload cleanup. |
| `projects/crewportglobal/app/backend/db/migrations/013_create_seafarer_consent_events.sql` | Database migration | Added versioned purpose-specific seafarer consent event table. |
| `projects/crewportglobal/public/verify/index.html` | Operator UI | Added approval guard rendering and HTTP `409` guard-blocked handling. |
| `projects/crewportglobal/public/post-vacancy/index.html` | Employer UI | Removed seafarer email fallback from presented candidate card rendering. |
| `playwright.crewportglobal.config.ts` | Test config | Added migration 013 to UI test database setup. |
| `playwright.crewportglobal.api.config.ts` | Test config | Added migrations 012 and 013 to API test database setup. |
| `tests/crewportglobal-seafarer-approval-guard.spec.ts` | New focused test | Verifies consent guard, withdrawn consent, correction blocker, restricted medical denial, successful presentation and employer payload exclusions. |
| `tests/crewportglobal-seafarer-visibility-minimization.spec.ts` | Regression test update | Verifies CPG-SEAFARER-017 minimization still holds and employer payload excludes `contact_email`, `seafarer_email` and `contact_phone`. |
| `tests/crewportglobal-operator-queue.spec.ts` | Regression test update | Preserves operator queue behavior with scoped payload/guard changes. |
| `tests/crewportglobal-post-vacancy-workspace.spec.ts` | Regression test update | Confirms employer candidate card behavior without seafarer e-mail display. |
| `tests/crewportglobal-create-profile-prefill.spec.ts` | Regression test update | Keeps create-profile prefill compatible with migration 013 setup. |
| `tests/crewportglobal-registration-api.spec.ts` | API regression update | Adds consent setup compatibility for API test flows. |
| `docs/crewportglobal/152_cpg_seafarer_018_approval_consent_medical_report.md` | Documentation | Parent implementation report. |
| `docs/crewportglobal/153_cpg_seafarer_018_endpoint_guard_consent_addendum.md` | Documentation | This endpoint/guard/consent addendum. |
| `docs/crewportglobal/00_documentation_register.md` | Documentation register | Adds documents 151, 152 and 153 with revision history. |
| `playwright-report/crewportglobal/index.html` | Test artifact | Updated by Playwright run. |
| `playwright-report/crewportglobal-api/index.html` | Test artifact | Updated by Playwright run. |
| `test-results/.last-run.json` | Test artifact | Updated by Playwright run. |

## 3. Migration 013 Details

Migration file:

```text
projects/crewportglobal/app/backend/db/migrations/013_create_seafarer_consent_events.sql
```

Table:

```text
crewportglobal.seafarer_consent_events
```

### 3.1 Columns

| Column | Type | Required | Notes |
|---|---|---:|---|
| `consent_id` | `UUID` | Yes | Primary key, defaults to `gen_random_uuid()`. |
| `seafarer_profile_id` | `UUID` | No | References `crewportglobal.seafarer_profiles(seafarer_profile_id)` with `ON DELETE CASCADE`. |
| `draft_id` | `UUID` | Yes | References `crewportglobal.users(user_id)` with `ON DELETE CASCADE`. Transitional owner boundary still uses draft/user id. |
| `consent_type` | `TEXT` | Yes | Must match approved consent types. |
| `purpose` | `TEXT` | Yes | Human-readable purpose for the consent event. |
| `legal_basis` | `TEXT` | Yes | Defaults from API to `explicit_consent` when omitted. |
| `text_version` | `TEXT` | Yes | Version of consent text accepted by the user. |
| `language` | `TEXT` | Yes | Defaults to `en`; constrained to short language tag format. |
| `accepted_at` | `TIMESTAMPTZ` | Conditional | Set for consent acceptance events. |
| `withdrawn_at` | `TIMESTAMPTZ` | Conditional | Set when active consent is withdrawn. |
| `source_page` | `TEXT` | Yes | Page or API source that recorded the event. |
| `actor_user_id` | `UUID` | No | References `crewportglobal.users(user_id)` with `ON DELETE SET NULL`. |
| `actor_type` | `TEXT` | Yes | One of approved actor types. |
| `metadata` | `JSONB` | Yes | Defaults to `{}`. Withdrawal reason is merged into this object. |
| `created_at` | `TIMESTAMPTZ` | Yes | Defaults to `now()`. |
| `updated_at` | `TIMESTAMPTZ` | Yes | Defaults to `now()`. |

### 3.2 Constraints

| Constraint | Rule |
|---|---|
| Primary key | `consent_id` |
| `seafarer_consent_events_type_chk` | `consent_type` must be one of `profile_review`, `matching_preparation`, `employer_sharing`, `document_verification`, `sensitive_medical_processing`, `reference_contact_verification`. |
| `seafarer_consent_events_actor_type_chk` | `actor_type` must be one of `owner`, `transition_owner`, `operator`, `team`, `system`. |
| `seafarer_consent_events_action_chk` | Either `accepted_at` or `withdrawn_at` must be present. |
| `seafarer_consent_events_language_chk` | `language` must match `^[a-z]{2}(-[A-Z]{2})?$`. |
| FK `seafarer_profile_id` | Cascades when the seafarer profile is deleted. |
| FK `draft_id` | Cascades when the user/draft record is deleted. |
| FK `actor_user_id` | Sets null when the actor user is deleted. |

### 3.3 Indexes

| Index | Purpose |
|---|---|
| `seafarer_consent_events_draft_type_idx` | Fast lookup by draft/user and consent type ordered by latest acceptance/withdrawal timestamps. |
| `seafarer_consent_events_profile_type_idx` | Fast lookup by seafarer profile and consent type when `seafarer_profile_id` is present. |
| `seafarer_consent_events_active_idx` | Fast lookup of active consent events where `accepted_at IS NOT NULL AND withdrawn_at IS NULL`. |

### 3.4 Idempotency And GTC1 Status

The migration is idempotent:

```text
CREATE SCHEMA IF NOT EXISTS
CREATE EXTENSION IF NOT EXISTS
CREATE TABLE IF NOT EXISTS
CREATE INDEX IF NOT EXISTS
```

GTC1 status:

```text
Applied successfully on 2026-05-19.
Repeat execution is safe; existing-object notices are expected.
```

## 4. Consent API Matrix

Base route prefix:

```text
/api/v1
```

### 4.1 `GET /api/v1/seafarer/consents`

| Item | Behavior |
|---|---|
| Purpose | Returns consent event model and active consent summary for the current seafarer context. |
| Owner boundary | Uses `cpg_resolve_seafarer_workspace_user()`: authenticated owner session or transitional draft-owner access. |
| Response status | `200` on success. |
| Response keys | `ok`, `draft_id`, `access_model`, `consent_event_model`, `consent_summary`. |
| Store readiness | `consent_event_model.implementation_status` is `implemented_additive_table_api` when migration 013 exists. |
| Audit | Read-only endpoint does not write an audit event. |

### 4.2 `POST /api/v1/seafarer/consents`

| Item | Behavior |
|---|---|
| Purpose | Records an accepted purpose-specific consent event. |
| Required body | `consent_type`; `accepted` must be omitted or `true`. |
| Optional body | `purpose`, `legal_basis`, `text_version`, `language`, `source_page`, `metadata`, `draft_id` for transitional draft-owner access. |
| Validation | Unknown `consent_type` returns `400 invalid_consent_type`; `accepted: false` returns `400 consent_acceptance_required`; bad language returns `400 invalid_consent_language`. |
| Response status | `201` on success. |
| Response keys | `ok`, `draft_id`, `access_model`, `consent`, `consent_summary`. |
| Audit | Writes `seafarer_consent_event_recorded` to `seafarer_consent_events`. |

### 4.3 `PATCH /api/v1/seafarer/consents/{type}/withdraw`

| Item | Behavior |
|---|---|
| Purpose | Withdraws active consent events for one consent type. |
| Path parameter | `{type}` must be one of approved consent types. |
| Optional body | `reason`, `draft_id` for transitional draft-owner access. |
| Validation | Unknown type returns `400 invalid_consent_type`. |
| Response status | `200` on success, including zero-count withdrawals. |
| Response keys | `ok`, `draft_id`, `access_model`, `consent_type`, `withdrawn`, `withdrawn_count`, `consent_summary`. |
| Audit | Writes `seafarer_consent_event_withdrawn` to `seafarer_consent_events`. |

## 5. Consent Types Table

| Consent type | Default purpose | Required for employer-facing presentation in this slice |
|---|---|---:|
| `profile_review` | Human review of seafarer profile data | No |
| `matching_preparation` | Preparation of a reviewed matching summary | Yes |
| `employer_sharing` | Sharing an approved employer-safe candidate summary | Yes |
| `document_verification` | Verification of uploaded document readiness | No |
| `sensitive_medical_processing` | Restricted processing of medical declaration details | No |
| `reference_contact_verification` | Verification of previous-employer reference contacts | No |

## 6. Approval Guard Matrix

Guard function:

```text
cpg_vacancy_application_approval_guard(string $applicationId)
```

Guard is enforced before:

```text
PATCH /api/v1/operator/review-queue/{vacancy_application_id}/status
```

when:

```json
{
  "queue_type": "vacancy_application",
  "decision": "reviewed"
}
```

### 6.1 Exact Blocker Codes

| Blocker code | Trigger | Details returned |
|---|---|---|
| `company_not_verified` | Employer company `verification_status` is not `verified`. | None. |
| `vacancy_not_published` | Vacancy `publication_status` is not `published`. | None. |
| `critical_professional_data_missing` | Candidate `primary_rank`, `seafarer_department` or `availability_status` is missing. | `field`. |
| `document_readiness_not_ready` | `document_summary.certificate_status` or `document_summary.stcw_status` is not ready. | `field`. |
| `document_summary_missing` | `document_summary.passport_expiry`, `document_summary.medical_expiry` or `document_summary.visa_status` is missing. | `field`. |
| `consent_event_store_missing` | Migration/table `crewportglobal.seafarer_consent_events` is unavailable. | None. |
| `missing_active_consent` | Required `matching_preparation` or `employer_sharing` consent is absent or withdrawn. | `consent_type`. |
| `unresolved_source_card_correction` | Any source-card review state is `correction_requested`. | `card_code`, `card_name`. |
| `unsafe_employer_payload` | Employer-facing payload probe contains forbidden keys. | `fields`. |

### 6.2 Warning Codes

| Warning code | Trigger | Current effect |
|---|---|---|
| `source_card_not_individually_reviewed` | Required source card has no explicit review event yet. | Warning only in this slice. It does not block unless the card is in `correction_requested`. |

Required source cards checked for warning coverage:

```text
PERS-002
PERS-003
PERS-006
QUAL-001
QUAL-003
QUAL-005
EXP-001
MED-003
document_readiness
matching_publication
```

## 7. Vacancy Application Transition Table

| Queue type | Decision | Guard evaluated? | Guard pass behavior | Guard fail behavior |
|---|---|---:|---|---|
| `vacancy_application` | `start_review` | No | `application_status` becomes `in_review`; audit is written. | Not applicable. |
| `vacancy_application` | `needs_correction` | No | `application_status` becomes `rejected`; audit is written. | Not applicable. |
| `vacancy_application` | `reviewed` | Yes | `application_status` becomes `presented`; response includes `approval_guard`; audit `operator_review_decision_recorded` is written with `approval_guard`. | Response is HTTP `409 approval_guard_blocked`; blockers are returned under `approval_guard.approval_blockers`; status is not changed; `operator_review_decision_recorded` audit is not written because the code returns before the update transaction. |

### 7.1 Guard Failure Response

Guard blockers are returned here:

```text
response.approval_guard.approval_blockers
```

Example shape:

```json
{
  "ok": false,
  "error": "approval_guard_blocked",
  "message": "Candidate presentation is blocked by approval guard",
  "approval_guard": {
    "approval_status": "blocked",
    "approval_blockers": []
  }
}
```

### 7.2 Guard Success Response

On success, the response includes:

```text
new_status = presented
approval_guard.approval_status = approved_for_employer_presentation
approval_guard.approval_audit.actor = temporary_operator_token
approval_guard.approval_audit.action = candidate_presentation_approved
```

The audit event `operator_review_decision_recorded` stores the same `approval_guard` object.

## 8. Restricted Medical Access

Endpoint:

```text
GET /api/v1/operator/seafarer-medical/{draft_id}
```

Current behavior for the temporary general operator token:

| Item | Behavior |
|---|---|
| Access result | HTTP `403`. |
| Error code | `restricted_medical_capability_required`. |
| Medical details returned? | No. |
| Required capabilities returned? | Yes, names only. |
| Audit written? | Yes, `restricted_medical_access_denied` to `operator_restricted_medical_access`. |

Required future capabilities:

```text
seafarer.medical.read_restricted
seafarer.medical.request_correction
seafarer.medical.verify_restricted
```

Allowed without restricted medical capability:

```text
medical certificate status
medical certificate expiry
general readiness metadata
```

Forbidden without restricted medical capability:

```text
medical declaration answers
sick-off details
injury details
surgery details
restricted medical notes
```

## 9. Page And API Impact Matrix

| Surface | Impact |
|---|---|
| `/api/v1/seafarer/consents` | New GET/POST consent event surface. |
| `/api/v1/seafarer/consents/{type}/withdraw` | New PATCH withdrawal surface. |
| `/api/v1/registration/drafts/{draft_id}?visibility=operator_general` | Non-owner visibility requires operator token and includes consent summary. |
| `/api/v1/seafarer/workspace?visibility=operator_general` | Non-owner visibility requires operator token. |
| `/api/v1/operator/review-queue/{id}/status` | Blocks `vacancy_application` `reviewed` decision unless approval guard passes. |
| `/api/v1/operator/review-queue/vacancy-applications/{id}` | Returns `approval_guard` object for operator detail view. |
| `/api/v1/operator/seafarer-medical/{draft_id}` | New restricted medical denial boundary for general operator. |
| `/api/v1/registration/drafts/{employer_draft_id}` | Employer presented candidates remain minimized and no longer include `contact_email`, `seafarer_email`, `contact_phone`, raw metadata or raw workspace. |
| `/verify/` | Shows approval guard status, blockers, warnings, consent state and payload safety. |
| `/post-vacancy/` | Uses minimized document summary and does not render seafarer email fallback. |

## 10. Employer Payload Allow/Deny Proof

Employer-facing candidate payload is produced only for records where:

```text
vacancy_applications.application_status = presented
```

### 10.1 Allowed Employer Payload Fields

The employer-facing presented-candidate payload allows:

```text
vacancy_application_id
vacancy_request_id
application_status
candidate_note
created_at
updated_at
employer_shortlist_status
employer_action_note
employer_action_at
seafarer_user_id
display_name
primary_rank
department
availability_status
availability_date
country_code
document_summary
candidate_visibility_scope
vacancy_title
vacancy_rank
vacancy_department
```

`document_summary` is reduced readiness metadata:

```text
certificate_status
stcw_status
passport_expiry
medical_expiry
visa_status
```

### 10.2 Denied Employer Payload Fields

The employer-facing payload must not include:

```text
document_metadata
seafarer_workspace
source_repeated_records
source_card_document_links
sensitive_payload
medical_history
children_records
religion
manager_notes
authorization_rank
authorization_type_of_ship
authorization_date
crewing_manager_name
crewing_manager_signature
previous_employer_references
reference_person_1
reference_phone_1
reference_email_1
contact_email
contact_phone
seafarer_email
passport numbers
seafarer identity document numbers
visa numbers
raw upload storage paths
```

### 10.3 Proof Controls

| Control | Proof |
|---|---|
| API projection | `read_presented_candidates_for_employer()` returns a fixed minimized projection and does not return `document_metadata`, `seafarer_workspace`, `contact_email`, `seafarer_email` or `contact_phone`. |
| Guard probe | `cpg_employer_candidate_payload_probe()` builds an employer-safe projection and `cpg_payload_forbidden_key_hits()` scans for forbidden keys before approval. |
| Frontend | `/post-vacancy/` no longer falls back to candidate email for presented candidate titles or metadata. |
| Tests | Focused approval guard and minimization tests assert that employer payload does not include raw metadata/workspace/contact fields or restricted medical strings. |

## 11. Test-To-Control Traceability

| Test command / file | Control verified |
|---|---|
| `php -l projects/crewportglobal/app/backend/api/public/index.php` | Backend syntax is valid. |
| Embedded script syntax checks for `/verify/` and `/post-vacancy/` | Frontend scripts remain parseable after guard/UI changes. |
| Migration 013 psql execution | Additive consent table applies successfully and can be re-run. |
| `tests/crewportglobal-seafarer-approval-guard.spec.ts` | Missing consent blocks presentation; added consent allows progress; withdrawn `employer_sharing` blocks; unresolved `QUAL-003` correction blocks; restricted medical endpoint returns `403`; successful approval changes status to `presented`; employer payload excludes raw metadata/workspace/contact fields and restricted medical strings. |
| `tests/crewportglobal-seafarer-visibility-minimization.spec.ts` | Existing minimization remains intact and employer payload excludes `contact_email`, `seafarer_email`, `contact_phone`, raw document metadata and restricted source values. |
| `tests/crewportglobal-operator-queue.spec.ts` | Operator queue remains functional with scoped payload and guard metadata. |
| `tests/crewportglobal-post-vacancy-workspace.spec.ts` | Employer workspace remains functional and candidate cards do not display seafarer email. |
| `tests/crewportglobal-create-profile-prefill.spec.ts` | Create-profile prefill remains compatible with consent table/test setup. |
| `npm run test:cpg-api` | Existing API workflows pass with migration 013 included. |
| Source-card UI regression tests | Repeated source rows, cabinet dashboard and Excel review cards remain compatible after guard changes. |

## 12. Verification Results

Executed on GTC1:

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

```bash
PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql -v ON_ERROR_STOP=1 -f projects/crewportglobal/app/backend/db/migrations/013_create_seafarer_consent_events.sql
```

Result: passed.

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-seafarer-approval-guard.spec.ts
```

Result: 1 passed.

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-seafarer-visibility-minimization.spec.ts tests/crewportglobal-operator-queue.spec.ts tests/crewportglobal-post-vacancy-workspace.spec.ts tests/crewportglobal-create-profile-prefill.spec.ts
```

Result: 8 passed.

```bash
npm run test:cpg-api
```

Result: 15 passed.

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-seafarer-source-repeated-rows.spec.ts tests/crewportglobal-cabinet-dashboard.spec.ts tests/crewportglobal-seafarer-excel-review-cards.spec.ts
```

Result: 7 passed.

Additional focused rerun after employer `contact_email` API exclusion:

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-seafarer-approval-guard.spec.ts tests/crewportglobal-seafarer-visibility-minimization.spec.ts
```

Result: 2 passed.

## 13. Final Acceptance Checklist

| Requirement | Status | Evidence |
|---|---|---|
| Matrix of changed files | Complete | Section 2. |
| Migration 013 table/columns/indexes/constraints/idempotency/status | Complete | Section 3. |
| Consent API matrix | Complete | Section 4. |
| Consent types table | Complete | Section 5. |
| Approval guard matrix with exact blocker codes | Complete | Section 6. |
| Vacancy application transition table | Complete | Section 7. |
| Exact fail-guard behavior | Complete | HTTP `409`, blockers returned under `approval_guard.approval_blockers`, status not changed, `operator_review_decision_recorded` audit not written on fail. |
| Restricted medical access section | Complete | Section 8. |
| Page/API impact matrix | Complete | Section 9. |
| Employer payload allow/deny proof | Complete | Section 10. |
| Test-to-control traceability | Complete | Section 11. |
| Employer-facing payload excludes forbidden fields | Complete | Backend projection, UI cleanup and tests; `contact_email` removed from employer payload in this addendum update. |
| No profile publication, matching or employment decision logic | Complete | No automatic matching/publication/employment decision code added. |

## 14. Controlled Follow-Up

The only approval-guard audit gap intentionally recorded here is failed guard attempts: current code returns before status update and before `operator_review_decision_recorded` audit creation.

If the Project Owner wants failed guard attempts audited as first-class events, the next narrow slice should add an explicit event such as:

```text
approval_guard_presentation_blocked
```

with:

```text
vacancy_application_id
seafarer_user_id
vacancy_request_id
blocker_codes
actor
timestamp
queue_type
requested_decision
```
