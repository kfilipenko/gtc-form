# CPG-BIZ-101 - Shipowner Candidate Selection Workspace Task

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Coding task for Project Owner approval
- Source request: Project Owner instruction after CPG-BIZ-100
- Version: 1.0
- Date: 2026-06-04
- Status: Approved by Project Owner; implemented in document 302

## 1. Purpose

This task defines the next shipowner-facing workspace after guarded candidate presentation and the first contract proposal action.

The purpose is to add a clear menu item and page:

```text
Shipowners -> Select candidate
```

The page must let a shipowner-side user open a crew request / vacancy, review employer-safe matching candidates already released by the controlled internal process, open a candidate card, and use the guarded:

```text
Propose contract
```

operation from the candidate detail view.

This task is not an approval to expose raw seafarer profiles to shipowners.

## 2. Terminology Rule

The public and user-facing menu term for the demand-side client must be:

```text
Shipowners
```

Russian UI:

```text
Судовладельцы
```

The term includes shipowners, vessel operators, vessel managers, crew managers and maritime employers acting as the client side of a crew request.

Internal database names may still use legacy terms such as `employer`, `employer_company`, or `vacancy_request`, but user-facing navigation and future contract terminology should use `Shipowner / Судовладелец` unless a legal document explicitly defines a broader party name.

This terminology must be reflected in future contract documents as the standard term for the party requesting crew support, with any broader wording handled by definition rather than by changing the menu label.

## 3. Business Reason

After CPG-BIZ-100, the platform can create or reuse a Contract Agreement Workspace from an employer-side candidate decision.

However, the shipowner-side navigation still lacks a dedicated page for the practical business operation:

```text
review matching candidates -> choose a candidate -> propose contract
```

Currently the shipowner can work from `/post-vacancy/`, but that page is primarily a vacancy/request form. It is not a focused candidate-selection workspace.

The new page must make the process understandable:

1. the shipowner has submitted a crew request;
2. the platform/team has matched and approved candidates for employer-safe presentation;
3. the shipowner sees the presented candidates for that request;
4. the shipowner opens a candidate card;
5. the shipowner can request next actions or propose a contract when the guard allows it.

## 4. Navigation Scope

### 4.1 Menu changes

Rename the menu group:

```text
Employers
```

to:

```text
Shipowners
```

Russian:

```text
Работодатели -> Судовладельцы
```

The shipowner menu should contain functional actions only:

| Menu item | Purpose |
|---|---|
| `Post vacancy` / `Разместить вакансию` | Create or update company, vessel and crew-request data. |
| `Select candidate` / `Подобрать кандидата` | Review employer-safe presented candidates and propose contract. |

### 4.2 Remove descriptive duplicate page from route

The current:

```text
/for-shipowners/
```

is a descriptive information page. It duplicates content that belongs in controlled documents.

Implementation must:

1. verify that the useful terms and explanations from `/for-shipowners/` already exist in the document pages;
2. if missing, move them into the appropriate document page before removal;
3. remove `/for-shipowners/` from the public/user menu;
4. replace the page with a short transition page or redirect only if needed to avoid broken external links.

No important service condition should live only on a marketing page.

## 5. Proposed Page

Recommended route:

```text
/shipowners/candidates/
```

The final route may be adjusted if it better fits the existing application structure, but it must be a dedicated shipowner candidate-selection workspace rather than a generic document or marketing page.

## 6. Data Visibility Boundary

The page must not call raw operator candidate-search endpoints.

The page may show only candidates that are already safe for shipowner presentation under the approved process:

```text
internal shortlist draft
-> internal shortlist approval
-> candidate presentation review
-> employer-safe presentation
-> shipowner candidate decision
```

The page must preserve:

1. no raw seafarer contact details by default;
2. no broad document metadata exposure;
3. no medical/family/private information exposure;
4. no unpublished candidate exposure;
5. no automatic employment decision;
6. no contract proposal unless the CPG-BIZ-100 guard allows it.

## 7. Page Behavior

The page should show:

1. shipowner's available crew requests / vacancies;
2. status of each request;
3. count of presented candidates for each request;
4. safe candidate cards for the selected request;
5. matching explanation visible to the shipowner in simplified business language;
6. blocker/status reason when no candidate is available yet;
7. candidate detail view;
8. primary action in candidate detail:

```text
Propose contract
```

The `Propose contract` action must use the guarded endpoint implemented in CPG-BIZ-100:

```text
POST /api/v1/employer/vacancy-applications/{id}/contract-proposal
```

The button must be shown only when the returned `contract_operation.visible` is true and must be disabled or explained when `contract_operation.enabled` is false.

## 8. Relationship With Matching

The page is a shipowner-facing result of the matching process.

It should not perform unrestricted matching directly.

The page should read the matching/presentation result produced by the controlled team workflow and show:

| Matching dimension | Shipowner-visible form |
|---|---|
| Rank / position | Candidate matches requested rank or equivalent category. |
| Vessel type | Candidate has matching or acceptable vessel-type experience/preference. |
| Availability | Candidate availability is compatible with joining date. |
| Documents | Candidate has required document readiness status without exposing private files. |
| Salary / contract range | Candidate expectation is compatible with request where available. |
| Blockers | Only safe business blockers, not private internal notes. |

If the team has not approved a candidate for presentation, the page should show a clear operational state, for example:

```text
Candidate presentation is being prepared.
```

## 9. Candidate Card And Contract Proposal

The candidate card must include:

1. safe candidate summary;
2. matching reason;
3. current shipowner decision state;
4. contract proposal status;
5. active link to the Contract Agreement Workspace when one exists;
6. `Propose contract` only in the candidate detail view.

The list view should not show too many competing actions. It should link to candidate detail, and the detail view should show the primary executable operation.

## 10. Required Backend / API Checks

Before implementation, the agent must verify existing endpoints and data:

1. employer-side presented candidates endpoint;
2. `vacancy_applications` status and `employer_shortlist_status`;
3. `operator_shortlist_drafts` and `operator_shortlist_candidates` link availability;
4. `contract_workspace_instances` link availability after CPG-BIZ-100;
5. existing safe candidate payload fields;
6. missing field mapping required for the new page.

If an additive endpoint is required, it must preserve existing guards and return only safe shipowner payload.

## 11. Acceptance Criteria

The task is complete when:

1. the menu group is renamed from `Employers` to `Shipowners`;
2. `/for-shipowners/` is removed from normal navigation or replaced by a safe transition page after document-content verification;
3. a dedicated shipowner candidate-selection page exists;
4. the page lists shipowner crew requests / vacancies;
5. the page shows only approved employer-safe candidate presentations;
6. the candidate detail view contains the guarded `Propose contract` operation;
7. the operation creates or reuses Contract Agreement Workspace records through the CPG-BIZ-100 endpoint;
8. blocked states are understandable and do not expose internal/private candidate data;
9. Playwright API/UI tests cover the page and the contract proposal handoff;
10. the business-process register and documentation register are updated;
11. a Russian implementation report is created after coding.

## 12. Explicit Non-Scope

This task does not authorize:

1. exposing all seafarer profiles to shipowners;
2. bypassing internal shortlist approval;
3. bypassing candidate presentation review;
4. exposing candidate contact data by default;
5. generating a final contract;
6. signing a contract;
7. changing master contract clauses;
8. implementing billing;
9. deleting legal/policy content before confirming that it exists in document pages.

## 13. Next Stage After Approval

After Project Owner approval, the implementation should proceed in this order:

1. inspect current navigation and employer presented-candidate API;
2. verify `/for-shipowners/` content against document pages;
3. implement navigation terminology change;
4. add the shipowner candidate-selection page;
5. wire guarded contract proposal from candidate detail;
6. test links and actions end to end;
7. create implementation report.

After this task, the next planned stage remains:

```text
Contract Agreement Workspace detail view and embedded field prefill implementation
```

That stage should open the workspace created by `Propose contract` and show verified platform data and embedded contract condition fields.
