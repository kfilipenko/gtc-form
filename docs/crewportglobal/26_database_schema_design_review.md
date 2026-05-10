# CrewPortGlobal — Database Schema Design Review

- Document owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Version: 0.1
- Status: Internal review
- Classification: Internal
- Effective date: 2026-05-10
- Review date: 2026-06-10
- Reviewed artifact: projects/crewportglobal/db/migrations/20260510_crewport_initial_schema.sql

## 1. Scope

This review covers the planning SQL for the isolated CrewPortGlobal database schema.

The review does not authorize execution. No SQL from this file should be applied to production without a separate approval step.

## 2. Review checklist

| Check | Result | Notes |
| --- | --- | --- |
| All tables in `crewport` schema | Pass | Every created table is explicitly namespaced under `crewport` starting from the first table definition. |
| Key foreign keys between core entities | Pass with caveats | Main relational chain is present for persons, seafarers, documents, businesses, representatives, vessels, requests, positions and matches. Polymorphic tables are not FK-enforced. |
| `gtc_user_id` not used as primary business key | Pass | Core business identifiers are `uuid` primary keys and `crewport_user_id`; `gtc_user_id` appears as optional linkage or operator reference only. |
| Billing and entitlements isolated from global subscriptions | Pass | Dedicated `billing_accounts` and `service_entitlements` tables are present; no reference to shared `subscriptions` or Stripe workflow tables appears in the SQL. |
| Enough fields for seafarer registration | Partial | Good base exists, but email verification state and a few registration-origin fields should be added before first real migration. |
| Enough fields for business-client registration | Partial | Legal shell exists, but contact and address fields are too thin for real onboarding. |
| Enough fields for vessel registration | Partial | Vessel core identity exists, but call sign and registry context should be added before real migration. |
| Enough fields for crew requests and matching | Partial | Base workflow is present, but request timing and repeat-match history need clarification. |
| Consent records present | Pass | `consent_records` table exists. |
| Verification audit trail present | Pass with caveat | `verification_events` exists, but uses polymorphic subject references without FK enforcement. |
| Complaint records present | Pass | `complaint_records` table exists. |
| Files stored outside DB | Pass | The schema uses `file_storage_key` rather than binary file columns. |
| Constraint and nullability risks reviewed | Yes | Several unique, check and nullability issues should be resolved before first real migration. |

## 3. What is good

### 3.1 Strong isolation boundary

The SQL starts with an explicit `crewport` schema and keeps all planning tables inside it.

This is consistent with the project rule that CrewPortGlobal operational data must stay isolated from broader GTC runtime surfaces.

### 3.2 Correct identifier split

The design correctly separates:

- `crewport_user_id` as the CrewPortGlobal-local operational identifier;
- `gtc_user_id` as an optional bridge to global identity.

This is the right direction for the principle:

> GTC global identity != CrewPortGlobal operational profile

### 3.3 Core operational chain is present

The main FK graph is already sensible:

- person -> seafarer -> seafarer documents;
- business client -> representatives;
- business client -> vessels;
- business client -> crew requests -> request positions -> candidate matches.

That means the schema already models the core workflow as real relational objects rather than generic JSON blobs.

### 3.4 Billing is project-local

The schema introduces `billing_accounts` and `service_entitlements` instead of binding directly to shared `subscriptions`.

This matches the current stage boundary and keeps CrewPortGlobal billing isolated from global GTC billing logic.

### 3.5 Consent, complaints and audit are not forgotten

The planning model already includes:

- consent storage;
- complaint records;
- verification event audit trail;
- readiness and queue-oriented views.

That is a strong baseline for a compliance-oriented platform model.

### 3.6 File storage is handled correctly

The seafarer document table uses `file_storage_key` instead of storing file blobs in Postgres.

That is the correct default for operational scale, backup hygiene and object-storage compatibility.

## 4. What requires clarification

### 4.1 Polymorphic integrity model

`verification_events.subject_id` and `service_entitlements.subject_id` are polymorphic references.

This is flexible, but it also means there is no database-level FK protection for those references. Before first real migration, the team should decide whether:

1. app-level integrity is acceptable;
2. a generic link table should be added;
3. or subject-specific event and entitlement tables should be introduced.

### 4.2 Draft-state nullability policy

Several onboarding tables are intentionally permissive because draft rows are allowed.

That is reasonable, but the project still needs a clear rule for when a draft may transition to `submitted`, `under_review` or `active`. Otherwise the schema can accumulate structurally valid but operationally useless rows.

### 4.3 Business identity uniqueness

`business_clients.registration_number` is indexed but not unique.

That may be intentional for incomplete draft onboarding, but before the first real migration the team should decide whether a partial or scoped uniqueness rule is needed, for example by `(jurisdiction_code, registration_number)` when both are present.

### 4.4 Representative primacy rule

`company_representatives.is_primary` exists, but nothing prevents multiple primary representatives for the same business client.

The intended business rule should be clarified before execution.

### 4.5 Match history policy

`candidate_matches` has a uniqueness constraint on `(crew_request_position_id, seafarer_id)`.

That blocks duplicate active matches, but it also blocks re-entry or multiple historical attempts for the same seafarer against the same request position. The desired business behavior should be confirmed before migration.

## 5. What needs to be fixed before applying

### 5.1 Add state-transition support for `updated_at`

Many tables define `updated_at`, but the SQL does not define triggers or another mechanism that updates these columns automatically.

Before a real migration, the schema should include a consistent `updated_at` strategy, either with triggers or explicit application-layer write rules plus a validated contract.

### 5.2 Add minimum registration fields for real seafarer onboarding

The seafarer path needs a few operational fields before first migration:

- `primary_email_verified_at` or `primary_email_verification_state` on `physical_persons`;
- `registration_source` or `onboarding_channel` on `physical_persons` or `seafarers`;
- optionally `residence_country_code` if residency matters independently from nationality.

The current person and seafarer fields are a good base, but they are still too thin for a production-grade registration lifecycle.

### 5.3 Add minimum registration fields for business clients

Before the first real migration, `business_clients` should gain at least:

- `primary_business_email`;
- `registered_address`;
- `operating_address` or `operating_country_code`;
- optionally `company_type` if entity type matters for review.

Right now the table can identify a company shell, but not support a robust onboarding submission.

### 5.4 Add minimum vessel identity fields

Before the first real migration, `vessels` should likely add:

- `call_sign`;
- `port_of_registry` or equivalent registry location field.

The current fields cover vessel name, IMO, flag and ownership context, but the registration surface is still too narrow for many real onboarding cases.

### 5.5 Add support for non-seafarer verification artifacts

The schema currently has `seafarer_documents`, but there is no equivalent artifact table for business-client, representative or vessel evidence.

Before first migration, add either:

1. a generic `verification_artifacts` table with `subject_type`, `subject_id`, `artifact_type`, `file_storage_key` and verification metadata;
2. or dedicated document tables for business, representative and vessel evidence.

Without this, non-seafarer verification will be forced into `verification_events.payload`, which is too weak as a long-term evidence model.

### 5.6 Define uniqueness rule for business registration identity

Before the first real migration, introduce a partial or scoped unique rule for business identity once a row becomes more than a draft.

Otherwise duplicate business client shells are likely.

### 5.7 Define primary-representative uniqueness

Before the first real migration, add a partial unique index or equivalent enforcement so one business client cannot accidentally have multiple simultaneous primary representatives.

### 5.8 Revisit match uniqueness for operational history

Before the first real migration, decide whether `candidate_matches` should:

- keep the current uniqueness rule;
- switch to a partial unique rule for active states only;
- or gain an `attempt_no` or similar field.

For realistic operations, preserving historical re-submission or re-review attempts is usually valuable.

### 5.9 Separate extension setup from schema migration plan

`CREATE EXTENSION IF NOT EXISTS pgcrypto` is practical, but it is a database-level capability step rather than a pure project-schema step.

Before first migration, treat extension enablement as a separate ops approval item.

## 6. What can be left for Stage 2

The following can reasonably stay out of the first real migration if the core model is approved:

- more detailed seafarer career history tables;
- certification taxonomies and reference dictionaries;
- richer vessel commercial metadata;
- allocation, assignment and voyage tracking beyond request and match states;
- complaint workflow assignment queues and SLA tracking;
- more detailed billing product catalogs;
- generalized audit expansion beyond verification events.

These are useful, but they are not blockers for an initial isolated CrewPortGlobal schema.

## 7. Table-by-table adequacy summary

### 7.1 Seafarers

Base adequacy: acceptable for planning, not yet complete for first real migration.

Good now:

- person root table;
- local operational identifier;
- maritime profile shell;
- document inventory;
- readiness view.

Needs before first migration:

- explicit email verification state;
- onboarding source;
- possibly non-nationality residence context.

### 7.2 Business clients

Base adequacy: acceptable for planning, not yet complete for first real migration.

Good now:

- legal shell;
- operational role;
- onboarding state;
- representative link.

Needs before first migration:

- contact email;
- address fields;
- stronger uniqueness rules;
- primary representative enforcement.

### 7.3 Vessels

Base adequacy: acceptable for planning, not yet complete for first real migration.

Good now:

- vessel name;
- IMO uniqueness when present;
- flag and ownership or management context.

Needs before first migration:

- call sign;
- registry location field;
- possibly a dedicated verification artifact surface.

### 7.4 Crew requests and matching

Base adequacy: mostly good for first iteration.

Good now:

- request shell;
- position decomposition;
- wage and experience fields;
- flexible requirement payload;
- queue-oriented matching model.

Needs before first migration:

- confirmation of request timing model if a single `needed_by_date` is too weak;
- explicit decision on historical repeat matches.

## 8. Split recommendation for SQL files

### Recommendation

Yes — before the first real migration, the current planning SQL should be split into:

- `projects/crewportglobal/db/001_crewport_schema.sql`
- `projects/crewportglobal/db/002_crewport_indexes.sql`
- `projects/crewportglobal/db/003_crewport_views.sql`

### Why splitting is useful

Splitting will improve:

- reviewability;
- rollback planning;
- ownership of schema versus performance tuning versus reporting surfaces;
- change-diff clarity when indexes or views evolve separately from base tables.

### Why not mandatory right now

At the current planning stage, one consolidated file is still acceptable because the model is under design review.

The split becomes strongly recommended immediately before the first real migration proposal, not necessarily before planning review is complete.

## 9. Final verdict

### What is good

- Strong isolation in `crewport` schema.
- Correct separation between `gtc_user_id` and `crewport_user_id`.
- Good core FK graph for main operational entities.
- Separate billing and entitlements model for CrewPortGlobal.
- Consent, complaint and verification audit concepts are present.
- File blobs are not stored in Postgres.

### What requires clarification

- Polymorphic integrity model for verification events and entitlements.
- Draft-to-active transition rules.
- Uniqueness model for business registration identity.
- One-primary-representative rule.
- Repeat-match history policy.

### What needs to be fixed before applying

- Add `updated_at` maintenance strategy.
- Add explicit seafarer email verification and onboarding-source fields.
- Add business contact and address fields.
- Add vessel call-sign and registry context.
- Add generic or dedicated non-seafarer verification artifact storage.
- Tighten business uniqueness and representative-primary constraints.
- Revisit active-versus-historical uniqueness for candidate matches.
- Treat `pgcrypto` enablement as a separate ops approval item.

### What can be left for Stage 2

- Rich career history and taxonomy tables.
- Extended vessel and voyage metadata.
- Complaint SLA workflow internals.
- Product catalog expansion.
- Broader audit generalization.

### Recommendation: ready / not ready to test migration

Recommendation: not ready to test migration.

The schema is a strong planning baseline, but it still needs a small set of high-impact fixes and clarifications before it should be treated as a candidate for even a test migration on a non-production environment.