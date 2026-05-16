# CrewPortGlobal - CPG-ACCESS-020 Project Owner User and Group Membership Management Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-16
- Document type: Implementation report
- Status: Implemented and verified on GTC1

## 1. Purpose

This report records the first writable `/admin/access/` access-management slice.

The approved product direction is:

```text
Stage 1: Project Owner can create users and add users to groups.
Stage 2: each group receives a functional work page with permissions to work on data.
```

This document covers Stage 1 only.

## 2. Implemented Scope

Implemented:

1. Project Owner access-management API;
2. access-management snapshot of users, groups and assignable groups;
3. create or confirm CrewPortGlobal user records;
4. add existing users to assignable groups;
5. `/admin/access/` UI for user creation and group membership assignment;
6. audit events for user creation/confirmation and group membership assignment;
7. tests confirming that team-only users cannot manage users or memberships.

No group role editing was added in this slice.

No group work pages were added in this slice.

## 3. Access Rule

Managing users and group membership requires:

```text
active admin session
owners group membership
project_owner role or manage_user_groups permission
```

The UI and API do not use direct personal e-mail allowlists as the normal access rule.

## 4. API Endpoints

Added:

```text
GET  /api/v1/admin/access/management
POST /api/v1/admin/access/users
POST /api/v1/admin/access/group-members
```

Endpoint purposes:

```text
/management       -> read users, groups and assignable groups
/users            -> create or confirm a user by e-mail
/group-members    -> add an active user to an assignable group
```

## 5. Assignable Group Boundary

This phase allows assignment only to active groups whose group type is:

```text
internal
administration
```

The following groups are not assignable through this first console phase:

```text
public_visitors
registered_users
registered_seafarers
registered_employers
platform_owners
ai_assistants
```

This keeps public/default/system groups and the legacy `platform_owners` bootstrap group out of normal console assignment.

## 6. Frontend UI

Updated:

```text
projects/crewportglobal/public/admin/access/index.html
```

Live page:

```text
https://crewportglobal.com/admin/access/
```

The page now includes:

```text
Create or confirm user
Add user to group
Assignable groups list
Users list with active group summary
```

The page still does not include:

```text
create group
edit group role
revoke membership
delete user
open group work pages
business data operations
```

## 7. Backend Changes

Updated:

- `projects/crewportglobal/app/backend/api/lib/admin_access_storage.php`
- `projects/crewportglobal/app/backend/api/lib/admin_access_pg_storage.php`
- `projects/crewportglobal/app/backend/api/lib/admin_access_flow.php`
- `projects/crewportglobal/app/backend/api/public/index.php`
- `projects/crewportglobal/app/backend/api/contracts/registration-drafts.openapi.yaml`

Storage additions:

```text
readAccessManagementSnapshot
createAccessUser
addAccessGroupMember
```

Flow additions:

```text
cpg_admin_access_management_snapshot_with_storage
cpg_admin_access_create_user_with_storage
cpg_admin_access_add_group_member_with_storage
cpg_admin_access_user_can_manage_group_members
```

## 8. Audit Events

New audit events:

```text
admin_user_created
admin_user_confirmed
admin_group_member_added
admin_group_member_confirmed
```

The audit payload masks e-mail addresses and records the acting user, target user, target group and reason where applicable.

## 9. Verification Performed

Safe checks:

```bash
php -l projects/crewportglobal/app/backend/api/lib/admin_access_storage.php
php -l projects/crewportglobal/app/backend/api/lib/admin_access_pg_storage.php
php -l projects/crewportglobal/app/backend/api/lib/admin_access_flow.php
php -l projects/crewportglobal/app/backend/api/public/index.php
php projects/crewportglobal/app/backend/api/tests/admin_access_storage_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_flow_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_pg_storage_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_public_routes_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_contract_test.php
npm run check:cpg-i18n
git diff --check
```

Live checks:

```text
GET /admin/access/ -> HTTP 200
GET /api/v1/admin/access/management without session -> HTTP 401
Rollback-only Project Owner session smoke can read management snapshot -> HTTP 200
Rollback-only Project Owner session smoke returned allowed actions: create_user, add_user_to_group
/admin/access/ UI renders management controls
```

## 10. Security Boundaries

Preserved:

1. no SMTP password was read into documentation or committed;
2. no one-time code was recorded;
3. no admin session token was recorded;
4. no group role editing was introduced;
5. no user deletion was introduced;
6. no membership revoke action was introduced yet;
7. no group functional work pages were added yet;
8. `/verify/` operator token boundary was not weakened;
9. public pages remained public;
10. payment and OpenClaw were not changed.

## 11. Next Recommended Work

Next implementation stage:

```text
Create group-specific functional pages for approved internal groups.
```

Recommended order:

```text
1. define page and data scope for cpg_team;
2. define operator work pages for verification_team, review_team and support_team;
3. connect each page to group-based permission checks;
4. keep each workflow behind audit events and human review boundaries.
```
