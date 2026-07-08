# GTC-STD-001 - Project Delivery And AI Collaboration Standard Task

- Owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Initiator: Project Owner
- Document type: Cross-project methodology task
- Version: 0.1
- Date: 2026-07-08
- Status: Baseline package created for Project Owner review
- Source experience: CrewPortGlobal implementation cycle

## 1. Purpose

Create a reusable GTC standard for starting, building, publishing, documenting, verifying and maintaining future web/application projects.

The standard must preserve the practical experience gained during CrewPortGlobal:

```text
domain and publication setup
-> project structure
-> business-process model
-> page and workflow implementation
-> documentation and registers
-> AI agent collaboration
-> verification
-> publication
-> git fixation
-> continuation memory
```

The goal is to prevent future projects from starting from a blank page and to keep the working discipline that helped CrewPortGlobal become an action-first international maritime application.

## 2. Scope

The standard applies to future GTC projects that require:

1. a domain or subdomain;
2. public pages;
3. legal/documents publication;
4. authenticated application functions;
5. business-process automation;
6. AI-assisted development;
7. documentation registers;
8. production deployment or live publication;
9. repeated collaboration between the Project Owner and AI agent.

## 3. Source Lessons From CrewPortGlobal

The CrewPortGlobal work produced repeatable practices:

1. pages must be connected to a business process, participant, task, object and evidence;
2. public documents must have one canonical publication location;
3. long internal discussion must be converted into tasks, standards, implementation reports and memory handoff;
4. shared header/navigation components prevent inconsistent page-by-page edits;
5. role menus must lead to real executable workspaces;
6. public documents, contracts and policies should live in a controlled documents hub;
7. i18n, publication and smoke checks must be part of release, not an afterthought;
8. code changes require verification and clean artifact handling;
9. the Project Owner's decisions must be recorded in documentation;
10. the AI agent must refresh standards before implementation and must not invent a new local pattern when a project standard already exists.

## 4. Proposed Methodology Package

The first implementation of the GTC standard created these documents.

| Proposed document | Purpose |
|---|---|
| `02_project_initiation_and_domain_setup.md` | Domain, DNS, SSL, nginx/public root, source root, ownership, backups and launch checklist. |
| `03_project_structure_and_publication_model.md` | Repository layout, public source, live root, legal/documents hub, one public URL per document and no-duplicate-publication rule. |
| `04_business_process_first_development.md` | Rule that pages and functions are derived from participant, business stage, working object, task, evidence and next stage. |
| `05_task_definition_and_fixation_standard.md` | How to write tasks, implementation reports, acceptance criteria, verification evidence, clean artifacts and git commits. |
| `06_ai_agent_collaboration_standard.md` | Working rules for Project Owner and AI agent: context refresh, standards reading, autonomy, clarification boundaries, memory updates and final reports. |
| `07_documentation_register_and_memory_standard.md` | Register numbering, version history, task/report relationship, handoff memory and cross-project continuity. |
| `08_frontend_navigation_and_page_publication_standard.md` | Shared header/navigation, participant landing pages, document hub, page translations, visual review and mobile checks. |
| `09_testing_deploy_and_release_standard.md` | Syntax checks, unit/API tests, i18n checks, deploy script, live smoke checks, screenshots and rollback notes. |
| `10_security_access_and_authority_standard.md` | Authentication, admin access, authority evidence, role/permission controls and protected operations. |
| `11_lessons_from_crewportglobal.md` | Practical lessons and examples showing how the methodology was proven in a real project. |

## 5. Operating Principles To Fix

### 5.1 Project Owner Role

The Project Owner:

1. sets the business goal;
2. approves standards and sensitive legal/process decisions;
3. tests live pages and gives practical feedback;
4. decides when discussion becomes an implementation task;
5. confirms when a process or publication is accepted.

### 5.2 AI Agent Role

The AI agent:

1. reads relevant standards before changing code;
2. checks for existing documents before creating new ones;
3. avoids duplicate publication;
4. implements after approval when the user asks to proceed;
5. updates documentation and registers where relevant;
6. runs focused verification;
7. cleans generated artifacts;
8. commits changes when repository files are changed and the task is complete;
9. reports exact links, tests and commit hash.

### 5.3 Fixation Meaning

For GTC projects, "fixation" must mean:

```text
decision recorded
+ relevant documentation/register updated
+ code or content changed if needed
+ verification run
+ generated artifacts cleaned
+ repository committed
+ final links/results reported
```

If a task is discussion-only, fixation means recording the approved task/standard without runtime code changes.

### 5.4 Publication Meaning

Publication must mean:

1. source files changed in the repository;
2. public/live root updated by the approved deploy path;
3. public URL checked by HTTP;
4. page content checked for main expected text/link;
5. navigation or hub link checked where relevant;
6. any public-document rule respected.

## 6. Required Source Inputs

The first standard package should explicitly reference and adapt:

1. `docs/ops/governance-standard.md`;
2. `docs/ops/storage-architecture-standard.md`;
3. `docs/crewportglobal/21_operational_checklist_domain_dns_ssl_publication.md`;
4. `docs/crewportglobal/60_translation_pipeline_rule.md`;
5. `docs/crewportglobal/119_cpg_deploy_001_public_live_sync_automation_report.md`;
6. `docs/crewportglobal/120_cpg_deploy_002_public_live_systemd_timer_activation_report.md`;
7. `docs/crewportglobal/326_cpg_project_memory_handoff_refresh_after_chat_review.md`;
8. `docs/crewportglobal/business_processes/15_crewportglobal_commercial_operating_cycle.md`;
9. `docs/crewportglobal/business_processes/16_business_process_stage_standard_mapping_matrix.md`;
10. `docs/crewportglobal/implemented_code_standards/00_implemented_code_standards_register.md`.

## 7. Deliverables

The task is complete when:

1. the cross-project methodology directory exists;
2. the methodology register exists;
3. this task is approved or revised by the Project Owner;
4. after approval, the proposed standard documents are created;
5. the standards are written as reusable GTC rules, not as CrewPortGlobal-only reports;
6. the CrewPortGlobal examples are included only as evidence/examples;
7. verification and git fixation rules are explicitly documented;
8. future projects can start by copying/adapting the standard package.

## 8. Acceptance Criteria For This Task Document

This task document is acceptable when it:

1. defines the purpose of a cross-project standard;
2. explains why CrewPortGlobal experience is reusable;
3. lists the future methodology documents to create;
4. defines Project Owner and AI agent responsibilities;
5. defines fixation and publication rules;
6. avoids changing CrewPortGlobal runtime behavior;
7. is committed with the methodology register.

## 9. Open Questions For Project Owner

Before implementation of the full package, decide:

1. Should this standard be named `GTC Project Delivery Standard` or `GTC AI-Assisted Project Delivery Standard`?
2. Should the section remain in `docs/gtc_project_delivery_standard/` or move to `docs/ops/` after approval?
3. Should the future standard include reusable templates for new projects, such as `APP.md`, `DEPLOY.md`, public legal hub and documentation register skeletons?
4. Should the methodology become mandatory for every new GTC domain, or only for complex application projects?

## 10. Proposed Next Step

Suggested follow-up after Project Owner review of the baseline package:

```text
GTC-STD-012 - Create reusable templates for new project bootstrap
```

The next task should create reusable templates for `APP.md`, `DEPLOY.md`, `STORAGE.md`, `RUNBOOK.md`, documentation register, public legal hub and project memory handoff.

## 11. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.2 | 2026-07-08 | GTC IT / AI Assistant | Marked baseline package as created and aligned document list with GTC-STD-002..011 |
| 0.1 | 2026-07-08 | GTC IT / AI Assistant | Initial cross-project delivery and AI collaboration standard task |
