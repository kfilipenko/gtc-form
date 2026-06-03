# CPG-BIZ-088 - Seafarer Workflow Pages And Business Process Alignment Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Final seafarer workflow alignment report
- Source task: continuation after CPG-BIZ-087
- Version: 1.0
- Date: 2026-06-03
- Status: Prepared for Project Owner review

## 1. Purpose

This report summarizes the current seafarer-side workflow after the latest public-page and form-standard cleanup.

The goal is to connect every seafarer-facing page with the approved business-process model, so the portal is not a set of disconnected pages, but a working route:

```text
marketing entry -> account registration -> seafarer profile -> document evidence -> completeness control -> operator review -> matching -> shortlist / presentation workflow -> voyage and retention cycle
```

This report does not introduce code, database, migration or runtime changes.

## 2. Business-Process Sources

The seafarer route is controlled by these documents:

| Document | Role in seafarer process |
|---|---|
| `business_processes/15_crewportglobal_commercial_operating_cycle.md` | Defines the full commercial cycle from marketing to recurring cooperation. |
| `business_processes/12_crew_formation_service_business_process_manual.md` | Defines crew formation operations, handoffs, audit evidence and no automatic employment decision. |
| `business_processes/13_crew_formation_operating_instructions_for_users_team_ai.md` | Defines practical operating instructions for users, team and AI agents. |
| `business_processes/14_standard_form_lifecycle_and_validation_module.md` | Defines the standard form lifecycle: autosave, confirm data, missing items, document-first upload and matching-oriented fields. |
| `business_processes/10_document_upload_storage_and_review_procedure.md` | Defines protected document upload, review and replacement logic. |
| `business_processes/05_personal_cabinet_and_scoped_visibility_requirements.md` | Defines personal-cabinet visibility and scoped access rules. |
| `business_processes/11_seafarer_field_dictionary_and_reference_catalog_alignment.md` | Defines seafarer field/catalog alignment for later automated matching. |

## 3. Seafarer Route Summary

| Step | Portal page | Business-process stage | Current role of the page |
|---|---|---|---|
| 1 | `/` | BP-015 CC-01 - Marketing to seafarers | First conversion point. The seafarer must immediately see the value and action: create profile. |
| 2 | `/register/` | BP-015 CC-03 / BP-008 - Person registration | Creates the platform participant account before role-specific profile completion. |
| 3 | `/register/confirm/`, `/register/next/` | BP-008 - Account confirmation and routing | Confirms identity/session and routes the user to the correct profile path. |
| 4 | `/create-profile/` | BP-015 CC-04 / BP-014 - Seafarer supply profile | Main seafarer working page. Collects structured supply data for matching. |
| 5 | `/create-profile/#profile-section-document-upload` | BP-010 / BP-014 - Document-first evidence | Uploads documents early so future extraction can reduce manual typing. |
| 6 | `/create-profile/#profile-section-review` | BP-014 - Completeness control | Runs required-field and document checks before operator submission. |
| 7 | `/create-profile/#profile-section-consent` | BP-014 / legal controls | Consolidates agreement, personal data consent, no-fee acknowledgement and data accuracy confirmation. |
| 8 | `/create-profile/#profile-section-applications` | BP-015 CC-09 to CC-12 | Shows seafarer-side application/matching status without exposing employer-side protected workflow. |
| 9 | `/vacancies/`, `/vacancies/detail/` | BP-015 CC-09 / public controlled visibility | Shows only safe opportunity data when there is publishable value. If no public vacancies exist, the page must not become a text-heavy explanation page. |
| 10 | `/cabinet/` or future `/me/seafarer/` | BP-005 / BP-015 retention | Should become the seafarer's next-action dashboard after login. |
| 11 | Internal: `/verify/`, `/team/`, `/team/matching/`, `/team/shortlists/` | BP-012 / BP-013 / BP-015 CC-09 to CC-12 | Team-side review, matching, blocker review, shortlist and candidate presentation workflow. |

## 4. Confirmed Current Decisions

1. The seafarer should not pass two consent screens.
2. Final consent belongs inside `/create-profile/`, because it relates to the exact data and documents submitted by the seafarer.
3. `/onboarding/seafarer-registration/` was removed from the mandatory route.
4. `/for-seafarers/` is no longer in the main menu and should not duplicate documents or create parallel explanations.
5. `/create-profile/` is the main seafarer registration and profile-completion workspace.
6. The official data-entry language for forms is English; page localization is machine translation for user convenience.
7. Seafarer-entered form data is not machine-translated automatically.
8. The profile form must remain structured for automated request-supply matching, not just for human reading.

## 5. Page-By-Page Assessment

| Page | Assessment | Business-process decision |
|---|---|---|
| `/` | Now serves as the marketing entry point, but must continue moving away from explanatory content toward conversion. | Keep. Primary action must be role-based: seafarer profile or employer vacancy. |
| `/register/` | Required for platform participant creation. | Keep. After registration, route by selected role. |
| `/create-profile/` | Core seafarer page. It now contains autosave, document upload, matching-oriented required fields and consolidated consent. | Keep and continue improving. This is the primary seafarer working object. |
| `/vacancies/` | Useful only if it gives the seafarer controlled, safe opportunity context. If there are no publishable vacancies, explanatory blocks should remain hidden. | Keep as functional vacancy board, not as educational page. |
| `/vacancies/detail/` | Useful only for publishable vacancy detail or controlled preview. | Keep with safe fields and no direct employer contact exposure. |
| `/for-seafarers/` | Duplicates information already handled by the homepage, profile form and legal documents. | Keep only as legacy/support or redirect candidate. Do not place in main navigation. |
| `/onboarding/seafarer-registration/` | Duplicate consent path; confusing after consolidated consent in `/create-profile/`. | Excluded from mandatory route. Future option: redirect to `/create-profile/#profile-section-consent`. |
| `/cabinet/` | Currently important as authenticated landing route. | Should become the seafarer next-action dashboard. |

## 6. Seafarer Process Coverage

| Business need | Current coverage | Remaining gap |
|---|---|---|
| Quick first action for seafarer | Homepage role block and `/create-profile/` route exist. | Continue reducing homepage text and make the CTA dominant. |
| Account registration | `/register/` and login routing exist. | Improve cabinet landing by role and next action. |
| Structured profile for matching | `/create-profile/` has matching-oriented fields and catalogs. | Continue catalog verification when new fields are added. |
| Document upload | Document-first upload checklist exists in `/create-profile/`. | Future AI extraction workflow should populate draft fields from documents. |
| Required-field control | Completeness endpoint and numbered missing items exist. | Expand same standard to all remaining forms and keep mandatory fields synchronized across supply/demand. |
| Consent and no-fee control | Consolidated consent exists in `/create-profile/`. | Keep legal wording stable and human-reviewed before machine translation publication. |
| Operator review | Team/operator queue exists. | The seafarer should see a simple status and next expected action in cabinet. |
| Matching and shortlist | Internal matching/shortlist workflows exist. | Seafarer-facing explanation should remain minimal; no promise of employment. |
| Voyage completion / return marketing | Defined in BP-015, not fully productized. | Future flow: update availability after voyage and invite next contract cycle. |

## 7. Recommended Seafarer Page Improvements

These are recommendations, not changes made in this report.

### 7.1 Personal next-action dashboard

Create a compact seafarer dashboard after login:

```text
Profile status
Documents
Missing items
Operator review status
Matching readiness
Applications / opportunities
Availability for next voyage
```

The dashboard should show one computed next action, not a list of competing buttons.

### 7.2 Legacy route consolidation

Replace direct access to `/for-seafarers/` with either:

1. a redirect to `/create-profile/`; or
2. a short transition page: `Create or update your seafarer profile`.

The same rule applies to any remaining seafarer explanatory page that does not create a record, task, evidence, consent or conversion.

### 7.3 Vacancy board value rule

For seafarers, `/vacancies/` should show only:

1. publishable vacancy cards;
2. safe request summaries;
3. a clear action to complete profile if matching is not ready;
4. no employer contact data;
5. no long explanation when there is no data.

If no publishable vacancy exists, the page should guide the seafarer back to profile completion.

### 7.4 AI document extraction readiness

The current document-first upload is the correct direction.

Future AI extraction should:

1. read uploaded documents after malware/document checks;
2. propose field values;
3. mark each proposed value as `suggested_by_ai`;
4. require seafarer confirmation before saving to the profile;
5. require operator review for document-critical fields;
6. keep the original document and extraction audit trail.

### 7.5 Return-from-voyage retention loop

BP-015 should be productized later as:

```text
contract finished / seafarer returns
-> update availability
-> confirm documents still valid
-> select next preferred vessel/contract terms
-> matching-ready again
```

This converts the seafarer path from one-time registration into a recurring cooperation cycle.

## 8. Proposed Next Task

Recommended next implementation-planning task:

```text
CPG-BIZ-089 - Seafarer cabinet next-action dashboard and legacy route consolidation
```

Suggested scope:

1. map `/cabinet/` for seafarers to one clear next computed action;
2. show profile completeness, document status, missing items and operator review status;
3. add a direct link to the exact `/create-profile/` section requiring work;
4. remove or redirect legacy seafarer explanatory routes from the user journey;
5. keep `/vacancies/` functional and data-driven;
6. add tests confirming that seafarer login lands in the personal cabinet and the next action opens the exact working object.

## 9. Conclusion

The seafarer workflow is now coherent enough to continue productizing it around the approved business processes.

The main principle for the next work remains:

```text
page -> business-process stage -> working object -> computed next action -> evidence -> next stage
```

Pages that do not support this chain should be merged, hidden, redirected or moved to documents.
