# CrewPortGlobal — Test Migration Manual Approval Record

- Project: CrewPortGlobal
- Document type: manual approval record template
- Scope: planning-only approval record for a future non-production test migration review
- Related artifacts:
  - projects/crewportglobal/db/001_crewport_preconditions.sql
  - projects/crewportglobal/db/002_crewport_schema.sql
  - projects/crewportglobal/db/003_crewport_indexes.sql
  - projects/crewportglobal/db/004_crewport_views.sql
  - projects/crewportglobal/db/005_crewport_test_queries.sql
  - docs/crewportglobal/29_test_migration_review_plan.md
  - docs/crewportglobal/30_split_sql_package_review.md
  - docs/crewportglobal/31_gtc1_test_migration_execution_plan.md
- Date: ____________________
- Status: draft template

## 1. Explicit non-execution statement

This record by itself does not execute SQL.

This record is a manual approval artifact only.

No SQL was executed while preparing this document.
No database was touched while preparing this document.

## 2. Target environment

- Environment name: ____________________
- Environment class: ____________________
- Host or execution location: ____________________
- Environment owner: ____________________

## 3. Target database

- Database name: ____________________
- Database server or cluster identifier: ____________________
- Non-production confirmation: [ ] Yes [ ] No
- Confirmation note: ____________________

## 4. Target schema

- Target schema name: `crewport`
- Schema owner or expected owner: ____________________
- Shared auth isolation confirmed: [ ] Yes [ ] No

## 5. Exact SQL package version and file list

- Package version or review tag: ____________________
- Repository branch or revision: ____________________
- File list confirmed:
  - [ ] projects/crewportglobal/db/001_crewport_preconditions.sql
  - [ ] projects/crewportglobal/db/002_crewport_schema.sql
  - [ ] projects/crewportglobal/db/003_crewport_indexes.sql
  - [ ] projects/crewportglobal/db/004_crewport_views.sql
  - [ ] projects/crewportglobal/db/005_crewport_test_queries.sql
- Reference artifact confirmed:
  - [ ] projects/crewportglobal/db/migrations/20260510_crewport_initial_schema_v2_draft.sql

## 6. Approver name and role

- Approver name: ____________________
- Approver role: ____________________
- Approval authority basis: ____________________
- Approval timestamp: ____________________

## 7. Operator name and role

- Operator name: ____________________
- Operator role: ____________________
- Operator contact or team: ____________________

## 8. Observer name and role

- Observer name: ____________________
- Observer role: ____________________
- Observer contact or team: ____________________

## 9. Backup or snapshot confirmation

- Backup or snapshot type: ____________________
- Backup or snapshot identifier: ____________________
- Backup timestamp: ____________________
- Backup storage location: ____________________
- Restore owner: ____________________
- Restore confidence note: ____________________
- Backup verified: [ ] Yes [ ] No

## 10. Rollback owner

- Rollback owner name: ____________________
- Rollback owner role: ____________________
- Rollback contact or escalation path: ____________________

## 11. Planned execution window

- Planned date: ____________________
- Planned start time: ____________________
- Planned end time: ____________________
- Time zone: ____________________
- Maintenance or review window reference: ____________________

## 12. Stop conditions accepted by approver

Approver confirms acceptance of the following stop conditions:

- [ ] Stop if the target database cannot be proven to be non-production.
- [ ] Stop if the active database or user cannot be confirmed.
- [ ] Stop if the package on disk does not match the reviewed package.
- [ ] Stop if `pgcrypto` is missing.
- [ ] Stop if backup or snapshot evidence is missing or unclear.
- [ ] Stop if any file appears to target shared auth objects.
- [ ] Stop if any file appears to alter the current Stripe workflow.
- [ ] Stop if `002`, `003` or `004` fails.
- [ ] Stop if `005` is about to be executed partially instead of as one script in one session.
- [ ] Stop if approval provenance becomes unclear or revoked.

Approver comment on stop conditions: ____________________

## 13. Explicit approval checkbox and statement

- [ ] I confirm that the target is non-production.
- [ ] I confirm that backup or snapshot requirements have been met.
- [ ] I confirm that the reviewed package file list is exact and complete.
- [ ] I confirm that shared auth schema is out of scope.
- [ ] I confirm that current Stripe workflow is out of scope.
- [ ] I confirm that this approval is limited to the planned non-production execution window.

Explicit approval statement:

I, ____________________, acting as ____________________, approve discussion and, if separately governed by the approved window above, controlled execution of the reviewed non-production CrewPortGlobal test migration package for the exact target identified in this record.

Signature or written approval reference: ____________________

## 14. Post-execution verification sign-off

To be completed only after a future approved execution session:

- Schema exists as expected: [ ] Yes [ ] No
- Expected tables exist: [ ] Yes [ ] No
- Expected views exist: [ ] Yes [ ] No
- Expected triggers exist: [ ] Yes [ ] No
- Verification queries completed: [ ] Yes [ ] No
- Rollback-safe smoke section behavior reviewed: [ ] Yes [ ] No
- Session log archived: [ ] Yes [ ] No

Verifier name: ____________________
Verifier role: ____________________
Verification timestamp: ____________________
Verification notes: ____________________

## 15. Final decision

- [ ] Approved
- [ ] Rejected
- [ ] Postponed

Decision rationale: ____________________

Decision owner name: ____________________
Decision owner role: ____________________
Decision timestamp: ____________________