# GTC-STD-009 - Testing, Deploy And Release Standard

- Owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Scope: local verification, public deploy, live smoke checks and release evidence
- Version: 0.1
- Date: 2026-07-08
- Status: Baseline standard extracted from CrewPortGlobal

## 1. Purpose

This standard defines the minimum verification and release discipline for GTC projects.

The goal is to avoid the failure mode where code is correct in the repository but the live site still serves stale files or unverified behavior.

## 2. Verification Before Commit

Run checks appropriate to the change.

Minimum examples:

| Change | Verification |
|---|---|
| Markdown docs | `git diff --check` |
| JavaScript | `node --check <file>` plus focused tests |
| PHP | `php -l <file>` plus focused tests |
| Shell script | `bash -n <file>` plus dry run if possible |
| Public HTML/i18n | public i18n check and URL smoke |
| API | contract/unit/API tests |
| Visual page | desktop/mobile screenshot review |
| Deploy script | dry run and live smoke after approval |

## 3. Public Deploy Script Pattern

A safe public deploy script should:

1. lock single execution;
2. verify source directory;
3. verify live root safety;
4. optionally run i18n/public validators;
5. sync source to live root;
6. exclude certificate challenge paths if needed;
7. optionally delete stale files;
8. support dry run;
9. run live smoke checks.

It should not:

1. apply database migrations unless explicitly designed for that;
2. touch secrets;
3. reload nginx unexpectedly;
4. modify unrelated app roots;
5. change protected runtime data.

## 4. Live Smoke Checks

After publication, check:

1. health endpoint if available;
2. home page;
3. changed page;
4. navigation asset or shared runtime;
5. key text that proves the new version is live;
6. important linked page/hub;
7. HTTP status and redirects.

Smoke markers must be kept current. If page text changes, update the smoke marker in the same slice.

## 5. Automated Publication

If a project uses a systemd timer or CI deploy:

1. document the unit/workflow;
2. document schedule;
3. document runtime user;
4. record logs command;
5. record stop/re-enable commands;
6. record whether it pulls from Git or publishes local working tree;
7. keep deploy boundaries explicit.

## 6. Rollback

Release documentation should identify:

1. previous release or backup location;
2. rollback command;
3. rollback approval role;
4. verification after rollback;
5. incident note location.

## 7. Test Artifacts

Generated test artifacts should be removed or restored before commit unless intentionally part of the change.

Examples:

1. `playwright-report/`;
2. `test-results/`;
3. trace zip files;
4. temporary screenshots;
5. runtime logs.

## 8. Acceptance Criteria

A release is complete when:

1. source changes are committed;
2. deploy path ran successfully or publication is otherwise verified;
3. live URL returns expected status;
4. live content contains expected marker;
5. navigation/hub link works if relevant;
6. tests/checks are recorded in final response or implementation report.

## 9. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-08 | GTC IT / AI Assistant | Initial testing, deploy and release standard |
