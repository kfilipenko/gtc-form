# CPG-SEAFARER-020 — Agent Execution Guide

- Project: CrewPortGlobal.com
- Document type: Agent execution guide / leadership handoff
- Date: 2026-05-22
- GitHub issue: https://github.com/kfilipenko/gtc-form/issues/29
- Status: Published for modelling plan and execution

## 1. Executive instruction

This is a modelling and gap-analysis task.

Do not implement UI fields, database migrations, matching algorithms or production scoring.

The goal is to build the conceptual and technical model that explains how CrewPortGlobal should match:

```text
seafarer supply
    with
employer + vessel + crew request demand
```

The model must start from existing fields and identify what is missing before the team adds new fields.

## 2. Why this task matters

The current platform already has a strong seafarer profile, source-card review, consent and visibility model.

The weaker side is employer/vessel/vacancy demand.

Before adding new fields, the team needs a clear matching model showing:

```text
what data is essential;
what is already collected;
what is missing;
what must be structured;
what may remain free text;
what is a hard blocker;
what is a soft scoring criterion;
what should be visible to each role.
```

## 3. Required source documents

Read first:

```text
docs/crewportglobal/154_cpg_seafarer_019_forms_fields_database_inventory_report.md
docs/crewportglobal/153_cpg_seafarer_018_endpoint_guard_consent_addendum.md
docs/crewportglobal/149_cpg_seafarer_017_data_minimization_visibility_report.md
docs/crewportglobal/seafarer_application_mapping/source_card_visibility_matrix.md
docs/crewportglobal/seafarer_application_mapping/source_card_field_coverage_matrix.md
docs/crewportglobal/business_processes/11_seafarer_field_dictionary_and_reference_catalog_alignment.md
```

Inspect current code only to confirm field availability:

```text
projects/crewportglobal/public/create-profile/index.html
projects/crewportglobal/public/post-vacancy/index.html
projects/crewportglobal/public/verify/index.html
projects/crewportglobal/public/cabinet/index.html
projects/crewportglobal/app/backend/api/public/index.php
projects/crewportglobal/app/backend/db/migrations/*.sql
```

## 4. Required deliverable

Create:

```text
docs/crewportglobal/157_cpg_seafarer_020_supply_demand_matching_model_report.md
```

Update the documentation register if active.

## 5. Required model structure

The report must separate the two sides clearly.

### Supply side

```text
Professional Profile
Document Readiness
Verified Qualifications
Sea Service Experience
Availability and Preferences
Restricted Medical / Family / Internal Data
```

### Demand side

```text
Employer / Company Profile
Vessel Profile
Crew Request / Vacancy Requirement
Contract Terms
Operational / Legal / Risk Requirements
```

## 6. Required matching dimensions

Evaluate at least:

```text
rank / position
crew department
availability and joining date
contract duration and rotation
salary expectation vs salary offer
vessel type
vessel particulars: IMO, flag, GT, DWT, engine type, engine power, year built, trading area
required COC
required endorsements
required STCW training
medical certificate readiness
visa readiness
passport / seaman book readiness
sea-service experience by vessel type and rank
language / maritime English
previous employer references and verification status
employer/company verification
vessel verification
vacancy publication and approval status
consent and approval guard status
restricted data exclusion
```

## 7. Required matrices

### 7.1 Supply-demand matching matrix

| Matching dimension | Seafarer field/source | Employer/vacancy/vessel field/source | Existing coverage | Gap | Matching rule | Field type recommendation | Priority |
|---|---|---|---|---|---|---|---|

### 7.2 Hard blocker / soft score matrix

| Criterion | Type: hard blocker or soft score | Reason | Current support | Missing data | Suggested rule |
|---|---|---|---|---|---|

### 7.3 Field-type recommendation matrix

| Field | Side | Current form/state | Recommended type | Single/multiple | Required for MVP? | Notes |
|---|---|---|---|---|---|---|

### 7.4 Gap-to-next-task matrix

| Gap | Why it matters | Required data side | Recommended next issue | Priority |
|---|---|---|---|---|

## 8. Field-type rules

Use these rules:

```text
structured enum — for rank, department, vessel type, flag, COC type, endorsement, STCW course, visa category
single select — where only one value can be true for a request
multi-select — where several requirements/preferences can apply
date — availability, joining, expiry, issue dates
number — salary, DWT, GT, engine power, duration, years/months of experience
boolean — yes/no conditions and readiness flags
document-backed — data that must be supported by uploaded evidence
calculated — derived readiness, expiry, match score, blocker status
free text — notes, special conditions, human explanation only
```

Do not recommend free text for criteria that must be filtered, scored or validated.

## 9. Visibility principles

The model must respect the existing visibility system:

```text
owner_full
operator_general
cabinet_summary
employer_candidate
restricted_medical
internal_compliance
system_only
```

Employer matching must never use or expose:

```text
restricted medical details
family / children / next-of-kin details
religion
internal notes
raw document paths
passport / visa / seafarer ID numbers
previous employer private contact details
```

## 10. Matching readiness levels

Define levels such as:

```text
Level 0 — collected only
Level 1 — structurally complete
Level 2 — reviewed by operator
Level 3 — consent and approval guard passed
Level 4 — employer-safe candidate summary ready
Level 5 — matching/scoring eligible
```

You may refine these levels if the report explains why.

## 11. Boundaries

Do not implement:

```text
new fields in UI
new DB migrations
new matching algorithm
new employer publication behavior
new public profile behavior
employment decisions
automatic scoring in production
Stripe/OpenClaw/nginx/systemd/deployment changes
```

## 12. Required first response from agent

Before writing the full report, post a short modelling plan:

```text
which documents will be read;
which code pages will be inspected;
how supply and demand objects will be separated;
which matrices will be produced;
how field types will be assigned;
how gaps will be prioritized;
confirmation that no code or DB changes will be made.
```

Wait for approval before preparing the full report.

## 13. Acceptance criteria

The task is complete only when the report clearly answers:

```text
what data is required for matching;
what already exists;
what is missing;
which fields must be structured;
which fields may remain text;
which fields are hard blockers;
which fields are soft scoring criteria;
which gaps should be implemented next and in what sequence.
```