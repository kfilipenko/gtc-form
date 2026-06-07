# CrewPortGlobal - BP-012 Crew Formation Service Business Process Manual

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Business-process ID: BP-012
- Source task: CPG-BIZ-012 approved execution task, document 199
- Baseline: BP-001 through BP-011, CPG-DEMAND-017 through CPG-DEMAND-035
- Date: 2026-05-26
- Document type: Controlling business-process manual
- Status: Drafted for Project Owner review

## 1. Purpose

This manual defines the end-to-end CrewPortGlobal business process for helping shipowners, vessel operators, ship managers, crew managers and maritime employers form a vessel crew through a controlled digital workflow.

The process starts with employer-side demand and seafarer-side supply data. It ends with a documented service result, employer-side commercial basis and auditable evidence that GTC INFORMATION TECHNOLOGY FZ-LLC provided a B2B crew-formation support service.

This document is the controlling process baseline for future architecture and UI revision. It must be used before changing task cards, action buttons, handoffs, billing triggers or AI-agent instructions.

## 2. Standard And Audit Orientation

This manual follows a process-management style aligned with:

1. ISO-style process approach: inputs, activities, outputs, owners, risks, controls and performance evidence;
2. ISO-style documented information: process descriptions, process maps, records and evidence needed to support operations;
3. ISO-style audit thinking: traceability, competence, responsibility, objective evidence and audit trail;
4. maritime recruitment compliance boundaries: no recruitment or placement fee is charged to seafarers;
5. CrewPortGlobal internal controls: scoped visibility, human review, approval guards and no automatic employment decision.

External references checked for orientation:

```text
ISO 9001 process approach guidance:
https://www.iso.org/files/live/sites/isoorg/files/archive/pdf/en/iso9001_2015_process_approach.pdf

ISO quality management principles:
https://www.iso.org/quality-management/principles

ISO 19011 management-system audit guidance status:
https://www.iso.org/standard/88984.html
```

This manual is not a certification claim. Before using it for formal certification or regulatory submission, the current paid/official standards text and legal advice must be reviewed.

## 3. Business Objective

The business objective is:

```text
Provide employer-side maritime clients with verified, structured, human-reviewed crew-formation support and create an auditable basis for B2B service compensation to GTC INFORMATION TECHNOLOGY FZ-LLC.
```

The process must not become:

1. an automatic hiring decision;
2. an automatic seafarer placement decision;
3. a hidden seafarer recruitment fee;
4. an unrestricted database search for all team members;
5. an employer-facing publication process without approval guard.

## 4. Process Scope

### 4.1 In scope

The process covers:

1. agent-organization onboarding and authority verification where a third-party crewing organization works on the platform;
2. duplicate person/company/vessel checks before a new account or card receives operational access;
3. employer / shipowner demand intake;
4. company, representative and vessel context;
5. crew request / vacancy requirement structuring;
6. seafarer profile and document readiness;
7. request-supply comparison;
8. blocker review;
9. internal shortlist draft creation;
10. internal shortlist approval;
11. candidate presentation review;
12. controlled employer-facing presentation;
13. employer feedback and selection support;
14. contract, joining and embarkation support;
15. active voyage / monthly service evidence;
16. disembarkation and return / repatriation support;
17. service completion record;
18. billing / reward-basis handoff;
19. audit and retention.

### 4.2 Out of scope

This process does not authorize:

1. automatic employment decision;
2. automatic visa, flag-state or medical acceptance;
3. seafarer recruitment or placement fee;
4. payroll or employment-contract execution by the platform;
5. unrestricted medical/family/contact visibility;
6. public publication of candidates;
7. bypassing approval guards.

## 5. Core Records

The process is record-driven. Tasks are computed from records and their states.

| Record area | Existing / target source | Process role |
|---|---|---|
| Physical person / user | `users`, auth/session records | Identifies seafarer, employer representative, team member or Project Owner. |
| Agent organization context | future agent organization records, authority evidence and agency-agreement records | Defines a crewing agent as a responsible external or internal service participant with scoped authority over assigned objects. |
| Employer/company context | employer registration records and metadata | Defines B2B client and authority context. |
| Vessel context | vessel registration records and metadata | Defines vessel or vessel-type demand context. |
| Crew request / vacancy | `vacancy_requests`, `demand_workspace`, `demand_requirement_items` | Source of demand and matching requirements. |
| Seafarer profile | `seafarer_profiles`, structured seafarer workspace tables, metadata | Source of supply and readiness. |
| Documents | `uploaded_documents` and protected storage metadata | Evidence for identity, qualifications, company/vessel authority and corrections. |
| Candidate search result | Computed from current demand/supply data | Read-only comparison before shortlist. |
| Internal shortlist draft | `operator_shortlist_drafts`, `operator_shortlist_candidates` | Internal team object, not employer-visible. |
| Review application | vacancy application / review staging records | Human-review preparation before employer presentation. |
| Presentation decision | vacancy application / candidate presentation status | Controlled employer-facing step. |
| Employment / voyage support | future contract, embarkation, monthly work and return-support records | Evidence that selected seafarer joined, worked, disembarked and returned according to confirmed arrangements. |
| Audit event | `registration_audit_events` and future process audit records | Evidence of who did what, when and why. |
| Billing basis | future billing/service completion record | Commercial handoff after service output. |

## 6. Process Participants

| Participant | Business role | Main responsibility |
|---|---|---|
| Employer / shipowner client | Primary payer | Provides demand, vessel context, crew requirements and feedback. |
| Employer representative | Authorized user | Acts for the employer-side client within scoped authority. |
| Seafarer | Candidate / supply-side user | Provides profile, documents, preferences and consent where required. |
| Agent organization | Responsible crewing-service participant | Provides verified authority to work with assigned seafarers, shipowners, vessels and crew requests and accepts responsibility for the correctness of data entered under its agency authority. |
| Agent user | Employee or representative of an agent organization | Performs scoped operational tasks for assigned objects only and is audited under the agent organization context. |
| Platform Administration / Control | Platform governance | Verifies agent authority, controls agent access, handles duplicate/account claims, complaints, reassignment and platform-level feedback. |
| Group 0 Marketing | Lead source | Qualifies interest and routes relevant leads. |
| Group 1 Shipowners / Employers / Clients Registration | Demand intake | Structures employer, representative, vessel and crew-request data. |
| Group 2 Seafarer Registration And Development | Supply intake | Helps seafarers complete profile and readiness data. |
| Group 3 Payments, Sales And Revenue Distribution | Commercial control | Handles commercial proposal, entitlement, billing and revenue attribution. |
| Group 4 Client Support | Operational support | Handles support, communication and client/user blockers. |
| Group 5 Internal Control | Control and quality | Handles verification, review, compliance exceptions and audit support. |
| `review_team` / `reviewer` | Matching and candidate review | Reviews comparison, shortlist and candidate presentation workflow. |
| Project Owner | Governance and control | Reviews exceptions, access, deletion confirmations and process integrity. |
| AI agent | Assisted processing | Classifies, summarizes, checks completeness and drafts recommendations under human control. |

### 6.1 Agent As Independent Responsible Participant

CrewPortGlobal must distinguish the platform operator from the crewing agent function.

An `Agent` is an organization or approved participant that may perform crewing-service operations on the platform after providing evidence of authority. The agent may enter data for shipowners, vessels and seafarers only when it has a lawful or contractual basis to do so.

The standard rule is:

```text
agent organization + verified authority + assigned object scope + user permission = allowed agent operation
```

Agent authority evidence may include:

1. agency agreement with a shipowner / employer;
2. authorization to represent a vessel owner, vessel operator, ship manager or crew manager;
3. seafarer authorization or consent to maintain the seafarer's profile;
4. company registration and representative authority evidence;
5. platform service agreement accepting audit, data correctness and no-fee controls.

The agent is responsible for the correctness of data it enters or submits under its agency authority. This supports the platform model:

```text
CrewPortGlobal provides the controlled digital platform.
The authorized agent provides crewing-service activity and evidence for the objects assigned to it.
```

GTC-operated agents must not be treated as a privileged separate class. They must use the same `Agent` model and the same audit, assignment, correction and responsibility rules as external agents. New unassigned seafarers, shipowners or vessels may be routed by default to a GTC-operated agent group, but that default assignment is an operational routing rule, not ownership of the data.

Data entered by an agent remains platform-governed and object-owned by the relevant user or organization according to the card model. Agent reassignment must preserve:

1. the seafarer, shipowner and vessel data;
2. the historical audit trail;
3. prior correction and review evidence;
4. active contracts and service records;
5. the reason for reassignment.

Before creating a new person, company, vessel or seafarer profile from agent-entered data, the platform must run a duplicate / existing-record check. If a likely existing user or organization is found, the platform must notify the claimant through a controlled flow. The claimant may receive full access only after proving the right to the account or card.

## 7. Master Process Map

| Step | Stage | Primary result | Responsible group | Main computed task |
|---|---|---|---|---|
| CF-00A | Agent onboarding and authority verification | Agent organization is verified, rejected or limited | Platform Administration / Control | Review agent authority and service agreement |
| CF-00B | Duplicate / account claim check | Existing person, company, vessel or seafarer card is linked, claimed or blocked | Platform Administration / Control | Resolve duplicate or account claim |
| CF-01 | Lead / demand entry | Employer-side request exists | Group 0 or Group 1 | Qualify employer-side demand |
| CF-02 | Employer and authority setup | Client and representative context is reviewable | Group 1 / Group 5 | Review employer and authority data |
| CF-03 | Vessel context setup | Vessel or vessel-type context is structured | Group 1 / Group 5 | Review vessel context |
| CF-04 | Crew request structuring | Demand requirements are machine-readable | Group 1 / `review_team` | Review crew request completeness |
| CF-05 | Commercial entitlement check | B2B service scope or entitlement is clear | Group 3 | Confirm commercial basis |
| CF-06 | Seafarer supply intake | Candidate profile data is available | Group 2 | Review seafarer profile completeness |
| CF-07 | Document and readiness review | Candidate readiness status is known | Group 5 / `review_team` | Review required candidate evidence |
| CF-08 | Request-supply comparison | Match explanation and blockers are visible | `review_team` | Review request-supply comparison |
| CF-09 | Internal shortlist draft | Internal candidate set is stored | `review_team` | Create internal shortlist draft |
| CF-10 | Internal shortlist approval | Draft is internally approved or rejected | `review_team` / Group 5 | Approve internal shortlist |
| CF-11 | Candidate presentation review | Candidate presentation is reviewed | `review_team` / Group 5 | Review candidate presentation |
| CF-12 | Employer-facing presentation | Approved candidate summary is shared | Group 1 / `review_team` | Present candidate to employer |
| CF-13 | Employer feedback and outcome | Employer decision or follow-up is recorded | Group 1 / Group 4 | Record employer feedback |
| CF-13A | Structured terms clarification | Material seafarer/shipowner terms are agreed or blocked | Shipowner, seafarer, responsible team / Group 5 when needed | Clarify contract-relevant terms |
| CF-14 | Contract and embarkation support | Contract, joining and boarding evidence exist | Group 1 / Group 4 / Group 5 | Confirm contract and boarding evidence |
| CF-15 | Active voyage and monthly service evidence | Work-period evidence exists | Group 4 / Group 3 | Confirm monthly service evidence |
| CF-16 | Disembarkation and return support | Return / repatriation arrangement is known and completed | Group 4 / responsible manager | Confirm seafarer return arrangement |
| CF-17 | Service completion and billing | Service result and billing basis exist | Group 3 | Prepare billing / completion record |
| CF-18 | Retention and audit | Client follow-up and seafarer availability refresh are retained | Responsible manager / Group 2 / Group 5 | Schedule next contact or audit review |

### 7.1 Information Stream And Object-State Model

Crew formation tasks must be computed through the object stream first, and only then through the workflow stage.

The task engine, team workbench, future AI agents and future UI revisions must use this order:

```text
information stream
-> object type
-> current object state
-> business-process stage
-> agent assignment / object scope where applicable
-> computed operation
-> responsible group or historical active executor
-> visible task
-> allowed outcome
-> next state
```

This prevents a task list from becoming a generic set of buttons. Each stream has its own forms, records, readiness decision and handoff rule.

| Information stream | Primary object and forms | State signals used for task computation | Business-process stages | Main computed operations | Responsible groups | Final stream decision | Output to next process |
|---|---|---|---|---|---|---|---|
| Seafarer supply | Seafarer profile, source cards, protected documents, availability and consent data | `draft`, `submitted`, `correction_requested`, `pending_human_review`, `reviewed`, `match_ready`, `blocked`, missing consent or unresolved required source-card correction | CF-06 Seafarer supply intake; CF-07 Document and readiness review; CF-08 Request-supply comparison | Complete profile; correct source card; review seafarer profile completeness; review candidate evidence; review candidate readiness blockers | Group 2 for completion support; `verification_team` / Group 5 for readiness and documents; `review_team` for matching review | Candidate supply is match-ready, needs correction, blocked or unavailable | Safe candidate summary and readiness/blocker state for request-supply comparison; restricted data remains scoped |
| Employer / shipowner demand account | Employer/company profile, representative authority, client relationship, commercial context | `draft`, `submitted`, authority evidence missing, `under_review`, `verified`, `needs_correction`, `rejected`, commercial entitlement pending | CF-01 Lead / demand entry; CF-02 Employer and authority setup; CF-05 Commercial entitlement check; CF-13 Feedback; CF-14 Billing handoff | Qualify employer-side demand; review employer and authority data; request authority correction; confirm commercial basis; record feedback; prepare billing handoff | Group 1 for client/demand intake; Group 5 for control and authority review; Group 3 for commercial/billing; Group 4 for support | Employer-side client is authorized for B2B service handling, returned for correction, paused or closed | Authorized demand-side client context, scoped employer visibility and billing/service boundary |
| Vessel context | Vessel profile, vessel type, flag, operational context, vessel evidence documents | vessel missing, partial vessel data, `submitted`, `under_review`, `verified`, `needs_correction`, `blocked`, vessel type/category mismatch | CF-03 Vessel context setup; CF-04 Crew request structuring | Review vessel context; request vessel data correction; confirm vessel type/category readiness for demand; link vessel to crew request | Group 1 for vessel context collection; Group 5 for verification/control; `review_team` for matching relevance | Vessel context is structured enough for crew request and matching, needs correction or is blocked | Vessel characteristics available for demand requirements, matching filters and risk/control review |
| Crew request / vacancy requirement | Crew request, vacancy request, demand workspace, structured requirement rows | `draft`, `submitted`, incomplete requirement, structured, `match_ready`, comparison ready, hard blockers, pending deletion, closed | CF-04 Crew request structuring; CF-08 Request-supply comparison; CF-09 Internal shortlist draft; CF-10 Internal approval; CF-11/CF-12 Candidate presentation | Review crew request completeness; review request-supply comparison; create internal shortlist draft; approve internal shortlist; create/review candidate presentation; confirm or reject deletion | Group 1 for intake; `review_team` for matching and shortlist; Group 5/control for exceptions; Project Owner/owners for deletion confirmation | Demand is match-ready, blocked, internally shortlisted, presentation-ready, closed or deleted by controlled approval | Human-reviewed shortlist or presentation workflow; no employer-facing candidate data until guard passes |
| Agent authority / assignment | Agent organization, agent users, agency agreement, assigned object scope, duplicate/account claim records | `draft`, `submitted`, authority evidence missing, `under_review`, `verified`, `limited`, `suspended`, `reassigned`, duplicate risk, account claim pending | CF-00A Agent onboarding; CF-00B Duplicate / account claim; all later object-specific stages where an agent owns the operational task | Review agent authority; approve/limit/suspend agent; assign object to agent; reassign object; resolve duplicate/account claim; notify existing user or organization | Platform Administration / Control for approval and reassignment; assigned agent group for ordinary scoped operations | Agent is authorized for defined object scope, blocked, suspended or replaced | Scoped agent task visibility and responsibility for data entered under agency authority |

The first three streams are the foundation:

1. seafarer supply must be structured before candidate comparison;
2. employer / shipowner demand account must be authorized before employer-facing operations;
3. vessel context must be structured before crew request matching is reliable.

The crew request / vacancy requirement stream connects the foundation streams into the matching process. It must not be treated as a standalone vacancy without employer and vessel context.

### 7.2 Functional Team Work Split

| Function | Primary streams | Typical responsibility | Typical handoff |
|---|---|---|---|
| Seafarer data completion | Seafarer supply | Help the seafarer complete profile, source cards, documents and availability without charging recruitment or placement fees | To `verification_team` / Group 5 for readiness review |
| Employer and vessel intake | Employer / shipowner demand account; vessel context | Collect and structure company, representative, vessel and demand information | To Group 5 for authority/control review or to `review_team` for matching |
| Verification and internal control | All streams where authority, readiness, correction or restricted data boundary matters | Verify evidence, record outcomes, create correction handoff and preserve audit evidence | To owner/responsible party for correction or to next internal process stage |
| Matching and shortlist review | Crew request / vacancy requirement; seafarer supply | Compare structured demand with safe candidate summaries, explain blockers and create internal shortlist drafts | To internal shortlist approval and candidate presentation review |
| Commercial and billing control | Employer / shipowner demand account; service completion | Confirm B2B service basis, billing handoff and no-fee seafarer boundary | To billing/service completion records |

## 8. Detailed Process Control Table

| Step | Trigger | Inputs | DB records read | DB records created/updated | Audit evidence | Output | Next computed task |
|---|---|---|---|---|---|---|---|
| CF-00A Agent onboarding and authority verification | External or GTC-operated crewing participant requests agent status | Agent company data, representative identity, agency agreement / authority evidence, service agreement acceptance | users, company records, access groups, uploaded documents, duplicate signals | future agent organization / agent-user records, authority status, access scope | agent authority review / approval / rejection event | Agent organization is verified, limited, suspended or rejected | Assign agent scope or request authority correction |
| CF-00B Duplicate / account claim check | A person, company, vessel or seafarer profile is entered by a user or agent and similar records exist | Claimed identity, contact, documents, company registration, vessel identifiers, seafarer documents | users, employer companies, vessels, seafarer profiles, uploaded documents, audit events | account-claim or duplicate-resolution status; link/reject/merge decision when approved | duplicate check / claim notification / claim resolution event | Existing record is linked to rightful claimant, new record proceeds, or claim is blocked | Continue registration, assign object scope, or request evidence |
| CF-01 Lead / demand entry | Employer-side inquiry, imported request or direct form | Client contact, requested role, vessel hints | users, employer drafts, imported request data | employer/vacancy draft or lead metadata | lead captured / source event | Demand lead exists | Qualify employer-side demand |
| CF-02 Employer and authority setup | Demand lead is relevant | Company data, representative details, authority evidence | employer/company records, uploaded documents | company context, representative authority status | employer authority review event | Employer can be handled as B2B client or returned for correction | Review vessel context or request correction |
| CF-03 Vessel context setup | Vessel-linked request exists | Vessel name/type/flag, vessel specs, operation context | vessels, reference catalogs, uploaded documents | vessel context, vessel verification status | vessel context review event | Vessel context is structured enough for demand | Review crew request completeness |
| CF-04 Crew request structuring | Employer request is submitted/imported | Rank, department, vessel type, join date, duration, salary, certificates, training, visa/language/sea-service requirements | vacancy request, `demand_requirement_items`, reference catalogs | normalized demand workspace and requirement rows | demand structuring event | Crew request is match-ready or has blockers | Confirm commercial basis or compare request-supply |
| CF-05 Commercial entitlement check | Service workflow is active or employer requests candidate processing | Service scope, payer, terms, entitlement | employer context, service/payment metadata | commercial status / entitlement metadata | commercial approval or pending event | Work may proceed, pause or require billing action | Continue matching or prepare billing/support task |
| CF-06 Seafarer supply intake | Seafarer registers or imported profile exists | Identity, rank, certificates, availability, preferences, documents | seafarer profile, source cards, reference catalogs | profile/workspace records, consent events where available | profile intake event | Candidate supply exists | Review profile completeness |
| CF-07 Document and readiness review | Profile has documents or correction tasks | Uploaded documents, source cards, readiness data | uploaded documents, seafarer workspace, review states | review status, correction tasks, readiness flags | document/profile review event | Candidate is ready, blocked or needs correction | Compare request-supply or request correction |
| CF-08 Request-supply comparison | Crew request and supply are structured | Demand requirements, candidate summaries | vacancy request, demand requirements, seafarer summaries | No side effect; computed result only | optional comparison-view audit if required | Match explanation and blockers | Create internal shortlist draft if candidates are eligible |
| CF-08A Seafarer job-search counter-flow | Seafarer opens job search from a matching-ready profile | Seafarer rank, department, availability, vessel preferences, salary expectation and published verified vacancies | seafarer profile, vacancy requests, employer/company status, vessel context, existing vacancy applications | `vacancy_applications` only when the seafarer requests contract consideration; otherwise no side effect | vacancy application submitted event / matching request evidence | Seafarer request is recorded or blocked with visible reason | Compute shipowner incoming-request task and review-team `Review incoming seafarer request` task before employer candidate decision or contract proposal workflow |
| CF-09 Internal shortlist draft | Operator chooses candidate set from comparison/search | Candidate-search result and guard data | vacancy request, candidate-search result, consent/source-card state | `operator_shortlist_drafts`, `operator_shortlist_candidates` | `operator_shortlist_draft_created` | Internal draft exists, employer-visible false | Approve internal shortlist |
| CF-10 Internal shortlist approval | Internal draft is ready | Draft candidates, current guard result | shortlist draft/candidates, current candidate-search result | draft status `approved_internal` or `rejected`, approval guard snapshot | `operator_shortlist_internal_approval_recorded` | Approved or rejected internal draft | Create candidate presentation review or reopen/correct |
| CF-11 Candidate presentation review | Internal shortlist approved | Included candidates, allow/deny payload checks | shortlist draft, candidate snapshots, consent/correction status | review application / candidate presentation staging | review-application bridge or presentation review event | Human review exists or presentation blocked | Present candidate to employer if guard passes |
| CF-12 Employer-facing presentation | Human review approves employer-visible summary | Data-minimized candidate summary, employer request | vacancy application, employer-facing payload rules | candidate status / presented state where approved | candidate presentation event | Employer receives approved summary | Record employer feedback |
| CF-13 Employer feedback and outcome | Employer responds or follow-up date arrives | Feedback, interview interest, rejection, request changes | employer request, presented candidates, notes | feedback status, follow-up task, outcome metadata | employer feedback event | Outcome known or follow-up scheduled | Service completion, further shortlist, or support task |
| CF-13A Structured terms clarification | Shipowner proceeds with candidate, seafarer requests contract consideration, or material term mismatch is detected | Candidate selection, vacancy terms, seafarer preferences, vessel context, document readiness, travel/return terms | seafarer profile, vacancy request, vessel context, candidate-selection/application record, review outcomes | terms clarification workspace or agreed terms sheet when implemented; no contract side effects before guard | term proposal / acceptance / rejection / team-review event | Material terms are agreed, blocked or closed without agreement | Prepare contract workspace only when all material terms are agreed and guards pass |
| CF-14 Contract and embarkation support | Employer proceeds with candidate or contract is uploaded | Contract, joining date/place, vessel, position, travel responsibility, boarding evidence | employer request, selected candidate, uploaded documents, vessel context | employment/voyage support status, boarding evidence, seafarer availability status | contract verified / embarkation confirmed event | Seafarer is pending embarkation, onboard active, blocked or replacement-required | Confirm monthly service evidence or resolve joining blocker |
| CF-15 Active voyage and monthly service evidence | Seafarer is onboard active during a billing period | Work period, continued onboard status, illness/early-disembarkation signals | employment/voyage support record, employer notes, support evidence | monthly service evidence and billing-period status | monthly service confirmed event | Actual worked-period basis exists or exception/replacement is needed | Prepare invoice basis or return/replacement task |
| CF-16 Disembarkation and return support | Contract end approaches, early disembarkation is signaled or disembarkation is confirmed | Disembarkation date/reason, return destination, payer/responsible party, travel support notes | contract/voyage record, employer instructions, seafarer profile | return support status, availability refresh trigger, replacement signal if needed | disembarkation / return support event | Seafarer returned or return/support exception is visible | Update availability, close service, replace or escalate |
| CF-17 Service completion and billing | Service output meets commercial rule | Completed presentation/support result, embarkation/monthly/return evidence where relevant, commercial terms | employer/client records, service metadata, outcome | service completion / billing basis record | billing handoff event | GTC service-fee basis exists | Prepare invoice/reward attribution |
| CF-18 Retention and audit | Service cycle closes | Client history, seafarer return status, next availability, outcome, future needs | client cards, seafarer profile, audit events, billing records | next-contact date, retention stage, audit notes | closure/retention event | Client and seafarer are retained and evidence is preserved | Future contact or audit task |

## 9. Computed Task Principle

Tasks are not the source of truth. Tasks are visible work items derived from the current records.

The rule is:

```text
previous stage result + current object state + role/permission + agent/object scope + assignment relationship = visible next task
```

Required conditions:

1. a task must have a business object;
2. a task must have one primary operation;
3. the task must be linked to the working object;
4. the executor must have the required permission;
5. the task must be visible to the responsible group;
6. if a responsible employee is assigned, the task must be visible in that employee's `My tasks`;
7. if no employee is assigned, the task may be visible in the group queue;
8. completed or blocked tasks must disappear, change status or show blockers based on current data;
9. the task must not be manually kept alive after the underlying state is resolved.

### 9.1 Standard Form Save And Completeness Gate

Every authenticated questionnaire and workspace form must follow the same save-and-submit standard before the object can be sent to operator review.

The controlling implementation standard for this rule is:

```text
docs/crewportglobal/business_processes/14_standard_form_lifecycle_and_validation_module.md
```

That standard must be used when a new form is created or an existing form is refactored. A page-specific form may map its own HTML fields to canonical field codes, but it must not create separate lifecycle rules for role context, save, completeness, protected upload, submit-review or computed task creation.

This standard applies to:

1. seafarer profile / source-card forms;
2. employer / company authority forms;
3. vessel context forms;
4. crew request / vacancy requirement forms;
5. document upload sections attached to those forms.

The standard rule is:

```text
Save
-> completeness and document-readability analysis
-> either enable Submit to operator review
   or show a numbered completion/correction task
```

The visible save model must be simple for the user:

```text
field-level autosave may store draft values while editing;
one visible Save / confirm data action runs the completeness check.
```

The `Save / confirm data` action must remain available to the owner while editing an allowed draft or correction. Saving stores the current draft and runs automated checks, but it does not by itself send the object to operator review.

The `Submit to operator review` action may become active only when:

1. all required fields for the current form type are present;
2. required documents are uploaded;
3. uploaded documents use allowed formats;
4. uploaded documents pass protected storage / scan checks where applicable;
5. uploaded documents are readable enough for review;
6. required reference-catalog fields use valid structured values;
7. no unresolved owner correction remains for the same form object.

If the form is incomplete, the system must not show an executable operator-submission action. Instead it must show an owner task listing the exact numbered sections and required points to complete.

Document upload controls are part of the same gate. Every form with a protected upload section must display the allowed file types and current maximum file size before upload. The frontend, backend API and runtime web/PHP limits must be aligned so that a file accepted by the published rule can reach application validation. If a file is rejected, the user must see a specific reason such as unsupported type, empty file, size limit, total draft limit, partial upload, malware scan failure or server request-size limit. A generic upload failure is not sufficient for ordinary user guidance.

Approved owner task format:

```text
Complete questionnaire sections. (Form: {object type and safe summary}; Sections: {section numbers}.)
```

Examples:

| Form object | Incomplete condition | Owner task |
|---|---|---|
| Seafarer profile | Missing certificate, availability or required document | `Complete questionnaire sections. (Seafarer profile: Able Seaman; Sections: 2.1, 4.3, 7.2.)` |
| Employer / company | Missing authority evidence or company registration details | `Complete questionnaire sections. (Employer authority: ABC Shipping; Sections: 1.2, 1.4.)` |
| Vessel context | Missing vessel type, flag or operational area | `Complete questionnaire sections. (Vessel profile: Bulk Carrier; Sections: 2.1, 2.3.)` |
| Crew request | Missing rank, joining date, contract terms or mandatory certificates | `Complete questionnaire sections. (Crew request: Chief Officer; Sections: 3.1, 3.4, 4.2.)` |

All questionnaire sections must have stable numbering. The number must be visible in the form and must be stored or derivable in the field dictionary / form schema so that tasks, audit notes and future AI checks can refer to the same section without repeating long text.

Numbering standard:

| Level | Example | Meaning |
|---|---|---|
| Form stream | `S` / `E` / `V` / `R` | Seafarer, Employer, Vessel, Request. |
| Section number | `S-2` or `2` | Stable questionnaire section. |
| Field point | `S-2.3` or `2.3` | Specific required item inside the section. |
| Document point | `S-7.D1` or `7.D1` | Required document attached to the section. |

Future implementation may choose the exact prefix style, but the same number must be used consistently in:

1. form UI;
2. completeness output;
3. owner cabinet tasks;
4. operator correction requests;
5. audit events;
6. AI-agent prompts and validation results.

Mandatory-field rules must also be synchronized across supply and demand. If a field is mandatory on the crew-request / vessel side because it is used for matching, the corresponding seafarer-side field must also be mandatory before the seafarer profile can become matching-ready. If a seafarer-side field is mandatory for matching readiness, the corresponding demand-side field must be mandatory where that demand object uses the same matching dimension.

Examples:

| Matching dimension | Seafarer-side required field | Demand/vessel/request required field |
|---|---|---|
| Rank | Primary rank | Requested rank / vacancy title |
| Department | Department | Requested department |
| Vessel type | Preferred vessel types and/or sea-service vessel type | Vessel type |
| Timing | Availability status/date | Joining date |
| Salary | Salary expectation | Salary min/max/currency |
| COC / certificates | COC type, expiry and document | COC requirement |
| Education | Education grade/specialisation when required | Education requirement when stated |
| Training | Training courses/certificates when required | Training requirement when stated |

The backend completeness schema must be the source of truth for these mandatory flags. HTML `required` attributes and frontend markers must be generated from, or kept aligned with, that schema.

This control reduces manual operator work. Operators should receive review tasks only after the owner has completed the minimum required data and documents for the current form object.

## 10. Standard Task Display Contract

Every task card should show one primary task.

Recommended format:

```text
{Stage action}. ({Object type}: {safe object summary}.)
```

Examples:

| Process state | Task title |
|---|---|
| Demand submitted but not structured | `Review crew request completeness. (Crew request: Chief Officer for Bulk Carrier, join date 2026-08-15.)` |
| Request-supply comparison ready | `Review request-supply comparison. (Crew request: Second Engineer for Container Vessel.)` |
| Seafarer profile has matching published vacancies | `Find matching vacancies. (Seafarer profile: 4th Engineer, available now.)` |
| Internal draft ready | `Approve internal shortlist. (Crew request: Chief Officer, 3 included candidates.)` |
| Candidate presentation review ready | `Approve candidate for employer presentation. (Candidate: Able Seaman, documents ready.)` |
| Deletion pending | `Confirm deletion request. (Crew request: Chief Officer for Bulk Carrier, requested by reviewer.)` |

The active link must open the internal working object, not a public external view.

Ambiguous action labels must be replaced:

| Ambiguous label | Approved direction |
|---|---|
| `Open item` | `Open internal work item` or `Open review workspace` |
| `Start review` | Show only when the current task is to start review |
| `Needs correction` | Review outcome inside the workspace |
| `Mark reviewed` | Review outcome inside the workspace |
| `Request deletion` | Secondary controlled action requiring manager confirmation |

## 11. Assignment And Visibility

Task visibility must respect both group responsibility and computed individual assignment.

The verified assignment rule is:

```text
previous stage result
+ current object state
+ agent organization / object scope where applicable
+ responsible group/permission
+ active historical executor for the same object and group
= visible task for person or group queue
```

| Case | Visibility rule |
|---|---|
| An active employee in the responsible group previously completed an analogous task for the same object | Show the new task as assigned to that employee. |
| No active historical executor exists for that object and group | Show the task in the responsible group queue. |
| First group member completes a group-queue task | Their audit event becomes the historical assignment source for later tasks on the same object and group. |
| Historical employee is inactive, blocked or no longer an active member of the responsible group | Do not assign personally; return the task to the responsible group queue. |
| Review/control exception exists | Show task to authorized control role or Project Owner according to the operation's access contract. |
| User only has broad unrelated group membership | Do not show unrelated client task if a narrower assignment and access boundary applies. |
| Object is assigned to an agent organization | Show ordinary operational tasks only to users in that agent organization with the required permission, plus Platform Administration / Control where oversight is required. |
| Agent organization is suspended, authority expired or reassigned away from the object | Remove ordinary agent visibility and route the next task to Platform Administration / Control or the newly assigned agent scope. |
| Existing user/card claim is pending | Do not create full duplicate access; show claim-resolution task to Platform Administration / Control and a limited owner-confirmation task to the claimant where appropriate. |

The current implementation uses existing audit evidence rather than a separate assignment table.

Runtime assignment source:

```text
registration_audit_events.event_payload.actor_context.actor_user_id
registration_audit_events.event_payload.actor_context.target_group_code
registration_audit_events.event_payload object identifiers
users.is_active
access_group_members.membership_state = active
```

Verified behavior:

1. `/api/v1/team/workbench/tasks` returns `task_model = data_derived_current_state`.
2. `/api/v1/team/workbench/tasks` returns `task_assignment_model = historical_active_executor_or_group_queue`.
3. `/api/v1/team/workbench/tasks` returns `persisted_task_table_created = false`.
4. `/team/` task cards show `Assigned employee: group queue` when no historical active executor exists.
5. `/team/` task cards show the named employee when the same active group member previously completed an operation for the same object.
6. Tasks remain filtered by group and permission.

This is a computed assignment model. It does not create a manual assignment record and does not authorize bypassing manager-controlled reassignment rules that may be added later.

## 12. Approval Gates

| Gate | Required before passing | May not be bypassed |
|---|---|---|
| Employer authority gate | Company/representative context is sufficient | Candidate data must not be shared with unauthorized requester. |
| Demand structuring gate | Crew request has structured rank/vessel/timing/core requirements | Shortlist must not be built on vague demand. |
| Candidate readiness gate | Profile, documents and source-card corrections are acceptable | Candidate must not be presented from incomplete or restricted data. |
| Internal shortlist guard | Included candidates pass search, consent and correction checks | Employer visibility remains false. |
| Internal approval gate | Reviewer approves internal draft | Review application must not be created from unapproved draft. |
| Employer-presentation guard | Candidate summary is allow-listed and human-reviewed | Restricted fields must not enter employer payload. |
| Billing/service completion gate | Service output and commercial basis are confirmed | Billing must not be triggered by incomplete or prohibited service. |

## 13. Revenue And Billing Boundary

The B2B payer is the employer-side client, such as:

```text
shipowner
vessel operator
ship manager
crew manager
maritime employer
approved business client
```

The service-fee basis may arise only from an approved B2B service event, such as:

1. crew request processing;
2. candidate search and verified shortlist support;
3. candidate presentation support;
4. document/readiness review support;
5. workflow support agreed with the employer-side client.

The billing handoff must record:

1. payer/client context;
2. service scope;
3. service output;
4. responsible manager;
5. relevant request/candidate references;
6. billing authorization status;
7. audit evidence;
8. no-fee seafarer boundary confirmation.

Seafarers must not be charged recruitment or placement fees.

## 13.1 Contract, Embarkation, Voyage And Return Support Boundary

The service result for crew formation may include a longer operational support chain than candidate presentation.

When the employer proceeds with a candidate, the process must create or expect a controlled employment/voyage support record covering:

1. selected seafarer;
2. employer / shipowner client;
3. vessel;
4. rank / position;
5. contract or employment-support document;
6. joining date and place;
7. travel / joining responsibility;
8. expected contract duration or end date;
9. disembarkation / repatriation responsibility;
10. agreed return destination or return-support instruction;
11. evidence required for monthly work-period confirmation;
12. replacement or early termination rule.

These conditions should not first appear after the employer accepts a candidate. The process should collect preliminary contract terms during demand and supply preparation.

Employer / crew-request forms should collect:

1. joining place and joining travel responsibility;
2. expected contract duration;
3. disembarkation / repatriation responsibility;
4. return destination rule or acceptable return point;
5. replacement / early termination rule;
6. monthly service evidence requirement;
7. fields that are still `to_be_agreed`.

Seafarer profile forms should collect:

1. preferred joining / travel conditions where relevant;
2. return destination;
3. preferred return arrangement;
4. whether self-arranged travel is acceptable;
5. whether employer-arranged travel is required or preferred;
6. fields that are still `to_be_agreed`.

The `to_be_agreed` value is allowed before contract formation. It is not a final contract condition. Before a portal-generated contract or final contract confirmation, these fields must be resolved or explicitly approved as a controlled exception.

The future contract workflow should be generated from structured platform data:

```text
verified employer + verified vessel + structured vacancy/request + selected seafarer + agreed terms = contract draft
```

This gives both parties a transparent view of what work, voyage, travel and return conditions are being accepted.

The contract must be based on an approved public master agreement. The master agreement contains fixed immutable clauses and approved variable fields. Employees may select approved catalog values, fill verified party/vessel/seafarer data and prepare a contract instance, but they must not rewrite legal clauses for each case.

Legal review is required for the master agreement version, fixed clause amendments and legally material catalog changes. It is not required as a new drafting exercise for every ordinary contract instance generated from approved clauses and selected variables, unless a vessel flag, CBA, mandatory law requirement, party exception or dispute is outside the approved template.

The platform baseline should follow internationally recognized maritime labor standards, including MLC-aligned seafarer employment agreement controls. This does not permit the platform to ignore mandatory flag-state law, applicable CBA requirements or other mandatory protections where they apply. If mandatory rules require a different or additional clause, the template must support it through an approved version or controlled exception.

The standard contract preparation sequence is:

```text
verified data + Contract Agreement Workspace with embedded condition fields + party approval/signature = scripted contract generation
```

The parties approve the populated Contract Agreement Workspace first. The workspace must show the full agreement text and the embedded condition fields inside the clauses they affect. After required approval/signature, the system script generates the contract from the approved master template, verified seafarer data, verified shipowner/employer data, verified vessel data and the approved workspace values. This prevents manual wording changes, protects approved conditions and creates evidence of what both parties accepted in legal context.

The contract-generation stage should have its own statuses:

```text
draft_from_platform_data
party_review
terms_to_be_agreed
ready_for_signature
signed_pending_embarkation
active_onboard
completed
terminated_early
cancelled
disputed
```

The agent may prepare the draft contract by selecting approved catalog values. The agent must not finalize a contract, resolve material terms without party confirmation, change fixed clauses or bypass required human authority.

The computed seafarer lifecycle must distinguish:

```text
selected_for_contract
employment_pending_embarkation
onboard_active
return_preparation_due
return_in_progress
returned_available_update_due
```

The team must not wait until the seafarer disappears from the vessel to ask how the return will be handled. Before expected contract completion, the responsible employee or group must have a computed task:

```text
Confirm seafarer return arrangement.
(Voyage: {rank} on {safe vessel summary}; expected completion {date}.)
```

The return arrangement may be:

1. independently arranged by the seafarer;
2. arranged and paid by the employer / shipowner;
3. arranged by CrewPortGlobal as an approved additional B2B support service;
4. blocked or disputed, requiring escalation.

After return completion, the seafarer must receive a new computed task to update availability and next-voyage preference. This is part of client care and retention, not a paid recruitment service charged to the seafarer.

## 14. AI-Agent Boundary

AI agents may:

1. detect missing fields;
2. compare demand and supply;
3. summarize blockers;
4. draft task titles;
5. prepare candidate comparison notes;
6. propose next actions;
7. prepare audit summaries;
8. flag inconsistent records.

AI agents must not independently:

1. approve candidate presentation;
2. reject or accept a candidate;
3. confirm employer authority;
4. confirm deletion;
5. approve billing;
6. make employment decisions;
7. override approval guards;
8. expose restricted fields.

AI output must be treated as assistant work product until a human with proper permission approves the material operation.

## 15. Process Performance And Control Indicators

Recommended indicators:

| Indicator | Purpose |
|---|---|
| Demand completeness rate | Measures whether crew requests are structured enough for matching. |
| Candidate readiness rate | Measures supply-side profile/document readiness. |
| Matching blocker distribution | Shows why candidates are blocked before shortlist. |
| Internal shortlist approval cycle time | Measures team review efficiency. |
| Employer presentation conversion | Measures how often approved internal drafts reach employer-visible presentation. |
| Correction cycle count | Measures repeated data/document quality issues. |
| Billing handoff completeness | Measures whether service outputs are commercially traceable. |
| Audit-event completeness | Measures evidence quality for material operations. |

## 16. Controlled UI Implication

Future UI must follow this manual:

1. show one primary computed task per row/card;
2. move secondary actions into the internal workspace or contextual menu;
3. explain blockers where the primary task cannot be executed;
4. show the responsible group and required permission;
5. show assignment to the current specialist when applicable;
6. make action labels clear to non-technical users;
7. keep public/external view separate from internal review workspace.

## 17. Process Description And Application Verification Cycle

CrewPortGlobal process documentation must be prepared and validated through a controlled cycle.

The required cycle is:

```text
1. Describe the process stage.
2. Verify whether the described stage is executable in the current application.
3. If the application does not match the process, make the minimum necessary correction.
4. Test the corrected behavior.
5. If tests confirm compliance, move to the next process stage.
6. If compliance is not confirmed, repeat verification, correction and testing before moving on.
```

This cycle is mandatory because business-process documentation is not only a written description. It is also a control method for proving that the application can execute the described process.

For every implementation or UI-correction slice based on this manual, the implementation report must record:

1. process stage described;
2. application surface checked;
3. mismatch found, if any;
4. correction made, if any;
5. tests executed;
6. result of compliance check;
7. next planned stage or confirmation that the stage is complete.

Computed task links are part of this verification. A visible task is compliant only if its active title/description link opens the exact internal working object with the executable operation or controlled blocker state.

Sending the user to a general list without opening the target object is not compliant with this manual.

## 18. Verified Role-Based Task Execution Matrix

The following task execution controls have been verified against the running application.

| Process stage | Computed operation | Responsible group | Required permission | Verified application behavior |
|---|---|---|---|---|
| CF-09 Request-supply matching and shortlist preparation | `create_internal_shortlist_draft` | `review_team` | `view_review_queue` | Review-team user sees the task, opens the concrete comparison workspace and creates an internal-only shortlist draft. |
| CF-10 Internal shortlist approval | `approve_internal_shortlist` | `review_team` | `approve_candidate_presentation` | Review-team user sees the task, opens the concrete draft approval panel and approves the internal draft without employer visibility. |
| CF-11 Candidate presentation review preparation | `create_review_applications` | `review_team` | `start_human_review` | Review-team user sees the task after internal approval and creates review applications from the concrete shortlist draft. |
| CF-11 / CF-12 Employer-facing candidate presentation review | `review_candidate_presentation` | `review_team` | `approve_candidate_presentation` | Review-team user opens the concrete vacancy application and performs human presentation review. |
| CF-08A Incoming seafarer request review | `review_candidate_presentation` with `request_source=seafarer_initiated_request` | `review_team`; seafarer owner after correction/rejection | `approve_candidate_presentation` / structured correction-rejection reason; owner cabinet access | Review-team user opens the concrete vacancy application, sees it as `Review incoming seafarer request`, then releases it to presented-candidate workflow, requests correction with a structured reason or rejects it with a structured reason; shipowner incoming-request visibility is recomputed after completion without exposing internal rationale, and the seafarer cabinet shows the concrete correction/review task from the latest reason code. |
| CF-02 / CF-03 Employer authority and vessel context review | `review_company_verification` | `verification_team` | `view_verification_queue` | Verification-team user opens the concrete company workspace, sees employer, vessel and linked vacancy context, records review outcome and audit actor context, and does not receive restricted seafarer supply values. |
| CF-04 / CF-08 Crew request and request-supply preparation | `vacancy_request` workspace / candidate search | `review_team` | `view_review_queue` | Review-team user opens the concrete vacancy workspace, sees structured demand and vessel context, runs candidate-search preparation, and does not see candidate contact fields or broad `document_metadata`. |
| CF-08A Seafarer job-search counter-flow | `find_matching_vacancies` / request contract consideration | Seafarer owner, shipowner owner, review team, then existing employer flow | owner cabinet/profile access; `approve_candidate_presentation` for release to presentation; structured correction/rejection reason when review does not release; later employer candidate access | Seafarer sees matching published verified vacancies from the saved profile and may request contract consideration for an eligible vacancy. The request records a controlled `vacancy_applications` row, computes a visible shipowner incoming-request task and a review-team incoming-request task, and still cannot bypass team review, shortlist, presentation or contract guards. If review returns correction/rejection, the same application state and audit reason recompute a seafarer-owner task with the exact profile/document section link. |
| CF-06 / CF-07 Seafarer supply intake and readiness review | `review_seafarer_profile_completeness` | `verification_team` | `start_human_review` / verification queue access | Verification-team user opens the concrete seafarer profile workspace, records review outcome and sees only safe profile/readiness summaries; restricted family, medical, identity and reference-contact values remain hidden. |
| CF-07 Correction owner handoff after `needs_correction` | Owner correction task and re-review recomputation | Seafarer owner, then `verification_team` | owner workspace access, then `view_verification_queue` | After reviewer records `needs_correction`, the active team task disappears, cabinet shows the exact source-card correction task, owner resubmission clears the cabinet task and the review task reappears for the responsible group or historical active executor. |
| CF-02 / CF-04 Demand-side correction owner handoff after `needs_correction` | Employer / crew-request correction task and re-review recomputation | Employer owner, then `verification_team` or `review_team` | owner `/post-vacancy/` access, then `view_verification_queue` or `view_review_queue` | After company or vacancy reviewer records `needs_correction`, the active team task disappears, cabinet shows a clear demand-side correction task, owner resubmission clears the cabinet task and the next team task reappears for the responsible group or historical active executor. |
| Internal review workspace service controls | Review outcome and secondary action disclosure | all internal review groups | current operation permission; service debug mode for raw payload | Normal users see object context and computed operation first; raw/debug payload is hidden in normal mode; review outcomes and deletion requests remain inside secondary disclosure. |
| Internal review workspace task guidance | Current task / completion condition | all internal review groups | current operation permission | Workspace shows the primary operation, business-process stage, working object, visibility reason and completion condition before secondary actions. |
| Internal review workspace completion feedback | Post-action result and task transition explanation | all internal review groups | current operation permission | After a review outcome or card review is recorded, workspace feedback names the operation, object, result and recomputation rule; deletion requests name the manager-confirmation next task. |
| Team queue recomputation after outcome | Active task disappearance or control/blocked state | all internal review groups | current operation permission | After company `reviewed` and seafarer `needs_correction` outcomes, the same active workbench task no longer appears for the same group; the object may remain accessible only as a control/correction context with a clear reason. |
| CF-07 Restricted medical boundary | `restricted_medical_access_denied` | future restricted medical capability | future dedicated medical permission | General operator access to restricted medical details is blocked with `403 restricted_medical_capability_required` and an audit event. |
| Control exception - deletion confirmation | `confirm_vacancy_deletion` / `reject_vacancy_deletion` | `owners` | `approve_access_policy_change` | Owner/control user sees and executes the manager confirmation panel. Review-team user does not receive the task and direct endpoint access is denied. |

This verified matrix is part of the business process. A future UI or backend change must not weaken these group and permission boundaries.

## 19. Next Stage

The companion operating instruction must be maintained in:

```text
docs/crewportglobal/business_processes/13_crew_formation_operating_instructions_for_users_team_ai.md
```

The standard form lifecycle module must be maintained in:

```text
docs/crewportglobal/business_processes/14_standard_form_lifecycle_and_validation_module.md
```

The next implementation-planning stage should extract the already verified `/create-profile/` save/completeness behavior into a shared frontend lifecycle helper before the same standard is applied to `/post-vacancy/`.
