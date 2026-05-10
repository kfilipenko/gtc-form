# CrewPortGlobal — Workflow Category Onboarding Matrix

- Project: CrewPortGlobal
- Scope: planning-only category matrix for registration automation
- Status: Planning baseline

## 1. Purpose

This matrix maps the requested registration categories to the current CrewPortGlobal planning entities, role assignments, consent requirements and readiness outputs.

## 2. Matrix

| Category | Entry mode | Canonical records | Primary role or business mapping | Minimum consents | Verification checkpoints | Readiness output | Planning readiness | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Seafarer | Public self-registration | `physical_persons`, `user_roles`, `seafarers`, `consent_records`, `verification_events`, `seafarer_documents` | `user_roles.role_code = 'seafarer'` | onboarding, privacy, matching, verification | identity, maritime documents, readiness review | `seafarer_readiness` | Planning-ready | Canonical public candidate path |
| Individual user / non-seafarer | Public or assisted registration | `physical_persons`, optional `consent_records` | no dedicated public role code yet | privacy as required by flow | identity or use-case-specific review | no dedicated view yet | Partial-model | Needs explicit product semantics |
| Business client representative | Self-registration, invite or assisted onboarding | `physical_persons`, `user_roles`, `company_representatives`, `representative_documents`, `consent_records`, `verification_events` | `business_representative` or `business_admin` | privacy, authority acknowledgement, verification | authority evidence, representative review | `business_readiness` | Planning-ready | Business-linked person path |
| Shipowner company | Company-first onboarding | `business_clients`, `business_documents`, `company_representatives`, `consent_records`, `verification_events` | `business_clients.operational_role = 'shipowner'` | privacy, verification, business onboarding | legal entity, representative authority | `business_readiness` | Planning-ready | May later add vessels |
| Vessel operator | Company-first onboarding | `business_clients`, `company_representatives`, `business_documents`, optional `business_client_vessels`, `vessels`, `vessel_documents` | `operational_role = 'vessel_operator'` | privacy, verification, business onboarding | legal entity, representative, vessel linkage as needed | `business_readiness` | Planning-ready | Vessel context usually relevant |
| Ship manager | Company-first onboarding | `business_clients`, `company_representatives`, `business_documents`, optional `business_client_vessels`, `vessels`, `vessel_documents` | `operational_role = 'ship_manager'` | privacy, verification, business onboarding | legal entity, representative, vessel linkage as needed | `business_readiness` | Planning-ready | Operationally similar to vessel operator |
| Crew manager | Company-first onboarding | `business_clients`, `company_representatives`, `business_documents`, `consent_records`, `verification_events` | `operational_role = 'crew_manager'` | privacy, verification, business onboarding | legal entity, representative authority | `business_readiness` | Planning-ready | Vessel link optional |
| Manning agency | Company-first onboarding | `business_clients`, `company_representatives`, `business_documents`, `consent_records`, `verification_events` | `operational_role = 'manning_agency'` | privacy, verification, business onboarding | legal entity, representative authority, policy review | `business_readiness` | Planning-ready | Licensing specifics remain policy-driven |
| Training provider | Company-first onboarding | `business_clients`, `company_representatives`, `business_documents`, `consent_records`, `verification_events` | `operational_role = 'training_provider'` | privacy, verification, business onboarding | legal entity, representative authority, provider evidence | `business_readiness` | Planning-ready | Provider evidence taxonomy still generic |
| Medical provider | Company-first onboarding | `business_clients`, `company_representatives`, `business_documents`, `consent_records`, `verification_events` | `operational_role = 'medical_provider'` | privacy, verification, business onboarding | legal entity, representative authority, provider evidence | `business_readiness` | Planning-ready | Provider evidence taxonomy still generic |
| Travel provider | Company-first onboarding | `business_clients`, `company_representatives`, `business_documents`, `consent_records`, `verification_events` | `operational_role = 'travel_provider'` | privacy, verification, business onboarding | legal entity, representative authority, provider evidence | `business_readiness` | Planning-ready | Provider evidence taxonomy still generic |
| Admin | Internal invitation or assisted provisioning | `physical_persons`, `user_roles` | one or more of `verifier`, `reviewer`, `complaint_operator`, `billing_operator` | internal policy-driven | internal role verification | no dedicated public readiness view | Partial-model | Treat `Admin` as umbrella label, not as a DB role code |

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

## 5. Final Control Statement

This onboarding matrix is planning material only. Implementation is not approved yet.