# CrewPortGlobal - CPG-DESIGN-003 Compact Responsive Workbench Report

- Project: CrewPortGlobal.com
- Date: 2026-05-18
- Status: Implemented for review
- Baseline:
  - `121_cpg_design_001_unified_responsive_theme_system.md`
  - `122_cpg_design_002_theme_switcher_and_dark_functional_foundation_report.md`
- Scope: compact responsive workbench styling for functional, cabinet, team and admin pages

## 1. Purpose

This document records the second implementation slice of the unified CrewPortGlobal responsive theme system.

The goal of this slice was to make the functional application pages feel more like a professional operational product:

```text
more compact page density
smaller and clearer headings
consistent 8px workbench card radius
shared Dark Maritime / Light Work theme behavior
mobile/tablet/desktop responsive stability
no page-level horizontal overflow on mobile
```

## 2. Implemented Scope

The shared app CSS now includes a compact responsive workbench foundation for:

```text
site shell
header and navigation surfaces
cards and panels
forms and inputs
tables and queues
account/workbench action areas
mobile breakpoints
```

The following workbench pages now expose the shared theme switcher and Dark Maritime overrides:

```text
/cabinet/
/team/documents/
/admin/access/
```

The following high-impact functional pages are covered by the compact CSS/mobile overflow checks:

```text
/register/
/cabinet/
/team/documents/
/admin/access/
/verify/
```

## 3. Changed Files

```text
projects/crewportglobal/public/assets/crewportglobal-app.css
projects/crewportglobal/public/assets/crewportglobal-docs.css
projects/crewportglobal/public/index.html
projects/crewportglobal/public/vacancies/index.html
projects/crewportglobal/public/onboarding/seafarer-registration/index.html
projects/crewportglobal/public/cabinet/index.html
projects/crewportglobal/public/team/documents/index.html
projects/crewportglobal/public/admin/access/index.html
tests/crewportglobal-navigation-menus.spec.ts
```

## 4. Typography and Density

The compact foundation reduces oversized headings and excess whitespace on operational screens.

Rules applied in this slice:

```text
letter spacing is zero, not negative;
hero-sized type is not used inside compact workbench panels;
forms, cards, tables and buttons use tighter spacing;
repeated workbench cards use 8px radius where possible;
mobile screens avoid oversized headings and unnecessary side gaps.
```

Existing negative letter-spacing values were removed from public and document-facing surfaces touched by this pass.

## 5. Responsive Behavior

The mobile overflow test checks that key functional pages do not create page-level horizontal scrolling at a mobile viewport.

During verification, `/team/documents/` exposed a mobile overflow problem caused by internal queue/table/header sizing. The page was corrected with:

```text
min-width: 0 on frame/panel containers
bounded queue wrapper overflow
mobile grid header behavior
full-width mobile action buttons
safe text wrapping for status/action content
```

## 6. Theme Behavior

The shared theme model from CPG-DESIGN-002 remains unchanged:

```text
Auto
Dark Maritime
Light Work
```

This slice adds explicit workbench-level dark theme tokens for:

```text
cabinet dashboard
team document review queue
admin access console
```

No authentication, authorization, group membership or data visibility behavior was changed.

## 7. Verification

Commands run:

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-navigation-menus.spec.ts
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-cabinet-dashboard.spec.ts
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-document-review-ui.spec.ts
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-auth-password-session.spec.ts
node projects/crewportglobal/scripts/check_public_i18n.js
rg -n "letter-spacing:\s*-" projects/crewportglobal/public docs/crewportglobal tests
projects/crewportglobal/scripts/deploy_public_live.sh
```

Results:

```text
navigation menus, theme switcher and mobile overflow: 8 passed
cabinet dashboard: 3 passed
document review UI: 1 passed
password registration/login/session/cabinet access: 2 passed
public i18n validator: passed with existing non-English fallback warnings
negative letter-spacing scan: no matches
public live deploy script: passed
```

Note:

```text
One earlier parallel Playwright attempt failed because another test server was already using the configured port.
The affected specs were rerun separately and passed.
```

Live checks confirmed that:

```text
https://crewportglobal.com/assets/crewportglobal-app.css contains the CPG-DESIGN-003 compact foundation.
https://crewportglobal.com/cabinet/ exposes the shared theme switcher.
https://crewportglobal.com/team/documents/ exposes the shared theme switcher and navigation script.
https://crewportglobal.com/admin/access/ exposes the shared theme switcher and navigation script.
```

## 8. Boundaries

Not changed in this slice:

```text
backend
database
migrations
auth/session logic
email verification logic
document upload/review logic
payment
OpenClaw
nginx/server configuration
```

This was a frontend/documentation/test slice.

## 9. Remaining Work

Recommended next design implementation steps:

```text
1. continue compact redesign page-by-page for homepage, vacancies and registration/authorization flow;
2. extract repeated inline workbench styles into shared CSS components;
3. tighten mobile/tablet layouts for authorization forms and upload sections;
4. add visual regression checks for dark and light theme states;
5. continue replacing legacy public-service CTAs with account/cabinet-led flows.
```

## 10. Final Recommendation

The compact responsive workbench foundation is ready for Project Owner review.

The project can continue with page-by-page refinement using the same unified Dark Maritime / Light Work design system.
