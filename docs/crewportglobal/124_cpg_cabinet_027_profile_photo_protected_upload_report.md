# CrewPortGlobal - CPG-CABINET-027 Protected Profile Photo Upload Report

- Project: CrewPortGlobal.com
- Date: 2026-05-18
- Status: Implemented for review
- Baseline:
  - `115_cpg_cabinet_025_user_personal_cabinet_dashboard_report.md`
  - `117_cpg_auth_003_password_credential_session_report.md`
  - `118_cpg_auth_004_email_verification_activation_report.md`
  - `112_cpg_doc_022_protected_upload_storage_clamav_report.md`
- Scope: authenticated user profile photo upload for `/cabinet/`

## 1. Purpose

This document records the first protected profile photo implementation slice for the CrewPortGlobal user cabinet.

The goal is to replace the previous cabinet placeholder with a working user-controlled avatar upload while preserving the document-storage security model:

```text
authenticated user session required
JPG / PNG / WEBP only
5 MB max file size
ClamAV scan before use
protected server storage outside public web root
no public file path exposure
owner-session image delivery only
account menu avatar update after upload
```

## 2. Implemented Scope

The slice adds protected profile photo metadata and runtime handlers:

```text
crewportglobal.user_profile_photos
GET  /api/v1/user/profile-photo
POST /api/v1/user/profile-photo
GET  /api/v1/user/profile-photo/image
```

The upload flow is:

```text
user session
multipart upload
size/type validation
quarantine write
ClamAV scan
clean file move to protected storage
metadata insert
previous current photo hidden
auth/me returns safe profile_photo metadata
cabinet and account menu render the avatar
```

## 3. Storage Model

Default storage root:

```text
/srv/crewportglobal/storage/profile_photos/
```

Quarantine path:

```text
/srv/crewportglobal/storage/profile_photos/_quarantine/users/{user_id}/
```

Protected path:

```text
/srv/crewportglobal/storage/profile_photos/users/{user_id}/
```

The original filename is stored as metadata only. The stored filename is generated from the profile photo UUID:

```text
{profile_photo_id}.{safe_extension}
```

## 4. User Interface

The `/cabinet/` User summary card now shows:

```text
current avatar or initials
profile photo status
file input for JPG / PNG / WEBP
5 MB and scan notice
Upload profile photo action
upload result status
```

After upload, the cabinet avatar and top-right account menu avatar update through the shared navigation state.

## 5. Security Controls

Implemented controls:

```text
authentication required
raw password/session token not involved
storage outside public
no storage_root or storage_path returned by user APIs
owner-session image endpoint only
MIME type validation
5 MB hard limit
ClamAV scan required before current avatar use
path traversal guard on image streaming
safe Content-Type / Content-Disposition / nosniff headers
profile_photo_uploaded audit event
```

The image endpoint does not provide public direct URLs. The URL is session-protected and only returns the current user's clean current photo.

## 6. Changed Files

```text
projects/crewportglobal/app/backend/db/migrations/010_create_user_profile_photos.sql
projects/crewportglobal/app/backend/api/lib/user_profile_photos.php
projects/crewportglobal/app/backend/api/lib/user_auth.php
projects/crewportglobal/app/backend/api/public/index.php
projects/crewportglobal/app/backend/api/README.md
projects/crewportglobal/public/cabinet/index.html
projects/crewportglobal/public/assets/crewportglobal-navigation.js
projects/crewportglobal/public/assets/crewportglobal-docs.css
playwright.crewportglobal.config.ts
playwright.crewportglobal.api.config.ts
tests/crewportglobal-auth-password-session.spec.ts
tests/crewportglobal-cabinet-dashboard.spec.ts
```

## 7. Verification

Commands run:

```bash
php -l projects/crewportglobal/app/backend/api/lib/user_profile_photos.php
php -l projects/crewportglobal/app/backend/api/public/index.php
PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db psql -v ON_ERROR_STOP=1 -f projects/crewportglobal/app/backend/db/migrations/010_create_user_profile_photos.sql
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-auth-password-session.spec.ts
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-cabinet-dashboard.spec.ts
node projects/crewportglobal/scripts/check_public_i18n.js
git diff --check
projects/crewportglobal/scripts/deploy_public_live.sh
```

Results should be updated in the final agent report after execution.

Executed results:

```text
php syntax checks: passed
migration 010 apply: passed
password/session/profile-photo/cabinet spec: 2 passed
cabinet dashboard regression spec: 3 passed
public i18n validator: passed with existing non-English fallback warnings
git diff --check: passed
public live deploy script: passed
live cabinet asset check: passed
live unauthenticated profile-photo endpoints: 401 authentication_required
```

## 8. Boundaries

Not changed in this slice:

```text
password reset
phone verification
OAuth
public user file download
document review decisions
OCR
AI document analysis
Stripe/payment
OpenClaw
nginx/server configuration
```

No real credentials or secrets are committed.

## 9. Remaining Work

Recommended next steps:

```text
1. add profile settings fields for phone and contact data updates;
2. add user-controlled photo removal/replacement history visibility;
3. add admin/team visibility rules for profile photo where review tasks require identity context;
4. add optional image dimension normalization if product review requires consistent avatar crops;
5. continue moving cabinet sections toward scoped service areas after authorization review.
```

## 10. Final Recommendation

The protected profile photo upload slice is ready for Project Owner review after verification.

It gives users a real avatar control in the personal cabinet without exposing uploaded files through public URLs or weakening the existing protected storage model.
