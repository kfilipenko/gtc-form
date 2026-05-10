# CrewPortGlobal — Test Migration Review Plan

- Project: CrewPortGlobal
- Scope: planning-only review plan for split SQL package
- Related artifacts:
  - projects/crewportglobal/db/migrations/20260510_crewport_initial_schema_v2_draft.sql
  - projects/crewportglobal/db/001_crewport_preconditions.sql
  - projects/crewportglobal/db/002_crewport_schema.sql
  - projects/crewportglobal/db/003_crewport_indexes.sql
  - projects/crewportglobal/db/004_crewport_views.sql
  - projects/crewportglobal/db/005_crewport_test_queries.sql
- Date: 2026-05-10
- Status: internal review plan

## 1. Scope and non-goals

This plan prepares a manual review path for the split CrewPortGlobal SQL package derived from the v2 planning draft.

Non-goals for this work item:

- do not execute SQL;
- do not touch production DB;
- do not touch test DB;
- do not change global auth schema;
- do not change current Stripe workflow;
- do not replace the v2 draft artifact, which remains the reference source.

## 2. Package structure under review

The split planning package is organized as follows:

1. `projects/crewportglobal/db/001_crewport_preconditions.sql`
2. `projects/crewportglobal/db/002_crewport_schema.sql`
3. `projects/crewportglobal/db/003_crewport_indexes.sql`
4. `projects/crewportglobal/db/004_crewport_views.sql`
5. `projects/crewportglobal/db/005_crewport_test_queries.sql`

Review purpose by file:

- `001`: confirms preconditions and keeps `pgcrypto` as an ops-approved requirement rather than enabling it silently;
- `002`: isolates schema objects, tables, FKs, trigger function and triggers;
- `003`: isolates standalone indexes and partial unique rules;
- `004`: isolates operational and readiness views;
- `005`: provides review-time verification queries and rollback-safe smoke examples.

## 3. Manual approval gate

No SQL may be executed anywhere until a human approval gate is passed.

Mandatory gate before any execution discussion on GTC1:

1. Architecture review confirms that the split package matches the v2 draft intent.
2. Ops review confirms that `pgcrypto` is already approved and separately managed.
3. Environment owner confirms the exact target and that it is not production.
4. Reviewer confirms that no part of the package touches shared auth objects.
5. Reviewer confirms that no part of the package changes the current Stripe workflow.
6. A rollback owner and review observer are explicitly named.
7. A separate written approval step is issued before any execution on GTC1.

Without that explicit approval, the package remains documentation only.

## 4. Review sequence

### 4.1 Artifact review

Reviewers should first diff the split package against the reference v2 artifact and confirm:

- object coverage is complete;
- no silent extension enablement was introduced;
- no production-targeted commands exist;
- no changes to shared schemas were introduced.

### 4.2 Schema review

Review `002_crewport_schema.sql` for:

- schema ownership assumptions;
- table order and FK dependency order;
- trigger creation coverage;
- preservation of identity split between `gtc_user_id` and `crewport_user_id`.

### 4.3 Index review

Review `003_crewport_indexes.sql` for:

- business identity uniqueness;
- primary representative uniqueness;
- active user role uniqueness;
- current-attempt uniqueness for candidate matches.

### 4.4 View review

Review `004_crewport_views.sql` for:

- readiness logic;
- join correctness;
- expected null-handling behavior;
- queue visibility assumptions.

### 4.5 Validation-query review

Review `005_crewport_test_queries.sql` for:

- catalog checks for tables, FKs, views and triggers;
- rollback-safe smoke insert/select examples;
- absence of destructive statements;
- clear separation between metadata checks and future committed trigger-behavior tests.

## 5. Review checklist

Before any future approved execution, reviewers should be able to answer yes to all of the following:

1. The split package is complete and traceable back to the v2 draft.
2. The package does not enable extensions automatically.
3. The package does not target production.
4. The package does not target a shared auth schema.
5. The package does not alter current Stripe behavior.
6. The schema file can be reviewed independently from indexes and views.
7. The test-query file remains rollback-safe for smoke insert examples.
8. Remaining design risks are acknowledged: polymorphic integrity and temporal semantics in business-to-vessel relationships.

## 6. What is still intentionally deferred

The following items remain outside this planning package:

- actual execution approval;
- actual test DB run;
- actual production run;
- future tightening of `business_client_vessels` temporal rules;
- future redesign of polymorphic subject integrity;
- future taxonomy hardening for verification evidence types.

## 7. Recommendation for the next step

Recommended next step: perform a manual artifact review of files `001` through `005` against the reference v2 draft, then stop at the approval gate.

Only after a separate written approval should the team even discuss a controlled non-production execution sequence.