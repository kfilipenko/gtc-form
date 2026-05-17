# CPG-DOC-022 - Protected Document Upload Storage And ClamAV Scanning Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-17
- Document type: Implementation report
- Status: MVP protected upload storage and malware scanning slice implemented for Project Owner review

## 1. Purpose

This report records the first implementation slice for protected document uploads under the BP-010 document-upload baseline.

The implemented target flow is:

```text
upload -> quarantine -> malware scan -> clean -> protected storage -> pending human review
```

The slice prepares CrewPortGlobal to collect evidence files for seafarer/specialist and employer-side authorization workflows without exposing uploaded documents through public URLs.

## 2. Baseline Documents

Primary baseline:

```text
docs/crewportglobal/business_processes/10_document_upload_storage_and_review_procedure.md
```

Additional documents checked:

```text
docs/crewportglobal/business_processes/03_client_cards_for_employer_demand_and_seafarer_supply_model.md
docs/crewportglobal/business_processes/04_card_field_dictionary_and_workflow_states.md
docs/crewportglobal/business_processes/05_personal_cabinet_and_scoped_visibility_requirements.md
docs/crewportglobal/business_processes/08_client_registration_and_interaction_procedure.md
```

## 3. Field And Card Compliance Findings

### 3.1 Seafarer / Specialist

Current implementation already supports or maps the following fields:

```text
full_name / display name
email
contact_phone
rank / primary_rank
department
nationality_code
residence_country_code
availability_date
availability_status
salary_expectation_usd
preferred_vessel_types
document_metadata
review_status
```

The following fields remain future workflow fields and were not added in this upload MVP:

```text
responsible_manager
current_specialist
```

Document upload support was added in this slice.

### 3.2 Employer-Side Buyer / Requester

Current implementation already supports or maps the following fields:

```text
full_name / contact name
email
company_name
company_type
country_code
role_in_company
verification_status
vessel context where already present
crew / vacancy request fields where already present
```

The following fields remain future workflow fields and were not added in this upload MVP:

```text
responsible_manager
current_specialist
```

Authority evidence and company document upload support were added in this slice.

## 4. Protected Storage

Protected server storage root:

```text
/srv/crewportglobal/storage/documents/
```

Storage categories:

```text
/srv/crewportglobal/storage/documents/seafarer/
/srv/crewportglobal/storage/documents/employer/
/srv/crewportglobal/storage/documents/vessel/
```

Quarantine folder:

```text
/srv/crewportglobal/storage/documents/_quarantine/
```

MVP path before scanning:

```text
/srv/crewportglobal/storage/documents/_quarantine/{form_type}/drafts/{draft_id}/
```

MVP path after a clean scan:

```text
/srv/crewportglobal/storage/documents/{form_type}/drafts/{draft_id}/
```

Server filenames are generated as:

```text
{document_id}.{safe_extension}
```

Original filenames are stored only as metadata.

Storage directories were created outside the public web root. No uploaded files are stored in Git or under `projects/crewportglobal/public/`.

## 5. Malware Scanner

Scanner installed:

```text
ClamAV
clamav
clamav-daemon
```

Scanner commands verified:

```text
clamscan
clamdscan
freshclam
```

Scanner version:

```text
ClamAV 1.4.4 / signature database 28003 / 2026-05-17
```

Signature update status:

```text
freshclam completed successfully; daily, main and bytecode databases available.
```

Scanner test results:

```text
clean test file -> OK
EICAR test file -> Eicar-Test-Signature FOUND
```

EICAR was used only as a standard antivirus test and was not committed to Git.

## 6. Database Migration

The requested migration number `003_create_uploaded_documents.sql` was already occupied by the vacancy request migration.

The next safe migration number was used:

```text
projects/crewportglobal/app/backend/db/migrations/007_create_uploaded_documents.sql
```

The migration creates:

```text
crewportglobal.uploaded_documents
```

The table includes metadata for:

```text
document identity
person / user / draft / card linkage
form_type
document_type
original filename
stored filename
storage root and protected path
safe extension
MIME type
file size
SHA-256 hash
upload state
review status
scan status
scan timestamp
replacement / supersession linkage
review fields
task linkage
timestamps
```

Supported `form_type` values:

```text
seafarer
employer
vessel
```

Supported upload states:

```text
draft_selected
upload_received
quarantine_pending_scan
scan_passed
scan_failed
stored_protected
upload_rejected
replaced_hidden
deleted_with_card_or_account
```

Supported review statuses:

```text
not_submitted
pending_human_review
under_review
verified
rejected
correction_requested
superseded
```

Supported scan statuses:

```text
not_scanned
pending
clean
infected
scan_error
blocked
```

Indexes were added for:

```text
draft_id
form_type
document_type
review_status
scan_status
sha256_hash
uploaded_at
visible document lookup
```

## 7. Backend Endpoints

The backend upload/list endpoints were added under the existing registration API convention:

```text
POST /api/v1/registration/drafts/{draft_id}/documents
GET  /api/v1/registration/drafts/{draft_id}/documents
```

POST accepts `multipart/form-data` fields:

```text
file
document_type
form_type
valid_from optional
valid_until optional
```

Implemented controls:

```text
draft_id must exist
form_type must be seafarer, employer or vessel
document_type must match the selected form type
file is required
allowed MIME: PDF, JPG/JPEG, PNG, WEBP
max file size: 10 MB
max total files per draft: 20
max total size per draft: 100 MB
stored filename generated from document_id
sha256_hash calculated
file saved to quarantine before final storage
ClamAV scan executed
only clean files moved to protected storage
```

GET returns safe metadata only:

```text
document_id
document_type
original_filename
mime_type
file_size_bytes
sha256_hash
upload_state
review_status
scan_status
uploaded_at
valid_from
valid_until
review_note
```

GET does not return:

```text
storage_root
storage_path
server absolute path
public URL
```

## 8. Status Behavior

Initial upload state:

```text
upload_state = quarantine_pending_scan
scan_status = pending
review_status = not_submitted
```

Clean scan result:

```text
upload_state = stored_protected
scan_status = clean
review_status = pending_human_review
```

Infected scan result:

```text
upload_state = scan_failed
scan_status = infected
review_status = rejected
```

Scanner error result:

```text
upload_state = scan_failed
scan_status = scan_error
review_status = not_submitted
```

Replacement behavior:

```text
new clean upload for the same draft/form/document type hides the previous visible document;
the previous document becomes replaced_hidden / superseded and receives hidden_from_user_at.
```

## 9. Frontend Upload Sections

Upload sections were added to:

```text
projects/crewportglobal/public/create-profile/index.html
projects/crewportglobal/public/post-vacancy/index.html
```

Shared frontend helper updated:

```text
projects/crewportglobal/public/assets/crewportglobal-registration-drafts.js
```

Seafarer document types:

```text
passport_or_id
seamans_book
certificate_of_competency
stcw_certificate
medical_certificate
maritime_cv
experience_record
training_certificate
language_certificate
other_professional_evidence
```

Employer-side document types:

```text
company_registration
company_license
representative_id
authorization_letter
power_of_attorney
employment_or_management_proof
crew_request_brief
service_request_document
billing_or_commercial_evidence
other_authority_evidence
```

Frontend behavior:

```text
if draft_id is missing, the page asks the user to save the form first;
after upload, the uploaded document list is refreshed;
scan_status is shown;
review_status is shown;
Pending human review is shown only after scan_status = clean.
```

## 10. Test Results

Safe checks completed:

```bash
php -l projects/crewportglobal/app/backend/api/lib/document_uploads.php
php -l projects/crewportglobal/app/backend/api/public/index.php
node projects/crewportglobal/scripts/check_public_i18n.js
npm run test:cpg-api
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-register-routing.spec.ts
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-create-profile-prefill.spec.ts
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-post-vacancy-workspace.spec.ts
git diff --check
```

API test coverage confirmed:

```text
create seafarer draft
upload valid small PDF
metadata row created
file exists under protected storage
sha256_hash stored and verified
scan_status = clean
review_status = pending_human_review
GET documents returns metadata
GET metadata hides storage root and storage path
create employer draft
upload valid PNG
unsupported extension rejected
missing document_type rejected
invalid form_type rejected
file > 10 MB rejected
EICAR content rejected before protected storage
```

Playwright checks confirmed:

```text
registration routing remains valid
separate authorization form pages remain valid
create-profile prefill/draft behavior remains valid
post-vacancy workspace save/reload behavior remains valid
```

## 11. Security Checks

Confirmed:

```text
storage root is outside public
quarantine folder exists
clean files move out of quarantine only after clean scan
no public direct URL is produced
stored filename is generated
original filename is metadata only
path traversal is blocked by generated storage paths and controlled form/document catalogs
MIME, extension and size controls are enforced
SHA-256 hash is stored
scanner is installed and tested
EICAR is blocked
uploaded test files are not committed to Git
```

## 12. Changed Files

```text
projects/crewportglobal/app/backend/db/migrations/007_create_uploaded_documents.sql
projects/crewportglobal/app/backend/api/lib/document_uploads.php
projects/crewportglobal/app/backend/api/public/index.php
projects/crewportglobal/public/assets/crewportglobal-registration-drafts.js
projects/crewportglobal/public/create-profile/index.html
projects/crewportglobal/public/post-vacancy/index.html
playwright.crewportglobal.api.config.ts
playwright.crewportglobal.config.ts
tests/crewportglobal-registration-api.spec.ts
docs/crewportglobal/112_cpg_doc_022_protected_upload_storage_clamav_report.md
docs/crewportglobal/00_documentation_register.md
```

## 13. Boundaries

Not done:

```text
public direct document downloads
final document accept/reject UI
OCR
AI document analysis
Stripe changes
OpenClaw changes
nginx/server deployment changes
production deployment
```

Database note:

```text
The migration file was created in the repository and applied only to the local/test database context used by the safe API checks. No production deployment was performed in this slice.
```

Runtime server note:

```text
The test PHP server was started with upload/post limits high enough to verify the application-level 10 MB upload rule. Production PHP/FPM upload limits should be reviewed before enabling the feature publicly.
```

## 14. Remaining Risks

Remaining implementation risks before full production use:

```text
human document review UI is not implemented yet
protected document download/view endpoint for authorized reviewers is not implemented yet
retention and cleanup automation is not implemented yet
production PHP/FPM upload limits must be checked before public enablement
phone verification remains a later authentication step
```

## 15. Final Recommendation

The MVP protected upload storage and malware scanning slice is ready for Project Owner review.

Seafarer and employer-side documents can be uploaded to protected server storage, scanned by ClamAV, stored with metadata in PostgreSQL and marked as pending human review only when the scan result is clean.

Recommended next slice:

```text
CPG-DOC-023 - protected document review queue and authorized reviewer file access
```
