# CPG-DOC-024 - User-Facing Document Correction Task And Replacement Upload Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-18
- Document type: Implementation report
- Status: MVP user-facing document correction task implemented for Project Owner review

## 1. Purpose

This report records the first user-facing task layer for documents that require correction after human review.

The implemented target flow is:

```text
reviewer requests correction -> user sees clear task -> user uploads replacement -> old task closes when replacement is clean -> new clean file returns to team review queue
```

The slice turns document status into a practical action for the user without introducing a full `user_tasks` or `client_tasks` table before the task model is ready.

## 2. Baseline

Primary baseline:

```text
docs/crewportglobal/business_processes/10_document_upload_storage_and_review_procedure.md
```

Implementation baselines:

```text
docs/crewportglobal/112_cpg_doc_022_protected_upload_storage_clamav_report.md
docs/crewportglobal/113_cpg_doc_023_protected_document_review_queue_report.md
```

CPG-DOC-022 provided protected upload and clean-file replacement behavior.

CPG-DOC-023 provided internal reviewer decisions:

```text
needs_correction -> review_status = correction_requested
reject -> review_status = rejected
review_note stored in uploaded_documents
```

## 3. Implemented Scope

The MVP task is computed from existing document metadata:

```text
uploaded_documents.review_status IN (correction_requested, rejected)
AND uploaded_documents.review_note IS NOT NULL / not empty
AND hidden_from_user_at IS NULL
```

No new task table was added.

The task is shown as a user action block containing:

```text
Action required: upload corrected document
document type
review status
review note / correction reason
Upload replacement button
next-action hint
```

## 4. Changed Files

Frontend:

```text
projects/crewportglobal/public/create-profile/index.html
projects/crewportglobal/public/post-vacancy/index.html
```

Tests:

```text
tests/crewportglobal-document-correction-tasks.spec.ts
```

Documentation:

```text
docs/crewportglobal/114_cpg_doc_024_document_correction_task_replacement_report.md
docs/crewportglobal/00_documentation_register.md
```

## 5. Seafarer Page Behavior

Updated:

```text
/create-profile/
```

When a seafarer document has:

```text
review_status = correction_requested
review_note = present
```

the document upload section shows:

```text
Action required: upload corrected document
Document: <document type>
Status: Correction requested
Reason: <review note>
Upload replacement
```

Clicking `Upload replacement`:

```text
selects the same document_type
focuses the file input
shows a replacement hint
keeps the user on the same page and workflow
```

When the replacement is uploaded and passes malware scan:

```text
old document is hidden/superseded by existing backend replacement behavior
task disappears
new document displays Waiting / Pending human review
new clean document appears in the team document review queue
```

If the replacement fails malware scanning:

```text
upload is rejected
old correction task remains visible
user must choose another file
```

## 6. Employer Page Behavior

Updated:

```text
/post-vacancy/
```

The same user-facing task pattern is applied for employer-side documents, including authority evidence and company documents.

The page shows the task for documents such as:

```text
authorization_letter
power_of_attorney
company_registration
representative_id
```

The replacement upload uses the same protected upload endpoint and existing clean-file replacement behavior.

## 7. Display Rules

The existing uploaded document list now avoids a misleading message:

```text
Pending human review
```

is shown only when:

```text
scan_status = clean
review_status = pending_human_review
```

For correction/rejection cases, the list shows the review reason instead.

## 8. i18n

New visible text was added through page translation dictionaries with English canonical text and Russian translations.

Fallback behavior remains unchanged for other languages.

## 9. Tests

Added focused UI/API test file:

```text
tests/crewportglobal-document-correction-tasks.spec.ts
```

Covered seafarer flow:

```text
upload clean medical certificate
reviewer records needs_correction with note
unsafe EICAR replacement is rejected
correction task remains visible after unsafe replacement
user clicks Upload replacement
user uploads clean replacement
task disappears
new document shows Pending human review
new clean document appears in document review queue
old corrected document is no longer queue-visible
```

Covered employer flow:

```text
upload clean authorization letter
reviewer records needs_correction with note
employer page shows correction task
user uploads clean replacement
task disappears
new clean document appears in document review queue
old corrected document is no longer queue-visible
```

## 10. Verification Performed

Focused UI/API test:

```text
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-document-correction-tasks.spec.ts
```

Result:

```text
2 passed
```

API regression suite:

```text
npm run test:cpg-api
```

Result:

```text
15 passed
```

Public i18n validator:

```text
node projects/crewportglobal/scripts/check_public_i18n.js
```

Result:

```text
English canonical coverage complete for all referenced i18n keys.
Existing non-English fallback warnings remain unchanged.
```

Repository hygiene:

```text
git diff --check
```

Result:

```text
passed
```

## 11. Security And Boundary Checks

Confirmed:

```text
no public file download was added
no public document URL was added
replacement upload uses existing protected upload endpoint
malware scan remains mandatory
unsafe replacement does not hide the existing correction task
old document is hidden only after a clean replacement succeeds
new clean replacement returns to team review queue
review_note is visible as user-facing correction reason
```

Not done in this task:

```text
new user_tasks table
new client_tasks table
OCR
AI document analysis
reviewer assignment
SLA colors
public user file download
Stripe changes
OpenClaw changes
deployment
```

No backend schema change was required.

## 12. Remaining Risks

Current task blocks are computed from `uploaded_documents`, not persisted as separate task records.

This is acceptable for the MVP, but future workflow should introduce a task model when CrewPortGlobal implements:

```text
assigned task owners
deadlines
SLA colors
task counters
manager/client visibility
full personal cabinet task dashboard
```

## 13. Final Recommendation

The MVP user-facing document correction task and replacement-upload flow is ready for Project Owner review.

Recommended next step:

```text
CPG-DOC-025 - document reviewer task ownership, SLA indicators and personal-cabinet task aggregation
```
