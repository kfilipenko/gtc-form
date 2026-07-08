# GTC-STD-004 - Business-Process-First Development Standard

- Owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Scope: application features, pages and workflow automation
- Version: 0.1
- Date: 2026-07-08
- Status: Baseline standard extracted from CrewPortGlobal

## 1. Purpose

This standard prevents projects from becoming a collection of disconnected pages.

Every significant page or feature should be derived from a business process:

```text
business stage
-> participant
-> working object
-> task
-> evidence
-> next stage
```

## 2. Operating Principle

A page is justified only when it does at least one of these things:

1. lets a participant perform a real task;
2. shows a controlled task or blocker;
3. creates or updates a business object;
4. records evidence or approval;
5. publishes a canonical public document;
6. supports trust, compliance or legally significant consent.

Pure descriptive pages should be merged, shortened, moved into a documents hub or removed from the primary application journey.

## 3. Participant Model

Before implementing a feature, identify:

1. who the participant is;
2. whether they act personally or through a representative;
3. which object they may see;
4. which object they may edit;
5. which action they may perform;
6. what evidence is required;
7. who receives the next task.

Example participant classes:

1. physical person;
2. customer/user;
3. business owner/employer;
4. agent/representative;
5. internal reviewer;
6. administrator/control role;
7. billing/commercial role.

## 4. Computed Task Model

Application work should be surfaced as computed tasks:

```text
information stream
-> working object
-> object state
-> process stage
-> managing participant / assignment
-> responsible group or owner role
-> required permission
-> visible task
-> exact working object link
```

Tasks should not point to generic lists when the next action belongs to a specific object.

## 5. Task Card Requirements

A task card should show:

1. primary operation;
2. safe object summary;
3. process stage;
4. responsible role/group;
5. current blocker or allowed action;
6. exact working object link;
7. status after completion.

Recommended title pattern:

```text
{Stage action}. ({Object type}: {safe object summary}.)
```

## 6. Evidence Rule

Each process stage must define evidence.

Examples:

| Stage | Evidence |
|---|---|
| Registration | account record, email confirmation, role/capacity selection |
| Profile/data intake | saved structured fields, completeness result |
| Document upload | protected file metadata, scan/review state |
| Review | reviewer decision, correction reason, audit record |
| Matching | comparison result, blockers, human review |
| Contract preparation | template, source records, embedded fields, preview hash |
| Authority assignment | agreement/authority document, acceptance, notification |
| Publication | source file, live URL, smoke checks |

## 7. Standard Before Broad Rollout

If a feature pattern will be reused, create or update a standard before broad rollout.

Examples:

1. form lifecycle;
2. protected upload;
3. submit-review gate;
4. contract workspace;
5. authority/agent appointment;
6. public document publication.

## 8. Acceptance Criteria

A business-process feature is ready when:

1. process stage is identified;
2. participant and permission model are known;
3. working object is clear;
4. task and action are exact;
5. evidence/audit record is defined;
6. next stage is known;
7. UI route opens the correct object, not a generic page;
8. documentation maps the feature to the process.

## 9. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-08 | GTC IT / AI Assistant | Initial business-process-first development standard |
