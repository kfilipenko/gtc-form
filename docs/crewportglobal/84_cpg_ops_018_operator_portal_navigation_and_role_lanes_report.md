# CrewPortGlobal - CPG-OPS-018 Operator Portal Navigation and Role Lanes Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-14
- Document type: Implementation report and future-change rule
- Status: Implemented, verified and published to the live site

## 1. Purpose

This report records the frontend-only operator portal navigation slice for `/verify/`.

The change follows document 80 and keeps internal operator work separate from the public application menu and public document menu. The operator surface must not look like a public registration path, and public users must not see an `Admin` category or mixed operator controls inside the application navigation.

## 2. Implemented Scope

Implemented operator navigation model:

1. `/verify/` now uses a dedicated `site-nav--operator` navigation model;
2. `Operator Queue` remains the active protected workflow entry;
3. public application links are grouped under `Public app`;
4. public trust/document links are grouped under `Reference documents`;
5. internal role lanes are grouped under `Role lanes`;
6. a role-lane toolbar was added above the review queue;
7. role-lane controls use document 80 role names:
   - Verifier;
   - Reviewer;
   - Complaint Operator;
   - Billing Operator;
   - Support Operator;
   - Platform Administrator;
8. role-lane filtering is frontend-only:
   - Verifier lane shows `seafarer_profile` and `company_verification` queue types;
   - Reviewer lane shows `vacancy_request` and `vacancy_application` queue types;
   - Support Operator and Platform Administrator retain cross-work visibility for the current temporary operator-token stage;
   - Complaint Operator and Billing Operator are separated as lanes, but dedicated complaint and billing queues are future backend work;
9. no existing URL was moved;
10. no redirect was added;
11. backend, database, SQL, auth, payment, OpenClaw, nginx, server config and deployment were not changed;
12. all new visible operator navigation text uses i18n keys with English canonical source and English fallback.

## 3. Future Operator Navigation Rule

Future operator-facing pages must preserve this separation:

1. operator pages use an Operator navigation model, not the public Application or Documents menu as the primary navigation;
2. public application links may be available only as a grouped escape route from the operator surface;
3. public document links may be available only as reference material, not as mixed top-level operator links;
4. internal role names must stay aligned with document 80;
5. role-lane UI controls are not permission enforcement until account sessions and backend access control are implemented;
6. `Admin` must not become a public self-registration or public navigation category;
7. any future role-aware permission change must be planned as a separate backend/auth task.

## 4. Changed Files

Frontend:

- `projects/crewportglobal/public/verify/index.html`
- `projects/crewportglobal/public/assets/crewportglobal-app.css`

Test coverage:

- `tests/crewportglobal-navigation-menus.spec.ts`

Documentation:

- `docs/crewportglobal/84_cpg_ops_018_operator_portal_navigation_and_role_lanes_report.md`
- `docs/crewportglobal/00_documentation_register.md`

## 5. Verification

Verification planned and performed during this slice:

```bash
npm run check:cpg-i18n
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-navigation-menus.spec.ts
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
git diff --check
```

Local result:

1. public i18n validation passed;
2. English canonical coverage is complete for all referenced i18n keys;
3. existing non-English fallback warnings remain expected for current untranslated keys;
4. focused navigation regression passed: 4 tests;
5. operator queue regression passed: 2 tests;
6. whitespace diff check passed.

Live publication checks:

```bash
rsync -av --exclude=.well-known/ projects/crewportglobal/public/ /var/www/crewportglobal.com/
curl -k -fsS https://crewportglobal.com/api/v1/health
curl -k -fsS https://crewportglobal.com/verify/
```

Live result:

1. `/api/v1/health` returned `{"ok":true,"service":"crewportglobal-registration-api"}`;
2. `/verify/` contains `site-nav--operator`;
3. `/verify/` contains `nav-menu--operator-roles`;
4. `/verify/` contains `operator-lane-strip`.

## 6. Implementation Boundary

This slice does not implement:

1. role-based authentication;
2. backend permission enforcement;
3. database migrations;
4. operator account management;
5. complaint queue backend;
6. billing queue backend;
7. payment or entitlement logic;
8. OpenClaw configuration.

The current operator-token gate remains temporary and unchanged.

## 7. Next Recommended Work

Recommended next slices:

1. add account-session based operator identity;
2. map backend permissions to document 80 roles;
3. add dedicated complaint and billing queues when their backend objects exist;
4. extend the operator dashboard with role-aware queue counts;
5. keep public user navigation and internal operator navigation separate.
