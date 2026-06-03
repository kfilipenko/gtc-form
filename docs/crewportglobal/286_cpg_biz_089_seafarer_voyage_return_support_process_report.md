# CPG-BIZ-089 - Seafarer Voyage And Return Support Process Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Business-process amendment report
- Source task: Project Owner instruction after CPG-BIZ-088
- Version: 1.0
- Date: 2026-06-03
- Status: Documented for Project Owner review

## 1. Purpose

This report records the business-process amendment that extends the seafarer workflow beyond matching and embarkation.

The updated principle is:

```text
CrewPortGlobal supports the seafarer and employer-side client through the full service cycle:
selection -> contract -> joining -> boarding -> active voyage -> monthly service evidence -> disembarkation -> return support -> next availability.
```

This amendment is documentation-only. It does not create code, database tables, migrations, routes or runtime behavior.

## 2. Business Reason

The company objective is not only to find a seafarer for a vessel.

The practical commercial and relationship objective is:

1. help the employer-side client close a crew need;
2. accompany the selected seafarer until actual boarding;
3. keep evidence while the seafarer works on board;
4. create the monthly service-fee basis from actual work evidence;
5. know the seafarer's disembarkation and return arrangement before contract completion;
6. support return / repatriation according to contract and agreed responsibility;
7. ask the seafarer about next-voyage availability after return;
8. create long-term cooperation without charging seafarer recruitment or placement fees.

This turns the workflow into a complete service cycle rather than a one-time candidate transfer.

## 3. Documents Updated

| File | Update |
|---|---|
| `business_processes/15_crewportglobal_commercial_operating_cycle.md` | Added disembarkation and return support to the commercial model, process flow, stage matrix, evidence matrix, ISO/audit alignment and new seafarer voyage escort rule. |
| `business_processes/12_crew_formation_service_business_process_manual.md` | Extended the crew formation process scope and master process map with contract/embarkation support, active voyage/monthly evidence, disembarkation/return support and availability refresh. |
| `business_processes/13_crew_formation_operating_instructions_for_users_team_ai.md` | Added role-level responsibilities and computed task examples for employer users, Group 1, Group 2 and Group 4. |
| `business_processes/00_business_process_register.md` | Added register revision for the voyage/return support amendment. |
| `00_documentation_register.md` | Added this report as document 286. |

## 4. New Process Chain

The documented chain is now:

```text
Employer proceeds with candidate
-> contract / employment-support evidence
-> joining terms and logistics
-> boarding evidence
-> onboard active status
-> monthly work-period evidence
-> contract-end / early-disembarkation monitoring
-> disembarkation confirmation
-> return / repatriation support
-> seafarer availability refresh
-> next voyage marketing and matching
```

## 5. Computed Seafarer Lifecycle Statuses

The seafarer status should be computed from evidence.

| Status | Meaning | Main computed task |
|---|---|---|
| `employment_pending_contract` | Employer proceeds with candidate, but verified contract/support record is absent. | Record employment contract and joining conditions. |
| `employment_pending_embarkation` | Contract and joining terms exist, but boarding is not confirmed. | Confirm boarding / joining evidence. |
| `onboard_active` | Boarding is confirmed and disembarkation is not confirmed. | Confirm monthly service evidence. |
| `return_preparation_due` | Contract end is approaching or early disembarkation is signaled, and return arrangement is missing or stale. | Confirm seafarer return arrangement. |
| `return_in_progress` | Disembarkation is confirmed, but return/support completion is not confirmed. | Complete seafarer return support. |
| `available_update_due` | Return is completed or contract has ended and availability is stale. | Update next-voyage availability. |

## 6. Contract And Return Data To Capture

The contract or employment-support record should capture:

1. employer / shipowner client;
2. selected seafarer;
3. vessel;
4. rank / position;
5. joining date and place;
6. expected contract duration or end date;
7. joining/travel responsibility;
8. disembarkation/repatriation responsibility;
9. return destination or agreed return point;
10. replacement or early termination terms;
11. monthly work-period evidence requirements;
12. billing/service-fee basis reference.

## 7. Role Responsibilities

| Role / group | Responsibility added |
|---|---|
| Employer / shipowner user | Upload or confirm contract, joining terms, boarding evidence, work-period evidence and disembarkation/return facts where agreed. |
| Group 1 | Collect employer-side contract, joining and return/repatriation terms after the employer proceeds with a candidate. |
| Group 2 | Follow up after return and help the seafarer update next-voyage availability and needs. |
| Group 3 | Use actual work-period and service evidence as billing basis; do not bill seafarer recruitment or placement fees. |
| Group 4 | Support joining, boarding, disembarkation and return questions; record support outcomes. |
| Group 5 | Control evidence, exceptions and audit integrity. |
| AI agent | May summarize contract/return data and flag missing evidence, but may not approve contract, billing, employment or final return responsibility independently. |

## 8. Billing Link

The billing basis should not rely only on a signed contract.

The stronger basis is:

```text
verified contract
+ confirmed boarding
+ actual work-period evidence
+ commercial entitlement / service terms
= monthly service-fee basis
```

If the seafarer disembarks early, the billing task must consider:

1. actual worked days;
2. replacement terms;
3. included or extra replacement support;
4. employer-side responsibility;
5. documented reason for early disembarkation.

## 9. Seafarer Care And Retention

After the seafarer leaves the vessel, the platform should not simply close the case.

The next computed seafarer task should be:

```text
Update availability and next-voyage preference.
(Seafarer profile: {rank}, last vessel {safe vessel summary}.)
```

This is not a recruitment fee service. It is the relationship-retention loop that helps the seafarer return to matching when ready.

## 10. Next Recommended Implementation Task

Recommended next task:

```text
CPG-BIZ-090 - Voyage support records and seafarer onboard-status computation design
```

Suggested scope:

1. design the data model for contract, joining, boarding, active voyage, monthly service, disembarkation and return support records;
2. define API read/write contracts;
3. define computed statuses for seafarer profile and employer request;
4. define team tasks for Group 1, Group 2, Group 3 and Group 4;
5. define seafarer cabinet status display;
6. define billing handoff trigger based on actual work-period evidence;
7. keep no-fee seafarer boundary and scoped visibility controls.

## 11. Stage Status

This stage is documented.

No application verification has been performed yet because no product implementation exists for voyage-support records.

The next phase should be design first, then implementation and test according to the approved process:

```text
describe -> verify application -> correct/design -> implement -> test -> proceed
```
