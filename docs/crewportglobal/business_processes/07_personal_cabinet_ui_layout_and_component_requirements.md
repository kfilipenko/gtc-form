# CrewPortGlobal - BP-007 Personal Cabinet UI Layout And Component Requirements

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Business-process ID: BP-007
- Source task: Project Owner continuation after BP-006
- Baseline: BP-003, BP-004, BP-005 and BP-006 business-process documentation
- Date: 2026-05-17
- Document type: Interface layout, component and client registration interaction requirements
- Status: Drafted for Project Owner review

## 1. Purpose

This document defines the first target UI layout and component requirements for the CrewPortGlobal personal cabinet, client registration flows and scoped interaction model.

It converts the previous business-process documents into an interface standard that can guide future frontend implementation.

The interface must support:

```text
physical person registration
service account authentication
seafarer workforce card
employer-side requester card
company context
vessel context
vacancy / crew request
tasks
My clients
review and control work
scoped visibility
collapsible cards
```

## 2. Interface Goal

CrewPortGlobal must feel like a practical working application, not a long document site.

The user should always understand:

```text
what requires action now
which cards are active
which data is missing
which status is waiting for review
which records are visible and why
which actions are allowed
what happens next
```

The primary screen is the working cabinet.

The primary first card is:

```text
Мои задачи
```

## 3. Design Principles

The UI should follow these rules:

1. operational density over marketing layout;
2. cards are tools, not decorative blocks;
3. `Мои задачи` is always first and open;
4. all other cards are collapsed by default;
5. collapsed headers must still show counts, status and urgent indicators;
6. actions shown to the user must come from allowed actions returned by backend;
7. unavailable actions must not look available;
8. field visibility must follow backend scope;
9. forms must save drafts and clearly show missing required data;
10. review and correction states must be visible without reading long text.

## 4. Primary Routes

Recommended future routes:

```text
/me/
/me/tasks/
/me/cards/
/me/my-clients/
/me/seafarer/
/me/employer/
/me/companies/
/me/vessels/
/me/crew-requests/
/me/reviews/
/me/billing/
/me/admin/
```

Existing public/action routes may continue during transition:

```text
/register/
/create-profile/
/post-vacancy/
/vacancies/
/verify/
/admin/access/
/team/
```

Future routing rule:

```text
Public pages explain and acquire users.
Personal cabinet pages perform work.
Team pages perform internal operations.
Admin pages manage access and audit.
```

## 5. First-Time Registration Flow

The practical registration order should be:

1. create Physical Person Registration Card;
2. create or connect Service Account / Login Card;
3. authenticate account;
4. select intended path;
5. create draft card for selected path;
6. collect minimum required fields;
7. submit for review where required;
8. show personal cabinet with tasks and missing actions.

Initial intended paths:

```text
I am a seafarer
I request crew / I represent an employer-side client
I was invited by the CrewPortGlobal team
I need support
```

The path choice creates a draft, not final authority.

## 6. Seafarer Registration Flow

The seafarer registration flow creates supply-side data.

Steps:

1. confirm physical person and account;
2. create Seafarer Workforce Card;
3. collect rank and department;
4. collect availability;
5. collect expected compensation and accepted conditions;
6. collect vessel type preferences or restrictions;
7. collect certificate and document metadata;
8. collect experience summary;
9. show no-recruitment-fee acknowledgement;
10. save draft or submit for review.

Required UI cards:

```text
Мои задачи
Profile status
Rank and department
Availability
Compensation and contract expectations
Vessel preferences
Documents and certificates
Experience
Review and corrections
```

The user must not be told that paid optional services are required for job access.

## 7. Employer-Side Registration Flow

The employer-side registration flow creates demand-side requester and buyer context.

Steps:

1. confirm physical person and account;
2. create Employer-Side Requester Card;
3. collect requester type and business contact;
4. create or link Company Context Card;
5. collect authority evidence;
6. create or link Vessel Context Card where needed;
7. create draft Vacancy / Crew Request Card;
8. collect demand conditions;
9. submit authority/request for review;
10. show request status and next action in cabinet.

Required UI cards:

```text
Мои задачи
Requester status
Company
Authority evidence
Vessels
Crew requests
Commercial / billing status
Review and corrections
```

The UI must make clear:

```text
employer-side requester may draft a request
verified authority is required before request can become active
company authority does not automatically mean vessel/request authority
```

## 8. Personal Cabinet Layout

The default cabinet layout should be:

```text
Top bar
  brand
  account identity
  language selector
  logout/session control

Status strip
  account state
  visible role/capability summary
  critical missing actions
  notification count

Card stack
  1. Мои задачи
  2. Notifications
  3. My cards
  4. Seafarer workspace
  5. Employer-side workspace
  6. My clients
  7. Companies
  8. Vessels
  9. Crew requests
  10. Reviews and control
  11. Payments and billing
  12. Admin and audit
```

Only visible sections should be returned and rendered.

## 9. Collapsible Card Standard

All personal cabinet work cards must use the BP-006 presentation rule.

Required default:

```text
card 1: Мои задачи
default_expanded = true
collapsible = false
is_pinned_open = true

all other cards:
default_expanded = false
collapsible = true
is_pinned_open = false
```

Card header click behavior:

```text
collapsed -> expanded
expanded -> collapsed
```

The header should be a real interactive control with:

```text
aria-expanded
aria-controls
keyboard activation
visible focus state
stable title text
```

## 10. Card Header Requirements

Every card header should show:

```text
card title
short status
item count
SLA color badge where relevant
overdue count where relevant
missing required fields count
primary next action label
expand/collapse icon
```

The header must be useful when collapsed.

Example:

```text
Crew requests | 3 active | 1 red | next: review authority
```

Sensitive details must not leak through the header.

## 11. Мои задачи Card

`Мои задачи` is always first and open.

Purpose:

```text
Tell the user what needs action now.
```

Task list columns:

```text
SLA color
priority
task title
source card
required action
deadline
blocking reason
allowed action
```

Task ordering:

1. red tasks;
2. yellow tasks;
3. grey tasks due today;
4. urgent/high priority;
5. green tasks by deadline;
6. blue tasks only where follow-up is required.

Empty state:

```text
No active tasks. Check My clients or visible cards for future work.
```

Allowed actions:

```text
open task
continue draft
respond to correction
submit for review
mark waiting where allowed
complete task where allowed
```

## 12. Notifications Card

Purpose:

```text
Show status changes and important signals without becoming the main work queue.
```

Notification types:

```text
correction requested
review approved
review rejected
authority evidence needed
deadline approaching
task overdue
candidate recommendation ready
payment follow-up due
visibility changed
```

Default state:

```text
collapsed unless critical notification policy requires visual emphasis
```

The notification header should show critical count.

## 13. My Cards Card

Purpose:

```text
Show the person's confirmed and draft cards.
```

Card rows:

```text
card type
card state
review status
missing required fields
visibility reason
next action
```

This section should make mixed-capability users understandable.

Example:

```text
Seafarer Workforce Card - active_limited
Employer-Side Requester Card - pending_authority
Company Context - visible as verified_company_representative
```

## 14. Seafarer Workspace Card

Purpose:

```text
Manage supply-side profile and readiness.
```

Subsections:

```text
Profile summary
Rank and department
Availability
Expected compensation
Accepted vessel types
Documents and certificates
Experience
Review status
Matching visibility
No-fee control
```

States:

```text
draft
submitted
pending_human_review
correction_required
active_limited
active_verified
paused
```

The card header should show:

```text
profile_review_status
document_readiness_status
availability_status
missing fields count
```

## 15. Employer-Side Workspace Card

Purpose:

```text
Manage demand-side requester status and employer-side actions.
```

Subsections:

```text
Requester summary
Authority status
Company links
Vessel links
Crew request drafts
Review/correction state
Commercial next action
```

The card header should show:

```text
authority_status
visible request count
missing evidence count
red/yellow task count
```

## 16. My Clients Card

Purpose:

```text
Show clients connected to the user by responsibility, history, retention, follow-up or reward attribution.
```

Rows:

```text
client name
client type
relationship reason
current stage
current task
last contact
next contact
SLA color
next action
```

Default state:

```text
collapsed
```

Header:

```text
My clients | total count | red/yellow count | next contact due count
```

## 17. Company, Vessel And Crew Request Cards

These cards show demand-side context only when visible by scope.

Each card should use the same row pattern:

```text
record title
state
visibility reason
missing fields
next action
allowed actions
```

Company card must not imply visibility to every company record.

Vessel card must not imply authority to every request.

Crew request card must not allow candidate presentation without approved human review.

## 18. Reviews And Control Card

Purpose:

```text
Show assigned review, verification, complaint, exception and control work.
```

Visible only for authorized review/control roles and assignments.

Rows:

```text
review subject
review type
risk level
deadline
conflict-of-interest flag
allowed decision actions
```

Required UI rule:

```text
Do not show approve buttons when conflict-of-interest check fails.
```

## 19. Payments And Billing Card

Purpose:

```text
Show employer-side commercial and billing status where allowed.
```

Visible only by billing/commercial scope.

Fields:

```text
commercial_terms_status
invoice_status
payment_status
service_entitlement_status
billing_exception_status
next payment action
```

Forbidden:

```text
seafarer recruitment or placement fee prompts
unapproved payment/reward actions
billing data for users without billing scope
```

## 20. Admin And Audit Card

Purpose:

```text
Show access-control and audit functions only to approved admin/control users.
```

This card should remain collapsed by default unless there is a critical admin task.

Rows:

```text
access summary
group membership changes
role/permission summary
audit events
admin session controls
pending access tasks
```

No secrets, one-time codes or passwords may be shown.

## 21. Form Component Requirements

Forms should support:

```text
save draft
autosave where safe
clear missing required field markers
submit for review
return to task
field-level help
status-specific disabled fields
correction reason display
```

Form fields should show:

```text
label
required/optional status
current value
validation message
review/correction state where applicable
last updated timestamp where useful
```

Forms must not:

```text
pretend draft is verified
allow authority status editing by requester
allow review decision editing by subject user
hide missing required fields before submit
```

## 22. Badge And Status Requirements

Standard badges:

```text
draft
pending review
correction required
active limited
verified
waiting for client
overdue
blocked
completed
no-fee protected
authority required
human review required
```

SLA colors:

```text
green: on time
yellow: deadline approaching
red: overdue
grey: waiting for client
blue: completed / no current action
```

Badges must use both color and text.

Color alone is not enough.

## 23. Empty States

Empty states must tell the user what to do next.

Examples:

| Section | Empty state |
|---|---|
| Мои задачи | No active tasks. Check your cards or wait for review updates. |
| My clients | No assigned clients yet. Clients appear here when you own or work with them. |
| Seafarer workspace | Create a seafarer workforce card to describe your availability and qualifications. |
| Employer workspace | Create an employer-side requester card to submit crew demand after authority review. |
| Companies | No visible companies. Company records appear after verified relationship or assignment. |
| Crew requests | No visible crew requests. Create or receive access to a request first. |
| Reviews | No assigned review cases. |

Empty states must not reveal that inaccessible records exist.

## 24. Error And Denied States

Denied states should be safe and useful.

Examples:

```text
You do not have access to this record.
This action requires verified authority.
This action requires human review assignment.
This record is no longer active.
This section is not available for your current account.
```

Do not expose:

```text
internal policy details
names of inaccessible clients
existence of hidden records
security-sensitive deny reasons
```

## 25. Responsive Layout

Desktop:

```text
single main work column with optional right summary rail
card headers remain full width
task table may use columns
detail may open in right drawer or page
```

Tablet:

```text
single column
compact card headers
task rows use stacked metadata
drawer may become full-width panel
```

Mobile:

```text
single column
large tap targets
card headers stack title and badges
task rows become vertical cards
primary action visible at bottom of opened card
avoid horizontal scrolling
```

## 26. Accessibility Requirements

The interface must support:

```text
keyboard navigation
visible focus
aria-expanded for collapsible cards
aria-controls for card bodies
button semantics for headers
text labels for status colors
sufficient contrast
logical heading order
form labels tied to inputs
error text associated with fields
```

## 27. Data Loading Requirements

Loading should be predictable.

Recommended sequence:

1. authenticate session;
2. load `/api/v1/me/cabinet`;
3. render visible card headers;
4. render `Мои задачи` body;
5. lazy-load or expand-load other card details when opened;
6. preserve access checks on every detail load.

Collapsed cards may load summary data first and details on open.

Detail lazy loading must not bypass access checks.

## 28. Interaction Rules

Required interactions:

```text
open card by header click
close card by header click
open task detail
return from task detail
save draft
submit for review
respond to correction
filter tasks by SLA color
sort tasks by deadline
open visibility reason where internal policy allows
logout
```

Forbidden interactions:

```text
bulk expose all records
approve own submission
present candidate without human review
edit authority status directly
change billing/reward status without allowed action
send AI-generated final decision without human approval
```

## 29. Interface Acceptance Criteria

Future implementation should pass:

1. `Мои задачи` appears first and open by default;
2. every other visible card is collapsed by default;
3. collapsed cards can be opened and closed by header click;
4. card headers show status, counts and urgent indicators;
5. hidden card details do not leak through headers;
6. sections render only when visible by access contract;
7. action buttons render only when allowed;
8. empty states do not reveal hidden records;
9. mobile layout has no horizontal scrolling;
10. forms show missing required fields before submit;
11. review/correction statuses are visible without long reading;
12. no-fee seafarer protection is visible in seafarer workflow;
13. employer authority requirements are visible before request activation;
14. AI-generated content is marked as draft/help, not final decision.

## 30. Implementation Boundary

This document does not implement:

```text
frontend personal cabinet
backend cabinet API
database migrations
runtime access checks
authentication changes
payment logic
AI-agent runtime
nginx/server configuration
deployment
```

## 31. Next Recommended Work

Recommended next document:

```text
BP-008 - Client registration and interaction procedure
```

Reason:

BP-007 defines the target interface layout and component behavior. The next document should define the operational registration and interaction procedure step-by-step for seafarers, employer-side clients, internal specialists and reviewers before implementation begins.
