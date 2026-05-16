# CrewPortGlobal - CPG-ACCESS-019 Group-Based Access Control and Team Entry Page Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-16
- Document type: Implementation report
- Related issue: GitHub #10 - CPG-ACCESS-016
- Status: Implemented and verified on GTC1

## 1. Purpose

This report records the Issue #10 corrective access-control slice:

```text
Admin and team access must be controlled through groups, not direct personal e-mail allowlists.
```

The requested document number `69_group_based_access_control_and_team_entry_page.md` was not reused because document 69 already exists in the CrewPortGlobal documentation register. This report was created as the next safe document:

```text
106_cpg_access_019_group_based_access_control_and_team_entry_page_report.md
```

## 2. Current Auth Stack Finding

Checked:

```text
PHP admin access flow/storage
protected server runtime config
nginx CrewPortGlobal server block
static public site routing
operator token boundary
```

Finding:

```text
CrewPortGlobal currently does not use OAuth/OIDC group claims or nginx auth_request for this site.
The live access model is implemented in PHP through the access-control tables and admin email-code/session flow.
```

Nginx continues to route:

```text
/api/v1/ -> PHP backend
public pages -> static site
```

No nginx weakening was performed.

## 3. Groups Created or Confirmed

Created/confirmed owner group:

```text
Display name: Владельцы
Group code: owners
Recommended group email: owners@gtchain.io
Purpose: owner/admin access group
Initial member: kfilipenko@gtchain.io
Role assigned through group: project_owner
```

Created/confirmed team group:

```text
Display name: Команда CPG
Group code: cpg_team
Recommended group email: cpg-team@gtchain.io
Purpose: CrewPortGlobal team access group
Initial members added by this slice: 0
```

No team members were invented.

The previous active `platform_owners` membership for `kfilipenko@gtchain.io` was revoked after the `owners` group membership and `owners -> project_owner` assignment were active.

## 4. Authorization Changes

Changed:

1. admin console eligibility now requires approved group membership;
2. direct role-only access is not sufficient;
3. direct permission-only access is not sufficient;
4. direct personal e-mail allowlist is not used as the normal rule;
5. `owners` can open the admin console when the group grants `project_owner` / `view_admin_console`;
6. `cpg_team` can open protected team links but cannot open the admin console without admin group/role permission.

Protected groups:

```text
Admin console: owners, platform_administrators
Team links: owners, cpg_team
```

The SMTP sender remains:

```text
not_reply@crewportglobal.com
```

It is not a user and has no owner/admin access.

## 5. Team Page

Created:

```text
Source: projects/crewportglobal/public/team/index.html
Live: https://crewportglobal.com/team/
```

The `/team/` page is a protected entry shell. It does not embed internal links in static HTML.

Internal links are returned only by:

```text
GET /api/v1/admin/access/team-links
```

after a valid protected session and group check.

Returned links:

```text
CrewPortGlobal public site
Register
Create Profile
Post Vacancy
Operator Queue
GitHub repository
Main implementation issue
```

## 6. Database Safety

Before live group updates, a server-only snapshot was created:

```text
/var/backups/crewportglobal/crewportglobal_access_groups_before_issue10_20260516T181609Z.json
```

SHA256:

```text
16f5b7cfb3aa4691221aaddc12f7e7e3df7b4e2d152fa05f2d339de4ca7a73b5
```

Audit event created:

```text
group_based_access_bootstrap_completed
```

## 7. Changed Files

Backend:

- `projects/crewportglobal/app/backend/api/lib/admin_access_flow.php`
- `projects/crewportglobal/app/backend/api/public/index.php`
- `projects/crewportglobal/app/backend/api/tools/bootstrap_group_based_access.php`
- `projects/crewportglobal/app/backend/api/contracts/registration-drafts.openapi.yaml`

Frontend:

- `projects/crewportglobal/public/admin/access/index.html`
- `projects/crewportglobal/public/team/index.html`

Tests:

- `projects/crewportglobal/app/backend/api/tests/admin_access_storage_test.php`
- `projects/crewportglobal/app/backend/api/tests/admin_access_flow_test.php`
- `projects/crewportglobal/app/backend/api/tests/admin_access_pg_storage_test.php`
- `projects/crewportglobal/app/backend/api/tests/admin_access_public_routes_test.php`
- `projects/crewportglobal/app/backend/api/tests/admin_access_contract_test.php`

Documentation:

- `projects/crewportglobal/app/backend/api/README.md`
- `docs/crewportglobal/106_cpg_access_019_group_based_access_control_and_team_entry_page_report.md`
- `docs/crewportglobal/00_documentation_register.md`

## 8. Verification Results

Static and unit checks:

```bash
php -l projects/crewportglobal/app/backend/api/lib/admin_access_flow.php
php -l projects/crewportglobal/app/backend/api/public/index.php
php -l projects/crewportglobal/app/backend/api/tools/bootstrap_group_based_access.php
php projects/crewportglobal/app/backend/api/tests/admin_access_storage_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_flow_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_pg_storage_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_public_routes_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_contract_test.php
```

Owner access result:

```text
owner_admin_allowed=yes
owner_team_allowed=yes
owner_groups=owners
owner_roles=project_owner
owner active session summary=200
owner team links=200
```

Team member access result:

```text
cpg_team group behavior verified in unit test:
team member can get protected team links
team member cannot open admin console without admin group/role
```

Live `cpg_team` members added by this slice:

```text
0
```

Non-member access result:

```text
POST /api/v1/admin/access/email-code/request for not_reply@crewportglobal.com -> HTTP 202 generic response
admin_email_codes rows for not_reply@crewportglobal.com -> 0
smtp_sender_user=no
```

Unauthenticated access result:

```text
GET /api/v1/admin/access/team-links without session -> HTTP 401 team_session_required
GET /team/ -> HTTP 200 login shell
static /team/ HTML embeds protected links -> no
```

Public page regression result:

```text
/ -> 200
/register/ -> 200
/create-profile/ -> 200
/post-vacancy/ -> 200
/verify/ -> 200
```

Operator protection regression:

```text
GET /api/v1/operator/review-queue without token -> HTTP 401 operator_access_required
```

## 9. Security Boundaries

Preserved boundaries:

1. no SMTP password was read into documentation or committed;
2. no admin code was recorded;
3. no admin session token was recorded;
4. no new CPG team members were invented;
5. `/verify/` API protection was not weakened;
6. public pages stayed public;
7. payment was not changed;
8. OpenClaw was not changed;
9. no personal e-mail allowlist is used as the normal access rule.

## 10. Next Recommended Work

Recommended next step:

```text
Add Project Owner controlled group-management UI for owners/cpg_team membership changes, with audit events and separation-of-duties checks.
```
