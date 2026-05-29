# ICS-001 - Standard Form Lifecycle

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Documentation block: Implemented code standards
- Document type: Implemented code standard
- Version: 1.0
- Date: 2026-05-29
- Status: Active

## 1. Purpose

This standard defines the reusable frontend lifecycle behavior for large CrewPortGlobal forms.

The standard prevents every form from creating its own copy of:

1. missing-item rendering;
2. field and section highlighting;
3. exact navigation to fields requiring completion;
4. autosave scheduling.

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

## 5. Forbidden Local Logic

Pages must not duplicate:

1. missing-list link generation;
2. current-page hash handling;
3. field/section highlight clearing and reapplying;
4. section opening logic for missing items;
5. autosave timer/in-flight/pending control.

## 6. Current Tests

Current regression coverage includes:

```text
tests/crewportglobal-create-profile-prefill.spec.ts
tests/crewportglobal-post-vacancy-workspace.spec.ts
```

The tests check that missing items are rendered, highlighted and opened by exact links.

## 7. Change Propagation Rule

If missing-item navigation, highlighting or autosave behavior changes, update:

1. `crewportglobal-form-lifecycle.js`;
2. each page adapter only if the adapter contract changes;
3. focused tests for `/create-profile/` and `/post-vacancy/`;
4. this standard and BP-014.

## 8. Next Adoption Targets

1. owner correction task forms;
2. future submit-review UI;
3. task-specific correction workspaces.
