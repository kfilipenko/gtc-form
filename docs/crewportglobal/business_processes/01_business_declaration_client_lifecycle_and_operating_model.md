# CrewPortGlobal - BP-001 Business Declaration, Client Lifecycle and Operating Model

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Business-process ID: BP-001
- Source task: GitHub Issue #11 / CPG-BIZ-018
- Date: 2026-05-16
- Document type: Business-process operating model
- Status: Drafted for Project Owner review

## 1. Purpose

This document defines the first CrewPortGlobal business-process operating model.

It records how clients are acquired, registered, assigned, served, monitored and retained, and how team members should see their work through two practical lists:

```text
Tasks
My clients
```

The document is intended to become the baseline for:

1. team training;
2. group-specific portal pages;
3. internal job instructions;
4. SLA and deadline controls;
5. AI-agent instructions;
6. client card automation;
7. manager reward attribution;
8. future repeat-sales workflows.

## 2. Business Declaration

CrewPortGlobal operates as a maritime digital platform where the main payer is the employer-side client:

```text
shipowner
vessel operator
ship manager
crew manager
maritime employer
approved business client
```

The business model must preserve the no-recruitment-fees rule for seafarers.

Seafarers may be offered additional voluntary services only when all of the following conditions are true:

1. the service is clearly separated from employment placement;
2. the service is not required for job access;
3. the seafarer can refuse the service without losing access to vacancies or matching workflows;
4. the price, scope and optional nature are clear before purchase;
5. the service does not create a hidden recruitment or placement fee.

This means employer-side revenue is the primary commercial engine. Seafarer-side paid services, if introduced, are secondary, optional and compliance-controlled.

## 3. Core Operating Principle

CrewPortGlobal work must be driven by the client card.

Tasks should not be created manually from nowhere. A task must normally be produced by one of these sources:

1. client lifecycle stage;
2. missing client data;
3. document or verification requirement;
4. payment or invoice state;
5. service-delivery commitment;
6. support case;
7. compliance review;
8. next-contact plan;
9. repeat-sales plan;
10. manager or controller escalation.

The client card is the single operational object that connects:

```text
client
responsible manager
current specialist
current stage
current task
deadline
payment
service delivery
quality control
future sale
manager reward attribution
audit history
```

## 4. Client Types

The operating model recognizes these practical client categories:

| Client type | Commercial role | Notes |
|---|---|---|
| Shipowner / employer | Primary payer | Main B2B revenue source for crew requests, candidate matching, verification support and workflow services |
| Crew manager / crewing company | Primary or delegated payer | May act as employer-side client or authorized representative |
| Vessel operator / ship manager | Primary or delegated payer | May submit vessel-linked requests and operational crew requirements |
| Seafarer | Candidate and platform user | Must not pay recruitment or placement fees; optional services must be separated and voluntary |
| Internal client owner | Responsible manager context | Not a paying client; used for responsibility, retention and reward attribution |

## 5. Client Lifecycle

The target lifecycle for employer-side clients is:

| Stage | Stage meaning | Primary owner | Typical next action |
|---|---|---|---|
| Lead captured | A potential client entered the system | Marketing or responsible manager | Qualify source, need and contactability |
| Qualified lead | Basic relevance confirmed | Responsible manager | Contact client and create initial card |
| Client registered | Client identity and contact details recorded | Registration group | Collect company, representative and vessel context |
| Verification pending | Business and authority data require review | Internal control / verification role | Check documents, sanctions context and authority |
| Service need defined | Client need is clear | Responsible manager / current specialist | Prepare commercial or operational proposal |
| Offer sent | Service, scope and terms proposed | Payments / sales group | Follow up, invoice or revise offer |
| Payment pending | Invoice or entitlement pending | Payments / sales group | Track payment and entitlement |
| Service active | Client has an active service workflow | Current specialist | Execute matching, support, review or delivery |
| Delivery review | Work result needs quality check | Internal control / responsible manager | Confirm quality and client satisfaction |
| Completed | Current task or service cycle finished | Responsible manager | Plan next contact and future sale |
| Retention / repeat sale | Client remains available for future work | Responsible manager | Maintain relationship and propose next service |

The target lifecycle for seafarers is separate and must remain no-fee controlled:

| Stage | Stage meaning | Primary owner | Typical next action |
|---|---|---|---|
| Candidate lead | Seafarer entered the platform or marketing source | Marketing / seafarer development | Invite registration |
| Profile draft | Candidate started registration | Seafarer registration group | Help complete profile and documents |
| Profile review | Data and documents need checking | Verification / review roles | Request corrections or approve readiness |
| Ready candidate | Profile can be considered for matching | Seafarer development / matching role | Match to suitable employer-side requests |
| Presented / applied | Candidate is connected to a vacancy or request | Review / employer-side workflow | Track outcome and communication |
| Follow-up | Candidate needs update, correction or development | Seafarer development | Improve profile and maintain readiness |

## 6. Two Working Lists For Every Specialist

Every specialist must have two working lists.

### 6.1 Tasks

`Tasks` are client-linked work items requiring action now.

A task must show at least:

```text
client name or card ID
client type
current stage
required action
responsible manager
current specialist
deadline
color state
last contact date
next contact date
priority
blocking reason if any
```

Tasks answer the question:

```text
What must I do now?
```

Examples:

1. call an employer lead;
2. request missing company document;
3. verify representative authority;
4. prepare crew request details;
5. follow up on unpaid invoice;
6. review service quality;
7. contact seafarer about missing certificate;
8. return profile for correction;
9. close support request;
10. escalate overdue action.

### 6.2 My Clients

`My clients` are clients connected to the specialist or manager through responsibility, previous work, relationship ownership, reward attribution or future sales.

This list must include:

```text
clients currently owned by the manager
clients previously served by the specialist
clients linked to future reward attribution
clients needing periodic follow-up
clients available for repeat sales
clients waiting for a future event
```

`My clients` answers the question:

```text
Which clients am I responsible for, connected to or expected to develop over time?
```

When a lifecycle stage is completed, the client may move to the next specialist, but the responsible manager relationship remains recorded unless it is formally reassigned.

## 7. Assignment And Handoff Rules

Each client card must have:

```text
responsible_manager_user_id
current_specialist_user_id
current_group_code
current_stage
current_task
deadline_at
last_contact_at
next_contact_at
handoff_state
```

Assignment rules:

1. A client must not be visible to all team members by default.
2. A client is visible to the responsible manager.
3. A client is visible to the current specialist assigned to the active task.
4. A client is visible to authorized leaders and controllers.
5. A client may be visible to support or control roles only when their function requires it.
6. When a task is completed, the client must receive a next stage, next task or completed/no-action state.
7. Every handoff must record who transferred the client, to whom, when and why.
8. Handoffs should preserve the responsible manager relationship for retention and reward attribution.

## 8. Deadline And Color Logic

Every actionable task must have a deadline.

Color rules:

| Color | State | Meaning |
|---|---|---|
| Green | On time | Task is active and deadline is not close |
| Yellow | Deadline approaching | Task deadline is near and action is needed soon |
| Red | Overdue | Deadline passed and escalation may be required |
| Grey | Waiting for client | Work is blocked by client response, document, payment or other external input |
| Blue | Completed / no action required | Task is completed, paused without action, or waiting for future scheduled review |

Recommended first-stage thresholds:

```text
green: more than 24 hours before deadline
yellow: 0 to 24 hours before deadline
red: deadline has passed
grey: waiting_for_client state is active
blue: completed, closed or no_action_required state is active
```

The exact thresholds may be adjusted by group and service type, but the visible color model must remain consistent.

## 9. Client Card Minimum Fields

The client card must store at least:

```text
client_type
client_display_name
source_channel
source_campaign
responsible_manager
current_specialist
current_group
current_stage
current_task
task_deadline
task_color_state
last_contact_date
next_contact_date
client_need
proposed_service
invoice_status
payment_status
service_delivery_status
quality_score
next_sale_plan
manager_reward_link
assignment_history
action_history
communication_history
```

For employer-side clients, the card should also support:

```text
company_name
company_type
registered_country
representative_name
representative_authority_status
vessel_context
crew_request_context
billing_account_status
commercial_terms_status
```

For seafarers, the card should also support:

```text
rank
availability_date
document_readiness_status
profile_review_status
candidate_matching_status
optional_service_interest
no_recruitment_fee_control_status
```

## 10. Working Groups

The business-process model starts with six working groups.

### 10.1 Group 0 - Marketing

Purpose:

```text
Generate and qualify client and candidate interest.
```

Inputs:

```text
campaign leads
website inquiries
social media contacts
referrals
event contacts
partner leads
```

Outputs:

```text
qualified employer leads
qualified seafarer leads
source attribution
first-contact tasks
campaign performance signals
```

Client lifecycle role:

```text
Lead captured -> Qualified lead
```

Tasks list:

```text
qualify new lead
identify client type
record source
schedule first contact
route employer lead to registration/sales
route seafarer lead to seafarer registration
```

My clients list:

```text
leads generated by the specialist
leads pending contact
leads converted to clients with preserved source attribution
leads needing remarketing
```

SLA / deadlines:

```text
new hot lead first review: same business day
standard lead first review: within 1 business day
unresponsive lead follow-up: within 3 business days
campaign quality review: weekly
```

Quality indicators:

```text
lead source accuracy
qualified lead conversion rate
duplicate lead rate
first-contact timeliness
campaign-to-client attribution completeness
```

AI-agent future role:

```text
deduplicate leads
classify client type
draft first-contact messages
score lead quality
recommend next contact date
summarize campaign performance
```

### 10.2 Group 1 - Shipowners / Employers / Clients Registration

Purpose:

```text
Register employer-side clients and collect the data required to start commercial and operational work.
```

Inputs:

```text
qualified employer lead
company information
representative contact
vessel or crew request context
submitted documents
```

Outputs:

```text
client card
company profile draft
representative profile
verification request
commercial need summary
next task for sales or control
```

Client lifecycle role:

```text
Qualified lead -> Client registered -> Verification pending -> Service need defined
```

Tasks list:

```text
create client card
collect company details
collect representative authority details
collect vessel or request context
request missing data
prepare verification handoff
assign responsible manager
```

My clients list:

```text
employer clients registered by the manager
employer clients assigned for onboarding
employer clients pending verification
employer clients retained for future crew requests
```

SLA / deadlines:

```text
new client card creation: same business day after qualification
missing information request: within 1 business day
verification handoff after complete data: within 1 business day
inactive onboarding follow-up: every 3 business days unless blocked
```

Quality indicators:

```text
complete client card rate
missing-data rate
duplicate company rate
authority evidence completeness
handoff quality
time from lead qualification to registration
```

AI-agent future role:

```text
prefill company profile from submitted data
detect missing fields
summarize client need
draft missing-information requests
identify possible duplicate clients
prepare verification checklist
```

### 10.3 Group 2 - Seafarer Registration And Development

Purpose:

```text
Help seafarers create complete, useful and compliant profiles without charging recruitment or placement fees.
```

Inputs:

```text
candidate lead
seafarer registration draft
CV data
certificates
availability data
rank and experience information
```

Outputs:

```text
seafarer profile
document readiness summary
profile correction request
ready candidate signal
development recommendation
```

Client lifecycle role:

```text
Candidate lead -> Profile draft -> Profile review -> Ready candidate -> Follow-up
```

Tasks list:

```text
assist profile completion
request missing certificate metadata
check availability and desired position
route profile to review
prepare candidate readiness summary
follow up on correction request
```

My clients list:

```text
seafarers supported by the specialist
seafarers needing document updates
seafarers available for matching
seafarers needing periodic readiness follow-up
```

SLA / deadlines:

```text
new candidate profile first review: within 2 business days
missing document request: within 1 business day after issue detection
correction follow-up: every 5 business days while waiting
availability refresh: according to next availability date or monthly for active candidates
```

Quality indicators:

```text
profile completeness
document metadata completeness
correction cycle count
candidate readiness rate
no-fee control compliance
candidate response time
```

AI-agent future role:

```text
extract CV fields
identify missing certificates
summarize experience
suggest profile improvements
draft correction messages
recommend candidate readiness next steps
```

### 10.4 Group 3 - Payments, Sales And Revenue Distribution

Purpose:

```text
Convert employer-side client needs into approved commercial offers, payments, service entitlements and revenue attribution.
```

Inputs:

```text
service need summary
approved client card
offer request
invoice request
payment confirmation
manager attribution
```

Outputs:

```text
commercial offer
invoice status
payment status
service entitlement
revenue distribution record
reward attribution signal
```

Client lifecycle role:

```text
Service need defined -> Offer sent -> Payment pending -> Service active -> Completed -> Retention / repeat sale
```

Tasks list:

```text
prepare offer
send invoice
follow up payment
confirm service entitlement
record revenue attribution
prepare manager reward input
plan next sale
```

My clients list:

```text
clients with offers sent by the specialist
clients with unpaid invoices
clients linked to revenue attribution
clients ready for repeat sales
```

SLA / deadlines:

```text
offer preparation after complete need summary: within 1 business day
invoice issuance after approved offer: within 1 business day
payment follow-up: according to agreed due date, with first follow-up within 1 business day after overdue
revenue attribution check: before service cycle closure
```

Quality indicators:

```text
offer accuracy
invoice timeliness
payment follow-up timeliness
unassigned revenue exceptions
reward attribution completeness
repeat-sale plan coverage
```

AI-agent future role:

```text
draft offer summary
detect missing billing data
flag overdue payment
summarize client commercial history
recommend next sale
prepare revenue attribution draft for human review
```

### 10.5 Group 4 - Client Support

Purpose:

```text
Keep clients and seafarers informed, resolve operational questions and prevent process loss between stages.
```

Inputs:

```text
support request
client question
system notification
complaint signal
missing-information state
service delivery issue
```

Outputs:

```text
support note
resolved question
missing-information request
escalation
updated next-contact date
client satisfaction signal
```

Client lifecycle role:

```text
All stages, especially waiting, blocked, delivery and retention states.
```

Tasks list:

```text
answer client question
request missing information
route issue to specialist
escalate complaint signal
update communication history
schedule next contact
confirm client satisfaction
```

My clients list:

```text
clients with open support issues
clients previously supported by the specialist
clients waiting for response
clients needing scheduled follow-up
```

SLA / deadlines:

```text
urgent operational support first response: same business day
standard support first response: within 1 business day
waiting-for-client follow-up: according to task next contact date
complaint escalation: same business day when severity requires it
```

Quality indicators:

```text
first response time
resolution time
reopen rate
escalation accuracy
client satisfaction
communication history completeness
```

AI-agent future role:

```text
draft support replies
summarize client history
recommend escalation path
detect complaint language
prepare next-contact plan
translate routine communications where approved
```

### 10.6 Group 5 - Internal Control

Purpose:

```text
Protect compliance, quality, access boundaries, auditability and business-process discipline.
```

Inputs:

```text
verification queue
review queue
complaint queue
access audit
quality review request
overdue task report
exception request
```

Outputs:

```text
approval
rejection
correction request
exception decision
audit note
quality score
process improvement recommendation
```

Client lifecycle role:

```text
Verification pending -> Service active -> Delivery review -> Completed
```

Tasks list:

```text
review verification evidence
approve or return client readiness
review high-risk exception
monitor overdue tasks
audit assignment history
review quality score
confirm no-fee seafarer compliance
```

My clients list:

```text
clients currently under control review
clients with compliance flags
clients with quality exceptions
clients involved in complaint or audit cases
```

SLA / deadlines:

```text
standard verification review: within 2 business days after complete data
high-risk exception review: same business day or next business day depending severity
complaint-linked review: according to complaint severity
overdue task review: daily for red tasks
quality review after service completion: within 3 business days
```

Quality indicators:

```text
review timeliness
decision consistency
correction request clarity
audit completeness
overdue task reduction
exception traceability
no-fee compliance control
```

AI-agent future role:

```text
prepare evidence summaries
flag inconsistencies
detect missing audit trail
summarize overdue tasks
draft review notes
prepare exception-risk summary without making final decisions
```

## 11. Visibility And Access Rules

The default visibility model is scoped.

Allowed visibility:

```text
responsible manager sees own clients
current specialist sees assigned task clients
group lead sees group workload
authorized controller sees required control queues
Project Owner sees operational overview and audit
AI assistant sees only the data explicitly allowed for the assigned task
```

Not allowed as the normal model:

```text
all team members see all clients
unapproved staff browse all client cards
personal e-mail allowlists replace group permissions
AI assistant receives unrestricted client data
tasks are created without client-card source state
```

## 12. Client Card Automation Rules

The client card should generate or update tasks when:

1. a client is created;
2. a required field is missing;
3. a lifecycle stage changes;
4. verification is required;
5. a payment is due;
6. a deadline is approaching;
7. a task becomes overdue;
8. a client is waiting too long;
9. a service is completed;
10. a next sale should be planned;
11. a complaint or support issue is created;
12. a manager handoff occurs.

Each generated task should record:

```text
source_event
source_card_id
assigned_group
assigned_user
deadline
color_state
required_action
blocking_reason
audit_reference
```

## 13. Manager Relationship And Reward Link

When a manager attracts, registers or develops a client, the relationship must remain visible in the client card even after work moves to another specialist.

This supports:

1. client retention;
2. repeat sales;
3. performance review;
4. fair reward attribution;
5. continuity of communication;
6. prevention of client loss.

Reward attribution must not create a prohibited seafarer recruitment fee.

Employer-side revenue attribution may be linked to:

```text
source manager
responsible manager
sales contributor
service delivery contributor
approved revenue distribution rule
```

Seafarer-side optional service attribution, if introduced, must remain compliance-reviewed and separate from placement.

## 14. Portal Page Implications

Future group-specific pages should be designed from this model.

Minimum internal pages implied by this document:

```text
/team/tasks/
/team/my-clients/
/team/clients/{client_id}/
/team/marketing/
/team/employer-registration/
/team/seafarer-development/
/team/payments-sales/
/team/support/
/team/internal-control/
```

Each group page should show:

```text
tasks assigned to the user or group
clients visible to that user
SLA color indicators
deadline filters
client card quick view
next required action
handoff controls
audit trail
```

Editing rights must be controlled by group membership, role permissions and client assignment scope.

## 15. AI-Agent Boundary

AI agents may assist with:

1. summarization;
2. classification;
3. draft messages;
4. missing-data detection;
5. SLA warnings;
6. duplicate detection;
7. next-action suggestions;
8. quality review preparation;
9. internal training support.

AI agents must not independently:

1. approve clients;
2. reject clients;
3. charge clients;
4. assign final reward payments;
5. override compliance controls;
6. expose clients outside access scope;
7. send binding commercial offers without human approval;
8. make final employment or recruitment decisions.

## 16. Implementation Boundary

This document is business-process documentation only.

It does not implement:

```text
database schema changes
backend routes
frontend portal pages
payment logic
reward calculation
AI-agent runtime
access-control enforcement changes
nginx/server configuration
deployment
```

## 17. Next Recommended Documents

Recommended next documents for this business-process block:

| BP ID | Proposed document | Purpose |
|---|---|---|
| BP-002 | Client card data model and automation events | Define the exact card fields, events and task-generation triggers |
| BP-003 | SLA and task color matrix | Define group-specific deadlines, escalation rules and color thresholds |
| BP-004 | Group portal page requirements | Define the first usable pages for each working group |
| BP-005 | Employer-side sales and revenue distribution policy | Define offer, invoice, entitlement and reward attribution workflow |
| BP-006 | Seafarer optional services compliance boundary | Define allowed voluntary services and no-fee controls |

## 18. Control Statement

CrewPortGlobal must be operated so that:

```text
the client is not lost;
the manager relationship is preserved;
every active task has a deadline;
overdue work is visible by color;
client visibility is scoped;
the client card drives automation;
employers and shipowners remain the primary payers;
seafarer no-fee protection is preserved.
```
