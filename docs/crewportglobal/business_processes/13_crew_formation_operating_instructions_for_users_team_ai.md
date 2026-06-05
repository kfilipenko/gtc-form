# CrewPortGlobal - BP-013 Crew Formation Operating Instructions For Users, Team And AI Agents

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Business-process ID: BP-013
- Source task: CPG-BIZ-012 approved execution task, document 199
- Baseline: BP-012 crew formation service business process manual
- Date: 2026-05-26
- Document type: Operating instructions
- Status: Drafted for Project Owner review

## 1. Purpose

This instruction explains how users, team members and AI agents must work inside the CrewPortGlobal crew formation process.

It expands BP-012 into practical duties, rights, action sequences and authority boundaries.

The instruction is designed for:

1. seafarers;
2. employer / shipowner users;
3. employer representatives;
4. support operators;
5. reviewers;
6. managers;
7. billing operators;
8. Project Owner / control users;
9. AI agents.

## 2. Controlling Rule

Each visible task must come from data and workflow state, not from arbitrary manual labels.

The task rule is:

```text
previous stage result + current object state + role/permission + assignment relationship = visible next task
```

The executor should see one primary task at a time.

Secondary actions may exist, but they should be inside the work object or a secondary menu, not displayed as competing primary actions in the queue.

### 2.1 Information Stream Rule

Before a task is shown to a user or AI agent, the system must identify the information stream and the object state.

The operational order is:

```text
information stream
-> object type
-> current object state
-> business-process stage
-> computed operation
-> responsible group or historical active executor
-> visible task
```

| Stream | Working object | Main team responsibility | Task visibility principle |
|---|---|---|---|
| Seafarer supply | Seafarer profile, source cards, documents and availability | Complete, verify and maintain candidate readiness for matching | Show tasks to the seafarer owner, Group 2, `verification_team` or `review_team` only according to current readiness/correction state and permissions. |
| Employer / shipowner demand account | Company, representative authority and commercial client context | Confirm authorized B2B demand-side client and service boundary | Show tasks to Group 1, Group 5, Group 3 or support only when employer-side state requires their function. |
| Vessel context | Vessel profile, vessel type, flag and operational context | Make vessel information structured enough for crew request and matching | Show tasks to Group 1, Group 5 or `review_team` according to vessel completeness, verification and matching relevance. |
| Crew request / vacancy requirement | Vacancy request, demand workspace and structured requirement rows | Connect employer and vessel demand with seafarer supply for matching and shortlist | Show tasks to Group 1 or `review_team` only when the request is structured enough for the current stage, or to manager/control when deletion or exception state exists. |

Users and AI agents must not treat these streams as one generic queue. A seafarer correction task, employer authority task, vessel-context task and crew-request matching task have different owners, permissions, evidence and final decisions.

## 3. Standard Task Card For Users And Team

### 3.1 Required display

Each task card must show:

| Element | Requirement |
|---|---|
| Task title | Clear stage action and object summary. |
| Active link | Opens the exact internal working object. |
| Object type | Crew request, seafarer profile, shortlist draft, candidate presentation, deletion request, billing record. |
| Safe object summary | Short non-sensitive summary. |
| Responsible group | Group that owns the operation. |
| Assigned employee | Specific assignee when one exists. |
| Required permission | Permission needed to complete the operation. |
| Status / blockers | Why the task is executable or blocked. |
| SLA state | Deadline/color if defined. |

### 3.2 Recommended title format

```text
{Stage action}. ({Object type}: {safe object summary}.)
```

Examples:

```text
Review crew request completeness. (Crew request: Chief Officer for Bulk Carrier, join date 2026-08-15.)
```

```text
Review request-supply comparison. (Crew request: Second Engineer for Container Vessel.)
```

```text
Approve internal shortlist. (Crew request: Chief Officer, 3 included candidates.)
```

```text
Approve candidate for employer presentation. (Candidate: Able Seaman, documents ready.)
```

```text
Confirm deletion request. (Crew request: Chief Officer for Bulk Carrier, requested by reviewer.)
```

### 3.3 Action label rule

| Label type | Rule |
|---|---|
| Primary operation | Only one should be visually dominant. |
| Secondary operation | Show inside workspace or contextual menu. |
| Review outcome | Show after the user opens the review workspace. |
| Destructive operation | Requires confirmation workflow and manager/control approval. |
| Public/external view | Must be clearly labeled as public/external if used. |

Ambiguous labels must be avoided.

| Current label | Required correction |
|---|---|
| `Open item` | Use `Open internal work item` or `Open review workspace`. |
| `Start review` | Show only when starting review is the actual computed task. |
| `Needs correction` | Treat as review outcome, not generic queue action. |
| `Mark reviewed` | Treat as review outcome inside review workspace. |
| `Request deletion` | Treat as secondary controlled action with manager confirmation. |

### 3.4 Save, Completeness Check And Submit Rule

Every form used by seafarers, employers, vessel owners or team-supported users must follow the same user-facing rule.

The shared rule is governed by BP-014:

```text
docs/crewportglobal/business_processes/14_standard_form_lifecycle_and_validation_module.md
```

When a team member, developer or AI agent adds a new form, they must connect it to the same lifecycle standard instead of inventing page-local rules.

The user must see one main save/confirmation action for the questionnaire.

Fields may autosave while the user edits, but the visible control must remain:

```text
Save / confirm data
```

The user must be able to save an allowed draft or correction. Save means:

1. store the entered data;
2. keep the object in draft/correction state;
3. run automated completeness checks;
4. run available document format/readability checks;
5. compute the next visible owner task or submission action.

Save does not mean operator review has started.

After save, the system must choose one of two states:

| State after save | User-visible result | Team-visible result |
|---|---|---|
| Required fields and documents are complete, valid and readable | Active action: `Submit to operator review` / `Направить на проверку оператору` | Operator task may compute only after the user submits. |
| Required fields/documents are incomplete or unreadable | Owner task lists numbered sections and missing points | No active operator-review task should be created yet. |

This rule applies to all questionnaire streams:

| Stream | Form examples | Submit may be enabled only after |
|---|---|---|
| Seafarer supply | profile, source cards, availability, certificates, documents | required profile fields, required documents and owner correction sections are complete. |
| Employer / shipowner demand account | company profile, representative authority, commercial context | company identity, authority evidence and required contact/role fields are complete. |
| Vessel context | vessel profile, vessel type, flag, operational details, vessel evidence | required vessel characteristics and vessel evidence are complete. |
| Crew request / vacancy requirement | rank, department, joining date, contract terms, certificates, training and constraints | structured demand fields and required supporting data are complete. |

The owner task must use numbered sections:

```text
Complete questionnaire sections. (Form: {safe object summary}; Sections: {section numbers}.)
```

Examples:

| Situation | Task text |
|---|---|
| Missing seafarer document and availability | `Complete questionnaire sections. (Seafarer profile: Chief Officer; Sections: S-4.2, S-7.D1.)` |
| Missing company authority evidence | `Complete questionnaire sections. (Employer authority: Ocean Manager LLC; Sections: E-1.3, E-1.D1.)` |
| Missing vessel characteristics | `Complete questionnaire sections. (Vessel profile: Container Vessel; Sections: V-2.1, V-2.4.)` |
| Missing crew request contract term | `Complete questionnaire sections. (Crew request: Second Engineer; Sections: R-3.2, R-4.1.)` |

Users and team members must not send incomplete forms to operator review manually. If the completeness analyzer reports missing numbered items, the user must complete those sections first.

AI agents may help explain missing numbered sections, but may not override the completeness gate or submit an incomplete form to operator review.

Protected file uploads must be understandable before the user selects a file. Each upload panel must show:

1. allowed formats: PDF, JPG, PNG and WEBP;
2. maximum single-file size: 10 MB;
3. that the draft must be saved before upload;
4. that uploaded files are scanned and then placed into human review.

If upload fails, the user must receive a specific cause whenever the system knows it. Examples include unsupported file type, empty file, file too large, request body too large, total draft upload limit, file count limit, partial upload or malware scan block. Team members and AI agents must not tell users simply that "upload failed" when a precise cause is available.

Mandatory fields must be synchronized between forms. Users and team members must not mark a field optional on one side when the same field is required for matching on the other side.

| Matching dimension | User instruction |
|---|---|
| Rank / department | Seafarer profile and crew request must both contain structured values. |
| Vessel type | Seafarer preference or experience and vessel/request type must both be structured. |
| Timing | Seafarer availability and employer joining date must both be present. |
| Salary | Seafarer expectation and employer salary range/currency must both be present for commercial fit. |
| Certificates / education / training | If the demand requires it, the seafarer side must provide the matching structured evidence before the profile is treated as matching-ready. |
| Visa / language / special operation constraints | If used as a blocker on demand, the corresponding seafarer-side field must exist and be checked; otherwise it must remain advisory, not a hard blocker. |

AI agents may identify mismatched mandatory-field rules, but may not silently change the required-field matrix without Project Owner approval.

## 4. Seafarer Instructions

### 4.1 Purpose

The seafarer provides supply-side information needed for matching and crew formation.

### 4.2 Seafarer may

1. register a personal account;
2. confirm email;
3. create or update seafarer profile;
4. provide rank, documents, certificates, availability and preferences;
5. upload required documents through protected upload;
6. respond to correction requests;
7. search matching vacancies from the saved profile where the system allows it;
8. request contract consideration for a matching published vacancy;
9. withdraw or update availability where supported;
10. see own tasks and profile status.

### 4.3 Seafarer must not

1. be charged recruitment or placement fees;
2. see other seafarers' records;
3. access employer internal review notes;
4. approve own candidate presentation;
5. bypass document or profile review.

### 4.4 Typical task sequence

| Trigger | Visible task | Link target | Output |
|---|---|---|---|
| Registration started | Complete seafarer profile | `/create-profile/` or cabinet card | Profile draft saved and completeness check runs. |
| Documents missing | Upload required document | document upload card | Protected document metadata created. |
| Correction requested | Correct source card | exact profile card section | Corrected data submitted. |
| Completeness check passed | Submit to operator review | profile submit action | Operator review task computes. |
| Profile is matching-ready and published verified vacancies exist | Find matching vacancies | `/seafarers/job-search/` or cabinet task card | Seafarer sees fit/blocker reasons and may request contract consideration for an eligible vacancy. |
| Matching vacancy is requestable | Request contract consideration | exact vacancy card in job-search page | Controlled vacancy application is recorded; existing review, employer decision and contract proposal workflow continues. |
| Availability outdated | Update availability | availability/profile card | Supply data becomes current. |
| Voyage completed or return confirmed | Update next-voyage availability and needs | availability/profile card | Seafarer is ready for the next matching cycle or follow-up. |

## 5. Employer / Shipowner User Instructions

### 5.1 Purpose

The employer-side user provides demand-side data and receives approved service outputs.

### 5.2 Employer user may

1. register or confirm account;
2. submit company and authority context;
3. submit vessel context;
4. submit crew request / vacancy requirements;
5. receive approved candidate summaries;
6. provide feedback;
7. upload or confirm contract / employment-support evidence when the employer proceeds with a candidate;
8. confirm joining, boarding, monthly work-period and disembarkation/return evidence where agreed;
9. request follow-up or additional crew support;
10. handle commercial/billing communication if authorized.

### 5.3 Employer user must not

1. receive candidate contact data before approved process;
2. receive restricted medical, family or identity details;
3. access internal shortlist drafts;
4. access internal comparison notes beyond approved summaries;
5. act without authority evidence when authority is required.

### 5.4 Typical task sequence

| Trigger | Visible task | Link target | Output |
|---|---|---|---|
| Employer account exists | Complete company / authority details | employer workspace | Employer draft saved and completeness check runs. |
| Vessel data missing | Add vessel context | vessel workspace | Vessel context draft saved and completeness check runs. |
| Crew need exists | Complete crew request | vacancy/request workspace | Demand draft saved and completeness check runs. |
| Completeness check passed | Submit demand data to operator review | employer/vacancy submit action | Employer/vessel/request review task computes. |
| Candidate summary approved | Review candidate summary | employer candidate view | Employer feedback recorded. |
| Candidate accepted | Upload / confirm contract and joining terms | employer/voyage support workspace | Contract and joining conditions become reviewable. |
| Seafarer onboard | Confirm monthly service evidence | employer/voyage support workspace | Billing-period evidence becomes reviewable. |
| Contract ending or disembarkation signaled | Confirm disembarkation and return arrangement | employer/voyage support workspace | Return support, replacement or closure task computes. |
| Service result confirmed | Confirm commercial or follow-up action | employer/billing workspace | Billing or next request workflow starts. |

## 6. Group 0 - Marketing Instructions

Marketing handles lead qualification and routing.

| Responsibility | Instruction |
|---|---|
| Create or confirm lead | Record source, client type and contactability. |
| Qualify demand | Identify whether the inquiry is employer-side, seafarer-side or partner-side. |
| Route lead | Send employer leads to Group 1; seafarer leads to Group 2; risk cases to Group 5. |
| Preserve attribution | Keep source and campaign data for future revenue analysis. |

Marketing must not promise employment, crew availability, pricing, legal approval or candidate presentation.

## 7. Group 1 - Employer / Shipowner Registration Instructions

Group 1 structures employer-side demand.

### 7.1 Main responsibilities

1. confirm employer-side client context;
2. collect company and representative details;
3. collect vessel context;
4. collect crew request details;
5. ensure demand is structured enough for matching;
6. route authority/compliance issues to Group 5;
7. route commercial entitlement issues to Group 3;
8. collect employer-side contract, joining and return/repatriation terms after the employer proceeds with a candidate.

### 7.2 Computed task examples

| State | Task |
|---|---|
| Employer data incomplete | `Review employer registration completeness. (Client: {safe company summary}.)` |
| Vessel data incomplete | `Review vessel context. (Vessel: {vessel type / name if safe}.)` |
| Crew request incomplete | `Review crew request completeness. (Crew request: {rank} for {vessel type}.)` |
| Employer feedback due | `Record employer feedback. (Candidate presentation: {role/vessel summary}.)` |
| Candidate accepted, contract missing | `Record contract and joining terms. (Crew request: {rank/vessel summary}.)` |
| Return responsibility missing | `Clarify seafarer return responsibility. (Voyage: {rank/vessel summary}.)` |

### 7.3 Prohibited actions

Group 1 must not:

1. expose candidate data without approved presentation;
2. approve restricted medical details for employer view;
3. bypass internal shortlist approval;
4. promise final employment outcome;
5. approve billing without Group 3 control.

## 8. Group 2 - Seafarer Registration And Development Instructions

Group 2 structures supply-side data.

### 8.1 Main responsibilities

1. support seafarer profile completion;
2. check missing profile sections;
3. help resolve correction tasks;
4. maintain availability and preference data;
5. route document/readiness review to Group 5 or `review_team`;
6. keep no-fee boundary visible;
7. follow up after return from vessel and help the seafarer update next-voyage needs.

### 8.2 Computed task examples

| State | Task |
|---|---|
| Profile incomplete | `Review seafarer profile completeness. (Seafarer profile: {rank / safe name if allowed}.)` |
| Source card correction open | `Request profile correction. (Source card: {card code and safe label}.)` |
| Availability stale | `Update seafarer availability. (Profile: {rank summary}.)` |
| Returned from voyage | `Update next-voyage availability. (Seafarer profile: {rank summary}.)` |

### 8.3 Prohibited actions

Group 2 must not:

1. charge or imply recruitment/placement fees;
2. promise a job or embarkation;
3. approve candidate presentation alone;
4. expose one seafarer's data to another;
5. override medical or document review.

## 9. Group 3 - Payments, Sales And Revenue Distribution Instructions

Group 3 controls commercial basis and billing handoff.

### 9.1 Main responsibilities

1. confirm employer-side service scope;
2. confirm payer and entitlement;
3. prepare invoice or billing basis after approved service event;
4. track payment status where implemented;
5. preserve manager/reward attribution;
6. ensure no seafarer recruitment or placement fee is charged.

### 9.2 Computed task examples

| State | Task |
|---|---|
| Service scope unclear | `Confirm commercial basis. (Client: {safe company summary}.)` |
| Candidate service delivered | `Prepare billing handoff. (Crew request: {rank/vessel summary}.)` |
| Payment issue | `Resolve payment blocker. (Client: {safe client summary}.)` |

### 9.3 Prohibited actions

Group 3 must not:

1. bill seafarer recruitment or placement fees;
2. create false service completion records;
3. override operational review or compliance blockers;
4. change candidate presentation decisions.

## 10. Group 4 - Client Support Instructions

Group 4 resolves communication and operational blockers.

### 10.1 Main responsibilities

1. answer support questions;
2. help users find the correct workflow;
3. support upload or login issues;
4. route business, compliance or billing cases to correct group;
5. support joining, boarding, disembarkation and return questions;
6. record support notes and outcomes.

### 10.2 Computed task examples

| State | Task |
|---|---|
| User cannot complete form | `Assist workflow completion. (Object: {safe object summary}.)` |
| Client response needed | `Follow up with client. (Client: {safe summary}.)` |
| Support blocker resolved | `Close support blocker. (Case: {safe case summary}.)` |
| Boarding not confirmed | `Confirm seafarer boarding evidence. (Voyage: {rank/vessel summary}.)` |
| Contract ending soon | `Confirm seafarer return arrangement. (Voyage: {rank/vessel summary}.)` |
| Return in progress | `Complete seafarer return support. (Seafarer: {safe profile summary}.)` |

### 10.3 Prohibited actions

Group 4 must not:

1. approve candidate presentation;
2. confirm employer authority;
3. approve deletion alone;
4. access restricted documents without assigned task;
5. make employment or payment decisions.

## 11. Group 5 - Internal Control Instructions

Group 5 handles control, verification and exceptions.

### 11.1 Main responsibilities

1. review company/authority risk;
2. review document and evidence exceptions;
3. review deletion confirmation tasks;
4. review complaints and audit exceptions;
5. support quality checks;
6. ensure restricted data is not exposed.

### 11.2 Computed task examples

| State | Task |
|---|---|
| Authority evidence pending | `Review authority evidence. (Client: {safe company summary}.)` |
| Deletion requested | `Confirm deletion request. (Crew request: {safe request summary}.)` |
| Sensitive exception | `Review compliance exception. (Object: {safe object summary}.)` |

### 11.3 Prohibited actions

Group 5 must not:

1. disclose restricted fields outside approved scope;
2. erase audit evidence;
3. approve billing without commercial basis;
4. turn control review into employment decision.

## 12. `review_team` / Reviewer Instructions

The `review_team` is responsible for matching review, shortlist and candidate presentation workflow.

### 12.1 Required permissions

Current demand workflow permissions include:

| Operation | Responsible group | Required permission |
|---|---|---|
| View review queue | `review_team` | `view_review_queue` |
| Create internal shortlist draft | `review_team` | `view_review_queue` |
| Approve internal shortlist | `review_team` | `approve_candidate_presentation` |
| Create review applications | `review_team` | `start_human_review` |
| Review candidate presentation | `review_team` | `approve_candidate_presentation` |
| Request vacancy deletion | `review_team` | `approve_vacancy_request` |

Deletion confirmation is not a reviewer permission. It belongs to owner/control users under `approve_access_policy_change`.

### 12.2 Main responsibilities

1. review structured crew request readiness;
2. review request-supply comparison;
3. inspect blockers before shortlist;
4. create internal shortlist draft only from current comparison/search results;
5. approve or reject internal shortlist;
6. create review applications after internal approval;
7. review candidate presentation summary;
8. preserve no-employer-visible boundary until presentation guard passes.

### 12.3 Computed task sequence

| Previous result | Reviewer's next task |
|---|---|
| Search result exists | `Create internal shortlist draft. (Crew request: {safe demand summary}.)` |
| Seafarer submits a matching-vacancy request | `Review candidate request. (Vacancy application: {safe vacancy and rank summary}.)` |
| Draft exists and guard is ready | `Approve internal shortlist. (Shortlist draft: {candidate count and demand summary}.)` |
| Draft is approved internal | `Create candidate presentation review. (Shortlist draft: {safe summary}.)` |
| Review application exists | `Approve candidate for employer presentation. (Candidate: {safe profile summary}.)` |

### 12.4 Prohibited actions

Reviewer must not:

1. present candidate to employer before guard;
2. include candidates with unresolved hard blockers unless future explicit exception workflow exists;
3. expose contacts, medical, family or identity details;
4. mark work reviewed without checking evidence;
5. use `Request deletion` as a substitute for correction/review outcome.

## 13. Manager / Project Owner Instructions

Managers and Project Owner handle assignment, escalation and control decisions.

### 13.1 Main responsibilities

1. assign responsible manager or specialist;
2. monitor group queues;
3. resolve conflicts between groups;
4. approve or reject deletion confirmations;
5. review audit exceptions;
6. confirm process changes before implementation;
7. ensure B2B revenue logic and no-fee boundary.

### 13.2 Computed task examples

| State | Task |
|---|---|
| Deletion pending manager confirmation | `Confirm deletion request. (Crew request: {safe request summary}.)` |
| Overdue task | `Review overdue task escalation. (Client: {safe summary}.)` |
| Assignment missing | `Assign responsible specialist. (Object: {safe object summary}.)` |

## 14. AI-Agent Instructions

### 14.1 AI may assist with

1. checking field completeness;
2. comparing demand with supply;
3. summarizing blockers;
4. drafting correction reasons;
5. preparing candidate comparison text;
6. preparing task titles;
7. detecting inconsistent workflow states;
8. preparing audit summaries.

### 14.2 AI must not independently

1. approve or reject candidate presentation;
2. approve internal shortlist;
3. confirm deletion;
4. approve employer authority;
5. make billing decisions;
6. make employment decisions;
7. override access-control decisions;
8. expose restricted fields in prompts or outputs.

### 14.3 AI output label

AI-generated work must be labeled as assistant/preparatory output until a human executor approves it.

Recommended label:

```text
AI-prepared summary for human review. Not a final decision.
```

## 15. Working Object Links

Every task must link to the exact working object.

| Object type | Link target direction |
|---|---|
| Crew request completeness | Internal request/vacancy workspace or `/verify/` detail with request id. |
| Request-supply comparison | `/team/matching/` with crew request id. |
| Internal shortlist draft | `/team/shortlists/` detail/drill-down or `/verify/` task context. |
| Candidate presentation review | `/verify/` vacancy application detail or future review workspace. |
| Deletion confirmation | manager confirmation task panel. |
| Billing handoff | future billing/service completion workspace. |

The link must not send a team user to a public page when the work requires internal review.

## 16. Execution And Verification Cycle For Process Work

Users, team members and AI agents must treat process documentation and product behavior as one controlled system.

The required execution cycle is:

```text
1. Describe the process stage and expected task.
2. Open the application and verify that the stage can actually be performed.
3. If the application does not support the described operation, record the mismatch and correct only the necessary surface.
4. Run focused tests for the affected process.
5. Move to the next process stage only after the test confirms compliance.
6. If compliance is not confirmed, repeat the check/fix/test cycle.
```

For task links this means:

1. the task title and object description are the active link;
2. the link opens the exact internal working object;
3. the opened workspace shows the executable operation or the blocker that prevents execution;
4. secondary actions remain inside the workspace or contextual menu;
5. after successful completion, the task list is recomputed from current data.

AI agents must not mark a process stage complete only because a document has been written. The agent must also verify the relevant application behavior or explicitly report why verification was not possible.

## 17. Verified Role-Based Task Execution Rules

The following rules are verified in the running application and must be preserved by users, team members and AI agents.

| Task / operation | Responsible group | Required permission | User instruction |
|---|---|---|---|
| Create internal shortlist draft | `review_team` | `view_review_queue` | Use only from a concrete request-supply comparison task. Do not create from an unrelated request or public page. |
| Approve internal shortlist | `review_team` | `approve_candidate_presentation` | Approve only inside the concrete shortlist draft task panel and only after guard output is visible. |
| Create candidate presentation review | `review_team` | `start_human_review` | Create review applications only from an approved internal shortlist draft. |
| Review candidate presentation | `review_team` | `approve_candidate_presentation` | Approve or block only inside the concrete vacancy application review workspace. |
| Review company verification | `verification_team` | `view_verification_queue` | Open the concrete company workspace from the task title, verify employer authority, vessel context and linked demand context, then record the review outcome. Do not use this task to inspect seafarer restricted supply data. |
| Review crew request and request-supply preparation | `review_team` | `view_review_queue` | Open the concrete vacancy workspace, verify structured demand, vessel context and candidate-search readiness. Candidate contact fields and broad document metadata must not be used or displayed as part of this task. |
| Seafarer job-search request | seafarer owner, then existing review/employer groups | owner profile/cabinet access; later existing review/employer permissions | The seafarer may request contract consideration only from a concrete matching vacancy. The request must create or reuse a controlled application/context record and must not directly create employment status, a contract, invoice or employer-facing unrestricted data. |
| Review seafarer profile completeness | `verification_team` | `start_human_review` / verification queue access | Open the concrete seafarer profile workspace from the task title, review profile/readiness summaries and record the outcome. Do not copy or expose restricted family, medical, identity, child or reference-contact details. |
| Restricted medical detail access | future restricted medical role | future dedicated medical permission | General operators must not access restricted medical details. If direct access returns `restricted_medical_capability_required`, continue with readiness summary review or escalate to the future approved medical-review workflow. |
| Confirm or reject deletion request | `owners` / Project Owner control | `approve_access_policy_change` | This is manager/control-only. Review-team may request deletion but must not confirm or reject it. |

If a task appears to a user without the required group and permission, the user must not execute it and the issue must be escalated as an access-control defect.

If a user attempts direct endpoint access without the required group and permission, the expected result is:

```text
403 workflow_operation_permission_required
```

AI agents may summarize the access requirement, but must not recommend bypassing the access contract.

## 18. Verified Computed Assignment Rule

The current application computes task assignment from data and audit history.

User-facing rules:

```text
Assigned employee: group queue
```

means:

1. the task is computed from current data;
2. the task belongs to the displayed responsible group;
3. no active employee in that group has previous recorded work history for the same object;
4. the first authorized group member who completes the task creates audit evidence that can assign later tasks for the same object and group to that person.

```text
Assigned employee: {name}
```

means:

1. an active employee in the responsible group previously completed an analogous operation for this object;
2. the employee is still active and still has active group membership;
3. the task remains visible according to the same group/permission contract;
4. the named employee is the expected executor unless a manager/control user changes the workflow in a later approved reassignment process.

The current runtime does not use a manual assignment table. It uses:

1. existing audit events;
2. `actor_context.actor_user_id`;
3. `actor_context.target_group_code`;
4. object identifiers such as vacancy request, shortlist draft, vacancy application id or `seafarer_profile_id`;
5. active user and active group-membership checks.

Users and AI agents must not create an artificial assignment outside this computed rule. If the named employee is inactive, blocked or no longer a member of the responsible group, the task must return to the group queue.

## 19. Review Outcomes

Review outcomes should be recorded inside the review workspace.

| Outcome | Meaning | Next state |
|---|---|---|
| Approved / reviewed | Evidence and data are sufficient for this stage | Next process step computes. |
| Needs correction | Required data/evidence is missing or inconsistent | Correction task computes for owner/responsible group. |
| Rejected | The item cannot proceed in current workflow | Manager/control or closure task computes. |
| Hold | More information is needed or external response is pending | Follow-up task computes. |
| Request deletion | Secondary controlled action | Manager confirmation task computes. |
| Internal review workspace disclosure | Review outcomes and secondary actions are available only after opening the workspace | User reviews the object context first, then opens the disclosure when a review result or controlled secondary action is required. |
| Current task context | Primary operation, stage, object, visibility reason and completion condition are shown at the top of the workspace | User must confirm that the displayed operation matches the intended work before recording a review outcome. |
| Post-action completion feedback | Workspace confirms the recorded operation, object, result and task recomputation rule | User must read the feedback and return to Team tasks when the current operation is completed or blocked. |
| Active task recomputation | Same operation must leave the active queue after its review outcome is recorded | User must not keep working from the old active task; the next action must come from the recomputed queue, or the object must appear only as a clear control/correction record. |
| Owner correction handoff | `needs_correction` creates an owner/responsible-party correction task | Owner must open the exact source-card/task link, correct only the requested section and resubmit. The correction task must disappear after resubmission and the review task must recompute for the responsible group or historical active executor. |
| Demand-side correction handoff | Employer/company or crew-request `needs_correction` creates a cabinet correction task for the owner/responsible employer-side user | Owner must open the `/post-vacancy/` correction link, update the requested company, vessel or crew-request data and resubmit. The cabinet correction task must disappear after resubmission, and the next `verification_team` or `review_team` task must recompute for the responsible group or historical active executor. |

## 20. Escalation Rules

Escalate when:

1. deadline is overdue;
2. requester authority is unclear;
3. candidate data contains restricted/sensitive conflict;
4. employer asks for prohibited information;
5. seafarer fee boundary is at risk;
6. deletion or data-retention question appears;
7. AI output conflicts with human evidence;
8. billing/service-result basis is disputed.

Escalation should create a visible computed task for manager/control only when the underlying state supports it.

## 21. Confidentiality Rules

Users and team must protect:

1. candidate contact details;
2. passport and identity numbers;
3. medical declarations;
4. family and next-of-kin data;
5. raw uploaded document IDs and paths;
6. internal review notes;
7. audit/control records;
8. access/session data.

Employer-facing summaries must use allow-listed fields only.

## 22. Future UI Revision Requirements

When UI simplification is approved, the operator queue should be changed so that:

1. one primary operation is shown per item;
2. the primary operation name matches the computed task;
3. the working object link is explicit;
4. secondary actions move inside the workspace;
5. review outcomes appear only after opening review;
6. destructive actions require confirmation workflow;
7. access denied actions are hidden or shown as blocked with reason;
8. task labels are understandable to non-technical users.

## 23. Next Stage

After BP-012 and BP-013 are reviewed by Project Owner, the next stage should be:

```text
CPG-BIZ-042 - Shared frontend form lifecycle helper extraction
```

That stage should extract the already verified `/create-profile/` lifecycle behavior into a shared frontend helper and then connect the same standard to `/post-vacancy/`.
