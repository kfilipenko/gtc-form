# CPG-DEMAND-004 - Existing DB And Excel Catalog Reconciliation For Demand Matching

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Read-only DB / Excel / catalog reconciliation report
- Source task: #34 - CPG-DEMAND-004
- Version: 1.0
- Date: 2026-05-23
- Status: Read-only inspection completed; no DB/code/runtime changes

## 1. Purpose And Project Owner Correction

This task is practical reconciliation, not a new schema design task.

Document 162 remains the accepted demand schema/API implementation plan. This report checks the factual current state of:

1. the PostgreSQL database;
2. the existing Excel-derived reference catalog import;
3. current `reference_catalogs` / `reference_catalog_values`;
4. current seafarer supply records;
5. current employer/company/vessel/vacancy demand records.

Main question:

```text
Are the existing DB tables and Excel-derived catalogs sufficient to start automated request-offer matching,
or is additive catalog/schema cleanup required first?
```

Answer:

```text
The existing DB/catalog state is sufficient for a limited internal matching-readiness prototype,
but not sufficient for automated request-offer matching or candidate proposal.

Before automated matching, CrewPortGlobal needs an additive demand reconciliation slice that links demand fields
to catalogs and converts free-text requirements into structured requirement records.
```

No UI, backend/API, DB schema, DDL/DML, tests, runtime services, matching/scoring runtime, publication behavior or employment-decision logic were changed.

## 2. Existing DB Inspection Result

Read-only DB identity:

| Item | Value |
|---|---|
| Database | `gtc_db` |
| User | `gtc_user` |
| Relevant application schema | `crewportglobal` |
| Inspection time | `2026-05-23 07:07 UTC` |

The app connection defaults in `projects/crewportglobal/app/backend/api/lib/bootstrap.php` also point to:

```text
host=127.0.0.1
port=5432
dbname=gtc_db
user=gtc_user
```

No database writes were executed.

Current `crewportglobal` tables include:

```text
users
user_auth_identities
user_roles
user_credentials
user_sessions
user_profile_photos
seafarer_profiles
seafarer_person_details
seafarer_emergency_contacts
seafarer_education_records
seafarer_certificates
seafarer_training_records
seafarer_sea_service_records
seafarer_medical_declarations
seafarer_matching_preferences
seafarer_publication_snapshots
seafarer_consent_events
employer_companies
company_users
vessels
vacancy_requests
vacancy_applications
uploaded_documents
reference_catalogs
reference_catalog_values
registration_audit_events
access_* / admin_* tables
```

Safe aggregate counts:

| Table | Rows | Matching relevance |
|---|---:|---|
| `users` | 1011 | Account foundation. |
| `seafarer_profiles` | 636 | Supply-side profile foundation. |
| `employer_companies` | 381 | Demand-side company foundation. |
| `company_users` | 376 | Company representative linkage. |
| `vessels` | 107 | Demand-side vessel foundation. |
| `vacancy_requests` | 151 | Demand-side crew request foundation. |
| `vacancy_applications` | 8 | Candidate-to-vacancy workflow state. |
| `uploaded_documents` | 1 | Document evidence metadata foundation. |
| `seafarer_person_details` | 80 | Structured supply-side personal/profile details. |
| `seafarer_certificates` | 87 | Structured supply-side COC/endorsement records. |
| `seafarer_training_records` | 117 | Structured supply-side training records. |
| `seafarer_sea_service_records` | 53 | Structured supply-side sea-service records. |
| `seafarer_matching_preferences` | 108 | Structured supply-side matching preference records. |

The public schema contains a legacy table:

```text
public.crewportglobal_seafarer_profiles
```

It has columns for `rank`, `department` and `vessel_experience`, but currently has zero rows, so it does not add usable matching data.

## 3. Existing Migration And Import-Script Inspection Result

Relevant existing migrations:

| Migration | Existing role | Demand/supply matching relevance |
|---|---|---|
| `001_create_registration_foundation.sql` | Users, seafarer profiles, employer companies, company users, vessels | Creates core company/vessel/supply records but demand fields remain basic. |
| `002_extend_seafarer_profiles_practical_fields.sql` | Practical seafarer profile fields | Adds supply rank, department, nationality/residence, vessel preferences, salary expectation. |
| `003_create_vacancy_requests.sql` | Vacancy request foundation | Stores rank, department, vessel type, join date, duration, salary, country and requirements, mostly text/scalar. |
| `004_create_vacancy_applications.sql` | Candidate application workflow | Supports application state but not matching criteria. |
| `005_extend_vacancy_applications_employer_shortlist.sql` | Employer shortlist actions | Supports post-presentation workflow. |
| `007_create_uploaded_documents.sql` | Protected document metadata | Evidence metadata exists but only one uploaded document currently. |
| `011_create_reference_catalogs.sql` | Reference catalog foundation | Creates catalog and value tables used by Excel import. |
| `012_create_seafarer_workspace_records.sql` | Structured seafarer records | Adds supply-side structured records and catalog links. |
| `013_create_seafarer_consent_events.sql` | Consent events | Supports employer sharing / matching preparation consent events. |

Importer inspected:

```text
projects/crewportglobal/scripts/import_seafarer_reference_catalogs.py
```

It maps 24 Excel `DROPDOWN_LISTS` headers into CrewPortGlobal catalog codes, writes review artifacts outside Git and does not apply SQL itself.

Project requirements include:

```text
xlrd==2.0.1
```

The system `python3` environment used during this read-only inspection did not have `xlrd` installed, so the workbook was not re-parsed directly from that interpreter. The already-generated review JSON/SQL/Markdown artifacts were present and were inspected read-only.

## 4. Excel Source / Import Artifact Availability

Private source and generated artifacts are present:

| Artifact | Status |
|---|---|
| `/var/www/crewportglobal-private-sources/seafarer_fields/incoming/seafarer_fields_dictionary_2026_05_18.xls` | Present |
| `/var/www/crewportglobal-private-sources/seafarer_fields/processed/seafarer_reference_catalogs_review_20260518T191557Z.json` | Present |
| `/var/www/crewportglobal-private-sources/seafarer_fields/processed/seafarer_reference_catalogs_seed_20260518T191557Z.sql` | Present |
| `/var/www/crewportglobal-private-sources/seafarer_fields/processed/seafarer_reference_catalogs_summary_20260518T191557Z.md` | Present |

Generated artifact summary:

| Metric | Value |
|---|---:|
| Source sheet | `DROPDOWN_LISTS` |
| Catalogs | 24 |
| Values | 1180 |
| Duplicates skipped | 0 for all 24 catalogs |

## 5. Reference Catalog Table Status

Current DB reference catalog status:

| Metric | Value |
|---|---:|
| `reference_catalogs` rows | 24 |
| `reference_catalog_values` rows | 1180 |
| Active catalogs | 24 |
| Published catalogs | 24 |
| Active values | 1180 |
| Published values | 1180 |
| Pending owner review catalogs | 0 |
| Pending owner review values | 0 |

All 24 generated Excel catalogs are present in DB and have matching value counts.

## 6. Excel Catalog To DB Catalog Reconciliation Matrix

| Excel header | Expected DB catalog | Artifact values | DB values | DB state | Reconciliation |
|---|---|---:|---:|---|---|
| `POSITION` | `seafarer_positions` | 48 | 48 | published | Complete |
| `NATIONALITY` | `nationalities` | 2 | 2 | published | Complete |
| `SEX` | `gender_values` | 2 | 2 | published | Complete |
| `CIVIL STATUS` | `civil_status_values` | 4 | 4 | published | Complete |
| `RELIGION` | `religion_values` | 12 | 12 | published | Complete, but sensitive and not matching data |
| `COUNTRY` | `countries` | 248 | 248 | published | Complete |
| `AIRPORT` | `airports` | 155 | 155 | published | Complete, but not a port catalog |
| `CITY` | `cities` | 228 | 228 | published | Complete, but not a port catalog |
| `RELATION` | `relation_types` | 16 | 16 | published | Complete, not demand matching |
| `RELATION_CHILDREN` | `child_relation_types` | 2 | 2 | published | Complete, not demand matching |
| `EDUCATION_INSTITUTE` | `education_institutions` | 139 | 139 | published | Complete, supply only |
| `GRADE` | `education_grades` | 6 | 6 | published | Complete, supply only |
| `COC` | `certificate_of_competence_types` | 27 | 27 | published | Complete |
| `ENDORSMENT INSTITUTE` | `endorsement_institutions` | 40 | 40 | published | Complete as institution catalog, not endorsement type catalog |
| `VESSELTYPE` | `vessel_types` | 22 | 22 | published | Complete |
| `NATIONAL_DOC` | `national_document_types` | 17 | 17 | published | Complete, partial visa/document relevance |
| `TRAINING_COURSES` | `training_course_types` | 130 | 130 | published | Complete |
| `HARBOURMASTER` | `harbourmasters` | 27 | 27 | published | Complete, authority context only |
| `SHENGENCOUNTRY` | `schengen_countries` | 26 | 26 | published | Complete, route/visa support only |
| `VESSELTYPE2` | `vessel_type_matching_categories` | 9 | 9 | published | Complete, overlaps with `vessel_types` |
| `Yes/No` | `yes_no_values` | 2 | 2 | published | Complete |
| `CONFIRMATION` | `confirmation_values` | 2 | 2 | published | Complete |
| `AGREEMENT` | `agreement_values` | 2 | 2 | published | Complete |
| `INFORMATION FROM` | `information_source_values` | 14 | 14 | published | Complete |

Conclusion:

```text
The Excel catalog import is complete for the 24 importer-mapped DROPDOWN_LISTS catalogs.
```

The issue is not missing import completeness for these catalogs. The issue is that several demand-required matching concepts are not represented by these Excel catalogs, or are represented only indirectly.

## 7. Demand-Required Catalog Coverage Matrix

Statuses used:

```text
present_populated
present_empty
present_partial
missing
equivalent_exists
free_text_only
needs_cleanup
needs_seed
ready_for_matching
```

| Demand concept | Current DB/catalog coverage | Status | Matching readiness |
|---|---|---|---|
| Rank / position | `seafarer_positions` published; demand stores `vacancy_requests.rank` text | present_populated; needs_cleanup | Supply catalog ready, demand needs value-id binding. |
| Department | Demand/supply use constrained text enum/code; no reference catalog | free_text_only / equivalent_exists | Usable as simple hard filter for `deck`/`engine`; not catalog-backed. |
| Vessel type | `vessel_types` and `vessel_type_matching_categories` published; demand stores text | present_populated; needs_cleanup | Supply catalog ready, demand text needs value-id binding and VESSELTYPE/VESSELTYPE2 decision. |
| Country | `countries` published; DB uses ISO-like char codes | present_populated | Ready for code-based matching/validation where country is relevant. |
| Port | No port catalog; airports/cities/harbourmasters are not ports | missing | Not ready. |
| COC | `certificate_of_competence_types` published; supply certificates partially value-linked | present_populated | Supply side partly ready; demand required COC rows missing. |
| Endorsement | `endorsement_institutions` exists, but not endorsement type | present_partial; needs_seed | Not ready for hard matching. |
| STCW/training | `training_course_types` published; supply training partially value-linked | present_populated | Supply side partly ready; demand required training rows missing. |
| Visa category | `national_document_types` and `schengen_countries` only partial | present_partial; needs_seed | Not ready. |
| Language/level | No catalog found | missing; needs_seed | Not ready. |
| Currency | `vacancy_requests.currency` stores `USD`; no catalog needed for MVP | equivalent_exists | Ready for code-level matching. |
| Contract duration unit | Current duration is text | free_text_only; needs_seed | Not ready for automated matching. |
| Rotation pattern | Missing | missing; needs_seed | Not ready. |
| Special operation tags | Only possible free text in `requirements` | free_text_only; needs_seed | Not ready. |
| Cargo type | Missing | missing; needs_seed | Not ready. |
| Risk status | No approved internal demand risk catalog | missing / blocked | Not ready; requires owner/compliance decision. |
| Verification status | Company status exists; vessel/evidence status incomplete | present_partial | Company verification can gate, but there are no verified companies currently. |

## 8. Existing DB Data Sufficiency For Request-Offer Matching

### 8.1 Supply Side

| Dimension | DB evidence | Status |
|---|---|---|
| Seafarer profile base | 636 `seafarer_profiles` rows | Available |
| Primary rank | 482 / 636 profiles have `primary_rank`; 11 distinct normalized text values | Available but text-first |
| Department | 481 / 636 profiles have `department` | Available |
| Availability status | 636 / 636 profiles have `availability_status` | Available |
| Availability date | 198 / 636 profiles have `availability_date` | Partial |
| Country/nationality/residence | 161 / 137 / 136 profile rows populated respectively | Partial |
| Salary expectation | 121 / 636 profiles have `salary_expectation_usd` | Partial |
| Preferred vessel types | 124 / 636 profiles have values | Partial |
| Structured person details | 80 rows | Partial |
| Structured certificates | 87 rows; 47 value-linked; 74 expiry dates | Partial but useful |
| Structured endorsements | 6 certificate rows in `endorsement` group; 0 value-linked | Not ready for hard matching |
| Structured training | 117 rows; 25 value-linked; 12 expiry dates | Partial |
| Sea service | 53 rows; 53 vessel type linked; 9 rank linked; 37 service-from and 50 service-to dates | Partial but useful |
| Matching preferences | 108 rows; 13 preferred vessel-type value arrays; 10 expected compensation values; 29 availability dates; 49 candidate summaries; 49 publish decisions | Partial |
| Publication/approval | 0 published seafarer publication snapshots and 0 verified publish-to-matching profiles | Not ready for employer-facing candidate proposal |
| Consent | 25 active `employer_sharing` and 25 active `matching_preparation` acceptances | Partial; consent exists but publication/verification gates still block |

Supply-side conclusion:

```text
Supply data is sufficient for an internal matching-readiness audit/prototype,
but not sufficient for automated employer-facing proposal because no seafarer publication snapshots are published
and profile/card verification remains incomplete.
```

### 8.2 Demand Side

| Dimension | DB evidence | Status |
|---|---|---|
| Company records | 381 companies | Available |
| Company registration numbers | 250 / 381 populated | Partial |
| Company country codes | 347 / 381 populated | Strong |
| Company verification | 0 verified; records are `rejected` or `unverified` | Blocks public/employer-facing matching |
| Company type | Values: `employer`, `shipowner`, `crewing_manager` | Available |
| Company users | 376 rows | Available |
| Vessel records | 107 vessels | Available |
| Vessel IMO | 107 / 107 populated | Strong |
| Vessel type | 107 / 107 populated, but text-only | Available but not catalog-linked |
| Vessel flag | 0 / 107 populated | Missing |
| Vacancy requests | 151 rows | Available |
| Vacancy rank | 151 / 151 populated, 82 distinct normalized text values | Available but text-only and likely noisy |
| Vacancy department | 151 / 151 populated: 80 `deck`, 71 `engine` | Ready as simple enum |
| Vacancy vessel type | 151 / 151 populated, 4 distinct normalized text values | Available but text-only |
| Vacancy join date | 151 / 151 populated | Ready |
| Vacancy contract duration | 151 / 151 populated, text-only | Not structured for matching |
| Vacancy salary min/max | 151 / 151 populated; currency always `USD` | Ready for simple range comparison |
| Vacancy requirements | 151 / 151 populated, free text | Not ready for hard blockers |
| Vacancy publication status | 143 `closed`, 8 `rejected`; 0 published | Blocks public/applicant matching |
| Public-ready vacancies | 0 published vacancies from verified companies | Not ready for public matching |
| Applications | 8 rows; all `withdrawn` and `presented` in employer shortlist status | Historical workflow state, not active matching demand |

Demand-side conclusion:

```text
Demand data exists in useful volume, but it is not ready for automated request-offer matching.
Most matching-critical requirements are stored as text labels or free text and are not catalog-linked.
There are also no verified companies or published vacancies, so any matching prototype must remain internal/readiness-only.
```

## 9. Matching Dimension Sufficiency Matrix

| Matching dimension | Structured supply available | Structured demand available | Catalog-linked | Hard blocker ready | Soft score only | Current decision |
|---|---:|---:|---:|---:|---:|---|
| Rank / position | Partial | Text only | Supply partial, demand no | No | Yes | Need demand `required_rank_value_id` / label mapping. |
| Crew department | Yes | Yes | No | Limited | Yes | Can filter `deck` / `engine`; catalog cleanup later. |
| Vessel type | Yes on supply sea service; text on profile/preferences | Text only | Supply partial, demand no | No | Yes | Need demand catalog binding and vessel catalog cleanup. |
| COC | Partial structured supply | Free text only | Supply partial, demand no | No | No | Need demand requirement rows. |
| Endorsement | Supply rows exist but not value-linked | Free text only | No | No | No | Need endorsement type catalog and mapping. |
| STCW/training | Partial structured supply | Free text only | Supply partial, demand no | No | No | Need demand requirement rows. |
| Passport / seaman book / medical validity | Supply metadata/document readiness exists | Demand validity thresholds missing | No | No | Limited | Need numeric validity requirement fields/rows. |
| Availability / join date | Supply partial; demand strong | No catalog needed | N/A | Limited | Yes | Can compare where supply availability date exists; many supply rows missing date. |
| Contract duration | Supply preference text mostly empty; demand text | No | No | No | No | Need structured duration value/unit. |
| Salary range / currency | Supply partial; demand strong | Currency code only | N/A | Limited | Yes | Can score only where supply expected compensation exists. |
| Vessel identity / IMO | Demand strong; supply experience has vessel name/type | Partial | Supply type partial | No | Yes | Useful for context, not a supply-demand blocker. |
| Trading area / route / visa / Schengen | Supply/demand mostly free text or missing | No | Partial Schengen only | No | No | Need route/visa model. |
| Language level | Missing | Missing | No | No | No | Needs new supply/demand model. |
| Risk/compliance status | Not matching-safe | Missing/blocked | No | No | No | Owner/compliance decision required. |
| Verification status | Supply review statuses exist; company/vacancy statuses exist | Partial | N/A | Yes as workflow gate | N/A | Currently blocks employer-facing matching because none are public-ready. |

## 10. Missed Shipowner / Employer / Vessel / Vacancy Fields

The current DB already stores several demand-side fields that must not be missed:

| Area | Existing field(s) | Prior risk | Current finding |
|---|---|---|---|
| Company type | `employer_companies.company_type` | Might be treated as only employer vs shipowner | Values distinguish `employer`, `shipowner`, `crewing_manager`; useful for demand ownership but not a full client-role model. |
| Company verification | `employer_companies.verification_status` | Might be ignored in matching | Critical gate. There are currently no verified companies. |
| Representative role | `company_users.role_in_company`, `is_primary_contact` | Could be missed as authority signal | Existing data can support scoped ownership but not full authority evidence. |
| Vessel identity | `vessels.imo_number`, `vessel_name`, `vessel_type` | Could be under-weighted | 107 vessels have IMO and vessel type; type is text-only. |
| Vacancy request anchor | `vacancy_requests` | Could be treated as only public vacancies | Contains 151 closed/rejected demand records useful for internal analysis, but none are public-ready. |
| Vacancy department | `vacancy_requests.department` | Could be dismissed as free text | It is constrained and currently only `deck`/`engine`, useful as limited hard filter. |
| Salary range | `salary_min_usd`, `salary_max_usd`, `currency` | Could be underused | All 151 vacancy rows have numeric salary range and USD currency. |
| Requirements text | `vacancy_requests.requirements` | Could be overused | Present in all 151 rows, but must not become hard-blocker source without operator structuring. |
| Employer shortlist state | `vacancy_applications.employer_shortlist_status` | Could be confused with matching | It is workflow history, not demand definition. |

## 11. Gaps

| Gap type | Exact gap | Impact |
|---|---|---|
| missing | Port catalog | Cannot match joining/sign-off/trading route by controlled value. |
| missing | Language/level catalogs and supply records | Cannot match language/Maritime English automatically. |
| missing | Contract duration unit structure | Cannot compare demand duration to supply preference. |
| missing | Rotation pattern catalog | Cannot match rotation fit. |
| missing | Cargo/special operation/risk catalogs | Cannot match operational requirements. |
| partial | Vessel type catalogs are imported but demand stores text | Cannot do reliable hard blocker without mapping/cleanup. |
| partial | COC/training supply values are partially catalog-linked | Can audit/prototype but not complete hard matching. |
| partial | Endorsement supply rows exist but are not value-linked | Endorsement hard matching is not ready. |
| partial | Company/vessel verification | Company has status; vessel does not; no verified companies exist. |
| free-text-only | `vacancy_requests.requirements` | COC, endorsements, visa, language and special operations cannot be hard blockers yet. |
| free-text-only | `vacancy_requests.contract_duration` | Duration cannot be reliably compared. |
| free-text-only | Demand rank/vessel type labels | Useful for candidate search, not enough for exact automated matching. |
| workflow-blocked | No published seafarer snapshots and no public-ready vacancies | Employer-facing candidate proposal must remain blocked. |

## 12. Proposed Additive Completion SQL

No SQL was run.

Because current DB/catalogs are not sufficient for automated matching, the next approved implementation should prepare an additive/idempotent migration. Do not apply this without separate approval.

Recommended migration name:

```text
projects/crewportglobal/app/backend/db/migrations/014_demand_reference_catalog_reconciliation.sql
```

Recommended additive scope:

1. Add catalog value link columns for demand rank and vessel type while preserving legacy text:
   - `vacancy_requests.required_rank_value_id`
   - `vacancy_requests.required_rank_label`
   - `vacancy_requests.vessel_type_value_id`
   - `vacancy_requests.vessel_type_label`
   - `vessels.vessel_type_value_id`
   - `vessels.vessel_type_label`
2. Add structured duration compatibility fields:
   - `vacancy_requests.contract_duration_value`
   - `vacancy_requests.contract_duration_unit`
3. Add numeric document-validity requirement fields:
   - `required_passport_validity_days`
   - `required_seaman_book_validity_days`
   - `required_medical_validity_days`
4. Add a compatibility `demand_workspace` JSONB field for operator-structured requirements:
   - `vacancy_requests.demand_workspace JSONB DEFAULT '{}'::jsonb`
5. Add demand requirement rows only after owner approval of exact row model and catalogs:
   - rank / vessel type / COC / training can come first;
   - endorsement / visa / language must wait for seed/cleanup.
6. Seed missing catalogs only through owner-approved inserts:
   - duration units;
   - endorsement types;
   - visa categories/statuses;
   - language/level;
   - port/source strategy;
   - special operation/cargo/risk later.

Allowed SQL pattern for the future migration:

```sql
ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...;
CREATE TABLE IF NOT EXISTS ...;
CREATE INDEX IF NOT EXISTS ...;
INSERT INTO ... ON CONFLICT (...) DO NOTHING;
INSERT INTO ... ON CONFLICT (...) DO UPDATE SET ...;
```

Forbidden without separate approval:

```text
DROP
DELETE
ALTER TABLE ... DROP COLUMN
mass UPDATE without WHERE
runtime API/UI changes
matching/scoring execution
```

This report does not create the migration file because the Project Owner approval in this phase covered read-only inspection and reporting, not DDL/DML execution.

## 13. Risk And Rollback Plan

| Risk | Control | Rollback / disable boundary |
|---|---|---|
| False hard blockers from free text | Do not use `requirements` as automated blocker until operator-structured | Keep `requirements` as text; disable structured matching reads. |
| Wrong rank/vessel type mapping | Use exact catalog match or operator-confirmed mapping only | Keep legacy text columns as fallback. |
| Endorsement institution confused with endorsement type | Do not use `endorsement_institutions` as requirement type | Seed separate endorsement type catalog before matching. |
| Visa/route mismatch | Do not infer visa category from Schengen country alone | Add visa category/status catalog before hard matching. |
| Matching before approval/consent | Keep approval guard and consent gates from CPG-SEAFARER-018 | No employer-facing candidate proposal until profile/vacancy gates pass. |
| Public leakage of internal/risk data | Keep risk/compliance out of public/applicant payload | Use allow-listed matching payload only. |
| Additive migration issue | Use nullable columns, IF NOT EXISTS, no destructive DDL | Disable new reads and keep legacy endpoints. |

## 14. Go / No-Go Recommendation

| Prototype type | Decision | Reason |
|---|---|---|
| Internal read-only matching-readiness audit | Go | Existing data is enough to compare text labels, departments, availability, salary and partial catalog-linked supply records. |
| Internal operator-assisted candidate search | Conditional go | Can use rank/department/vessel type text and salary/date filters with clear warnings that it is not final automated matching. |
| Automated hard-blocker matching | No-go | Demand requirements are not catalog-linked or structured enough. |
| Employer-facing candidate proposal | No-go | No published seafarer snapshots, no public-ready vacancies, no verified companies and approval/consent guards must remain active. |
| First automated matching prototype | No-go until additive reconciliation | Needs demand catalog links, structured requirements and readiness gates first. |

Final classification:

```text
C. Existing DB/catalogs are insufficient for automated request-offer matching; additive catalog/field migration is required.
```

With nuance:

```text
B/C hybrid: Excel catalog import itself is complete, and existing DB is mostly sufficient for internal readiness analysis,
but demand-side matching fields need additive reconciliation before automated matching.
```

## 15. Next Implementation Issue

Recommended next issue:

```text
CPG-DEMAND-005 - Additive demand catalog links and structured requirement foundation
```

Recommended scope:

1. Prepare migration `014_demand_reference_catalog_reconciliation.sql`.
2. Add nullable catalog link/cache fields for demand rank and vessel type.
3. Add `demand_workspace` compatibility JSONB.
4. Add structured duration and validity threshold fields.
5. Seed only minimal owner-approved system catalogs:
   - contract duration unit;
   - possibly endorsement type and visa category/status if approved.
6. Do not implement matching/scoring runtime yet.
7. Add read-only projection/test coverage after migration is approved and applied.

## 16. Acceptance Checklist

| Requirement | Status |
|---|---|
| Existing DB inspected read-only | Met |
| Excel/import artifacts inspected read-only | Met |
| Reference catalogs reconciled against import artifact | Met |
| Demand-required catalog coverage assessed | Met |
| Supply/demand matching sufficiency assessed | Met |
| Missed shipowner/employer/vessel/vacancy fields identified | Met |
| Gaps classified | Met |
| Additive completion scope proposed but not applied | Met |
| Go/no-go recommendation included | Met |
| No DDL/DML executed | Met |
| No UI changes | Met |
| No backend/API changes | Met |
| No tests changed | Met |
| No runtime changes | Met |
| No matching/scoring runtime implementation | Met |
| No publication or employment-decision logic | Met |
