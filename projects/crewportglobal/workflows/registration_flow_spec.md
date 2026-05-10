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
8. state transition into the next gated stage;
9. readiness evaluation through the relevant view or operator queue.

## 4. Shared Stage 1 States

The common workflow state model for Stage 1 is:

1. `draft`
2. `pending_consent`
3. `pending_documents`
4. `pending_human_review`
5. `active_limited`
6. `active_verified`
7. `suspended`
8. `rejected`

These states are planning-level workflow states and may map later to one or more concrete schema states.

## 5. Canonical Flow Groups

### 5.1 Seafarer flow

Canonical records:

- `physical_persons`
- `user_roles` with `seafarer`
- `seafarers`
- `consent_records`
- `verification_events`
- `seafarer_documents`

Required Stage 1 guardrails:

- capture a No Recruitment Fees acknowledgement;
- do not create any recruitment fee or placement fee;
- keep optional paid services, if introduced later, completely separate from vacancy access.

Typical state path:

- `draft`
- `pending_consent`
- `pending_documents`
- `pending_human_review`
- `active_limited` or `active_verified`

Readiness output:

- `seafarer_readiness`

### 5.2 Individual user / non-seafarer flow

Canonical records:

- `physical_persons`
- `consent_records`

Stage 1 definition:

- limited project account for a physical person;
- not yet a seafarer;
- not yet linked to a business client;
- may later transition into `Seafarer` or `Business Client Representative`.

Billing rule:

- no automatic billing handoff is allowed at initial registration;
- any later billing scope must be a separate approved product flow.

Typical state path:

- `draft`
- `pending_consent`
- `pending_human_review`
- `active_limited`

Readiness output:

- no dedicated readiness view yet.

### 5.3 Business representative flow

Canonical records:

- `physical_persons`
- `user_roles` with `business_representative` or `business_admin`
- `company_representatives`
- `representative_documents`
- `consent_records`
- `verification_events`

Typical state path:

- `draft`
- `pending_consent`
- `pending_documents`
- `pending_human_review`
- `active_limited` or `active_verified`

Readiness output:

- `business_readiness`

### 5.4 Business client company flow

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

Typical state path:

- `draft`
- `pending_consent`
- `pending_documents`
- `pending_human_review`
- `active_limited` or `active_verified`

Readiness output:

- `business_readiness`

### 5.5 Internal operator flow

Canonical records:

- `physical_persons`
- `user_roles` with one or more of:
  - `verifier`
  - `reviewer`
  - `complaint_operator`
  - `billing_operator`

Stage 1 rule:

- `Admin` is internal-only;
- public self-registration for `Admin` is prohibited;
- creation happens only through manual provisioning and approval;
- `Admin` remains an umbrella operational label, not a dedicated public database role code.

Typical state path:

- `draft`
- `pending_human_review`
- `active_limited` or `active_verified`

## 6. Category Mapping Rules

### 6.1 Seafarer

Entry type:

- public self-registration.

Primary automation outcome:

- create a person root and a seafarer operational profile.

Handoff criterion:

- move to human review only after consent capture and minimum declared document set submission.

### 6.2 Individual user / non-seafarer

Entry type:

- public or assisted registration for a non-seafarer person.

Primary automation outcome:

- create a limited project account without forcing the seafarer path or business linkage.

Handoff criterion:

- move to human review after required consent capture and purpose validation.

### 6.3 Business client representative

Entry type:

- self-registration, invitation acceptance or assisted onboarding.

Primary automation outcome:

- attach a verified or reviewable person to a business client.

Handoff criterion:

- move to human review after authority evidence and required consents are captured.

### 6.4 Shipowner company

Entry type:

- company-first onboarding.

Primary automation outcome:

- create a `business_clients` shell with `operational_role = 'shipowner'` and at least one representative path.

Handoff criterion:

- move to human review after KYB evidence and primary representative authority path are present.

### 6.5 Vessel operator

Primary automation outcome:

- create a `business_clients` shell with `operational_role = 'vessel_operator'` and optional vessel relationship records.

Handoff criterion:

- move to human review after business evidence and any declared vessel linkage evidence are present.

### 6.6 Ship manager

Primary automation outcome:

- create a `business_clients` shell with `operational_role = 'ship_manager'` and optional vessel relationship records.

Handoff criterion:

- move to human review after business evidence and any declared vessel linkage evidence are present.

### 6.7 Crew manager

Primary automation outcome:

- create a `business_clients` shell with `operational_role = 'crew_manager'`.

Handoff criterion:

- move to human review after business evidence and representative authority evidence are present.

### 6.8 Manning agency

Primary automation outcome:

- create a `business_clients` shell with `operational_role = 'manning_agency'` and representative verification path.

Handoff criterion:

- move to human review after business evidence, representative authority evidence and policy-specific evidence are present.

### 6.9 Training provider

Primary automation outcome:

- create a `business_clients` shell with `operational_role = 'training_provider'`.

Handoff criterion:

- move to human review after business evidence, representative authority evidence and provider evidence are present.

### 6.10 Medical provider

Primary automation outcome:

- create a `business_clients` shell with `operational_role = 'medical_provider'`.

Handoff criterion:

- move to human review after business evidence, representative authority evidence and provider evidence are present.

### 6.11 Travel provider

Primary automation outcome:

- create a `business_clients` shell with `operational_role = 'travel_provider'`.

Handoff criterion:

- move to human review after business evidence, representative authority evidence and provider evidence are present.

### 6.12 Admin

Primary automation outcome:

- map internal operators to explicit `user_roles` rather than to a generic admin entity.

Handoff criterion:

- move to human review only after manual provisioning request and internal approval are complete.

## 7. Shared Consent and Verification Pattern

Every externally facing registration path should plan for:

1. category-specific intake acknowledgement;
2. privacy consent where applicable;
3. verification consent where applicable;
4. initial `verification_events` row with pending or informational state.

Provider and agency categories may later require narrower consent bundles, but that is not modeled yet in this planning step.

## 8. Stage 1 Mandatory Human Review Checkpoints

In Stage 1, human review is mandatory for:

1. seafarer profile verification;
2. document verification;
3. business client KYB approval;
4. representative authority approval;
5. vessel verification;
6. crew request approval before matching;
7. candidate submission to shipowner;
8. complaint escalation.

## 9. Readiness and Review Outputs

The current planning outputs are:

- `seafarer_readiness` for seafarer onboarding status;
- `business_readiness` for business client and representative readiness;
- operator review surfaces for downstream request and matching flows.

No dedicated readiness view exists yet for a generic non-seafarer individual user.

## 10. Known Planning Gaps

The workflow plan still has these explicit gaps:

1. no dedicated non-seafarer readiness view;
2. no single `admin` role code;
3. provider-specific document taxonomies are still policy-driven;
4. no final API contract is defined yet;
5. no implementation approval exists.

## 11. Final Control Statement

Registration automation planning package is ready for re-review.
Implementation remains not approved.