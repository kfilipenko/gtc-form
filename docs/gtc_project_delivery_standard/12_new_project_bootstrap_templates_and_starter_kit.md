# GTC-STD-012 - New Project Bootstrap Templates And Starter Kit

- Owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Scope: reusable bootstrap templates for new GTC projects
- Version: 0.1
- Date: 2026-07-08
- Status: Baseline starter kit

## 1. Purpose

This standard provides the starter kit for new GTC projects.

The goal is to let a new project begin with the same discipline that CrewPortGlobal reached after many iterations:

```text
project structure
-> documentation register
-> domain/publication plan
-> business-process model
-> task/report templates
-> app operations docs
-> AI startup checklist
-> definition of done
```

## 2. Template Location

Templates live in:

```text
docs/gtc_project_delivery_standard/templates/
```

The templates are intentionally plain Markdown. They are copied and adapted into a project-specific documentation area.

## 3. Template Groups

### 3.1 Project Documentation Templates

```text
templates/project_docs/00_documentation_register.template.md
templates/project_docs/01_project_scope_and_positioning.template.md
templates/project_docs/02_domain_dns_ssl_publication_checklist.template.md
templates/project_docs/03_business_process_register.template.md
templates/project_docs/04_publication_model.template.md
templates/project_docs/05_project_memory_handoff.template.md
templates/project_docs/06_implemented_code_standards_register.template.md
```

### 3.2 Task Documentation Templates

```text
templates/task_docs/task.template.md
templates/task_docs/implementation_report.template.md
templates/task_docs/standard.template.md
templates/task_docs/public_page_publication_report.template.md
templates/task_docs/deploy_release_report.template.md
```

### 3.3 Application Operations Templates

```text
templates/app_ops/APP.template.md
templates/app_ops/DEPLOY.template.md
templates/app_ops/STORAGE.template.md
templates/app_ops/RUNBOOK.template.md
```

### 3.4 Checklists

```text
templates/checklists/ai_agent_project_startup_checklist.template.md
templates/checklists/definition_of_done.template.md
templates/checklists/live_publication_checklist.template.md
templates/checklists/new_project_directory_layout.template.md
```

## 4. Recommended New Project Bootstrap

For a new project named `<project>`:

1. create source structure:

```text
projects/<project>/
  public/
  app/
  deploy/
  scripts/
```

2. create documentation structure:

```text
docs/<project>/
  00_documentation_register.md
  business_processes/
  implemented_code_standards/
  sql_drafts/
```

3. copy project documentation templates into `docs/<project>/`;
4. copy app operations templates into `docs/apps/<project>/`;
5. fill project name, owner, domain and roots;
6. define first business process before building pages;
7. define public documents hub if public policies/contracts are required;
8. create deploy/smoke path before live review;
9. use the definition of done from the first task.

## 5. Required Placeholders

Templates use these placeholders:

```text
<PROJECT_NAME>
<PROJECT_CODE>
<PROJECT_OWNER>
<COMPANY_NAME>
<DOMAIN>
<PUBLIC_BASE_URL>
<SOURCE_ROOT>
<PUBLIC_SOURCE>
<LIVE_ROOT>
<APP_NAME>
<DATE>
<STATUS>
```

Replace placeholders before a document becomes active.

## 6. Starter Kit Rule

The starter kit is not a substitute for project-specific thinking.

It provides:

1. structure;
2. checklists;
3. governance fields;
4. default acceptance criteria;
5. reusable wording for repeatable operations.

Each new project must still define:

1. business goal;
2. participants;
3. legal/commercial boundaries;
4. data model;
5. publication rules;
6. security/access rules.

## 7. Acceptance Criteria

The starter kit is usable when:

1. a new project can create docs and app ops files from templates;
2. Project Owner and AI agent have a startup checklist;
3. definition of done is available from day one;
4. domain/publication/checklist rules are present before go-live;
5. task/report/standard templates support fixation;
6. app ops templates include governance fields required by `docs/ops/governance-standard.md`.

## 8. Next Work

Future refinements may add:

1. a script that copies templates into a new project folder;
2. a template validation command;
3. a new-project checklist in the AI agent startup flow;
4. reusable static public legal hub skeleton;
5. reusable deploy script skeleton.

## 9. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-08 | GTC IT / AI Assistant | Initial new project bootstrap templates and starter kit standard |
