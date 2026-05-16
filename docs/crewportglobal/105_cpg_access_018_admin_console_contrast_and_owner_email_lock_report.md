# CrewPortGlobal - CPG-ACCESS-018 Admin Console Contrast and Owner Email Lock Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-15
- Document type: Implementation report
- Status: Implemented and verified on GTC1

## 1. Purpose

This report records the corrective update for the first `/admin/access/` Project Owner login and console page.

The page was readable in structure but not readable enough in production because the admin page inherited low-contrast public documentation theme variables. During the same review, the browser-visible e-mail field could be modified or autofilled, which created a risk that the admin code verification request would be sent for an e-mail address other than the approved bootstrap Project Owner.

Approved Project Owner:

```text
kfilipenko@gtchain.io
```

SMTP sender remains:

```text
not_reply@crewportglobal.com
```

The SMTP sender was not made a user and was not assigned owner access.

## 2. Implemented Scope

Implemented:

1. high-contrast admin page color system independent from the public documentation theme;
2. readable body, header, panel, form, input, button, status, card, permission and audit-event styles;
3. visible focus state for form controls and buttons;
4. fixed read-only bootstrap owner e-mail field;
5. request-code and verify-code payloads always use `kfilipenko@gtchain.io`;
6. code input is cleared when a new code is requested;
7. local stale admin session is cleared when a new code is requested;
8. visible instruction that only the newest 6-digit code should be used.

## 3. Root Cause Notes

Visual issue:

```text
The admin page reused documentation CSS variables intended for a dark documentation surface.
On the production admin page those variables produced pale text on a light background.
```

Code verification issue observed during review:

```text
The access audit trail showed admin_email_code_verify_rejected with reason admin_access_not_eligible.
This is consistent with verification being attempted for a non-owner or browser-altered e-mail value.
```

The UI now prevents that class of mistake during the bootstrap phase by locking the e-mail value to the approved Project Owner address.

## 4. Changed Files

Frontend:

- `projects/crewportglobal/public/admin/access/index.html`

Documentation:

- `docs/crewportglobal/105_cpg_access_018_admin_console_contrast_and_owner_email_lock_report.md`
- `docs/crewportglobal/00_documentation_register.md`

Published page:

- `/var/www/crewportglobal.com/admin/access/index.html`

## 5. Verification Performed

Safe checks:

```bash
npm run check:cpg-i18n
git diff --check
```

Live checks:

```text
GET https://crewportglobal.com/admin/access/ -> HTTP 200
Playwright screenshot and computed-style check for readable contrast-critical elements
Playwright intercepted request/verify payload check confirming owner e-mail is fixed to kfilipenko@gtchain.io without real SMTP send
```

## 6. Security Boundaries

Preserved boundaries:

1. no SMTP password was read into documentation or committed;
2. no one-time code was recorded in documentation;
3. no admin session token was recorded in documentation;
4. no access-control role or permission grants were changed;
5. no database migration was applied;
6. no backend access logic was changed;
7. no payment code was changed;
8. no OpenClaw code was changed;
9. no nginx or server configuration was changed;
10. temporary operator-token behavior was not changed.

## 7. Next Recommended Work

Recommended next step:

```text
Add read-only admin console detail panels for users, groups, roles and permissions before enabling any controlled edit action.
```
