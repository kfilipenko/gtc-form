# ICS-001 - Standard Form Lifecycle

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Documentation block: Implemented code standards
- Document type: Implemented code standard
- Version: 1.9
- Date: 2026-05-29
- Status: Active

## 1. Purpose

This standard defines the reusable frontend lifecycle behavior for large CrewPortGlobal forms.

The standard exists to support the main platform objective:

```text
collect structured seafarer supply and shipowner demand data so the system can later perform reliable automated request-offer matching.
```

Form controls, persistence and completeness gates are therefore not isolated UI features. They are the input discipline for future matching, blocker explanation, shortlist preparation and human approval workflows.

The standard prevents every form from creating its own copy of:

1. missing-item rendering;
2. field and section highlighting;
3. exact navigation to fields requiring completion;
4. autosave scheduling;
5. backend-first reload after successful save;
6. structured list-valued reference-field handling through page adapters;
7. finite single-select reference-field handling through shared catalog binding;
8. repeated-address copy helpers when a form asks for the same address more than once;
9. document-first completion placement for forms where uploaded evidence can later prefill structured fields;
10. human-readable document checklist rendering instead of technical document-type dropdowns;
11. country-code select handling with ISO alpha-2 values and same-as-nationality copy helpers where the same country is requested more than once;
12. matching-readiness control for fields that must be comparable between supply and demand forms.

## 2. Applies To

Current adopters:

```text
/create-profile/
/post-vacancy/
```

Future adopters:

1. owner correction forms;
2. document correction forms;
3. employer/company profile forms;
4. vessel profile forms;
5. any future questionnaire using numbered completeness items.

## 3. Canonical Implementation

```text
projects/crewportglobal/public/assets/crewportglobal-form-lifecycle.js
```

Canonical API:

```text
window.CPGFormLifecycle.createCompletenessNavigator(config)
window.CPGFormLifecycle.createAutosaveController(config)
```

## 4. Adapter Contract

Each page adapter must provide:

| Adapter input | Purpose |
|---|---|
| `fieldTargets` | Maps canonical missing item codes to exact DOM field IDs. |
| `sectionTargets` | Maps missing item codes to exact section/workspace IDs. |
| `getDraftId` | Returns the active draft ID for URL generation. |
| `defaultPath` | Page path for local missing-item links. |
| optional `targetPathResolver` | Cross-form route when a missing item belongs to another form. |
| `fallbackLabel` | Safe label for unknown items. |
| backend `updated_at` timestamp | Determines whether a local snapshot is newer than backend draft data. |
| list-valued control mapping | Maps catalog-backed multi-select values to the canonical payload array. |
| finite catalog select mapping | Maps matching-critical finite catalog fields to true `select` controls instead of browser `datalist` text inputs. |
| country-code select mapping | Maps country catalogs to stable ISO alpha-2 values when the stored field is a country code. |
| repeated-address source mapping | Defines which source address fields can copy into the repeated address block. |
| repeated-country source mapping | Defines when `Same as nationality` or a similar source-country copy button is allowed. |
| document-first upload context | Defines whether upload appears before detailed manual fields and which canonical prefix future extraction maps to. |
| document checklist adapter | Maps allowed document types to compact visible rows with uploaded/reviewed/replacement state and one visible row-level upload/replace button. |
| matching counterpart mapping | Identifies whether a changed field is supply-side, demand-side, vessel-context or crew-request data and what field/catalog it must match against. |

## 5. Forbidden Local Logic

Pages must not duplicate:

1. missing-list link generation;
2. current-page hash handling;
3. field/section highlight clearing and reapplying;
4. section opening logic for missing items;
5. autosave timer/in-flight/pending control;
6. stale-local-snapshot overwrite after backend save;
7. free-text storage for catalog-backed list fields when a structured catalog exists;
8. `datalist` controls for finite mandatory or matching-critical catalogs such as civil status, gender, relation or vessel type;
9. page-local duplicate-address behavior when a shared form lifecycle helper or page adapter can provide it;
10. country-code free text when the approved `countries` catalog is available and the field expects a country code;
11. burying protected document upload after all manual fields when documents are expected to become the first source for future AI/OCR prefill;
12. exposing document upload primarily through a technical dropdown when a fixed document checklist can show the required evidence more clearly;
13. adding free-text or page-local values for matching-critical demand/supply fields when a shared catalog or compatibility mapping exists;
14. adding a hard matching blocker for a field that is not structured on both the demand and supply sides.

## 6. Reference-Field Control Standard

Finite catalog-backed fields must use structured controls:

| Field type | Required control | Reason |
|---|---|---|
| Single finite catalog | `select` populated through `CPGReferenceCatalogs.bindSelect` | The user must choose one approved value, and tests can assert the control. |
| Country-code catalog | `select` populated through `CPGReferenceCatalogs.bindSelect` with ISO alpha-2 values | The user sees country names but the saved value stays comparable for matching and validation. |
| Multiple finite catalog | Explicit multi-choice control, such as checkboxes or an approved searchable multiselect, backed by a stored array | Matching may compare several values; the user must see how to select several values without hidden Ctrl/Shift keyboard behavior. |
| Large searchable catalog | `input` + `datalist` may remain temporarily acceptable | Cities, airports or institutions may need search/type-ahead until a shared searchable select exists. |
| Free text | `input` / `textarea` | Only when no catalog or controlled value set applies. |

When a finite catalog cannot be loaded, the page adapter must provide a safe fallback value list and preserve already saved legacy values on reload.

When a form asks for several country-code fields and one field is an obvious source value, the page may expose an explicit copy helper. In `/create-profile/`, `Nationality` can be copied to residence/current/registration/COC/flag country through `Same as nationality`. The copy must dispatch the normal form-change event so autosave, backend save, completeness and reload behavior remain standard.

## 6A. Matching-Readiness Field Standard

Any field that may affect automated request-offer matching must be classified before or during implementation.

| Classification | Requirement |
|---|---|
| Hard blocker candidate | Both sides must have comparable structured values and an approved blocker meaning. |
| Soft score candidate | Both sides should have structured or normalized values, but missing/partial data may reduce confidence rather than block. |
| Evidence-backed field | The value should be linked to uploaded/verified evidence when possible. |
| Compliance-only field | The field may be required for review but must not enter matching or employer-safe payloads unless separately approved. |
| Display-only field | The field must not create matching blockers or requiredness parity by itself. |

For every matching-critical field, the adapter or implementation report must identify:

1. stream: `seafarer_supply`, `employer_company`, `vessel_context` or `crew_request`;
2. canonical key;
3. reference catalog or normalization rule;
4. opposite-side counterpart;
5. requiredness on each side;
6. whether the value may be used for hard blocker, soft score or evidence explanation.

Examples:

| Matching concept | Demand-side field | Supply-side field | Required control |
|---|---|---|---|
| Rank | requested rank | primary/acceptable rank | Shared rank catalog. |
| Department | requested department | seafarer department | Shared department catalog. |
| Vessel type | vessel/request vessel type | preferred/experienced vessel type | Shared vessel type catalog or approved matching category. |
| Joining / availability | joining date | availability status/date | Date/status normalization. |
| Salary | salary range | salary expectation | Numeric value and currency. |
| Country / flag / location | flag/country/port context | nationality/current country/visa readiness | Country catalog and, where used, port catalog. |

When the opposite side is missing, the field may still be collected, but it must be documented as `matching_gap` and must not become a hard blocker.

## 7. Current Tests

Current regression coverage includes:

```text
tests/crewportglobal-create-profile-prefill.spec.ts
tests/crewportglobal-post-vacancy-workspace.spec.ts
```

The tests check that missing items are rendered, highlighted and opened by exact links.

They also check that `/create-profile/` keeps saved backend data after hard reload and that `Preferred vessel types` is stored as a structured multi-value array with an explicit neutral option:

```text
Any vessel type / Тип судна не важен
```

For user-facing forms, native browser `select multiple` is not sufficient by itself for finite catalog fields because the multiple-selection behavior is not obvious to ordinary users. The visible control should show one explicit checkbox/toggle per option or an approved searchable multiselect component. A hidden/select-backed adapter may remain only as an implementation detail when it preserves the existing payload and test contract.

The `/create-profile/` regression also checks that finite catalog fields are true `select` controls:

```text
gender
civil status
emergency contact relation
kin gender
kin relation
last vessel type
```

and that the repeated registration address can be copied from the permanent address without losing backend persistence after reload.

The same regression also checks that country-code fields are catalog-backed `select` controls, that values such as `CY`, `AE` and `PH` are available from the catalog/fallback resolver, and that `Same as nationality` persists copied country values through save and hard reload.

## 7A. Document-First Completion Standard

When a form can be materially completed from uploaded documents, the upload panel should appear near the beginning of the owner workflow, after the minimum identity/context block and before long manual sections.

For `/create-profile/`, this means:

```text
Identity, rank and availability
-> Protected document upload
-> Manual profile details
-> Review package
```

The upload panel must remain protected-upload only until a dedicated AI/OCR extraction workflow is implemented. Future extraction must follow this sequence:

1. protected upload and malware scan;
2. document classification;
3. OCR / AI extraction into candidate field values;
4. canonical field mapping to `S-*`, `E-*`, `V-*` or `R-*` fields;
5. confidence status per value;
6. owner confirmation before writing extracted values as accepted form data;
7. numbered missing-item request for values not found in documents.

AI/OCR assistance must not submit a profile, approve documents, create shortlist decisions or make employment decisions.

For fixed document catalogs, the owner UI should show one compact document row per allowed document type. Each row should show:

1. document name in human language;
2. short description only on hover / tooltip, hidden by default;
3. latest uploaded filename when present;
4. scan status;
5. human/agent review status;
6. verified/confirmed state when `review_status = verified`;
7. replacement-required state when `review_status` is `correction_requested` or `rejected`;
8. one visible row-level upload/replace button that opens the browser file picker and uploads immediately after file selection.

The document list must not be rendered as large reading cards when the user needs a fast upload menu. The user-facing row must not require two separate visible actions such as `Choose file` and `Upload`. A hidden file input may remain only as a technical browser adapter behind the visible `Upload` / `Replace` button. Selecting a row file must not rerender the list before upload, because browsers clear selected `File` objects when their input node is replaced.

The technical `document_type` control may remain hidden as an adapter detail only when the visible checklist is the user-facing control.

## 7B. Demand-Side Matching Field Rollout

When this standard is applied to employer, vessel or crew-request forms, the first fields to normalize should be the fields needed for request-offer matching.

For `/post-vacancy/`, the first rollout converted these fields to catalog-backed controls:

| Field | Catalog | Matching purpose |
|---|---|---|
| Requested rank | `seafarer_positions` | Core supply-demand position comparison. |
| Vessel type | `vessel_types` | Vessel-experience and preference comparison. |
| Country | `countries` | Compliance, operating context and soft scoring. |

Page adapters must not introduce a hard matching blocker just because a field has become structured. Hard blockers are allowed only when both sides of the comparison have comparable structured values and the business-process document classifies the field as a hard requirement.

## 8. Change Propagation Rule

If missing-item navigation, highlighting or autosave behavior changes, update:

1. `crewportglobal-form-lifecycle.js`;
2. each page adapter only if the adapter contract changes;
3. focused tests for `/create-profile/` and `/post-vacancy/`;
4. this standard and BP-014.

After a successful backend save, the page adapter must clear or ignore older local snapshots. A local snapshot may restore form values only when it is newer than the backend `updated_at` timestamp, because otherwise a browser cache can erase saved questionnaire data after a hard reload.

## 9. Next Adoption Targets

1. owner correction task forms;
2. future submit-review UI;
3. task-specific correction workspaces.
