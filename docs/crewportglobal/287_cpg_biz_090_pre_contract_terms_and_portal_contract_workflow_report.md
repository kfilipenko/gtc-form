# CPG-BIZ-090 - Pre-Contract Terms And Portal Contract Workflow Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Business-process amendment report
- Source task: Project Owner instruction after CPG-BIZ-089
- Version: 1.0
- Date: 2026-06-03
- Status: Documented for Project Owner review

## 1. Purpose

This report records the extension of the seafarer voyage-support process with pre-contract terms.

The purpose is to make joining, travel, return, repatriation, replacement and monthly-service evidence conditions visible before the parties reach final contract formation.

## 2. Business Principle

CrewPortGlobal should not discover critical travel and return conditions only after a seafarer has been accepted or has finished a voyage.

The platform should collect these conditions during:

1. employer / shipowner crew-request preparation;
2. seafarer profile preparation;
3. candidate comparison and acceptance review;
4. future portal contract drafting.

This makes the workflow more transparent for both parties and creates a stronger evidence basis for later service support and billing.

## 3. Structured Employer-Side Terms

Employer / vacancy forms should later include structured preliminary terms:

1. joining place;
2. joining travel responsibility;
3. joining travel payer;
4. expected contract duration;
5. expected disembarkation conditions;
6. repatriation / return responsibility;
7. return destination or acceptable return-point rule;
8. replacement / early termination rule;
9. monthly service or work-period evidence expected from the employer;
10. unresolved items marked as `to_be_agreed`.

## 4. Structured Seafarer-Side Preferences

Seafarer profile forms should later include structured preferences:

1. preferred joining location or travel limitation;
2. return destination;
3. preferred return responsibility model;
4. willingness to accept employer-arranged travel;
5. willingness to accept self-arranged travel where reimbursed or separately agreed;
6. unresolved preferences marked as `to_be_agreed`.

## 5. `to_be_agreed` Rule

The value `to_be_agreed` is allowed during preparation. It means:

```text
the condition is material, but not finalized yet
```

It must not silently become a final contract term.

Before contract generation or final confirmation, `to_be_agreed` fields must be:

1. resolved into explicit terms; or
2. recorded as a controlled exception with human approval and clear responsibility.

## 6. Future Portal Contract Workflow

The future contract workflow should use already verified platform data:

```text
verified employer
+ verified vessel
+ structured crew request
+ selected seafarer profile
+ agreed joining / return / replacement / billing terms
= draft contract / employment-support agreement on the portal
```

The platform should support a future controlled contract flow:

1. generate draft contract from structured data;
2. show unresolved items before signature/confirmation;
3. require both parties or authorized representatives to confirm material terms;
4. store contract evidence and audit events;
5. use the contract as the basis for embarkation, service evidence, disembarkation, return and billing tasks.

## 7. Vacancy Transparency

Safe preliminary terms may later be shown in vacancy previews:

1. joining place;
2. expected contract duration;
3. travel responsibility;
4. return responsibility;
5. items to be agreed.

This helps the seafarer understand the work conditions before deeper review, without exposing restricted employer or commercial details.

## 8. Documents Updated

| File | Update |
|---|---|
| `business_processes/15_crewportglobal_commercial_operating_cycle.md` | Added pre-contract terms before candidate acceptance and future portal contract draft logic. |
| `business_processes/12_crew_formation_service_business_process_manual.md` | Added employer and seafarer form responsibilities for preliminary contract terms and `to_be_agreed` handling. |
| `business_processes/14_standard_form_lifecycle_and_validation_module.md` | Added pre-contract terms to the standard form lifecycle for matching, vacancy transparency, contract drafting and audit evidence. |
| `286_cpg_biz_089_seafarer_voyage_return_support_process_report.md` | Added pre-contract data collection addendum. |

## 9. Next Recommended Task

Recommended next implementation-planning task:

```text
CPG-BIZ-091 - Pre-contract field matrix for seafarer and employer/vacancy forms
```

Suggested scope:

1. define exact `S-*` and `R-*` field codes for joining, travel, return and replacement terms;
2. define allowed catalog values, including `to_be_agreed`;
3. define which terms may be visible in vacancy preview;
4. define which terms become blockers before contract generation;
5. define future contract draft payload;
6. define tests for saving, completeness and matching-readiness impact.

## 10. Stage Status

This stage is documented.

No product code, database or runtime changes were made.
