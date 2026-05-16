# CrewPortGlobal - CPG-ACCESS-021 Admin Audit Panel Collapse Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-16
- Document type: Implementation report
- Status: Implemented and verified on GTC1

## 1. Purpose

This report records a usability correction for the `/admin/access/` Project Owner console.

The audit event panel can become long during active testing. The panel is now collapsed by default so the owner can work with the user and group management controls without scrolling through audit records first.

## 2. Implemented Scope

Updated:

```text
projects/crewportglobal/public/admin/access/index.html
```

Implemented:

1. audit panel collapsed by default;
2. clickable `Audit` header area;
3. accessible `aria-expanded` state on the audit toggle;
4. audit body hidden until the header is clicked;
5. open and close behavior without page reload;
6. existing audit data loading preserved.

## 3. User Interface Behavior

Default state:

```text
Audit panel header is visible.
Recent audit event rows are hidden.
```

On click:

```text
Audit panel opens.
Recent access events become visible.
```

On second click:

```text
Audit panel closes again.
```

## 4. Security and Functional Boundaries

This change is frontend-only.

Not changed:

1. admin authentication;
2. admin e-mail code verification;
3. admin sessions;
4. access-control database tables;
5. audit event storage;
6. Project Owner permissions;
7. user creation and group membership API;
8. `/team/` protection;
9. `/verify/` operator behavior;
10. nginx/server configuration;
11. deployment configuration.

## 5. Verification Performed

Safe checks:

```bash
npm run check:cpg-i18n
git diff --check
```

Live and browser checks:

```text
/admin/access/ returns HTTP 200.
Audit body is hidden by default.
Audit toggle starts with aria-expanded=false.
Clicking the Audit header opens the audit body.
Second click closes the audit body again.
Existing recent access events still render into the audit list.
```

## 6. Result

The `/admin/access/` page remains functionally the same, but the audit section no longer dominates the default console view.

The page is ready for continued work on group-specific functional pages.
