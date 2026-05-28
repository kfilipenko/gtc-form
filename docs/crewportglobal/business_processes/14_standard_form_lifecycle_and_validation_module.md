# BP-014 - Standard Form Lifecycle And Validation Module

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Documentation block: Business processes and operating model
- Document type: Business-process standard and implementation control
- Source task: Project Owner approval after CPG-BIZ-040 multi-role upload diagnostics
- Version: 1.1
- Date: 2026-05-28
- Status: Approved standard for staged implementation

## 1. Purpose

This document defines the standard form lifecycle module for CrewPortGlobal.

The standard exists because the portal now has several data-intake streams that must behave consistently:

1. seafarer supply forms;
2. employer / shipowner account forms;
3. vessel context forms;
4. crew request / vacancy requirement forms;
5. document upload and correction forms linked to those streams.

The purpose is to avoid creating separate ad hoc rules for every page. Each current and future form must connect to the same lifecycle model for:

1. draft context;
2. role context;
3. field saving;
4. completeness checks;
5. protected document upload;
6. submit-review gating;
7. owner correction tasks;
8. team task computation;
9. audit evidence.

## 2. Operating Principle

A form is not the authority for workflow rules.

The authority is the standard lifecycle module:

```text
form configuration
+ authenticated account
+ requested role context
+ draft/object state
+ canonical mandatory-field schema
+ protected-upload policy
+ current corrections
= save, completeness, submit and task behavior
```

The page may render controls and messages, but the backend lifecycle contract remains the source of truth.

## 3. Covered Information Streams

| Stream | Object | Prefix | Main owner | Main team group | Final readiness decision |
|---|---|---|---|---|---|
| Seafarer supply | `seafarer_profile` | `S-*` | Seafarer account owner | `verification_team` | Profile ready for matching preparation |
| Employer / shipowner demand account | `employer_company` / company draft | `E-*` | Employer representative | `verification_team` | Employer account ready for demand operations |
| Vessel context | `vessel` / vessel section | `V-*` | Employer representative | `verification_team` or vessel reviewer | Vessel context ready for crew request use |
| Crew request / vacancy requirement | `vacancy_request` / demand draft | `R-*` | Employer representative | `review_team` | Crew request ready for matching |
| Document evidence | `uploaded_documents` | `*.D*` | Uploading owner | Verification/review group | Evidence accepted or correction required |

The streams may appear on one page, but they must remain distinguishable in validation and task computation.

## 4. Standard Lifecycle States

Every form object must be interpreted through a small set of lifecycle states.

| State | Meaning | User action | Team task behavior |
|---|---|---|---|
| `draft_editable` | Owner can edit and save data. | Fields autosave; `Save / confirm data` is available. | No operator review task is created. |
| `draft_incomplete` | Required numbered fields/documents are missing or invalid. | Missing items are shown with links to exact sections. | Owner task may explain what to complete; team review is not executable. |
| `ready_to_submit` | Required fields/documents pass completeness checks. | `Submit to operator review` may become active. | Team task is created only after explicit submit. |
| `pending_human_review` | Owner submitted object for review. | Owner waits or responds to correction. | Responsible team sees computed review task. |
| `needs_correction` | Team requested owner correction. | Owner corrects numbered items and resubmits. | Active team task disappears; owner correction task appears. |
| `reviewed_ready` | Team accepted the object for the next process stage. | Owner may continue allowed workflow. | Next computed task appears for the next responsible group. |
| `blocked_control_record` | Object is not executable but remains visible for control reason. | No primary user operation unless a correction route exists. | Task list may show reason, not a false executable action. |

## 5. Backend Module Contract

Every lifecycle-enabled form must use one backend contract shape.

### 5.1 Draft context

Backend must resolve:

| Input | Requirement |
|---|---|
| `draft_id` | Identifies the draft or object being edited. |
| `role` | Explicit role context such as `seafarer`, `employer`, `shipowner` or `crewing_manager`. |
| `form_type` | Explicit form type such as `seafarer`, `employer`, `vessel` or `crew_request`. |
| authenticated account | Determines which roles and objects the user can access. |
| assignment context | Determines whether the user owns, reviews or controls the object. |

If an account has multiple roles, the requested role context must be used when it is valid for that account. The system must not silently select the first role and apply it to an unrelated form.

### 5.2 Save

Save must:

1. persist the current draft data;
2. preserve user edits during reload;
3. not create operator tasks by itself;
4. not publish data;
5. not make employment or matching decisions;
6. return the updated draft and safe status.

The standard visible user action is:

```text
Save / confirm data
```

Background autosave may preserve field edits, but the visible action must still run completeness confirmation.

### 5.3 Completeness

Completeness must:

1. read the canonical mandatory-field schema;
2. evaluate only the active stream(s);
3. return numbered missing items;
4. include target URLs or target anchors;
5. include safe document status;
6. include unresolved correction blockers;
7. return `can_submit_to_operator`;
8. avoid side effects.

The response must not:

1. create operator tasks;
2. change review status;
3. change publication status;
4. expose protected file paths;
5. expose restricted medical/family/contact fields outside approved visibility scope.

### 5.4 Submit to operator review

Submit must:

1. re-run completeness on the backend;
2. fail when missing items or unresolved corrections remain;
3. change workflow state only when the gate passes;
4. write audit evidence;
5. create or expose the next computed team task according to the process state.

Submit must fail with a precise reason such as:

```text
questionnaire_incomplete
unresolved_corrections
required_document_missing
required_document_scan_not_clean
role_context_mismatch
```

## 6. Frontend Module Contract

Each form page must connect to the same frontend behavior.

| Function | Standard behavior |
|---|---|
| Load draft | Read with explicit `role` and `form_type` context. |
| Autosave | Preserve field edits without creating review tasks. |
| Save / confirm | Persist current data and run backend completeness. |
| Missing-item panel | Show numbered missing items such as `S-*`, `E-*`, `V-*`, `R-*`. |
| Missing-item click | Scroll/focus the exact field or section requiring completion. |
| Highlighting | Mark required incomplete fields/sections with consistent visual state. |
| Submit-review button | Hidden or disabled until backend `can_submit_to_operator = true`. |
| Upload panel | Show allowed formats and 10 MB file limit before upload. |
| Upload failure | Show precise failure reason when available. |
| Reload safety | After reload, saved and autosaved data must still be present. |

The frontend must not infer final readiness independently from visible input values when the backend analyzer is available.

## 7. Protected Upload Standard

Every document upload panel must use the same policy.

| Rule | Requirement |
|---|---|
| Allowed formats | PDF, JPG, PNG, WEBP unless a stricter form rule is approved. |
| Single-file limit | 10 MB at frontend, backend and runtime layers. |
| Runtime alignment | nginx/PHP request limits must be higher than or equal to the application rule. |
| Role context | Upload must match the valid role/form context for the draft. |
| Storage | Files must remain in protected server storage, not public paths or Git. |
| Scan | Clean malware scan is required before manual review. |
| Replacement | Replacement creates a new document record and preserves audit history. |
| Error message | User sees the exact known reason, not only generic failure. |

The multi-role account case is a mandatory regression scenario: an account with both employer-side and seafarer-side roles must still be able to save and upload documents in the correct form context.

## 8. Canonical Numbering Standard

Every required item must have a stable code.

| Prefix | Stream | Example |
|---|---|---|
| `S-*` | Seafarer supply | `S-1.4: Primary rank` |
| `E-*` | Employer/company demand account | `E-1.1: Company name` |
| `V-*` | Vessel context | `V-2.1: Vessel type` |
| `R-*` | Crew request / vacancy requirement | `R-1.1: Requested rank` |
| `*.D*` | Required document evidence | `E-4.D1: Company registration document` |

The numbering must be used consistently in:

1. backend schema;
2. completeness API;
3. frontend missing-item panels;
4. field highlighting;
5. owner correction tasks;
6. team review guidance;
7. AI validation prompts.

## 9. Task Computation Link

The form lifecycle is connected to computed tasks.

| Lifecycle result | Computed task effect |
|---|---|
| Missing owner data | Owner sees missing-section task; team task is not executable. |
| Complete but not submitted | No review task until owner explicitly submits. |
| Submitted for review | Responsible group or historical executor sees review task. |
| Needs correction | Team task disappears; owner correction task appears. |
| Owner resubmits correction | Owner task disappears; review task is recomputed. |
| Reviewed ready | Next process-stage task appears for the correct group. |

This preserves the approved rule:

```text
previous stage result + current object state + role/permission + assignment relationship = visible next task
```

## 10. Module Implementation Shape

The standard should be implemented as reusable modules, not copied page-by-page.

Recommended backend modules:

| Module | Responsibility |
|---|---|
| `questionnaire_schema.php` | Canonical required-field schema and stream definitions. |
| `questionnaire_completeness.php` | Completeness analyzer and document/correction checks. |
| `registration_draft_context.php` or equivalent helper | Role-aware draft/form context resolution. |
| `document_uploads.php` | Protected upload policy and storage boundary. |
| future submit-review helper | Gate state transition and audit event recording. |

Recommended frontend modules:

| Module | Responsibility |
|---|---|
| `crewportglobal-registration-drafts.js` | Draft get/patch/completeness API client with explicit role support. |
| future `crewportglobal-form-lifecycle.js` | Autosave, Save/confirm, missing-item rendering and target navigation. |
| future `crewportglobal-protected-upload.js` | Shared upload validation, status rendering and error messages. |
| page-specific adapter | Field mapping between HTML controls and canonical field codes. |

The page-specific adapter must be small: it maps DOM fields to canonical codes and leaves the lifecycle rules to the shared module.

## 11. Current Adoption Baseline

| Page / flow | Current status | Next standardization action |
|---|---|---|
| `/create-profile/` | Phase B adopted: autosave, `Save / confirm data`, `S-*` missing items, field highlight, role-aware seafarer context and protected upload diagnostics exist; missing-item navigation/highlighting and autosave controller now use the shared frontend lifecycle helper. | Keep behavior covered by create-profile regression and reuse the same helper in later forms. |
| `/post-vacancy/` | Partially adopted: employer-side upload diagnostics and role-aware draft reads exist; full `E/V/R` Save/completeness UI is still next. | Apply the same one-button completeness gate for employer, vessel and crew request streams. |
| `/cabinet/` correction tasks | Partially adopted: correction tasks and source-card links exist. | Use the same missing-item numbering and correction route contract. |
| `/verify/` review workspace | Partially adopted: computed tasks and review outcomes exist. | Consume lifecycle state labels from a standard task/action contract. |
| `/team/` task lists | Partially adopted: task title, stage and visibility condition exist. | Continue aligning task state with lifecycle result and object stream. |

## 12. Implementation Sequence

Recommended sequence:

| Phase | Scope | Output |
|---|---|---|
| Phase A | Document this standard and register it. | BP-014 and project report. |
| Phase B | Extract frontend lifecycle helper without changing user-visible behavior. | Completed for `/create-profile/`: shared module and regression tests. |
| Phase C | Apply full `Save / confirm data` completeness gate to `/post-vacancy/`. | `E/V/R` missing items, highlights and submit boundary. |
| Phase D | Normalize protected upload UI through a shared upload helper. | Same upload behavior on all forms. |
| Phase E | Add submit-review endpoint gated by backend completeness. | Controlled state transition and team task creation. |
| Phase F | Connect owner correction tasks to the same numbered missing-item standard. | Consistent correction and resubmission flow. |

## 13. Prohibited Shortcuts

Implementation must not:

1. add page-local validation rules that contradict the canonical schema;
2. submit a form to operator review before backend completeness passes;
3. create operator tasks from autosave alone;
4. choose an arbitrary user role when explicit form role context is required;
5. expose contact, restricted medical, family, protected storage or forbidden employer-facing fields outside approved scope;
6. treat uploaded documents as accepted until scan and review requirements are satisfied;
7. make automatic employment decisions or final candidate approval.

## 14. Acceptance Criteria

The standard is correctly adopted for a form when:

1. the form loads with explicit role and form-type context;
2. field edits survive reload;
3. `Save / confirm data` persists data and returns completeness;
4. missing items are numbered and clickable;
5. incomplete fields are visually marked;
6. protected upload rules are visible before upload;
7. upload errors are specific;
8. submit-review is disabled until backend completeness passes;
9. submit-review writes audit and computes the next task only after the gate passes;
10. Playwright/API tests cover save, reload, completeness, upload and role-context behavior.

## 15. Next Stage

The Phase B extraction is complete for `/create-profile/`.

The next implementation stage should apply the standard to the employer-side demand form:

```text
CPG-BIZ-043 - Apply standard Save/completeness lifecycle to /post-vacancy/
```

That phase should connect `/post-vacancy/` to the shared lifecycle helper and backend completeness so employer/company, vessel and crew-request streams show `E-*`, `V-*` and `R-*` missing items before any operator-review submission is possible.
