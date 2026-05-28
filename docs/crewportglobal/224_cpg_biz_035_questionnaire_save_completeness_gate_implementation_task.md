# CPG-BIZ-035 - Questionnaire Save Completeness Gate Implementation Task

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation task for Project Owner approval
- Source document: CPG-BIZ-034 analysis, document 223; CPG-BIZ-036 mandatory-field synchronization, document 225
- Version: 1.3
- Date: 2026-05-28
- Status: Approved by Project Owner; Phase 0 and Phase 1 implemented, remaining phases pending

## 1. Purpose

This task authorizes the next controlled implementation slice for the questionnaire save / completeness / submit standard.

The implementation must ensure that seafarer, employer, vessel and crew-request questionnaires can autosave draft field values, expose one visible `Save / confirm data` action, run completeness checks from a shared mandatory-field schema and submit to operator review only when required numbered sections, fields and documents are complete.

## 2. Business Reason

The current forms already collect substantial data, but the current save behavior is not consistently separated from review submission.

The required business rule is:

```text
Field changes may autosave draft data.
One Save / confirm data button runs completeness checks.
Completeness check explains missing numbered sections.
Submit to operator review becomes active only after the required package is complete.
```

This reduces manual operator work, prevents avoidable incomplete team tasks and prepares the platform for future AI-assisted completeness review.

## 3. Implementation Scope

### 3.0 Mandatory-field schema

Before changing UI behavior, define a canonical mandatory-field schema based on document 225.

The schema must define:

```text
field_code
canonical_key
stream
label
required_for_save
required_for_submit
required_for_matching
conditional_required
mirrored_required_key
visibility_class
target_url
```

The same schema must drive:

1. backend completeness checks;
2. frontend required markers;
3. owner missing-section tasks;
4. operator correction targets;
5. future AI validation prompts.

Required-field logic must not be duplicated separately in `/create-profile/` and `/post-vacancy/`.

### 3.1 Backend

Implement or extend backend helpers so the system can compute a single completeness result for:

1. seafarer profile;
2. employer / company context;
3. vessel context where current data exists;
4. crew request / vacancy requirement.

The completeness result must include:

```text
object_type
object_id
overall_status
can_save
can_submit_to_operator
missing_items[]
required_documents[]
document_checks[]
unresolved_corrections[]
target_urls
```

### 3.2 API

Add or expose a controlled API contract for:

```text
GET /api/v1/registration/drafts/{draft_id}/completeness
POST /api/v1/registration/drafts/{draft_id}/submit-review
```

If the existing route structure makes a different endpoint safer, the implementation report must explain the final endpoint choice.

`submit-review` must fail with a clear response when completeness does not pass.

Suggested blocker code:

```text
questionnaire_incomplete
```

Suggested response fields:

```text
missing_items
required_documents
unresolved_corrections
side_effects.created_operator_task = false
side_effects.changed_review_status = false
```

### 3.3 Frontend

Update the existing forms without changing the product flow beyond this task:

| Page | Required change |
|---|---|
| `/create-profile/` | Keep `Save` active, add/enable `Submit to operator review` only when seafarer completeness passes, show numbered `S-*` missing items. |
| `/post-vacancy/` | Keep `Save` active, add/enable `Submit to operator review` only when `E-*`, `V-*` and `R-*` checks pass, show numbered missing items. |
| `/cabinet/` | Owner correction/completeness tasks must show numbered missing sections and link to the exact form section. |
| `/verify/` and `/team/` | Active review tasks must appear only after submit-review succeeds. |

### 3.4 Numbered Field Configuration

Create a stable configuration or helper for these prefixes:

| Prefix | Object stream |
|---|---|
| `S` | Seafarer supply |
| `E` | Employer / shipowner demand account |
| `V` | Vessel context |
| `R` | Crew request / vacancy requirement |

The implementation should start with the sections defined in document 223 and may keep optional/future fields as non-blocking until Project Owner approves stricter requirements.

### 3.5 Single visible save / confirm action

Each questionnaire should have one visible primary save action:

```text
Save / confirm data
```

Field-level autosave may run in the background. Section-level save buttons may remain only as a temporary compatibility bridge if implementation risk requires it, but the target user model is one visible save/confirm action per questionnaire, followed by the completeness result.

### 3.6 Synchronized mandatory fields

Mandatory fields must be synchronized by canonical key:

1. if demand requires a field for matching, supply must require the corresponding field before matching-ready status;
2. if supply requires a field for matching-ready status, demand/vessel/request must require the corresponding field where that dimension is used;
3. if a structured demand field does not exist yet, the implementation must either add it as part of the approved scope or keep that dimension out of hard matching until the field exists.

## 4. Required Behavioral Rules

1. Field-level autosave must not create an active operator-review task.
2. Pressing `Save / confirm data` must run completeness checks and keep the object owner-side unless the user later activates `Submit to operator review`.
3. Saving a complete form must not automatically submit it unless the user activates `Submit to operator review`.
4. Submit must be blocked if required numbered fields are missing.
5. Submit must be blocked if required documents are missing, unsafe, unreadable or not clean-scanned where applicable.
6. Submit must be blocked if unresolved owner correction tasks remain.
7. The missing-data task must point to numbered sections, not generic text.
8. Existing data-minimization and restricted-field rules must remain active.
9. No automatic matching score, publication or employment decision is introduced.

## 5. DB And Migration Boundary

Prefer implementation without a new migration by using existing draft/status metadata where safe.

If a DB change is required:

1. it must be additive;
2. it must be idempotent;
3. it must not rewrite old migrations;
4. the SQL patch must be shown for review before execution;
5. rollback boundary must be documented.

## 6. Tests To Add Or Update

Focused tests must prove:

| Test area | Required assertion |
|---|---|
| Mandatory schema parity | Canonical matching fields required on demand have corresponding required supply fields, and vice versa where applicable. |
| Autosave safety | Field-level autosave stores draft data but does not create active operator-review tasks. |
| Incomplete seafarer save | Draft is saved, missing `S-*` items are returned, no active operator review task appears. |
| Complete seafarer submit | `Submit to operator review` succeeds and creates the expected review task. |
| Incomplete employer/vessel/request save | Draft is saved, missing `E/V/R-*` items are returned, no active team review task appears. |
| Complete demand submit | Employer/vessel/request review task appears for the correct group. |
| Document gate | Missing or unsafe required document blocks submit with a numbered document point. |
| Correction state | Unresolved corrections block submit until corrected and saved. |
| Existing workflows | Current operator queue, cabinet correction and demand-side correction handoff tests still pass. |

## 7. Non-Scope

This task does not authorize:

1. automatic matching score implementation;
2. employer-facing candidate publication;
3. employment decision automation;
4. private Excel changes;
5. public marketing-page redesign;
6. billing implementation;
7. broad refactoring outside questionnaire save/check/submit flow.

## 8. Acceptance Criteria

The task is complete when:

1. all four streams have numbered completeness checks;
2. canonical mandatory-field schema exists and drives backend/frontend checks;
3. matching-critical mandatory fields are synchronized between supply and demand;
4. field-level autosave does not create active operator-review tasks;
5. one visible `Save / confirm data` action runs completeness checks for the questionnaire;
6. Save and Submit are separated in backend behavior;
7. incomplete forms remain owner-side and do not create active operator-review tasks;
8. complete forms can be submitted to operator review by explicit user action;
9. missing items are shown by numbered section/field/document codes;
10. owner cabinet tasks link to the exact missing section where possible;
11. focused tests pass;
12. generated Playwright/test artifacts are clean;
13. final Russian implementation report lists files changed, tests and next stage.

## 9. Next Stage After Approval

Project Owner approval was received. Phase 0 has been implemented and documented in:

```text
docs/crewportglobal/226_cpg_biz_037_canonical_mandatory_field_schema_phase0_report.md
```

Phase 1 has been implemented and documented in:

```text
docs/crewportglobal/227_cpg_biz_038_backend_completeness_analyzer_api_contract_report.md
```

Remaining implementation phases:

```text
Phase 2 - /create-profile/ autosave plus one Save / confirm action
Phase 3 - /post-vacancy/ autosave plus one Save / confirm action
Phase 4 - Owner cabinet numbered missing-section tasks
Phase 5 - Focused regression tests and final report
```
