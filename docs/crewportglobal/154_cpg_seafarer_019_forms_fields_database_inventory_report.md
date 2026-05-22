# CPG-SEAFARER-019 — Forms, Fields, Database Inventory and Test Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 — Digital Maritime Crew Data and Matching Platform
- Document type: Audit / test / documentation report
- Source task: #28 — CPG-SEAFARER-019
- Version: 1.0
- Date: 2026-05-22
- Status: Implemented as documentation-only inventory

## 1. Purpose

This report records the current factual state of the seafarer workflow after CPG-SEAFARER-017 and CPG-SEAFARER-018.

This task did not add new functionality, change private Excel source files, change migrations, alter production data, publish seafarer profiles, implement matching, implement employment decisions or modify payment/deployment logic.

The inventory covers:

1. Pages and forms currently involved in seafarer, operator, cabinet, employer and public-vacancy workflows.
2. UI field ids, JavaScript keys, backend keys and storage locations.
3. Source-card mapping from the approved Excel-aligned model.
4. PostgreSQL schema, indexes, constraints, row counts and JSON metadata keys from read-only inspection.
5. API endpoints and visibility behavior by role/scope.
6. Consent, approval guard and restricted medical access controls.
7. Test execution results and remaining gaps.

No real personal records were exported or included. Database checks used schema, counts and JSON key names only.

## 2. Sources Inspected

Approved sources:

1. Private Excel source: `seafarer_fields_dictionary_2026_05_18.xls` as referenced by BP-011 and prior reports; the private file was not copied into Git or this report.
2. BP-011: `docs/crewportglobal/business_processes/11_seafarer_field_dictionary_and_reference_catalog_alignment.md`.
3. Document 143: `docs/crewportglobal/143_cpg_seafarer_012_excel_card_field_alignment_audit_report.md`.
4. Document 144: `docs/crewportglobal/144_cpg_seafarer_013_excel_aligned_form_cards_report.md`.
5. Document 146: `docs/crewportglobal/146_cpg_seafarer_015_excel_source_review_cards_report.md`.
6. Document 147: `docs/crewportglobal/147_cpg_seafarer_016_repeated_excel_source_rows_report.md`.
7. Document 149: `docs/crewportglobal/149_cpg_seafarer_017_data_minimization_visibility_report.md`.
8. Document 152: `docs/crewportglobal/152_cpg_seafarer_018_approval_consent_medical_report.md`.
9. Document 153: `docs/crewportglobal/153_cpg_seafarer_018_endpoint_guard_consent_addendum.md`.
10. Coverage matrix: `docs/crewportglobal/seafarer_application_mapping/source_card_field_coverage_matrix.md`.
11. Visibility matrix: `docs/crewportglobal/seafarer_application_mapping/source_card_visibility_matrix.md`.
12. Agent guide: `docs/crewportglobal/155_cpg_seafarer_019_agent_execution_guide.md`.

Code and tests inspected:

1. `projects/crewportglobal/public/create-profile/index.html`.
2. `projects/crewportglobal/public/cabinet/index.html`.
3. `projects/crewportglobal/public/verify/index.html`.
4. `projects/crewportglobal/public/post-vacancy/index.html`.
5. `projects/crewportglobal/public/vacancies/index.html`.
6. `projects/crewportglobal/public/assets/crewportglobal-registration-drafts.js`.
7. `projects/crewportglobal/public/assets/crewportglobal-reference-catalogs.js`.
8. `projects/crewportglobal/app/backend/api/public/index.php`.
9. Migrations `001` through `013` in `projects/crewportglobal/app/backend/db/migrations/`.
10. Focused Playwright tests listed in section 13.

## 3. Database Inspection Status

Read-only database inspection was available on GTC1 through local PostgreSQL:

```text
database_name: gtc_db
database_user: gtc_user
```

Commands used only metadata and aggregate queries:

```text
information_schema.columns
pg_indexes
pg_constraint
COUNT(*) by approved tables
jsonb_object_keys(document_metadata)
jsonb_object_keys(document_metadata->'seafarer_workspace')
jsonb_object_keys(seafarer_medical_declarations.sensitive_payload)
registration_audit_events event-type counts
```

No row-level personal values, document contents, names, e-mails, phones, addresses or medical answers were selected for this report.

## 4. Page And Form Inventory

| Page / route | Source file | Primary audience | Main form / UI surface | Main API dependency | Notes |
|---|---|---|---|---|---|
| `/create-profile/` | `projects/crewportglobal/public/create-profile/index.html` | Seafarer owner / draft creator | `#create-profile-form`, collapsible source-card sections, document upload, application history | `/api/v1/registration/drafts`, `/api/v1/seafarer/workspace`, `/api/v1/seafarer/workspace/sections/{section}`, `/api/v1/seafarer/document-readiness` | Primary owner data-entry surface. Owner scope preserves raw source data. |
| `/cabinet/` | `projects/crewportglobal/public/cabinet/index.html` | Authenticated user / draft owner fallback | My tasks, My documents, Seafarer workspace summary, service-area links | `/api/v1/auth/me`, `/api/v1/registration/drafts/{draft_id}`, `/api/v1/seafarer/workspace`, document list/upload APIs | Task-first page. Restricted task text is generic after CPG-SEAFARER-017. |
| `/verify/` | `projects/crewportglobal/public/verify/index.html` | Operator with temporary operator token | Review queue, draft detail, source-card review, approval guard, vacancy application review | `/api/v1/operator/review-queue`, `/api/v1/registration/drafts/{draft_id}?visibility=operator_general`, `/api/v1/operator/seafarer-workspace-cards/{draft_id}/review` | Uses operator-general scoped data; general operator cannot see restricted medical detail. |
| `/post-vacancy/` | `projects/crewportglobal/public/post-vacancy/index.html` | Employer / shipowner side | `#post-vacancy-form`, employer docs, presented candidates panel | `/api/v1/registration/drafts`, employer document APIs, employer presented-candidate payload | Presented candidates use minimized `document_summary`; raw seafarer workspace is excluded. |
| `/vacancies/` | `projects/crewportglobal/public/vacancies/index.html` | Public users | Public vacancy board and detail navigation | `GET /api/v1/vacancies` | Public read-only vacancy listing. It does not expose seafarer profile data. |

## 5. Create Profile Field Inventory

The `/create-profile/` page is the owner data-entry surface. It saves two layers:

1. Practical profile columns on `crewportglobal.seafarer_profiles`.
2. Excel-aligned workspace JSON under `seafarer_profiles.document_metadata.seafarer_workspace`, then syncs selected areas into structured workspace tables.

### 5.1 Top-Level Profile And Document Readiness

| UI field id | JavaScript / backend key | Storage | Source-card / area | Visibility |
|---|---|---|---|---|
| `create-full-name` | `full_name` | `users.display_name`; derived profile context | PERS-003 | Owner, operator, employer candidate after presentation. |
| `create-email` | `email` | `users.email`; auth/draft identity | Account / contact | Owner/operator metadata. Excluded from employer payload. |
| `create-phone` | `contact_phone` | `seafarer_profiles.contact_phone` | PERS-006 | Owner/operator need-to-know. Excluded from employer payload. |
| `create-rank` | `rank`, `primary_rank` | `seafarer_profiles.primary_rank` | PERS-002 | Owner/operator/employer professional summary. |
| `create-department` | `department` | `seafarer_profiles.department` | PERS-002 | Owner/operator/employer professional summary. |
| `create-availability` | `availability_status` | `seafarer_profiles.availability_status` | PERS-002 | Owner/operator/employer professional summary. |
| `create-availability-date` | `availability_date` | `seafarer_profiles.availability_date` | PERS-002 | Owner/operator/employer professional summary. |
| `create-nationality` | `nationality_code` | `seafarer_profiles.nationality_code` | PERS-003 | Owner/operator; employer only as existing professional summary context. |
| `create-residence` | `residence_country_code` | `seafarer_profiles.residence_country_code` | PERS-006 | Owner/operator; employer summary context only. |
| `create-country` | `country_code` | `seafarer_profiles.country_code` | PERS-003 / PERS-006 | Owner/operator; employer summary context only. |
| `create-salary` | `salary_expectation_usd` | `seafarer_profiles.salary_expectation_usd` | Matching preference | Owner/operator only in current slice. |
| `create-vessel-types` | `preferred_vessel_types` | `seafarer_profiles.preferred_vessel_types` JSONB | PERS-002 / matching | Owner/operator; future reviewed matching summary candidate. |
| `create-certificate-status` | `certificate_status` | `document_metadata.certificate_status` | QUAL readiness | Owner/operator; employer `document_summary` status only. |
| `create-stcw-status` | `stcw_status` | `document_metadata.stcw_status` | QUAL readiness | Owner/operator; employer `document_summary` status only. |
| `create-passport-expiry` | `passport_expiry` | `document_metadata.passport_expiry` | QUAL-001 readiness | Expiry only can be summarized; no passport number. |
| `create-medical-expiry` | `medical_expiry` | `document_metadata.medical_expiry` | MED readiness | Expiry only can be summarized; no medical declaration detail. |
| `create-visa-status` | `visa_status` | `document_metadata.visa_status` | QUAL-001 readiness | Status only can be summarized; no visa number. |
| `create-document-notes` | `notes` | `document_metadata.notes` | Document readiness note | Owner/operator only; not employer-facing. |

### 5.2 Excel-Aligned Workspace Sections

| UI section | UI field ids | Workspace key / backend key | Structured storage | Source cards |
|---|---|---|---|---|
| `profile-section-contact` | `create-date-of-birth`, `create-place-of-birth`, `create-gender`, `create-civil-status` | `personal_details.date_of_birth`, `place_of_birth`, `gender`, `civil_status` | `seafarer_person_details` | PERS-003 |
| `profile-section-contact` | `create-permanent-address`, `create-residence-city`, `create-nearest-airport`, `create-secondary-mobile-number`, `create-home-phone`, `create-emergency-contact-name`, `create-emergency-contact-relation`, `create-emergency-contact-phone` | `contact_and_addresses.*` | `seafarer_person_details`; `seafarer_emergency_contacts` for emergency contact | PERS-004, PERS-006, PERS-007 |
| `profile-section-contact` | `create-surname`, `create-first-name`, `create-middle-name`, `create-citizenship`, `create-religion` | `name_components.*` | JSON fallback; selected person detail sync | PERS-003 | 
| `profile-section-addresses` | `create-permanent-street`, `create-permanent-house`, `create-permanent-flat`, `create-permanent-region`, `create-permanent-post-code`, `create-permanent-comments`, `create-registration-street`, `create-registration-house`, `create-registration-flat`, `create-registration-city`, `create-registration-country`, `create-registration-region`, `create-registration-post-code`, `create-registration-comments` | `address_details.*` | JSON fallback | PERS-004, PERS-005 |
| `profile-section-family` | `create-kin-surname`, `create-kin-first-name`, `create-kin-middle-name`, `create-kin-birthdate`, `create-kin-gender`, `create-kin-relation`, `create-kin-mobile`, `create-kin-home-phone`, `create-kin-email`, `create-kin-address`, `create-children-records` | `family_details.*`, `family_details.children_records` | JSON fallback / source repeated records | PERS-007, PERS-008 |
| `profile-section-physical` | `create-height-cm`, `create-weight-kg`, `create-hair-colour`, `create-eyes-colour`, `create-uniform-size`, `create-shoes-size` | `physical_details.*` | JSON fallback | PERS-009 |
| `profile-section-identity-documents` | `create-civil-passport-series`, `create-civil-passport-number`, `create-civil-passport-issued`, `create-civil-passport-authority`, `create-foreign-passport-series`, `create-foreign-passport-number`, `create-foreign-passport-issued`, `create-foreign-passport-expiry`, `create-foreign-passport-authority`, `create-seafarer-id-series`, `create-seafarer-id-number`, `create-seafarer-id-issued`, `create-seafarer-id-expiry`, `create-seafarer-id-authority`, `create-seamans-book-series`, `create-seamans-book-number`, `create-seamans-book-issued`, `create-seamans-book-expiry`, `create-seamans-book-authority`, `create-usa-visa-type`, `create-usa-visa-issued`, `create-usa-visa-expiry`, `create-usa-visa-post`, `create-schengen-visa-number`, `create-schengen-visa-issued`, `create-schengen-visa-expiry`, `create-schengen-visa-post` | `identity_documents.*` | JSON fallback / source repeated records | QUAL-001 |
| `profile-section-qualifications` | `create-coc-type`, `create-coc-number`, `create-coc-issuing-country`, `create-coc-expiry`, `create-education-institution`, `create-education-grade`, `create-training-courses` | `qualifications.*` | `seafarer_education_records`, `seafarer_certificates`, `seafarer_training_records` | QUAL-002, QUAL-003, QUAL-005 |
| `profile-section-qualifications` | `create-coc-institute`, `create-coc-issued`, `create-education-from`, `create-education-to`, `create-education-specialisation`, `create-education-issued-on`, `create-education-comments`, `create-endorsement-type`, `create-endorsement-institute`, `create-endorsement-number`, `create-endorsement-issued`, `create-endorsement-expiry`, `create-endorsement-comments`, `create-training-institute`, `create-training-number`, `create-training-issued`, `create-training-expiry`, `create-training-comments` | `qualification_details.*` | `seafarer_education_records`, `seafarer_certificates`, `seafarer_training_records` | QUAL-002, QUAL-003, QUAL-004, QUAL-005 |
| `profile-section-sea-service` | `create-last-vessel-name`, `create-last-vessel-type`, `create-last-rank`, `create-flag-country`, `create-service-from`, `create-service-to`, `create-management-company`, `create-engine-type`, `create-engine-power`, `create-deadweight`, `create-sea-service-history` | `sea_service.*` | `seafarer_sea_service_records` | EXP-001 |
| `profile-section-references` | `create-reference-company-1`, `create-reference-person-1`, `create-reference-phone-1`, `create-reference-email-1`, `create-reference-company-2`, `create-reference-person-2`, `create-reference-phone-2`, `create-reference-email-2` | `previous_employer_references.*` | JSON fallback / source repeated records | EXP-002 |
| `profile-section-medical` | `create-signed-off-sick`, `create-sick-details`, `create-injury-details`, `create-operated`, `create-surgery-details` | `medical_history.*` | `seafarer_medical_declarations.sensitive_payload` | MED-001 |
| `profile-section-publication` | `create-information-source`, `create-publish-to-matching`, `create-candidate-summary`, `create-data-processing-confirmation` | `matching_publication.*` | `seafarer_matching_preferences`; JSON fallback | MED-003, MED-004, matching/publication compatibility |
| `profile-section-publication` | `create-obligation-date`, `create-obligation-place`, `create-obligation-confirmation`, `create-agreement-date`, `create-agreement-value`, `create-source-comments` | `consent_details.*` | JSON fallback; consent events are separate API records | MED-002, MED-003, MED-004 |

### 5.3 Uploads And User Actions

| UI control | Backend key / endpoint | Storage | Notes |
|---|---|---|---|
| `create-document-upload-type` | multipart `document_type` | `uploaded_documents.document_type` | Supported seafarer types include passport/ID, seaman book, COC, STCW, medical certificate, CV, experience record, training certificate, language certificate and other professional evidence. |
| `create-document-upload-file` | multipart `document` | Protected server storage plus `uploaded_documents` metadata | Files are not public web-root files. Scan/review status controls queue visibility. |
| `create-document-upload-submit` | `POST /api/v1/registration/drafts/{draft_id}/documents` | `uploaded_documents` | Upload is linked by `draft_id`, `form_type`, `card_id` where supplied. |
| `.workspace-section-save` | `PATCH /api/v1/seafarer/workspace/sections/{section}` | JSON fallback plus structured sync | Section-level save preserves existing metadata. |
| `create-document-readiness-save` | `PATCH /api/v1/seafarer/document-readiness` | `document_metadata` | Updates readiness summary fields. |
| `create-submit` | `POST/PATCH /api/v1/registration/drafts` | users, seafarer profile, metadata | Creates or updates the draft. |

## 6. Operator, Cabinet, Employer And Public Field Inventory

| Surface | Fields / objects displayed or submitted | Backend keys | Storage/API source | Visibility notes |
|---|---|---|---|---|
| `/verify/` queue | Draft id, role, full name/display name, e-mail metadata, review status, document status, queue counts | `draft_id`, `role`, `display_name`, `email`, `review_status`, `document_summary` | `/operator/review-queue`, `/registration/drafts/{draft_id}?visibility=operator_general` | General operator sees scoped review data, not owner-full raw workspace. |
| `/verify/` source-card review | Source-card code, review status, correction target, note, action | `source_card`, `review_status`, `review_note`, `correction_target` | `PATCH /operator/seafarer-workspace-cards/{draft_id}/review` and metadata review state | Canonical PERS/QUAL/EXP/MED source cards are primary. Legacy cards remain fallback only. |
| `/verify/` approval guard | Guard allowed flag, blockers, warnings, audit status | `approval_guard.allowed`, `blockers[].code`, `warnings[].code` | `GET /operator/review-queue/vacancy-applications/{id}` | Guard blocks `presented` when required consent/correction/readiness checks fail. |
| `/verify/` restricted medical | Restricted medical request status | HTTP 403 with restricted boundary | `GET /operator/seafarer-medical/{draft_id}` | General operator receives denial; dedicated capability not enabled in this slice. |
| `/cabinet/` tasks | Task title, generic restricted correction text, source-card target link | `tasks[]`, `source_card`, `correction_target` | Draft profile, uploaded document status, source-card review metadata | Restricted family/medical/reference values are not repeated in task text. |
| `/cabinet/` workspace summary | Professional/person summary, certificate/training/sea-service, safe matching summary | `workspace.*` | `/seafarer/workspace?draft_id=...` and draft fallback | Owner can edit raw fields in `/create-profile/`; cabinet summary avoids restricted family/medical detail exposure. |
| `/post-vacancy/` employer form | Company, country, registration number, representative, vessel, vacancy, department, join date, contract, salary, requirements | `company_*`, `vacancy_*`, `vessel_*`, `document_metadata` | `POST/PATCH /registration/drafts` | Employer-side demand workflow; separate from seafarer data model. |
| `/post-vacancy/` presented candidates | Candidate display name, rank, department, availability, pipeline status, minimized document summary | `display_name`, `primary_rank`, `department`, `availability_status`, `document_summary` | `read_presented_candidates_for_employer()` | Excludes raw workspace, contact e-mail/phone and forbidden fields. |
| `/vacancies/` | Public vacancy title, rank, vessel type, join date, salary, requirements | `vacancy_requests` published fields | `GET /api/v1/vacancies` | Public vacancy board does not expose seafarer data. |

## 7. Source-Card Coverage Inventory

| Source card | Current UI / source area | Persistence | API visibility | Notes |
|---|---|---|---|---|
| PERS-001 | System/employee id boundary | System/internal only | Not ordinary user-editable | No invented user card added. |
| PERS-002 | Rank, department, availability, vessel preference | `seafarer_profiles`; matching preferences JSON/table | Owner/operator/employer professional summary | Core practical candidate profile fields. |
| PERS-003 | Name components, citizenship, nationality, personal details | JSON fallback; `seafarer_person_details`; profile columns | Religion hidden outside owner/internal compliance | Religion is not matching data. |
| PERS-004 | Permanent address | JSON fallback; selected person detail fields | Owner/operator need-to-know | Not employer-facing. |
| PERS-005 | Registration address | JSON fallback | Owner/operator need-to-know | Not employer-facing. |
| PERS-006 | Contact details, residence, airport | Profile columns; JSON fallback; person details | Owner/operator; employer excludes phone/e-mail | Contact e-mail/phone are not in employer payload. |
| PERS-007 | Next of kin / beneficiary | JSON fallback; emergency contact table for primary contact | Restricted in cabinet/operator summaries | Current failing legacy test still expects restricted family name in cabinet summary. |
| PERS-008 | Children records | JSON fallback / source repeated records | Masked outside owner | No child names/DOB/gender in employer payload or cabinet summaries. |
| PERS-009 | Physical details | JSON fallback | Owner/operator operational context | Not employer-facing in current slice. |
| QUAL-001 | Identity documents and visas | JSON fallback / source repeated records; document readiness expiries | Numbers masked outside owner; expiry/status may summarize | Passport/ID/visa/seaman book numbers excluded from employer payload. |
| QUAL-002 | Education records | `seafarer_education_records`; JSON fallback | Owner/operator | Future reviewed candidate summary candidate. |
| QUAL-003 | COC / certificates | `seafarer_certificates` group `certificate`; JSON fallback | Owner/operator; employer readiness summary only | Certificate number not in minimized employer payload. |
| QUAL-004 | Endorsements | `seafarer_certificates` group `endorsement`; JSON fallback | Owner/operator | No employer raw-row exposure in current slice. |
| QUAL-005 | Training courses | `seafarer_training_records`; JSON fallback | Owner/operator | Future reviewed candidate summary candidate. |
| EXP-001 | Sea-service history | `seafarer_sea_service_records`; JSON fallback | Owner/operator | Raw rows not employer-facing in current slice. |
| EXP-002 | Previous employer references | JSON fallback / source repeated records | Company context can remain; contact details masked | Reference contact person/phone/e-mail excluded from employer payload. |
| MED-001 | Medical declarations | `seafarer_medical_declarations.sensitive_payload`; JSON fallback | Restricted medical | General operator denied; employer receives no details. |
| MED-002 | Obligation boundary | JSON fallback / compatibility fields | Owner/compliance only | Future event model should replace broad field use. |
| MED-003 | Data-processing confirmation | JSON fallback plus `seafarer_consent_events` for event model | Consent API | Active consent events are required for presentation guard. |
| MED-004 | Information source / comments | JSON fallback | Internal compliance | Not employer-facing. |
| MED-005 | Manager notes / pre-employment authorization | System/team boundary | System-only | Not ordinary user-editable. |

## 8. Database Schema Inventory

Read-only schema inspection found 305 columns across the inspected CrewPortGlobal tables and 62 indexes.

| Table | Purpose | Key inspected columns | Index / constraint highlights | Source of truth? |
|---|---|---|---|---|
| `users` | Physical person / account identity | `user_id`, `email`, `display_name`, `email_verified_at`, `registration_status`, `email_verification_status`, `is_active` | Unique e-mail index; status checks | Identity source. |
| `user_roles` | Early role metadata | `user_role_id`, `user_id`, `role`, `source` | User/role unique index; role index | Transitional role metadata. |
| `seafarer_profiles` | Main seafarer draft/profile record | `seafarer_profile_id`, `user_id`, `first_name`, `last_name`, `primary_rank`, `department`, `availability_status`, `country_code`, `nationality_code`, `residence_country_code`, `availability_date`, `preferred_vessel_types`, `salary_expectation_usd`, `contact_email`, `contact_phone`, `document_metadata`, `review_status` | Unique user id; review/status checks through code | Main profile and JSON workspace source. |
| `uploaded_documents` | Protected upload metadata | `document_id`, `person_id`, `user_id`, `draft_id`, `card_id`, `form_type`, `document_type`, `original_filename`, `storage_root`, `storage_path`, `mime_type`, `file_size_bytes`, `sha256_hash`, `upload_state`, `review_status`, `scan_status`, `valid_from`, `valid_until`, replacement fields | Scan/upload/review/status checks; visible-document partial index | Document metadata source; file bytes stay outside public root. |
| `seafarer_person_details` | Structured personal/profile details | `seafarer_profile_id`, `date_of_birth`, `place_of_birth`, `gender`, `civil_status`, `residence_city`, `nearest_airport`, `review_status` | Profile unique; user index; review-status check | Structured source for personal/contact summary. |
| `seafarer_emergency_contacts` | Emergency contact records | `contact_name`, `relation`, `phone`, `email`, `is_primary`, `review_status` | Profile index; primary-contact unique index | Restricted family/contact source. |
| `seafarer_education_records` | Education repeated records | `institution`, `grade`, `from_date`, `to_date`, `specialisation`, `issued_on`, `review_status` | Profile index | Structured QUAL-002 source. |
| `seafarer_certificates` | COC and endorsements | `certificate_group`, `certificate_type`, `certificate_number`, `issuing_country`, `issued_at`, `expires_at`, `review_status` | Profile/group index; group check | Structured QUAL-003/QUAL-004 source. |
| `seafarer_training_records` | Training repeated records | `training_type`, `institute`, `certificate_number`, `issued_at`, `expires_at`, `review_status` | Profile index | Structured QUAL-005 source. |
| `seafarer_sea_service_records` | Sea-service repeated records | `vessel_name`, `vessel_type`, `rank`, `department`, `service_from`, `service_to`, `management_company`, `engine_type`, `engine_power`, `deadweight`, `review_status` | Profile/dates index | Structured EXP-001 source. |
| `seafarer_medical_declarations` | Sensitive medical declarations | `declaration_type`, `sensitive_payload`, `medical_certificate_expiry`, `fitness_status`, `review_status` | Profile index; review-status checks | Restricted MED-001 source. |
| `seafarer_matching_preferences` | Matching/publication compatibility preferences | `preferred_vessel_types`, `availability_status`, `availability_date`, `candidate_summary`, `publish_to_matching`, `review_status` | User/profile indexes | Not a publication approval by itself. |
| `seafarer_publication_snapshots` | Future controlled publication snapshots | `publication_state`, `snapshot_payload`, `approved_at`, `withdrawn_at` | Profile/state index | Future publication source, not active matching publication. |
| `seafarer_consent_events` | Versioned consent events | `consent_id`, `seafarer_profile_id`, `draft_id`, `consent_type`, `purpose`, `legal_basis`, `text_version`, `language`, `accepted_at`, `withdrawn_at`, `source_page`, `actor_user_id`, `actor_type`, `metadata` | Type/action/language/actor checks; draft/type, profile/type and active consent indexes | Approval guard consent source. |
| `employer_companies` | Employer/company draft context | Company identity, registration, country, review fields | Registration unique and company name indexes | Employer side source. |
| `vessels` | Vessel draft context | Company, vessel name, IMO, vessel type, flag | IMO unique and company indexes | Vessel source. |
| `vacancy_requests` | Employer demand / vacancy request | Company/vessel/user ids, rank, department, join date, salary, requirements, publication status, document metadata | Publication status, join date and FK indexes | Vacancy source. |
| `vacancy_applications` | Seafarer applications to vacancies | `vacancy_application_id`, `vacancy_request_id`, `seafarer_user_id`, `application_status`, `candidate_note`, employer shortlist/action fields | Unique vacancy/seafarer; status indexes; status check includes `presented` | Presentation transition source guarded by CPG-SEAFARER-018. |
| `registration_audit_events` | Audit trail | Actor/context ids, `event_type`, payload, timestamps | Event type, created-at and context indexes | Audit source. |

### 8.1 Safe Row Counts

| Table | Count |
|---|---:|
| `users` | 938 |
| `seafarer_profiles` | 585 |
| `uploaded_documents` | 1 |
| `seafarer_person_details` | 63 |
| `seafarer_certificates` | 70 |
| `seafarer_medical_declarations` | 27 |
| `seafarer_consent_events` | 29 |
| `vacancy_requests` | 139 |
| `vacancy_applications` | 6 |
| `registration_audit_events` | 2407 |

## 9. JSON And Metadata Inventory

Top-level `seafarer_profiles.document_metadata` keys observed by safe aggregate query:

| JSON key | Count |
|---|---:|
| `certificate_status` | 189 |
| `stcw_status` | 189 |
| `visa_status` | 189 |
| `passport_expiry` | 186 |
| `medical_expiry` | 186 |
| `notes` | 158 |
| `seafarer_workspace` | 87 |
| `seafarer_workspace_card_reviews` | 46 |

`document_metadata.seafarer_workspace` section keys observed:

| Workspace key | Count |
|---|---:|
| `qualifications` | 68 |
| `contact_and_addresses` | 53 |
| `matching_publication` | 53 |
| `personal_details` | 50 |
| `sea_service` | 40 |
| `family_details` | 19 |
| `medical_history` | 17 |
| `consent_details` | 14 |
| `identity_documents` | 14 |
| `name_components` | 14 |
| `previous_employer_references` | 14 |
| `qualification_details` | 12 |
| `address_details` | 7 |
| `physical_details` | 7 |

`seafarer_medical_declarations.sensitive_payload` keys observed:

```text
declarations
source_card
source_key
```

## 10. API Inventory

| Endpoint | Method | Main consumer | Reads / writes | Visibility / guard behavior |
|---|---|---|---|---|
| `/api/v1/registration/drafts` | POST | `/create-profile/`, `/post-vacancy/` | Creates user/profile/company/vessel/vacancy draft context | Public draft creation; no role grant by itself. |
| `/api/v1/registration/drafts/{draft_id}` | GET | `/create-profile/`, `/cabinet/`, `/verify/`, `/post-vacancy/` | Reads draft payload | Supports scoped reads such as `visibility=operator_general`. |
| `/api/v1/registration/drafts/{draft_id}` | PATCH | `/create-profile/`, `/post-vacancy/` | Updates profile/company/vessel/vacancy draft data | Seafarer profile save syncs JSON workspace to structured records. |
| `/api/v1/registration/drafts/{draft_id}/documents` | GET/POST | `/create-profile/`, `/post-vacancy/`, `/cabinet/` | Lists/uploads protected document metadata | File bytes stay outside public root; scan/review state applies. |
| `/api/v1/seafarer/workspace` | GET | `/create-profile/`, `/cabinet/`, tests | Reads structured workspace summary | Owner default is full; non-owner scopes are minimized. |
| `/api/v1/seafarer/workspace/sections/{section}` | PATCH | `/create-profile/` | Updates a workspace section | Preserves JSON fallback and syncs structured records. |
| `/api/v1/seafarer/document-readiness` | PATCH | `/create-profile/` | Updates readiness metadata | Readiness summary source for operator/employer-safe views. |
| `/api/v1/seafarer/consents` | GET/POST | Future owner UI / tests | Reads or records consent events | Active consent events required for employer presentation. |
| `/api/v1/seafarer/consents/{type}/withdraw` | PATCH | Future owner UI / tests | Withdraws consent event | Withdrawn consent blocks presentation. |
| `/api/v1/operator/review-queue` | GET | `/verify/` | Reads submitted drafts and applications | Requires operator access token. |
| `/api/v1/operator/review-queue/{draft_id}/status` | PATCH | `/verify/` | Records draft review decision | Does not publish or match seafarer by itself. |
| `/api/v1/operator/seafarer-workspace-cards/{draft_id}/review` | PATCH | `/verify/` | Records source-card review state | Canonical source cards are primary; legacy fallback remains compatibility only. |
| `/api/v1/operator/review-queue/vacancy-applications/{id}` | GET | `/verify/` | Reads application detail and approval guard | Returns exact blockers/warnings for presentation readiness. |
| `/api/v1/operator/seafarer-medical/{draft_id}` | GET | Restricted future operator workflow | Reads restricted medical detail if capability exists | General operator receives 403 and audit event. |
| `/api/v1/vacancies` | GET | `/vacancies/` | Reads public vacancy board | Only published/reviewed vacancies. |
| `/api/v1/vacancies/{id}` | GET | `/vacancies/detail/` | Reads one public vacancy | No seafarer data exposure. |
| `/api/v1/vacancies/{id}/applications` | POST | Public apply flow / seafarer | Creates vacancy application | Application starts in human-review state. |
| `/api/v1/seafarer/vacancy-applications/{id}/status` | PATCH | `/create-profile/` application history | Withdraws or marks not available | Seafarer-side application control. |
| `/api/v1/employer/vacancy-applications/{id}/shortlist` | PATCH | `/post-vacancy/` | Employer shortlist/follow-up action | Only after operator presentation. |

## 11. Consent And Approval Guard Inventory

Consent types implemented by CPG-SEAFARER-018:

```text
profile_review
matching_preparation
employer_sharing
document_verification
sensitive_medical_processing
reference_contact_verification
```

Approval blocker codes documented and implemented:

```text
company_not_verified
vacancy_not_published
critical_professional_data_missing
document_readiness_not_ready
document_summary_missing
consent_event_store_missing
missing_active_consent
unresolved_source_card_correction
unsafe_employer_payload
```

Approval warning code:

```text
source_card_not_individually_reviewed
```

Presentation rule:

1. A vacancy application must not move to `presented` when required active consent is missing or withdrawn.
2. A vacancy application must not move to `presented` while required source-card corrections are unresolved.
3. A vacancy application must not move to `presented` when employer payload safety checks detect forbidden fields.
4. On guard failure, the current application status is preserved and blockers are returned to the operator surface.
5. Guard failures and restricted-medical denials are audit-event candidates; current audit events include `restricted_medical_access_denied`, `seafarer_consent_event_recorded` and `seafarer_consent_event_withdrawn`.

Safe audit event counts observed:

| Event type | Count |
|---|---:|
| `operator_review_decision_recorded` | 627 |
| `document_review_decision_recorded` | 86 |
| `seafarer_consent_event_recorded` | 29 |
| `seafarer_consent_event_withdrawn` | 3 |
| `restricted_medical_access_denied` | 3 |

## 12. Visibility And Employer Payload Inventory

Approved visibility scopes/classes remain:

```text
owner_full
operator_general
cabinet_summary
employer_candidate

public_candidate_summary
employer_after_candidate_consent
operator_review
restricted_medical
internal_compliance
system_only
```

Employer-presented candidate allow list:

```text
vacancy_application_id
vacancy_request_id
application_status
candidate_note
created_at
updated_at
employer_shortlist_status
employer_action_note
employer_action_at
seafarer_user_id
display_name
primary_rank
department
availability_status
availability_date
country_code
document_summary
candidate_visibility_scope
vacancy_title
vacancy_rank
vacancy_department
```

Employer-presented candidate deny list:

```text
document_metadata
seafarer_workspace
source_repeated_records
source_card_document_links
sensitive_payload
medical_history
children_records
religion
manager_notes
authorization fields
reference contact person / phone / email
contact_email
contact_phone
seafarer_email
passport / ID / visa / seaman-book numbers
storage paths and raw uploaded document ids
```

The current code and CPG-SEAFARER-017/018 tests verify that employer payloads remain minimized after presentation.

## 13. Test Execution Report

### 13.1 Syntax And API Regression

| Command | Result | Notes |
|---|---|---|
| `php -l projects/crewportglobal/app/backend/api/public/index.php` | Passed | Backend syntax valid. |
| `npm run test:cpg-api` | 15 passed | API regression passed on GTC1. |

### 13.2 Focused Playwright Suite

Command:

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-seafarer-approval-guard.spec.ts tests/crewportglobal-seafarer-visibility-minimization.spec.ts tests/crewportglobal-seafarer-source-repeated-rows.spec.ts tests/crewportglobal-operator-queue.spec.ts tests/crewportglobal-cabinet-dashboard.spec.ts tests/crewportglobal-post-vacancy-workspace.spec.ts tests/crewportglobal-create-profile-prefill.spec.ts tests/crewportglobal-seafarer-workspace-form.spec.ts
```

Result:

```text
18 passed
```

Test-maintenance update on 2026-05-22:

```text
tests/crewportglobal-seafarer-workspace-form.spec.ts
extended seafarer workspace cards persist through draft save and reload
```

The stale cabinet-summary assertion was updated to match the approved CPG-SEAFARER-017 data-minimization behavior. The test now verifies that restricted next-of-kin/family contact values are not displayed in the cabinet summary and that the restricted family/beneficiary summary wording is shown instead:

```text
Family and beneficiary details are restricted. Open the source form only when you need to correct this card.
```

Audit conclusion: the previous failure was test expectation drift, not product behavior drift. The focused test and focused suite now pass without product-code changes.

### 13.3 Test-To-Control Traceability

| Test | Controls covered | Result |
|---|---|---|
| `crewportglobal-seafarer-approval-guard.spec.ts` | Consent requirement, unresolved correction blocker, application presentation guard | Passed |
| `crewportglobal-seafarer-visibility-minimization.spec.ts` | Owner preservation, operator/employer minimization, forbidden employer fields | Passed |
| `crewportglobal-seafarer-source-repeated-rows.spec.ts` | Repeated Excel rows, source-card document links, operator/cabinet readiness | Passed |
| `crewportglobal-operator-queue.spec.ts` | Operator queue, draft detail, vacancy application review | Passed |
| `crewportglobal-cabinet-dashboard.spec.ts` | Cabinet tasks, correction tasks, document replacement flow | Passed |
| `crewportglobal-post-vacancy-workspace.spec.ts` | Employer vacancy draft save/reload/review publication status | Passed |
| `crewportglobal-create-profile-prefill.spec.ts` | Draft prefill, patch flow, correction status, application history | Passed |
| `crewportglobal-seafarer-workspace-form.spec.ts` | Owner workspace save/reload, cabinet restricted-summary behavior, section endpoint | Passed after test-maintenance update; restricted family contact name/phone are asserted absent from cabinet summary. |

## 14. Safe Synthetic End-To-End Trace

Current flow using safe synthetic data:

1. A seafarer opens `/create-profile/`.
2. The user fills top-level professional fields, document readiness and Excel-aligned workspace sections.
3. `POST /api/v1/registration/drafts` creates the draft and profile records.
4. `PATCH /api/v1/seafarer/workspace/sections/{section}` updates individual workspace cards and syncs structured records.
5. `GET /api/v1/seafarer/workspace?draft_id=...` returns owner workspace data for owner/edit workflows.
6. `/cabinet/` shows tasks and safe workspace summaries; restricted family/medical/reference details are summarized or hidden.
7. `/verify/` reads operator-scoped draft details and source-card review state.
8. Consent events are recorded through `/api/v1/seafarer/consents`.
9. A vacancy application cannot be presented to an employer until approval guard checks pass.
10. `/post-vacancy/` employer-presented candidates receive minimized candidate and `document_summary` data only.
11. `/vacancies/` remains public vacancy read-only surface and does not expose seafarer records.

## 15. Remaining Gaps

1. The restricted medical detail workflow is still capability-denied for general operators. A future role/capability model is required before any medical-detail review route can be activated.
2. `seafarer_publication_snapshots` exists as a future publication model, but full public/employer profile publication remains blocked until a later approved slice.
3. Employer-facing data is currently minimized; future reviewed candidate summaries must continue to use explicit allow lists and consent/approval guard checks.
4. The private Excel source remains outside Git and public web root. Any future field additions must be traced through BP-011 and the source-card coverage/visibility matrices.

## 16. Final Checklist

| Requirement | Status |
|---|---|
| No new functionality added | Met |
| DB inspection read-only | Met |
| No real personal data included | Met |
| Pages/forms inventoried | Met |
| UI ids / JS keys / backend keys inventoried | Met |
| Source-card mapping included | Met |
| DB/JSON storage location included | Met |
| API endpoints included | Met |
| Role visibility and employer payload rules included | Met |
| Tests run and reported | Met; stale cabinet-summary test drift resolved and focused suite passed |
| Remaining gaps documented | Met |
| Generated Playwright/test artifacts excluded from intended final changes | Met during final cleanup |
