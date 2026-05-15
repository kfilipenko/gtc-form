# CrewPortGlobal - CPG-MKT-005 Document Application Return Menu Fix Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-15
- Document type: Implementation report and future-change rule
- Status: Implemented, verified and published to the live site

## 1. Purpose

This report records the correction of the document-page `Application` menu behavior.

The issue was reported on `/legal/verification-policy/`: the `Application` control looked like a direct button, but it was implemented as a dropdown summary. This made the interaction unclear for users who expect `Application` to return them to the functional application pages.

## 2. Implemented Scope

Implemented navigation fix:

1. on document pages, `Application` is now a direct link to `/`;
2. the functional page list remains available in a separate `Functional pages` dropdown;
3. the dropdown contains:
   - Home;
   - Vacancies;
   - Create Profile;
   - Post Vacancy;
   - Login / Register;
4. document links remain top-level within the Documents menu:
   - For Seafarers;
   - For Employers;
   - How It Works;
   - Trust & Safety;
5. existing document URLs were not moved;
6. no redirect was added;
7. backend, database, SQL, auth, payment, OpenClaw, nginx, server config and deployment were not changed;
8. the new visible label `Functional pages` uses the `nav.functionalPages` i18n key with English canonical source and translated RU/PT/UK catalog entries.

## 3. Future Navigation Rule

Future document-page navigation must preserve this behavior:

1. `Application` on document pages must be a direct return link to the application home page;
2. functional application links may be grouped under `Functional pages`;
3. document links must remain clearly separate under the Documents context;
4. shared menu structure must be updated through `projects/crewportglobal/public/assets/crewportglobal-navigation.js`;
5. generated document pages must be updated through `projects/crewportglobal/scripts/generate_public_pages.py` only when the mount contract changes;
6. new visible labels must be added through i18n keys before publication.

## 4. Changed Files

Generator and generated public pages:

- `projects/crewportglobal/scripts/generate_public_pages.py`
- `projects/crewportglobal/public/about/index.html`
- `projects/crewportglobal/public/for-seafarers/index.html`
- `projects/crewportglobal/public/for-shipowners/index.html`
- `projects/crewportglobal/public/how-it-works/index.html`
- `projects/crewportglobal/public/legal/*.html`

Shared i18n:

- `projects/crewportglobal/public/assets/crewportglobal-public-i18n.js`
- `projects/crewportglobal/i18n/en.json`
- `projects/crewportglobal/i18n/ru.json`
- `projects/crewportglobal/i18n/pt.json`
- `projects/crewportglobal/i18n/uk.json`

Test coverage:

- `tests/crewportglobal-navigation-menus.spec.ts`

Documentation:

- `docs/crewportglobal/83_cpg_mkt_004_application_documents_navigation_report.md`
- `docs/crewportglobal/85_cpg_mkt_005_document_application_return_menu_fix_report.md`
- `docs/crewportglobal/00_documentation_register.md`

## 5. Verification

Verification performed:

```bash
./projects/crewportglobal/scripts/run_public_generator.sh
npm run check:cpg-i18n
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-navigation-menus.spec.ts
git diff --check
```

Local result:

1. public page generator passed;
2. i18n validation passed;
3. English canonical coverage is complete for all referenced i18n keys;
4. existing non-English fallback warnings remain expected for current untranslated keys;
5. navigation regression passed: 5 tests;
6. the tests verify that `Application` is a direct `/` link on document pages;
7. the tests verify that `Functional pages` opens and exposes all 5 application targets;
8. the tests verify that all 4 document targets remain available;
9. whitespace diff check passed.

Live publication checks:

```bash
rsync -av --exclude=.well-known/ projects/crewportglobal/public/ /var/www/crewportglobal.com/
curl -k -fsS https://crewportglobal.com/legal/verification-policy/
curl -k -fsS https://crewportglobal.com/api/v1/health
```

Live result:

1. `/legal/verification-policy/` contains a direct `Application` link to `https://crewportglobal.com/`;
2. `/legal/verification-policy/` contains `nav-menu--application-pages`;
3. `/legal/verification-policy/` contains the `Functional pages` dropdown;
4. the dropdown contains all 5 functional page links;
5. `/api/v1/health` returned `{"ok":true,"service":"crewportglobal-registration-api"}`;
6. live browser click check passed: clicking `Application` navigates to `https://crewportglobal.com/`;
7. live browser dropdown check passed: `Functional pages` opens and exposes the application links.

## 6. Implementation Boundary

This was a frontend-only navigation correction.

It did not change:

1. backend routes;
2. database schema or data;
3. authentication;
4. payment;
5. OpenClaw;
6. nginx or server configuration.
