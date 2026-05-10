# CrewPortGlobal — Registration Automation Fix Plan

- Project: CrewPortGlobal
- Document owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Version: 0.1
- Status: Planning baseline
- Classification: Internal
- Effective date: 2026-05-10
- Review date: 2026-06-10

## 1. Purpose

This document defines the minimum planning fixes required after the first registration automation planning review.

It is limited to documentation updates and does not authorize implementation.

## 2. Review Input

This fix plan responds to the blockers identified in:

- `docs/crewportglobal/36_registration_automation_planning_review.md`

Main blockers to close:

1. make the seafarer no-fee rule explicit inside the automation package;
2. define `Individual user / non-seafarer` as a bounded Stage 1 account type;
3. define `Admin` as internal-only manual provisioning;
4. add category states and handoff criteria;
5. add explicit Stage 1 human-review checkpoints.

## 3. Fix Scope

This fix plan updates only:

- `docs/crewportglobal/35_registration_automation_readiness_plan.md`
- `projects/crewportglobal/workflows/registration_flow_spec.md`
- `projects/crewportglobal/workflows/category_onboarding_matrix.md`

This fix plan does not:

- execute SQL;
- touch any database;
- change global auth schema;
- change current Stripe workflow;
- change nginx;
- approve implementation.

## 4. Required Fixes

### 4.1 Seafarer no-fee guardrail

The updated planning package must explicitly state that:

- seafarer registration includes a No Recruitment Fees acknowledgement;
- no recruitment or placement fee is created for the seafarer path;
- optional paid services, if introduced later, must not affect access to vacancies.

### 4.2 Individual user / non-seafarer definition

The updated planning package must define this category as:

- a limited project account for a physical person;
- not yet a seafarer;
- not yet linked to a business client;
- able to transition later into `Seafarer` or `Business Client Representative`.

### 4.3 Admin provisioning rule

The updated planning package must define `Admin` as:

- internal-only;
- prohibited from public self-registration;
- created through manual provisioning and approval.

### 4.4 Shared state model

The updated planning package must adopt this common Stage 1 state set:

- `draft`
- `pending_consent`
- `pending_documents`
- `pending_human_review`
- `active_limited`
- `active_verified`
- `suspended`
- `rejected`

### 4.5 Human-review checkpoints

The updated planning package must explicitly mark these Stage 1 checkpoints as human-review mandatory:

- seafarer profile verification;
- document verification;
- business client KYB approval;
- representative authority approval;
- vessel verification;
- crew request approval before matching;
- candidate submission to shipowner;
- complaint escalation.

## 5. Expected Output of This Fix Pass

After these planning changes are applied, the package should be ready for re-review.

It should still remain implementation-blocked until a separate implementation-planning review says otherwise.

## 6. Final Control Statement

Registration automation planning package is ready for re-review.
Implementation remains not approved.