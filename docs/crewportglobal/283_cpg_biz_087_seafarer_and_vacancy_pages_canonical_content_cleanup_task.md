# CPG-BIZ-087 - Seafarer And Vacancy Pages Canonical Content Cleanup Task

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Execution task for Project Owner approval
- Source request: Project Owner instruction after CPG-BIZ-086
- Version: 1.0
- Date: 2026-06-03
- Status: For Project Owner approval

## 1. Purpose

This task defines the next canonical English content and navigation cleanup stage after automatic Google machine localization was completed.

The goal is to simplify the seafarer and vacancy user journeys, remove duplicative informational pages, verify form catalog bindings needed for matching, and then rerun the translation pipeline for changed pages only through the approved automatic localization standard.

This task does not authorize immediate code changes until approved by the Project Owner.

## 2. Business Reason

CrewPortGlobal is a functional maritime crew data and matching platform. Public and application pages should support the primary business purpose:

```text
help seafarers prepare verified supply data;
help shipowners/employers submit structured crew demand;
support automated request-supply matching;
support controlled team review and documented service evidence.
```

Duplicating explanatory content across multiple public pages creates maintenance risk and inconsistent statements after future edits. Canonical business, legal and operational explanations should live in the documentation / Trust Center pages. Functional menus should point users toward work actions, not repeated reading pages.

## 3. Scope

### 3.1 Seafarers menu

Update the top navigation menu group currently labeled:

```text
Seafarers
```

Required changes:

1. Remove the dropdown item and page route:

```text
For Seafarers
/for-seafarers/
```

2. Remove links pointing users to `/for-seafarers/` from public navigation.
3. Preserve canonical legal/process documentation in the `Documents` / Trust Center area.
4. Keep the functional action:

```text
Create Profile
/create-profile/
```

5. Do not remove the profile creation workflow.

### 3.2 Create Profile page

Review and verify the `Create Profile` form as a functional seafarer supply-data form.

Required checks:

1. Verify nationality catalog connection.
2. Verify gender catalog connection.
3. Verify rank/specialty catalog connection.
4. Verify department catalog connection.
5. Verify vessel type catalog connection and multi-select behavior.
6. Verify other select/list fields currently used by the form.
7. Confirm that selected values persist after save and hard reload.
8. Confirm that catalog values remain suitable for automated request-supply matching.
9. If any catalog is disconnected or missing, reconcile it against the existing imported Excel/reference catalog source and existing database/import artifacts before implementing changes.
10. Do not create a new catalog when an existing imported catalog already covers the field.

Relevant prior implementation context:

```text
projects/crewportglobal/scripts/import_seafarer_reference_catalogs.py
reference_catalogs
reference_catalog_values
```

If database or seed changes are required, prepare and show the additive SQL/patch first before executing, unless a prior approved standard already authorizes the exact change.

### 3.3 Vacancies menu and page

Review the public route:

```text
/vacancies/
```

Required changes:

1. Remove the card block:

```text
Public visibility rules
```

2. Clarify the meaning of:

```text
Verified vacancies
```

3. Review whether the public vacancies page creates real value for seafarers in the current platform model.
4. If there are no published vacancies, hide empty sections rather than showing low-value explanatory blocks.
5. Review and, if not valuable for seafarers, remove or hide:

```text
Published maritime vacancies
Loading verified vacancies...
Registered requests
Safe preview of registered demand
```

6. Preserve the rule that seafarers cannot directly contact employers outside the controlled process.
7. If public vacancy browsing is retained, it must be positioned as a controlled read-only preview or application-start path, not direct employer outreach.

## 4. Canonical English First

All page edits must be made first in canonical English.

After canonical English changes are complete and verified, run the approved translation flow:

```bash
npm run sync:cpg-i18n-source
python3 projects/crewportglobal/scripts/translation_cache.py --targets ru pt uk ar fil hi id es fr tr el --provider google_translate_public
npm run build:cpg-i18n-publish-ready
npm run publish:cpg-i18n-runtime-bundle
```

This follows CPG-BIZ-086:

1. pages and form UI are translated;
2. user-entered form data is not translated;
3. changed-page source text refreshes the machine translation cache;
4. browser runtime consumes only the published bundle.

## 5. Required Verification

The implementation stage must include:

1. navigation smoke check for the `Seafarers` dropdown;
2. confirmation that `/for-seafarers/` is not linked from the main public menu;
3. `Create Profile` catalog binding checks for nationality, gender, specialty/rank, department, vessel type and other select fields;
4. save/reload persistence check for selected catalog values;
5. vacancies page empty-state check;
6. i18n source sync;
7. Google translation cache update for changed/new source text;
8. runtime bundle publication check;
9. Playwright regression for affected pages.

## 6. Non-Scope

This task does not approve:

1. employer-facing publication of candidates;
2. direct seafarer-employer contact;
3. removal of legal/Trust Center documents;
4. new business-process redesign outside the stated Seafarers/Vacancies scope;
5. manual perfection of machine translations;
6. unrelated homepage redesign;
7. unrelated team queue or backend workflow changes.

## 7. Acceptance Criteria

The task is complete when:

1. `/for-seafarers/` is removed from the public seafarer menu or replaced by a non-menu legacy/support state if needed for compatibility.
2. `Create Profile` remains the primary seafarer action.
3. all relevant `Create Profile` select/list fields use connected catalogs suitable for matching.
4. selected catalog values persist after save and hard reload.
5. `/vacancies/` no longer displays low-value explanatory blocks when there are no published vacancies.
6. any retained vacancy content has a clear value for seafarers and does not imply direct employer contact.
7. canonical English content is updated before machine localization.
8. changed pages are retranslated using the approved Google machine translation pipeline.
9. tests confirm the changed behavior.
10. an implementation report is created after execution.

## 8. Next Stage After Approval

After Project Owner approval, the implementation agent should:

1. inspect existing page files and navigation source;
2. inspect `Create Profile` field/catalog bindings;
3. make the smallest necessary code/content changes;
4. verify form persistence and vacancies empty-state behavior;
5. rerun the automatic translation pipeline;
6. write an implementation report in Russian.
