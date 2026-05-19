# CPG-SEAFARER-018 — Agent Execution Guide

- Project: CrewPortGlobal.com
- Document type: Agent execution guide / leadership handoff
- Date: 2026-05-19
- GitHub issue: https://github.com/kfilipenko/gtc-form/issues/27
- Status: Published for agent planning and execution

## 1. Executive instruction

This document is the leadership handoff for the next implementation slice after `CPG-SEAFARER-017`.

The agent must execute GitHub issue:

```text
CPG-SEAFARER-018 — Approval guard, consent events and restricted medical access
https://github.com/kfilipenko/gtc-form/issues/27
```

The task continues the data minimization and scoped-visibility work completed in `CPG-SEAFARER-017`.

The immediate objective is to close the controlled gaps recorded in the `149` report version `1.1`:

```text
1. versioned consent-event table/API is not final;
2. restricted medical role/capability is not final;
3. employer-facing publication and matching are still blocked until an approval guard exists;
4. owner_full access must remain account/session enforced across all routes.
```

## 2. Business reason

CrewPortGlobal must not publish, match or present a seafarer candidate to an employer merely because data exists.

A seafarer profile becomes employer-facing only after controlled conditions are satisfied:

```text
source-card readiness
operator review
required consents
safe employer payload
restricted-data exclusion
access-boundary validation
auditability
```

This task makes the platform safer for international crewing operations by adding or specifying the controls that sit between source-card collection and employer-facing presentation.

## 3. Documents to read first

Before coding, the agent must read:

```text
docs/crewportglobal/149_cpg_seafarer_017_data_minimization_visibility_report.md
docs/crewportglobal/seafarer_application_mapping/source_card_visibility_matrix.md
docs/crewportglobal/seafarer_application_mapping/source_card_field_coverage_matrix.md
docs/crewportglobal/148_cpg_seafarer_017_agent_execution_guide.md
docs/crewportglobal/147_cpg_seafarer_016_repeated_excel_source_rows_report.md
docs/crewportglobal/146_cpg_seafarer_015_excel_source_review_cards_report.md
docs/crewportglobal/business_processes/11_seafarer_field_dictionary_and_reference_catalog_alignment.md
```

If any required document is missing in the current branch, the agent must stop and report the missing document before implementation.

## 4. Implementation areas

The agent must inspect the existing implementation before deciding whether this slice can include DB changes or should produce an implementation-ready plan.

Expected files and areas to inspect:

```text
projects/crewportglobal/app/backend/api/public/index.php
projects/crewportglobal/public/create-profile/index.html
projects/crewportglobal/public/verify/index.html
projects/crewportglobal/public/cabinet/index.html
projects/crewportglobal/public/post-vacancy/index.html
tests/crewportglobal-*.spec.ts
docs/crewportglobal/seafarer_application_mapping/*.md
docs/crewportglobal/149_cpg_seafarer_017_data_minimization_visibility_report.md
```

## 5. Approval guard requirements

The agent must implement or document an exact approval guard contract.

The guard must block employer-facing publication/matching unless required conditions are satisfied.

Required checks:

```text
required source cards are reviewed or explicitly waived;
critical professional data is present;
document readiness summary exists;
employer-facing payload contains no forbidden fields;
employer_sharing consent exists and is active;
matching_preparation consent exists and is active;
no unresolved correction_requested state exists for required source cards;
restricted medical/family/internal data is excluded;
owner/session boundary is valid for owner actions;
operator/team actor is recorded for approval actions.
```

Recommended model:

```text
approval_status:
  blocked
  ready_for_operator_approval
  approved_for_matching
  approved_for_employer_presentation

approval_blockers:
  array of blocker objects

approval_audit:
  actor
  timestamp
  action
  reason
```

## 6. Consent event requirements

The current broad confirmation fields are compatibility fields only. They must not be treated as final all-purpose consent.

Required consent types:

```text
profile_review
matching_preparation
employer_sharing
document_verification
sensitive_medical_processing
reference_contact_verification
```

Each consent event must preserve or be specified to preserve:

```text
consent_id
seafarer_profile_id or draft_id
consent_type
purpose
legal_basis
text_version
language
accepted_at
withdrawn_at
source_page
actor_user_id / actor_type
metadata jsonb
```

If the agent safely implements the DB/API model, it must add tests. If safe DB migration is not appropriate in this slice, it must produce exact implementation-ready DDL/API design in the final report.

## 7. Restricted medical access requirements

General operators must not see detailed medical declarations.

Required behavior:

```text
medical certificate status / expiry remains normal readiness metadata;
detailed medical declarations remain restricted_medical;
restricted medical access requires dedicated capability;
restricted medical access is audited;
medical details never appear in cabinet task lists, employer payloads or general operator summaries.
```

Recommended capability names:

```text
seafarer.medical.read_restricted
seafarer.medical.request_correction
seafarer.medical.verify_restricted
```

## 8. Employer payload guard requirements

Employer-facing data must only be generated through the minimized safe path.

Forbidden employer fields remain:

```text
passport numbers
seafarer identity document numbers
visa numbers
children data
religion
medical history details
injury/surgery/sick-off details
internal notes
raw upload storage paths
manager authorization fields
previous employer contact names / phones / emails
raw document_metadata
raw seafarer_workspace
```

The agent must add or preserve tests proving these fields cannot leak to employer-facing payloads.

## 9. Access boundary requirements

The agent must verify or document:

```text
owner_full only for authenticated profile owner;
operator_general only for operator/team session;
employer_candidate only for authenticated employer on their own vacancy/presented candidate;
restricted_medical only for restricted medical capability;
sensitive access is auditable.
```

The agent must not broaden visibility as a workaround.

## 10. Documentation deliverables

The final implementation report should be published as:

```text
docs/crewportglobal/152_cpg_seafarer_018_approval_consent_medical_report.md
```

It must include:

```text
approval guard rules;
consent event model and implementation status;
restricted medical access model;
employer payload guard summary;
access boundary findings;
page/API surface impact;
test-to-control traceability;
remaining gaps.
```

Update the documentation register if this project convention is still active.

## 11. Test deliverables

Add focused tests proving:

```text
profile with missing consent is blocked from employer-facing presentation;
profile with unresolved required correction is blocked;
employer payload cannot include forbidden fields;
withdrawn employer_sharing consent blocks employer presentation;
general operator cannot see restricted medical details;
restricted medical details require restricted capability or remain unavailable;
owner scope does not leak to non-owner/operator/employer calls;
approval audit/status is produced or documented.
```

Run relevant regression tests:

```text
npm run test:cpg-api
create-profile focused tests
verify/operator queue tests
cabinet tests
post-vacancy/employer payload tests
seafarer visibility minimization tests
source repeated-row tests
```

## 12. Boundaries

Do not change unless explicitly necessary and documented:

```text
Stripe
OpenClaw
nginx/systemd/deployment
private Excel source
public marketing pages
employment decision logic
automatic matching scoring
payment/subscription logic
```

## 13. Required first response from agent

Before coding, the agent must post a short plan covering:

```text
files inspected;
existing approval/consent/access-control structures found;
DB migration risk;
API endpoints affected;
UI pages affected;
tests to add;
rollback boundary.
```

The plan must be approved before broad implementation.

## 14. Acceptance criteria

The task is complete only when:

```text
1. approval guard exists or is documented with exact implementation-ready contract;
2. employer-facing publication/matching is blocked without required approval and consent;
3. consent events are implemented or specified with exact DDL/API plan;
4. restricted medical access is implemented or specified with exact capability rules;
5. employer payload forbidden fields are tested;
6. owner/operator/employer/restricted scopes are documented;
7. final report is published under docs/crewportglobal/;
8. GitHub issue #27 is updated with changed files and test results.
```

## 15. Suggested message to begin execution

```text
Read issue #27 and docs/crewportglobal/151_cpg_seafarer_018_agent_execution_guide.md.
Do not change code yet.
First post a short implementation plan with inspected files, DB/API risk, pages affected, tests and rollback boundary.
```