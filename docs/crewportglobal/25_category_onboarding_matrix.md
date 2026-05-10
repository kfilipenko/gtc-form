# CrewPortGlobal — Category Onboarding Matrix

- Document owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Version: 0.1
- Status: Planning baseline
- Classification: Internal
- Effective date: 2026-05-10
- Review date: 2026-06-10

## 1. Purpose

This matrix defines the minimum record set, verification checkpoints and readiness outputs for each major CrewPortGlobal onboarding category.

It is intentionally aligned with the isolated `crewport` schema proposal and does not assume immediate coupling to global auth or current Stripe workflows.

## 2. Matrix

| Category | Primary actor | Core records created | Optional global identity link | Minimum consents | Verification checkpoints | Readiness / queue output | Blocking notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Seafarer self-registration | Physical person acting as candidate | `physical_persons`, `seafarers`, `consent_records`, `verification_events` | `gtc_user_id` may be null at first | public onboarding, privacy, matching, verification | identity evidence, document intake, professional readiness | `seafarer_readiness` | Do not require shared auth before acceptance flow works |
| Seafarer document completion | Existing seafarer | `seafarer_documents`, `verification_events` | optional | none beyond baseline onboarding consents | document validity, expiry, review outcome | `seafarer_readiness` | Missing documents keeps readiness incomplete |
| Business-client self-registration | Company plus primary representative | `business_clients`, `physical_persons`, `company_representatives`, `consent_records`, `verification_events` | optional for representative only | privacy, verification, business onboarding | legal entity review, authority review, sanctions or risk review | `business_readiness` | Business shell should not imply immediate billing activation |
| Representative invitation acceptance | Additional company representative | `physical_persons`, `company_representatives`, `consent_records`, `verification_events` | optional | privacy, authority acknowledgement | authority evidence, invitation acceptance, representative verification | `business_readiness` | Invitation flow must not mutate shared auth schema |
| Vessel onboarding | Business client with vessel context | `vessels`, `verification_events` | not applicable | none beyond client baseline | IMO or vessel identity, ownership or management context | `business_readiness` | Vessel rows should be linked to known business workflows only |
| Crew request intake | Verified or reviewable business user | `crew_requests`, `crew_request_positions`, `verification_events` | not required | business baseline consents already on file | request legitimacy, representative authority, vessel context where needed | `open_crew_requests` | Request should stay blocked if verification gate is not cleared |
| Candidate match seeding | Operator or matching engine | `candidate_matches` | not required | none | review-queue admission, suitability review | `match_review_queue` | Automated scoring must not bypass human review |
| Billing activation | Person or business with billable product scope | `billing_accounts`, `service_entitlements` | optional | billing consent if applicable | billing owner check, entitlement approval | `project_entitlements` | Must stay isolated from current Stripe workflow at this stage |
| Complaint intake | Seafarer or business participant | `complaint_records`, `verification_events` | optional | complaint handling acknowledgement if introduced | complaint classification and triage | complaint workflow outside current scope; linked audit trail inside `verification_events` | Complaint path must remain available even if registration is incomplete |

## 3. Category rules

### 3.1 Seafarer categories

The seafarer path is acceptance-first.

This means a physical person and a seafarer operational profile may exist before any later global identity binding is introduced.

### 3.2 Business categories

Business onboarding is company-first but still representative-aware.

A business client should not be considered ready for request intake until at least one representative has a verified authority path.

### 3.3 Operational workflows

Vessels, crew requests and candidate matches are operational records, not identity roots.

They should depend on upstream readiness and verification state rather than defining identity on their own.

### 3.4 Billing and complaints

Billing and complaints must remain project-local in this stage.

The issue explicitly excludes changing the global Stripe workflow and the global auth model, so these categories should be modeled independently and only integrated later by separate approval.

## 4. Review checklist

Before any implementation phase begins beyond planning:

1. confirm each onboarding category really needs a dedicated table path;
2. confirm where `gtc_user_id` may remain null;
3. confirm readiness-state semantics for operators;
4. confirm which consent types are mandatory at onboarding versus later lifecycle stages;
5. confirm that billing activation remains separate from public onboarding.