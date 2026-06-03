# BP-016 - Business Process Stage And Standard Mapping Matrix

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Documentation block: Business processes and operating model
- Document type: Stage-to-standard control matrix
- Source task: Project Owner instruction after CPG-BIZ-093 approval
- Version: 1.0
- Date: 2026-06-03
- Status: Drafted for Project Owner review

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
| CPG-BIZ-093 | Public master contract versioning and immutable clause control | Approved by Project Owner; condition-form and scripted generation standard |
| Implemented Code Standards ICS-001..003 | Reusable code standards for form lifecycle, protected upload and submit-review gate | Existing code-level standard register |

## 4. Stage-To-Standard Matrix

| Stage | Process code | Main object | Responsible group | Existing controlling standard | Coverage | Missing / next standard |
|---|---|---|---|---|---|---|
| Marketing to seafarers | CC-01 / before CF-06 | Seafarer lead | Group 0 marketing, Group 2 seafarer support | BP-015, BP-009 | Partial | Standard for lead source, campaign evidence, public CTA, conversion metrics and no-fee wording. |
| Marketing to employers / shipowners | CC-02 / before CF-01 | Employer lead | Group 0 marketing, Group 1 demand intake | BP-015, BP-009 | Partial | Standard for employer lead qualification, package offer, partner/logo publication and commercial interest evidence. |
| Physical person registration | CC-03 | User account / physical person | Registration flow, support | BP-008, BP-014 | Covered | Need job instruction for support exceptions and failed registration recovery. |
| Path selection after registration | CC-03 | User role path | Registration flow, support | BP-008, BP-009 | Partial | Standard for automatic routing to seafarer profile or employer/vacancy workspace after role selection. |
| Seafarer profile completion | CC-04 / CF-06 | Seafarer supply profile | Seafarer owner, Group 2 support | BP-011, BP-014, BP-010 | Covered for current form | Need final parity check for all matching-critical fields and document-first extraction plan. |
| Seafarer document readiness review | CF-07 | Seafarer documents and profile readiness | Verification team / Group 5 | BP-010, BP-012, BP-014 | Covered in principle and partially implemented | Job instruction for document review outcomes, correction reasons and restricted medical boundary. |
| Employer/company registration | CC-05 / CF-02 | Employer/company card | Employer owner, Group 1, Group 5 | BP-003, BP-008, BP-014 | Partial | Standard for employer authority evidence, logo/public partner eligibility and commercial account status. |
| Vessel registration | CC-06 / CF-03 | Vessel context card | Employer owner, Group 1, Group 5 | BP-014, CPG-BIZ-047 report, BP-012 | Partial | Dedicated vessel-context standard: flag, type, documents, particulars, owner/manager link and matching use. |
| Service package / subscription setup | CC-08 / CF-05 | Service entitlement | Group 3 billing/commercial, Group 1 | BP-015 | Gap | Standard for packages, subscriptions, service list, discounts, entitlement status and billing trigger. |
| Crew request / vacancy intake | CC-09 / CF-04 | Crew request / vacancy | Employer owner, Group 1, review team | CPG-DEMAND-001/002 docs, BP-014, BP-012 | Partial | Unified demand field and catalog standard tied to matching, contract terms and visibility. |
| Request-supply comparison | CC-10 / CF-08 | Demand + safe supply comparison | Review team | BP-012, CPG-BIZ-017/020/021 reports, CPG-DEMAND-007..011 reports | Covered for current workflow | Need formal matching-explanation standard: why fit, why blocked, score/priority boundary. |
| Internal shortlist draft | CC-11 / CF-09 | Internal shortlist draft | Review team | CPG-DEMAND-012/013/014, BP-012 | Covered | Future job instruction for shortlist creation and hold/exclude decisions. |
| Internal shortlist approval | CC-11 / CF-10 | Internal shortlist approval record | Review team / control role | CPG-DEMAND-015, BP-012 | Covered | Future segregation-of-duties rule if creator and approver must differ. |
| Candidate presentation review | CC-12 / CF-11 | Candidate presentation staging | Review team / Group 5 | CPG-DEMAND-016/023, BP-012 | Covered in current guard model | Need user-facing employer presentation package standard. |
| Employer-facing presentation | CC-12 / CF-12 | Employer-safe candidate summary | Review team, Group 1 | CPG-DEMAND-023, BP-006, BP-012 | Partial | Standard for employer view content, field allow-list, presentation evidence and expiry. |
| Employer feedback / candidate decision | CC-13 / CF-13 | Candidate decision / employer feedback | Group 1, review team | BP-012, earlier employer follow-up reports | Partial | Standard for employer decision states: proceed, reject, hold, interview, request replacement. |
| Contract condition form | CC-14 / CF-14 | Contract-condition form | Group 1, Group 4, Group 5 | CPG-BIZ-091/092/093, BP-014 | Defined, not implemented | CPG-BIZ-094 clause library and catalog seeding design; later contract-condition form implementation standard. |
| Scripted contract generation | CC-14 / CF-14 | Generated contract instance | System script, responsible employee, control role | CPG-BIZ-093, BP-014 | Defined, not implemented | Standard for template storage, generation script, hash, version metadata and document preview. |
| Embarkation confirmation | CC-14 / CF-14 | Employment/voyage support record | Group 4 support, Group 1, employer | BP-012, BP-015 | Gap/partial | Standard for boarding evidence, onboard status, success-fee trigger and failed-joining blocker. |
| Active voyage monthly evidence | CC-15 / CF-15 | Monthly service evidence | Group 4 support, Group 3 billing | BP-012, BP-015 | Gap | Standard for monthly work confirmation, illness/early-disembarkation signal, replacement and invoice basis. |
| Disembarkation and return support | CC-16 / CF-16 | Return / repatriation support record | Group 4 support, responsible manager | BP-012, BP-015, CPG-BIZ-089/090 | Partial | Standard for return responsibility, route, destination, payer, support completion and next availability task. |
| Service completion and billing | CC-17 / CF-17 | Billing/service completion record | Group 3 billing, responsible manager | BP-015, billing policy document 15 | Gap/partial | Standard for invoice basis, success fee, monthly service fee, replacement exceptions and reward attribution. |
| Retention and next voyage marketing | CC-19 / CF-18 | Seafarer/client retention record | Group 0, Group 1, Group 2 | BP-015 | Gap | Standard for post-voyage care, availability refresh, next request, employer repeat sales and follow-up SLA. |
| Audit and evidence retention | Cross-stage | Audit events and records | All groups, Project Owner/control | BP-006, BP-010, BP-012, BP-015 | Partial | Unified audit evidence retention standard by stage and record type. |
| Computed task visibility and assignment | Cross-stage | Task computed from object state | All operational groups | BP-012, BP-013, CPG-BIZ-014..030 reports | Covered for current team task model | Job instruction must define task ownership by stage and exception escalation. |
| Public site functional alignment | Cross-stage | Public pages and CTAs | Group 0 / product owner | BP-009, BP-015, CPG-BIZ-054..087 reports | Partial | Standard for public page purpose: sell service, route to form, avoid duplicate educational pages. |

## 5. Gap Register

The following standards should be created or expanded before final job descriptions are issued.

| Priority | Proposed standard | Reason |
|---|---|---|
| P1 | Employer service package and entitlement standard | Without this, subscription/package, discounts, service access and commercial start are not fully controlled. |
| P1 | Contract clause library and condition-form catalog standard | Required before implementing the contract-condition form and scripted contract generation. |
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

The recommended next stage is:

```text
CPG-BIZ-094 - Master contract clause library and catalog seeding design
```

After that, the process should move to:

1. employer service package and entitlement standard;
2. embarkation/onboard evidence standard;
3. monthly service evidence and billing-basis standard;
4. disembarkation/return support standard;
5. role job-instruction package for the operational groups.
