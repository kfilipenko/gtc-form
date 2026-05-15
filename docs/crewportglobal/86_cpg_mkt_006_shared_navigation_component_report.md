# CrewPortGlobal - CPG-MKT-006 Shared Navigation Component Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-15
- Document type: Implementation report and future-change rule
- Status: Implemented, verified and published to the live site

## 1. Purpose

This report records the centralization of CrewPortGlobal public navigation into one shared frontend component.

The previous implementation duplicated full `<nav>` blocks across static application pages, generated document pages and the operator page. This made every menu correction touch many HTML files. The new model keeps the navigation structure in one shared asset and leaves each page with only a small mount point that declares the navigation type and active route.

## 2. Implemented Scope

Implemented shared navigation model:

1. created `projects/crewportglobal/public/assets/crewportglobal-navigation.js`;
2. moved Application menu rendering into the shared component;
3. moved Documents menu rendering into the shared component;
4. moved Operator navigation rendering into the shared component;
5. replaced repeated static `<nav>` blocks with mount points:
   - `data-cpg-navigation="application"`;
   - `data-cpg-navigation="documents"`;
   - `data-cpg-navigation="operator"`;
6. page-level active state is now passed through `data-cpg-nav-active`;
7. document pages are generated with the shared navigation mount through `projects/crewportglobal/scripts/generate_public_pages.py`;
8. the document-page `Application` return behavior from document 85 is preserved;
9. operator role-lane navigation from document 84 is preserved;
10. language runtime remains responsible for translating the rendered navigation through existing `data-i18n` keys;
11. backend, database, SQL, auth, payment, OpenClaw, nginx, server config and deployment were not changed.

## 3. Future Navigation Rule

Future navigation changes must use the shared component:

1. do not paste full `<nav class="site-nav ...">` blocks into individual pages;
2. edit shared menu structure in `projects/crewportglobal/public/assets/crewportglobal-navigation.js`;
3. use mount points on pages to choose the navigation mode and active route;
4. update `projects/crewportglobal/scripts/generate_public_pages.py` only when the document-page mount contract changes;
5. add new visible labels through i18n keys before publication;
6. keep public application, document and operator navigation models separate.

## 4. Changed Files

Shared frontend asset:

- `projects/crewportglobal/public/assets/crewportglobal-navigation.js`

Generator:

- `projects/crewportglobal/scripts/generate_public_pages.py`

Application pages:

- `projects/crewportglobal/public/index.html`
- `projects/crewportglobal/public/language.html`
- `projects/crewportglobal/public/vacancies/index.html`
- `projects/crewportglobal/public/vacancies/detail/index.html`
- `projects/crewportglobal/public/create-profile/index.html`
- `projects/crewportglobal/public/post-vacancy/index.html`
- `projects/crewportglobal/public/register/index.html`
- `projects/crewportglobal/public/onboarding/seafarer-registration/index.html`

Operator page:

- `projects/crewportglobal/public/verify/index.html`

Generated document pages:

- `projects/crewportglobal/public/about/index.html`
- `projects/crewportglobal/public/for-seafarers/index.html`
- `projects/crewportglobal/public/for-shipowners/index.html`
- `projects/crewportglobal/public/how-it-works/index.html`
- `projects/crewportglobal/public/legal/*.html`

Test coverage:

- `tests/crewportglobal-navigation-menus.spec.ts`

Documentation:

- `docs/crewportglobal/86_cpg_mkt_006_shared_navigation_component_report.md`
- `docs/crewportglobal/00_documentation_register.md`

## 5. Verification

Verification performed:

```bash
./projects/crewportglobal/scripts/run_public_generator.sh
npm run check:cpg-i18n
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-navigation-menus.spec.ts
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
git diff --check
```

Local result:

1. public page generator passed;
2. i18n validation passed;
3. English canonical coverage is complete for all referenced i18n keys;
4. navigation regression passed: 5 tests;
5. operator queue regression passed: 2 tests;
6. whitespace diff check passed.

Source hygiene result:

1. public HTML files no longer contain repeated `<nav class="site-nav ...">` blocks;
2. the shared `<nav>` rendering lives in `projects/crewportglobal/public/assets/crewportglobal-navigation.js`.

Live publication checks:

```bash
rsync -av --exclude=.well-known/ projects/crewportglobal/public/ /var/www/crewportglobal.com/
curl -k -fsS https://crewportglobal.com/api/v1/health
```

Live browser result:

1. `/legal/verification-policy/` renders `site-nav--documents` from the shared component;
2. clicking `Application` navigates to `https://crewportglobal.com/`;
3. `/` renders `site-nav--application` from the shared component;
4. `/verify/` renders `site-nav--operator` from the shared component;
5. `/api/v1/health` returned `{"ok":true,"service":"crewportglobal-registration-api"}`.

## 6. Implementation Boundary

This was a frontend-only maintainability refactor.

It did not change:

1. backend routes;
2. database schema or data;
3. authentication;
4. payment;
5. OpenClaw;
6. nginx or server configuration.
