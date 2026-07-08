# GTC-STD-007 - Documentation Register And Memory Standard

- Owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Scope: project documentation, registers, memory handoff and numbering
- Version: 0.1
- Date: 2026-07-08
- Status: Baseline standard extracted from CrewPortGlobal

## 1. Purpose

This standard defines how project knowledge becomes durable.

The goal is to prevent important decisions from living only in chat or in scattered implementation files.

## 2. Required Documentation Blocks

For complex projects, create:

```text
docs/<project>/
  00_documentation_register.md
  <numbered task/report/standard docs>
  business_processes/
  implemented_code_standards/
  sql_drafts/
  memory_or_handoff.md
```

For cross-project standards, create:

```text
docs/<standard_area>/
  00_<area>_register.md
  <numbered standards/tasks/reports>
```

## 3. Register Rule

A register should include:

1. project/area name;
2. owner;
3. scope;
4. version;
5. status;
6. document list;
7. source standards;
8. revision history.

When a new significant document is created, update the register in the same slice.

## 4. Numbering Rule

Use stable numbering and do not reuse occupied numbers.

If a numbering conflict is discovered:

1. keep the stronger governance/source document stable;
2. move the newer implementation/report forward;
3. record the reason if confusion is likely.

## 5. Task/Report Relationship

Use task documents for intended work.

Use implementation reports for completed work.

Recommended relation:

```text
task -> implementation report -> register revision -> memory update when needed
```

## 6. Memory Handoff Rule

Create or update a memory/handoff document when:

1. project direction changes;
2. a new standard is accepted;
3. a contract/process model is settled;
4. public publication rule changes;
5. next-session context would otherwise be hard to recover.

Memory handoff should record:

1. current product direction;
2. canonical source documents;
3. active standards;
4. current implementation state;
5. next recommended work;
6. important boundaries and warnings.

## 7. Public Versus Internal Docs

Internal docs may be detailed, draft-like and technical.

Public docs must be:

1. canonical;
2. clearly versioned;
3. linked from public hub;
4. free from raw internal paths unless intentionally disclosed;
5. consistent with current legal/process position.

## 8. Revision History Rule

Each important document should include revision history.

Revision history should state:

1. version;
2. date;
3. author/team;
4. material change.

## 9. Acceptance Criteria

Documentation is healthy when:

1. a newcomer can find the current standard;
2. the register shows current documents;
3. decisions are not trapped in chat;
4. public documents have canonical routes;
5. implementation reports link to tests and affected files;
6. memory handoff supports continuation.

## 10. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-08 | GTC IT / AI Assistant | Initial documentation register and memory standard |
