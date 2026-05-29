# CPG-BIZ-046 - Standard Form Lifecycle Rollout To Remaining Forms Task

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Execution task for Project Owner approval
- Source request: Project Owner approval after manual `/create-profile/` nationality/country persistence test
- Version: 1.1
- Date: 2026-05-29
- Status: Approved by Project Owner; Phase 1 implemented through document 240

## 1. Purpose

This task authorizes the next controlled implementation stage:

```text
spread the approved standard form lifecycle controls from /create-profile/ to the remaining CrewPortGlobal forms.
```

The standard has been verified on the seafarer profile form for:

1. backend-first save and hard-reload persistence;
2. one visible `Save / confirm data` action;
3. backend completeness result with numbered missing items;
4. exact missing-item navigation and field highlighting;
5. protected upload with visible accepted-file feedback;
6. document-first profile completion layout;
7. human-readable document checklist with one row-level upload/replace action;
8. finite catalog fields rendered as true selects;
9. explicit multi-choice controls for multi-value catalogs;
10. country-code selects with ISO alpha-2 stored values;
11. repeated-field copy helpers such as `Same address` and `Same as nationality`;
12. readable form controls and upload rows in dark and light themes.

The business reason is to stop solving these problems page by page. Current and future forms must reuse the implemented standard and shared helpers instead of recreating page-local behavior.

The operational reason is broader than UI consistency:

```text
the forms must collect comparable structured data so CrewPortGlobal can automatically match shipowner demand with seafarer supply.
```

The standard is therefore an automation and matching-readiness standard, not an end in itself.

Every rollout decision must support the main business result:

```text
find suitable seafarers for a shipowner's crew request, explain why candidates match or are blocked, and preserve human approval before presentation.
```

## 1A. Matching-First Rollout Principle

When the standard is applied to another form, the agent must evaluate each target field through a matching lens.

For each relevant field, the implementation report must classify:

| Question | Required answer |
|---|---|
| Which side uses the field? | `supply`, `demand`, `vessel`, `crew_request`, or shared. |
| Is the same concept present on the opposite side? | Exact key, equivalent key, missing, or future target. |
| Is the field matching-critical? | Hard blocker, soft score, evidence-only, compliance-only, or display-only. |
| Is a reference catalog available? | Existing catalog, missing catalog, partial catalog, or free text justified. |
| Is the stored value comparable? | Code/ID, normalized scalar, array of codes, date/number, or uncontrolled text. |
| Is the field mandatory on both relevant sides? | Required, conditionally required, optional, or not applicable. |
| Does it affect candidate visibility? | Internal only, owner only, operator review, employer-safe candidate summary, or restricted. |

The rollout must prefer:

1. structured catalog values over free text;
2. normalized codes over labels where matching needs comparison;
3. arrays of approved codes for multi-value preferences;
4. explicit neutral options where the business meaning is valid, for example `Any vessel type`;
5. synchronized requiredness between supply and demand when a field is used for matching.

The rollout must not introduce a hard blocker unless both sides have comparable structured data and the field is approved for hard matching.

## 2. Forms In Scope

The rollout must cover the remaining active data-intake forms and workspaces where the same standard applies.

| Form / page | Stream | Expected rollout focus |
|---|---|---|
| `/post-vacancy/` | Employer, vessel and crew request demand | Demand-side save/completeness, E/V/R missing items, finite catalog selects, country/flag helpers, document checklist where document upload is present, exact links to fields. |
| `/register/employer/` | Employer account registration | Reuse finite catalog selects, country/company controls, save/reload safety if draft persistence is present, clear handoff into demand workspace. |
| `/register/vessel/` if active | Vessel context | Vessel type, flag country, port/country and vessel evidence controls must follow the same catalog/select/upload standard. |
| `/register/authorization/*` | Authorization evidence | Protected upload and document checklist standard where fixed evidence documents are required. |
| Future employer/vessel/vacancy forms | Employer / vessel / crew request | New forms must attach to BP-014 and implemented code standards before adding custom page logic. |

If a listed route is not active or is only a legacy bridge, the implementation report must state that explicitly and must not add unnecessary functionality.

The `/post-vacancy/` rollout is the first priority because it supplies the demand side for automated request-offer matching.

## 3. Mandatory Standards To Reuse

The implementation must start by checking and reusing existing standards:

```text
docs/crewportglobal/business_processes/14_standard_form_lifecycle_and_validation_module.md
docs/crewportglobal/implemented_code_standards/00_implemented_code_standards_register.md
docs/crewportglobal/implemented_code_standards/01_standard_form_lifecycle.md
docs/crewportglobal/implemented_code_standards/02_standard_protected_upload.md
docs/crewportglobal/implemented_code_standards/03_standard_submit_review_gate.md
```

Code must reuse the existing shared helpers where applicable:

```text
projects/crewportglobal/public/assets/crewportglobal-form-lifecycle.js
projects/crewportglobal/public/assets/crewportglobal-protected-upload.js
projects/crewportglobal/public/assets/crewportglobal-reference-catalogs.js
projects/crewportglobal/public/assets/crewportglobal-registration-drafts.js
```

If a helper does not yet support a required use case, the preferred approach is to extend the shared helper through a narrow option or adapter, not to duplicate logic in the target page.

## 4. Implementation Rules

### 4.1 Save and persistence

Each covered form must preserve entered data after:

1. field edit;
2. `Save / confirm data`;
3. normal reload;
4. hard reload.

After successful backend save, backend draft data is the source of truth. Browser-local snapshots may restore only newer unsaved edits.

### 4.2 Completeness and submit-review gate

Each covered questionnaire must keep the approved separation:

```text
autosave/save -> saves data and runs completeness only
submit-review -> separate controlled action after completeness passes
```

Incomplete forms must show numbered missing items:

| Prefix | Stream |
|---|---|
| `E-*` | Employer / shipowner demand account |
| `V-*` | Vessel context |
| `R-*` | Crew request / vacancy requirement |
| `S-*` | Seafarer supply, only where seafarer form changes are touched for regression |

Clicking a missing item must navigate to the exact field, document row or section.

### 4.3 Catalog fields

Finite catalog-backed values must use structured controls:

| Field type | Required control |
|---|---|
| Single finite catalog | True `select`, not free text or browser-only `datalist`. |
| Multi-value finite catalog | Explicit visible multi-choice control, not native `select multiple` without clear user instruction. |
| Country code | Country catalog select with ISO alpha-2 stored value. |
| Vessel type | Structured select or multi-choice using the published `vessel_types` catalog. |
| Port/city large searchable values | Searchable control may remain separate if the finite catalog is too large, but the report must describe the selected approach. |

Where the same value is likely repeated, add an explicit copy helper without hiding the ability to choose a different value.

Examples:

```text
Same as company country
Same as flag country
Same as vessel flag
Same as registered address
```

### 4.3A Supply-demand synchronization

For any field that affects crew matching, the rollout must check both sides:

| Demand-side concept | Supply-side concept | Rollout expectation |
|---|---|---|
| requested rank | primary rank / acceptable rank | Comparable rank catalog values. |
| requested department | seafarer department | Comparable department catalog values. |
| vessel type | preferred / experienced vessel type | Shared vessel type or matching category catalog. |
| joining date | availability date/status | Comparable date or availability state. |
| contract duration | contract preference / availability | Structured duration unit where used. |
| salary range | salary expectation | Numeric currency-aware values, not text. |
| trading area / country / port | current country / visa / port readiness | Country/port catalogs where matching uses location. |
| certificates / COC / endorsement | seafarer certificates | Document-backed or catalog-backed evidence status. |
| language / training / STCW | seafarer qualification evidence | Catalog-backed where used for matching or blockers. |

If the demand side has a field but the supply side lacks a comparable field, or vice versa, the implementation report must record the gap and keep that dimension out of hard matching until the missing side is implemented.

### 4.4 Protected upload and document checklist

Where a form asks for fixed evidence documents, it must use the human-readable document checklist standard:

1. one row per document type;
2. document name visible;
3. short description hidden behind hover/tooltip;
4. one visible `Upload` or `Replace` action;
5. uploaded source filename displayed under the document name;
6. scan/review/replacement status displayed in the same row;
7. technical document-type dropdown hidden from ordinary users.

The current upload implementation must remain protected-storage only. This task does not authorize public file links.

### 4.5 Role and form context

Every save/upload/completeness call must pass explicit role/form context where the backend requires it.

The multi-role account regression is mandatory:

```text
one user may have seafarer and employer-side roles, but the selected form context must decide how save/upload is processed.
```

The implementation must not rely on "first available role" behavior.

## 5. Non-Scope

This task does not authorize:

1. new matching algorithm or scoring;
2. employer-facing publication;
3. employment decisions;
4. billing implementation;
5. private Excel changes;
6. DB migrations unless separately shown and approved;
7. broad redesign of public marketing pages;
8. replacing the approved BP-014 standard with a new standard.

If a DB change becomes necessary, the agent must stop and show an additive/idempotent SQL patch before execution.

## 6. Required Inspection Before Code Changes

Before editing code, the implementation agent must inspect:

1. existing target form files;
2. current shared lifecycle helpers;
3. current backend completeness and submit-review endpoints;
4. current reference-catalog bindings;
5. current upload helper and document checklist behavior;
6. current tests for `/create-profile/` and `/post-vacancy/`.
7. supply-demand matching documents and current mandatory-field synchronization analysis.

The implementation must name which standards are reused and which helper extension, if any, is required.

The implementation must also identify which changed fields are needed for future automated matching and which fields are only compliance, evidence, display or operational fields.

## 7. Tests To Add Or Update

The rollout must include focused regression tests.

| Test area | Required assertion |
|---|---|
| Demand save reload | `/post-vacancy/` preserves entered employer/vessel/request fields after save and hard reload. |
| Demand completeness links | `E/V/R-*` missing items navigate to exact fields or document rows. |
| Country catalog | Country/flag/company-country fields open structured catalog controls and persist ISO alpha-2 values. |
| Vessel type catalog | Vessel type or vessel preference controls are structured and persist selected values. |
| Repeated-field helper | Same-country/same-address helper copies values and persists after reload. |
| Protected upload | Upload shows accepted filename and refreshed document row/list. |
| Multi-role context | Account with several roles saves/uploads under the selected form context. |
| Matching readiness | Demand fields converted in the rollout remain comparable with seafarer-side fields or are documented as gaps. |
| Requiredness parity | Matching-critical fields are not made required on one side while the corresponding side remains optional without justification. |
| Existing seafarer regression | `/create-profile/` country, vessel multiselect, document upload and save/reload tests remain green. |

Generated Playwright reports and `test-results` artifacts must not be left in the final working tree unless the project intentionally tracks them.

## 8. Acceptance Criteria

The task is complete when:

1. every active covered form uses the standard lifecycle behavior or is explicitly documented as legacy/non-active;
2. no finite mandatory/matching-critical catalog field remains as unreliable free text where a published catalog exists;
3. repeated country/address fields have clear copy helpers where useful;
4. protected upload behavior is consistent and user-readable;
5. save/reload persistence is proven by tests;
6. completeness missing items navigate to exact fields;
7. submit-review remains separate from save;
8. no new broad side effects, publication or employment decision logic is introduced;
9. the implementation report includes a supply-demand field synchronization matrix for changed fields;
10. no new hard matching blocker is introduced without comparable structured supply and demand values;
11. implementation report is written in Russian and includes the next planned stage.

## 9. Approval Gate

Project Owner approval was required before execution and was received on 2026-05-29.

After approval, the implementation agent should proceed in this order:

1. inspect target forms and shared helpers;
2. prepare narrow code changes by reusing standards;
3. update or add focused tests;
4. run focused and relevant regression tests;
5. clean generated artifacts;
6. write a Russian implementation report;
7. provide test URLs, changed files and test results.

Phase 1 was executed for `/post-vacancy/` and recorded in:

```text
docs/crewportglobal/240_cpg_biz_046_standard_form_lifecycle_rollout_report.md
```

## 10. Planned Implementation Report

After execution, prepare:

```text
docs/crewportglobal/240_cpg_biz_046_standard_form_lifecycle_rollout_report.md
```

The report must state which forms were updated, which standards were reused, which fields were converted to structured controls, which copy helpers were added, what was tested and what remains for the next stage.
