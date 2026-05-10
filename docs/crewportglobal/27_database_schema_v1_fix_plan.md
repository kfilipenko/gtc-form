# CrewPortGlobal — Database Schema V1 Fix Plan

- Document owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Version: 0.1
- Status: Planning baseline
- Classification: Internal
- Effective date: 2026-05-10
- Review date: 2026-06-10

## 1. Purpose

This document defines the minimum fix plan required to move from the current planning schema v1 toward a safer v2 draft.

It is based on the design review in `docs/crewportglobal/26_database_schema_design_review.md` and on the follow-up implementation requirements for an isolated CrewPortGlobal schema.

This plan does not authorize SQL execution. Production DB must remain untouched until a separate execution review is approved.

## 2. Hard constraints

The fix plan preserves the existing project boundaries:

1. do not apply SQL to production;
2. do not change global auth schema;
3. do not change current Stripe workflow;
4. keep all CrewPortGlobal data structures inside schema `crewport`;
5. keep `gtc_user_id` optional and secondary to CrewPortGlobal operational identity.

## 3. Mandatory fixes for v2 draft

### 3.1 Business, vessel and representative document tables

Add explicit artifact tables instead of forcing non-seafarer evidence into generic audit payloads.

Required additions:

- `crewport.business_documents`
- `crewport.vessel_documents`
- `crewport.representative_documents`

Each table should use a `file_storage_key` model rather than binary file storage.

### 3.2 User-role model

Add `crewport.user_roles` so operational role assignment is not implied only by table membership.

This should support at least:

- seafarer;
- business_representative;
- business_admin;
- verifier;
- reviewer;
- complaint_operator;
- billing_operator.

### 3.3 Business-to-vessel relationship model

Replace the overly direct business ownership assumption with an explicit relationship table.

Required addition:

- `crewport.business_client_vessels`

This table should support different relationship types such as owner, manager, operator or crewing agent.

### 3.4 Structured business contact and address fields

Expand `business_clients` to support real onboarding submission.

Minimum additions:

- `primary_business_email`
- `primary_phone_e164`
- `registered_address_line_1`
- `registered_address_line_2`
- `registered_city`
- `registered_postal_code`
- `registered_country_code`
- `operating_address_line_1`
- `operating_address_line_2`
- `operating_city`
- `operating_postal_code`
- `operating_country_code`
- `company_type`

### 3.5 Vessel registry context

Expand `vessels` with minimum registry fields.

Required additions:

- `call_sign`
- `mmsi`
- `port_of_registry`

### 3.6 Updated-at trigger strategy

Replace passive `updated_at` columns with a consistent trigger model.

Required additions:

- one reusable trigger function in schema `crewport`
- one trigger per table that owns `updated_at`

### 3.7 Partial unique constraint for primary representative

Keep multiple representatives per business, but enforce that only one active primary representative exists at a time.

Required addition:

- partial unique index over `business_client_id` where `is_primary = true` and representative row is not revoked.

### 3.8 Candidate matching history model

Replace the one-row-per-position-and-seafarer model with an attempt-preserving model.

Required changes:

- add `attempt_no`
- add `is_current_attempt`
- add `supersedes_candidate_match_id`
- keep historical attempts instead of overwriting them
- enforce at most one current attempt per `(crew_request_position_id, seafarer_id)` with a partial unique index

### 3.9 pgcrypto as precondition, not inline action

Remove `CREATE EXTENSION IF NOT EXISTS pgcrypto` from the migration body.

Required change:

- record `pgcrypto` as an ops-approved precondition in the SQL header and comments
- do not enable extensions from the project migration itself

## 4. Recommended supporting fixes

The following should also be included in v2 draft because they materially improve first-migration quality:

- explicit `primary_email_verification_state` and `primary_email_verified_at` on `physical_persons`
- `registration_source` and `onboarding_channel` on person or seafarer records
- partial uniqueness for `business_clients` on `(jurisdiction_code, registration_number)` when onboarding state is not `draft`
- validation-oriented metadata for new document tables
- readiness views updated to reflect the new business-vessel relationship model and current-attempt matching model

## 5. Proposed implementation order inside v2 draft

1. header and preconditions
2. schema-level helper function for `updated_at`
3. identity tables
4. business and representative tables
5. vessel and business-vessel relationship tables
6. document tables
7. request and matching tables
8. audit, consent, billing and complaint tables
9. indexes and partial unique constraints
10. triggers
11. views

## 6. What remains intentionally out of scope

The v2 draft should still avoid:

- touching production DB
- changing global auth tables or login flows
- changing current Stripe workflow tables, events or subscriptions
- introducing file binaries into Postgres
- implementing full Stage 2 taxonomy/reference models

## 7. Expected output of this fix plan

The immediate output of this plan is a new planning SQL file:

- `projects/crewportglobal/db/migrations/20260510_crewport_initial_schema_v2_draft.sql`

That file should be treated as a design-improved draft only, not an execution-ready migration.