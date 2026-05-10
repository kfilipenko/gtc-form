# CrewPortGlobal — Registration Automation Planning Review

- Project: CrewPortGlobal
- Document owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Version: 0.1
- Status: Internal review
- Classification: Internal
- Effective date: 2026-05-10
- Review date: 2026-06-10
- Reviewed artifacts:
  - docs/crewportglobal/35_registration_automation_readiness_plan.md
  - projects/crewportglobal/workflows/registration_flow_spec.md
  - projects/crewportglobal/workflows/category_onboarding_matrix.md
  - projects/crewportglobal/db/002_crewport_schema.sql
  - projects/crewportglobal/db/003_crewport_indexes.sql
  - projects/crewportglobal/db/004_crewport_views.sql

## 1. Scope

This review checks whether the current registration automation planning package is complete enough to move from planning review into implementation-planning review.

This review does not authorize implementation.
No SQL was executed.
No database was touched.

## 2. Executive Summary

The registration automation package is structurally strong enough for architecture review, but it is not yet ready for implementation planning.

What is already good:

- the package preserves Stage 1 boundaries;
- the write targets largely map to existing `crewport` tables;
- all requested categories are present in the onboarding matrix;
- the package keeps CrewPortGlobal billing separate from current Stripe workflow at the planning level.

What still blocks implementation planning:

- the no-fee rule for seafarers is not explicitly carried into the automation package;
- `Individual user / non-seafarer` remains only partially modeled;
- `Admin` remains only an umbrella label, not a concrete onboarding model;
- category-level states and handoff rules are still too thin for implementation planning;
- billing entry conditions for non-seafarer flows are not sufficiently bounded.

## 3. Does document 35 cover its intended sections?

Result: yes.

Assessment:

- document 35 contains a clear purpose section;
- it includes hard boundaries and implementation prohibition;
- it defines category coverage;
- it explicitly marks planning-ready versus partial-model categories;
- it introduces workflow outputs and shared automation primitives;
- it lists main planning gaps and a review path;
- it closes with a control statement.

Conclusion: document 35 is structurally complete as a planning-readiness document.

## 4. Is `registration_flow_spec.md` complete enough?

Result: partial.

What is complete:

- canonical seafarer flow;
- canonical business representative flow;
- canonical business-client company flow;
- internal operator flow;
- shared primitives, consent pattern and explicit known gaps.

What is still incomplete for implementation planning:

- the non-seafarer individual flow does not define a concrete role or readiness model;
- the admin flow is defined only as a mapping convention, not as an onboarding scenario with approval states;
- no category-specific state machine is defined for intake, submitted, review and activation transitions;
- no explicit handoff contract is defined between public intake and operator review.

Conclusion: adequate for planning, not yet complete for implementation planning.

## 5. Are all requested categories present in `category_onboarding_matrix.md`?

Result: yes.

The matrix explicitly includes all requested categories:

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

Conclusion: category coverage is complete.

## 6. Do the write targets match real tables in `002_crewport_schema.sql`?

Result: mostly yes.

Confirmed table mappings:

- `physical_persons`
- `user_roles`
- `seafarers`
- `seafarer_documents`
- `business_clients`
- `company_representatives`
- `representative_documents`
- `business_documents`
- `vessels`
- `business_client_vessels`
- `consent_records`
- `verification_events`
- `billing_accounts`

Important caveat:

- the category workflows rely on policy semantics for `business_clients.operational_role`, but `operational_role` is an unrestricted text field in schema `002` rather than an enum or constrained taxonomy;
- this is acceptable for planning, but it means implementation logic would currently carry too much category interpretation outside the schema.

Conclusion: table write targets exist, but some category semantics are still policy-defined rather than schema-defined.

## 7. Are Stage 1 boundaries preserved?

Result: yes.

The package preserves the required boundaries:

- no SQL execution;
- no database access;
- no global auth schema changes;
- no current Stripe workflow changes;
- no nginx changes;
- implementation not approved yet.

Conclusion: Stage 1 boundaries are preserved.

## 8. Is the no-fee rule for seafarers preserved clearly enough?

Result: no.

This is one of the main review findings.

Assessment:

- the broader CrewPortGlobal documentation register clearly states that the platform does not charge seafarers recruitment or placement fees;
- document 35 does not restate this rule in the registration automation package;
- `registration_flow_spec.md` does not include a seafarer-specific no-fee control or billing exclusion statement;
- the category matrix also does not explicitly restate the no-fee rule for the seafarer path.

Why this matters:

- once registration is discussed as automation rather than policy, the no-fee rule needs to be carried into the flow definition itself;
- otherwise implementation planning can drift into ambiguous billing or upsell behavior on the seafarer path.

Conclusion: the no-fee rule is not yet explicit enough in the automation package.

## 9. Is CrewPortGlobal billing kept separate from other GTC services?

Result: mostly yes, with one planning caveat.

What is good:

- the package keeps Stripe changes out of scope;
- billing remains project-local at the schema level through `billing_accounts` and `service_entitlements`;
- the business-facing categories do not assume shared billing surfaces.

Planning caveat:

- the non-seafarer individual flow mentions optional `billing_accounts` for later product scope, but does not define when that handoff becomes allowed;
- without a stricter gate, implementation planning could mix generic individual registration with future billable features too early.

Conclusion: billing separation is preserved at boundary level, but the individual-user billing handoff is still underdefined.

## 10. Are there missing fields, states or handoff gaps?

Result: yes.

Main missing items:

### 10.1 Non-seafarer individual model gap

- no dedicated role code;
- no dedicated readiness output;
- no explicit state path equivalent to `seafarers.registration_state` or `business_clients.onboarding_state`.

### 10.2 Admin onboarding gap

- no dedicated admin role code;
- no explicit approval or provisioning sequence;
- no distinction between internal operator invitation, approval and activation states.

### 10.3 Category-state gap

- the workflow documents do not define explicit lifecycle states by category;
- business-client onboarding states exist in schema, but the automation package does not map each category to expected state transitions.

### 10.4 Handoff gap to operator review

- seafarer and business readiness outputs are named, but the documents do not define exact handoff triggers between intake completion and operator review;
- provider categories especially lack explicit review thresholds.

### 10.5 Consent-bundle gap

- provider and agency categories do not yet define category-specific consent sets;
- this remains policy-driven instead of flow-defined.

## 11. Recommendation

Recommendation: Not ready for implementation planning.

Rationale:

- the package is ready for planning review, but not yet for implementation planning;
- the seafarer no-fee rule must be made explicit inside the automation package;
- `Individual user / non-seafarer` still lacks a sufficiently concrete operational model;
- `Admin` still lacks a sufficiently concrete provisioning and approval model;
- category state transitions, consent bundles and handoff gates need one more planning pass.

## 12. Minimum Next Fixes Before Implementation Planning Review

The next planning pass should at minimum:

1. add an explicit no-fee guardrail for the seafarer path across document 35 and both workflow files;
2. define whether `Individual user / non-seafarer` gets its own role and readiness model or remains a limited auxiliary path;
3. define whether `Admin` stays an umbrella label or is replaced by explicit operator onboarding scenarios;
4. add state-transition expectations by category;
5. add explicit handoff criteria from intake to operator review;
6. tighten the billing handoff rule for non-seafarer individual paths.