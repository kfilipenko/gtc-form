# ICS-001 - Standard Form Lifecycle

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Documentation block: Implemented code standards
- Document type: Implemented code standard
- Version: 1.2
- Date: 2026-05-29
- Status: Active

## 1. Purpose

This standard defines the reusable frontend lifecycle behavior for large CrewPortGlobal forms.

The standard prevents every form from creating its own copy of:

1. missing-item rendering;
2. field and section highlighting;
3. exact navigation to fields requiring completion;
4. autosave scheduling;
5. backend-first reload after successful save;
6. structured list-valued reference-field handling through page adapters;
7. finite single-select reference-field handling through shared catalog binding;
8. repeated-address copy helpers when a form asks for the same address more than once.

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
| repeated-address source mapping | Defines which source address fields can copy into the repeated address block. |

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
9. page-local duplicate-address behavior when a shared form lifecycle helper or page adapter can provide it.

## 6. Reference-Field Control Standard

Finite catalog-backed fields must use structured controls:

| Field type | Required control | Reason |
|---|---|---|
| Single finite catalog | `select` populated through `CPGReferenceCatalogs.bindSelect` | The user must choose one approved value, and tests can assert the control. |
| Multiple finite catalog | Explicit multi-choice control, such as checkboxes or an approved searchable multiselect, backed by a stored array | Matching may compare several values; the user must see how to select several values without hidden Ctrl/Shift keyboard behavior. |
| Large searchable catalog | `input` + `datalist` may remain temporarily acceptable | Countries, cities, airports or institutions may need search/type-ahead until a shared searchable select exists. |
| Free text | `input` / `textarea` | Only when no catalog or controlled value set applies. |

When a finite catalog cannot be loaded, the page adapter must provide a safe fallback value list and preserve already saved legacy values on reload.

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
