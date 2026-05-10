# CrewPortGlobal — GTC1 Test Migration Execution Plan

- Project: CrewPortGlobal
- Scope: planning-only execution plan for a future explicitly approved non-production migration review on GTC1
- Related artifacts:
  - projects/crewportglobal/db/001_crewport_preconditions.sql
  - projects/crewportglobal/db/002_crewport_schema.sql
  - projects/crewportglobal/db/003_crewport_indexes.sql
  - projects/crewportglobal/db/004_crewport_views.sql
  - projects/crewportglobal/db/005_crewport_test_queries.sql
  - docs/crewportglobal/29_test_migration_review_plan.md
  - docs/crewportglobal/30_split_sql_package_review.md
- Date: 2026-05-10
- Status: planning-only execution plan

## 1. Explicit non-approval statement

This document is not approval to execute.

This document only defines how a future manually approved execution discussion should be structured.

No SQL was executed while preparing this document.
No database was touched while preparing this document.

## 2. Scope boundaries

This plan applies only to a future explicitly approved non-production review flow.

Hard boundaries:

- do not execute against production DB;
- do not execute against any database until the manual approval gate is passed;
- do not change global auth schema;
- do not change current Stripe workflow;
- do not replace the v2 draft reference artifact.

## 3. Preconditions checklist

All items below must be confirmed before any command is entered:

1. Written approval exists for a non-production execution review on GTC1.
2. The exact target database name is known and confirmed to be non-production.
3. The operator identity is known and approved.
4. The rollback owner is assigned.
5. The observing reviewer is assigned.
6. `pgcrypto` is already enabled by a DB owner.
7. Files `001` through `005` match the reviewed split package.
8. The package review in document 30 remains valid and unrevoked.
9. The execution session will not target shared auth objects.
10. The execution session will not alter current Stripe workflow behavior.
11. A backup or reversible snapshot exists and has been verified.
12. The operator understands that `005` is rollback-safe only when run as one script in one session.

## 4. Backup / snapshot requirement

Before any future approved execution attempt, one of the following must exist:

1. A database snapshot that can be restored to the exact pre-execution point.
2. A physical backup confirmed restorable by ops.
3. A logical backup confirmed adequate for the isolated target scope.

Minimum backup confirmation record should include:

- backup type;
- backup timestamp;
- target database identifier;
- storage location;
- restore owner;
- restore rehearsal status or restore confidence note.

If the backup or snapshot cannot be proven, execution must not start.

## 5. Required working directory on GTC1

Required working directory:

`/var/www/gtc-form/projects/crewportglobal/db`

Reason:

- it contains the reviewed split package `001` through `005`;
- it avoids ambiguity about which artifact version is being referenced;
- it keeps the operator anchored to the repository-managed planning files.

## 6. Exact execution order for `001` through `005`

The reviewed order is fixed:

1. `001_crewport_preconditions.sql`
2. `002_crewport_schema.sql`
3. `003_crewport_indexes.sql`
4. `004_crewport_views.sql`
5. `005_crewport_test_queries.sql`

Purpose of the order:

- `001` is a checklist and must be read and confirmed before anything else;
- `002` creates the schema, tables, FK graph, trigger function and triggers;
- `003` adds indexes after base objects exist;
- `004` adds views after base objects exist;
- `005` is the verification layer and must run last.

No file reordering should be improvised during execution discussion.

## 7. `psql` command templates with placeholders only

These are templates only. They are not ready-to-run commands.

Environment template:

```bash
export PGHOST="<DB_HOST>"
export PGPORT="<DB_PORT>"
export PGUSER="<DB_USER>"
export PGPASSWORD="<DB_PASSWORD>"
export PGDATABASE="<NON_PRODUCTION_DB_NAME>"
```

Optional identity check template:

```bash
psql -v ON_ERROR_STOP=1 -X -c "SELECT current_database() AS database_name, current_user AS database_user;"
```

Preconditions review template:

```bash
psql -v ON_ERROR_STOP=1 -X -f 001_crewport_preconditions.sql
```

Schema execution template:

```bash
psql -v ON_ERROR_STOP=1 -X -f 002_crewport_schema.sql
```

Indexes execution template:

```bash
psql -v ON_ERROR_STOP=1 -X -f 003_crewport_indexes.sql
```

Views execution template:

```bash
psql -v ON_ERROR_STOP=1 -X -f 004_crewport_views.sql
```

Validation queries template:

```bash
psql -v ON_ERROR_STOP=1 -X -f 005_crewport_test_queries.sql
```

Optional log capture template:

```bash
psql -v ON_ERROR_STOP=1 -X -f <PACKAGE_FILE.sql> | tee "<REVIEW_LOG_PATH>"
```

Placeholder rules:

- do not replace placeholders with production values in documentation;
- do not store real credentials in the repository;
- do not inline live target names into this plan.

## 8. Manual approval gate before execution

The following gate must be passed before any future execution begins:

1. Architecture reviewer confirms that the package under discussion is still the reviewed package.
2. Ops confirms that the target is non-production.
3. Ops confirms that backup or snapshot exists and is acceptable.
4. DB owner confirms `pgcrypto` availability.
5. Reviewer confirms that no shared auth change is included.
6. Reviewer confirms that no Stripe workflow change is included.
7. Operator, rollback owner and observer are named in writing.
8. A written go-ahead is issued specifically for the intended target database.

Without this gate, the correct action is to stop.

## 9. Stop conditions

Execution planning or a future approved run must stop immediately if any of the following occurs:

1. The target database cannot be proven to be non-production.
2. The operator cannot confirm the active database and user.
3. The split package on disk does not match the reviewed package.
4. `pgcrypto` is missing.
5. Backup or snapshot evidence is missing or unverified.
6. A command references a path outside the reviewed package.
7. Any file appears to target shared auth objects.
8. Any file appears to alter the current Stripe workflow.
9. `002`, `003` or `004` fails with an error.
10. `005` is about to be executed partially instead of as one script in one session.
11. Any unexpected object name, schema name or target database name appears during operator checks.
12. Approval provenance is unclear or revoked.

## 10. Post-execution verification checklist

If a future approved non-production execution completes, verify all of the following before declaring the session successful:

1. The `crewport` schema exists.
2. All expected base tables exist.
3. All expected views exist.
4. Trigger metadata shows the expected `updated_at` triggers.
5. FK inventory looks consistent with the reviewed schema.
6. `crewport.seafarer_readiness` can be queried.
7. `crewport.business_readiness` can be queried.
8. `crewport.open_crew_requests` can be queried.
9. `crewport.match_review_queue` can be queried.
10. `crewport.project_entitlements` can be queried.
11. The rollback-safe smoke section in `005` completed without unintended persistence.
12. The session log is saved with timestamp, operator name and target database name.

## 11. Rollback strategy

Primary rollback strategy:

1. Stop further commands.
2. Preserve terminal output and SQL error output.
3. Do not improvise ad hoc cleanup statements.
4. Hand control to the assigned rollback owner.
5. Restore from the approved snapshot or backup.
6. Re-verify that the target returned to the pre-execution state.

Rollback principles:

- rollback must be environment-owner controlled;
- rollback must not rely on undocumented manual schema surgery;
- if failure occurs before `005`, do not proceed to later files;
- if `005` fails inside its rollback-safe smoke transaction, the operator should still stop and review logs rather than continue.

## 12. Execution log expectations

Any future approved session should capture at minimum:

- timestamp;
- operator;
- observer;
- rollback owner;
- target database identifier;
- package file sequence actually used;
- per-file success or failure;
- location of backup or snapshot reference;
- final verification result;
- rollback result if rollback was needed.

## 13. Final planning recommendation

This plan is suitable as an execution-plan skeleton for a future explicitly approved non-production review on GTC1.

It is not approval to execute.

If any ambiguity remains at runtime, the correct action is to stop at the approval gate and resolve it in writing before any command is run.