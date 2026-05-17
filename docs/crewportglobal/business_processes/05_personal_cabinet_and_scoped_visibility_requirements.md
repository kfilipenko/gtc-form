# CrewPortGlobal - BP-005 Personal Cabinet And Scoped Visibility Requirements

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Business-process ID: BP-005
- Source task: Project Owner approval after BP-004
- Baseline: BP-003 and BP-004 business-process documentation
- Date: 2026-05-17
- Document type: Personal cabinet, scoped visibility and future access-check requirements
- Status: Drafted for Project Owner review

## 1. Purpose

This document defines how the CrewPortGlobal personal cabinet should be assembled from physical person registration, service account authentication, group membership, card relationships, authority evidence, tasks and review/control assignments.

The goal is to ensure that one person can have many confirmed capabilities while seeing only the records they are allowed to see.

The cabinet must support the practical business model:

```text
employer-side buyer / demand
seafarer workforce / supply
reviewed candidate recommendation
human-controlled authorization
scoped data visibility
```

## 2. Core Rule

The personal cabinet is not a static role page.

It is a runtime assembly of confirmed cards, relationships and allowed service areas.

The cabinet must answer:

```text
Who is authenticated?
Which physical person is linked?
Which cards belong to or are visible to this person?
Which service areas may this person enter?
Which records may this person see?
Which actions may this person perform?
Which evidence or relationship justifies each visible record?
Which tasks require action now?
Which clients remain connected to this person?
```

## 3. Separation Of Registration, Authentication And Authorization

The cabinet must keep these concepts separate.

| Concept | Cabinet meaning | What it does not mean |
|---|---|---|
| Registration | A physical person card exists | The person may act for a company or see business records |
| Authentication | The person proved access to the service account | The person automatically has authority or broad visibility |
| Authorization | The person has scoped powers and visibility based on group, evidence and relationship | The person owns all data inside a broad role |

## 4. Cabinet Assembly Inputs

The cabinet should be assembled from these input layers:

1. authenticated service account;
2. linked physical person card;
3. active group memberships;
4. service-area permissions from group roles;
5. cards owned by the physical person;
6. card relationship records;
7. authority evidence records;
8. assigned tasks;
9. responsible manager relationships;
10. review/control assignments;
11. Project Owner or audit exception scope where applicable;
12. card and task states that affect visibility.

No single layer is enough by itself for broad access.

## 5. Visibility Decision Order

Every cabinet section and record list must be built through a visibility decision.

Recommended order:

1. confirm active authenticated session;
2. resolve active service account;
3. resolve linked physical person;
4. load active group memberships and service areas;
5. load own cards;
6. load card relationships;
7. load valid authority evidence;
8. load assigned tasks and manager relationships;
9. apply state filters and revocation rules;
10. reduce visible fields by scope;
11. attach visibility reason to each record;
12. audit material access when required.

## 6. Visibility Reason

Every visible operational record should have a visibility reason.

Examples:

```text
own_seafarer_card
own_service_account
verified_company_representative
crew_request_submitter
responsible_manager
current_specialist
assigned_task
review_case
support_case
control_case
project_owner_audit_scope
```

The UI does not need to show every reason to the end user, but the backend should be able to explain why access was granted.

## 7. Personal Cabinet Sections

The first personal cabinet should contain these sections when applicable:

```text
Account
My cards
Seafarer workspace
Employer-side workspace
Companies
Vessels
Crew requests
Tasks
My clients
Reviews and control
Payments and billing
Admin and audit
Notifications
```

Sections should appear only when the authenticated person has a valid reason to see them.

## 8. Account Section

Purpose:

```text
Show service-account and physical-person status.
```

Visible to:

```text
authenticated owner of the account
authorized support or control user by assigned case
Project Owner by audit/control need
```

Fields:

```text
display_name
login_email
preferred_language
account_state
last_login_at
contact_verification_status
registration_state
missing_account_actions
```

Allowed actions:

```text
update own contact details where policy allows
request e-mail verification
change preferred language
view own account status
```

Forbidden:

```text
view another user's account only because of broad team membership
change another user's login without approved support/control workflow
expose authentication secrets or one-time codes
```

## 9. My Cards Section

Purpose:

```text
Show the cards connected to the physical person.
```

Typical cards:

```text
Physical Person Registration Card
Service Account / Login Card
Seafarer Workforce Card
Employer-Side Requester Card
Authority Evidence Card
Company Context Card by relationship
Vessel Context Card by relationship
Vacancy / Crew Request Card by relationship
```

This section should make clear which cards are:

```text
draft
pending review
verified
limited
blocked
expired
revoked
```

Allowed actions:

```text
continue draft
submit for review
view review status
respond to correction request
open related task
view relationship reason
```

Forbidden:

```text
create verified authority without evidence
edit review outcome
see unrelated cards from other users
```

## 10. Seafarer Workspace

Purpose:

```text
Show supply-side profile, readiness and matching status for the authenticated seafarer.
```

Visible when:

```text
the physical person owns a seafarer workforce card
the user is assigned to review or support that card
the user is a controller reviewing that card
the Project Owner has audit/control reason
```

Visible fields for own seafarer:

```text
rank
department
availability_date
availability_status
expected_compensation
accepted_vessel_types
accepted_contract_duration
document_readiness_status
profile_review_status
matching_visibility_state
correction_requests
candidate_recommendation_status where allowed
no_recruitment_fee_control_status
```

Allowed actions for seafarer:

```text
edit draft profile
update availability
update expected compensation
upload or update document metadata
submit profile for review
respond to correction request
withdraw or pause matching visibility where policy allows
```

Forbidden:

```text
approve own profile
edit review decision
see employer internal notes unless explicitly allowed
see other seafarer profiles
pay mandatory placement fees
be required to buy optional services for job access
```

## 11. Employer-Side Workspace

Purpose:

```text
Show demand-side requester capabilities and crew request activity.
```

Visible when:

```text
the physical person has an employer-side requester card
the person has authority evidence for company, vessel or request scope
the person is assigned as responsible manager or specialist
the user has support/control assignment
Project Owner has audit/control reason
```

Visible fields:

```text
requester_card_status
authority_status
company_relationships
vessel_relationships
visible_crew_requests
missing_authority_evidence
request_review_status
candidate_presentation_status
commercial_terms_status where allowed
billing_status where allowed
```

Allowed actions:

```text
create crew request draft
submit authority evidence
submit request for review
view own/company authorized requests
respond to correction request
view reviewed candidate recommendation where entitled
```

Forbidden:

```text
see all employer requests only because of employer group membership
submit request for company without authority evidence
manage vessel request without vessel/request scope
see billing data without billing relationship or approved scope
approve own authority evidence
```

## 12. Companies Section

Purpose:

```text
Show company contexts visible by relationship or authority.
```

Visibility reasons:

```text
company_representative
company_admin
billing_contact
responsible_manager
current_specialist
review_case
control_case
project_owner_scope
```

Field visibility levels:

| Level | Visible fields |
|---|---|
| company_limited | company name, status, related visible requests, correction status |
| company_operational | company details, representatives, request history, service status |
| company_billing | billing account status, invoice/payment states where allowed |
| company_control | verification notes, risk flags, audit references where authorized |

Forbidden:

```text
show all companies to every employer-side user
show all billing data to every company representative
show control notes without control scope
```

## 13. Vessels Section

Purpose:

```text
Show vessel contexts visible through authority, company relationship, request relationship or control assignment.
```

Visibility reasons:

```text
authorized_vessel_person
company_vessel_relationship
crew_request_scope
responsible_manager
current_specialist
review_case
control_case
```

Field visibility levels:

| Level | Visible fields |
|---|---|
| vessel_limited | vessel name, vessel type, request-related status |
| vessel_operational | IMO if available, flag, route, vessel context fields |
| vessel_control | evidence status, verification notes, risk flags |

Forbidden:

```text
show every vessel linked to a company unless the requester has the correct scope
show vessel evidence to unrelated users
let vessel relationship imply all future crew request authority
```

## 14. Crew Requests Section

Purpose:

```text
Show employer-side demand cards visible to the authenticated person.
```

Visibility reasons:

```text
crew_request_submitter
crew_request_viewer
company_request_scope
vessel_request_scope
responsible_manager
current_specialist
assigned_task
review_case
support_case
control_case
project_owner_scope
```

Visible fields by scope:

| Scope | Visible fields |
|---|---|
| request_limited | request status, requested rank, department, vessel type, next action |
| request_operational | full request conditions, matching status, candidate presentation state |
| request_commercial | commercial terms and billing status where allowed |
| request_control | authority evidence, risk notes, review decisions |

Allowed actions:

```text
continue draft
submit request for review
respond to correction request
view matching progress
view reviewed candidate recommendation
record employer response where allowed
```

Forbidden:

```text
publish unreviewed demand as verified
see unrelated requests in same broad company role
present candidate without human review approval
hide authority gaps
```

## 15. Tasks Section

Purpose:

```text
Show work that requires action now.
```

Tasks visible when:

```text
assigned_user_id is the authenticated user
assigned_group is visible and task is assigned by group lead policy
responsible_manager is the authenticated user
task is part of a review/control scope the user is authorized to handle
Project Owner has audit/control scope
```

Task fields:

```text
task_title
source_card_type
source_card_summary
required_action
deadline_at
color_state
priority
blocking_reason
visibility_reason
next_allowed_actions
```

Ordering:

1. red;
2. yellow;
3. grey due today;
4. urgent/high priority;
5. green by deadline;
6. blue only when follow-up or closure review is needed.

Forbidden:

```text
show all group tasks to every group member by default
show source card details beyond task scope
allow task completion without required card update or note
```

## 16. My Clients Section

Purpose:

```text
Show clients connected to the person by responsibility, relationship, previous work, retention, follow-up or reward attribution.
```

My clients may include:

```text
responsible manager clients
clients with active relationship ownership
clients previously served by the specialist
clients waiting for next contact
clients linked to future repeat sale
clients linked to manager reward attribution
clients with open support/control follow-up assigned to the person
```

Required fields:

```text
client_display_name
client_type
relationship_reason
current_stage
current_task
last_contact_date
next_contact_date
responsible_manager
current_specialist
retention_status
next_sale_plan where allowed
```

Forbidden:

```text
show all clients to all team members
show clients without relationship reason
show reward attribution data outside approved scope
```

## 17. Reviews And Control Section

Purpose:

```text
Show review, verification, complaint, exception and control work.
```

Visible to:

```text
authorized reviewer
authorized verifier
internal control
assigned complaint operator
Project Owner
```

Record types:

```text
seafarer profile review
authority evidence review
company review
vessel review
crew request review
matching summary review
candidate presentation review
complaint or exception case
access or audit case
```

Allowed actions:

```text
approve limited
approve verified
return for correction
reject
pause
escalate
close
```

Forbidden:

```text
approve own submission
let AI make final review decision
hide risk notes
delete audit history
expose control notes outside control scope
```

## 18. Payments And Billing Section

Purpose:

```text
Show employer-side billing and entitlement context when allowed.
```

Visible when:

```text
person is billing contact
person is responsible manager with billing scope
person is assigned sales/payment specialist
person is authorized billing operator
Project Owner has audit/control reason
```

Visible fields by scope:

```text
billing_account_status
commercial_terms_status
invoice_status
payment_status
service_entitlement_status
overdue_payment_tasks
billing_exception_status
```

Forbidden:

```text
show billing data to all company representatives
charge seafarer recruitment or placement fees
activate entitlement without approved payment or exception rule
allow AI to finalize payment or reward decisions
```

## 19. Admin And Audit Section

Purpose:

```text
Show access-control and audit functions only to authorized administrative users.
```

Visible to:

```text
Project Owner
platform administrator where approved
read-only auditor where approved
specific control role by audit assignment
```

Allowed areas:

```text
access summary
group membership summary
role and permission summary
access audit events
admin session controls
approved user/group management functions
```

Forbidden:

```text
show admin functions to normal users
use personal e-mail allowlists as normal authorization
grant business approval power just because a person can administer access
expose secrets, codes or SMTP passwords
```

## 20. Notifications Section

Purpose:

```text
Show missing actions, deadlines, review results and relationship changes.
```

Notification types:

```text
missing_required_field
contact_verification_needed
authority_evidence_needed
correction_requested
review_approved
review_rejected
task_due_soon
task_overdue
waiting_for_client_follow_up_due
candidate_recommendation_ready
payment_follow_up_due
visibility_scope_changed
```

Notification rules:

1. notifications must link to a visible card or task;
2. notification content must be scoped to the user's visibility;
3. sensitive review/control details must not leak through notification text;
4. notification closure should not change card state unless an explicit action is performed.

## 21. Visibility Matrix

| User context | May see | Must not see by default |
|---|---|---|
| Unverified registered person | own registration/account status | employer data, seafarer data of others, internal tasks |
| Seafarer | own seafarer card, own tasks, own review status | other seafarers, employer internal notes, unrelated crew requests |
| Employer-side requester | own requester card, authorized company/request/vessel scope | all company data, all vessel data, all requests |
| Responsible manager | assigned clients, related tasks, allowed commercial context | clients owned by other managers without assignment |
| Current specialist | assigned task records and required card subset | full client history outside task scope |
| Support specialist | assigned support cases and limited context | all support/client records |
| Reviewer/verifier | assigned review cases and evidence required for review | unrelated review queues or private account data |
| Internal control | assigned control, exception, audit or complaint cases | unrestricted browsing without control reason |
| Project Owner | operational overview, audit, exceptions and approved admin scope | secrets, raw passwords, one-time codes |
| AI assistant | task-scoped data approved for assistance | unrestricted client data and final decision powers |

## 22. Scoped Action Rules

Actions must be checked separately from visibility.

Examples:

```text
person may view own seafarer card but cannot approve it
requester may draft a crew request but cannot mark authority verified
support may view limited client context but cannot approve billing exception
reviewer may approve assigned review case but not grant admin access
platform administrator may manage access but not replace business review
AI may draft recommendation but cannot approve presentation
```

Action checks should use:

```text
authenticated user
group membership
permission
card relationship
authority evidence
task assignment
review conflict-of-interest rule
card state
audit requirement
```

## 23. Cabinet API Requirements

Future API endpoint:

```text
GET /api/v1/me/cabinet
```

The response should include:

```text
authenticated_account
physical_person
visible_sections
cards_summary
tasks_summary
my_clients_summary
notifications_summary
allowed_actions
visibility_reasons
missing_required_actions
```

Response principles:

1. include only visible sections;
2. include visibility reason per card/list item for backend auditability;
3. include missing actions and deadlines;
4. include allowed actions, not all theoretical actions;
5. avoid raw secrets and hidden review data;
6. apply field-level filtering by visibility scope;
7. include stable IDs for navigation;
8. include state and next action for each visible card.

Supporting future endpoints:

```text
GET /api/v1/me/tasks
GET /api/v1/me/my-clients
GET /api/v1/me/cards
GET /api/v1/me/notifications
GET /api/v1/me/visibility-reasons
```

## 24. Database And Access-Check Requirements

Future implementation should support:

```text
cabinet_section_policy
record_visibility_policy
field_visibility_policy
action_policy
relationship_expiry
task_scoped_visibility
review_case_scoped_visibility
audit_scope_visibility
```

Required checks:

1. active session;
2. active service account;
3. active physical person;
4. group membership;
5. service-area permission;
6. card relationship;
7. authority evidence validity;
8. task assignment or responsible-manager relation;
9. review/control assignment where relevant;
10. card state not revoked/archived unless audit scope permits;
11. field-level filtering;
12. audit event where required.

## 25. Personal Cabinet UI Requirements

The first UI should be operational, not decorative.

Required UI patterns:

```text
status cards for account and active cards
tabs or sections for service areas
task list with SLA colors
My clients list with next-contact dates
card detail drawer or page
missing-action indicators
review/correction status
allowed-action buttons only
visibility-scope labels for internal users where useful
logout/session control
```

The UI must avoid:

```text
showing unavailable actions as normal buttons
showing all data in one large table
mixing public documents with personal work areas
using role labels as proof of record visibility
exposing internal control notes to external users
```

## 26. Security And Privacy Rules

The cabinet must:

1. never expose passwords, one-time codes, SMTP secrets or raw tokens;
2. avoid exposing raw documents unless the user has document-specific scope;
3. redact control notes outside control scope;
4. avoid broad list endpoints without relationship filters;
5. prevent cached data from surviving logout;
6. audit material admin/control access;
7. separate self-service user data from internal review data;
8. show no-fee seafarer controls where relevant;
9. prevent AI from seeing more than task-scoped data;
10. show only the minimum data needed for the user's next action.

## 27. Acceptance Criteria

The future implementation should satisfy these acceptance criteria:

1. a seafarer sees own profile and tasks, not other seafarers;
2. an employer-side requester sees only authorized company, vessel and request records;
3. a person with both seafarer and requester cards sees both workspaces when both are confirmed;
4. support sees only assigned support cases and required limited context;
5. reviewer sees assigned review cases and required evidence only;
6. responsible manager sees own clients and related tasks;
7. Project Owner sees audit/control overview without secrets;
8. broad group membership alone does not expose all records;
9. every visible operational record has a visibility reason;
10. every visible action has a separate action-scope check;
11. task and My clients lists are generated from relationships and card states;
12. AI assistant receives only approved task-scoped context.

## 28. Implementation Boundary

This document does not implement:

```text
database migrations
backend routes
frontend personal cabinet
authentication changes
authorization runtime changes
payment logic
AI-agent runtime
nginx/server configuration
deployment
```

## 29. Next Recommended Work

Recommended next document:

```text
BP-006 - Scoped visibility and access-check contract
```

Reason:

BP-005 defines how the cabinet should be assembled and what each user context may see. The next document should define the exact backend access-check contract that future APIs must call before returning records, fields or actions.
