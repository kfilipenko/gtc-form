# ICS-002 - Standard Protected Upload

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Documentation block: Implemented code standards
- Document type: Implemented code standard
- Version: 1.0
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

## 6. Forbidden Local Logic

Pages must not duplicate:

1. file-size validation;
2. allowed MIME/extension validation;
3. backend upload error decoding;
4. uploaded document list rendering;
5. correction/replacement document task rendering;
6. upload button disable/enable flow.

Page-specific differences must be passed as adapter configuration.

## 7. Current Tests

Current regression coverage includes:

```text
tests/crewportglobal-create-profile-prefill.spec.ts
tests/crewportglobal-post-vacancy-workspace.spec.ts
```

The tests check exact `10 MB` validation, unsupported file validation, seafarer draft role behavior and demand-side completeness behavior after standard adoption.

## 8. Change Propagation Rule

If protected upload behavior changes, update:

1. `crewportglobal-protected-upload.js`;
2. page adapters only when adapter contract changes;
3. focused upload tests for `/create-profile/` and `/post-vacancy/`;
4. this standard and BP-014.

## 9. Next Adoption Targets

1. owner correction upload forms;
2. team review document workspaces;
3. future company/vessel profile document forms.
