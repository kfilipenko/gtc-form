# CPG-SEAFARER-021 — Agent Execution Guide

- Project: CrewPortGlobal.com
- Document type: Agent execution guide / leadership handoff
- Date: 2026-05-22
- GitHub issue: https://github.com/kfilipenko/gtc-form/issues/30
- Status: Published for planning note and execution

## 1. Executive instruction

This is a demand-side normalization planning task.

Do not implement UI changes, database migrations, backend/API changes, tests, matching algorithms, scoring, publication behavior or employment decision logic.

The purpose is to convert the CPG-SEAFARER-020 supply-demand matching model into a concrete structured-field plan for the employer/vessel/vacancy side.

## 2. Business reason

CrewPortGlobal already has a comparatively strong seafarer supply model.

The weak point is demand-side structure. Current employer/vacancy data still relies too much on free-text requirements.

Before any matching algorithm can be implemented, the platform needs a normalized demand model covering:

```text
Employer / Company Profile
Vessel Profile
Crew Request / Vacancy Requirement
Contract Terms
Operational / Legal / Risk Requirements
```

## 3. Required source documents

Read first:

```text
docs/crewportglobal/157_cpg_seafarer_020_supply_demand_matching_model_report.md
docs/crewportglobal/154_cpg_seafarer_019_forms_fields_database_inventory_report.md
docs/crewportglobal/153_cpg_seafarer_018_endpoint_guard_consent_addendum.md
docs/crewportglobal/149_cpg_seafarer_017_data_minimization_visibility_report.md
docs/crewportglobal/00_documentation_register.md
```

Inspect code read-only only as needed:

```text
projects/crewportglobal/public/post-vacancy/index.html
projects/crewportglobal/public/vacancies/index.html
projects/crewportglobal/app/backend/api/public/index.php
projects/crewportglobal/app/backend/db/migrations/*.sql
```

## 4. Required deliverable

Create:

```text
docs/crewportglobal/158_cpg_seafarer_021_demand_side_normalization_plan.md
```

Update the documentation register if active.

## 5. Target object model

The report must keep these objects separate:

```text
Employer / Company Profile
Vessel Profile
Crew Request / Vacancy Requirement
Contract Terms
Operational / Legal / Risk Requirements
```

Do not collapse vessel data into vacancy notes.

Do not keep required COC, endorsements, STCW, visa, language or experience thresholds only inside free-text `requirements`.

## 6. Required field planning

### 6.1 Employer / Company Profile

Evaluate:

```text
company name
company legal type
company registration number
country / jurisdiction
employer role
role in company
authorized representative
company verification status
authority evidence documents
billing / service status
risk / sanctions / compliance status if applicable
```

### 6.2 Vessel Profile

Evaluate:

```text
vessel name
IMO number
flag
vessel type
year built
GT
DWT
engine type
engine power
main engine model if needed
trading area
route region
class / classification society if needed
ISM manager if different from employer
vessel verification status
safe manning / crew complement evidence if needed
```

### 6.3 Crew Request / Vacancy Requirement

Evaluate:

```text
required rank
crew department
number of positions
joining date
earliest/latest joining window
joining port
sign-off port
required vessel type experience
required rank experience
required sea-service months/years
required COC
required endorsements
required STCW/training
required visa
required language / maritime English level
required medical certificate validity
required passport/seaman book validity
must-have requirements
nice-to-have requirements
disqualifying requirements
```

### 6.4 Contract Terms

Evaluate:

```text
salary min/max
currency
salary negotiable flag
contract duration value
contract duration unit
rotation pattern
leave / travel / repatriation terms
overtime / bonus / allowance notes if needed
CBA / SEA reference if needed
```

### 6.5 Operational / Legal / Risk Requirements

Evaluate:

```text
trading area risk
war/piracy/high-risk area flag
cargo type if relevant
sanctions/compliance restrictions
flag-state or client-specific requirements
special operations: tanker, offshore, passenger, DP, polar, crane, hazardous cargo
```

## 7. Required matrices

### 7.1 Current-to-target field matrix

| Object | Current field/source | Current type | Target normalized field | Recommended type | Required for MVP | Notes |
|---|---|---|---|---|---|---|

### 7.2 Field type matrix

| Field | Object | Type | Single/multiple | Enum/catalog needed? | Document-backed? | Calculated? | Priority |
|---|---|---|---|---|---|---|---|

### 7.3 Hard blocker / soft score matrix

| Demand criterion | Hard blocker or soft score | Reason | Required data | Operator override allowed? | Priority |
|---|---|---|---|---|---|

### 7.4 Evidence matrix

| Field/group | Evidence needed? | Evidence document type | Reviewed by operator? | Blocks publication/matching? | Notes |
|---|---|---|---|---|---|

### 7.5 Visibility/publication matrix

| Field/group | Employer owner | Operator | Public vacancy board | Seafarer applicant | Employer candidate matching | Notes |
|---|---|---|---|---|---|---|

### 7.6 Implementation sequence matrix

| Future task | Scope | Depends on | Expected artifact | Priority |
|---|---|---|---|---|

## 8. Field type rules

Use structured fields for all data that will be filtered, scored, validated or used as a blocker.

Recommended types:

```text
structured enum
single select
multi-select
date
number
boolean
document-backed
calculated
free text only for notes and special conditions
```

## 9. Publication and visibility rules

Separate:

```text
employer-owner data
operator review data
public vacancy board data
seafarer applicant visible data
internal/system-only compliance data
future matching payload data
```

Public vacancy board must not expose internal compliance/risk fields unless explicitly approved.

Seafarer applicant view should receive enough information to decide whether to apply, but not unnecessary internal employer-risk metadata.

## 10. Boundaries

Do not implement:

```text
UI changes
DB migrations
backend/API changes
test changes
matching algorithm
scoring implementation
publication behavior
employment decision logic
Stripe/OpenClaw/nginx/systemd/deployment changes
```

## 11. Required first response from agent

Before writing the full report, post a short planning note:

```text
which documents will be read;
which current demand-side files will be inspected;
how the five demand objects will be separated;
which matrices will be produced;
how MVP vs later-stage fields will be prioritized;
confirmation that no UI/DB/backend/test changes will be made.
```

Wait for approval before preparing the full report.

## 12. Acceptance criteria

The task is complete when the report clearly answers:

```text
what demand-side fields are needed;
which current fields can be reused;
which new fields are required;
which fields are structured vs free text;
which fields are hard blockers vs soft scoring criteria;
which fields require evidence/operator review;
which fields are public vs internal;
which future implementation tasks should follow and in what order.
```