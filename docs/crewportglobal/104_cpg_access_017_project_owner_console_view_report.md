# CrewPortGlobal - CPG-ACCESS-017 Project Owner Console View Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-15
- Document type: Implementation report
- Status: Implemented and verified on GTC1

## 1. Purpose

This report records the first minimal `/admin/access/` console view for the CrewPortGlobal Project Owner.

The goal was to stop at a read-only administrative state view and a safe logout control, without adding user, group or role editing yet.

Project Owner:

```text
kfilipenko@gtchain.io
```

## 2. Implemented Scope

Implemented:

1. session summary API for the active admin session;
2. admin session revoke API for logout;
3. read-only Project Owner console view;
4. display of current user, status, active groups, active roles, effective permissions and recent access audit events;
5. visible phase warning that group and role management is the next phase;
6. local browser storage of the temporary admin session token after email-code verification;
7. automatic console loading when an active session token exists;
8. logout flow that revokes the backend `admin_sessions` record and clears local browser state.

## 3. API Changes

New API endpoints:

```text
GET  /api/v1/admin/access/session
POST /api/v1/admin/access/session/revoke
```

Session token source:

```text
Authorization: Bearer <admin_session_token>
```

or:

```text
X-CPG-Admin-Session: <admin_session_token>
```

The admin session token is the existing generated `admin_session_id` value. This is acceptable for the first controlled console view and should be hardened in a later dedicated session-token migration.

## 4. Backend Changes

Updated storage contract:

```text
findActiveAdminSession
revokeAdminSession
readRecentAccessAuditEvents
```

Updated PostgreSQL adapter:

1. reads active admin session with user, groups, roles and effective permissions;
2. revokes sessions by setting `revoked_at`;
3. reads recent access audit events in newest-first order.

Updated flow helpers:

1. `cpg_admin_access_session_summary_with_storage`;
2. `cpg_admin_access_revoke_session_with_storage`;
3. `cpg_admin_access_verify_code_with_storage` now returns `admin_session_token` after successful verification.

## 5. Frontend Console View

Updated page:

```text
projects/crewportglobal/public/admin/access/index.html
```

Published page:

```text
/var/www/crewportglobal.com/admin/access/index.html
```

The page now shows:

```text
current user
Project Owner status
active groups
active roles
effective permissions
recent access audit events
logout button
next-phase warning
```

The page does not provide editing of users, groups, roles or permissions.

## 6. Live Verification

Live page:

```text
https://crewportglobal.com/admin/access/
HTTP 200
```

Controlled session summary test:

```text
session_ok=true
email=kfilipenko@gtchain.io
status=Project Owner
groups=1
roles=1
permissions=15
audit_events=4
```

Controlled logout test:

```text
revoke_ok=true
after_revoke_error=admin_session_invalid
```

No admin session token or one-time code was recorded in this document.

## 7. Changed Files

Backend:

- `projects/crewportglobal/app/backend/api/lib/admin_access_storage.php`
- `projects/crewportglobal/app/backend/api/lib/admin_access_pg_storage.php`
- `projects/crewportglobal/app/backend/api/lib/admin_access_flow.php`
- `projects/crewportglobal/app/backend/api/public/index.php`

Frontend:

- `projects/crewportglobal/public/admin/access/index.html`

Tests:

- `projects/crewportglobal/app/backend/api/tests/admin_access_storage_test.php`
- `projects/crewportglobal/app/backend/api/tests/admin_access_pg_storage_test.php`
- `projects/crewportglobal/app/backend/api/tests/admin_access_flow_test.php`
- `projects/crewportglobal/app/backend/api/tests/admin_access_public_routes_test.php`

Documentation:

- `docs/crewportglobal/104_cpg_access_017_project_owner_console_view_report.md`
- `docs/crewportglobal/00_documentation_register.md`

## 8. Verification Performed

Safe tests:

```bash
php -l projects/crewportglobal/app/backend/api/lib/admin_access_storage.php
php -l projects/crewportglobal/app/backend/api/lib/admin_access_pg_storage.php
php -l projects/crewportglobal/app/backend/api/lib/admin_access_flow.php
php -l projects/crewportglobal/app/backend/api/public/index.php
php projects/crewportglobal/app/backend/api/tests/admin_access_storage_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_pg_storage_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_flow_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_public_routes_test.php
```

Live HTTP checks:

```text
GET /admin/access/
GET /api/v1/admin/access/session
POST /api/v1/admin/access/session/revoke
```

## 9. Security Boundaries

Preserved boundaries:

1. no user/group/role editing was added;
2. no SMTP password was read into documentation or committed;
3. no one-time code was printed into documentation;
4. admin session token was not recorded in documentation;
5. Project Owner remains `kfilipenko@gtchain.io`;
6. `not_reply@crewportglobal.com` remains only the SMTP sender;
7. payment was not changed;
8. OpenClaw was not changed;
9. temporary operator-token behavior was not removed;
10. registration and vacancy flows were not changed.

## 10. Next Recommended Work

Recommended next step:

```text
Add read-only admin console detail panels for users, groups, roles and permissions before enabling any controlled edit action.
```
