# CPG-DEMAND-006 - Read-Only Internal Candidate Search Prototype Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: Follow-up implementation slice after CPG-DEMAND-005
- Version: 1.0
- Date: 2026-05-23
- Status: Implemented and verified on GTC1

## 1. Purpose

This report records the first read-only internal candidate search prototype for future request-offer matching.

The goal is to let an operator inspect catalog-backed candidate fit for a vacancy without creating vacancy applications, changing statuses, publishing candidates, presenting candidates to employers, calculating commercial scores or making employment decisions.

## 2. Scope Implemented

Implemented narrowly:

1. Added an operator-only read endpoint:

```text
GET /api/v1/operator/vacancies/{vacancy_request_id}/candidate-search
```

2. Search uses the CPG-DEMAND-005 demand foundation:

```text
required_rank_value_id
required_rank_label
vessel_type_value_id
vessel_type_label
join_date
demand_requirement_items
```

3. Candidate evaluation uses existing supply fields:

```text
seafarer_profiles.primary_rank
seafarer_profiles.department
seafarer_profiles.availability_status
seafarer_profiles.availability_date
seafarer_profiles.preferred_vessel_types
seafarer_profiles.review_status
seafarer_profiles.document_metadata readiness summary only
seafarer_sea_service_records.vessel_type_value_id / vessel_type_label
```

4. The endpoint returns:

```text
match_level
matched_dimensions
blockers
warnings
dimension_results
side_effects
```

5. The endpoint explicitly reports no runtime side effects:

```text
creates_vacancy_applications=false
changes_statuses=false
employer_visible=false
writes_audit_events=false
```

Not implemented:

1. No matching score.
2. No automatic shortlist.
3. No vacancy application creation.
4. No employer-facing presentation.
5. No employment decision logic.
6. No UI changes.
7. No DB migration.

## 3. Endpoint Contract

### 3.1 Request

```text
GET /api/v1/operator/vacancies/{vacancy_request_id}/candidate-search?limit=25
X-CPG-Operator-Token: <operator-token>
```

`limit` is optional and bounded to:

```text
1..100
```

### 3.2 Response Shape

```json
{
  "ok": true,
  "vacancy_request_id": "...",
  "access_model": "temporary_operator_token",
  "search_model": "cpg-demand-006-read-only-exact-foundation",
  "search_scope": "operator_internal_only",
  "side_effects": {
    "creates_vacancy_applications": false,
    "changes_statuses": false,
    "employer_visible": false,
    "writes_audit_events": false
  },
  "demand": {},
  "demand_readiness": {},
  "requirement_items": [],
  "candidates": [],
  "count": 0,
  "total_considered": 0,
  "generated_at": "..."
}
```

## 4. Matching Dimensions

| Dimension | Current matching rule | Result key |
|---|---|---|
| Rank | Exact match between vacancy `required_rank_value_id` and candidate `primary_rank` mapped to `seafarer_positions` | `dimension_results.rank` |
| Vessel type | Candidate preferred vessel type text or sea-service vessel type matches demand vessel type | `dimension_results.vessel_type` |
| Availability | `available_now` is matched; `available_later` is matched only when candidate date is on or before vacancy join date | `dimension_results.availability` |

The model intentionally does not produce a numeric score in this slice.

## 5. Match Levels

| Match level | Meaning |
|---|---|
| `match_ready` | Rank, vessel type and availability are matched, and no hard candidate blocker exists. |
| `review_possible` | No hard blocker exists, but operator review is still needed because warnings or incomplete soft data remain. |
| `blocked` | At least one hard blocker exists. |

## 6. Current Blocker Codes

Demand readiness blockers:

| Code | Meaning |
|---|---|
| `demand_rank_not_catalog_linked` | Vacancy rank is not linked to published `seafarer_positions`. |
| `demand_vessel_type_not_catalog_linked` | Vacancy vessel type is not linked to published `vessel_types`. |

Candidate blockers:

| Code | Meaning |
|---|---|
| `candidate_rank_not_catalog_linked` | Candidate rank cannot be mapped to `seafarer_positions`. |
| `rank_mismatch` | Candidate rank catalog value does not match demand rank catalog value. |
| `vessel_type_mismatch` | Candidate has no matching preferred or sea-service vessel type. |
| `candidate_available_after_join_date` | Candidate availability date is after the vacancy join date. |
| `availability_unknown` | Candidate availability status is unknown. |
| `candidate_not_approved` | Candidate profile is not approved for matching review. |

Warnings:

| Code | Meaning |
|---|---|
| `company_not_verified` | Employer company is not verified; results must remain internal. |
| `vacancy_not_published` | Vacancy is not published; results must remain internal. |
| `availability_date_missing` | Candidate is available later but date comparison is not possible. |
| `document_readiness_not_ready` | Readiness status needs review before presentation. |
| `candidate_already_has_application` | Candidate already has an application for this vacancy. |

## 7. Data Minimization

The candidate search endpoint is operator-only and internal, but it still avoids employer-facing and sensitive payload leakage.

Returned candidate fields include:

```text
candidate_user_id
display_name
primary_rank
primary_rank_value_id
primary_rank_value_code
department
availability_status
availability_date
country_code
review_status
document_summary
match_level
matched_dimensions
blockers
warnings
dimension_results
side_effects
```

The endpoint does not return:

```text
contact_email
contact_phone
seafarer_email
document_metadata
seafarer_workspace
medical declarations
family details
identity document numbers
raw uploaded document IDs
```

## 8. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Added read-only operator candidate-search helpers and route. |
| `tests/crewportglobal-registration-api.spec.ts` | Added focused API test for exact match, mismatch blockers, minimization and no side effects. |
| `docs/crewportglobal/169_cpg_demand_006_read_only_candidate_search_report.md` | This implementation report. |
| `docs/crewportglobal/00_documentation_register.md` | Added document 169 to the register. |

## 9. Verification

Syntax:

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result:

```text
passed
```

Focused endpoint test:

```bash
npx playwright test -c playwright.crewportglobal.api.config.ts tests/crewportglobal-registration-api.spec.ts -g "operator candidate search returns read-only exact matches and blockers"
```

Result:

```text
1 passed
```

The focused test confirms:

1. Operator candidate search requires the operator API surface.
2. Exact rank/vessel/availability candidate returns `match_ready`.
3. Mismatched candidate returns `blocked` with `rank_mismatch` and `vessel_type_mismatch`.
4. Search response does not contain candidate e-mail, contact phone, raw `document_metadata` or forbidden contact keys.
5. Search does not create vacancy applications or employer-facing presented candidates.

Full API regression:

```bash
npx playwright test -c playwright.crewportglobal.api.config.ts tests/crewportglobal-registration-api.spec.ts
```

Result:

```text
16 passed
```

## 10. Remaining Gaps

1. No UI is connected to the candidate search endpoint yet.
2. COC, training, endorsement and document-validity threshold matching are not active yet.
3. Vessel type matching uses preferred-vessel text and sea-service vessel type, but no dedicated supply-side preferred vessel catalog relation exists yet.
4. Rank matching depends on exact published catalog text mapping for `seafarer_profiles.primary_rank`.
5. The endpoint intentionally returns explanations, not scores or decisions.

## 11. Recommended Next Step

The next practical slice should be:

```text
CPG-DEMAND-007 - Operator candidate search UI and extended requirement dimensions
```

Recommended scope:

1. Add an operator-only search panel on `/verify/` for vacancy request details.
2. Keep search read-only.
3. Add COC/training/document-validity dimensions only after demand capture exists.
4. Preserve approval guard before employer presentation.
