# CrewPortGlobal — Registration Flow Specification

- Project: CrewPortGlobal
- Scope: planning-only workflow specification for category-based registration automation
- Status: Planning baseline

## 1. Purpose

This document defines the canonical registration-flow shapes that future CrewPortGlobal automation should follow.

It is intentionally aligned with the current `crewport` planning schema and does not authorize implementation.

## 2. Hard Constraints

The workflow plan preserves the current project boundaries:

1. SQL must not be executed from this workstream.
2. No database may be touched from this workstream.
3. Global auth schema remains out of scope.
4. Current Stripe workflow remains out of scope.
5. Nginx remains out of scope.
6. Implementation is not approved yet.

## 3. Shared Registration Primitives

Every registration flow should be assembled from these shared primitives:

1. category selection;
2. intake validation;
3. `physical_persons` creation or resolution when a real person is involved;
4. `user_roles` assignment where role semantics are explicit;
5. category-specific record creation;
6. `consent_records` capture;
7. `verification_events` seeding;
8. readiness evaluation through the relevant view or operator queue.

## 4. Canonical Flow Groups

### 4.1 Seafarer flow

Canonical records:

- `physical_persons`
- `user_roles` with `seafarer`
- `seafarers`
- `consent_records`
- `verification_events`
- `seafarer_documents`

Readiness output:

- `seafarer_readiness`

### 4.2 Individual user / non-seafarer flow

Canonical records:

- `physical_persons`
- optional `consent_records`
- optional `billing_accounts` for later product scope

Current limitation:

- no dedicated non-seafarer public role code is defined yet.

Readiness output:

- no dedicated readiness view yet.

### 4.3 Business representative flow

Canonical records:

- `physical_persons`
- `user_roles` with `business_representative` or `business_admin`
- `company_representatives`
- `representative_documents`
- `consent_records`
- `verification_events`

Readiness output:

- `business_readiness`

### 4.4 Business client company flow

Canonical records:

- `business_clients`
- `business_documents`
- `company_representatives`
- `consent_records`
- `verification_events`

Supporting relationship records when applicable:

- `business_client_vessels`
- `vessels`
- `vessel_documents`

Readiness output:

- `business_readiness`

### 4.5 Internal operator flow

Canonical records:

- `physical_persons`
- `user_roles` with one or more of:
  - `verifier`
  - `reviewer`
  - `complaint_operator`
  - `billing_operator`

Current limitation:

- `Admin` is a planning umbrella, not a dedicated database role code.

## 5. Category Mapping Rules

### 5.1 Seafarer

Entry type:

- public self-registration.

Primary automation outcome:

- create a person root and a seafarer operational profile.

### 5.2 Individual user / non-seafarer

Entry type:

- public or assisted registration for a non-seafarer person.

Primary automation outcome:

- create a person root without forcing the seafarer path.

### 5.3 Business client representative

Entry type:

- self-registration, invitation acceptance or assisted onboarding.

Primary automation outcome:

- attach a verified or reviewable person to a business client.

### 5.4 Shipowner company

Entry type:

- company-first onboarding.

Primary automation outcome:

- create a `business_clients` shell with `operational_role = 'shipowner'` and at least one representative path.

### 5.5 Vessel operator

Primary automation outcome:

- create a `business_clients` shell with `operational_role = 'vessel_operator'` and optional vessel relationship records.

### 5.6 Ship manager

Primary automation outcome:

- create a `business_clients` shell with `operational_role = 'ship_manager'` and optional vessel relationship records.

### 5.7 Crew manager

Primary automation outcome:

- create a `business_clients` shell with `operational_role = 'crew_manager'`.

### 5.8 Manning agency

Primary automation outcome:

- create a `business_clients` shell with `operational_role = 'manning_agency'` and representative verification path.

### 5.9 Training provider

Primary automation outcome:

- create a `business_clients` shell with `operational_role = 'training_provider'`.

### 5.10 Medical provider

Primary automation outcome:

- create a `business_clients` shell with `operational_role = 'medical_provider'`.

### 5.11 Travel provider

Primary automation outcome:

- create a `business_clients` shell with `operational_role = 'travel_provider'`.

### 5.12 Admin

Primary automation outcome:

- map internal operators to explicit `user_roles` rather than to a generic admin entity.

## 6. Shared Consent and Verification Pattern

Every externally facing registration path should plan for:

1. category-specific intake acknowledgement;
2. privacy consent where applicable;
3. verification consent where applicable;
4. initial `verification_events` row with pending or informational state.

Provider and agency categories may later require narrower consent bundles, but that is not modeled yet in this planning step.

## 7. Readiness and Review Outputs

The current planning outputs are:

- `seafarer_readiness` for seafarer onboarding status;
- `business_readiness` for business client and representative readiness;
- operator review surfaces for downstream request and matching flows.

No dedicated readiness view exists yet for a generic non-seafarer individual user.

## 8. Known Planning Gaps

The workflow plan still has these explicit gaps:

1. no explicit non-seafarer public role model;
2. no single `admin` role code;
3. provider-specific document taxonomies are still policy-driven;
4. no final API contract is defined yet;
5. no implementation approval exists.

## 9. Final Control Statement

This workflow specification is planning material only. Implementation is not approved yet.