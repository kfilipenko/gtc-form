# CPG-SEAFARER-017 — Agent Execution Guide

- Project: CrewPortGlobal.com
- Document type: Agent execution guide / leadership handoff
- Date: 2026-05-19
- GitHub issue: https://github.com/kfilipenko/gtc-form/issues/26
- Status: Published for agent execution

## 1. Executive instruction

This document is the leadership handoff for the next implementation slice after `CPG-SEAFARER-016`.

The task is approved by Project Owner for agent execution.

The agent must execute GitHub issue:

```text
CPG-SEAFARER-017 — Data minimization, scoped visibility and sensitive-field cleanup
https://github.com/kfilipenko/gtc-form/issues/26
```

The purpose is not to add more seafarer fields. The purpose is to make the already expanded and normalized seafarer source-card workflow safe, legally cleaner and operationally ready for an international crewing platform.

## 2. Business reason

CrewPortGlobal is moving from an Excel-style seafarer application form to a controlled maritime workforce platform.

The private Excel workbook remains a structural source of truth for field coverage, but it must not become a public one-page intake form.

The platform must separate:

```text
matching profile
qualification and document dossier
restricted medical declarations
family / beneficiary records
internal compliance workflow
employer-facing candidate summary
```

This separation is required because crewing data includes identity documents, employment history, family contacts, health-related declarations and internal review notes.

The platform should support maritime recruitment and placement operations without unnecessary exposure of sensitive personal data.

## 3. Controlling principles

The agent must follow these principles:

```text
Preserve source-card coverage.
Reduce unnecessary exposure.
Do not delete normalized records created in CPG-SEAFARER-016.
Do not treat the old aggregated cards as final taxonomy.
Do not publish candidates automatically.
Do not expose sensitive fields to employers or general operator summaries.
Do not change unrelated infrastructure.
```

## 4. Source documents to read first

Before changing code, the agent must read the following documents in order:

```text
docs/crewportglobal/business_processes/11_seafarer_field_dictionary_and_reference_catalog_alignment.md
docs/crewportglobal/144_cpg_seafarer_013_excel_aligned_form_cards_report.md
docs/crewportglobal/145_cpg_seafarer_014_excel_source_truth_precheck_report.md
docs/crewportglobal/146_cpg_seafarer_015_excel_source_review_cards_report.md
docs/crewportglobal/147_cpg_seafarer_016_repeated_excel_source_rows_report.md
docs/crewportglobal/seafarer_application_mapping/source_card_field_coverage_matrix.md
```

If `147_cpg_seafarer_016_repeated_excel_source_rows_report.md` or the coverage matrix are not present in the current Git branch, the agent must stop implementation and first locate the latest published server copy or report that the repository is missing required source documentation.

## 5. Current approved direction

The Project Owner approved the following direction:

The form and backend should not continue growing as a broad Excel clone.

Instead, each field must be assigned a visibility/sensitivity class.

Approved visibility classes:

```text
public_candidate_summary
employer_after_candidate_consent
operator_review
restricted_medical
internal_compliance
system_only
```

These classes must drive future UI, API, operator review, cabinet tasks and employer-facing candidate payloads.

## 6. Standard profile fields to keep visible

The following fields remain valid for standard seafarer profile and matching preparation:

```text
full legal name
primary email
primary phone
rank / position
crew department
availability
availability date
nationality / citizenship
current country
residence country
nearest airport
preferred vessel types
identity document metadata needed for review
passport / seaman book / seafarer ID expiry metadata
COC / certificates of competence
endorsements
STCW and training certificates
education records
sea-service records
previous employer references with restricted visibility
medical certificate status / expiry / restrictions only
uploaded document links by source card
matching request after review
```

## 7. Fields to hide, move or restrict

The following fields must not remain broadly visible in the ordinary profile or matching workflow:

```text
religion
children records
detailed medical history
injury / illness / health-problem details
surgery / operation details
sick-off details
hair colour / eye colour unless specifically required by an identity-document workflow
manager notes
pre-employment authorization notes
internal team authorization fields
```

Required handling:

```text
religion -> remove from standard intake or convert to optional restricted welfare/dietary note only if lawful operational reason is defined
children records -> move behind restricted family/benefit workflow if later required
detailed medical fields -> restricted_medical only
manager/internal notes -> internal_compliance or system_only
hair/eye colour -> not matching data; only document-specific if needed
```

## 8. Consent event model

The current broad confirmation model is not enough.

The agent must implement or document an implementation-ready plan for versioned consent events.

Required consent types:

```text
profile_review
matching_preparation
employer_sharing
document_verification
sensitive_medical_processing
reference_contact_verification
```

Each consent event should preserve:

```text
consent_type
purpose
legal_basis
text_version
language
accepted_at
withdrawn_at
source_page
actor / seafarer identifier
```

A generic “I confirm” must not be used to cover all purposes.

## 9. Employer-facing exclusion rule

No employer-facing candidate payload, future employer card or matching presentation may include:

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
```

Employer-facing data may include only reviewed and consented professional/matching data, such as:

```text
rank
availability
experience summary
vessel-type experience
certificate readiness
document expiry status where appropriate
```

## 10. Operator and cabinet rules

`/verify/` and `/cabinet/` must respect visibility classes.

Required behavior:

```text
general operator review sees source-card status and required operational fields
restricted medical data is hidden unless restricted role/capability exists
cabinet correction tasks explain what must be corrected without exposing unnecessary medical/family details
source-card review taxonomy from CPG-SEAFARER-015/016 remains primary
legacy aggregated cards remain fallback only
```

## 11. Implementation boundaries

Do not change these areas in this slice unless absolutely necessary and documented:

```text
Stripe
OpenClaw
nginx/systemd/deployment
public vacancy publication logic
automatic matching approval
employment decision logic
original private Excel file
```

The task may update:

```text
/create-profile/
/verify/
/cabinet/
API response shaping
visibility mapping helpers
consent metadata or planned migration
seafarer documentation
tests
```

## 12. Required documentation deliverables

The agent must create or update documentation with:

```text
field visibility matrix
source-card-to-visibility mapping
sensitive data handling note
consent event model
employer-facing payload exclusion list
operator/cabinet visibility rules
implementation report for CPG-SEAFARER-017
```

Recommended implementation report name:

```text
docs/crewportglobal/149_cpg_seafarer_017_data_minimization_visibility_report.md
```

## 13. Required tests

The agent must add focused tests proving:

```text
source repeated records still save/reload
restricted fields do not appear in employer-facing payloads
medical restricted fields are not visible in general operator/cabinet summaries
consent events are versioned and reloadable, or an implementation-ready consent plan is documented
legacy fallback cards still work but are not primary taxonomy
section resubmission still resets canonical source-card review states
```

The agent must also run relevant existing regression tests for:

```text
create-profile
verify
cabinet
operator queue
cpg-api
```

## 14. Acceptance criteria

The task is complete only when:

```text
1. each source-card field has a documented visibility/sensitivity class;
2. sensitive fields are not broadly visible in standard profile, operator/cabinet summaries or employer-facing payloads;
3. consent is represented as purpose-specific versioned events or an implementation-ready migration/API plan;
4. source-card coverage and repeated records from CPG-SEAFARER-016 remain intact;
5. focused and regression tests pass;
6. the final implementation report is added under docs/crewportglobal/;
7. GitHub issue #26 is updated with a final execution summary.
```

## 15. Final instruction to agent

Do not rush to code.

First produce a short implementation plan in the working chat or issue comment, listing:

```text
files to inspect
fields to classify
API/UI surfaces affected
tests to add
rollback boundary
```

Only after the plan is clear, proceed with implementation.

Before implementation, create a backup or work on a dedicated branch.

After implementation, document all changes and provide test evidence.