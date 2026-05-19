# CPG-SEAFARER-018 - Approval Guard, Consent Events and Restricted Medical Access Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: #27 - CPG-SEAFARER-018
- Version: 1.0
- Date: 2026-05-19
- Status: Implemented and verified on GTC1

## 1. Purpose

This report records the CPG-SEAFARER-018 implementation slice.

The purpose of this slice is to prevent a seafarer vacancy application from moving into employer-facing presentation unless the platform can prove that required profile readiness, consent and data-minimization controls are satisfied.

This slice does not publish seafarer profiles, implement automatic matching, implement employment decisions, change the private Excel source, change payment logic or modify deployment infrastructure.

## 2. Source Documents Used

Implementation sources:

1. GitHub issue #27 - CPG-SEAFARER-018.
2. Document 151 - CPG-SEAFARER-018 agent execution guide.
3. Document 149 - CPG-SEAFARER-017 data minimization and scoped visibility report.
4. Document 148 - CPG-SEAFARER-017 agent execution guide.
5. Document 147 - repeated Excel source-row normalization report.
6. Document 146 - Excel source review-card normalization report.
7. BP-011 - seafarer Excel field dictionary and reference catalog alignment.
8. `docs/crewportglobal/seafarer_application_mapping/source_card_field_coverage_matrix.md`.
9. `docs/crewportglobal/seafarer_application_mapping/source_card_visibility_matrix.md`.

## 3. Implemented Backend Controls

The backend now includes an explicit approval guard for vacancy application presentation.

The guard is evaluated before an operator can mark a `vacancy_application` queue item as `reviewed`. If required conditions are missing, the API returns HTTP `409` with:

```json
{
  "ok": false,
  "error": "approval_guard_blocked",
  "message": "Candidate presentation is blocked by approval guard",
  "approval_guard": {}
}
```

The guard currently blocks on:

1. Employer company verification not complete.
2. Vacancy not published.
3. Missing critical professional fields: rank, department or availability status.
4. Missing required document readiness summary values.
5. Required readiness values not marked as ready for certificate and STCW status.
6. Missing active `matching_preparation` consent.
7. Missing active `employer_sharing` consent.
8. Any unresolved `correction_requested` source-card review state.
9. Forbidden fields detected in the employer-facing payload probe.

When the guard passes, the audit event for the operator decision includes an `approval_guard` object with approval status, active consents, payload safety result, restricted medical capability boundary and approval audit metadata.

## 4. Additive Consent Event Store

An additive idempotent migration was added:

```text
projects/crewportglobal/app/backend/db/migrations/013_create_seafarer_consent_events.sql
```

The migration creates:

```text
crewportglobal.seafarer_consent_events
```

The table preserves:

1. `consent_id`
2. `seafarer_profile_id`
3. `draft_id`
4. `consent_type`
5. `purpose`
6. `legal_basis`
7. `text_version`
8. `language`
9. `accepted_at`
10. `withdrawn_at`
11. `source_page`
12. `actor_user_id`
13. `actor_type`
14. `metadata`
15. creation and update timestamps

The approved consent types are:

```text
profile_review
matching_preparation
employer_sharing
document_verification
sensitive_medical_processing
reference_contact_verification
```

The migration is additive only. It does not alter existing seafarer profile, vacancy, application, document or access-control tables.

## 5. Consent API Contract

The implementation adds these seafarer consent endpoints:

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/v1/seafarer/consents` | `GET` | Return the consent event model and active consent summary for the current seafarer context. |
| `/api/v1/seafarer/consents` | `POST` | Record a new accepted consent event for an approved consent type. |
| `/api/v1/seafarer/consents/{consent_type}/withdraw` | `PATCH` | Withdraw active consent events of the requested type. |

For the current transitional draft flow, the endpoints support owner access through the authenticated session or the existing draft owner boundary. The event records preserve actor type so later account-only enforcement can distinguish full account owner actions from transitional draft-owner actions.

The draft detail payload now includes:

```text
payload.seafarer_consent_summary
```

This lets operator review see whether required active consents exist without exposing restricted source fields.

## 6. Approval Guard Detail

The guard returns a structured result with:

```text
approval_status
approval_blockers
approval_warnings
required_consents
active_consents
required_source_cards
document_readiness
professional_readiness
employer_payload_probe
restricted_medical_access
approval_audit
```

### 6.1 Blocking Controls

Blocking controls are enforced before employer-facing presentation:

| Blocker code | Condition |
|---|---|
| `company_not_verified` | Employer company status is not verified. |
| `vacancy_not_published` | Vacancy status is not published. |
| `missing_professional_field` | Rank, department or availability status is missing. |
| `missing_document_readiness` | Required readiness summary field is missing. |
| `document_readiness_not_ready` | Certificate or STCW readiness is not ready. |
| `missing_active_consent` | `matching_preparation` or `employer_sharing` consent is absent or withdrawn. |
| `unresolved_source_card_correction` | A required source card still has `correction_requested`. |
| `unsafe_employer_payload` | Employer-facing payload probe contains forbidden sensitive fields. |

### 6.2 Controlled Warning Boundary

Required source cards being reviewed or explicitly waived is not fully blocking in this slice except for unresolved `correction_requested` cards.

The guard emits warnings for required source cards that are not yet in a final reviewed/waived status. This is a deliberate controlled gap because the final strict readiness policy still needs Project Owner approval for which source cards are mandatory for first presentation versus later document verification.

The next readiness slice can promote these warnings into blockers after that policy is approved.

## 7. Restricted Medical Access

General operators still cannot read restricted medical declaration details.

A dedicated endpoint boundary was added:

```text
GET /api/v1/operator/seafarer-medical/{draft_id}
```

The current temporary general operator token receives HTTP `403` with:

```text
restricted_medical_capability_required
```

The response lists required future capabilities but does not return medical details:

```text
seafarer.medical.read_restricted
seafarer.medical.request_correction
seafarer.medical.verify_restricted
```

Denied access is audited through an access event. Medical certificate status and expiry remain ordinary readiness metadata; detailed illness, injury, surgery and sick-off declarations remain restricted.

The positive restricted-medical reviewer workflow is not implemented in this slice. It now has a concrete API/capability boundary and test coverage confirming that general operator access is denied.

## 8. Employer Payload Guard

The employer-facing candidate payload remains minimized.

The approval guard probes the employer payload before approval and rejects presentation if forbidden keys are detected.

Forbidden employer-facing data includes:

1. Raw `document_metadata`.
2. Raw `seafarer_workspace`.
3. Passport, seafarer ID, visa and identity document numbers.
4. Religion.
5. Children, next-of-kin and beneficiary data.
6. Medical declaration details.
7. Injury, surgery and sick-off details.
8. Internal notes and manager authorization fields.
9. Raw upload storage paths or raw uploaded document identifiers.
10. Previous employer reference contact names, phones and emails.
11. Seafarer email and phone in the presented candidate payload.

The `/post-vacancy/` frontend was also tightened so the employer candidate card no longer falls back to rendering a seafarer email address from older payload shapes.

## 9. Page And API Surface Matrix

| Surface | CPG-SEAFARER-018 behavior |
|---|---|
| `POST /api/v1/seafarer/consents` | Records accepted consent event with consent type, purpose, legal basis, text version, language, source page, actor and metadata. |
| `PATCH /api/v1/seafarer/consents/{type}/withdraw` | Withdraws active consent events and updates active consent summary. |
| `GET /api/v1/seafarer/consents` | Returns event model and active consent summary. |
| `GET /api/v1/registration/drafts/{draft_id}?visibility=operator_general` | Requires operator token for non-owner visibility and includes seafarer consent summary. |
| `GET /api/v1/seafarer/workspace?visibility=operator_general` | Requires operator token for non-owner visibility. |
| `PATCH /api/v1/operator/review-queue/{draft_id}/status` | Blocks `vacancy_application` reviewed decision with HTTP `409` until approval guard passes. |
| `GET /api/v1/operator/vacancy-applications/{application_id}` | Returns approval guard details for operator review. |
| `GET /api/v1/operator/seafarer-medical/{draft_id}` | Denies general operator access and audits restricted medical access attempts. |
| `/verify/` | Displays approval guard status, blockers, warnings, consent state and payload safety for vacancy application details. |
| `/post-vacancy/` | Continues to render minimized presented-candidate data and no longer displays seafarer email fallback. |

## 10. Test-To-Control Traceability

| Test | Controls checked |
|---|---|
| `tests/crewportglobal-seafarer-approval-guard.spec.ts` | Missing consent blocks presentation; active consent allows progress; withdrawn `employer_sharing` blocks presentation; unresolved source-card correction blocks presentation; restricted medical endpoint denies general operator; successful approval includes guard audit; employer payload excludes forbidden fields. |
| `tests/crewportglobal-seafarer-visibility-minimization.spec.ts` | CPG-SEAFARER-017 minimization remains intact after adding consent/approval guard logic. |
| `tests/crewportglobal-operator-queue.spec.ts` | Operator queue still renders detail views and receives redacted operator-scoped payloads. |
| `tests/crewportglobal-post-vacancy-workspace.spec.ts` | Employer workspace continues to function and no longer displays seafarer email in presented candidate cards. |
| `tests/crewportglobal-create-profile-prefill.spec.ts` | Create-profile prefill behavior remains compatible with new consent table setup. |
| `npm run test:cpg-api` | Public/API regression passes with migration 013 in the API test database setup. |

## 11. Verification

The implementation was verified on GTC1.

### 11.1 Syntax Checks

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

Embedded frontend scripts were extracted and checked with Node syntax validation for:

```text
projects/crewportglobal/public/post-vacancy/index.html
projects/crewportglobal/public/verify/index.html
```

Result: passed.

### 11.2 Migration Check

```bash
PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql -v ON_ERROR_STOP=1 -f projects/crewportglobal/app/backend/db/migrations/013_create_seafarer_consent_events.sql
```

Result: passed. Existing-object notices are expected on repeat execution because the migration is idempotent.

### 11.3 Focused CPG-SEAFARER-018 Test

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-seafarer-approval-guard.spec.ts
```

Result: 1 passed.

### 11.4 Focused UI Regression

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-seafarer-visibility-minimization.spec.ts tests/crewportglobal-operator-queue.spec.ts tests/crewportglobal-post-vacancy-workspace.spec.ts tests/crewportglobal-create-profile-prefill.spec.ts
```

Result: 8 passed.

### 11.5 API Regression

```bash
npm run test:cpg-api
```

Result: 15 passed.

### 11.6 Additional Source-Card UI Regression

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-seafarer-source-repeated-rows.spec.ts tests/crewportglobal-cabinet-dashboard.spec.ts tests/crewportglobal-seafarer-excel-review-cards.spec.ts
```

Result: 7 passed.

## 12. Remaining Risks And Controlled Gaps

1. The restricted medical positive workflow is not implemented yet. General operator access is denied and audited; a future restricted medical reviewer role still needs account-based capability enforcement.
2. Required source cards that are not reviewed or waived currently generate guard warnings unless they are in `correction_requested`. The next readiness slice should convert approved required-card policy into blocking rules.
3. Owner consent endpoints still support the transitional draft-owner boundary. Future account/session enforcement should make account ownership the only authority for owner consent actions.
4. The approval guard blocks operator presentation from the current review-queue path. Future matching or publication paths must call the same guard or a stricter successor before exposing a candidate.

## 13. Rollback Boundary

The database migration is additive. A safe rollback can disable the new API routes and approval-guard call sites without dropping the consent table.

Existing consent event rows must not be deleted or altered during rollback without Project Owner approval, because they are audit evidence.

Frontend rollback is limited to the `/verify/` approval guard display and the `/post-vacancy/` email-fallback removal. The email-fallback removal should be kept unless a future privacy review approves a different employer contact-sharing rule.

## 14. Next Recommended Step

The next slice should implement the strict readiness summary and full-profile approval guard using:

1. The canonical Excel source-card model.
2. The source-card field coverage matrix.
3. The source-card visibility matrix.
4. The additive consent event table.
5. A Project Owner approved rule for required reviewed/waived source cards.
