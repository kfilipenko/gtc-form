# CrewPortGlobal — Database Schema v2 Delta Review

- Project: CrewPortGlobal
- Artifact reviewed: projects/crewportglobal/db/migrations/20260510_crewport_initial_schema_v2_draft.sql
- Compared against: docs/crewportglobal/26_database_schema_design_review.md and docs/crewportglobal/27_database_schema_v1_fix_plan.md
- Date: 2026-05-10
- Status: Internal design delta review

## 1. Review scope

This review checks whether the v2 planning draft closes the blockers identified in the v1 design review and whether any new migration-shaping risks appeared.

This remains a planning-only workstream:

- do not apply SQL to production;
- do not change global auth schema from this workstream;
- do not change the current Stripe workflow from this workstream.

## 2. v1 blocker closure summary

### 2.1 `updated_at` strategy

Status: materially closed.

v2 adds a shared `crewport.set_updated_at()` trigger function and `BEFORE UPDATE` triggers across mutable tables that define `updated_at`.

Assessment:

- this closes the main v1 gap;
- `verification_events` and `consent_records` remain append-only and do not define `updated_at`, which is acceptable if that immutability is intentional.

### 2.2 Minimum seafarer and person onboarding fields

Status: closed.

v2 adds the missing operational registration fields on `physical_persons`, including:

- `primary_email_verification_state`;
- `primary_email_verified_at`;
- `registration_source`;
- `onboarding_channel`;
- `residence_country_code`.

This is sufficient for a first isolated registration lifecycle review.

### 2.3 Minimum business-client onboarding fields

Status: closed.

`business_clients` now includes structured email, phone, registered address, operating address, country breakdown and `company_type`.

This is materially better than v1 and is now adequate for first-pass onboarding review.

### 2.4 Minimum vessel identity fields

Status: closed.

`vessels` now includes:

- `call_sign`;
- `mmsi`;
- `port_of_registry`;
- `registry_country_code`.

That closes the thin-identity gap from v1.

### 2.5 Non-seafarer verification artifacts

Status: closed.

v2 adds dedicated evidence tables:

- `representative_documents`;
- `business_documents`;
- `vessel_documents`.

This is a stronger and cleaner answer than pushing artifacts into `verification_events.payload`.

### 2.6 Business identity uniqueness

Status: closed.

v2 adds a partial unique index on `(jurisdiction_code, lower(registration_number))` once the row is beyond draft.

This is the correct direction for preventing duplicate active onboarding shells.

### 2.7 Primary representative uniqueness

Status: closed with one semantic caveat.

v2 adds `idx_crewport_company_representatives_one_primary`, which prevents multiple simultaneous primary representatives for the same business.

The remaining caveat is semantic rather than structural: the index applies to any primary row whose `invitation_state <> 'revoked'`, so draft and invited rows also participate in the singleton rule.

### 2.8 Matching history retention

Status: closed.

v2 replaces the v1 one-row-only model with:

- `attempt_no`;
- `is_current_attempt`;
- `supersedes_candidate_match_id`;
- uniqueness on `(crew_request_position_id, seafarer_id, attempt_no)`;
- a partial unique index for the current attempt only.

This preserves repeated attempts and keeps a clean active-row invariant.

### 2.9 `pgcrypto` enablement separation

Status: closed.

v2 removes inline extension creation and turns it into an explicit operational precondition in the migration header.

## 3. Are all v1 blockers closed?

Short answer: yes at the planning level, with two caveats that should be tightened before any real test-execution step.

The v1 blocker list is materially addressed in v2. The remaining issues are no longer the original missing-surface blockers; they are now second-order data-model and migration-governance risks.

## 4. New or remaining migration risks

### 4.1 Polymorphic integrity remains weak in two places

`verification_events(subject_type, subject_id)` and `service_entitlements(subject_type, subject_id)` still use open polymorphic references without database-level foreign-key enforcement.

Risk:

- invalid subject references can be inserted;
- deletes or archival flows can orphan operational records;
- data quality will depend on application discipline instead of schema guarantees.

Assessment: acceptable for planning, but still a real migration risk that should be acknowledged explicitly.

### 4.2 `business_client_vessels` is usable, but not yet a complete history-safe relationship model

The table is a good baseline addition, but the current uniqueness rule is:

- `UNIQUE (business_client_id, vessel_id, relationship_type)`.

That means the same business cannot later re-establish the same relationship type with the same vessel as a second historical interval without updating the original row.

Risk:

- historical ownership or operator changes are harder to model cleanly;
- `effective_from` and `effective_to` suggest interval history, but the unique rule still collapses that history into one row per pair and type.

Assessment: good enough for structural review, not yet ideal as a long-term temporal relationship model.

### 4.3 Current-attempt enforcement depends on write discipline

`candidate_matches` now supports history correctly, but the schema still relies on the application or migration logic to flip the previous row away from `is_current_attempt = true` before a new current attempt is inserted.

The partial unique index protects the invariant, but operational code will need a transactional update pattern.

### 4.4 Document evidence taxonomy is still generic

The new document tables are structurally correct, but `document_type` and `metadata` remain generic.

Risk:

- the schema does not yet encode which documents are mandatory for each business type, representative authority type or vessel verification path;
- compliance completeness will depend on policy and application logic rather than relational constraints.

Assessment: acceptable for v2 review, but not the final compliance model.

## 5. Is `user_roles` sufficient for multiple roles per user?

Short answer: yes for v2 scope.

Why it works:

- one physical person can hold several role rows;
- the same person can hold the same role in different business contexts because `business_client_id` participates in the active uniqueness rule;
- platform-level roles without a business context are still supported via nullable `business_client_id` and the `COALESCE`-based unique index.

What it does not solve yet:

- fine-grained permission bundles;
- role hierarchy inheritance;
- temporal validation beyond `assignment_state` and `revoked_at`;
- hard consistency rules such as “business roles must always have a non-null `business_client_id`”.

Assessment: sufficient for first migration review, not a finished authorization model.

## 6. Are the new document tables sufficient for KYB and vessel verification?

Short answer: sufficient for first migration review, but still policy-driven rather than schema-driven.

What v2 gets right:

- separate storage surface for representative, business and vessel evidence;
- verification state on each artifact;
- file pointer and metadata support;
- proper ownership foreign keys.

What remains open:

- required evidence matrices by business type, country, vessel flag or authority type are not encoded in the schema;
- no normalized document taxonomy exists yet;
- no explicit rule prevents duplicate contradictory evidence submissions of the same type.

Assessment: enough for v2 and for splitting into staged migrations.

## 7. Is the business-to-vessel relationship model correct?

Short answer: directionally correct, but not yet fully complete.

Strengths:

- explicit relationship table instead of overloading `vessels`;
- support for multiple relationship types;
- status fields and date bounds;
- ownership separated from vessel identity.

Remaining gap:

- the current uniqueness rule is too tight for a truly temporal history model;
- `is_primary` has no scoped partial unique rule, so the meaning of “primary” is not fully enforced;
- overlapping intervals are not constrained.

Assessment: acceptable baseline for v2, but still one of the main candidates for the next tightening pass.

## 8. Is the `updated_at` trigger strategy complete?

Short answer: yes for mutable tables, with intentional omission on append-only ones.

The trigger coverage is consistent across tables that define `updated_at`. The only notable omissions are tables that do not expose `updated_at` at all, namely append-only or event-style records.

Assessment: this blocker is resolved.

## 9. Are the partial unique indexes correct?

Short answer: mostly yes.

`idx_crewport_business_clients_identity_active`

- correct direction;
- appropriate for preventing duplicate non-draft business shells.

`idx_crewport_company_representatives_one_primary`

- structurally correct;
- semantic filter may need confirmation because draft and invited primary rows also consume the singleton slot.

`idx_crewport_candidate_matches_current_attempt`

- correct and necessary;
- pairs well with `attempt_no` and history retention.

Assessment: no blocking flaw found, but the representative-primary filter should be confirmed against the intended invitation workflow.

## 10. Is matching-attempt history preserved?

Yes.

This is one of the strongest improvements in v2. The schema now supports repeated matching cycles without overwriting prior attempts and still maintains one current operational attempt.

## 11. Is v2 ready to split into `001` / `002` / `003`?

Yes.

The draft is now structured enough to split cleanly:

### 11.1 Suggested split

`001_crewport_schema_core.sql`

- schema creation;
- `set_updated_at()`;
- core identity tables: `physical_persons`, `user_roles`, `seafarers`, `business_clients`, `company_representatives`, `vessels`;
- core indexes and foreign keys attached to those tables.

`002_crewport_operational_surfaces.sql`

- document tables;
- `business_client_vessels`;
- crew request and matching tables;
- billing, entitlement, consent, complaint and verification-event tables;
- trigger declarations.

`003_crewport_views.sql`

- readiness and queue views only.

This split keeps review and rollback discussion more manageable.

## 12. Recommendation

Recommendation: ready for test migration review.

Rationale:

- the v1 blockers are materially closed;
- the v2 draft is now coherent enough for staged migration review;
- the remaining concerns are concentrated and reviewable rather than foundational.

Important qualification:

- ready for test migration review does not mean ready for production execution;
- before any actual test-run SQL is approved, the team should explicitly decide the future shape of `business_client_vessels` history rules and whether polymorphic subject references remain acceptable in `verification_events` and `service_entitlements`.