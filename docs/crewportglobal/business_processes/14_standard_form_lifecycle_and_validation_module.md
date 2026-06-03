# BP-014 - Standard Form Lifecycle And Validation Module

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Documentation block: Business processes and operating model
- Document type: Business-process standard and implementation control
- Source task: Project Owner approval after CPG-BIZ-040 multi-role upload diagnostics
- Version: 2.5
- Date: 2026-06-01
- Status: Approved standard for staged implementation

## 1. Purpose

This document defines the standard form lifecycle module for CrewPortGlobal.

The standard exists because the portal now has several data-intake streams that must behave consistently:

1. seafarer supply forms;
2. employer / shipowner account forms;
3. vessel context forms;
4. crew request / vacancy requirement forms;
5. document upload and correction forms linked to those streams.

The purpose is to avoid creating separate ad hoc rules for every page. The standard also exists to make supply and demand data comparable for automated request-offer matching.

Forms must not collect data only for local display. When a field can affect crew matching, it must be structured, synchronized with the opposite side where applicable and preserved in a form suitable for automated comparison.

Each current and future form must connect to the same lifecycle model for:

1. draft context;
2. role context;
3. field saving;
4. completeness checks;
5. protected document upload;
6. submit-review gating;
7. owner correction tasks;
8. team task computation;
9. audit evidence;
10. document-first completion when uploaded evidence can later prefill form fields.

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

### 2.1 Matching-first data principle

The business goal of this standard is:

```text
shipowner demand + vessel context + crew request requirements
matched against
verified seafarer supply data
```

For this reason, form lifecycle work must preserve these rules:

1. matching-critical fields must use structured values when a catalog exists;
2. demand-side and supply-side fields must use the same catalog or a documented compatibility mapping;
3. values intended for comparison must be stored as stable codes, IDs, normalized dates, numbers or arrays of codes, not uncontrolled labels;
4. a hard blocker must not be introduced unless both sides have comparable structured data;
5. if only one side has a required matching field, the missing opposite-side field or requiredness gap must be documented before the field is used for automated matching;
6. evidence and compliance fields may remain outside matching, but their non-matching purpose must be clear.

### 2.2 Pre-Contract Terms For Matching And Contract Drafting

Forms that participate in crew formation must also collect contract-critical conditions early enough for transparent matching and later contract drafting.

Employer / vacancy forms should support structured fields for:

1. joining place;
2. joining travel responsibility;
3. expected contract duration;
4. disembarkation / repatriation responsibility;
5. return destination rule;
6. replacement / early termination rule;
7. monthly service evidence expectation;
8. `to_be_agreed` where the condition is intentionally not finalized yet.

Seafarer profile forms should support structured fields for:

1. preferred joining / travel conditions;
2. return destination;
3. preferred return arrangement;
4. self-arranged or employer-arranged travel preference;
5. `to_be_agreed` where the preference can be negotiated later.

If a field affects contract formation or later billing/service evidence, it should not be collected only as free text. It should be structured enough for:

1. matching;
2. vacancy transparency;
3. candidate acceptance review;
4. contract draft generation;
5. voyage support tasks;
6. billing and audit evidence.

The future contract draft form must use the same standard lifecycle model:

```text
draft_editable
draft_incomplete
ready_to_submit / ready_for_party_review
pending_human_review
needs_correction
reviewed_ready / ready_for_signature
blocked_control_record
```

The form may generate a document only from stored structured values and approved catalog selections. Free-text contract clauses require human review and must not bypass the completeness gate.

The contract form must use a versioned master-agreement control:

1. fixed contract clauses are immutable in the operational UI;
2. approved variable catalogs define the selectable commercial, voyage, wage, joining, return and termination terms;
3. ordinary generated contract instances record `master_agreement_version`, `catalog_version`, selected terms, source records and party confirmations;
4. new fixed wording, new legally material catalog values or exceptions require a new controlled review path;
5. AI agents may extract or suggest values from documents, but may not create or rewrite legal clauses.

### 2.3 Formal Document Reference Rule

When a page, form or generated document refers to a condition governed by a formal document, it must link to the controlling document and section instead of rewriting the condition in multiple places.

Required UI pattern:

```text
Regulated by: {formal document name}, {section / clause}.
```

This rule applies to contract, consent, no-fee, complaint, privacy, billing, employment, wage, travel, repatriation and data-sharing conditions.

## 3. Covered Information Streams

| Stream | Object | Prefix | Main owner | Main team group | Final readiness decision |
|---|---|---|---|---|---|
| Seafarer supply | `seafarer_profile` | `S-*` | Seafarer account owner | `verification_team` | Profile ready for matching preparation |
| Employer / shipowner demand account | `employer_company` / company draft | `E-*` | Employer representative | `verification_team` | Employer account ready for demand operations |
| Vessel context | `vessel` / vessel section | `V-*` | Employer representative | `verification_team` or vessel reviewer | Vessel context ready for crew request use |
| Crew request / vacancy requirement | `vacancy_request` / demand draft | `R-*` | Employer representative | `review_team` | Crew request ready for matching |
| Document evidence | `uploaded_documents` | `*.D*` | Uploading owner | Verification/review group | Evidence accepted or correction required |

The streams may appear on one page, but they must remain distinguishable in validation and task computation.

They must also remain mappable for matching. A demand-side field such as requested rank, vessel type, joining date, salary range, certificate requirement or operating area must have a known seafarer-side counterpart before it is used as a blocker or score input.

Vessel context must remain distinct from employer authority. For example:

```text
company country -> E-2.2 / employer company context
vessel flag country -> V-2.2 / vessel context
vessel particulars document -> V-4.D1 / vessel evidence
```

This separation lets the system later explain whether a blocker belongs to the employer account, the vessel, the crew request or the candidate supply profile.

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
| Document-first placement | For evidence-heavy forms, place protected upload after the minimum identity/context block and before long manual sections. |
| Document checklist | When document types are finite, show a compact human-readable row list with one visible row-level upload/replace button, review state and replacement state instead of a visible technical dropdown. |
| Upload failure | Show precise failure reason when available. |
| Upload success | Show the uploaded filename and refresh the protected-document list so the user can see the accepted file even after the file input is cleared. |
| Reload safety | After reload, saved and autosaved data must still be present. |
| Backend-first reload | After successful backend save, backend draft is the source of truth; browser local snapshot may restore only newer unsaved edits. |
| List-valued reference field | Use structured multi-select controls for list-valued catalog fields instead of free text, with explicit neutral option when matching allows it. |
| Finite single-select reference field | Use a true catalog-backed `select`, not `datalist`, for finite matching/control values such as civil status, gender, relation and vessel type. |
| Country-code reference field | Use the approved `countries` catalog through a true `select`; show country names but store comparable ISO alpha-2 codes. |
| Repeated country fields | Provide an explicit copy action such as `Same as nationality` when the user is likely to repeat the same country across several fields. |
| Demand-side repeated country fields | Provide explicit copy actions such as `Same as company country` for vessel flag country when it reduces repeated input but keep the destination field independently editable. |
| Repeated address fields | Provide an explicit `Same address` copy option when a form asks the user to enter substantially the same address more than once. |
| English/Latin-only data entry | User-entered operational form text must use English and Latin characters. UI localization may be machine-translated, but form data used for international crew matching must remain English/Latin. |

### 6.1 Official-language and form-data rule

The official authoritative language of the platform is English.

Machine localization may translate page labels and user guidance, but it must not translate submitted form data. Crew matching, document review, employer presentation and audit evidence depend on stable international text and catalog values.

Therefore every lifecycle-enabled form must enforce:

1. free-text operational fields are entered in English and Latin characters;
2. catalog-backed values are stored as approved codes or English catalog labels;
3. non-Latin letters are blocked before save, autosave, section save or submit-review;
4. localized UI text must not change the stored form value;
5. exceptions, if ever needed for legal names or document originals, must be explicitly documented and must not enter matching fields without transliteration or normalized counterpart data.
| Visual contrast | Inputs, textareas, upload lists and document metadata must remain readable in dark and light themes. |
| Matching-critical field | Use the shared catalog/normalization expected by the opposite side, and document any temporary compatibility mapping. |

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

When the form has a finite set of accepted document types, the user-facing control must be a document checklist. The checklist must show:

1. not uploaded;
2. uploaded and scanned;
3. pending team review;
4. verified by operator/agent;
5. replacement required with review reason when available.

The technical `document_type` value may remain hidden for API submission, but users should use compact document rows, not decode internal document-type values.

Each document row must keep the upload workflow short:

1. document name is always visible;
2. short description is available on hover / tooltip only;
3. uploaded filename and status appear under the document name;
4. one visible upload/replace button appears in the same row and opens the browser file picker;
5. selecting a file must not rerender the row before upload, because replacing the file input clears the selected browser file.

The file input may remain hidden as a technical adapter, but it must not be presented as a separate user decision. After the user chooses a file through the row button, upload starts immediately and the row refreshes to show the accepted filename or a precise validation error.

### 7.1 Document-first profile completion

For seafarer supply, the standard operating order is:

```text
minimum identity/context fields
-> protected document upload
-> manual completion of fields not available from documents
-> Save / confirm data
-> submit to operator review only after backend completeness passes
```

This order prepares the portal for future AI/OCR assistance without changing the current controlled upload boundary.

Future AI/OCR extraction must:

1. classify the uploaded document type;
2. extract candidate values;
3. map values to canonical numbered fields;
4. mark confidence and ambiguity;
5. require owner confirmation before accepted values are written into form data;
6. leave non-extracted values as numbered missing items;
7. preserve human review and approval guards.

Future AI/OCR extraction must not make employment decisions, approve candidate presentation, or bypass operator review.

## 8. Canonical Numbering Standard

Every required item must have a stable code.

The code must support both user correction and future matching diagnostics. When a candidate is blocked or scored lower, the system should be able to point back to the numbered form item that produced the condition.

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
| `crewportglobal-form-lifecycle.js` | Autosave, Save/confirm, missing-item rendering and target navigation. |
| `crewportglobal-protected-upload.js` | Shared upload validation, status rendering, uploaded document list and document-correction task rendering. |
| page-specific adapter | Field mapping between HTML controls and canonical field codes. |

The page-specific adapter must be small: it maps DOM fields to canonical codes and leaves the lifecycle rules to the shared module.

## 11. Current Adoption Baseline

| Page / flow | Current status | Next standardization action |
|---|---|---|
| `/create-profile/` | Phase E.5 adopted: autosave, `Save / confirm data`, `S-*` missing items, field highlight, role-aware seafarer context, document-first protected upload placement, human-readable one-button document checklist, missing-item navigation/highlighting, protected upload helper, backend-first reload after save, explicit checkbox multi-choice for preferred vessel types, finite catalog single-selects, same-address copy and dark-theme contrast corrections. | Keep behavior covered by create-profile regression and apply the same catalog/select, multi-choice, same-address, one-button document-checklist and document-first upload rules to future form adapters. |
| `/post-vacancy/` | Phase D adopted: employer-side role-aware draft reads, `Save / confirm data`, backend `E/V/R` completeness, missing-item panel, field highlighting, exact field navigation and protected upload use shared lifecycle/upload helpers. | Keep behavior covered by post-vacancy regression and connect future submit-review gate only after backend completeness passes. |
| `/cabinet/` correction tasks | Partially adopted: correction tasks and source-card links exist. | Use the same missing-item numbering and correction route contract. |
| `/verify/` review workspace | Partially adopted: computed tasks and review outcomes exist. | Consume lifecycle state labels from a standard task/action contract. |
| `/team/` task lists | Partially adopted: task title, stage and visibility condition exist. | Continue aligning task state with lifecycle result and object stream. |

## 12. Implementation Sequence

Recommended sequence:

| Phase | Scope | Output |
|---|---|---|
| Phase A | Document this standard and register it. | BP-014 and project report. |
| Phase B | Extract frontend lifecycle helper without changing user-visible behavior. | Completed for `/create-profile/`: shared module and regression tests. |
| Phase C | Apply full `Save / confirm data` completeness gate to `/post-vacancy/`. | Completed for employer/company, vessel and crew-request missing items, highlighting and field navigation. |
| Phase D | Normalize protected upload UI through a shared upload helper. | Completed for `/create-profile/` and `/post-vacancy/`: same upload validation, status rendering, uploaded-document list and correction-task rendering. |
| Phase E | Add submit-review endpoint gated by backend completeness. | Completed: `ICS-003` submit-to-operator review gate, explicit submit endpoint, audit event and no operator task from save/autosave. |
| Phase E.1 | Correct `/create-profile/` hard-reload persistence and vessel-type structured selection. | Completed: backend-first reload, stale local snapshot guard and `vessel_types` multi-select with `Any vessel type`. |
| Phase E.2 | Correct `/create-profile/` finite catalog selects, repeated-address copy and upload/list contrast. | Completed: catalog-backed `select` controls for finite fields, `Same address` copy from permanent to registration address, and readable upload/document rows in dark theme. |
| Phase E.3 | Replace hidden multi-select UX with explicit multi-choice control for `/create-profile/` preferred vessel types. | Completed: visible checkbox choices backed by the same structured `preferred_vessel_types` array, with `Any vessel type` kept mutually exclusive. |
| Phase E.4 | Move `/create-profile/` protected upload into document-first placement and reserve extraction context. | Completed: upload appears immediately after identity/rank/availability, keeps the shared protected-upload helper and includes future AI-assisted confirmation context without OCR side effects. |
| Phase E.5 | Replace visible document-type dropdown with human-readable document checklist. | Completed: fixed seafarer document types render as compact one-button upload rows showing not-uploaded, uploaded filename, pending review, verified and replacement-required states while preserving hidden `document_type` for API upload. |
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

## 13A. Implemented Code Standard Control

Before programming any new lifecycle, upload, completeness, submit-review, correction or task workflow function, the implementer must check:

```text
docs/crewportglobal/implemented_code_standards/00_implemented_code_standards_register.md
```

If an implemented standard exists, the new work must use the existing canonical module/helper/service through an adapter or configuration layer.

If no implemented standard exists and the function is likely to be reused in multiple parts of the application, a new implemented standard and canonical implementation must be created before broad implementation.

The current lifecycle-related implemented standards are:

| ID | Standard | Canonical implementation |
|---|---|---|
| `ICS-001` | Standard form lifecycle | `projects/crewportglobal/public/assets/crewportglobal-form-lifecycle.js` |
| `ICS-002` | Standard protected upload | `projects/crewportglobal/public/assets/crewportglobal-protected-upload.js` |
| `ICS-003` | Submit-to-operator review gate | `projects/crewportglobal/app/backend/api/public/index.php` / `handle_post_draft_submit_review()` |

## 14. Acceptance Criteria

The standard is correctly adopted for a form when:

1. the form loads with explicit role and form-type context;
2. field edits survive reload;
3. `Save / confirm data` persists data and returns completeness;
4. missing items are numbered and clickable;
5. incomplete fields are visually marked;
6. protected upload rules are visible before upload;
7. upload errors are specific;
8. successful upload status includes the uploaded filename and the refreshed protected-document list shows the uploaded file;
9. submit-review is disabled until backend completeness passes;
10. submit-review writes audit and computes the next task only after the gate passes;
11. after successful save, hard reload restores backend data and does not let an older local snapshot erase user data;
12. list-valued reference fields use structured selections rather than unvalidated text when a catalog exists;
13. finite catalog fields use true select controls and preserve selected values after save/reload;
14. repeated-address copy helpers persist copied values after save/reload;
15. document-heavy forms place upload early enough to support document-first completion;
16. finite document catalogs render as a human-readable checklist with replacement states;
17. future AI/OCR extraction context is documented without bypassing owner confirmation or human review;
18. vessel-context fields and documents remain mapped to `V-*` codes and vessel form type, not employer authority form type;
19. Playwright/API tests cover save, reload, completeness, upload, role-context, catalog-select, document checklist, document-first placement and repeated-address/repeated-country behavior.

## 15. Next Stage

The Phase E submit-to-operator review gate, the `/create-profile/` field-control corrections, the first `/post-vacancy/` matching-first rollout and the CPG-BIZ-047 vessel-context rollout are complete.

The next rollout stage is:

```text
CPG-BIZ-048 - Employer and vessel submit-review readiness and owner correction handoff verification
```

That stage should verify that complete employer, vessel and crew-request data can move through submit-review, correction handoff and task recomputation without losing the standard lifecycle boundaries.

## 16. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 2.5 | 2026-06-03 | GTC IT / AI Assistant | Added versioned master-agreement control for future contract forms: immutable clauses, approved variable catalogs, instance version recording and AI boundary |
| 2.4 | 2026-06-01 | GTC IT / AI Assistant | Approved standard for staged implementation before contract-form clause-control extension |
