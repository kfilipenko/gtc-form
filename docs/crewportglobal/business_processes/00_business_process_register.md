# CrewPortGlobal - Business Process Documentation Register

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Documentation block: Business processes and operating model
- Document type: Dedicated business-process register
- Format: Markdown
- Version: 1.1
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
