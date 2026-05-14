# CrewPortGlobal - CPG-MKT-004 Application and Documents Navigation Separation Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-14
- Document type: Implementation report and future-change rule
- Status: Implemented, verified and published to the live site

## 1. Purpose

This report records the frontend-only navigation separation between functional application pages and documentary pages.

The change supports the product direction recorded in document 69 and the role-separation model recorded in document 80: public users should see clear application actions, while documents remain available without making the main application workflow feel like a reading library.

## 2. Implemented Scope

Implemented navigation model:

1. functional pages use an Application menu;
2. documentary pages use a Documents menu;
3. document links moved under a `Documents` accordion/dropdown on application pages;
4. application links moved under an `Application` accordion/dropdown on document pages;
5. the four public document URLs remain unchanged:
   - `/for-seafarers/`;
   - `/for-shipowners/`;
   - `/how-it-works/`;
   - `/legal/verification-policy/`;
6. no redirects were added;
7. no files or URLs were moved;
8. backend, database, SQL, auth, payment, OpenClaw, nginx, server config and deployment were not changed;
9. all new visible navigation labels use i18n keys with English canonical source and English fallback.

## 3. Future Navigation Rule

Future frontend changes must preserve this model:

1. application pages may show only the primary workflow links at the top level:
   - Home;
   - Vacancies;
   - Create Profile;
   - Post Vacancy;
   - Login / Register;
   - Documents dropdown;
2. documentary pages may show only:
   - Application dropdown;
   - Documents label and current document group links;
3. documentary links must not be added back as top-level links on functional application pages;
4. workflow action links must not be added back as a mixed top-level set on documentary pages;
5. the protected operator workflow and future operator portal remain separate from the public application/document navigation model unless the Project Owner approves a dedicated operator navigation slice under document 80.

## 4. Changed Files

Frontend shell and generated pages:

- `projects/crewportglobal/public/index.html`
- `projects/crewportglobal/public/vacancies/index.html`
- `projects/crewportglobal/public/vacancies/detail/index.html`
- `projects/crewportglobal/public/create-profile/index.html`
- `projects/crewportglobal/public/post-vacancy/index.html`
- `projects/crewportglobal/public/register/index.html`
- `projects/crewportglobal/public/onboarding/seafarer-registration/index.html`
- `projects/crewportglobal/public/language.html`
- `projects/crewportglobal/public/about/index.html`
- `projects/crewportglobal/public/for-seafarers/index.html`
- `projects/crewportglobal/public/for-shipowners/index.html`
- `projects/crewportglobal/public/how-it-works/index.html`
- `projects/crewportglobal/public/legal/*.html`

Shared frontend assets:

- `projects/crewportglobal/public/assets/crewportglobal-docs.css`
- `projects/crewportglobal/public/assets/crewportglobal-app.css`
- `projects/crewportglobal/public/assets/crewportglobal-public-i18n.js`
- `projects/crewportglobal/i18n/*.json`

Generator and source hygiene:

- `projects/crewportglobal/scripts/generate_public_pages.py`
- `projects/crewportglobal/public/legal/complaints/index.md`

Test coverage:

- `tests/crewportglobal-navigation-menus.spec.ts`
- `tests/crewportglobal-homepage-language.spec.ts`

Documentation:

- `docs/crewportglobal/83_cpg_mkt_004_application_documents_navigation_report.md`
- `docs/crewportglobal/00_documentation_register.md`

## 5. Verification

Verification planned and performed during this slice:

```bash
./projects/crewportglobal/scripts/run_public_generator.sh
npm run check:cpg-i18n
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-navigation-menus.spec.ts
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-homepage-language.spec.ts
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-create-profile-prefill.spec.ts tests/crewportglobal-homepage-language.spec.ts tests/crewportglobal-homepage-live-dashboard.spec.ts tests/crewportglobal-navigation-menus.spec.ts tests/crewportglobal-operator-queue.spec.ts tests/crewportglobal-post-vacancy-workspace.spec.ts tests/crewportglobal-register-routing.spec.ts tests/crewportglobal-vacancy-board.spec.ts tests/crewportglobal-vacancy-detail-apply.spec.ts
npm run test:cpg-api
git diff --check
```

Local result:

1. public page generator passed after fixing the existing `legal/complaints/index.md` frontmatter boundary;
2. i18n key check passed, with the existing non-English fallback warnings unchanged;
3. focused navigation and homepage language regression passed: 13 tests;
4. CrewPortGlobal browser regression passed: 25 tests;
5. CrewPortGlobal API regression passed: 10 tests;
6. whitespace diff check passed.

Verification note:

The unfiltered command `npx playwright test -c playwright.crewportglobal.config.ts` is not a valid CrewPortGlobal-only verification command in this repository, because it also picks up unrelated `chat-*` tests and runs the API spec through the browser config. The correct split is the explicit CrewPortGlobal browser list above plus `npm run test:cpg-api`.

Live publication checks:

```bash
./projects/crewportglobal/scripts/publish_live_site.sh
curl -k -fsS https://crewportglobal.com/api/v1/health
curl -k -fsS https://crewportglobal.com/
curl -k -fsS https://crewportglobal.com/for-seafarers/
```

Live result:

1. `/api/v1/health` returned `{"ok":true,"service":"crewportglobal-registration-api"}`;
2. `/` contains `site-nav--application` and `nav-menu--documents`;
3. `/for-seafarers/` contains `site-nav--documents` and `nav-menu--application`;
4. all four existing document URLs returned HTTP 200;
5. mobile live smoke at 390 px viewport reported no horizontal overflow;
6. live browser smoke reported no page errors or console errors.

The regression must cover:

1. application pages show `site-nav--application`;
2. document pages show `site-nav--documents`;
3. `Documents` dropdown opens on application pages;
4. `Application` dropdown opens on document pages;
5. all four public document links keep their existing URLs;
6. direct document URLs remain accessible;
7. language selector and runtime translations remain functional.

## 6. Next Recommended Work

Recommended next slices:

1. implement the dedicated operator portal navigation model from document 80;
2. add role-aware navigation once account sessions replace draft-id workspace access;
3. keep public application navigation focused on actions, not documentation expansion.
