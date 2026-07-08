# GTC-STD-005 - Task Definition And Fixation Standard

- Owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Scope: task writing, implementation reports, verification and git fixation
- Version: 0.1
- Date: 2026-07-08
- Status: Baseline standard extracted from CrewPortGlobal

## 1. Purpose

This standard defines how GTC turns discussion into durable project work.

The goal is to make every meaningful change traceable:

```text
discussion
-> task
-> implementation
-> verification
-> documentation/register update
-> commit
-> final report
```

## 2. Task Document

A task document should contain:

1. title and task code;
2. owner/source instruction;
3. business purpose;
4. current context;
5. scope;
6. out-of-scope items;
7. source standards;
8. implementation requirements;
9. acceptance criteria;
10. verification plan;
11. revision history.

## 3. Implementation Report

An implementation report should contain:

1. source task;
2. what changed;
3. files changed;
4. runtime routes/API endpoints affected;
5. database/schema changes if any;
6. documentation updated;
7. verification commands and results;
8. known gaps and next work;
9. commit reference after fixation when available.

## 4. Meaning Of Fixation

For GTC projects, "fixation" means:

```text
decision recorded
+ documentation/register updated
+ code/content changed if needed
+ verification run
+ generated artifacts cleaned
+ repository committed
+ final result reported
```

If a task is discussion-only, fixation means recording the approved task, standard or decision without runtime code changes.

## 5. Commit Rule

When repository files are changed and the task is complete:

1. run focused verification;
2. clean generated artifacts;
3. check `git diff --check`;
4. inspect `git status --short`;
5. commit with a clear message;
6. report commit hash.

Do not include unrelated user changes or generated reports unless they are part of the task.

## 6. Generated Artifact Rule

Generated artifacts should not be committed unless explicitly required.

Examples to clean or restore:

1. Playwright reports;
2. temporary screenshots;
3. test traces;
4. local caches;
5. one-off diagnostics.

If generated artifacts are part of a release package, document why they are committed.

## 7. Verification Scale

Verification should match risk:

| Change type | Minimum verification |
|---|---|
| Markdown-only documentation | `git diff --check`, link/name search where useful |
| Static HTML/CSS/JS page | syntax where applicable, i18n check, live or local HTTP check, screenshot if visual |
| Shared JS helper | syntax check, affected tests, adoption-page smoke |
| Backend API | syntax check, focused unit/contract/API tests |
| Database migration | static review, migration run in safe environment, rollback/compatibility note |
| Deploy script | shell syntax, dry run, safe live smoke if approved |

## 8. Final Report Rule

The final response to the Project Owner should include:

1. what was done;
2. final public/internal links;
3. important tests run;
4. commit hash;
5. any known limitation or next step.

Keep the final report concise and actionable.

## 9. Acceptance Criteria

A task is fixed when:

1. source task or decision is recorded;
2. relevant code/content/docs are updated;
3. verification evidence exists;
4. worktree is clean after commit;
5. Project Owner receives links and commit hash.

## 10. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-08 | GTC IT / AI Assistant | Initial task definition and fixation standard |
