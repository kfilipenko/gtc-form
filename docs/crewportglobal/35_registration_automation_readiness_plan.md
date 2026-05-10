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

## 4. Category Coverage

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

## 5. Readiness Assessment by Category

### 5.1 Planning-ready categories

The following categories are planning-ready under the current data model:

- Seafarer
- Business client representative
- Shipowner company
- Vessel operator
- Ship manager
- Crew manager
- Manning agency
- Training provider
- Medical provider
- Travel provider

These categories can already be mapped onto existing `crewport` planning entities and readiness outputs.

### 5.2 Partial-model categories

The following categories are only partially explicit in the current planning model:

- Individual user / non-seafarer
- Admin

Current reason:

- there is no dedicated self-service role code for a generic non-seafarer individual user;
- there is no single `admin` role code, only internal operator roles such as `verifier`, `reviewer`, `complaint_operator` and `billing_operator`.

These are planning gaps, not implementation blockers for the rest of the package.

## 6. Workflow Outputs Created in This Planning Step

This readiness step introduces two workflow-level planning artifacts:

- `projects/crewportglobal/workflows/registration_flow_spec.md`
- `projects/crewportglobal/workflows/category_onboarding_matrix.md`

Purpose of these files:

- `registration_flow_spec.md` defines the canonical automation flow shapes;
- `category_onboarding_matrix.md` maps each requested category to concrete records, gates and outputs.

## 7. Automation Primitives

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

## 8. Main Planning Gaps Before Implementation Review

The following items still require explicit product or operations decisions before implementation planning can advance:

1. exact semantics for `Individual user / non-seafarer`;
2. whether a dedicated non-seafarer role code is needed later;
3. whether `Admin` remains an umbrella label or must always map to explicit operator roles;
4. category-specific consent bundles for providers and agency classes;
5. category-specific verification requirements for training, medical and travel providers;
6. onboarding UX entry points and API contract boundaries.

## 9. Review Path

Before any implementation work is proposed, reviewers should confirm:

1. the category list is final enough for planning;
2. each category is mapped to the correct `crewport` records;
3. readiness outputs are sufficient for operator review;
4. partial-model categories are explicitly acknowledged;
5. workflow planning remains isolated from SQL execution and infrastructure changes.

## 10. Planning Recommendation

Recommendation: the registration automation planning package is ready for review.

The package is suitable for architecture and workflow review, but not for implementation approval.

## 11. Final Control Statement

Registration automation planning package is ready for review. Implementation is not approved yet.