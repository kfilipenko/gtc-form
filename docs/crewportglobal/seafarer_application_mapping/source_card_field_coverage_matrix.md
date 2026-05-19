# CrewPortGlobal — Seafarer Source Card Field Coverage Matrix

- Project: CrewPortGlobal.com
- Source of truth: private `seafarer_fields_dictionary_2026_05_18.xls`
- Workbook sheets: `PERS`, `QUAL`, `EXPERIENCE`, `MEDICAL`, `DROPDOWN_LISTS`
- Implementation slice: CPG-SEAFARER-016
- Date: 2026-05-19
- Status: Internal implementation coverage matrix

## Control Rule

The standard Excel form is the source of truth. Platform source cards, repeated rows, field groups and review records must follow the Excel source. No invented cards, reduced sections, suppressed catalogs, profile publication, matching decision or employment decision is introduced by this matrix.

## Coverage Legend

- `UI`: field is present in `/create-profile/` or intentionally non-user-actionable.
- `Save`: field is accepted in `document_metadata.seafarer_workspace`.
- `API`: field or repeated row is returned by `/api/v1/seafarer/workspace` and draft payload structured workspace.
- `Operator`: field or normalized row is visible in `/verify/` through structured workspace summary, readiness cards or raw detail JSON.
- `Cabinet`: field or normalized row is visible in `/cabinet/` where user-actionable or task-relevant.
- `Document links`: uploaded protected document metadata is grouped by approved source card where an upload type maps to that card.

## Canonical Source Cards

| Source card | Excel sheet / section | UI | Save | API | Operator | Cabinet | Document links | CPG-SEAFARER-016 status |
|---|---|---:|---:|---:|---:|---:|---:|---|
| PERS-001 | Employee ID Number | N/A owner/system field | N/A | Readiness only | Yes | No | N/A | Non-user-actionable until GTC_USER_ID/employee assignment is approved |
| PERS-002 | Position apply for / Type of vessel | Yes | Yes | Yes | Yes | Yes | N/A | Covered by rank, department and vessel preferences |
| PERS-003 | Personal details | Yes | Yes | Yes | Yes | Yes | N/A | Covered by personal/name components |
| PERS-004 | Permanent address | Yes | Yes | Yes | Yes | Yes | N/A | Missing region/country drift corrected; `permanent_region` and `residence_country` now persisted |
| PERS-005 | Registration address | Yes | Yes | Yes | Yes | Yes | N/A | Missing `registration_region` drift corrected |
| PERS-006 | Contact details | Yes | Yes | Yes | Yes | Yes | N/A | Secondary mobile and home phone added; primary phone remains top-level profile field |
| PERS-007 | Next of kin / beneficiary | Yes | Yes | Yes | Yes | Yes | N/A | Missing `kin_mobile` drift corrected |
| PERS-008 | Children records | Yes | Yes | Yes | Yes | Yes | N/A | Repeated lines normalized as `children_records[]` with source row retention |
| PERS-009 | Physical details | Yes | Yes | Yes | Yes | Yes | N/A | Covered by physical details section |
| QUAL-001 | National identity documents and visas | Yes | Yes | Yes | Yes | Yes | Yes | Missing Seafarer ID / Seaman's Book series-authority-expiry drift corrected; documents grouped from `passport_or_id` and `seamans_book` |
| QUAL-002 | Education | Yes | Yes | Yes | Yes | Yes | Optional future link | Normalized as `education_records[]`; structured table stores institution, dates, specialisation and grade |
| QUAL-003 | Certificate of competence | Yes | Yes | Yes | Yes | Yes | Yes | Normalized as `coc_certificates[]`; protected uploads grouped from `certificate_of_competency` |
| QUAL-004 | Endorsements | Yes | Yes | Yes | Yes | Yes | Partial | Normalized as `endorsements[]`; `other_professional_evidence` currently maps here when used |
| QUAL-005 | Training courses | Yes | Yes | Yes | Yes | Yes | Yes | Comma/list values normalized as `training_courses[]`; structured table stores each course row |
| EXP-001 | Sea service history | Yes | Yes | Yes | Yes | Yes | Yes | Latest service plus additional repeated lines normalized as `sea_service_history[]` |
| EXP-002 | Previous employer references | Yes | Yes | Yes | Yes | Yes | Partial | Two source rows normalized as `previous_employer_references[]`; maritime CV / experience documents can support this card |
| MED-001 | Medical declarations | Yes | Yes | Yes | Yes | Yes | Yes | Medical answers/details normalized as `medical_declarations[]`; sensitive payload remains controlled |
| MED-002 | Seafarer's obligation | Yes | Yes | Readiness | Yes | Task-level | N/A | Covered by consent details and readiness card; no employment approval introduced |
| MED-003 | Personal data processing agreement | Yes | Yes | Yes | Yes | Yes | N/A | Covered by consent details and matching publication data-processing confirmation |
| MED-004 | Information source and comments | Yes | Yes | Yes | Yes | Yes | N/A | Covered by publication/consent comments |
| MED-005 | Authorization for pre-employment process | N/A owner/team field | N/A | Readiness only | Yes | No | N/A | Non-user-actionable; remains future Project Owner / crewing-manager control |

## Normalized Repeated Blocks

| Repeated source block | Source card | Current normalized API key | Structured persistence | Operator visibility | Cabinet visibility |
|---|---|---|---|---|---|
| Children rows | PERS-008 | `source_repeated_records.children_records[]` | JSON source rows | Summary count + detail JSON | Dedicated Children records section |
| Identity documents and visas | QUAL-001 | `source_repeated_records.identity_documents_and_visas[]` | JSON source rows | Summary count + detail JSON | Dedicated Identity documents and visas section |
| Education records | QUAL-002 | `source_repeated_records.education_records[]` | `seafarer_education_records` | Summary count + structured section | Education section |
| COC / certificates | QUAL-003 | `source_repeated_records.coc_certificates[]` | `seafarer_certificates` | Summary count + structured section | Certificates section |
| Endorsements | QUAL-004 | `source_repeated_records.endorsements[]` | `seafarer_certificates` with `certificate_group='endorsement'` | Summary count + detail section | Endorsements section |
| Training courses | QUAL-005 | `source_repeated_records.training_courses[]` | `seafarer_training_records` | Summary count + structured section | Training section |
| Sea service history | EXP-001 | `source_repeated_records.sea_service_history[]` | `seafarer_sea_service_records` | Summary count + structured section | Sea service section |
| Previous employer references | EXP-002 | `source_repeated_records.previous_employer_references[]` | JSON source rows | Summary count + detail JSON | Previous employer references section |
| Medical declarations | MED-001 | `source_repeated_records.medical_declarations[]` | `seafarer_medical_declarations.sensitive_payload` | Summary count + structured/detail JSON | Medical declarations section |
| Uploaded document links per source card | QUAL/EXP/MED cards | `source_card_document_links` | `uploaded_documents` metadata only | Summary count + detail JSON | Source card document links section |

## Remaining Controlled Gaps

- `PERS-001` and `MED-005` are intentionally not user-editable because they are owner/team process fields.
- Repeated rows are normalized from the current practical UI format. A future owner-approved dynamic row editor may replace comma/newline entry without changing source card codes.
- `QUAL-002` education document links and `EXP-002` reference evidence links use the current protected upload taxonomy; any new upload type must be separately approved before publication.
- This slice prepares strict readiness summary and full-profile approval guard but does not implement approval, publication, matching or employment decisions.
