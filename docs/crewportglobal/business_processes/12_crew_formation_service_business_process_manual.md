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

1. employer / shipowner demand intake;
2. company, representative and vessel context;
3. crew request / vacancy requirement structuring;
4. seafarer profile and document readiness;
5. request-supply comparison;
6. blocker review;
7. internal shortlist draft creation;
8. internal shortlist approval;
9. candidate presentation review;
10. controlled employer-facing presentation;
11. employer feedback and selection support;
12. service completion record;
13. billing / reward-basis handoff;
14. audit and retention.

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
| Employer/company context | employer registration records and metadata | Defines B2B client and authority context. |
| Vessel context | vessel registration records and metadata | Defines vessel or vessel-type demand context. |
| Crew request / vacancy | `vacancy_requests`, `demand_workspace`, `demand_requirement_items` | Source of demand and matching requirements. |
| Seafarer profile | `seafarer_profiles`, structured seafarer workspace tables, metadata | Source of supply and readiness. |
| Documents | `uploaded_documents` and protected storage metadata | Evidence for identity, qualifications, company/vessel authority and corrections. |
| Candidate search result | Computed from current demand/supply data | Read-only comparison before shortlist. |
| Internal shortlist draft | `operator_shortlist_drafts`, `operator_shortlist_candidates` | Internal team object, not employer-visible. |
| Review application | vacancy application / review staging records | Human-review preparation before employer presentation. |
| Presentation decision | vacancy application / candidate presentation status | Controlled employer-facing step. |
| Audit event | `registration_audit_events` and future process audit records | Evidence of who did what, when and why. |
| Billing basis | future billing/service completion record | Commercial handoff after service output. |

## 6. Process Participants

| Participant | Business role | Main responsibility |
|---|---|---|
| Employer / shipowner client | Primary payer | Provides demand, vessel context, crew requirements and feedback. |
| Employer representative | Authorized user | Acts for the employer-side client within scoped authority. |
| Seafarer | Candidate / supply-side user | Provides profile, documents, preferences and consent where required. |
| Group 0 Marketing | Lead source | Qualifies interest and routes relevant leads. |
| Group 1 Shipowners / Employers / Clients Registration | Demand intake | Structures employer, representative, vessel and crew-request data. |
| Group 2 Seafarer Registration And Development | Supply intake | Helps seafarers complete profile and readiness data. |
| Group 3 Payments, Sales And Revenue Distribution | Commercial control | Handles commercial proposal, entitlement, billing and revenue attribution. |
| Group 4 Client Support | Operational support | Handles support, communication and client/user blockers. |
| Group 5 Internal Control | Control and quality | Handles verification, review, compliance exceptions and audit support. |
| `review_team` / `reviewer` | Matching and candidate review | Reviews comparison, shortlist and candidate presentation workflow. |
| Project Owner | Governance and control | Reviews exceptions, access, deletion confirmations and process integrity. |
| AI agent | Assisted processing | Classifies, summarizes, checks completeness and drafts recommendations under human control. |

## 7. Master Process Map

| Step | Stage | Primary result | Responsible group | Main computed task |
|---|---|---|---|---|
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
| CF-14 | Service completion and billing | Service result and billing basis exist | Group 3 | Prepare billing / completion record |
| CF-15 | Retention and audit | Client follow-up and evidence are retained | Responsible manager / Group 5 | Schedule next contact or audit review |

## 8. Detailed Process Control Table

| Step | Trigger | Inputs | DB records read | DB records created/updated | Audit evidence | Output | Next computed task |
|---|---|---|---|---|---|---|---|
| CF-01 Lead / demand entry | Employer-side inquiry, imported request or direct form | Client contact, requested role, vessel hints | users, employer drafts, imported request data | employer/vacancy draft or lead metadata | lead captured / source event | Demand lead exists | Qualify employer-side demand |
| CF-02 Employer and authority setup | Demand lead is relevant | Company data, representative details, authority evidence | employer/company records, uploaded documents | company context, representative authority status | employer authority review event | Employer can be handled as B2B client or returned for correction | Review vessel context or request correction |
| CF-03 Vessel context setup | Vessel-linked request exists | Vessel name/type/flag, vessel specs, operation context | vessels, reference catalogs, uploaded documents | vessel context, vessel verification status | vessel context review event | Vessel context is structured enough for demand | Review crew request completeness |
| CF-04 Crew request structuring | Employer request is submitted/imported | Rank, department, vessel type, join date, duration, salary, certificates, training, visa/language/sea-service requirements | vacancy request, `demand_requirement_items`, reference catalogs | normalized demand workspace and requirement rows | demand structuring event | Crew request is match-ready or has blockers | Confirm commercial basis or compare request-supply |
| CF-05 Commercial entitlement check | Service workflow is active or employer requests candidate processing | Service scope, payer, terms, entitlement | employer context, service/payment metadata | commercial status / entitlement metadata | commercial approval or pending event | Work may proceed, pause or require billing action | Continue matching or prepare billing/support task |
| CF-06 Seafarer supply intake | Seafarer registers or imported profile exists | Identity, rank, certificates, availability, preferences, documents | seafarer profile, source cards, reference catalogs | profile/workspace records, consent events where available | profile intake event | Candidate supply exists | Review profile completeness |
| CF-07 Document and readiness review | Profile has documents or correction tasks | Uploaded documents, source cards, readiness data | uploaded documents, seafarer workspace, review states | review status, correction tasks, readiness flags | document/profile review event | Candidate is ready, blocked or needs correction | Compare request-supply or request correction |
| CF-08 Request-supply comparison | Crew request and supply are structured | Demand requirements, candidate summaries | vacancy request, demand requirements, seafarer summaries | No side effect; computed result only | optional comparison-view audit if required | Match explanation and blockers | Create internal shortlist draft if candidates are eligible |
| CF-09 Internal shortlist draft | Operator chooses candidate set from comparison/search | Candidate-search result and guard data | vacancy request, candidate-search result, consent/source-card state | `operator_shortlist_drafts`, `operator_shortlist_candidates` | `operator_shortlist_draft_created` | Internal draft exists, employer-visible false | Approve internal shortlist |
| CF-10 Internal shortlist approval | Internal draft is ready | Draft candidates, current guard result | shortlist draft/candidates, current candidate-search result | draft status `approved_internal` or `rejected`, approval guard snapshot | `operator_shortlist_internal_approval_recorded` | Approved or rejected internal draft | Create candidate presentation review or reopen/correct |
| CF-11 Candidate presentation review | Internal shortlist approved | Included candidates, allow/deny payload checks | shortlist draft, candidate snapshots, consent/correction status | review application / candidate presentation staging | review-application bridge or presentation review event | Human review exists or presentation blocked | Present candidate to employer if guard passes |
| CF-12 Employer-facing presentation | Human review approves employer-visible summary | Data-minimized candidate summary, employer request | vacancy application, employer-facing payload rules | candidate status / presented state where approved | candidate presentation event | Employer receives approved summary | Record employer feedback |
| CF-13 Employer feedback and outcome | Employer responds or follow-up date arrives | Feedback, interview interest, rejection, request changes | employer request, presented candidates, notes | feedback status, follow-up task, outcome metadata | employer feedback event | Outcome known or follow-up scheduled | Service completion, further shortlist, or support task |
| CF-14 Service completion and billing | Service output meets commercial rule | Completed presentation/support result, commercial terms | employer/client records, service metadata, outcome | service completion / billing basis record | billing handoff event | GTC service-fee basis exists | Prepare invoice/reward attribution |
| CF-15 Retention and audit | Service cycle closes | Client history, outcome, future needs | client cards, audit events, billing records | next-contact date, retention stage, audit notes | closure/retention event | Client is retained and evidence is preserved | Future contact or audit task |

## 9. Computed Task Principle

Tasks are not the source of truth. Tasks are visible work items derived from the current records.

The rule is:

```text
previous stage result + current object state + role/permission + assignment relationship = visible next task
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
| Control exception - deletion confirmation | `confirm_vacancy_deletion` / `reject_vacancy_deletion` | `owners` | `approve_access_policy_change` | Owner/control user sees and executes the manager confirmation panel. Review-team user does not receive the task and direct endpoint access is denied. |

This verified matrix is part of the business process. A future UI or backend change must not weaken these group and permission boundaries.

## 19. Next Stage

The companion operating instruction must be maintained in:

```text
docs/crewportglobal/business_processes/13_crew_formation_operating_instructions_for_users_team_ai.md
```

After BP-012 and BP-013 are approved, the next implementation-planning stage should simplify operator task actions according to this process.
