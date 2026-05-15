# CrewPortGlobal - CPG-OPS-019 Operator Role Lane Counts Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-15
- Document type: Implementation report and future-change rule
- Status: Implemented, verified locally and published to the live site

## 1. Purpose

This report records the next operator-portal improvement after the shared navigation component and document 80 role model work.

The change makes `/verify/` more useful as an operational application surface: role lanes now show queue counts, so an operator can see which role area has active work before filtering the table.

## 2. Implemented Scope

Implemented changes:

1. added visible count badges to the shared Operator role-lane menu;
2. added visible count badges to the `/verify/` role-lane toolbar;
3. kept role-lane labels translatable by moving i18n keys to inner label spans;
4. counted work by the document 80 role-lane mapping:
   - All work: all loaded queue items;
   - Verifier: `seafarer_profile` and `company_verification`;
   - Reviewer: `vacancy_request` and `vacancy_application`;
   - Complaint Operator: 0 until complaint queue backend exists;
   - Billing Operator: 0 until billing queue backend exists;
   - Support Operator: all loaded queue items for the current temporary operator-token stage;
   - Platform Administrator: all loaded queue items inside the shared role menu;
5. updated the queue status line to show active lane name and lane total;
6. added an empty filtered-lane message when filters or role selection hide all rows;
7. extended Playwright coverage to confirm Verifier and Reviewer lane counts increase when matching queue work exists.

## 3. Safety and Product Boundaries

The implementation keeps these boundaries:

1. lane counts are frontend presentation only;
2. lane counts do not implement permission enforcement;
3. the temporary operator token boundary remains unchanged;
4. no backend, database, SQL, auth, payment, OpenClaw, nginx, server configuration or deployment logic was changed;
5. complaint and billing lanes remain visible governance placeholders until dedicated backend objects exist.

## 4. Changed Files

Frontend:

- `projects/crewportglobal/public/verify/index.html`
- `projects/crewportglobal/public/assets/crewportglobal-navigation.js`
- `projects/crewportglobal/public/assets/crewportglobal-app.css`

Test coverage:

- `tests/crewportglobal-operator-queue.spec.ts`

Documentation:

- `docs/crewportglobal/87_cpg_ops_019_operator_role_lane_counts_report.md`
- `docs/crewportglobal/00_documentation_register.md`

## 5. Verification

Verification performed:

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
4. focused navigation regression passed;
5. operator queue regression passed;
6. whitespace diff check passed.

Live publication checks:

```bash
rsync -av --exclude=.well-known/ projects/crewportglobal/public/ /var/www/crewportglobal.com/
curl -k -fsS https://crewportglobal.com/api/v1/health
curl -k -fsS https://crewportglobal.com/verify/
```

Live result:

1. `/api/v1/health` returned `{"ok":true,"service":"crewportglobal-registration-api"}`;
2. `/verify/` contains `data-operator-lane-count`;
3. the live operator queue page renders the shared operator navigation and role-lane toolbar without page errors.

## 6. Future Operator Rule

Future operator pages should preserve this model:

1. role-lane counts may guide work routing but must not be treated as access control;
2. access control must be implemented separately through account sessions and backend permissions;
3. complaint and billing count badges must remain at zero until their backend queues exist;
4. role labels and count-bearing controls must keep i18n-compatible child labels instead of direct button-level `data-i18n`;
5. shared navigation updates must stay in `projects/crewportglobal/public/assets/crewportglobal-navigation.js`.

## 7. Next Recommended Work

Recommended next slices:

1. add account-session based operator identity;
2. map backend permissions to document 80 roles;
3. add dedicated complaint and billing queue objects;
4. add employer-side filter tabs for presented, contacted, interview requested and not suitable candidates.
