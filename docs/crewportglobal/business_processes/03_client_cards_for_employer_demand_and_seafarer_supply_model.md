# CrewPortGlobal - BP-003 Client Cards For Employer Demand And Seafarer Supply Model

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Business-process ID: BP-003
- Source task: GitHub Issue #13 / CPG-BIZ-020
- Baseline: BP-001 and BP-002 business-process documentation
- Date: 2026-05-17
- Document type: Business-process card model and authorization boundary
- Status: Drafted for Project Owner review

## 1. Purpose

This document defines the practical CrewPortGlobal card model for registration, authentication, authorization, employer-side demand, seafarer-side supply and reviewed candidate recommendation.

The business goal is simple:

```text
CrewPortGlobal receives demand from an employer-side client.
CrewPortGlobal receives supply from a seafarer.
CrewPortGlobal compares hiring conditions with seafarer qualification and expectations.
When conditions are sufficiently aligned, CrewPortGlobal prepares a reviewed candidate recommendation for the employer-side crew request.
```

This is not automatic hiring.

This is not final employment approval.

Human review remains mandatory before a candidate is presented as suitable.

## 2. Registration, Authentication And Authorization

CrewPortGlobal must separate three concepts.

### 2.1 Registration

Registration means creating a physical person / user card.

Registration answers:

```text
Who is this person?
What basic identity and contact data did the person provide?
Which initial service path did the person request?
```

Registration does not automatically mean the person may act for a company, vessel, request or internal team.

### 2.2 Authentication

Authentication means confirming access to a service account.

Authentication answers:

```text
Can this person prove control of the login method for this service account?
```

Authentication may use:

```text
email code
password
session token
future SSO
future multi-factor method
```

Authentication does not automatically grant business authority or data visibility.

### 2.3 Authorization

Authorization means granting powers, roles, visibility and the right to act based on a proven basis.

Authorization answers:

```text
What may this authenticated person do?
Which service areas may this person access?
For which company, vessel, client, request or task may this person act?
What evidence proves that right?
Which records may this person see?
```

Authorization must be based on group membership, evidence and relationship to specific cards or records.

## 3. Person Is Not Equal To One Role

One person first registers as a physical person.

Different confirmed powers may later be linked to the same person.

Examples:

```text
same person may be a seafarer and later become a company representative
same person may represent more than one company if separately authorized
same person may be an internal specialist and also have a personal seafarer history
same person may be a company administrator for one company but only a viewer for another
```

The personal account must be assembled from all confirmed cards connected to the physical person.

The personal account must not assume:

```text
one person = one role
one login = all data
group membership = all records
company relationship = vessel authority automatically
vessel authority = authority for every crew request automatically
```

## 4. Practical Market Model

CrewPortGlobal should not start from abstract role ontology.

For the current business, the platform starts from a practical two-sided matching model:

```text
employer / buyer / demand
seafarer / workforce / supply
```

The platform must obtain from each side exactly the data needed to compare conditions.

The employer-side client describes demand.

The seafarer describes supply.

CrewPortGlobal compares the demand conditions with the supply conditions and prepares a reviewed recommendation when they align.

## 5. Employer-Side Client / Buyer / Demand Side

The employer-side client is the buyer / payer / demand side.

This person or organization is not always the direct legal employer. In CrewPortGlobal business language, the employer-side requester is the party authorized to submit a vacancy or crew request.

The employer-side requester may be:

```text
employer
ship manager
crewing manager
vessel operator
charterer
authorized company representative
shipowner with proven right to hire or request crew
other person acting under power of attorney or another verified basis
```

These are not separate primary business categories in the matching model.

They are all demand-side participants when they have verified authority to submit or manage a crew request.

## 6. Seafarer / Workforce / Supply Side

The seafarer is the workforce / professional resource / supply side.

For CrewPortGlobal, the key seafarer information is:

```text
qualification
rank
department
documents
certificates
experience
availability
expected compensation
accepted vessel types
desired or accepted position
contract expectations
languages
regional preferences or restrictions
conditions under which the seafarer is ready to work
```

The seafarer remains protected by the no-recruitment-fees rule.

The seafarer is not the main payer for employment placement.

## 7. Business Separation

CrewPortGlobal must preserve this business distinction:

| Side | Business meaning | Commercial role |
|---|---|---|
| Employer-side client | Buyer / payer / demand side | Pays for crew request, matching support, verification support, shortlist preparation or related B2B service |
| Seafarer | Professional asset / candidate / supply side | Provides workforce availability and qualifications; must not pay recruitment or placement fees |

Optional seafarer services may exist only when they are voluntary, separated from employment placement and not required for access to vacancies or matching workflows.

## 8. Core Card Types

CrewPortGlobal should use practical cards, not a complex abstract capability ontology.

The initial card model is:

```text
1. Physical Person Registration Card
2. Service Account / Login Card
3. Seafarer Workforce Card
4. Employer-Side Requester Card
5. Authority Evidence Card
6. Company Context Card
7. Vessel Context Card
8. Vacancy / Crew Request Card
```

These cards may be linked to one physical person, many companies, many vessels and many requests according to verified evidence and relationship rules.

## 9. Physical Person Registration Card

Purpose:

```text
Create the base person record.
```

This card records the person, not the final business authority.

Minimum data:

```text
physical_person_id
display_name
legal_name if required
email
phone if provided
country_of_residence
preferred_language
initial_requested_path
registration_source
registration_state
created_at
updated_at
```

This card may later connect to:

```text
service account
seafarer workforce card
employer-side requester card
authority evidence card
internal team membership
client relationship
```

Important rule:

```text
Creating this card does not prove employment authority, company authority, vessel authority or internal staff authority.
```

## 10. Service Account / Login Card

Purpose:

```text
Authenticate access to the platform.
```

This card records how the person logs in.

Minimum data:

```text
service_account_id
physical_person_id
login_email
authentication_method
account_state
last_login_at
last_authentication_method
session_policy
created_at
updated_at
```

This card supports:

```text
email-code login
password or future passwordless login
future SSO
future MFA
session management
account recovery
```

Important rule:

```text
Authentication proves access to the service account only. It does not grant visibility or authority by itself.
```

## 11. Seafarer Workforce Card

Purpose:

```text
Represent the seafarer as workforce / supply side.
```

This card records what the seafarer can offer and under which conditions.

Minimum data:

```text
seafarer_card_id
physical_person_id
rank
department
availability_date
expected_compensation
accepted_salary_currency
preferred_vessel_types
accepted_vessel_types
accepted_contract_duration
preferred_joining_region
restricted_regions
language_skills
certificate_summary
document_readiness_status
experience_summary
medical_readiness_status if provided
visa_or_travel_constraints if provided
profile_review_status
matching_visibility_state
no_recruitment_fee_control_status
created_at
updated_at
```

This card should answer:

```text
What work can this seafarer perform?
When is this seafarer available?
Under what employment conditions is this seafarer willing to work?
Which documents and certificates support the claim?
```

Important rule:

```text
The seafarer card is supply-side data. It is not employer-side authority and it is not a paid placement requirement.
```

## 12. Employer-Side Requester Card

Purpose:

```text
Represent a person who may request crew or manage a vacancy on the demand side.
```

This card does not prove authority by itself. It points to authority evidence and company/request context.

Minimum data:

```text
requester_card_id
physical_person_id
company_context_id
requester_type
business_email
business_phone
job_title_or_function
relationship_to_company
authority_status
service_area_group_membership
request_visibility_scope
created_at
updated_at
```

Examples of requester type:

```text
employer
ship_manager
crewing_manager
vessel_operator
charterer
authorized_company_representative
shipowner
power_of_attorney_holder
```

Important rule:

```text
This is demand-side participation only when authority is verified for the relevant company, vessel or request.
```

## 13. Authority Evidence Card

Purpose:

```text
Record the evidence that a person may act for a company, vessel or request.
```

Minimum data:

```text
authority_evidence_id
physical_person_id
requester_card_id if applicable
company_context_id if applicable
vessel_context_id if applicable
crew_request_id if applicable
authority_type
evidence_type
evidence_reference
evidence_status
verified_by_user_id
verified_at
expires_at
revoked_at
review_notes
created_at
updated_at
```

Evidence types may include:

```text
company appointment
business e-mail domain verification
power of attorney
corporate authorization letter
client contract
vessel management document
crew management agreement
charter party authority where relevant
manual Project Owner approval for exceptional case
```

Important rule:

```text
Authority is scoped. Authority for one company does not automatically mean authority for all vessels or all requests.
```

## 14. Company Context Card

Purpose:

```text
Represent the employer-side business context.
```

Minimum data:

```text
company_context_id
company_name
company_type
registration_country
registration_number if available
business_email
business_phone
business_address
website if available
verification_status
primary_responsible_manager
billing_account_status
commercial_terms_status
created_at
updated_at
```

This card supports:

```text
buyer identity
commercial relationship
authority evidence
billing
service history
repeat requests
manager reward attribution
```

Important rule:

```text
Company context does not automatically authorize every person connected to the company. Each acting person still needs evidence or approved relationship.
```

## 15. Vessel Context Card

Purpose:

```text
Represent the vessel context relevant to a vacancy or crew request.
```

Minimum data:

```text
vessel_context_id
company_context_id
vessel_name
imo_number if available
vessel_type
flag_state
gross_tonnage if relevant
engine_type if relevant
trading_area_or_route if relevant
management_relationship_type
vessel_verification_status
created_at
updated_at
```

This card supports:

```text
matching by vessel type
experience requirement
document requirement
regional or route constraints
authority evidence
request validation
```

Important rule:

```text
A person may be authorized for a company but not for a specific vessel unless the relationship or evidence supports it.
```

## 16. Vacancy / Crew Request Card

Purpose:

```text
Represent employer-side demand.
```

Minimum data:

```text
crew_request_id
company_context_id
vessel_context_id if applicable
requester_card_id
authority_evidence_id
requested_rank
requested_department
vessel_type
joining_date
contract_duration
salary_or_budget_offered
salary_currency
required_certificates
required_experience
language_requirements
route_or_region
employment_terms_summary
urgency
request_status
review_status
candidate_presentation_status
responsible_manager
current_specialist
created_at
updated_at
```

This card should answer:

```text
What does the employer-side client need?
Who requested it?
What proves that the requester may submit it?
Which company and vessel context does it belong to?
What conditions must the candidate satisfy?
```

Important rule:

```text
The crew request is the demand card. It must not be published or acted on as verified demand until authority and minimum request data are reviewed.
```

## 17. Matching Fields

CrewPortGlobal compares employer-side demand against seafarer-side supply.

Primary matching fields:

| Employer demand | Seafarer supply |
|---|---|
| requested rank | seafarer rank |
| requested department | seafarer department |
| vessel type | preferred / accepted vessel types |
| joining date | availability date |
| contract duration | accepted duration |
| salary / budget offered | expected compensation |
| required certificates | seafarer documents |
| required experience | seafarer experience |
| language requirements | language skills |
| route / region | preferences or restrictions |
| authority to submit request | verified employer-side authority |

The matching result should not be only a numeric score.

It should explain:

```text
matched fields
missing fields
risk fields
human-review notes
candidate readiness
request readiness
recommended next action
```

## 18. Matching Outcome

The main platform result is:

```text
A reviewed candidate recommendation for an employer-side crew request when employer demand conditions and seafarer supply conditions are sufficiently aligned.
```

This means:

1. employer-side demand exists;
2. authority to submit or manage that demand has been reviewed;
3. seafarer supply data exists;
4. key demand and supply fields are sufficiently aligned;
5. evidence gaps are identified;
6. human review confirms the candidate can be presented;
7. employer receives a candidate recommendation or shortlist according to service terms.

This does not mean:

```text
automatic employment
automatic hiring decision
guaranteed placement
automatic legal approval
automatic visa/travel approval
automatic payment completion
```

## 19. Personal Account Assembly

The personal account should be assembled from confirmed cards linked to the physical person.

A person's account may show:

```text
personal registration status
authentication status
seafarer workforce card if confirmed or in draft
employer-side requester card if created
company contexts where authority is proven
vessel contexts where authority or relationship is proven
crew requests visible through relationship
tasks assigned to the person
clients assigned to the person
internal group pages if group membership permits them
```

The account must not show:

```text
all company records because the person is in a broad employer group
all seafarer records because the person is in a team group
all vessel records because the person has one vessel authority
all client cards because the person has general support access
```

## 20. Visibility And Authorization Model

Visibility is determined by three layers.

### 20.1 Group membership

Group membership defines which service areas the person may access.

Examples:

```text
seafarer area
employer-side request area
support work area
verification work area
internal control area
Project Owner area
```

Group membership does not automatically expose all records inside the area.

### 20.2 Authorization evidence

Authorization evidence defines whether the person may act for a company, vessel or request.

Examples:

```text
submit crew request for Company A
manage Vessel X crew request
view billing status for Company B
represent Company C for onboarding
approve internal control exception
```

Evidence must be scoped and reviewable.

### 20.3 Client/card relationship

Client/card relationship defines what records the person may see.

Examples:

```text
responsible manager for client
current specialist assigned to task
verified requester for company
authorized vessel representative
candidate owner for own seafarer profile
controller reviewing specific case
Project Owner reviewing audit or exception
```

The system must avoid broad visibility caused only by a broad role.

## 21. Data Minimization Rule

CrewPortGlobal should collect from each side only the data needed for the business function.

For employer-side demand:

```text
who is requesting
what proves authority
which company context applies
which vessel context applies
what position is needed
what conditions are offered
what certificates and experience are required
when joining is needed
what budget or salary is offered
```

For seafarer-side supply:

```text
who the candidate is
what qualification the candidate has
which documents and certificates support it
when the candidate is available
what conditions the candidate accepts
what compensation the candidate expects
which vessel types and routes are acceptable
which restrictions apply
```

Extra data should be avoided unless it supports verification, matching, compliance, billing, service delivery or audit.

## 22. Reviewed Recommendation Workflow

Recommended first workflow:

1. physical person registers;
2. service account is authenticated;
3. person creates seafarer workforce card or employer-side requester card;
4. employer-side requester links company context;
5. authority evidence is submitted or confirmed;
6. employer-side requester creates vacancy / crew request;
7. seafarer completes workforce card;
8. system compares demand and supply fields;
9. AI may prepare a matching summary;
10. human reviewer checks evidence, readiness and risk;
11. candidate recommendation is approved for presentation;
12. employer receives reviewed candidate recommendation;
13. outcome and next action are recorded.

## 23. AI-Agent Role In This Model

AI agents may assist with:

```text
field extraction
missing-data detection
demand/supply comparison
certificate checklist preparation
experience summary
language and region comparison
candidate recommendation draft
human-review note preparation
duplicate detection
visibility-scope warnings
```

AI agents must not independently:

```text
approve authority evidence
approve company context
approve vessel context
approve final candidate presentation
make employment decision
make payment decision
override no-fee controls
grant broad visibility
change authorization scope
```

## 24. Implementation Implications

Future implementation should avoid designing one monolithic user role.

Recommended implementation direction:

```text
physical person table or card
service account table or card
seafarer workforce card
employer-side requester card
authority evidence card
company context card
vessel context card
vacancy / crew request card
relationship table for visibility
task table generated from card states
matching summary table
human review decision table
audit events
```

The personal cabinet should be assembled from linked cards and permissions at runtime.

## 25. Open Questions For Project Owner

The next implementation planning should confirm:

1. exact field dictionary for each card;
2. required vs optional fields by client type;
3. exact authority evidence accepted for each requester type;
4. exact vessel context required before request publication;
5. exact matching thresholds before human review;
6. exact human-review checklist before candidate presentation;
7. exact personal cabinet sections for mixed-role users;
8. exact visibility relationship table design;
9. exact no-fee controls shown in seafarer workflows;
10. exact B2B billing trigger after candidate recommendation service.

## 26. Implementation Boundary

This document is business-process and product-architecture documentation only.

It does not implement:

```text
database schema changes
backend routes
frontend personal cabinet
matching engine
payment logic
authorization enforcement
AI-agent runtime
nginx/server configuration
deployment
```

## 27. Next Recommended Work

Recommended next document:

```text
BP-004 - Card field dictionary and workflow states
```

Reason:

BP-003 defines the practical card model and the employer demand / seafarer supply matching logic. The next document should define each field, allowed states, required evidence, visibility relationship and task-generation event in enough detail to support database and API design.
