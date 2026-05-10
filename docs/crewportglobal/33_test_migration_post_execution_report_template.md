# CrewPortGlobal — Test Migration Post-Execution Report Template

- Project: CrewPortGlobal
- Document type: post-execution report template
- Scope: reporting template for a future explicitly approved non-production test migration session
- Related artifacts:
  - projects/crewportglobal/db/001_crewport_preconditions.sql
  - projects/crewportglobal/db/002_crewport_schema.sql
  - projects/crewportglobal/db/003_crewport_indexes.sql
  - projects/crewportglobal/db/004_crewport_views.sql
  - projects/crewportglobal/db/005_crewport_test_queries.sql
  - docs/crewportglobal/31_gtc1_test_migration_execution_plan.md
  - docs/crewportglobal/32_test_migration_manual_approval_record.md
- Date: ____________________
- Status: draft template

## 1. Explicit non-execution statement

This file is a reporting template only.

Preparing this template does not execute SQL and does not touch any database.

## 2. Execution date and time

- Execution date: ____________________
- Start time: ____________________
- End time: ____________________
- Time zone: ____________________
- Planned window reference: ____________________

## 3. Target environment and database

- Target environment: ____________________
- Environment class: ____________________
- Host or execution location: ____________________
- Target database: ____________________
- Target schema: `crewport`
- Non-production confirmation: [ ] Yes [ ] No

## 4. Operator, observer and approver

- Operator name: ____________________
- Operator role: ____________________
- Observer name: ____________________
- Observer role: ____________________
- Approver name: ____________________
- Approver role: ____________________
- Approval record reference: ____________________

## 5. SQL package files executed

Mark the exact files that were executed in the session:

- [ ] projects/crewportglobal/db/001_crewport_preconditions.sql
- [ ] projects/crewportglobal/db/002_crewport_schema.sql
- [ ] projects/crewportglobal/db/003_crewport_indexes.sql
- [ ] projects/crewportglobal/db/004_crewport_views.sql
- [ ] projects/crewportglobal/db/005_crewport_test_queries.sql

Package revision or branch reference: ____________________

## 6. Pre-execution checklist confirmation

Confirm what was true before the session started:

- [ ] Manual approval gate was passed.
- [ ] Target database was confirmed as non-production.
- [ ] Operator identity was confirmed.
- [ ] Observer was present or assigned.
- [ ] Rollback owner was assigned.
- [ ] Backup or snapshot was confirmed.
- [ ] `pgcrypto` availability was confirmed.
- [ ] File list matched the reviewed package.
- [ ] Shared auth schema remained out of scope.
- [ ] Current Stripe workflow remained out of scope.

Pre-execution notes: ____________________

## 7. Backup or snapshot reference

- Backup or snapshot type: ____________________
- Backup or snapshot identifier: ____________________
- Backup timestamp: ____________________
- Backup storage location: ____________________
- Restore owner: ____________________

## 8. Execution log summary

Provide a concise factual summary of what happened during the session:

- Session start summary: ____________________
- Commands or files processed summary: ____________________
- Per-file completion summary: ____________________
- Log file location: ____________________
- Operator notes: ____________________

## 9. Errors or warnings

- Errors encountered: [ ] None [ ] Yes
- Warnings encountered: [ ] None [ ] Yes
- Error summary: ____________________
- Warning summary: ____________________
- First failing step, if any: ____________________

## 10. Stop conditions triggered or not triggered

- Stop conditions triggered: [ ] No [ ] Yes
- If yes, which condition(s): ____________________
- Timestamp of stop decision: ____________________
- Stop decision owner: ____________________

## 11. Rollback action taken or not required

- Rollback required: [ ] No [ ] Yes
- Rollback executed: [ ] No [ ] Yes
- Rollback owner: ____________________
- Rollback summary: ____________________
- Recovery verification note: ____________________

## 12. Post-execution verification results

Record the actual observed verification results:

- `crewport` schema present: [ ] Yes [ ] No
- Expected tables present: [ ] Yes [ ] No
- Expected views present: [ ] Yes [ ] No
- Expected triggers present: [ ] Yes [ ] No
- FK inventory reviewed: [ ] Yes [ ] No
- `crewport.seafarer_readiness` query verified: [ ] Yes [ ] No
- `crewport.business_readiness` query verified: [ ] Yes [ ] No
- `crewport.open_crew_requests` query verified: [ ] Yes [ ] No
- `crewport.match_review_queue` query verified: [ ] Yes [ ] No
- `crewport.project_entitlements` query verified: [ ] Yes [ ] No
- `005` smoke transaction behaved as expected: [ ] Yes [ ] No [ ] Not run

Verification notes: ____________________

## 13. Final status

- [ ] Successful
- [ ] Failed
- [ ] Rolled back
- [ ] Partially completed

Final status rationale: ____________________

## 14. Follow-up actions

List required follow-up actions after the session:

1. ____________________
2. ____________________
3. ____________________

Action owner(s): ____________________
Target completion date(s): ____________________

## 15. Attachments and evidence list

Record all relevant evidence for the session:

1. Approval record reference: ____________________
2. Execution log path: ____________________
3. Backup or snapshot evidence reference: ____________________
4. Verification output reference: ____________________
5. Rollback evidence reference, if applicable: ____________________
6. Additional attachments: ____________________