# CrewPortGlobal - BP-006 Scoped Visibility And Access-Check Contract

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Business-process ID: BP-006
- Source task: Project Owner approval after BP-005
- Baseline: BP-003, BP-004 and BP-005 business-process documentation
- Date: 2026-05-17
- Document type: Scoped visibility, action authorization and access-check contract
- Status: Drafted for Project Owner review

## 1. Purpose

This document defines the access-check contract that future CrewPortGlobal backend APIs must use before returning records, fields or actions.

The contract protects the core rule:

```text
Group membership may open a service area.
Authority evidence may prove a right to act.
Card relationship may grant visibility to a specific record.
Task or review assignment may grant temporary operational visibility.
No broad role should expose all records by itself.
```

BP-006 also defines a standard presentation rule for future personal cabinet cards:

```text
The first card is "Мои задачи" and is always open.
All other cards are collapsed by default and open when the user clicks the card header.
```

## 2. Contract Scope

Every future API that returns protected business data must apply this contract.

Protected business data includes:

```text
physical person records
service account status
seafarer workforce cards
employer-side requester cards
authority evidence cards
company context cards
vessel context cards
vacancy / crew request cards
tasks
My clients lists
matching summaries
human review decisions
billing and entitlement context
audit/control records
admin access records
```

The contract applies to:

```text
list endpoints
detail endpoints
field-level responses
allowed action calculation
UI section visibility
task queues
My clients lists
review/control queues
AI-agent context retrieval
```

## 3. Separation Of Checks

The system must evaluate access in layers.

| Layer | Question | Example |
|---|---|---|
| Authentication | Who is the active account? | Active service session |
| Person binding | Which physical person is linked? | physical_person_id |
| Service area | Which area may the person enter? | seafarer, employer, support, review, admin |
| Record visibility | Which exact records may the person see? | own seafarer card, assigned task, company request |
| Field visibility | Which fields inside the record may be returned? | public summary vs control notes |
| Action authorization | Which action may the person perform? | edit draft, submit review, approve verified |
| Presentation visibility | Which cabinet card or button should be shown? | visible section, enabled action |
| Audit obligation | Should this access/action be logged? | admin/control/billing evidence access |

Passing one layer does not automatically pass the others.

## 4. Access-Check Function

Future backend code should provide one shared access-check function or service.

Recommended logical name:

```text
cpg_access_check
```

The access-check function should be called before:

1. returning a protected record;
2. returning a protected field;
3. returning a list item;
4. showing an action button;
5. performing an action;
6. exposing data to an AI assistant;
7. returning audit/control data;
8. assembling the personal cabinet.

## 5. Access-Check Input Contract

The access-check input should include the following context objects.

```text
actor_context
session_context
service_area_context
target_context
relationship_context
authority_context
task_context
review_context
requested_operation
requested_fields
presentation_context
```

### 5.1 actor_context

```text
user_id
physical_person_id
service_account_id
active_group_codes
active_role_codes
active_permission_codes
is_project_owner
is_ai_assistant
```

### 5.2 session_context

```text
session_id
session_type
authenticated_at
expires_at
ip_address
user_agent
assurance_level
```

### 5.3 service_area_context

```text
requested_area
required_group_code
required_permission_code
area_access_reason
```

Example areas:

```text
personal_cabinet
seafarer_workspace
employer_workspace
company_context
vessel_context
crew_request
tasks
my_clients
support
review
internal_control
billing
admin_access
audit
ai_assistant_context
```

### 5.4 target_context

```text
target_card_type
target_card_id
target_owner_physical_person_id
target_company_context_id
target_vessel_context_id
target_crew_request_id
target_state
target_sensitivity
```

Target card types:

```text
physical_person
service_account
seafarer_workforce
employer_requester
authority_evidence
company_context
vessel_context
crew_request
task
matching_summary
human_review_decision
audit_event
billing_context
```

### 5.5 relationship_context

```text
relationship_type
relationship_scope
relationship_state
relationship_starts_at
relationship_ends_at
relationship_revoked_at
relationship_source
```

Relationship examples:

```text
self
responsible_manager
current_specialist
assigned_task
support_assignee
reviewer
controller
company_representative
company_admin
vessel_authorized_person
crew_request_submitter
crew_request_viewer
billing_contact
project_owner_exception
```

### 5.6 authority_context

```text
authority_evidence_id
authority_type
authority_scope
evidence_status
verified_at
expires_at
revoked_at
```

Authority evidence must be:

```text
verified or active_limited where policy allows
not expired
not revoked
scoped to the requested company, vessel, request or action
```

### 5.7 task_context

```text
task_id
assigned_group_code
assigned_user_id
responsible_manager_id
source_card_type
source_card_id
task_state
task_scope
deadline_at
```

Task-scoped visibility should expose only the fields needed to complete the assigned task.

### 5.8 review_context

```text
review_decision_id
review_subject_type
review_subject_id
review_assignment_user_id
review_group_code
conflict_of_interest_check
review_state
```

Review scope must enforce:

```text
reviewer cannot approve own submission
AI cannot final-approve review
platform administrator cannot replace business review
```

### 5.9 requested_operation

```text
operation_type
operation_name
requested_action_scope
required_permission_code
requires_human_reviewer
requires_audit_event
```

Operation types:

```text
list
read
read_field
create_draft
edit_draft
submit_for_review
request_correction
approve_limited
approve_verified
reject
present_candidate
update_assignment
update_billing_status
manage_group_membership
audit_read
ai_summarize
```

### 5.10 presentation_context

```text
cabinet_section
card_component_id
default_expanded
collapsible
display_priority
show_count_badge
show_sla_badge
```

This context supports UI assembly but must not override backend access rules.

## 6. Access-Check Output Contract

The access-check function should return a structured decision.

```text
decision
decision_reason_codes
visibility_scope
field_scope
allowed_actions
denied_actions
redacted_fields
obligations
presentation_rules
audit_required
audit_event_type
safe_message
```

Decision values:

```text
allow
deny
allow_limited
allow_redacted
require_human_review
require_correction
require_more_evidence
```

Visibility scopes:

```text
none
own_card
assigned_task
assigned_client
company_limited
company_operational
company_billing
company_control
vessel_limited
vessel_operational
vessel_control
request_limited
request_operational
request_commercial
request_control
review_case
support_case
audit_case
project_owner_scope
```

Obligations:

```text
audit_access
audit_action
redact_sensitive_fields
show_missing_evidence
show_correction_required
require_human_reviewer
block_ai_final_decision
mask_billing_fields
mask_control_notes
```

## 7. Allow Reason Codes

Allowed access should be explainable.

Recommended allow reason codes:

```text
own_physical_person_card
own_service_account
own_seafarer_workforce_card
own_employer_requester_card
active_group_service_area
verified_company_representative
verified_company_admin
verified_vessel_authority
crew_request_submitter
crew_request_viewer
responsible_manager_relationship
current_specialist_relationship
assigned_task_scope
support_case_assignment
review_case_assignment
internal_control_case_assignment
billing_contact_scope
project_owner_scope
audit_scope
ai_task_scoped_context
```

## 8. Deny Reason Codes

Denied access should be explainable without leaking sensitive information.

Recommended deny reason codes:

```text
not_authenticated
service_account_inactive
physical_person_inactive
missing_group_membership
missing_permission
missing_card_relationship
missing_authority_evidence
authority_evidence_pending_review
authority_evidence_expired
authority_evidence_revoked
target_card_archived
target_card_suspended
task_not_assigned
review_not_assigned
conflict_of_interest
field_scope_denied
action_scope_denied
ai_final_decision_denied
billing_scope_denied
control_scope_denied
admin_scope_denied
```

External users should receive safe messages, not internal policy details.

## 9. Access Decision Algorithm

Recommended algorithm:

1. verify session is active;
2. resolve service account;
3. resolve physical person;
4. reject if account or person is suspended unless audit/admin policy allows;
5. load active groups, roles and permissions;
6. check service-area entry permission;
7. resolve target card and target state;
8. resolve relationships between actor and target;
9. resolve authority evidence when action requires company, vessel or request authority;
10. resolve task/review/control assignment where relevant;
11. check conflict-of-interest rules;
12. calculate visibility scope;
13. calculate field scope;
14. calculate allowed actions;
15. calculate presentation rule;
16. calculate audit obligation;
17. return allow/deny/limited decision.

The algorithm must fail closed.

If the system cannot prove visibility or action scope, it must deny or return a redacted/limited result.

## 10. Field-Level Filtering Contract

Returning a record does not mean returning every field.

Fields should be grouped by visibility class.

| Field class | Examples | Typical visibility |
|---|---|---|
| public_summary | display name, visible status, high-level type | self, related user, assigned task |
| operational | request details, availability, vessel type, task context | relationship or task scope |
| commercial | billing status, invoice/payment state, terms status | billing/commercial scope |
| control | risk notes, review notes, evidence review result | review/control scope |
| audit | audit events, access history | Project Owner, auditor, control scope |
| secret | passwords, codes, tokens, SMTP secrets | never returned |

Field filtering must happen on the backend.

The frontend must not receive hidden fields and hide them visually.

## 11. Action Authorization Contract

Actions must be calculated independently from record visibility.

Examples:

| Visible record | Allowed action may still be denied because |
|---|---|
| own seafarer card | user cannot approve own profile |
| own employer requester card | user cannot verify own authority |
| company context | user may view company but not edit billing |
| vessel context | user may view vessel but not create request |
| crew request | user may view request but not present candidate |
| matching summary | user may view draft but not approve presentation |
| support case | support can respond but not decide compliance |
| admin access page | platform administrator cannot replace business reviewer |

Allowed actions should be returned as a list:

```text
allowed_actions
```

The frontend should render only allowed actions as active controls.

Unavailable actions may be hidden or shown disabled only when explanation is useful.

## 12. List Endpoint Contract

List endpoints must apply access checks before returning each item.

Rules:

1. never return broad unfiltered lists to normal users;
2. always scope by relationship, assignment, authority or control function;
3. return summary fields only by default;
4. attach a visibility reason or internal visibility code;
5. include next action and state where useful;
6. exclude archived/revoked records unless audit/control scope allows them;
7. paginate and sort safely;
8. do not leak existence of inaccessible records through counts.

Example list response shape:

```text
items[]
  id
  type
  title
  state
  summary_fields
  visibility_reason
  allowed_actions
  next_action
  sla_color
```

## 13. Detail Endpoint Contract

Detail endpoints must:

1. check record-level visibility;
2. apply field-level filtering;
3. calculate allowed actions;
4. return related cards only if separately visible;
5. avoid raw evidence/document exposure unless explicitly allowed;
6. include correction or missing-field state where applicable;
7. audit sensitive access where required.

Detail endpoint response shape:

```text
record
visible_fields
redacted_fields
related_visible_cards
allowed_actions
visibility_reason
obligations
next_action
```

## 14. Personal Cabinet Assembly Contract

The cabinet endpoint:

```text
GET /api/v1/me/cabinet
```

must call the access-check contract for:

```text
sections
cards
tasks
My clients
notifications
allowed actions
field groups
presentation rules
```

Cabinet response shape:

```text
authenticated_account
physical_person
sections[]
  section_code
  section_title
  visible
  display_order
  cards[]
    card_code
    card_title
    card_state
    card_summary
    visibility_reason
    allowed_actions
    presentation
tasks_summary
my_clients_summary
notifications_summary
```

## 15. Standard Presentation Contract

CrewPortGlobal personal cabinet and internal work pages should use a consistent collapsible-card presentation.

### 15.1 Default rule

```text
The first card is "Мои задачи".
"Мои задачи" is always expanded.
All other cards are collapsed by default.
Users may open a collapsed card by clicking the card header.
Users may close an opened card by clicking the card header again.
```

### 15.2 Why this rule exists

The cabinet may contain many cards:

```text
account
my cards
seafarer workspace
employer workspace
companies
vessels
crew requests
reviews
payments
admin
notifications
```

If all cards are open at once, the screen becomes too long and the user loses the working priority.

`Мои задачи` is the first open card because it tells the user what needs action now.

### 15.3 Presentation fields

Every card returned to the frontend should include:

```text
card_code
card_title
display_order
default_expanded
collapsible
is_pinned_open
summary_count
sla_color
overdue_count
visibility_reason
allowed_actions
```

### 15.4 Required presentation values

For `Мои задачи`:

```text
card_code = my_tasks
card_title = Мои задачи
display_order = 1
default_expanded = true
collapsible = false
is_pinned_open = true
```

For all other cards:

```text
display_order > 1
default_expanded = false
collapsible = true
is_pinned_open = false
```

### 15.5 Header behavior

Each collapsed card header should show enough information for the user to choose what to open:

```text
card title
count badge
SLA color badge where relevant
overdue count where relevant
short status or next action
```

The header must not expose sensitive hidden information.

### 15.6 Accessibility requirements

Collapsible cards should use accessible state:

```text
button or equivalent interactive header
aria-expanded
aria-controls
keyboard activation
visible focus state
stable heading text
```

### 15.7 Persistence rule

The UI may remember a user's opened cards locally or per account, but the default layout remains:

```text
Мои задачи open
all other cards collapsed
```

If a remembered preference conflicts with a critical state or security rule, the backend presentation rule wins.

### 15.8 Critical information rule

Collapsed cards may hide detail rows, but must not hide critical action signals.

If a collapsed card contains red or urgent items, its header must show:

```text
red status
overdue count
urgent count
next required action summary
```

## 16. AI Access Contract

AI assistant context must use the same access-check layers as human users, plus stricter decision limits.

AI may receive:

```text
task-scoped data
redacted summaries
missing-field lists
matching comparison fields
draft communication context
review preparation context
```

AI must not receive:

```text
unrestricted client records
raw secrets
one-time codes
full audit logs without specific scope
unrelated seafarer profiles
unrelated company records
unrelated billing records
```

AI allowed actions:

```text
summarize
classify
draft
detect_missing_fields
prepare_recommendation_draft
flag_risk
```

AI denied final actions:

```text
approve_authority
approve_company
approve_vessel
approve_seafarer_profile
approve_candidate_presentation
approve_payment
approve_reward
grant_access
close_complaint
```

## 17. Audit Contract

Audit should be required for:

```text
admin access
access-control changes
authority evidence decisions
company/vessel verification decisions
crew request approval
candidate presentation approval
billing exception changes
reward attribution changes
control note access where required
AI context retrieval for sensitive tasks
```

Audit event should record:

```text
actor_user_id
actor_type
event_type
target_card_type
target_card_id
decision
reason_code
scope
created_at
```

Audit event must not record:

```text
passwords
one-time codes
SMTP secrets
raw tokens
unredacted sensitive documents unless explicitly approved by policy
```

## 18. Conflict-Of-Interest Contract

The access-check function must block or escalate actions where conflict exists.

Conflict examples:

```text
user approves own seafarer profile
requester verifies own company authority
support specialist closes own complaint without review
billing operator approves own reward exception
platform administrator grants business approval to self
AI assistant attempts final approval
```

Decision result:

```text
deny
require_human_review
require_project_owner_review
```

## 19. Acceptance Criteria

Future implementation should pass these acceptance criteria:

1. unauthenticated user receives no protected cabinet data;
2. authenticated user sees only own cards and related records;
3. group membership opens service area but does not expose all records;
4. authority evidence must match company, vessel or request scope;
5. task assignment grants only task-scoped visibility;
6. review assignment grants only review-scoped visibility;
7. field-level filtering happens before response leaves backend;
8. frontend receives allowed actions, not all theoretical actions;
9. `Мои задачи` appears first and open by default;
10. all other cabinet cards are collapsed by default;
11. collapsed cards can be opened by clicking the header;
12. collapsed card headers show counts and urgent/red indicators without leaking sensitive data;
13. AI assistant receives only approved task-scoped context;
14. final approval actions require human reviewer where policy requires it;
15. audit obligations are returned and executed for sensitive access/actions.

## 20. Implementation Boundary

This document does not implement:

```text
database migrations
backend routes
frontend personal cabinet
UI card components
authentication changes
authorization runtime changes
payment logic
AI-agent runtime
nginx/server configuration
deployment
```

## 21. Next Recommended Work

Recommended next document:

```text
BP-007 - Personal cabinet UI layout and component requirements
```

Reason:

BP-006 defines the backend access-check and presentation contract. The next document should define exact personal cabinet UI sections, card components, collapsed/open states, responsive behavior, badges, empty states and user interaction rules before implementation begins.
