# BP-016 - Business Process Stage And Standard Mapping Matrix

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Documentation block: Business processes and operating model
- Document type: Stage-to-standard control matrix
- Source task: Project Owner instruction after CPG-BIZ-093 approval
- Version: 3.13
- Date: 2026-06-10
- Status: Synchronized after CPG-BIZ-123 framework/commercial separation clarification

## 1. Purpose

This document maps CrewPortGlobal business-process stages to the standards that control each stage.

The goal is to build a logical and complete business model:

```text
business stage
-> working object
-> responsible group
-> controlling standard
-> evidence
-> computed task
-> next stage
```

The matrix is also the future source for job descriptions. A job instruction should not be written from memory or from a screen layout. It should be written from the approved process stage and its controlling standard.

## 2. Operating Rule

Each stage must have:

1. a clear business purpose;
2. a primary object;
3. a responsible group or role;
4. a controlling standard;
5. required input data;
6. required output/evidence;
7. computed task rule;
8. handoff to the next stage.

If a stage has no controlling standard, it must be marked as a gap and described before broad implementation.

## 2A. Participant Task Routing Model

CrewPortGlobal does not operate as a set of static role pages.

The portal operates through computed tasks derived from business records:

```text
information stream
-> working object
-> current object state
-> business-process stage
-> managing participant / agent assignment scope where applicable
-> responsible group or owner role
-> required permission
-> historical active executor where applicable
-> visible task
-> exact working object link
```

The visible task belongs to the participant who has a valid relationship to the current stage and object.

Task recipients include:

| Recipient | Task source | Main surface |
|---|---|---|
| Seafarer owner | Own profile, documents, availability, corrections and incoming-request review results | `/cabinet/`, `/create-profile/`, `/seafarers/job-search/` |
| Employer / shipowner owner | Own company, vessel, crew request, incoming requests, candidate decisions and contract proposal context | `/cabinet/`, `/post-vacancy/`, `/shipowners/candidates/` |
| Agent organization / agent user | Active/limited object assignment, verified/limited authority evidence and required permission | `/agents/`, `/agents/tasks`, assignment-specific object workspace |
| Platform Administration / Control | Authority review, object-creation request review, duplicate/account claim resolution, reassignment and control exceptions | `/admin/agents/review-workspace`, protected admin/control surfaces |
| Verification team | Profile, company, vessel, document and authority review stages | `/team/`, `/verify/`, `/team/documents/` |
| Review team | Request-supply comparison, shortlist, candidate presentation and incoming seafarer request review | `/team/`, `/verify/`, `/team/matching/`, `/team/shortlists/` |
| Billing / commercial group | Service package, service evidence and billing-basis stages | Future billing/commercial workspace |
| Project Owner / control role | Access policy, deletion confirmation, audit exceptions and governance blockers | `/admin/access/`, `/team/`, future control workspaces |

Every task card must show:

1. one clear primary operation;
2. safe object summary;
3. business-process stage;
4. visibility condition;
5. responsible group or owner role;
6. assigned employee when historical active executor exists;
7. required permission;
8. blocker/status reason when execution is not allowed;
9. active link to the exact internal working object.

The approved task title pattern remains:

```text
{Stage action}. ({Object type}: {safe object summary}.)
```

The link must open the executable working object or controlled blocker state. Sending the user to a generic list is not compliant.

Task exit rules:

1. after a review/action completes, the same active task must disappear unless it remains only as a controlled blocker;
2. the next task is recomputed from the new object state;
3. if the same active group member previously completed an analogous operation for the same object, future tasks for that group/object are assigned to that active employee;
4. if no active historical executor exists, the task remains in the group queue;
5. if an object is managed by an agent organization, ordinary object tasks route to the active managing agent scope and not to unrelated broad group members;
6. if management is reassigned, future tasks route to the new managing participant while the old participant remains in audit/history only.

## 3. Current Standard Library

| Standard / document | Scope | Current status |
|---|---|---|
| BP-001 Business declaration and lifecycle | Employer as primary payer, no-fee seafarer boundary, client lifecycle, working groups | Existing baseline |
| BP-002 Role instructions | Six working groups, task lists, handoffs, SLA colors, authority boundaries | Existing baseline; later job descriptions must refine it |
| BP-003 Client card model | Employer demand and seafarer supply card structure | Existing baseline |
| BP-004 Card field dictionary and workflow states | Card fields, statuses, events, task triggers | Existing baseline |
| BP-005 Personal cabinet requirements | Runtime cabinet assembly, visible sections, task/action scopes | Existing baseline |
| BP-006 Scoped visibility and access-check contract | Visibility, field filtering, allowed actions, audit obligations | Existing baseline |
| BP-007 Personal cabinet UI requirements | Cabinet layout, cards, badges, responsive behavior | Existing baseline |
| BP-008 Client registration and interaction | Physical person registration, authentication, path selection | Existing baseline |
| BP-009 Public site and authenticated navigation | Public-to-authenticated route transition and menus | Existing baseline; public site still needs cleanup |
| BP-010 Document upload, storage and review | Protected upload, storage, metadata, scan/review, replacement | Existing baseline |
| BP-011 Seafarer field dictionary and catalogs | Seafarer Excel/catalog alignment | Existing baseline; demand/vessel catalog parity still needs expansion |
| BP-012 Crew formation service manual | End-to-end crew formation operating process CF-01..CF-18 | Controlling process baseline |
| BP-013 Operating instructions | Practical instructions for users, team, reviewers, managers, billing and control users | Existing baseline; must be rewritten into role job instructions after this matrix |
| BP-014 Standard form lifecycle | Save, autosave, completeness, protected upload, submit-review, computed tasks | Approved implementation standard |
| BP-015 Commercial operating cycle | Marketing, registration, packages, service evidence, billing, retention | Controlling commercial cycle baseline |
| CPG-BIZ-091 / 092 | Seafarer/shipowner contract template and field-form specification | Drafted standards for contract structure |
| CPG-BIZ-093 | Public master contract versioning and immutable clause control | Approved by Project Owner; Contract Agreement Workspace and scripted generation standard |
| CPG-BIZ-095 | Contract Agreement Workspace and embedded condition fields | Approved operating model for future implementation planning |
| CPG-BIZ-096 | Contract workspace object, API and UI design | Drafted object/API/UI design for future runtime implementation |
| CPG-BIZ-110 | Structured terms clarification before contract proposal | Task prepared for Project Owner approval; no runtime implementation yet |
| CPG-BIZ-111 | Agent role separation and authority model | Documented business-process control: agent organizations, same-rule GTC/external agents, authority evidence, duplicate/account claims and object scope |
| CPG-BIZ-112 | Agent organization scope SQL draft | Drafted SQL/API/UI plan outside runtime migration; includes agent-created object requests, authority documents, assignments, claims and audit |
| CPG-BIZ-113 | Agent organization scope runtime migration | Implemented migration 020 for agent organizations, agent users, authority documents, agent-created object requests, assignments, claims and agent-scope audit |
| CPG-BIZ-114 | Agent workbench page and navigation | Implemented `/agents/` page shell and `Agents` menu group for the future scoped agent cycle without granting runtime permissions |
| CPG-BIZ-115 | Agent API authority and management scope plan | Defines that an agent may create any supported object request, but may manage the created/linked object only after verified authority evidence and active object assignment; every object card must expose `Managed by` / `Управляется` as the task-routing actor and authority must be visible in agent lists and participant cards |
| CPG-BIZ-116 | Agent API skeleton and verified authority guard | Implemented protected agent API endpoints, authority submission/review, controlled object assignment, object-scope mismatch guard, audit events and `management` context in API/task payloads |
| CPG-BIZ-117 | Agent task queue routing and authority review workspace | Implemented `/agents/tasks`, platform-control `/admin/agents/review-workspace`, computed agent task titles, authority review tasks, object-request review tasks and authority evidence visibility in agent object cards |
| CPG-BIZ-118 | Agent account/object claim and reassignment workflow | Implemented agent claim submission/listing, platform-control claim review tasks, authority-guarded claim approval, assignment reassignment and claim-linked audit events |
| CPG-BIZ-119 | Agent-managed object participant cards and scoped object workspace | Implemented assignment-specific `/agents/objects/{assignment_id}/workspace`, safe participant cards, `Managed by` authority context, workspace guard and assignment-specific UI links |
| CPG-BIZ-123 | Shipowner-agent agreement checkbox/radio template | Updated full RU template for future portal generation and agent appointment activation, including shipowner offer, agent acceptance, standard framework adhesion-form boundary, platform-side POA/authority, separate Service Order / commercial addendum / request for paid services, no-fee/SEA coordination boundaries, exclusive delegated management and notification ledger clauses |
| CPG-BIZ-124 | Agent assignment context enforcement in profile and demand forms | Implemented runtime guard for agent-opened profile/demand draft routes, completeness, submit-review, protected document list/upload and seafarer workspace resolution |
| CPG-BIZ-125 | Agent representation capacity, dual-interest facilitation, conflict boundary and personal contract-signature rule | Documented standard requiring represented-party capacity in agent tasks/actions, allowing ordinary dual-interest facilitation, controlling formal dual-management/final authority and requiring direct seafarer/shipowner party review/signature for contract-critical terms |
| CPG-BIZ-126 | Participant representative appointment and assignment notification standard | Documented standard for physical-person self-registration, platform-capacity authorization, optional representative appointment/replacement, signed representation agreement/POA evidence, exclusive delegated operational management, participant governance notification ledger, agent-created preparation/invitation contexts, one-active-manager rule and safe notifications to represented parties, previous agents, new agents and control roles |
| CPG-BIZ-127 | Participant governance notification ledger API/UI implementation | Implemented first runtime slice: shipowner agent-selection panel, in-system framework offer, agent offer list/task, checkbox acceptance, verified shipowner-agency authority document, active one-manager assignment, participant notification ledger records and test agent seed; commercial terms remain `commercial_terms_pending` until separate Service Order / commercial addendum |
| BP-017 | Shipowner agent appointment and framework agreement process | Dedicated process standard for the implemented shipowner-to-agent flow: visible shipowner action, registered agent selection/invitation, in-system offer, agent acceptance, platform authority, one active assignment, commercial pending status and notification ledger |
| ICS-004 | Shipowner-agent framework offer acceptance standard | Implemented code standard for the canonical offer/acceptance/authority/assignment endpoints and UI adapters |
| Implemented Code Standards ICS-001..004 | Reusable code standards for form lifecycle, protected upload, submit-review gate and shipowner-agent framework offer acceptance | Existing code-level standard register |

## 4. Stage-To-Standard Matrix

| Stage | Process code | Main object | Responsible group | Existing controlling standard | Coverage | Missing / next standard |
|---|---|---|---|---|---|---|
| Marketing to seafarers | CC-01 / before CF-06 | Seafarer lead | Group 0 marketing, Group 2 seafarer support | BP-015, BP-009 | Partial | Standard for lead source, campaign evidence, public CTA, conversion metrics and no-fee wording. |
| Marketing to employers / shipowners | CC-02 / before CF-01 | Employer lead | Group 0 marketing, Group 1 demand intake | BP-015, BP-009 | Partial | Standard for employer lead qualification, package offer, partner/logo publication and commercial interest evidence. |
| Physical person registration | CC-03 | User account / physical person | Registration flow, support | BP-008, BP-014 | Covered | Need job instruction for support exceptions and failed registration recovery. |
| Path selection after registration | CC-03 | User role path | Registration flow, support | BP-008, BP-009 | Partial | Standard for automatic routing to seafarer profile or employer/vacancy workspace after role selection. |
| Agent onboarding, object creation and scope | CF-00A / CF-00B / CF-00C | Agent organization, agent-created preparation/invitation request, assignment, account/object claim, participant representative appointment, participant notification ledger, shipowner-agent framework agreement, commercial addendum / Service Order where paid work is requested | Platform Administration / Control, assigned agent organization, represented participant, Billing / commercial group where paid service is requested | BP-012, BP-013, BP-015, BP-017, ICS-004, CPG-BIZ-111, CPG-BIZ-112, CPG-BIZ-113, CPG-BIZ-114, CPG-BIZ-115, CPG-BIZ-116, CPG-BIZ-117, CPG-BIZ-118, CPG-BIZ-119, CPG-BIZ-123, CPG-BIZ-124, CPG-BIZ-125, CPG-BIZ-126, CPG-BIZ-127 | Runtime migration 020 implemented and verified; `/agents/` page and `Agents` navigation shell implemented; protected API skeleton implemented for agent session, authority submission, object creation requests, admin authority review, admin object assignment, object-scope mismatch guard, audit events and `Managed by` management context; `/agents/tasks` now computes agent-visible tasks; `/admin/agents/review-workspace` computes platform-control authority/object-request/claim review tasks; claim approval can link or reassign active object management under verified authority; `/agents/objects/{assignment_id}/workspace` opens a concrete participant card with safe fields, authority context and guarded working links; agent-opened profile/demand draft APIs now enforce `actor=agent&assignment_id=...` against the active assignment before save, completeness, submit-review and protected-document operations; agent task routing must preserve represented-party capacity, allow ordinary dual-interest facilitation, require physical-person self-registration or personal claim/activation before durable participant authority, keep agent appointment optional, maintain one active managing representative per object, lock participant operational editing while exclusive delegated management is active, persist governance notifications for authority/document/obligation milestones and require an in-system shipowner offer, agent acceptance of the standard framework adhesion-form agreement package, platform-side authority evidence, one-active-manager check and notification record before active shipowner-side representative management; `/shipowners/` and the shared shipowner menu expose a direct `Appoint agent / Назначить агента` action that deep-links to `/shipowners/candidates/#agent-assignment`; paid service, billing basis, success fee and SLA calculations require separate Service Order / commercial addendum / request or approved price-basis record | Remaining work: Service Order / commercial addendum activation, previous-agent replacement/revocation, seafarer-side representative appointment, notification delivery/read state and delegated operational lock coverage. |
| Seafarer profile completion | CC-04 / CF-06 | Seafarer supply profile | Seafarer owner, Group 2 support | BP-011, BP-014, BP-010 | Covered for current form | Need final parity check for all matching-critical fields and document-first extraction plan. |
| Seafarer document readiness review | CF-07 | Seafarer documents and profile readiness | Verification team / Group 5 | BP-010, BP-012, BP-014 | Covered in principle and partially implemented | Job instruction for document review outcomes, correction reasons and restricted medical boundary. |
| Employer/company registration | CC-05 / CF-02 | Employer/company card | Employer owner, Group 1, Group 5 | BP-003, BP-008, BP-014 | Partial | Standard for employer authority evidence, logo/public partner eligibility and commercial account status. |
| Vessel registration | CC-06 / CF-03 | Vessel context card | Employer owner, Group 1, Group 5 | BP-014, CPG-BIZ-047 report, BP-012 | Partial | Dedicated vessel-context standard: flag, type, documents, particulars, owner/manager link and matching use. |
| Framework agreement and commercial terms setup | CC-08 / CF-05 | Framework agreement acceptance, authority package, Service Order / commercial addendum / request, service entitlement | Group 3 billing/commercial, Group 5 control, Group 1 client intake | BP-015, BP-012, CPG-BIZ-123 | Partial | Runtime API/UI must separate `framework_terms_accepted` and `commercial_terms_pending/service_order_accepted`: legal representative management may activate after authority, but paid service, billing basis, success fee and SLA require separate commercial agreement. |
| Crew request / vacancy intake | CC-09 / CF-04 | Crew request / vacancy | Employer owner, Group 1, review team | CPG-DEMAND-001/002 docs, BP-014, BP-012 | Partial | Unified demand field and catalog standard tied to matching, contract terms and visibility. |
| Request-supply comparison | CC-10 / CF-08 | Demand + safe supply comparison | Review team | BP-012, CPG-BIZ-017/020/021 reports, CPG-DEMAND-007..011 reports | Covered for current workflow | Need formal matching-explanation standard: why fit, why blocked, score/priority boundary. |
| Seafarer job-search counter-flow | CC-10 / CF-08A | Seafarer profile + published verified vacancies | Seafarer owner, shipowner owner, review team, then employer flow | BP-012, BP-013, CPG-BIZ-105/106/107/108/109 reports | Implemented: `/seafarers/job-search/` computes vacancy matches from the saved profile and allows a controlled request for contract consideration through `vacancy_applications`; `/cabinet/` and `/shipowners/candidates/` compute the shipowner incoming-request handoff; `/team/` and `/verify/` compute `Review incoming seafarer request`; approved requests release into presented-candidate visibility, while correction/rejection outcomes require a structured reason taxonomy and recompute a seafarer cabinet correction/review task with an exact profile/document section link; contract proposal remains guarded | Future refinement of employer notification SLA and resubmission lifecycle after seafarer correction. |
| Internal shortlist draft | CC-11 / CF-09 | Internal shortlist draft | Review team | CPG-DEMAND-012/013/014, BP-012 | Covered | Future job instruction for shortlist creation and hold/exclude decisions. |
| Internal shortlist approval | CC-11 / CF-10 | Internal shortlist approval record | Review team / control role | CPG-DEMAND-015, BP-012 | Covered | Future segregation-of-duties rule if creator and approver must differ. |
| Candidate presentation review | CC-12 / CF-11 | Candidate presentation staging | Review team / Group 5 | CPG-DEMAND-016/023, BP-012 | Covered in current guard model | Need user-facing employer presentation package standard. |
| Employer-facing presentation | CC-12 / CF-12 | Employer-safe candidate summary | Review team, Group 1 | CPG-DEMAND-023, BP-006, BP-012 | Partial | Standard for employer view content, field allow-list, presentation evidence and expiry. |
| Shipowner candidate selection / decision | CC-13 / CF-13 | Presented candidate list and candidate decision | Group 1, review team, shipowner-side user | BP-012, earlier employer follow-up reports, CPG-BIZ-099, CPG-BIZ-100, CPG-BIZ-101 | Implemented: dedicated `/shipowners/candidates/` workspace lists only employer-safe presented candidates and calls the guarded CPG-BIZ-100 contract proposal endpoint | Normalize all employer decision outcomes, reasons and SLA handoffs inside the candidate detail/workspace flow. |
| Structured terms clarification | CC-13A / CF-13A | Terms comparison matrix and agreed terms sheet | Shipowner, seafarer, responsible team, review/control where needed | CPG-BIZ-110 task, BP-012, BP-013, CPG-BIZ-095 contract workspace model | Planned: structured no-chat stage that compares shipowner/vacancy terms with seafarer profile/preferences and records party proposals, accept/reject states, team review and final agreed terms before contract proposal | Create a future free-numbered UI/API/SQL design for the terms clarification workspace and update BP-012/BP-013 with exact operating instructions. |
| Contract Agreement Workspace | CC-14 / CF-14 | Populated agreement with embedded condition fields | Group 1, Group 4, Group 5 | CPG-BIZ-091/092/093/094/095/096/097/098A/098B/098C/098D/099/100/102, BP-014 | Implemented: workspace model, clause library, catalogs, source-first prefill rule, exact shortlist candidate link, runtime schema migration 018, employer `propose_contract` API/UI creation/reuse, detail view and verified source-prefill page `/contracts/workspace/` | Implement embedded field editing, catalog choices, audit evidence and party-review readiness guard. |
| Scripted contract generation | CC-14 / CF-14 | Generated contract instance | System script, responsible employee, control role | CPG-BIZ-093/094/095/096/097/098A/098B/098C/098D, BP-014 | Runtime schema can store generated contract metadata and audit events; generation script not implemented | Future generation implementation after workspace API/UI and party approval guards. |
| Embarkation confirmation | CC-14 / CF-14 | Employment/voyage support record | Group 4 support, Group 1, employer | BP-012, BP-015 | Gap/partial | Standard for boarding evidence, onboard status, success-fee trigger and failed-joining blocker. |
| Active voyage monthly evidence | CC-15 / CF-15 | Monthly service evidence | Group 4 support, Group 3 billing | BP-012, BP-015 | Gap | Standard for monthly work confirmation, illness/early-disembarkation signal, replacement and invoice basis. |
| Disembarkation and return support | CC-16 / CF-16 | Return / repatriation support record | Group 4 support, responsible manager | BP-012, BP-015, CPG-BIZ-089/090 | Partial | Standard for return responsibility, route, destination, payer, support completion and next availability task. |
| Service completion and billing | CC-17 / CF-17 | Billing/service completion record | Group 3 billing, responsible manager | BP-015, billing policy document 15 | Gap/partial | Standard for invoice basis, success fee, monthly service fee, replacement exceptions and reward attribution. |
| Retention and next voyage marketing | CC-19 / CF-18 | Seafarer/client retention record | Group 0, Group 1, Group 2 | BP-015 | Gap | Standard for post-voyage care, availability refresh, next request, employer repeat sales and follow-up SLA. |
| Audit and evidence retention | Cross-stage | Audit events and records | All groups, Project Owner/control | BP-006, BP-010, BP-012, BP-015 | Partial | Unified audit evidence retention standard by stage and record type. |
| Computed task visibility and assignment | Cross-stage | Task computed from object state | All operational groups | BP-012, BP-013, CPG-BIZ-014..030 reports | Covered for current team task model | Job instruction must define task ownership by stage and exception escalation. |
| Public site functional alignment | Cross-stage | Public pages and CTAs | Group 0 / product owner | BP-009, BP-015, CPG-BIZ-054..087 reports, CPG-BIZ-101 | Partial | Continue removing duplicate descriptive pages from normal navigation and keep only role/action pages. |

CPG-BIZ-127 / BP-017 / ICS-004 update: the first runtime slice is now implemented for shipowner-to-agent appointment. `/shipowners/` exposes the direct `Appoint agent / Назначить агента` action, `/shipowners/candidates/#agent-assignment` can send a framework offer to a registered agent, `/agents/` can display and accept that offer, and the backend records authority, one active assignment and participant notification ledger records. Remaining work is commercial Service Order / addendum activation, previous-agent replacement/revocation, seafarer-side appointment, notification delivery/read state and delegated operational lock coverage.

## 5. Gap Register

The following standards should be created or expanded before final job descriptions are issued.

| Priority | Proposed standard | Reason |
|---|---|---|
| P1 | Employer service package, Service Order and entitlement standard | Without this, subscription/package, discounts, service access, commercial terms, paid service activation and billing start are not fully controlled. |
| P1 | Structured terms clarification workspace standard | Required before contract proposal so salary, joining date, duration, travel, repatriation and document-readiness differences become auditable agreed terms instead of chat text. |
| P1 | Participant governance notification ledger API/UI follow-up slices | First shipowner-to-agent offer/acceptance slice is implemented under CPG-BIZ-127. Remaining work must add Service Order / commercial addendum activation, previous-agent replacement/revocation, seafarer-side appointment, notification read/delivery lifecycle and delegated operational lock across all edit surfaces. |
| P1 | Contract workspace embedded field editing and party-review readiness guard | CPG-BIZ-102 can open a concrete workspace and show source-prefilled facts; the next gap is controlled completion of selectable embedded contract fields before party review. |
| P1 | Embarkation and onboard-status evidence standard | Required to prove success fee, onboard status and service delivery. |
| P1 | Monthly service evidence and billing-basis standard | Required for recurring monthly service fee and partial-month/illness/replacement cases. |
| P1 | Disembarkation, return support and next-availability standard | Required to complete the full service cycle and retain seafarers. |
| P2 | Employer feedback and candidate decision standard | Required to normalize employer outcomes and next tasks. |
| P2 | Vessel-context standard | Required to make vessel data comparable for matching, contract and risk review. |
| P2 | Demand field and catalog parity standard | Required to keep shipowner requests and seafarer supply comparable. |
| P2 | Public page role-conversion standard | Required to remove descriptive pages and align site pages with business outcomes. |
| P3 | Unified audit evidence retention standard | Required before formal audit/compliance packaging and long-term retention rules. |
| P3 | Role job-instruction package | Can be written after P1/P2 standards are stable enough for operating procedures. |

## 6. Job Instruction Derivation Rule

Every future job instruction must be derived from this chain:

```text
BP-015 commercial stage
+ BP-012 CF process step
+ controlling standard
+ responsible group
+ allowed operation
+ required evidence
= job instruction
```

The job instruction must define:

1. what task appears in the user's cabinet;
2. which object the user opens;
3. what data the user may see;
4. what action the user may perform;
5. what evidence is required before completion;
6. what audit event is created;
7. which next task is computed;
8. when escalation is required.

## 7. Immediate Next Work

Current synchronized checkpoint:

```text
CPG-BIZ-127 first runtime slice is implemented: shipowner sends an in-system framework offer to a registered agent, agent accepts/signs by checkbox, platform creates authority and one active assignment, and notification ledger records are persisted while commercial terms remain pending.
```

The agent scope chain now includes:

1. CPG-BIZ-111 - agent role separation and authority model;
2. CPG-BIZ-112 - agent organization scope SQL draft;
3. CPG-BIZ-113 - runtime migration 020;
4. CPG-BIZ-114 - `/agents/` workbench shell and navigation;
5. CPG-BIZ-115 - authority/management scope and `Managed by` task-routing context;
6. CPG-BIZ-116 - protected agent API skeleton and verified-authority guard;
7. CPG-BIZ-117 - agent computed tasks and platform-control authority/object-request review workspace;
8. CPG-BIZ-118 - account/object claim and reassignment workflow;
9. CPG-BIZ-119 - assignment-specific agent-managed object workspace;
10. CPG-BIZ-124 - agent assignment-context enforcement in profile, demand and protected-document routes;
11. CPG-BIZ-125 - agent representation capacity, dual-interest facilitation, formal dual-management blocker and personal seafarer/shipowner contract review/signature rule;
12. CPG-BIZ-126 - physical-person self-registration, platform-capacity authorization, optional representative appointment, signed representation agreement/POA evidence, exclusive delegated operational management, participant governance notification ledger, agent-created preparation/invitation contexts, one-active-manager rule and assignment notification standard;
13. CPG-BIZ-127 - first runtime shipowner-agent framework offer, agent acceptance, authority/assignment activation and notification ledger implementation.

The recommended next stage is:

```text
CPG-BIZ-127 follow-up - Service Order / commercial addendum activation and representative-notification expansion
```

Goal: build the commercial activation layer that follows the implemented framework appointment. The next slice should let the parties record a separate Service Order / commercial addendum / request or approved price-basis record, move paid-service status beyond `commercial_terms_pending`, and keep notification ledger records for commercial acceptance, billing readiness and any representative replacement/revocation. The same work should expand the notification ledger toward previous-agent/new-agent/represented-party tasks and begin enforcing delegated operational locks on all participant edit surfaces.

After that, the process should move to:

1. incoming request resubmission lifecycle after seafarer correction;
2. shipowner notification SLA after incoming-request correction;
3. structured terms clarification workspace UI/API/SQL design under a free CPG-BIZ number;
4. contract workspace embedded field editing and party-review readiness guard;
5. scripted contract generation guard after party approval;
6. employer service package and entitlement standard;
7. embarkation/onboard evidence standard;
8. monthly service evidence and billing-basis standard;
9. disembarkation/return support standard;
10. role job-instruction package for the operational groups.

## 8. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 3.13 | 2026-06-10 | GTC IT / AI Assistant | Added CPG-BIZ-127 first runtime implementation result and synchronized BP-017 / ICS-004 as controlling standards for the visible shipowner agent-appointment action, framework offer acceptance, authority/assignment activation, notification ledger and next follow-up for commercial Service Order/addendum |
| 3.12 | 2026-06-10 | GTC IT / AI Assistant | Clarified CPG-BIZ-123/BP-012/BP-015 separation between framework adhesion agreement and separate Service Order / commercial addendum: representative management may activate after authority, while paid service, billing basis, success fee and SLA require separate commercial agreement |
| 3.11 | 2026-06-10 | GTC IT / AI Assistant | Clarified CPG-BIZ-123 and CPG-BIZ-127 first runtime scenario: shipowner sends an in-system offer, agent accepts the standard adhesion-form package, platform-side authority and price basis are recorded, and only then can active agent management be activated |
| 3.10 | 2026-06-10 | GTC IT / AI Assistant | Added CPG-BIZ-123 shipowner-agent agreement package as a controlling standard for agent onboarding, including portal activation gate, POA/appendix signing, delegated lock and notification-ledger prerequisites; clarified CPG-BIZ-127 first runtime scenario |
| 3.9 | 2026-06-10 | GTC IT / AI Assistant | Added CPG-BIZ-126 participant governance notification ledger requirements for authority confirmation, representation agreement/POA, delegation, document-stage and obligation-stage milestones; renamed next runtime slice to CPG-BIZ-127 notification ledger API/UI implementation |
| 3.8 | 2026-06-10 | GTC IT / AI Assistant | Clarified CPG-BIZ-126 and BP-008 around exclusive delegated operational management: participant credentials remain personal, but active representative appointment locks participant operational editing for the delegated scope while preserving appointment/revocation governance rights |
| 3.7 | 2026-06-10 | GTC IT / AI Assistant | Clarified CPG-BIZ-126 and BP-008 around physical-person self-registration, platform-capacity authorization and optional representative appointment; agent-created records are preparation/invitation contexts, not ordinary active user accounts |
| 3.6 | 2026-06-10 | GTC IT / AI Assistant | Added CPG-BIZ-126 participant representative appointment and assignment-notification standard, clarified ordinary dual-interest facilitation and moved runtime notification implementation to CPG-BIZ-127 |
| 3.5 | 2026-06-09 | GTC IT / AI Assistant | Added CPG-BIZ-125 as the agent representation/conflict/personal-signature standard and moved owner/previous-agent notification work to CPG-BIZ-126 with represented-party capacity context |
| 3.4 | 2026-06-09 | GTC IT / AI Assistant | Added participant task-routing model and synchronized immediate next work after CPG-BIZ-124 so CPG-BIZ-125 owner/previous-agent notifications is the current next stage |
| 3.3 | 2026-06-09 | GTC IT / AI Assistant | Added CPG-BIZ-124 result: agent assignment-context enforcement for profile/demand draft APIs, protected documents and seafarer workspace resolution |
| 3.2 | 2026-06-08 | GTC IT / AI Assistant | Added CPG-BIZ-119 result: assignment-specific agent object workspace, participant card, safe fields, guarded working links and next gap for form-level assignment-context enforcement |
| 3.1 | 2026-06-08 | GTC IT / AI Assistant | Added CPG-BIZ-118 result: agent claim submission, platform-control claim review task, authority-guarded reassignment and claim-linked audit events |
| 3.0 | 2026-06-08 | GTC IT / AI Assistant | Added CPG-BIZ-117 result: agent computed task endpoint, platform-control authority review workspace, object-request review tasks and authority evidence visibility |
| 2.9 | 2026-06-08 | GTC IT / AI Assistant | Added CPG-BIZ-116 result: protected agent API skeleton, verified-authority guard, object assignment, audit evidence and `management` API/task context |
| 2.8 | 2026-06-07 | GTC IT / AI Assistant | Added CPG-BIZ-114 result: `/agents/` workbench page and `Agents` navigation group implemented as safe UI shell before API/task-scope wiring |
| 2.7 | 2026-06-07 | GTC IT / AI Assistant | Marked CPG-BIZ-113 as implemented: runtime migration 020 for agent organization scope schema was applied and verified on test DB/API regression |
| 2.6 | 2026-06-07 | GTC IT / AI Assistant | Added CPG-BIZ-111/112 agent role separation and SQL draft controls, including agent-created object requests and corrected the future terms-clarification numbering conflict |
| 2.5 | 2026-06-05 | GTC IT / AI Assistant | Added CPG-BIZ-110 structured terms clarification stage between shipowner candidate decision and Contract Agreement Workspace |
| 2.4 | 2026-06-05 | GTC IT / AI Assistant | Marked CPG-BIZ-109 as implemented: seafarer-owner cabinet correction task recomputed from incoming request review reason and current application state |
| 2.3 | 2026-06-05 | GTC IT / AI Assistant | Marked CPG-BIZ-108 as implemented: incoming seafarer request correction/rejection reason taxonomy, audit reason codes and `/verify/` outcome controls |
| 2.2 | 2026-06-05 | GTC IT / AI Assistant | Marked CPG-BIZ-107 as implemented: review-team task wording, `/verify/` stage context and recomputation from incoming request to presented-candidate workflow |
| 2.1 | 2026-06-05 | GTC IT / AI Assistant | Marked CPG-BIZ-106 as implemented: seafarer-initiated requests compute shipowner cabinet tasks and safe incoming-request visibility before team review/presentation release |
| 2.0 | 2026-06-05 | GTC IT / AI Assistant | Marked CPG-BIZ-102 as implemented: Contract Agreement Workspace detail view, verified source-prefill, access guard and no-side-effect review boundary |
| 1.9 | 2026-06-05 | GTC IT / AI Assistant | Marked CPG-BIZ-101 as implemented: Shipowners menu, dedicated `/shipowners/candidates/` page, safe presented-candidate visibility and guarded contract handoff |
| 1.8 | 2026-06-04 | GTC IT / AI Assistant | Added CPG-BIZ-101 task for Shipowners terminology/menu, dedicated candidate-selection workspace and safe presented-candidate visibility before contract proposal |
| 1.7 | 2026-06-04 | GTC IT / AI Assistant | Added CPG-BIZ-100 implementation result: employer `proceed_with_candidate`, guarded `Propose contract`, workspace creation/reuse and updated next stage to workspace detail/prefill |
| 1.6 | 2026-06-04 | GTC IT / AI Assistant | Added CPG-BIZ-099 shipowner candidate review and guarded contract proposal design; updated next stage to runtime API/UI implementation |
| 1.5 | 2026-06-04 | GTC IT / AI Assistant | Added CPG-BIZ-098D runtime migration implementation result and updated the next stage to shipowner candidate review / Propose Contract design |
| 1.4 | 2026-06-04 | GTC IT / AI Assistant | Added CPG-BIZ-098C corrected SQL draft status and updated the next gate to corrected SQL draft approval for runtime migration packaging |
| 1.3 | 2026-06-04 | GTC IT / AI Assistant | Added CPG-BIZ-098B source-field reconciliation result and updated the contract workspace next gate to CPG-BIZ-098C SQL draft correction before migration approval |
| 1.2 | 2026-06-04 | GTC IT / AI Assistant | Added CPG-BIZ-098A source-first prefill clarification for Contract Agreement Workspace and updated the next gate to SQL approval / migration decision |
| 1.1 | 2026-06-04 | GTC IT / AI Assistant | Marked CPG-BIZ-097 contract workspace SQL draft as prepared outside runtime migrations and updated the next gate to CPG-BIZ-098A approval review |
| 1.0 | 2026-06-03 | GTC IT / AI Assistant | Initial stage-to-standard mapping matrix |
