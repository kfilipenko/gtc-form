# BP-010 - Document Upload, Storage And Review Procedure

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Source task: GitHub Issue #14 / CPG-DOC-021
- Date: 2026-05-17
- Document type: Business-process / implementation-control document
- Status: Drafted for Project Owner review

## 1. Purpose

This document defines how CrewPortGlobal must collect, store, classify, scan and review documents uploaded during registration, authentication and authorization workflows.

The document is created before the first real upload endpoint so implementation does not become chaotic.

Core principle:

```text
Files are stored in protected server storage.
The database stores metadata, status, card relationship and storage reference.
Documents are never stored in public web directories, Git or direct public URLs.
```

## 2. Scope

This procedure applies to documents connected with:

```text
1. Seafarer / Specialist authorization forms.
2. Buyer / Employer authorization forms.
3. Vessel-related future authorization or request forms.
4. Future vacancy / crew request evidence when the request requires uploaded documents.
```

It covers:

```text
document categories
protected folder structure
file naming
metadata model
allowed formats and size limits
virus / malware scanning
document statuses
review procedure
visibility and access
user-facing behavior
team-facing behavior
implementation decisions required before upload endpoint
```

It does not implement:

```text
upload endpoint
database migration
server directory creation
antivirus installation
file preview
document review UI
authorization approval
```

## 3. Business Context

CrewPortGlobal authorization depends on evidence.

Examples:

```text
Seafarer / Specialist:
  evidence of identity, qualification, professional readiness and maritime documents.

Buyer / Employer:
  evidence of company context, representative authority, right to submit a crew request and buyer-side demand.

Vessel:
  evidence or structured reference to vessel type, operational context and future matching / pricing relevance.
```

Documents are not separate from the card model. Each document must be linked to:

```text
physical person
service account
authorization form / card draft
form type
task or review case
current document status
responsible reviewer when assigned
```

## 4. Form Categories And Storage Categories

Approved top-level document categories:

```text
seafarer
employer
vessel
```

The initial form categories are:

```text
seafarer / моряк
employer / работодатель
```

The `vessel` category must be included from the beginning as a future separate form and document class.

Important product note:

```text
For the current workflow, vessel type is often more important than the name of one specific vessel.
```

Vessel type affects:

```text
matching between demand and supply;
seafarer expectations;
required certificates;
required experience;
risk and complexity;
service pricing;
future vacancy / crew request structure.
```

CrewPortGlobal should therefore prepare a vessel-type reference dictionary instead of relying only on free text or a single vessel name.

## 5. Protected Storage Root

Recommended protected storage root:

```text
/srv/crewportglobal/storage/documents/
```

Approved category folders:

```text
/srv/crewportglobal/storage/documents/seafarer/
/srv/crewportglobal/storage/documents/employer/
/srv/crewportglobal/storage/documents/vessel/
```

Detailed folder pattern:

```text
/srv/crewportglobal/storage/documents/{form_type}/{person_id}/{draft_id}/
```

Examples:

```text
/srv/crewportglobal/storage/documents/seafarer/{person_id}/{draft_id}/
/srv/crewportglobal/storage/documents/employer/{person_id}/{draft_id}/
/srv/crewportglobal/storage/documents/vessel/{person_id}/{draft_id}/
```

Temporary pattern if `person_id` is not available in a future slice:

```text
/srv/crewportglobal/storage/documents/{form_type}/drafts/{draft_id}/
```

This fallback must be transitional only. When the physical person is confirmed, documents should be linked to the person record.

## 6. File Naming Rule

Original file names must not be used as storage file names.

Server-side stored file name:

```text
{document_id}.{safe_extension}
```

Examples:

```text
6fce3ec1-0c43-42f2-9d24-1e9baf8e9284.pdf
3d2df837-c5d1-4c42-a78e-b78aa7bb8432.jpg
```

Original file name is stored only as metadata:

```text
original_filename
```

Reasons:

```text
avoid path traversal;
avoid unsafe characters;
avoid duplicate file name conflicts;
avoid leaking personal or company data through file paths;
support replacement and versioning.
```

## 7. Allowed Formats And Limits

Approved file types:

```text
PDF
JPG / JPEG
PNG
WEBP
```

Recommended user guidance:

```text
up to 5 MB per file
```

Hard technical limits:

```text
maximum file size: 10 MB per file
maximum total size per draft / form: 100 MB
maximum files per draft / form: 20 files
```

If a user exceeds the recommended size but remains under the hard limit, the upload may be accepted but the UI should advise optimization.

If a user exceeds a hard limit, the upload must be rejected before storage or immediately removed from quarantine storage.

## 8. Seafarer Document Types

Initial seafarer / specialist document types:

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

Typical purpose:

```text
identity verification;
qualification review;
document readiness check;
matching eligibility;
human review before candidate recommendation.
```

## 9. Employer Document Types

Initial employer / buyer-side document types:

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

Typical purpose:

```text
confirm buyer-side context;
confirm representative authority;
confirm right to submit a crew request;
support commercial service setup;
prevent unauthorized access to company or vessel records.
```

## 10. Vessel Document Types

Initial vessel-related document types:

```text
vessel_registration
vessel_management_agreement
ship_management_evidence
vessel_specification
flag_or_class_document
crew_requirement_document
vessel_type_evidence
other_vessel_context_evidence
```

The first implementation does not need to require a concrete vessel name for every request.

Instead, the system should prepare structured vessel-type selection because vessel type affects:

```text
rank demand;
certificate requirements;
experience requirements;
salary expectations;
matching logic;
service complexity;
pricing.
```

## 11. Vessel Type Reference Dictionary

CrewPortGlobal should prepare a future vessel-type dictionary.

Initial candidate values:

```text
container_ship
bulk_carrier
tanker_oil
tanker_chemical
tanker_lng
tanker_lpg
general_cargo
multipurpose_vessel
ro_ro
passenger_vessel
cruise_ship
offshore_supply_vessel
anchor_handling_tug_supply
tug
dredger
fishing_vessel
yacht
research_vessel
special_purpose_vessel
other
```

Each reference item should later support:

```text
display_name
category
risk_level
typical_departments
typical_required_certificates
pricing_multiplier_or_service_complexity
matching_tags
is_active
```

This dictionary is not a replacement for a real vessel record. It is a practical reference layer for matching, pricing and form completion.

## 12. Metadata Model

Each stored document must have database metadata.

Recommended fields:

```text
document_id
person_id
user_id
draft_id
card_id
form_type
document_type
original_filename
stored_filename
storage_root
storage_path
safe_extension
mime_type
file_size_bytes
sha256_hash
upload_state
review_status
scan_status
scan_checked_at
uploaded_by_user_id
uploaded_at
replaced_by_document_id
replaces_document_id
hidden_from_user_at
reviewed_by_user_id
reviewed_at
review_note
assigned_task_id
created_at
updated_at
```

Metadata must not expose protected server paths to the public frontend.

The frontend should receive controlled document references such as:

```text
document_id
document_type
original_filename
file_size_bytes
review_status
scan_status
uploaded_at
```

## 13. Upload And Review Statuses

Recommended upload states:

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

Recommended review statuses:

```text
not_submitted
pending_human_review
under_review
verified
rejected
correction_requested
superseded
```

Recommended scan statuses:

```text
not_scanned
pending
clean
infected
scan_error
blocked
```

## 14. Virus / Malware Scan Requirement

Virus / malware scanning is mandatory.

Target upload flow:

```text
1. Receive upload request.
2. Validate file type and size.
3. Store file in quarantine / pending-scan area.
4. Compute sha256 hash.
5. Run antivirus / malware scan.
6. If clean, move or mark file as protected stored.
7. If infected, block the file and mark scan_failed / infected.
8. Create audit event.
9. Make metadata visible according to scoped access rules.
```

A file must not become available for team review until scanning is complete and the result is clean.

If scanning fails due to system error, the file must remain blocked until the scan is retried or operator policy resolves the case.

## 15. Re-Upload And Replacement Rule

When a user uploads a replacement for the same required document:

```text
1. The new upload receives a new document_id.
2. The previous document status changes to superseded / replaced_hidden.
3. The previous document is hidden from normal user display.
4. The previous document remains linked in metadata for audit and review history unless removed with the card/account lifecycle.
5. The new document starts its own scan and review flow.
```

The UI should show the current active document and, where allowed, a short replacement history.

## 16. Access And Visibility

Documents are visible only to:

```text
1. the document owner / uploading user;
2. the team member currently working with the related task;
3. authorized reviewers or controllers when assigned by workflow;
4. Project Owner or authorized control role when needed for governance.
```

Group membership alone must not reveal all documents.

Visibility must be based on:

```text
ownership;
assigned task;
review responsibility;
card relationship;
company / vessel relationship;
authorized control function.
```

Support users may see document metadata only when the task requires it. Direct file access should be limited to roles and tasks that genuinely need document review.

## 17. User-Facing Behavior

The user should see:

```text
document type required or optional;
accepted file formats;
recommended and maximum size;
upload progress;
scan pending state;
review status;
correction request reason;
replacement option;
current visible document;
hidden / replaced state when applicable;
clear notice that upload does not grant status automatically.
```

The user must not see:

```text
server storage path;
internal reviewer notes not intended for the user;
virus scanner internals;
other users' documents;
direct public file URL.
```

## 18. Team-Facing Behavior

The responsible team member should see documents only inside the assigned task or review queue.

Team view should show:

```text
client / person context;
related card / draft;
document type;
original filename;
upload time;
scan status;
review status;
file size;
sha256 hash when needed for audit;
preview / controlled download action when allowed;
approve / reject / request correction actions;
review note field;
replacement history where relevant.
```

Team actions must be audited.

## 19. Review Procedure

Document review should follow this sequence:

```text
1. User selects authorization form.
2. User attaches document files.
3. System validates format, size, count and draft total size.
4. System stores file in protected quarantine area.
5. System computes hash.
6. System scans file.
7. Clean files become eligible for human review.
8. Review task appears for the responsible verifier / reviewer.
9. Reviewer verifies, rejects or requests correction.
10. Result updates the document metadata and related card state.
11. The user sees a controlled status update.
```

The reviewer must not grant final employment, payment, legal or authority status only because a document was uploaded. Documents are evidence for a review decision, not automatic approval.

## 20. Security Controls

Required controls:

```text
no public storage path;
no direct public URL;
no Git storage;
no original filename as stored filename;
extension allowlist;
MIME validation;
file size validation;
total draft size validation;
file count validation;
sha256 hash;
virus / malware scan;
audit events;
scoped access check before metadata or file access;
controlled download / preview endpoint in future backend;
no broad group-only document visibility.
```

## 21. Retention Boundary

Document retention will be decided together with the lifecycle of:

```text
physical person record;
service account;
authorization card;
company / vessel relationship;
related task / review case.
```

This BP-010 document does not define a separate independent document-retention schedule.

## 22. Implementation Decisions Required Before Upload Endpoint

The following decisions must be confirmed before implementing the first real upload endpoint:

```text
1. final protected storage root owner, group and permissions;
2. quarantine folder location and cleanup procedure;
3. antivirus / malware scanning tool and timeout policy;
4. database table name and migration number for uploaded document metadata;
5. exact card/draft identifiers available at upload time;
6. whether upload happens before or after full authenticated session creation;
7. controlled download / preview endpoint design;
8. audit event names;
9. vessel-type reference dictionary seed values and pricing/matching fields;
10. task queue that receives document review work;
11. maximum retry behavior for scan_error;
12. whether image/PDF previews are generated later and where previews are stored.
```

## 23. Future Implementation Order

Recommended implementation sequence:

```text
1. create protected storage root;
2. create uploaded_documents metadata migration;
3. create upload config and validation helper;
4. create quarantine write path;
5. add sha256 hashing;
6. add antivirus scan adapter;
7. create upload endpoint for seafarer authorization documents;
8. create upload endpoint for employer authority evidence;
9. create vessel document category and vessel-type dictionary draft;
10. create document review task record;
11. create team review UI;
12. connect document review outcome to authorization-card workflow.
```

## 24. Non-Negotiable Boundaries

Do not:

```text
store uploaded documents in public;
commit uploaded documents to Git;
expose direct public file URLs;
use original filenames as server filenames;
skip antivirus scanning;
grant status automatically after upload;
allow wide group membership to see all documents;
implement file upload before metadata, scan and access boundaries are defined.
```

## 25. Final Principle

Document upload is not just a file-transfer feature.

It is part of CrewPortGlobal's evidence, trust, matching, authorization and review system.

The correct target behavior is:

```text
upload evidence -> scan -> protected storage -> metadata -> scoped task -> human review -> controlled status update
```
