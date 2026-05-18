# CPG-DOC-023 - Protected Document Review Queue And Authorized Reviewer File Access Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-17
- Document type: Implementation report
- Status: MVP protected document review queue implemented for Project Owner review

## 1. Purpose

This report records the first internal document-review workflow for uploaded CrewPortGlobal documents that have already passed malware scanning.

The implemented target flow is:

```text
clean uploaded document -> internal review queue -> protected reviewer download -> review decision -> audit event
```

The slice keeps uploaded files outside public access and gives authorized operators / team sessions a controlled way to review clean files only.

## 2. Baseline

Primary baseline:

```text
docs/crewportglobal/business_processes/10_document_upload_storage_and_review_procedure.md
```

Implementation baseline:

```text
docs/crewportglobal/112_cpg_doc_022_protected_upload_storage_clamav_report.md
```

CPG-DOC-022 provided:

```text
protected storage outside public web root
uploaded_documents metadata
ClamAV scanning
scan_status = clean for files that passed malware scanning
review_status = pending_human_review for clean files awaiting human review
metadata-only user-facing document list
```

## 3. Changed Files

Backend:

```text
projects/crewportglobal/app/backend/api/public/index.php
projects/crewportglobal/app/backend/api/lib/admin_access_flow.php
projects/crewportglobal/app/backend/api/README.md
```

Frontend:

```text
projects/crewportglobal/public/team/documents/index.html
```

Tests:

```text
tests/crewportglobal-registration-api.spec.ts
tests/crewportglobal-document-review-ui.spec.ts
```

Documentation:

```text
docs/crewportglobal/113_cpg_doc_023_protected_document_review_queue_report.md
docs/crewportglobal/00_documentation_register.md
```

## 4. Document Review Queue Endpoint

Added internal metadata endpoint:

```text
GET /api/v1/operator/document-review-queue
```

The endpoint returns only reviewable documents:

```text
scan_status = clean
review_status IN (pending_human_review, under_review, correction_requested)
upload_state = stored_protected
hidden_from_user_at IS NULL
```

The response includes:

```text
document_id
draft_id
form_type
document_type
original_filename
file_size_bytes
scan_status
review_status
uploaded_at
related user e-mail / display name when safely available
```

The response does not include:

```text
storage_root
storage_path
server absolute path
public file URL
```

Documents with the following scan states are not shown as reviewable:

```text
infected
scan_error
blocked
not_scanned
pending
```

## 5. Authorized File Access Endpoint

Added controlled reviewer download endpoint:

```text
GET /api/v1/operator/documents/{document_id}/download
```

Access and safety rules:

```text
operator/team access is required
document_id must be a valid UUID
scan_status must be clean
upload_state must be stored_protected
storage path is resolved server-side only
resolved file path must remain under storage_root
original_filename is used only as the download display name
storage_path is not exposed in the response
```

Safe response headers:

```text
Content-Type
Content-Length
Content-Disposition
X-Content-Type-Options: nosniff
Cache-Control: no-store, private
```

Blocked / infected / unscanned files are rejected before any file access.

## 6. Review Decision Endpoint

Added review decision endpoint:

```text
PATCH /api/v1/operator/documents/{document_id}/review
```

Allowed decisions:

```text
start_review
accept
needs_correction
reject
```

Decision mapping:

```text
start_review -> under_review
accept -> verified
needs_correction -> correction_requested
reject -> rejected
```

Review-note rules:

```text
needs_correction -> review_note required
reject -> review_note required
start_review -> review_note optional
accept -> review_note optional
```

The endpoint updates:

```text
review_status
review_note when supplied
reviewed_by_user_id when an account-backed team session is available
reviewed_at
updated_at
```

It does not change scan status and does not grant any public file access.

## 7. Access Control

Document-review operator routes accept the existing internal access models:

```text
X-CPG-Operator-Token
Authorization: Bearer <approved admin/team session token>
```

Approved team/admin session access is limited to users who can view protected team links through the current access-control flow.

This slice does not weaken existing authentication and does not make `/verify/` or public registration routes more public.

## 8. Audit Events

Added audit events through `crewportglobal.registration_audit_events`.

Document view / download:

```text
document_viewed
```

Review decision:

```text
document_review_decision_recorded
```

Audit payload includes:

```text
document_id
draft_id
form_type
document_type
previous_review_status
new_review_status
decision
review_note when present
scan_status
access_model
```

Audit source:

```text
operator_document_review
```

## 9. UI Page

Added internal document review page:

```text
projects/crewportglobal/public/team/documents/index.html
https://crewportglobal.com/team/documents/
```

The page provides:

```text
document queue
filters by form_type
filters by document_type
filters by review_status
clean-only scan status filter
selected document summary
protected download action
review note textarea
Start review action
Accept action
Needs correction action
Reject action
current scan_status and review_status display
```

The page does not expose direct public document URLs. Downloads are performed through the protected API endpoint.

The protected team links list now includes:

```text
Document Review Queue -> https://crewportglobal.com/team/documents/
```

## 10. User-Facing Status

The existing draft document metadata endpoint remains metadata-only:

```text
GET /api/v1/registration/drafts/{draft_id}/documents
```

Users still do not receive raw document files in this task.

When a document receives:

```text
review_status = correction_requested
review_status = rejected
```

the existing metadata response includes `review_note`, allowing user-facing forms to show the reason without exposing the protected file.

## 11. Tests

API tests added / extended:

```text
upload clean seafarer document
document appears in review queue
download endpoint returns clean file
downloaded file hash matches uploaded file hash
document_viewed audit event is written
start_review changes review_status to under_review
needs_correction without note returns 400
needs_correction with note changes status and stores note
document_review_decision_recorded audit event is written
user-facing document metadata shows correction note
infected metadata row is not shown in queue
infected metadata row is not downloadable
infected metadata row is not reviewable
```

UI test added:

```text
open /team/documents/
load clean uploaded document through operator token
select document
record Start review
record Needs correction with note
verify visible status updates
```

## 12. Verification Performed

PHP syntax:

```text
php -l projects/crewportglobal/app/backend/api/public/index.php
php -l projects/crewportglobal/app/backend/api/lib/admin_access_flow.php
```

Automated tests:

```text
npm run test:cpg-api
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-document-review-ui.spec.ts
```

Repository hygiene:

```text
git diff --check
```

Public i18n validator:

```text
node projects/crewportglobal/scripts/check_public_i18n.js
```

## 13. Security Checks

Confirmed:

```text
only clean scanned files are queue-visible
only clean stored_protected files are downloadable
infected / blocked / not_scanned / scan_error files are rejected
download endpoint does not expose storage_path
server path is resolved and checked under storage_root
original filename is used only for Content-Disposition display
no public direct document URL was created
user-facing raw file download was not implemented
audit event is written for document download/view
audit event is written for review decision
review_note is required for correction and rejection decisions
```

## 14. Boundaries

Not done in this task:

```text
OCR
AI document analysis
public direct document URLs
public user file download
final document accept/reject UI for users
reviewer assignment / task ownership automation
document retention automation
Stripe changes
OpenClaw changes
deployment
```

No new database migration was required for CPG-DOC-023 because the slice uses the existing CPG-DOC-022 `uploaded_documents` metadata table and the existing registration audit table.

## 15. Remaining Risks

Current limitations:

```text
operator-token access remains a temporary internal access model
full role-permission enforcement for document reviewers is still a future access-control phase
document review is not yet assigned to named task owners
review queue does not yet include SLA colors or workload counters
users can see review status and note but cannot yet upload corrected replacements from this review panel
```

These limitations are acceptable for the first protected review slice but must be addressed before broad operational rollout.

## 16. Final Recommendation

The MVP protected document review queue and authorized reviewer file access slice is ready for Project Owner review.

Clean uploaded documents can now be listed in an internal queue, downloaded through a protected API endpoint, moved through review decisions and audited. Infected, blocked, unscanned and scan-error files remain unavailable for review and download.

Recommended next step:

```text
CPG-DOC-024 - reviewer task ownership, SLA indicators and corrected document replacement workflow
```
