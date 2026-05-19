# CrewPortGlobal — Seafarer Source Card Visibility Matrix

- Project: CrewPortGlobal.com
- Source of truth: private `seafarer_fields_dictionary_2026_05_18.xls`
- Implementation slice: CPG-SEAFARER-017
- Date: 2026-05-19
- Status: Internal visibility and minimization control matrix

## Control Rule

The standard Excel form remains the field-coverage source of truth, but source-field presence does not mean broad visibility.

The platform must preserve source-card coverage while minimizing exposure by purpose, user role and consent state. This matrix does not add source cards, remove Excel fields, publish seafarer profiles, implement matching or make employment decisions.

## Visibility Classes

| Visibility class | Meaning |
|---|---|
| `public_candidate_summary` | Professional profile data that can support a reviewed matching summary without sensitive details. |
| `employer_after_candidate_consent` | Professional or readiness data that may be shown to an employer only after review and candidate consent. |
| `operator_review` | Operational review data visible to general operator workflows, excluding restricted medical/family/internal fields. |
| `restricted_medical` | Health-related declaration data requiring a restricted medical workflow and capability boundary. |
| `internal_compliance` | Family, reference, consent, welfare, identity-detail or internal-process data not suitable for employer payloads. |
| `system_only` | Owner/team/system process fields that are not ordinary seafarer-editable or employer-facing data. |

## Source Card Visibility

| Source card | Source section | Visibility class | Runtime handling |
|---|---|---|---|
| PERS-001 | Employee ID Number | `system_only` | Not user-editable; future GTC_USER_ID/employee assignment boundary. |
| PERS-002 | Position apply for / Type of vessel | `public_candidate_summary` | Rank, department and vessel preferences can support professional summary. |
| PERS-003 | Personal details | `operator_review` | Legal identity details remain operator review data; religion is restricted. |
| PERS-004 | Permanent address | `operator_review` | Hidden from employer payload; permanent address removed from non-owner workspace scopes. |
| PERS-005 | Registration address | `operator_review` | Hidden from employer payload; operator/cabinet use only where needed. |
| PERS-006 | Contact details | `employer_after_candidate_consent` | Contact data is not included in employer candidate payload in this slice. |
| PERS-007 | Next of kin / beneficiary | `internal_compliance` | Names/phones hidden from cabinet task text and non-owner summaries. |
| PERS-008 | Children records | `internal_compliance` | Child names, birth dates and gender are masked outside owner scope. |
| PERS-009 | Physical details | `operator_review` | Operational sizing can remain visible; hair/eye color is restricted unless document-specific. |
| QUAL-001 | National identity documents and visas | `operator_review` | Passport/ID/visa numbers and authority fields are excluded from employer payload. |
| QUAL-002 | Education | `operator_review` | Education can support review; employer sharing requires later reviewed summary and consent. |
| QUAL-003 | Certificate of competence | `employer_after_candidate_consent` | Certificate readiness can be summarized; raw document identifiers remain protected. |
| QUAL-004 | Endorsements | `employer_after_candidate_consent` | Reviewed endorsement summary can be employer-facing after consent. |
| QUAL-005 | Training courses | `employer_after_candidate_consent` | Reviewed training summary can be employer-facing after consent. |
| EXP-001 | Sea service history | `employer_after_candidate_consent` | Professional sea-service summary can be employer-facing after review and consent. |
| EXP-002 | Previous employer references | `internal_compliance` | Reference names, phone numbers and emails are masked outside owner scope. |
| MED-001 | Medical declarations | `restricted_medical` | Medical answers/details are masked outside owner/restricted future medical scope. |
| MED-002 | Seafarer's obligation | `internal_compliance` | Consent/readiness boundary only; no employment approval. |
| MED-003 | Personal data processing agreement | `internal_compliance` | Current fields remain saved; final versioned consent model is still planned. |
| MED-004 | Information source and comments | `internal_compliance` | Comments and information source are removed from non-owner matching/publication summaries. |
| MED-005 | Authorization for pre-employment process | `system_only` | Future owner/team process field; not user-editable and not employer-facing. |

## Employer-Facing Exclusion List

The employer candidate payload must not include:

1. Passport, seafarer ID, national ID, visa or seaman's book numbers.
2. Children data.
3. Religion.
4. Detailed medical history, injury, surgery, sick-off or health-problem details.
5. Next-of-kin, beneficiary or previous-employer contact names, phone numbers or emails.
6. Internal notes, manager authorization fields or pre-employment authorization notes.
7. Raw upload storage paths or protected document identifiers.
8. Broad `document_metadata` or raw `seafarer_workspace` objects.

The current employer candidate payload is limited to professional candidate fields plus `document_summary` readiness metadata.

## Operator And Cabinet Rules

General operator scope uses `operator_general`.

It may see source-card status, professional fields, operational expiry/status metadata and masked repeated-record summaries. It does not receive restricted medical details, child details, family contact details, reference contacts or raw document identifiers.

Cabinet task text must not expose restricted content. Restricted card correction tasks show a generic correction message and direct the seafarer back to the source-card section.

Owner/full seafarer scope remains available to the seafarer profile owner and preserves saved source-field coverage for correction and future approved workflows.

## Consent Event Model

The final consent model requires a separate versioned consent-event store.

Required consent types:

1. `profile_review`
2. `matching_preparation`
3. `employer_sharing`
4. `document_verification`
5. `sensitive_medical_processing`
6. `reference_contact_verification`

Required event fields:

1. `consent_type`
2. `purpose`
3. `legal_basis`
4. `text_version`
5. `language`
6. `accepted_at`
7. `withdrawn_at`
8. `source_page`
9. `actor_user_id`

CPG-SEAFARER-017 exposes this model as an implementation-ready API/documentation boundary. It does not create a database consent migration.

## Remaining Boundary

This matrix prepares strict readiness summary and full-profile approval guard work. Those later slices must use the visibility classes in this matrix and must not fall back to unrestricted source-card payloads.
