# CrewPortGlobal - CPG-MKT-007 Public Navigation Registration CTA Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-17
- Document type: Frontend-only implementation report
- Status: Implemented for Project Owner review

## 1. Purpose

This report records the first safe frontend-only implementation slice from BP-009.

The public website and public document pages must now route users toward Login / Registration instead of exposing private functional entry points as normal public navigation.

## 2. Implemented Scope

Updated public navigation:

```text
projects/crewportglobal/public/assets/crewportglobal-navigation.js
```

The public application menu now contains:

```text
Home
Vacancies
Login / Register
Documents dropdown
```

Removed from public navigation:

```text
Create Profile
Post Vacancy
Functional pages dropdown on document pages
```

Document pages now show public application links directly and continue to show document links.

## 3. Public CTA Transition

Public CTA links that previously opened private functional workflows now point to:

```text
https://crewportglobal.com/register/
```

Updated public surfaces:

```text
home page
vacancy board page
vacancy detail page
for seafarers document page
for employers document page
seafarer candidate agreement page
```

Direct URLs remain available:

```text
/create-profile/
/post-vacancy/
```

They are no longer promoted as normal public navigation targets in this slice.

## 4. Source And Generated Pages

Updated source Markdown:

```text
projects/crewportglobal/public/for-seafarers/index.md
projects/crewportglobal/public/for-shipowners/index.md
projects/crewportglobal/public/legal/seafarer-candidate-agreement/index.md
```

Regenerated public document HTML through:

```bash
projects/crewportglobal/scripts/run_public_generator.sh
```

Updated generator navigation defaults:

```text
projects/crewportglobal/scripts/generate_public_pages.py
```

This keeps future generated document pages aligned with the BP-009 navigation model.

## 5. Test Updates

Updated Playwright expectations:

```text
tests/crewportglobal-navigation-menus.spec.ts
tests/crewportglobal-homepage-language.spec.ts
```

The tests now verify:

1. public navigation does not expose Create Profile or Post Vacancy;
2. document navigation does not expose a Functional pages dropdown;
3. direct functional URLs still open and render the simplified public navigation;
4. public home and vacancy page CTA links no longer point directly to `/create-profile/` or `/post-vacancy/`;
5. operator public-app dropdown follows the same public navigation boundary.

## 6. Boundaries

Not changed:

```text
backend
database
authentication runtime
authorization runtime
admin console
operator queue
payment
OpenClaw
nginx/server configuration
deployment
```

No redirects were introduced.

No existing functional page files were removed.

## 7. Verification Performed

Safe checks:

```bash
projects/crewportglobal/scripts/run_public_generator.sh
npm run check:cpg-i18n
python3 -m py_compile projects/crewportglobal/scripts/generate_public_pages.py
git diff --check
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-navigation-menus.spec.ts tests/crewportglobal-homepage-language.spec.ts
```

Result:

```text
public i18n validator passed with existing non-English fallback warnings
Python generator syntax check passed
git diff --check passed
Playwright navigation and public CTA regression passed: 15 tests
```

## 8. Result

The public site now behaves as a public information and entry surface.

Users are directed to Login / Registration before entering role-specific or private workflows, while existing direct URLs remain available for the current transition period.
