# CrewPortGlobal - Business Process Documentation Register

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Documentation block: Business processes and operating model
- Document type: Dedicated business-process register
- Format: Markdown
- Version: 3.35
- Status: For internal review

## 1. Purpose

This register creates a separate documentation block for CrewPortGlobal business processes, operating rules, client lifecycle, team work ownership, SLA controls and future AI-agent instructions.

The main CrewPortGlobal documentation register remains the master project register. This business-process register is a dedicated sub-register for documents that describe how the company should operate the service in practice.

## 2. Numbering Rule

Business-process documents use the `BP-###` sequence inside this folder.

This avoids conflict with the already occupied main documentation numbers in:

```text
docs/crewportglobal/00_documentation_register.md
```

The original Issue #11 task referenced a `71_business_declaration...` file name, but main document number 71 is already used by:

```text
71_cpg_user_016_seafarer_cv_workspace_and_document_metadata_report.md
```

For this reason, the approved safe structure for the new block is:

```text
docs/crewportglobal/business_processes/
  00_business_process_register.md
  01_business_declaration_client_lifecycle_and_operating_model.md
  02_role_instructions_for_team_and_ai_agents.md
  03_client_cards_for_employer_demand_and_seafarer_supply_model.md
  04_card_field_dictionary_and_workflow_states.md
  05_personal_cabinet_and_scoped_visibility_requirements.md
  06_scoped_visibility_and_access_check_contract.md
  07_personal_cabinet_ui_layout_and_component_requirements.md
  08_client_registration_and_interaction_procedure.md
	  09_public_site_and_authenticated_navigation_transition_plan.md
	  10_document_upload_storage_and_review_procedure.md
	  11_seafarer_field_dictionary_and_reference_catalog_alignment.md
	  12_crew_formation_service_business_process_manual.md
	  13_crew_formation_operating_instructions_for_users_team_ai.md
	  14_standard_form_lifecycle_and_validation_module.md
	  15_crewportglobal_commercial_operating_cycle.md
	  16_business_process_stage_standard_mapping_matrix.md
```

## 3. Active Business-Process Documents

| BP ID | File | Source task | Status | Purpose |
|---|---|---|---|---|
| BP-001 | `01_business_declaration_client_lifecycle_and_operating_model.md` | GitHub Issue #11 / CPG-BIZ-018 | Drafted for owner review | Business declaration, client lifecycle, Tasks / My clients model, SLA colors, client card automation and working-group operating model |
| BP-002 | `02_role_instructions_for_team_and_ai_agents.md` | GitHub Issue #12 / CPG-BIZ-019 | Drafted for owner review | Role instructions for the six working groups, including Tasks / My clients behavior, client-card updates, SLA colors, handoffs, escalation rules, revenue/no-fee boundaries and AI-agent instructions |
| BP-003 | `03_client_cards_for_employer_demand_and_seafarer_supply_model.md` | GitHub Issue #13 / CPG-BIZ-020 | Drafted for owner review | Practical registration, authentication, authorization and card model for employer-side demand, seafarer-side supply, scoped visibility and reviewed candidate recommendations |
| BP-004 | `04_card_field_dictionary_and_workflow_states.md` | Project Owner approval after BP-003 | Drafted for owner review | Field dictionary, workflow states, events, task triggers and future database/API requirements for the BP-003 card model |
| BP-005 | `05_personal_cabinet_and_scoped_visibility_requirements.md` | Project Owner approval after BP-004 | Drafted for owner review | Personal cabinet assembly and scoped visibility requirements covering cards, tasks, My clients, service areas, action scopes, visibility reasons and future cabinet API requirements |
| BP-006 | `06_scoped_visibility_and_access_check_contract.md` | Project Owner approval after BP-005 | Drafted for owner review | Backend access-check and presentation contract for scoped record visibility, field filtering, allowed actions, audit obligations, AI context limits and collapsible card layout |
| BP-007 | `07_personal_cabinet_ui_layout_and_component_requirements.md` | Project Owner continuation after BP-006 | Drafted for owner review | Personal cabinet UI layout and component requirements covering registration entry, card order, collapsible behavior, badges, forms, empty states, responsive layout and interaction rules |
| BP-008 | `08_client_registration_and_interaction_procedure.md` | Project Owner continuation after BP-007 | Drafted for owner review | Client registration and interaction procedure covering public-site entry, physical person registration, authentication, path selection, seafarer/employer-side flows, team/review interaction and public-to-authenticated navigation transition |
| BP-009 | `09_public_site_and_authenticated_navigation_transition_plan.md` | Project Owner approval after BP-008 | Drafted for owner review | Public site and authenticated navigation transition plan covering public menu simplification, authenticated menu generation, route transition, protected team/admin navigation and implementation phases |
| BP-010 | `10_document_upload_storage_and_review_procedure.md` | GitHub Issue #14 / CPG-DOC-021 | Drafted for owner review | Document upload, protected storage folders, metadata, antivirus scanning, review statuses, scoped visibility, vessel category preparation and implementation decisions required before upload endpoint |
| BP-011 | `11_seafarer_field_dictionary_and_reference_catalog_alignment.md` | Project Owner uploaded seafarer Excel source | Drafted for owner review | Seafarer Excel field dictionary and reference catalog alignment covering workbook sheets, page/card plan, reference dictionaries, future DB/API slices and controlled publication order |
| BP-012 | `12_crew_formation_service_business_process_manual.md` | CPG-BIZ-012 / Document 199 | Drafted for owner review | Controlling end-to-end crew formation service business process from employer demand and seafarer supply to shortlist, candidate presentation, service completion, B2B billing basis and audit evidence |
| BP-013 | `13_crew_formation_operating_instructions_for_users_team_ai.md` | CPG-BIZ-012 / Document 199 | Drafted for owner review | Practical operating instructions for seafarers, employer users, team groups, reviewers, managers, billing, Project Owner and AI agents, including computed task display rules and authority boundaries |
| BP-014 | `14_standard_form_lifecycle_and_validation_module.md` | CPG-BIZ-041 / Document 230 | Approved standard for staged implementation | Standard form lifecycle and validation module covering role-aware draft context, save, autosave, completeness, protected upload, submit-review gate, numbered missing items and computed task integration |
| BP-015 | `15_crewportglobal_commercial_operating_cycle.md` | CPG-BIZ-052 / Document 246 | Drafted for owner review | Full circular commercial operating cycle from marketing and registration to service packages, request processing, embarkation, monthly service evidence, billing, retention and repeat marketing |
| BP-016 | `16_business_process_stage_standard_mapping_matrix.md` | Project Owner instruction after CPG-BIZ-093 | Drafted for owner review | Stage-to-standard mapping matrix connecting commercial and operational process stages with controlling standards, coverage status, gaps and future job-instruction inputs |

## 4. Core Controls Introduced By This Block

This documentation block starts from the following approved business controls:

1. Employers, shipowners and maritime business clients are the primary payers.
2. Seafarers must not be charged recruitment or placement fees.
3. Optional seafarer services may exist only when they are voluntary, clearly separated from employment placement and not a condition for job access.
4. Every specialist must have two working lists: `Tasks` and `My clients`.
5. `Tasks` means client-linked work that requires action now.
6. `My clients` means clients connected to the manager or specialist by responsibility, history, relationship, reward attribution or future sales.
7. Client visibility must be scoped to the responsible manager, current specialist and authorized leaders or controllers.
8. The client card is the source of automation for tasks, deadlines, assignments, handoffs, revenue logic and repeat sales.
9. Deadlines must be visible through color states: green, yellow, red, grey and blue.
10. Each group page and AI-agent instruction must derive from the approved operating model, not from ad hoc manual task creation.
11. AI agents may assist, classify, draft, remind, summarize, check completeness and prepare recommendations, but must not independently make final legal, employment, payment, reward, compliance or client-approval decisions.
12. Registration, authentication and authorization must remain separate: registration creates the physical person card, authentication proves access to the service account, and authorization grants scoped powers and visibility based on group membership, evidence and relationship to specific cards.
13. CrewPortGlobal matching starts from the practical market model: employer-side buyer / demand and seafarer workforce / supply.
14. Card fields, workflow states, task triggers and future APIs must preserve scoped visibility and avoid broad record access caused only by group membership.
15. The personal cabinet must be assembled at runtime from confirmed cards, group memberships, authority evidence, card relationships, assigned tasks and allowed actions.
16. Cabinet presentation must place `Мои задачи` first and always open; all other cards are collapsed by default and open by header click.
17. Personal cabinet UI must render only visible sections, show only allowed actions and keep the working priority on `Мои задачи`.
18. Public pages must provide general information and Login / Registration entry, while functional pages and menus are generated after registration/authentication according to groups, cards, relationships and authority evidence.
19. Public navigation, document navigation, authenticated navigation and admin navigation must be separated before full personal-cabinet implementation.
20. Uploaded documents must be stored only in protected server storage, never in public directories, Git or direct public URLs.
21. Document storage categories must include `seafarer`, `employer` and future `vessel`.
22. Vessel type must be prepared as a reference dictionary because it affects matching, requirements, service complexity and pricing.
23. File upload must enforce allowed formats, size limits, count limits, sha256 hashing and antivirus / malware scanning before review.
24. Document visibility must be scoped to the owner, assigned team member, authorized reviewer/controller and Project Owner when required; broad group membership alone must not reveal documents.
25. Replacement uploads must create a new document record and hide the replaced document from normal user display while preserving audit history according to card/account lifecycle.
26. Seafarer Excel source materials must remain outside Git/public storage when they contain personal example data; only normalized field structures, catalog plans and implementation controls may be recorded in project documentation.
27. Seafarer forms must become dictionary-driven authenticated cabinet cards, not one long static public form.
28. Crew formation work must be documented as an end-to-end process from employer demand to service result and B2B billing basis.
29. Every operational task must be computed from current records, previous-stage result, access rights and assignment relationship.
30. Task cards must show one clear primary operation with an active link to the exact internal working object.
31. Secondary actions and review outcomes must be moved into the working object or contextual menus instead of competing as primary queue actions.
32. Process documentation must be verified against the running application through the describe / verify / correct / test / advance cycle before the next stage is treated as complete.
33. Computed task execution must be verified against group and permission contracts; manager/control-only operations must not be executable by review-team or unrelated groups.
34. Computed task assignment uses active historical executor precedence: if an active employee in the responsible group previously completed an analogous operation for the same object, later tasks for that object and group are assigned to that employee; otherwise the task remains in the group queue.
35. After a review outcome is recorded, the same operation must leave the active computed task queue unless it remains only as a control/blocked record with a clear reason; the next visible task must be computed from the new object state and assigned to the correct group or historical executor.
36. Correction handoff must be verified end to end: `needs_correction` removes the active team task, creates an owner/responsible-party correction task, clears that correction task after resubmission and recomputes the review task for the responsible group or historical active executor.
37. Task computation must start from the information stream and object state: seafarer supply, employer/shipowner demand account, vessel context and crew request/vacancy requirement have separate states, responsible groups, correction routes and final readiness decisions.
38. Demand-side correction handoff must follow the same verified rule: employer/company and crew-request `needs_correction` outcomes remove the active team task, create a clear owner correction task in cabinet, clear it after `/post-vacancy/` resubmission and recompute the next `verification_team` or `review_team` task for the responsible group or historical active executor.
39. All questionnaires must use a save-and-completeness gate: `Save` stores the draft and runs completeness/document checks; `Submit to operator review` becomes active only when required numbered sections, fields and documents are complete, valid and readable; otherwise an owner task must list the numbered sections to complete.
40. Implementation of the save-and-completeness gate must be based on a documented questionnaire inventory: each seafarer, employer, vessel and crew-request form must define numbered sections, save behavior, completeness checks, required document checks, submit-review boundary and owner missing-section tasks before code changes are made.
41. Mandatory fields must be synchronized across supply and demand: one visible `Save / confirm data` action runs completeness checks, field-level autosave must not create review tasks, and any matching-critical field required on one side must have a corresponding required or conditional-required field on the other side before that dimension can be used as a hard matching blocker.
42. The canonical mandatory-field schema in backend code is the implementation source for future completeness checks, frontend required markers, owner missing-section tasks and AI validation prompts; target gaps must remain marked and must not be used as hard blockers until their structured fields exist.
43. Backend completeness checks must use the canonical mandatory-field schema through a read-only API contract before any submit-review state change: completeness responses may report `S/E/V/R` missing fields, required document statuses, unresolved corrections and target URLs, but must not create operator tasks, change review status, change publication status or change document status.
44. The seafarer `/create-profile/` questionnaire must expose one visible `Save / confirm data` action for saving and completeness confirmation; section-level save controls stay hidden from ordinary users, background autosave may preserve draft field changes without review side effects, and backend `S-*` missing items must be displayed with exact section links and field/section highlighting before any operator-review submission is allowed.
45. Protected upload panels must show allowed formats and the 10 MB single-file limit before upload; frontend validation, backend validation and runtime web/PHP upload limits must be aligned, and rejected uploads must show a specific reason instead of a generic failure whenever the system can identify it.
46. All current and future CrewPortGlobal forms must attach to the standard form lifecycle module instead of implementing page-local rules: explicit role/form context, safe draft persistence, backend completeness, protected upload, submit-review gating, correction handoff and computed task creation must follow BP-014.
47. The first shared frontend lifecycle helper has been extracted. Future form pages must reuse the shared missing-item navigation/highlighting and autosave controller instead of copying page-local lifecycle logic.
48. The employer-side `/post-vacancy/` demand form must use the standard lifecycle completeness gate: after `Save / confirm data`, backend `E/V/R` missing items must be shown as exact links to company, vessel, crew-request or upload fields before any future operator-review submission can be enabled.
49. Protected upload behavior must be provided through a shared frontend helper for all current and future forms: allowed formats, 10 MB single-file limit, exact backend upload errors, uploaded-document list rendering and document-correction task rendering must not be reimplemented independently per page.
50. Before programming a new function, the implementer must check the implemented-code standards register; if a canonical implementation exists it must be reused through an adapter, and if no standard exists for a reusable operation a new implemented standard must be created before duplicating logic in multiple code areas.
51. After a successful questionnaire save, backend draft data is the source of truth on reload; browser-local snapshots may restore only newer unsaved edits, and catalog-backed list-valued fields must use structured controls rather than free text when the catalog exists.
52. After a successful protected upload, the UI must show the uploaded filename and refreshed protected-document list; clearing the browser file input is allowed only when the accepted file remains visible in status/list feedback.
53. Finite catalog-backed form fields must use true structured select controls instead of browser datalist text inputs; repeated address blocks should provide an explicit same-address copy option, and form/upload controls must remain readable in both dark and light themes.
54. Evidence-heavy forms must support document-first completion: protected upload should appear immediately after the minimum identity/context block, future AI/OCR extraction may suggest mapped field values only after protected upload and scan, and accepted form data still requires owner confirmation and human review gates.
55. Fixed document-type catalogs must render as a compact human-readable document checklist: one row per document type, hidden hover description, one visible row-level upload/replace button, uploaded filename and processing status under the document name; visible technical document-type dropdowns and separate visible file-picker controls are not the primary user control.
56. Country-code fields must use the approved country catalog through a true select and store comparable ISO alpha-2 values; when a form asks for repeated country values, an explicit copy helper such as `Same as nationality` should be provided where it reduces duplicate user input without hiding the ability to choose a different country.
57. Standard form lifecycle controls exist to support automated request-offer matching: matching-critical fields must be structured, synchronized across supply/demand where applicable, stored as comparable codes or normalized values and kept out of hard-blocker logic until both sides are comparable.
58. Vessel context must not be hidden inside employer authority evidence: vessel flag country, vessel particulars and vessel-related evidence must be collected as vessel-stream data so future matching, blocker explanation and review tasks can distinguish company authority from vessel readiness.
59. CrewPortGlobal must be operated as a circular commercial service cycle: marketing, registration, verification, service package, demand/supply matching, shortlist, employer decision, embarkation evidence, monthly service confirmation, billing, closure and repeat marketing must be connected by records, computed tasks, evidence and audit events.
60. Seafarer / shipowner contracts must use a versioned public master agreement model: fixed clauses are approved once per template version, operational users may select only approved variables, and ordinary generated contract instances do not require new legal drafting unless a clause/version/catalog exception is triggered.
61. Contract instances must be generated through a controlled Contract Agreement Workspace: the parties review and approve the populated agreement with embedded condition fields first, then the system script generates the contract from the approved template, verified seafarer/employer/vessel records and approved workspace values.
62. The master contract must be decomposed into versioned clause IDs and approved variable catalogs before runtime generation; each variable must state whether it is single-choice, multiple-choice, linked-record, computed, date, number, money, controlled text, document reference or signature.
63. The contract workflow must not use a separate user-facing contract questionnaire as the approval object; contract variables must be embedded inside the relevant master-agreement clauses so that parties approve selected terms in legal context.
64. The Contract Agreement Workspace must be treated as a controlled runtime object with explicit workspace statuses, embedded field values, party approvals tied to preview hash, generation guard blockers and audit events before any final contract instance can be generated.
65. Contract workspace database changes must first be prepared as an additive SQL draft outside runtime migrations; no DDL, DML, seed data or runtime migration may be executed until the Project Owner approves the SQL draft and the migration implementation stage separately.
66. Contract workspace values must be source-first: verified seafarer, employer, vessel, crew-request and shortlist/presentation records prefill linked contract facts, while user selection is limited to approved contractual alternatives, controlled exceptions and source-record corrections.
67. Contract workspace SQL approval must reconcile every linked contract fact with an existing verified source record before migration; a contract proposal action must be tied to a concrete vacancy and concrete candidate selection event, not to a generic shipowner card.
68. Contract proposal source identity must include the exact shortlist candidate row when available; `shortlist_candidate_id` is the primary candidate-selection link for future Contract Agreement Workspace creation, while `vacancy_application_id` remains optional supporting evidence.
69. Contract workspace schema migration 018 is now the runtime database foundation for future contract workspace APIs, UI, generation guards and audit events; functional operations remain prohibited until their separate guards and visibility rules are implemented.
70. A shipowner / employer contract proposal must be a computed operation shown on a specific employer-facing candidate presentation after an employer decision to proceed; it must validate access, candidate presentation status, source traceability, duplicate workspace guard and audit evidence before creating or opening a Contract Agreement Workspace.
71. The first runtime contract proposal operation is implemented: employer candidate status `proceed_with_candidate` unlocks guarded `Propose contract` on `/post-vacancy/`, creates or reuses `contract_workspace_instances`, records audit evidence and keeps contract detail, party approval and final generation behind later guards.
72. A Contract Agreement Workspace must open as a concrete working object with source-first prefill from verified seafarer, shipowner, vessel and vacancy records; missing embedded contract fields must be explicit, and the detail view must not generate a contract, request signatures, change employment status or create invoices.
73. Seafarer job-search must be a computed counter-flow from the saved seafarer profile to published verified vacancies: the seafarer may request contract consideration only when matching conditions allow it, and the result must enter the existing controlled `vacancy_applications`, review, employer decision and contract proposal workflow without creating employment status, invoice or unrestricted employer-facing candidate data.
74. A seafarer-initiated `vacancy_applications.submitted_for_human_review` request must compute a visible shipowner task and candidate-selection handoff, but the shipowner may only see safe incoming-request details until team review releases the candidate into the presented-candidate workflow; contract proposal remains blocked until the existing presentation and employer-decision guards pass.

## 5. Intended Use

Documents in this block are intended to become source material for:

1. team training;
2. internal operating procedures;
3. job descriptions;
4. group-specific portal pages;
5. SLA rules;
6. tariff and revenue-distribution policy;
7. manager reward attribution;
8. AI-agent prompt and tool instructions;
9. future database and workflow requirements.

## 6. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 3.37 | 2026-06-05 | GTC IT / AI Assistant | Added CPG-BIZ-106 control for seafarer-initiated request handoff: incoming requests compute shipowner tasks and safe candidate-selection visibility while contract proposal remains guarded until team review |
| 3.36 | 2026-06-05 | GTC IT / AI Assistant | Added CPG-BIZ-105 control for seafarer job-search counter-flow from saved profile to matching published verified vacancies and controlled contract-consideration request |
| 3.35 | 2026-06-05 | GTC IT / AI Assistant | Added CPG-BIZ-102 control for Contract Agreement Workspace detail view, verified source-prefill, missing embedded fields and no-side-effect review boundary |
| 3.34 | 2026-06-05 | GTC IT / AI Assistant | Added CPG-BIZ-101 implementation control for the Shipowners candidate-selection workspace, safe presented-candidate visibility and guarded contract handoff |
| 3.33 | 2026-06-04 | GTC IT / AI Assistant | Added CPG-BIZ-101 planning control for the Shipowners terminology/menu, dedicated candidate-selection workspace and no-raw-profile visibility boundary before contract proposal |
| 3.32 | 2026-06-04 | GTC IT / AI Assistant | Added CPG-BIZ-100 implementation control for employer `proceed_with_candidate`, guarded `Propose contract`, workspace creation/reuse and audit evidence |
| 3.31 | 2026-06-04 | GTC IT / AI Assistant | Added CPG-BIZ-099 control for shipowner candidate review and the guarded `propose_contract` computed operation |
| 3.30 | 2026-06-04 | GTC IT / AI Assistant | Added CPG-BIZ-098D runtime migration control after implementing migration 018 for the contract workspace database foundation |
| 3.29 | 2026-06-04 | GTC IT / AI Assistant | Added CPG-BIZ-098C control: contract proposal must link to the exact shortlist candidate row before runtime schema migration is approved |
| 3.28 | 2026-06-04 | GTC IT / AI Assistant | Added contract SQL source-field reconciliation control requiring field-source mapping and a concrete candidate-selection link before runtime migration approval |
| 3.27 | 2026-06-04 | GTC IT / AI Assistant | Added source-first contract workspace control requiring verified records to prefill contract facts and limiting user choice to actual contractual alternatives or controlled corrections |
| 3.26 | 2026-06-04 | GTC IT / AI Assistant | Added CPG-BIZ-097 contract workspace SQL draft gate requiring additive schema review outside runtime migrations before any DDL/DML execution |
| 3.25 | 2026-06-04 | GTC IT / AI Assistant | Added CPG-BIZ-096 contract workspace object/API/UI control for future workspace implementation planning |
| 3.24 | 2026-06-04 | GTC IT / AI Assistant | Added CPG-BIZ-095 Contract Agreement Workspace control and replaced the separate condition-form model with embedded condition fields in contract context |
| 3.23 | 2026-06-03 | GTC IT / AI Assistant | Added CPG-BIZ-094 master contract clause library and catalog seeding control; user-facing condition-form wording was later superseded by CPG-BIZ-095 workspace model |
| 3.22 | 2026-06-03 | GTC IT / AI Assistant | Added BP-016 stage-to-standard mapping matrix for aligning business-process stages, standards, gaps and future job instructions |
| 3.21 | 2026-06-03 | GTC IT / AI Assistant | Removed internal automation-facing language from contract standard and added an interim condition-form approval procedure later superseded by CPG-BIZ-095 |
| 3.20 | 2026-06-03 | GTC IT / AI Assistant | Added public master contract versioning and immutable clause control standard so legal review applies to template/catalog versions and exceptions, not every ordinary generated contract instance |
| 3.19 | 2026-06-03 | GTC IT / AI Assistant | Added formal document reference rule to BP-014 so regulated UI conditions must link to the controlling document and clause instead of duplicating legal text |
| 3.18 | 2026-06-03 | GTC IT / AI Assistant | Added contract-generation control to BP-012, BP-014 and BP-015, requiring future seafarer/shipowner contract drafts to use platform data, approved catalogs, party review and signature-ready guards |
| 3.17 | 2026-06-03 | GTC IT / AI Assistant | Added pre-contract terms control to BP-012, BP-014, BP-015 and CPG-BIZ-089 report so joining, return, replacement and travel conditions are collected before contract formation and may use `to_be_agreed` only before final agreement |
| 3.16 | 2026-06-03 | GTC IT / AI Assistant | Added voyage, disembarkation, return-support and next-availability controls to BP-012, BP-013 and BP-015 so crew formation covers the full seafarer service cycle after boarding |
| 3.15 | 2026-05-30 | GTC IT / AI Assistant | Added BP-015 commercial operating cycle covering marketing, registration, service packages, request processing, embarkation success, monthly service evidence, billing, retention and repeat marketing as a circular process |
| 3.14 | 2026-05-29 | GTC IT / AI Assistant | Added CPG-BIZ-047 vessel-context rollout control: flag country and vessel evidence are separate V-stream data for matching readiness, not employer authority fields |
| 3.13 | 2026-05-29 | GTC IT / AI Assistant | Updated BP-014 after CPG-BIZ-046 Phase 1: `/post-vacancy/` now applies matching-first catalog controls and shared protected-upload checklist behavior |
| 3.12 | 2026-05-29 | GTC IT / AI Assistant | Added matching-first field synchronization control to BP-014 and the CPG-BIZ-046 rollout task so form standards support automated request-offer matching rather than UI consistency alone |
| 3.11 | 2026-05-29 | GTC IT / AI Assistant | Added country-code catalog select and same-as-nationality copy helper control to the standard form lifecycle |
| 3.10 | 2026-05-29 | GTC IT / AI Assistant | Refined fixed document checklist control to one visible row-level Upload/Replace button that opens file selection and starts upload immediately after file choice |
| 3.9 | 2026-05-29 | GTC IT / AI Assistant | Refined fixed document checklist control from document cards to compact row-level upload list with hidden hover descriptions and no file-input rerender before upload |
| 3.8 | 2026-05-29 | GTC IT / AI Assistant | Added document-checklist control for fixed protected-upload document catalogs and replacement-required states |
| 3.7 | 2026-05-29 | GTC IT / AI Assistant | Added document-first completion control for evidence-heavy forms and future AI/OCR extraction with owner-confirmation boundary |
| 3.6 | 2026-05-29 | GTC IT / AI Assistant | Added finite catalog-select, same-address and form/upload contrast control for lifecycle-enabled questionnaires |
| 3.5 | 2026-05-29 | GTC IT / AI Assistant | Added protected upload success-feedback control requiring uploaded filename and refreshed document list after upload |
| 3.4 | 2026-05-29 | GTC IT / AI Assistant | Added backend-first reload and structured catalog list-field control after `/create-profile/` hard-reload persistence correction |
| 3.3 | 2026-05-29 | GTC IT / AI Assistant | Added mandatory implemented-code standard lookup rule before programming new reusable functions |
| 3.2 | 2026-05-29 | GTC IT / AI Assistant | Added Phase D shared protected upload helper control for reusable validation, status rendering and document task rendering across current and future forms |
| 3.1 | 2026-05-28 | GTC IT / AI Assistant | Added Phase C demand-side lifecycle completeness control for `/post-vacancy/`, including E/V/R missing-item rendering and exact field navigation before future submit-review gating |
| 3.0 | 2026-05-28 | GTC IT / AI Assistant | Added Phase B shared frontend lifecycle helper control after extracting `/create-profile/` missing-item navigation/highlighting and autosave behavior into a reusable module |
| 2.9 | 2026-05-28 | GTC IT / AI Assistant | Added BP-014 standard form lifecycle and validation module for role-aware draft context, reusable save/completeness/upload behavior, submit-review gating and computed task integration across all forms |
| 2.8 | 2026-05-28 | GTC IT / AI Assistant | Added protected-upload limit and diagnostics control: upload panels must show allowed formats / 10 MB limit, runtime limits must match application rules and rejected uploads must expose specific causes |
| 2.7 | 2026-05-28 | GTC IT / AI Assistant | Added Phase 2 `/create-profile/` completeness-gate control: one visible Save / confirm action, hidden section-save controls, backend `S-*` missing-item rendering and highlighted fields/sections before submit-review activation |
| 2.6 | 2026-05-28 | GTC IT / AI Assistant | Added Phase 1 backend completeness analyzer control: read-only `S/E/V/R` completeness responses must drive later Save / Submit behavior without status, task, publication or document side effects |
| 2.5 | 2026-05-28 | GTC IT / AI Assistant | Added Phase 0 implementation control for the canonical mandatory-field schema as source for future completeness checks, frontend markers, owner tasks and AI validation while preserving target gaps from hard matching |
| 2.4 | 2026-05-28 | GTC IT / AI Assistant | Added mandatory-field synchronization control covering one visible Save / confirm action, field-level autosave safety and supply-demand required-field parity for matching-critical dimensions |
| 2.3 | 2026-05-28 | GTC IT / AI Assistant | Added questionnaire inventory implementation-control rule requiring numbered form analysis, explicit Save / Check / Submit behavior and document checks before the save-completeness gate implementation slice |
| 2.2 | 2026-05-28 | GTC IT / AI Assistant | Added standard save-and-completeness gate for all questionnaires, including active Submit to operator review only after required numbered sections, fields and documents pass completeness/readability checks |
| 2.1 | 2026-05-28 | GTC IT / AI Assistant | Added verified demand-side correction handoff control for employer/company and crew-request corrections, owner cabinet visibility, owner resubmission and recomputation for verification/review teams |
| 2.0 | 2026-05-28 | GTC IT / AI Assistant | Added stream-first process-state control for seafarer supply, employer/shipowner demand account, vessel context and crew request/vacancy requirement so task computation can be unified by object state and responsible function |
| 1.9 | 2026-05-28 | GTC IT / AI Assistant | Added verified correction-handoff control: owner correction task visibility, exact source-card link, correction disappearance after resubmission and review-task recomputation for group or historical active executor |
| 1.8 | 2026-05-28 | GTC IT / AI Assistant | Added verified active task recomputation control: completed/correction review outcomes must remove the same active task from team workbench and expose only the next computed task or clear control/blocked record |
| 1.7 | 2026-05-28 | GTC IT / AI Assistant | Added verified post-action completion feedback as a control in BP-012 and BP-013, requiring review workspaces to show recorded operation, object, result and task recomputation guidance |
| 1.6 | 2026-05-27 | GTC IT / AI Assistant | Replaced the group-queue-only assignment boundary with the verified active historical executor or group queue computed assignment rule |
| 1.5 | 2026-05-27 | GTC IT / AI Assistant | Added the verified group-queue assignment boundary and recorded personal task assignment as the next controlled implementation stage |
| 1.4 | 2026-05-27 | GTC IT / AI Assistant | Added role-based computed task execution verification as a core control, covering review-team operational tasks and owner/control-only deletion confirmation |
| 1.3 | 2026-05-27 | GTC IT / AI Assistant | Added the mandatory process-description and application-verification cycle to BP-012 and BP-013, requiring each described stage to be checked in the application, corrected if necessary and tested before moving to the next stage |
| 1.2 | 2026-05-26 | GTC IT / AI Assistant | Added BP-012 crew formation service business-process manual and BP-013 operating instructions for users, team and AI agents, including computed task rules, assignment visibility, process outputs, audit evidence and UI simplification baseline |
| 1.1 | 2026-05-18 | GTC IT / AI Assistant | Added BP-011 seafarer field dictionary and reference catalog alignment covering private Excel source handling, workbook inventory, seafarer workspace card plan, dictionaries, future DB/API slices and publication order |
| 1.0 | 2026-05-17 | GTC IT / AI Assistant | Added BP-010 document upload, protected storage and review procedure covering server-only folders, seafarer/employer/vessel document categories, file limits, antivirus scanning, metadata model, replacement behavior, scoped visibility and implementation decisions before upload endpoint |
| 0.9 | 2026-05-17 | GTC IT / AI Assistant | Added BP-009 public site and authenticated navigation transition plan covering public menu simplification, authenticated menu generation, route transition, protected team/admin navigation and implementation phases |
| 0.8 | 2026-05-17 | GTC IT / AI Assistant | Added BP-008 client registration and interaction procedure covering public-site entry, seafarer/employer-side registration, internal review/support interaction and public-to-authenticated navigation transition |
| 0.7 | 2026-05-17 | GTC IT / AI Assistant | Added BP-007 personal cabinet UI layout and component requirements covering registration entry, collapsible card behavior, badges, forms, empty states, responsive layout and interaction rules |
| 0.6 | 2026-05-17 | GTC IT / AI Assistant | Added BP-006 scoped visibility and access-check contract covering decision inputs/outputs, field filtering, actions, audit, AI context limits and standard collapsible card presentation with `Мои задачи` always open |
| 0.5 | 2026-05-17 | GTC IT / AI Assistant | Added BP-005 personal cabinet and scoped visibility requirements covering runtime cabinet assembly, sections, visibility reasons, action scopes, API requirements and acceptance criteria |
| 0.4 | 2026-05-17 | GTC IT / AI Assistant | Added BP-004 card field dictionary and workflow states covering fields, statuses, events, task triggers, relationships and future database/API requirements |
| 0.3 | 2026-05-17 | GTC IT / AI Assistant | Added BP-003 for employer-side demand and seafarer-side supply card model, registration/authentication/authorization separation, scoped visibility and reviewed candidate recommendation logic |
| 0.2 | 2026-05-16 | GTC IT / AI Assistant | Added BP-002 role instructions for team and AI agents covering six working groups, Tasks / My clients behavior, SLA colors, client-card updates, handoffs, escalation and AI boundaries |
| 0.1 | 2026-05-16 | GTC IT / AI Assistant | Created separate business-process documentation register and registered BP-001 for CPG-BIZ-018 |
