# GTC-STD-006 - AI Agent Collaboration Standard

- Owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Scope: collaboration between Project Owner and AI implementation agent
- Version: 0.1
- Date: 2026-07-08
- Status: Baseline standard extracted from CrewPortGlobal

## 1. Purpose

This standard defines how the Project Owner and AI agent should work together on complex projects.

The goal is to preserve context, avoid repeated mistakes and turn discussions into controlled project progress.

## 2. Project Owner Responsibilities

The Project Owner:

1. defines business goals;
2. explains practical process logic;
3. approves sensitive standards and legal/process boundaries;
4. tests live pages and gives concrete feedback;
5. decides when discussion becomes a task;
6. confirms when a process is accepted.

## 3. AI Agent Responsibilities

The AI agent:

1. reads current standards before implementation;
2. checks for existing documents before creating new ones;
3. avoids duplicate public documents;
4. prefers existing project patterns over new local inventions;
5. implements when the Project Owner asks to proceed;
6. updates registers and memory when relevant;
7. runs verification;
8. cleans generated artifacts;
9. commits completed repository changes;
10. reports exact links, tests and commit hash.

## 4. Context Refresh Rule

Before meaningful implementation, the AI agent should refresh:

1. project register;
2. current memory/handoff document;
3. relevant business-process documents;
4. relevant implemented-code standards;
5. current git status;
6. affected source files.

This is mandatory when the task touches:

1. contracts;
2. authority/access;
3. publication rules;
4. business-process routing;
5. shared components;
6. public legal documents;
7. deployment.

## 5. Clarification Boundary

The AI agent should ask questions when:

1. legal/business choice cannot be inferred;
2. multiple implementation paths have materially different consequences;
3. the requested action conflicts with an approved standard;
4. credentials/secrets/production risk require explicit direction.

The AI agent should proceed without excessive questions when:

1. the Project Owner has approved the task;
2. the repository already contains an established pattern;
3. the change is mechanical and low risk;
4. verification can confirm the result.

## 6. Discussion-To-Task Rule

When the Project Owner says " пока обсуждаем" or equivalent, do not change runtime code unless later approved.

During discussion:

1. analyze options;
2. name risks;
3. propose a standard/process;
4. identify implementation task boundaries;
5. wait for approval before programming.

When the Project Owner says to proceed, implement end to end.

## 7. Memory Rule

Important accepted decisions should be recorded in:

1. task/standard document;
2. documentation register;
3. project memory/handoff document when the decision affects future work.

Memory should capture:

1. what was decided;
2. why it matters;
3. current canonical file or route;
4. next recommended work.

## 8. Final Answer Rule

The AI agent final answer should include:

1. result;
2. links;
3. verification;
4. commit hash;
5. unresolved issue only if relevant.

The Project Owner should not need to read terminal output to know what happened.

## 9. Acceptance Criteria

Collaboration is working when:

1. the AI agent remembers standards through documentation, not only chat;
2. Project Owner decisions become durable tasks or standards;
3. implementation reports explain what changed;
4. public links and tests are reported;
5. future sessions can resume from documents.

## 10. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-08 | GTC IT / AI Assistant | Initial AI agent collaboration standard |
