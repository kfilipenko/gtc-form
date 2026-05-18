# CrewPortGlobal — CPG-CABINET-025 User Personal Cabinet Dashboard Report

- Project: CrewPortGlobal.com
- Issue: #17 — CPG-CABINET-025
- Date: 2026-05-18
- Author: GTC IT / AI Assistant
- Status: Implemented for Project Owner review
- Scope: Frontend MVP personal cabinet using existing registration draft and document metadata APIs

## 1. Purpose

This document records the first MVP implementation of the CrewPortGlobal user personal cabinet:

```text
/cabinet/
```

The cabinet gives a registered user a task-first view of the current service context, documents, profile/request status, available service areas and support guidance.

The implementation follows the BP-005, BP-006, BP-007 and CPG-DOC-024 direction:

```text
My tasks is the first always-open card.
All other cabinet cards are collapsed by default and open on user action.
Correction requests become actionable user tasks.
Replacement uploads reuse the protected upload, ClamAV scan and document replacement flow.
```

## 2. Mandatory Baseline Check

Before implementation, the CPG-DOC-024 baseline was confirmed as synchronized:

```text
docs/crewportglobal/114_cpg_doc_024_document_correction_task_replacement_report.md
tests/crewportglobal-document-correction-tasks.spec.ts
docs/crewportglobal/00_documentation_register.md version 1.03
```

The implementation was not based on stale code.

## 3. Implemented Scope

Created:

```text
projects/crewportglobal/public/cabinet/index.html
tests/crewportglobal-cabinet-dashboard.spec.ts
docs/crewportglobal/115_cpg_cabinet_025_user_personal_cabinet_dashboard_report.md
```

Updated:

```text
docs/crewportglobal/00_documentation_register.md
```

## 4. Cabinet Sections

The MVP cabinet contains:

```text
1. User summary
2. My tasks
3. My documents
4. My profile / request status
5. My services
6. Next contact / support action
```

Presentation rule:

```text
My tasks is first and always open.
User summary, My documents, My profile / request status, My services and Next contact / support action are collapsed by default.
```

## 5. Data Source

This slice intentionally does not introduce a new account-session cabinet API.

The MVP cabinet loads transitional context from:

```text
?draft_id=...
local browser draft context
GET /api/v1/registration/drafts/{draft_id}
GET /api/v1/registration/drafts/{draft_id}/documents?form_type=...
POST /api/v1/registration/drafts/{draft_id}/documents
```

No raw document file is exposed to the user.

Only document metadata and status information are displayed.

## 6. My Tasks Logic

The cabinet computes tasks from visible document metadata.

Correction task source:

```text
uploaded_documents
where review_status in correction_requested / rejected
and review_note is present
```

Displayed task:

```text
Action required: upload corrected document
Document: {document_type}
Status: {review_status}
Reason: {review_note}
Action: Upload replacement
```

If the replacement upload is clean and accepted by the existing protected upload flow:

```text
old correction task is hidden by replacement behavior;
new document is visible in My documents;
scan_status = clean;
review_status = pending_human_review;
cabinet shows Waiting for team review.
```

If the replacement is unsafe or invalid:

```text
task remains open;
user sees replacement upload failure;
old document correction state remains actionable.
```

If no draft context is available:

```text
Action required: open registration
```

## 7. My Documents

The document list shows metadata only:

```text
document_type
original_filename
mime_type
file_size_bytes
sha256_hash
scan_status
review_status
uploaded_at
review_note when available
```

The cabinet does not show:

```text
storage_root
storage_path
server absolute path
public download URL
raw file contents
```

## 8. My Services

The cabinet shows the current service area based on the draft role:

```text
seafarer -> Seafarer / specialist workspace
employer / shipowner / crewing_manager -> Buyer / employer workspace
```

The cabinet also provides a capability expansion link:

```text
seafarer context -> Request buyer / employer capability
employer context -> Request seafarer / specialist capability
```

This reflects the product rule that one physical person may request multiple capability cards, but authorization is only granted after review and evidence.

## 9. Internationalization

Visible cabinet text is provided through page-level i18n keys with English as canonical source and Russian fallback entries for the new page.

Existing public i18n validation was run.

## 10. Verification

Commands run:

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-cabinet-dashboard.spec.ts
node projects/crewportglobal/scripts/check_public_i18n.js
npm run test:cpg-api
git diff --check
```

Results:

```text
cabinet Playwright test: 3 passed
public i18n validator: passed
npm run test:cpg-api: 15 passed
git diff --check: passed
```

Covered cabinet scenarios:

```text
no draft context shows open-registration task;
seafarer correction task is displayed;
unsafe replacement upload keeps correction task open;
clean seafarer replacement closes task and returns document to Waiting for team review;
employer correction task is displayed;
clean employer replacement closes task and returns document to Waiting for team review;
service capability expansion links are visible;
document metadata is visible without raw file exposure.
```

## 11. Security and Boundary Confirmation

Not implemented in this slice:

```text
OCR
AI document analysis
public direct document URLs
user raw-file download endpoint
email notifications
full login/session rebuild
Stripe changes
OpenClaw changes
nginx/server configuration changes
deployment
```

No backend schema change was made.

No production deployment was performed.

## 12. Remaining Risks and Gaps

This is a practical MVP cabinet, not the final account-based cabinet.

Known gaps:

```text
cabinet context is still draft_id-based, not full account-session based;
multi-capability physical-person aggregation is not yet backed by a final cabinet API;
Tasks are computed from uploaded document metadata only;
no separate user_tasks / client_tasks table is introduced yet;
SLA color logic is not yet connected to deadline data;
support contact workflow is informational only;
phone confirmation remains to configure;
authorization card approval remains a future backend slice.
```

## 13. Final Recommendation

The MVP personal cabinet is ready for Project Owner review.

Recommended next implementation step:

```text
Create an account-session based /api/v1/me/cabinet contract that aggregates physical person identity, confirmed service account, capability cards, scoped visibility, document tasks, service areas and support actions without relying on draft_id as the primary cabinet context.
```
