# GTC Project Delivery Standard - Register

- Owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Scope: cross-project delivery methodology for GTC web/application projects
- Document type: Methodology register
- Version: 0.3
- Date: 2026-07-08
- Status: Baseline package created for Project Owner review

## 1. Purpose

This register tracks the reusable project-delivery standards extracted from the CrewPortGlobal implementation experience.

The standards in this section are not CrewPortGlobal product documents. They define the repeatable way GTC should start, build, publish, document, test and fix future projects.

## 2. Current Documents

| Document | Title | Purpose | Status |
|---|---|---|---|
| `01_gtc_std_001_project_delivery_and_ai_collaboration_task.md` | GTC-STD-001 - Project Delivery And AI Collaboration Standard Task | Task to create the first cross-project methodology package for domain setup, publication, development, documentation, verification, fixation and Project Owner / AI agent collaboration. | Baseline package created |
| `02_project_initiation_and_domain_setup.md` | GTC-STD-002 - Project Initiation And Domain Setup Standard | Domain, DNS, SSL, nginx/public root, source root, ownership, backup and rollback startup rules. | Baseline standard |
| `03_project_structure_and_publication_model.md` | GTC-STD-003 - Project Structure And Publication Model | Repository layout, public source/live root, public documents hub and one-public-document rule. | Baseline standard |
| `04_business_process_first_development.md` | GTC-STD-004 - Business-Process-First Development Standard | Participant, business object, task, evidence and next-stage model for application work. | Baseline standard |
| `05_task_definition_and_fixation_standard.md` | GTC-STD-005 - Task Definition And Fixation Standard | Task/report format, verification, artifact cleanup, git commit and final report rules. | Baseline standard |
| `06_ai_agent_collaboration_standard.md` | GTC-STD-006 - AI Agent Collaboration Standard | Project Owner / AI agent responsibilities, context refresh, clarification boundary and memory rules. | Baseline standard |
| `07_documentation_register_and_memory_standard.md` | GTC-STD-007 - Documentation Register And Memory Standard | Registers, numbering, task/report relation, revision history and handoff memory. | Baseline standard |
| `08_frontend_navigation_and_page_publication_standard.md` | GTC-STD-008 - Frontend Navigation And Page Publication Standard | Action-first pages, shared header/navigation, document hub, translation and visual checks. | Baseline standard |
| `09_testing_deploy_and_release_standard.md` | GTC-STD-009 - Testing, Deploy And Release Standard | Verification scale, public deploy script pattern, live smoke checks, rollback and artifacts. | Baseline standard |
| `10_security_access_and_authority_standard.md` | GTC-STD-010 - Security, Access And Authority Standard | Personal account, role/permission, admin access, representative authority, notification and secret rules. | Baseline standard |
| `11_lessons_from_crewportglobal.md` | GTC-STD-011 - Lessons From CrewPortGlobal | Reusable lessons and proven patterns from the CrewPortGlobal implementation. | Baseline knowledge transfer |
| `12_new_project_bootstrap_templates_and_starter_kit.md` | GTC-STD-012 - New Project Bootstrap Templates And Starter Kit | Reusable templates for project docs, tasks, reports, app operations docs, AI startup and definition-of-done checklists. | Baseline starter kit |

## 3. Source Experience

Primary source project:

```text
CrewPortGlobal
```

Key source documents and standards:

1. `docs/crewportglobal/21_operational_checklist_domain_dns_ssl_publication.md`
2. `docs/crewportglobal/60_translation_pipeline_rule.md`
3. `docs/crewportglobal/119_cpg_deploy_001_public_live_sync_automation_report.md`
4. `docs/crewportglobal/120_cpg_deploy_002_public_live_systemd_timer_activation_report.md`
5. `docs/crewportglobal/326_cpg_project_memory_handoff_refresh_after_chat_review.md`
6. `docs/crewportglobal/business_processes/15_crewportglobal_commercial_operating_cycle.md`
7. `docs/crewportglobal/business_processes/16_business_process_stage_standard_mapping_matrix.md`
8. `docs/crewportglobal/implemented_code_standards/00_implemented_code_standards_register.md`
9. `docs/ops/governance-standard.md`
10. `docs/ops/storage-architecture-standard.md`

## 4. Methodology Direction

The GTC project-delivery standard should preserve these working principles:

1. action-first application design, not brochure-first websites;
2. business-process-first development;
3. one canonical public URL for each public document;
4. shared header/navigation/publication components;
5. documentation registers and implementation reports;
6. explicit standards before broad replication;
7. verification before publication;
8. clean generated artifacts before commit;
9. git fixation after approved repository changes;
10. Project Owner and AI agent collaboration rules.

## 5. Template Starter Kit

Reusable templates live in:

```text
docs/gtc_project_delivery_standard/templates/
```

Template groups:

1. `project_docs/` - documentation register, scope, domain/publication, business process, memory and implemented-code standards templates;
2. `task_docs/` - task, implementation report, standard, public-page publication report and deploy/release report templates;
3. `app_ops/` - `APP.md`, `DEPLOY.md`, `STORAGE.md`, `RUNBOOK.md` templates;
4. `checklists/` - AI startup, definition of done, live publication and new directory layout checklists.

## 6. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.3 | 2026-07-08 | GTC IT / AI Assistant | Added GTC-STD-012 and starter kit templates for new project bootstrap |
| 0.2 | 2026-07-08 | GTC IT / AI Assistant | Added baseline GTC-STD-002..011 standards transferring significant CrewPortGlobal project-delivery experience for future projects |
| 0.1 | 2026-07-08 | GTC IT / AI Assistant | Initial register for cross-project delivery methodology |
