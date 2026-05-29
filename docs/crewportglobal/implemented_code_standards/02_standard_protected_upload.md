# ICS-002 - Standard Protected Upload

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Documentation block: Implemented code standards
- Document type: Implemented code standard
- Version: 1.3
- Date: 2026-05-29
- Status: Active

## 1. Purpose

This standard defines reusable protected document upload behavior for CrewPortGlobal forms.

The standard exists because upload behavior must remain consistent across data streams:

1. seafarer supply;
2. employer/company demand;
3. vessel context;
4. crew request / vacancy requirement;
5. future correction forms.

## 2. Applies To

Current adopters:

```text
/create-profile/
/post-vacancy/
```

Future adopters:

1. owner document correction routes;
2. team review workspaces;
3. company/vessel document forms;
4. future candidate presentation evidence forms.

## 3. Canonical Implementation

```text
projects/crewportglobal/public/assets/crewportglobal-protected-upload.js
```

Canonical API:

```text
window.CPGProtectedUpload.createController(config)
window.CPGProtectedUpload.createDocumentChecklist(config)
```

## 4. Standard Rules

The canonical helper enforces:

| Rule | Value |
|---|---|
| Single-file frontend limit | `10 MB` |
| Allowed MIME types | `application/pdf`, `image/jpeg`, `image/png`, `image/webp` |
| Allowed extensions | `.pdf`, `.jpg`, `.jpeg`, `.png`, `.webp` |
| Empty file handling | Specific user message |
| Unsupported type handling | Specific user message |
| Backend error handling | Code-based translation with fallback to exact backend message |
| Document list rendering | Shared rendering for uploaded documents |
| Correction/replacement task rendering | Shared rendering for `correction_requested` and `rejected` documents |
| Successful upload feedback | Status must include the uploaded filename and the refreshed document list must show the uploaded record. |
| Fixed document catalogs | Shared compact row-level checklist with one visible `Upload` / `Replace` button per document type. |

## 5. Adapter Contract

Each page adapter must provide:

| Adapter input | Purpose |
|---|---|
| `nodes.type` | Document type select. |
| `nodes.file` | File input. |
| `nodes.submit` | Upload button. |
| `nodes.status` | Upload status/output node. |
| `nodes.actionList` | Document correction/replacement task list. |
| `nodes.list` | Uploaded document list. |
| `translationPrefix` | Page-specific translation namespace. |
| `formType` | Backend upload form type. |
| `listFormType` | Backend document-list form type. |
| `getDraftId` | Active draft ID. |
| optional `beforeUpload` | Role/form gate before upload. |
| optional `onUploaded` | Page-specific refresh, such as completeness re-check. |

For finite document catalogs, page adapters should use:

```text
window.CPGProtectedUpload.createDocumentChecklist(config)
```

The checklist adapter receives the protected-upload controller, document type nodes, list node, translation adapter and optional document-type metadata. It renders one compact row per document type and delegates actual upload, validation, error handling and list refresh back to the canonical controller.

## 6. Forbidden Local Logic

Pages must not duplicate:

1. file-size validation;
2. allowed MIME/extension validation;
3. backend upload error decoding;
4. uploaded document list rendering;
5. correction/replacement document task rendering;
6. upload button disable/enable flow;
7. successful-upload filename/status handling.
8. compact document checklist rendering for fixed document catalogs.

Page-specific differences must be passed as adapter configuration.

## 7. Current Tests

Current regression coverage includes:

```text
tests/crewportglobal-create-profile-prefill.spec.ts
tests/crewportglobal-post-vacancy-workspace.spec.ts
tests/crewportglobal-document-correction-tasks.spec.ts
```

The tests check exact `10 MB` validation, unsupported file validation, seafarer draft role behavior and demand-side completeness behavior after standard adoption.

The `/create-profile/` regression also checks that a successful upload status includes the uploaded filename and that the refreshed protected-document list shows the uploaded file and document type.

The document-correction regression checks that row-level replacement closes the old correction task only after a clean replacement and that employer authorization evidence uses the same checklist replacement path.

The `/post-vacancy/` regression also checks that employer and vessel evidence can use separate checklist adapters on the same page:

```text
form_type = employer -> authority evidence
form_type = vessel   -> vessel particulars and vessel evidence
```

This prevents vessel documents from being treated as company authority documents and keeps future matching evidence tied to the correct `V-*` stream.

## 8. Change Propagation Rule

If protected upload behavior changes, update:

1. `crewportglobal-protected-upload.js`;
2. page adapters only when adapter contract changes;
3. focused upload tests for `/create-profile/` and `/post-vacancy/`;
4. this standard and BP-014.

## 9. Next Adoption Targets

1. owner correction upload forms;
2. team review document workspaces;
3. future company/vessel profile document forms;
4. future AI/OCR document extraction adapters that read from protected storage but keep owner confirmation and human review gates.
