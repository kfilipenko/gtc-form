# CrewPortGlobal — Registration Automation Readiness Plan

- Project: CrewPortGlobal
- Document owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Version: 0.1
- Status: Planning baseline
- Classification: Internal
- Effective date: 2026-05-10
- Review date: 2026-06-10

## 1. Purpose

This document defines the planning package for automation readiness of CrewPortGlobal registration flows by category.

It builds on the isolated database and onboarding-planning artifacts and translates them into an automation-oriented readiness view.

## 2. Scope Boundaries

This workstream is limited to planning artifacts inside `docs/crewportglobal/` and `projects/crewportglobal/workflows/`.

Hard constraints:

1. SQL must not be executed.
2. No database may be touched.
3. Global auth schema must not be changed.
4. Current Stripe workflow must not be changed.
5. Nginx must not be changed.
6. Implementation is not approved yet.

## 3. Current Readiness Baseline

The current planning baseline already provides the main data surfaces required for registration automation planning:

- `crewport.physical_persons` as the root person record;
- `crewport.user_roles` for operational role assignment;
- `crewport.seafarers` and `crewport.seafarer_documents` for seafarer onboarding;
- `crewport.business_clients`, `crewport.company_representatives`, `crewport.business_documents` and `crewport.representative_documents` for company onboarding;
- `crewport.vessels`, `crewport.business_client_vessels` and `crewport.vessel_documents` for vessel-linked business flows;
- `crewport.consent_records` and `crewport.verification_events` for evidence and audit;
- `crewport.seafarer_readiness` and `crewport.business_readiness` as the main readiness outputs.

This means the planning package is already strong enough to define automation paths without introducing new SQL in this step.

## 4. Stage 1 Guardrails

The automation package must preserve the current Stage 1 policy boundaries inside the flow definitions themselves.

### 4.1 Seafarer no-fee rule

For the seafarer path, automation must explicitly preserve all of the following:

- registration captures a No Recruitment Fees acknowledgement;
- the registration flow does not create any recruitment fee or placement fee for the seafarer;
- optional paid services, if introduced later, must not affect access to vacancies.

### 4.2 Billing separation

Billing remains project-local and bounded.

- CrewPortGlobal billing must remain separated from other GTC services;
- the current Stripe workflow remains out of scope;
- no billable step may be attached to the Stage 1 seafarer access path.

### 4.3 Internal-only admin rule

`Admin` is internal-only at Stage 1.

- public self-registration for `Admin` is prohibited;
- admin access requires manual provisioning and approval.

## 5. Category Coverage

The registration automation planning package covers these categories:

1. Seafarer
2. Individual user / non-seafarer
3. Business client representative
4. Shipowner company
5. Vessel operator
6. Ship manager
7. Crew manager
8. Manning agency
9. Training provider
10. Medical provider
11. Travel provider
12. Admin

## 6. Readiness Assessment by Category

### 6.1 Planning-ready or bounded categories

The following categories are sufficiently defined for re-review under the current planning model:

- Seafarer
- Individual user / non-seafarer
- Business client representative
- Shipowner company
- Vessel operator
- Ship manager
- Crew manager
- Manning agency
- Training provider
- Medical provider
- Travel provider
- Admin

These categories can already be mapped onto existing `crewport` planning entities, bounded Stage 1 rules and readiness outputs.

### 6.2 Bounded categories that still remain intentionally narrow

The following categories remain intentionally narrow even after this fix pass:

- Individual user / non-seafarer
- Admin

Current bounded semantics:

- `Individual user / non-seafarer` is a limited project account for a physical person who is not yet a seafarer and is not yet linked to a business client, but may later transition into `Seafarer` or `Business Client Representative`;
- `Admin` is internal-only and maps to explicit operator roles such as `verifier`, `reviewer`, `complaint_operator` and `billing_operator` through manual provisioning and approval.

These are controlled Stage 1 limitations, not undefined categories.

## 7. Workflow Outputs Created in This Planning Step

This readiness step introduces two workflow-level planning artifacts:

- `projects/crewportglobal/workflows/registration_flow_spec.md`
- `projects/crewportglobal/workflows/category_onboarding_matrix.md`

Purpose of these files:

- `registration_flow_spec.md` defines the canonical automation flow shapes;
- `category_onboarding_matrix.md` maps each requested category to concrete records, gates and outputs.

## 8. Shared Stage 1 States

The automation package uses the following common Stage 1 states as a planning model:

1. `draft`
2. `pending_consent`
3. `pending_documents`
4. `pending_human_review`
5. `active_limited`
6. `active_verified`
7. `suspended`
8. `rejected`

These states are a workflow-planning contract for implementation planning and do not yet imply that every state is stored as-is in the current SQL schema.

## 9. Automation Primitives

Every automated registration flow should be composed from the same planning primitives:

1. intake source and category resolution;
2. person creation or person resolution;
3. role assignment;
4. category-specific record creation;
5. consent capture;
6. verification event seeding;
7. readiness calculation;
8. operator review where required.

This keeps category-specific differences inside controlled branches without changing the global identity or billing boundary.

## 10. Mandatory Human Review Checkpoints

In Stage 1, human review is mandatory for:

1. seafarer profile verification;
2. document verification;
3. business client KYB approval;
4. representative authority approval;
5. vessel verification;
6. crew request approval before matching;
7. candidate submission to shipowner;
8. complaint escalation.

## 11. Handoff Criteria

The common handoff rule for Stage 1 is:

- `draft` -> `pending_consent` after intake capture;
- `pending_consent` -> `pending_documents` after required acknowledgements and consent capture;
- `pending_documents` -> `pending_human_review` once the minimum declared evidence set is submitted;
- `pending_human_review` -> `active_limited` or `active_verified` only after the required human checkpoint is completed;
- `suspended` and `rejected` remain operator-controlled outcomes.

## 12. Main Planning Gaps Before Re-Review

The following items still require product or operations clarification, but they no longer block re-review of the package:

1. whether `Individual user / non-seafarer` eventually gets a dedicated role code;
2. whether a dedicated generic readiness view is needed for limited individual accounts;
3. whether `Admin` should stay an umbrella label or later split into narrower provisioning templates;
4. category-specific consent bundles for providers and agency classes;
5. category-specific verification requirements for training, medical and travel providers;
6. onboarding UX entry points and API contract boundaries.

## 13. Review Path

Before any further review step, reviewers should confirm:

1. the category list is final enough for planning;
2. each category is mapped to the correct `crewport` records;
3. the no-fee seafarer rule is explicit in all relevant automation artifacts;
4. state transitions and handoff criteria are sufficient for operator review;
5. internal-only admin provisioning is explicit;
6. workflow planning remains isolated from SQL execution and infrastructure changes.

## 14. Planning Recommendation

Recommendation: the registration automation planning package is ready for re-review.

The package is suitable for another planning review pass, but implementation is still not approved.

## 15. Final Control Statement

Registration automation planning package is ready for re-review.
Implementation remains not approved.