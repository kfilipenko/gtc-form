# AI Agent Project Startup Checklist

- Project: <PROJECT_NAME>
- Date: <DATE>

Before changing code or public content, the AI agent should complete this checklist.

## 1. Context

1. Read project documentation register.
2. Read project memory handoff.
3. Read project scope/positioning.
4. Read publication model.
5. Read relevant business-process documents.
6. Read relevant implemented-code standards.

## 2. Repository State

```bash
git status --short
```

Confirm:

1. worktree state is understood;
2. unrelated user changes will not be reverted;
3. generated artifacts are noted.

## 3. Runtime/Public Context

Record:

| Item | Value |
|---|---|
| Source root | `<SOURCE_ROOT>` |
| Public source | `<PUBLIC_SOURCE>` |
| Live root | `<LIVE_ROOT>` |
| Public URL | `<PUBLIC_BASE_URL>` |
| Deploy command | `<command>` |

## 4. Task Boundary

Before implementation, identify:

1. user request;
2. business process/stage;
3. participant/actor;
4. working object;
5. source standard;
6. acceptance criteria;
7. verification plan.

## 5. Implementation Guard

Do not proceed if:

1. request conflicts with approved standard;
2. public document would be duplicated;
3. secrets would be exposed;
4. destructive operation is ambiguous;
5. legal/process choice needs Project Owner approval.

## 6. Finalization

At task end:

1. update docs/registers;
2. run verification;
3. clean artifacts;
4. commit;
5. report links/tests/commit.
