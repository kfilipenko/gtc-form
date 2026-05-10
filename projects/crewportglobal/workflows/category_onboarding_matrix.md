# CrewPortGlobal — Workflow Category Onboarding Matrix

- Project: CrewPortGlobal
- Scope: planning-only category matrix for registration automation
- Status: Planning baseline

## 1. Purpose

This matrix maps the requested registration categories to the current CrewPortGlobal planning entities, role assignments, consent requirements and readiness outputs.

## 2. Matrix

| Category | Entry mode | Canonical records | Primary role or business mapping | Minimum consents | Stage 1 states | Verification checkpoints | Handoff criterion | Readiness output | Planning readiness | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Seafarer | Public self-registration | `physical_persons`, `user_roles`, `seafarers`, `consent_records`, `verification_events`, `seafarer_documents` | `user_roles.role_code = 'seafarer'` | no-fee acknowledgement, privacy, matching, verification | `draft` -> `pending_consent` -> `pending_documents` -> `pending_human_review` -> `active_limited` or `active_verified` | seafarer profile verification, document verification | consent captured and minimum declared document set submitted | `seafarer_readiness` | Planning-ready | No recruitment or placement fee may be created; optional paid services must not affect access to vacancies |
| Individual user / non-seafarer | Public or assisted registration | `physical_persons`, `consent_records` | limited project account; not yet seafarer and not yet business-linked | privacy and purpose acknowledgement | `draft` -> `pending_consent` -> `pending_human_review` -> `active_limited` | identity or purpose validation | consent captured and purpose validated | no dedicated view yet | Planning-ready with bounded semantics | May later transition into `Seafarer` or `Business Client Representative`; no automatic billing handoff |
| Business client representative | Self-registration, invite or assisted onboarding | `physical_persons`, `user_roles`, `company_representatives`, `representative_documents`, `consent_records`, `verification_events` | `business_representative` or `business_admin` | privacy, authority acknowledgement, verification | `draft` -> `pending_consent` -> `pending_documents` -> `pending_human_review` -> `active_limited` or `active_verified` | representative authority approval, document verification | authority evidence and required consents captured | `business_readiness` | Planning-ready | Business-linked person path |
| Shipowner company | Company-first onboarding | `business_clients`, `business_documents`, `company_representatives`, `consent_records`, `verification_events` | `business_clients.operational_role = 'shipowner'` | privacy, verification, business onboarding | `draft` -> `pending_consent` -> `pending_documents` -> `pending_human_review` -> `active_limited` or `active_verified` | business client KYB approval, representative authority approval | KYB evidence and representative path present | `business_readiness` | Planning-ready | May later add vessels |
| Vessel operator | Company-first onboarding | `business_clients`, `company_representatives`, `business_documents`, optional `business_client_vessels`, `vessels`, `vessel_documents` | `operational_role = 'vessel_operator'` | privacy, verification, business onboarding | `draft` -> `pending_consent` -> `pending_documents` -> `pending_human_review` -> `active_limited` or `active_verified` | business client KYB approval, representative authority approval, vessel verification where declared | business evidence and any declared vessel evidence present | `business_readiness` | Planning-ready | Vessel context usually relevant |
| Ship manager | Company-first onboarding | `business_clients`, `company_representatives`, `business_documents`, optional `business_client_vessels`, `vessels`, `vessel_documents` | `operational_role = 'ship_manager'` | privacy, verification, business onboarding | `draft` -> `pending_consent` -> `pending_documents` -> `pending_human_review` -> `active_limited` or `active_verified` | business client KYB approval, representative authority approval, vessel verification where declared | business evidence and any declared vessel evidence present | `business_readiness` | Planning-ready | Operationally similar to vessel operator |
| Crew manager | Company-first onboarding | `business_clients`, `company_representatives`, `business_documents`, `consent_records`, `verification_events` | `operational_role = 'crew_manager'` | privacy, verification, business onboarding | `draft` -> `pending_consent` -> `pending_documents` -> `pending_human_review` -> `active_limited` or `active_verified` | business client KYB approval, representative authority approval | business and representative evidence present | `business_readiness` | Planning-ready | Vessel link optional |
| Manning agency | Company-first onboarding | `business_clients`, `company_representatives`, `business_documents`, `consent_records`, `verification_events` | `operational_role = 'manning_agency'` | privacy, verification, business onboarding | `draft` -> `pending_consent` -> `pending_documents` -> `pending_human_review` -> `active_limited` or `active_verified` | business client KYB approval, representative authority approval | business, representative and policy-specific evidence present | `business_readiness` | Planning-ready | Licensing specifics remain policy-driven |
| Training provider | Company-first onboarding | `business_clients`, `company_representatives`, `business_documents`, `consent_records`, `verification_events` | `operational_role = 'training_provider'` | privacy, verification, business onboarding | `draft` -> `pending_consent` -> `pending_documents` -> `pending_human_review` -> `active_limited` or `active_verified` | business client KYB approval, representative authority approval | business, representative and provider evidence present | `business_readiness` | Planning-ready | Provider evidence taxonomy still generic |
| Medical provider | Company-first onboarding | `business_clients`, `company_representatives`, `business_documents`, `consent_records`, `verification_events` | `operational_role = 'medical_provider'` | privacy, verification, business onboarding | `draft` -> `pending_consent` -> `pending_documents` -> `pending_human_review` -> `active_limited` or `active_verified` | business client KYB approval, representative authority approval | business, representative and provider evidence present | `business_readiness` | Planning-ready | Provider evidence taxonomy still generic |
| Travel provider | Company-first onboarding | `business_clients`, `company_representatives`, `business_documents`, `consent_records`, `verification_events` | `operational_role = 'travel_provider'` | privacy, verification, business onboarding | `draft` -> `pending_consent` -> `pending_documents` -> `pending_human_review` -> `active_limited` or `active_verified` | business client KYB approval, representative authority approval | business, representative and provider evidence present | `business_readiness` | Planning-ready | Provider evidence taxonomy still generic |
| Admin | Internal invitation or assisted provisioning | `physical_persons`, `user_roles` | one or more of `verifier`, `reviewer`, `complaint_operator`, `billing_operator` | internal policy-driven | `draft` -> `pending_human_review` -> `active_limited` or `active_verified` | internal role verification | manual provisioning request and internal approval complete | no dedicated public readiness view | Planning-ready with bounded semantics | Public self-registration prohibited; treat `Admin` as internal-only umbrella label |

## 3. Category Grouping Rules

### 3.1 Individual path

The individual path currently splits into:

- seafarer, which is explicit and modeled;
- non-seafarer individual, which is still only partially explicit.

### 3.2 Business path

All company categories currently map to the same core business onboarding spine:

- `business_clients`
- `company_representatives`
- `business_documents`
- `consent_records`
- `verification_events`

Category-specific behavior is primarily a function of `operational_role` plus policy rules.

### 3.3 Internal operator path

The internal operator path should use explicit operator roles rather than a generic catch-all admin implementation.

## 4. Known Gaps

The matrix keeps these gaps visible:

1. no dedicated non-seafarer readiness view;
2. no dedicated `admin` role code;
3. provider-specific document taxonomy is still generic;
4. detailed category-specific consent bundles are not finalized.

## 5. Stage 1 Mandatory Human Review Checkpoints

In Stage 1, human review is mandatory for:

1. seafarer profile verification;
2. document verification;
3. business client KYB approval;
4. representative authority approval;
5. vessel verification;
6. crew request approval before matching;
7. candidate submission to shipowner;
8. complaint escalation.

## 6. Final Control Statement

Registration automation planning package is ready for re-review.
Implementation remains not approved.