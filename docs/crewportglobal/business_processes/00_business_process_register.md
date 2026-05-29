# CrewPortGlobal - Business Process Documentation Register

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Documentation block: Business processes and operating model
- Document type: Dedicated business-process register
- Format: Markdown
- Version: 3.2
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
