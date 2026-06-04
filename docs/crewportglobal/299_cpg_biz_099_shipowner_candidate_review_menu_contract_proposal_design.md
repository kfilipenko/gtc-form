# CPG-BIZ-099 - Shipowner Candidate Review Menu And Contract Proposal Design

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Design report and implementation gate
- Source task: continuation after CPG-BIZ-098D
- Version: 1.0
- Date: 2026-06-04
- Status: Designed; ready for Project Owner implementation approval

## 1. Purpose

This document defines the next controlled step after contract workspace migration 018.

The purpose is to connect the shipowner / employer candidate review menu with the future Contract Agreement Workspace through one computed operation:

```text
Propose contract
```

or in Russian UI:

```text
Предложить контракт
```

The operation must be available only for a concrete employer-facing candidate presentation tied to a concrete vacancy / crew request and, where available, the exact internal shortlist candidate row.

This stage is design-only. It does not implement API routes, UI buttons, database writes or contract generation.

## 2. Existing Runtime Basis

The current application already contains the following working foundation.

| Area | Existing object / route | Current behavior |
|---|---|---|
| Shipowner / employer workspace | `/post-vacancy/` | Stores employer/company/vessel/vacancy data and shows presented candidates. |
| Internal shortlist draft | `operator_shortlist_drafts` | Stores internal-only shortlist draft with approval guard. |
| Internal shortlist candidate | `operator_shortlist_candidates` | Stores candidate decisions and guard snapshots; now linkable from contract workspace through migration 018. |
| Review application bridge | `POST /api/v1/operator/shortlist-drafts/{id}/review-applications` | Creates internal `vacancy_applications` for review without employer visibility. |
| Candidate presentation review | `PATCH /api/v1/operator/vacancy-applications/{id}/presentation-review` | Moves approved candidate application to `presented`, making it visible to the employer workspace. |
| Employer candidate action | `PATCH /api/v1/employer/vacancy-applications/{id}/shortlist` | Allows employer-side status updates: `presented`, `contacted`, `interview_requested`, `not_suitable`. |
| Contract workspace schema | Migration 018 | Provides `contract_workspace_instances`, embedded fields, party approvals, generated contract metadata and audit events. |

## 3. Business Process Placement

The operation belongs after the employer has received a safe candidate presentation and decided to proceed.

```text
Request-supply matching
-> Internal shortlist draft
-> Internal shortlist approval
-> Candidate presentation review
-> Employer-facing candidate presentation
-> Employer decision: proceed with candidate
-> Propose contract
-> Contract Agreement Workspace
-> Party approval
-> Generated contract instance
-> Embarkation and service evidence
```

The operation must not be shown as a generic shipowner/company action. It must be tied to:

1. one `vacancy_request`;
2. one `vacancy_application`;
3. one seafarer candidate;
4. one `shortlist_candidate_id` when the presentation came from an internal shortlist.

## 4. Proposed Shipowner Candidate Review Menu

The authenticated shipowner / employer area should group candidate work as follows.

| Menu item | Purpose | Main working object |
|---|---|---|
| Requests | Manage company/vessel/crew request data. | `vacancy_requests` |
| Candidates | Review presented candidates for each request. | `vacancy_applications` |
| Contracts | Continue contract workspaces that have already been proposed. | `contract_workspace_instances` |
| Vessels | Maintain vessel context and evidence. | `vessels` |
| Company | Maintain employer/company authority and service account state. | `employer_companies` |

The first implementation may keep this inside `/post-vacancy/` as a candidate panel rather than creating a new public route.

Recommended URL shape:

```text
/post-vacancy/?view=candidates&vacancy_request_id={vacancy_request_id}
```

The current `/post-vacancy/` page already renders `Presented candidates`, so the lowest-risk implementation is to extend that panel before introducing a new page.

## 5. Candidate Card Display Rule

Each candidate row/card must show one clear primary computed operation.

Safe employer-visible fields:

| Field | Source | Notes |
|---|---|---|
| Candidate display name or safe candidate label | `users.display_name` / safe summary | No private contact fields. |
| Rank / position | `seafarer_profiles.primary_rank` and vacancy rank context | Matching-critical. |
| Department | `seafarer_profiles.department` | Matching-critical. |
| Availability | `seafarer_profiles.availability_status`, `availability_date` | Contract/boarding relevant. |
| Document readiness summary | public-safe document summary helper | No raw `document_metadata`. |
| Employer status | `vacancy_applications.employer_shortlist_status` | Current employer decision state. |
| Candidate note | `vacancy_applications.candidate_note` | Only if already approved for employer presentation. |
| Contract readiness | computed guard result | Shows ready / blocked with concise blocker codes. |

Forbidden employer-facing fields:

```text
candidate email
contact_email
contact_phone
raw document_metadata
restricted medical details
family/emergency contacts
previous employer reference contacts
internal guard snapshots
operator notes not approved for employer presentation
```

## 6. Computed Operation Rule

The `propose_contract` operation is visible only when all required conditions are true.

```text
presented candidate
+ employer owns / is authorized for the vacancy company
+ employer decision is proceed/interview-ready
+ candidate presentation remains employer-safe
+ linked vacancy/company/vessel/seafarer facts are available
+ no active contract workspace already exists for this candidate and request
= visible Propose contract task/action
```

Recommended employer decision trigger:

| Current status | Contract operation |
|---|---|
| `presented` | Not ready; employer must first express interest. |
| `contacted` | Not ready by default; contact is not enough for contract preparation. |
| `interview_requested` | May show `Propose contract` if the employer is proceeding with candidate or chooses proceed. |
| `not_suitable` | Hidden. |
| future `proceed_with_candidate` | Ready when all guards pass. |

The next implementation should add a clearer status:

```text
proceed_with_candidate
```

This avoids treating interview request as a legal/commercial decision to prepare a contract.

## 7. Guard Conditions

### 7.1 Access guard

The employer user must pass:

1. authenticated service account;
2. role is employer / shipowner / buyer-employer / crewing manager;
3. user is linked to the company that owns the vacancy request;
4. company authority evidence is not blocked;
5. requested vacancy belongs to that company.

### 7.2 Candidate presentation guard

The application must pass:

1. `vacancy_applications.application_status = 'presented'`;
2. `vacancy_applications.vacancy_request_id` belongs to the employer company;
3. candidate was approved through the operator candidate presentation guard;
4. candidate payload remains employer-safe;
5. candidate has not withdrawn from the application;
6. employer status is not `not_suitable`.

### 7.3 Contract source guard

The Contract Agreement Workspace can be created only when source records can be resolved.

Required linked sources:

| Contract source | Existing source record |
|---|---|
| Seafarer party facts | `users`, `seafarer_profiles`, verified profile/document fields |
| Employer party facts | `employer_companies`, verified employer draft data |
| Vessel facts | `vessels`, linked `vacancy_requests.vessel_id` |
| Crew request terms | `vacancy_requests` |
| Candidate selection event | `operator_shortlist_candidates.shortlist_candidate_id` where available |
| Employer decision | `vacancy_applications.employer_shortlist_status` and audit event |

If `shortlist_candidate_id` cannot be resolved from a legacy presentation, the API may still use `vacancy_application_id` as supporting evidence, but the response must mark:

```text
source_traceability = degraded_legacy_without_shortlist_candidate
```

New presentations should preserve the exact shortlist candidate link.

### 7.4 Duplicate workspace guard

Before creating a workspace, the system must check:

```text
contract_workspace_instances
WHERE vacancy_request_id = ?
  AND candidate_user_id = ?
  AND workspace_status NOT IN ('voided', 'superseded')
```

If an active workspace already exists, the UI must open the existing workspace instead of creating another one.

## 8. Proposed API Contract

### 8.1 List employer-visible candidates

```text
GET /api/v1/employer/vacancies/{vacancy_request_id}/candidates
```

Returns safe candidate cards for the authenticated employer's vacancy.

Each item should include:

```json
{
  "vacancy_application_id": "uuid",
  "vacancy_request_id": "uuid",
  "shortlist_candidate_id": "uuid-or-null",
  "candidate_user_id": "uuid",
  "safe_candidate_summary": {},
  "employer_shortlist_status": "presented|contacted|interview_requested|not_suitable|proceed_with_candidate",
  "contract_operation": {
    "operation_code": "propose_contract",
    "visible": true,
    "enabled": true,
    "blockers": [],
    "existing_contract_workspace_id": null
  }
}
```

### 8.2 Record employer proceed decision

```text
PATCH /api/v1/employer/vacancy-applications/{vacancy_application_id}/shortlist
```

Extend the existing status catalog with:

```text
proceed_with_candidate
```

This status means:

1. employer wants to move from candidate review to contract preparation;
2. it is not a signed contract;
3. it does not create employment;
4. it opens the contract workspace guard.

### 8.3 Create or open contract proposal workspace

```text
POST /api/v1/employer/vacancy-applications/{vacancy_application_id}/contract-proposal
```

Required body:

```json
{
  "employer_draft_id": "uuid",
  "operator_note": "optional employer-side note"
}
```

Expected behavior:

1. validate employer access;
2. validate candidate presentation status;
3. validate employer decision status;
4. resolve vacancy/company/vessel/seafarer/shortlist candidate sources;
5. return existing active workspace if one already exists;
6. create `contract_workspace_instances` only if source guard passes;
7. create audit event.

## 9. Contract Workspace Creation Mapping

When `propose_contract` is executed, the new workspace should be initialized as follows.

| Field | Value |
|---|---|
| `workspace_status` | `draft_from_platform_data` |
| `master_template_id` | Latest approved seafarer/shipowner master template for the locale/jurisdiction set |
| `vacancy_request_id` | From `vacancy_applications.vacancy_request_id` |
| `vacancy_application_id` | Current presented application |
| `shortlist_candidate_id` | Resolved from the internal shortlist candidate row when available |
| `candidate_user_id` | `vacancy_applications.seafarer_user_id` |
| `employer_company_id` | `vacancy_requests.company_id` |
| `vessel_id` | `vacancy_requests.vessel_id` |
| `created_by_user_id` | Authenticated employer user |
| `source_traceability` | Source map for all prefilled fields |

Embedded fields should be created from the approved contract field catalog:

1. source-first facts are prefilled from verified records;
2. selectable alternatives remain editable inside the contract text;
3. missing source facts become blockers or controlled correction tasks;
4. no free-text legal clause changes are allowed.

## 10. Audit Events

The following audit events should be used in implementation.

| Event | When |
|---|---|
| `employer_candidate_proceed_recorded` | Employer selects `proceed_with_candidate`. |
| `contract_workspace_proposal_guard_blocked` | Guard prevents workspace creation. |
| `contract_workspace_proposal_created` | New workspace is created. |
| `contract_workspace_proposal_reused` | Existing active workspace is opened. |

Audit payload must include:

```text
actor_user_id
company_id
vacancy_request_id
vacancy_application_id
shortlist_candidate_id
candidate_user_id
vessel_id
guard_status
blocker_codes
source_traceability_status
```

## 11. UI Text

Recommended Russian labels:

| UI area | Label |
|---|---|
| Candidate menu | `Кандидаты` |
| Candidate card primary action | `Предложить контракт` |
| Existing workspace action | `Открыть договор` |
| Blocked state | `Договор пока недоступен` |
| Employer decision | `Продолжить с кандидатом` |

Recommended English labels:

| UI area | Label |
|---|---|
| Candidate menu | `Candidates` |
| Candidate card primary action | `Propose contract` |
| Existing workspace action | `Open contract workspace` |
| Blocked state | `Contract not ready yet` |
| Employer decision | `Proceed with candidate` |

The label must not be:

```text
Open item
```

because the business-process standard requires one clear computed operation, not a generic navigation label.

## 12. Non-Scope

This design does not implement:

1. contract workspace API runtime;
2. employer candidate menu UI runtime;
3. contract generation;
4. party signature;
5. billing trigger;
6. employment decision automation;
7. candidate contact disclosure;
8. migration changes beyond the already applied migration 018.

## 13. Acceptance Criteria For The Next Implementation Stage

The next implementation stage is complete only when:

1. employer candidate list shows presented candidates for the correct company/request;
2. candidate rows do not expose forbidden contact/document fields;
3. employer can record `proceed_with_candidate`;
4. `propose_contract` appears only for the correct candidate/request pair;
5. blocked state shows concise blocker codes;
6. existing active workspace is reused instead of duplicated;
7. new workspace stores `vacancy_application_id` and `shortlist_candidate_id` where available;
8. audit events record actor, company, vacancy, candidate, shortlist candidate and guard result;
9. regression tests confirm no employer visibility leaks from internal shortlist rows;
10. the process matrix is updated from design to implementation.

## 14. Next Stage

The next recommended stage is:

```text
CPG-BIZ-100 - Shipowner candidate review and contract proposal API/UI implementation
```

That stage should implement the employer candidate list extension, `proceed_with_candidate` status, `propose_contract` guard and creation/reuse of Contract Agreement Workspace records.
