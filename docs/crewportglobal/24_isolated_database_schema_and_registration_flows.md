# CrewPortGlobal — Isolated Database Schema and Registration Flow Specification

- Document owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Version: 0.1
- Status: Planning baseline
- Classification: Internal
- Effective date: 2026-05-10
- Review date: 2026-06-10

## 1. Purpose

This document translates the current CrewPortGlobal issue brief into a project-local database and registration-flow specification.

It is intentionally limited to planning artifacts inside `docs/crewportglobal/` and `projects/crewportglobal/`. It does not authorize schema creation on production and it does not authorize changes to the global auth model or the current Stripe workflow.

## 2. Hard constraints

The following constraints are mandatory for this workstream:

1. PostgreSQL objects must live in a separate schema named `crewport`.
2. CrewPortGlobal operational identity must remain distinct from global GTC identity.
3. No SQL from this workstream may be applied to production without a separate confirmation step.
4. Global auth schema, shared auth flows and current Stripe workflow are out of scope for this stage.
5. Database planning, documentation and SQL artifacts must remain inside the CrewPortGlobal project roots.

Core principle:

> GTC global identity != CrewPortGlobal operational profile

## 3. Identifier model

The isolated model uses two different identifiers with different meanings:

- `gtc_user_id`: optional link to the wider platform identity model; may be absent for some CrewPortGlobal records during early isolated onboarding.
- `crewport_user_id`: CrewPortGlobal-local operational identifier for a physical person record inside the `crewport` schema.

This split prevents the public project from depending on the global auth stack before the isolated operating model is verified.

## 4. Proposed schema domains

The planning SQL in [projects/crewportglobal/db/migrations/20260510_crewport_initial_schema.sql](projects/crewportglobal/db/migrations/20260510_crewport_initial_schema.sql) defines these domain groups:

1. physical persons;
2. seafarer operational profiles;
3. seafarer documents;
4. business clients;
5. company representatives;
6. vessels;
7. crew requests;
8. positions within requests;
9. candidate matching;
10. verification events;
11. consent records;
12. billing accounts;
13. service entitlements;
14. complaint records;
15. readiness and operations views.

## 5. Table-group rationale

### 5.1 Physical persons

`crewport.physical_persons` is the root record for an individual human actor.

It can later be linked to `gtc_user_id`, but it does not require that link to exist on day one.

### 5.2 Seafarers and documents

`crewport.seafarers` carries maritime-operational profile data.

`crewport.seafarer_documents` carries document inventory, review state, expiry and evidence metadata. The separation keeps person identity distinct from document-readiness status.

### 5.3 Business clients and representatives

`crewport.business_clients` models the company-facing onboarding unit.

`crewport.company_representatives` links real people to companies and captures authority and representative verification state.

### 5.4 Vessels and crew requests

`crewport.vessels` isolates vessel identity and ownership or management context.

`crewport.crew_requests` and `crewport.crew_request_positions` separate the commercial request shell from the role-level staffing demand.

### 5.5 Matching and review

`crewport.candidate_matches` is deliberately review-oriented.

It stores queue state, match state and scoring metadata without treating automated ranking as a final hiring decision.

### 5.6 Verification, consent, billing and complaints

- `crewport.verification_events` is the audit trail for trust and verification actions.
- `crewport.consent_records` stores consent facts separately from business process rows.
- `crewport.billing_accounts` and `crewport.service_entitlements` isolate CrewPortGlobal billing state from global billing workflows.
- `crewport.complaint_records` gives the project a dedicated complaint surface linked to people, businesses, requests or matches.

## 6. Required planning views

The isolated schema includes these planning views:

- `crewport.seafarer_readiness`
- `crewport.business_readiness`
- `crewport.open_crew_requests`
- `crewport.match_review_queue`
- `crewport.project_entitlements`

These views are intended to support dashboards, operator review queues and access decisions without forcing raw cross-table reads into every application path.

## 7. Registration flow specification

### 7.1 Seafarer self-registration

Target outcome:

- create a person record;
- create a seafarer operational profile;
- persist onboarding acceptance and privacy or verification consent snapshots;
- defer global auth binding unless explicitly introduced later.

Suggested sequence:

1. Public onboarding acceptance page captures contact and no-fee acknowledgements.
2. Application creates `crewport.physical_persons` row.
3. Application creates `crewport.seafarers` row in `draft` or `accepted` state.
4. Application inserts required `crewport.consent_records` rows.
5. Application records initial `crewport.verification_events` row with pending outcome.
6. Document intake populates `crewport.seafarer_documents`.
7. Operational review resolves readiness via `crewport.seafarer_readiness`.

### 7.2 Business-client self-registration

Target outcome:

- create a business client shell;
- create at least one representative record;
- record authority and onboarding consents;
- keep business readiness independent from global auth and existing billing flows.

Suggested sequence:

1. Business client shell is created in `crewport.business_clients`.
2. Primary representative is created as `crewport.physical_persons` plus `crewport.company_representatives`.
3. Consents are recorded in `crewport.consent_records`.
4. Initial KYB or verification event is recorded in `crewport.verification_events`.
5. Optional vessel shells may be created if the onboarding case depends on vessel context.
6. Readiness is evaluated through `crewport.business_readiness`.

### 7.3 Representative invitation flow

Target outcome:

- add operational representatives without mutating global auth tables.

Suggested sequence:

1. Create or resolve physical person row.
2. Create `crewport.company_representatives` row in `invited` state.
3. Record authority or invitation evidence.
4. Progress to `accepted` only after consent and verification checkpoints are satisfied.

### 7.4 Vessel onboarding

Target outcome:

- create a vessel record only in the context of a known business workflow.

Suggested sequence:

1. Resolve business client.
2. Create or update vessel row.
3. Record vessel verification event.
4. Expose status through `crewport.business_readiness` and request workflows.

### 7.5 Crew request intake

Target outcome:

- create a reviewable demand record, not only a free-text request.

Suggested sequence:

1. Resolve business client and, where applicable, representative and vessel.
2. Create `crewport.crew_requests` shell.
3. Create one or more `crewport.crew_request_positions` rows.
4. Gate matching work on request state and verification gate.

### 7.6 Candidate matching and review

Target outcome:

- separate machine-assist from operator review.

Suggested sequence:

1. Matching engine or operator seeds `crewport.candidate_matches`.
2. Records enter `pending_review` queue.
3. Operators review via `crewport.match_review_queue`.
4. Review outcome updates match state and may create follow-up verification events.

## 8. Explicit non-goals for this stage

This planning package does not:

- apply SQL to production;
- modify `public` auth tables;
- rewire current `/auth/*` endpoints;
- alter shared Stripe billing tables or current webhook logic;
- declare a production migration order beyond the planning stage.

## 9. Review path before any DB execution

Before schema creation is even considered on GTC1, the following review steps must happen:

1. review table names and ownership boundaries;
2. review identifier split and no-cross-project constraints;
3. review registration-flow assumptions against product scope;
4. review billing isolation against the current commercial model;
5. approve an execution plan separately from these planning artifacts.

## 10. Artifact set

Current planning artifact set for this workstream:

- [docs/crewportglobal/22_identity_and_project_database_architecture.md](docs/crewportglobal/22_identity_and_project_database_architecture.md)
- [docs/crewportglobal/24_isolated_database_schema_and_registration_flows.md](docs/crewportglobal/24_isolated_database_schema_and_registration_flows.md)
- [docs/crewportglobal/25_category_onboarding_matrix.md](docs/crewportglobal/25_category_onboarding_matrix.md)
- [projects/crewportglobal/db/migrations/20260510_crewport_initial_schema.sql](projects/crewportglobal/db/migrations/20260510_crewport_initial_schema.sql)
