# GTC-STD-011 - Lessons From CrewPortGlobal

- Owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Scope: reusable lessons from CrewPortGlobal for future GTC projects
- Version: 0.1
- Date: 2026-07-08
- Status: Baseline knowledge transfer

## 1. Purpose

This document records the project lessons that should influence future GTC work.

It is not a CrewPortGlobal product description. It is a memory transfer from a real complex implementation cycle.

## 2. Main Lesson

The strongest result came when the project stopped being treated as a website and started being treated as a controlled application.

The working direction became:

```text
participant
-> business object
-> stage
-> task
-> evidence
-> next action
```

This is the core pattern to reuse.

## 3. What Worked

### 3.1 Standards Before Repetition

When a pattern became reusable, we wrote a standard:

1. form lifecycle;
2. protected upload;
3. submit-review gate;
4. agent assignment;
5. contract workspace;
6. public document publication;
7. navigation/header sharing.

This prevented page-local one-off logic.

### 3.2 Business Process Mapping

Mapping pages to process stages exposed weak pages and missing routes.

The useful question was:

```text
What task does this page perform, for whom, on which object, with what evidence?
```

### 3.3 One Canonical Public Document

Public legal/operational documents became manageable only after the rule:

```text
one full public document -> one public URL
```

Other pages link to the document instead of duplicating it.

### 3.4 Shared Navigation

Shared header/navigation stopped repeated page-by-page fixes.

Future projects should build shared page chrome early.

### 3.5 Owner Testing

The Project Owner's visual and process review caught real problems:

1. unreadable headings;
2. missing links;
3. confusing menu hierarchy;
4. wrong publication place;
5. shallow contract text;
6. process mismatch.

Project Owner review should be treated as product verification, not interruption.

### 3.6 Fixation Discipline

The project became stable when "done" meant:

```text
docs updated
+ tests run
+ live checked when public
+ artifacts cleaned
+ commit made
```

## 4. What To Avoid

Future projects should avoid:

1. creating pages before defining the business process;
2. publishing internal markdown as public contract text;
3. duplicating legal documents in multiple routes;
4. editing shared headers manually on separate pages;
5. skipping live deploy after source changes;
6. relying on UI hiding without backend guards;
7. leaving decisions only in chat;
8. committing generated reports by accident;
9. using stale smoke-test markers;
10. starting implementation before standards are refreshed.

## 5. Reusable Patterns

| Pattern | Reuse |
|---|---|
| Documentation register | Every complex project |
| Memory handoff | Long-running projects and context resets |
| Business-process matrix | Workflow/application projects |
| Implemented-code standards register | Projects with repeated code patterns |
| Public legal/documents hub | Projects with terms, policies, contracts or standards |
| Public deploy script | Static/public frontend publication |
| Live smoke checks | Every public deploy |
| Agent/representative authority model | Any project where one party acts for another |
| One-active-manager rule | Delegated operational control |
| Participant notification ledger | Important authority/document/stage events |

## 6. Suggested Start For New Project

For the next complex project, start with:

1. create project directory;
2. create documentation register;
3. create project scope and positioning;
4. create domain/DNS/SSL/publication checklist;
5. define participants;
6. define first business process;
7. define public document hub if legal/trust content exists;
8. create shared header/navigation early;
9. create deploy/smoke path before public review;
10. use fixation rule from the first task.

## 7. CrewPortGlobal Evidence

The working proof is recorded in:

1. `docs/crewportglobal/326_cpg_project_memory_handoff_refresh_after_chat_review.md`;
2. `docs/crewportglobal/business_processes/15_crewportglobal_commercial_operating_cycle.md`;
3. `docs/crewportglobal/business_processes/16_business_process_stage_standard_mapping_matrix.md`;
4. `docs/crewportglobal/implemented_code_standards/00_implemented_code_standards_register.md`;
5. `docs/crewportglobal/342_cpg_biz_139_portal_overview_publication_report.md`.

## 8. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-08 | GTC IT / AI Assistant | Initial reusable lessons transfer from CrewPortGlobal |
