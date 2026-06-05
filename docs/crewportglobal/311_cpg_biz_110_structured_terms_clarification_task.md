# CPG-BIZ-110 - Structured Terms Clarification Before Contract Proposal Task

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Execution task for Project Owner approval
- Source request: Project Owner instruction after CPG-BIZ-109
- Version: 1.0
- Date: 2026-06-05
- Status: For Project Owner approval

## 1. Purpose

This task defines the next controlled business-process stage:

```text
Structured Terms Clarification before Contract Proposal
```

The purpose is to let a seafarer and a shipowner align material employment/voyage terms without using an unstructured chat as the source of agreement.

The stage must sit between:

```text
matching / incoming request / shipowner candidate interest
```

and:

```text
Contract Agreement Workspace / Propose contract
```

This task is documentation and design authorization only. It does not approve code, SQL, runtime migration, API, UI or production changes.

## 2. Business Reason

CrewPortGlobal already supports:

1. seafarer profile and document data;
2. shipowner vacancy / crew request data;
3. request-supply comparison;
4. seafarer-initiated contract-consideration request;
5. shipowner candidate-selection workspace;
6. review-team processing of incoming seafarer requests;
7. guarded contract proposal and Contract Agreement Workspace.

However, the current workflow does not yet define how the parties resolve differences in material terms before a contract is proposed.

Examples of terms that may differ:

| Term | Shipowner value | Seafarer value | Required process result |
|---|---|---|---|
| Joining date | 2026-08-15 | Available from 2026-08-20 | Clarify or accept adjusted date |
| Salary | USD 6,500 | Expected USD 7,000 | Accept, reject or propose alternative |
| Contract duration | 4 months +/- 1 | 5 months preferred | Clarify final duration |
| Travel to vessel | Employer paid | To be agreed | Confirm responsible payer |
| Repatriation / return | Employer paid | Employer paid | Mark agreed |
| Required documents | COC, STCW, medical | Some documents pending | Block until readiness or clarify acceptable timing |

An ordinary chat is not sufficient because it produces unstructured statements, creates interpretation risks and weakens the evidential basis for contract generation and billing.

## 3. Approved Direction

The approved direction for review is:

```text
No free chat as the primary agreement source.
Use a structured terms clarification workspace.
```

The workspace must allow parties and the responsible team to resolve exact terms through controlled fields, approved catalogs, explicit statuses and audit events.

## 4. Process Position

The new stage must be inserted into the business process as:

```text
CF-13 Employer feedback and candidate outcome
-> CF-13A Structured terms clarification
-> CF-14 Contract and embarkation support / Contract Agreement Workspace
```

It also applies to the seafarer counter-flow:

```text
CF-08A Seafarer job-search request
-> Review-team release / shipowner proceeds
-> CF-13A Structured terms clarification
-> guarded Propose contract
```

## 5. Required Deliverables After Approval

After Project Owner approval, the implementation agent must prepare:

1. a business-process update for BP-012 and BP-013;
2. a stage-to-standard matrix update for BP-016;
3. a UI/API design for a structured terms clarification workspace;
4. a data-source mapping showing which terms are taken from verified seafarer, shipowner, vessel and vacancy records;
5. an additive SQL draft if new records are required;
6. tests proving tasks and links work for shipowner, seafarer and review-team users.

No runtime SQL or code implementation may begin until the workspace design and any SQL draft are reviewed.

## 6. Structured Terms Clarification Object

The process should create or compute a working object:

```text
terms_clarification_workspace
```

This object represents one negotiation context between:

1. one seafarer;
2. one shipowner / employer-side company;
3. one vessel or vessel context;
4. one crew request / vacancy;
5. one candidate-selection or incoming-request application;
6. one future contract workspace, if all material terms are agreed.

## 7. Terms Comparison Matrix

The workspace must show a matrix:

| Dimension | Source from shipowner/vacancy | Source from seafarer/profile | Status | Action |
|---|---|---|---|---|
| Rank / position | crew request | seafarer profile | match / mismatch | no action or review |
| Vessel type | vessel / crew request | preferred vessel types / sea service | match / partial / mismatch | clarify if material |
| Joining date | crew request | availability date | match / clarify / blocker | accept adjusted date or request alternative |
| Contract duration | crew request | preference or contract terms | match / clarify | select final duration |
| Salary | crew request salary range | salary expectation | match / clarify / reject | accept / propose alternative |
| Currency | vacancy | seafarer expectation | match / clarify | select currency |
| Payment schedule | contract terms / employer preference | seafarer preference if present | clarify | select approved option |
| Travel to vessel | vacancy / pre-contract terms | seafarer preference | agree / clarify | select responsible payer |
| Return / repatriation | vacancy / pre-contract terms | seafarer preference | agree / clarify | select responsible payer |
| Documents | required documents | uploaded/reviewed documents | ready / pending / blocker | request correction or accept condition |
| Medical / visa readiness | vacancy requirements | reviewed readiness | ready / pending / blocker | clarify or block |
| Candidate note | incoming request note | seafarer note | review | team-safe handling only |

## 8. Status Model

Each term must have one of these statuses:

| Status | Meaning |
|---|---|
| `matched` | The values are compatible and require no action. |
| `requires_clarification` | The values are not equal or are incomplete, but may be resolved. |
| `proposed_by_shipowner` | Shipowner proposed a concrete value. |
| `proposed_by_seafarer` | Seafarer proposed a concrete value. |
| `accepted_by_shipowner` | Shipowner accepted the term. |
| `accepted_by_seafarer` | Seafarer accepted the term. |
| `agreed` | Both sides accepted the same final value or team confirmed no conflict. |
| `blocked` | The term prevents contract proposal until corrected. |
| `rejected` | One side rejects the term and the candidate path should not proceed. |
| `team_review_required` | The term needs team review before it can be treated as agreed. |

The overall workspace status should be computed as:

| Workspace status | Rule |
|---|---|
| `draft_terms_matrix` | Comparison exists but no party action started. |
| `clarification_required` | At least one material term requires clarification. |
| `awaiting_shipowner_response` | A term proposal is pending shipowner action. |
| `awaiting_seafarer_response` | A term proposal is pending seafarer action. |
| `team_review_required` | A value needs team/control review. |
| `terms_agreed` | All material terms are agreed or marked not applicable. |
| `blocked` | At least one hard blocker remains. |
| `closed_no_agreement` | The path is closed without contract proposal. |

## 9. Party Actions

### 9.1 Shipowner actions

The shipowner may:

1. accept the seafarer value;
2. keep the vacancy value;
3. choose an approved alternative from a catalog;
4. request team clarification;
5. close the candidate path without agreement.

### 9.2 Seafarer actions

The seafarer may:

1. accept the shipowner value;
2. propose an allowed alternative;
3. confirm readiness;
4. update profile data or documents if the issue is caused by incomplete profile data;
5. withdraw from the candidate path.

### 9.3 Team actions

The responsible team may:

1. review unclear values;
2. mark a term as `team_review_required`;
3. request correction from either party;
4. confirm that agreed terms are ready for contract workspace creation;
5. block the path if the term is unsafe, non-compliant or materially impossible.

## 10. Catalog And Field Rules

Terms must use catalogs where possible.

Examples:

| Term | Selection type | Catalog / source |
|---|---|---|
| Payment schedule | Single choice | monthly, full period, milestone, other approved value |
| Payment method | Single or conditional choice | bank account, card, cash through approved agent, other approved value |
| Travel-to-vessel payer | Single choice | shipowner, seafarer, shared, to be agreed before contract |
| Return / repatriation payer | Single choice | shipowner, seafarer, shared, to be agreed before contract |
| Contract duration tolerance | Single choice | exact, +/- 1 month, +/- approved tolerance |
| Joining date alternative | Date field | validated date |
| Salary | Numeric + currency | salary range / expectation |
| Vessel type | Catalog-backed | vessel_types / vessel_type_matching_categories |

Free text may exist only as a supporting note and must not become the contractual source of truth.

## 11. Data Source Principle

The workspace must distinguish:

1. verified facts already available in the platform;
2. party-selectable contractual alternatives;
3. unresolved data requiring correction;
4. team-only notes or control reasons.

Verified facts must be prefilled from:

1. seafarer profile and reviewed documents;
2. shipowner / employer company profile;
3. representative authority record;
4. vessel profile;
5. crew request / vacancy;
6. candidate-selection or vacancy-application record.

The parties should not retype verified identity, company, vessel or vacancy facts unless a controlled correction process is triggered.

## 12. Task Computation

The stage must create computed tasks, not manual to-do items.

Examples:

| Current state | Visible task | User / group |
|---|---|---|
| Material terms differ after shipowner proceeds with candidate | Review terms requiring clarification | Shipowner / responsible shipowner user |
| Shipowner proposed adjusted salary or joining date | Review proposed contract terms | Seafarer |
| Seafarer proposes alternative date or salary | Review seafarer term proposal | Shipowner |
| Document readiness blocks a term | Correct required document readiness | Seafarer |
| A term is unsafe, unclear or outside approved catalogs | Review term exception | Review team / control group |
| All material terms are agreed | Prepare contract workspace | Responsible team / shipowner flow |

## 13. Audit Requirements

Every material term action must create audit evidence:

1. actor;
2. actor role;
3. affected term;
4. previous value;
5. proposed value;
6. status transition;
7. timestamp;
8. source object;
9. whether the term is contract-relevant;
10. whether a controlled correction or team review was required.

## 14. Guard Boundary

Structured terms clarification must not by itself:

1. create a contract;
2. sign a contract;
3. create employment status;
4. create onboard status;
5. create billing basis;
6. expose restricted seafarer data to the shipowner;
7. expose unrestricted shipowner internal notes to the seafarer.

Contract proposal remains guarded and may proceed only after:

1. material terms are `agreed`;
2. required source data is reviewed;
3. candidate presentation / employer decision path is valid;
4. contract workspace guard passes;
5. no hard blocker remains.

## 15. Why Chat Is Not The Primary Tool

The platform may later support limited team-mediated comments, but free chat must not be the primary agreement source because:

1. it is hard to compare automatically;
2. it is difficult to convert reliably into contract fields;
3. it creates ambiguity over what was finally agreed;
4. it weakens audit evidence;
5. it increases risk of promises outside approved terms;
6. it may expose contact or personal data too early.

The primary tool is therefore:

```text
structured term -> proposal -> acceptance/rejection -> audit -> agreed terms sheet
```

## 16. Acceptance Criteria

This task is ready for implementation planning when:

1. Project Owner approves this document;
2. BP-012 is updated with CF-13A Structured Terms Clarification;
3. BP-013 is updated with user/team instructions for term proposals;
4. BP-016 maps the new stage to a controlling standard;
5. required term dimensions and statuses are confirmed;
6. no-chat-as-primary-agreement-source rule is preserved;
7. the next implementation task defines UI/API/SQL design before coding.

## 17. Non-Scope

This task does not implement:

1. chat;
2. database tables;
3. API endpoints;
4. UI workspace;
5. contract generation;
6. electronic signature;
7. employment status;
8. billing.

## 18. Next Stage After Approval

After approval, the recommended next stage is:

```text
CPG-BIZ-111 - Structured Terms Clarification Workspace UI/API/SQL Design
```

That stage should produce the implementation design and any SQL draft before runtime coding.
