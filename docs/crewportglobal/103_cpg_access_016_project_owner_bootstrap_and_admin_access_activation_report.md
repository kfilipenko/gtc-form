# CrewPortGlobal - CPG-ACCESS-016 Project Owner Bootstrap and Admin Access Activation Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-15
- Document type: Implementation report and controlled production bootstrap record
- Status: Implemented and verified on GTC1

## 1. Purpose

This report records the controlled bootstrap of the first CrewPortGlobal Project Owner and the initial admin access email-code runtime activation.

Project Owner:

```text
kfilipenko@gtchain.io
```

SMTP sender mailbox:

```text
not_reply@crewportglobal.com
```

The SMTP sender remains a technical mailbox only. It was not assigned Project Owner access.

## 2. Pre-Change Verification

Initial access-control table check returned no rows for the access-control tables, confirming that migration `006_access_control_foundation_draft.sql` had not yet been applied.

Existing schema before migration contained the registration and vacancy tables only:

```text
users
user_auth_identities
user_roles
seafarer_profiles
employer_companies
company_users
vessels
registration_audit_events
vacancy_requests
vacancy_applications
```

## 3. Backup

Backup created before applying migration 006:

```text
/var/backups/crewportglobal/crewportglobal_pre_access_006_20260515T194223Z.dump
```

Backup type:

```text
pg_dump custom format, schema crewportglobal
```

Backup sha256:

```text
7772016e7a743294f158bd91c2deb5598107788864da9c0d8facc4c37f9c0634
```

## 4. Migration 006

Applied migration:

```text
projects/crewportglobal/app/backend/db/migrations/006_access_control_foundation_draft.sql
```

Applied through:

```text
psql -v ON_ERROR_STOP=1
```

Created and verified tables:

```text
access_audit_events
access_group_members
access_group_roles
access_groups
access_permissions
access_role_permissions
access_roles
admin_email_codes
admin_sessions
```

Seed counts after migration:

```text
access_groups=17
access_roles=17
access_permissions=69
access_group_roles=17
access_role_permissions=128
```

Confirmed group-role mapping:

```text
platform_owners -> project_owner (active)
```

## 5. Project Owner Bootstrap

Created controlled bootstrap tool:

```text
projects/crewportglobal/app/backend/api/tools/bootstrap_project_owner.php
```

Executed:

```bash
php projects/crewportglobal/app/backend/api/tools/bootstrap_project_owner.php --owner-email=kfilipenko@gtchain.io
```

Result:

```text
owner_email: kfilipenko@gtchain.io
user_created: true
group_code: platform_owners
role_code: project_owner
audit_event: project_owner_bootstrap_completed
smtp_sender_email: not_reply@crewportglobal.com
```

Verified owner state:

```text
email: kfilipenko@gtchain.io
registration_status: approved
is_active: true
email_verified: true
group_code: platform_owners
role_code: project_owner
membership_state: active
assignment_state: active
project_owner_permissions: 15
```

The SMTP mailbox `not_reply@crewportglobal.com` was not created as a user and was not assigned Project Owner access.

## 6. Protected Runtime Config

Protected config file:

```text
/etc/crewportglobal/admin-access.env
```

Protected config backup before runtime flag update:

```text
/etc/crewportglobal/admin-access.env.bak.20260515T195025Z
```

Runtime flags enabled in protected config:

```text
CREWPORTGLOBAL_ADMIN_ACCESS_PUBLIC_ROUTES_ENABLED=true
CREWPORTGLOBAL_ADMIN_ACCESS_STORAGE_MODE=pgsql
CREWPORTGLOBAL_ADMIN_ACCESS_EMAIL_DELIVERY_MODE=smtp_send_ready
CREWPORTGLOBAL_ADMIN_ACCESS_SMTP_SEND_ENABLED=true
```

SMTP password and mailbox secret values were not printed, logged or committed.

## 7. Admin Access Runtime

Implemented runtime wiring:

1. public admin request route loads protected runtime env;
2. request route checks public route and flow flags before reading JSON;
3. request route uses PostgreSQL storage after runtime gates;
4. request route sends email through the SMTP adapter after runtime gates;
5. verify route uses PostgreSQL storage after runtime gates;
6. verify route creates an admin session after a valid one-time code;
7. `/admin/access/` page was added and published to the live web root.

New page:

```text
projects/crewportglobal/public/admin/access/index.html
/var/www/crewportglobal.com/admin/access/index.html
```

## 8. Verification

Live page check:

```text
https://crewportglobal.com/admin/access/
HTTP 200
```

Admin email-code request:

```text
POST https://crewportglobal.com/api/v1/admin/access/email-code/request
email: kfilipenko@gtchain.io
HTTP 202
delivery_status: admin_email_delivery_sent
storage_status: stored_hash_only
masked_email: k***o@gtchain.io
```

Controlled verify check:

```text
POST https://crewportglobal.com/api/v1/admin/access/email-code/verify
HTTP 200
ok: true
purpose: admin_access
admin_session_expires_at: 2026-05-15T20:22:16+00:00
```

Database verification after checks:

```text
admin_email_codes_total=2
admin_email_codes_pending=1
admin_email_codes_used=1
active_admin_sessions=1
admin_email_code_requested=1
admin_email_code_verified=1
project_owner_bootstrap_completed=1
```

The pending email-code record is the real code sent to `kfilipenko@gtchain.io`; the used record is from the controlled verify check. Clear codes were not printed or stored.

## 9. Changed Files

Backend:

- `projects/crewportglobal/app/backend/api/lib/admin_access_flow.php`
- `projects/crewportglobal/app/backend/api/public/index.php`
- `projects/crewportglobal/app/backend/api/tools/bootstrap_project_owner.php`
- `projects/crewportglobal/app/backend/api/tests/admin_access_flow_test.php`
- `projects/crewportglobal/app/backend/api/tests/admin_access_email_delivery_test.php`
- `projects/crewportglobal/app/backend/api/tests/admin_access_storage_factory_test.php`
- `projects/crewportglobal/app/backend/api/tests/admin_access_public_routes_test.php`
- `projects/crewportglobal/app/backend/api/README.md`

Frontend:

- `projects/crewportglobal/public/admin/access/index.html`

Documentation:

- `docs/crewportglobal/103_cpg_access_016_project_owner_bootstrap_and_admin_access_activation_report.md`
- `docs/crewportglobal/00_documentation_register.md`

Server-only config:

- `/etc/crewportglobal/admin-access.env`

Live publication:

- `/var/www/crewportglobal.com/admin/access/index.html`

## 10. Security Boundaries

Preserved boundaries:

1. SMTP password was not committed;
2. SMTP password was not printed;
3. one-time admin codes were not printed;
4. one-time admin codes are stored only as hashes;
5. `not_reply@crewportglobal.com` remains only a sender mailbox;
6. Project Owner was assigned only to `kfilipenko@gtchain.io`;
7. payment was not changed;
8. OpenClaw was not changed;
9. temporary operator-token behavior was not removed;
10. registration and vacancy flows were not changed.

## 11. Next Recommended Work

Recommended next step:

```text
Build the first minimal /admin/access/ console view for the Project Owner: current user summary, groups, roles, recent access audit events and a safe logout/revoke-session control.
```
