# ICS-001 - Standard Form Lifecycle

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Documentation block: Implemented code standards
- Document type: Implemented code standard
- Version: 1.1
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
6. structured list-valued reference-field handling through page adapters.

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

## 5. Forbidden Local Logic

Pages must not duplicate:

1. missing-list link generation;
2. current-page hash handling;
3. field/section highlight clearing and reapplying;
4. section opening logic for missing items;
5. autosave timer/in-flight/pending control;
6. stale-local-snapshot overwrite after backend save;
7. free-text storage for catalog-backed list fields when a structured catalog exists.

## 6. Current Tests

Current regression coverage includes:

```text
tests/crewportglobal-create-profile-prefill.spec.ts
tests/crewportglobal-post-vacancy-workspace.spec.ts
```

The tests check that missing items are rendered, highlighted and opened by exact links.

They also check that `/create-profile/` keeps saved backend data after hard reload and that `Preferred vessel types` is stored as a structured multi-select value with an explicit neutral option:

```text
Any vessel type / Тип судна не важен
```

## 7. Change Propagation Rule

If missing-item navigation, highlighting or autosave behavior changes, update:

1. `crewportglobal-form-lifecycle.js`;
2. each page adapter only if the adapter contract changes;
3. focused tests for `/create-profile/` and `/post-vacancy/`;
4. this standard and BP-014.

After a successful backend save, the page adapter must clear or ignore older local snapshots. A local snapshot may restore form values only when it is newer than the backend `updated_at` timestamp, because otherwise a browser cache can erase saved questionnaire data after a hard reload.

## 8. Next Adoption Targets

1. owner correction task forms;
2. future submit-review UI;
3. task-specific correction workspaces.
