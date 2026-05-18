# CrewPortGlobal — CPG-DESIGN-002 Theme Switcher and Dark Functional Foundation Report

- Project: CrewPortGlobal.com
- Date: 2026-05-18
- Status: Implemented for review
- Baseline: `121_cpg_design_001_unified_responsive_theme_system.md`
- Scope: shared public header, document pages, functional application pages and Playwright navigation coverage

## 1. Purpose

This document records the first implementation slice of the unified CrewPortGlobal responsive theme system.

The goal of this slice was to stop treating document pages and functional pages as two separate visual products and to introduce a shared theme foundation that can be applied gradually across:

```text
public pages
document pages
registration pages
personal cabinet
team pages
operator pages
admin console
```

## 2. Implemented Scope

The shared navigation script now applies a site-level theme state to the root HTML element:

```text
data-cpg-theme-mode="auto|dark|light"
data-cpg-theme="dark|light"
```

The first implementation supports:

```text
Auto
Dark Maritime
Light Work
```

Default behavior:

```text
Dark Maritime is used when no local preference exists.
User choice is persisted in localStorage.
Auto follows the browser color-scheme preference.
```

## 3. Changed Files

```text
projects/crewportglobal/public/assets/crewportglobal-navigation.js
projects/crewportglobal/public/assets/crewportglobal-docs.css
projects/crewportglobal/public/assets/crewportglobal-app.css
tests/crewportglobal-navigation-menus.spec.ts
```

## 4. Navigation and Theme Switcher

The theme switcher is rendered in the shared header/account area.

Visible labels are handled through the shared frontend language label model for:

```text
English
Russian
Portuguese
```

The switcher is available without login and does not affect:

```text
authentication
authorization
group membership
document visibility
workflow status
admin/team permissions
```

## 5. Styling Foundation

`crewportglobal-docs.css` now contains shared theme-switcher styles and light-theme overrides for document pages.

`crewportglobal-app.css` now contains the first dark-theme foundation for functional application pages, including:

```text
page background
header/nav surfaces
cards and panels
forms and inputs
dropdowns
chips
tables
operator lane controls
account menu shell
```

This is a foundation pass, not the final compact layout redesign.

## 6. Navigation Layering Fix

The shared navigation was given a stronger stacking layer so dropdown menus remain clickable above page cards and dashboard panels.

This fixes the class of issue where a dropdown visually opens but page content receives the click.

## 7. Verification

Commands run:

```bash
node --check projects/crewportglobal/public/assets/crewportglobal-navigation.js
node projects/crewportglobal/scripts/check_public_i18n.js
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-navigation-menus.spec.ts
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-auth-password-session.spec.ts
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-cabinet-dashboard.spec.ts
```

Results:

```text
navigation JavaScript syntax: passed
public i18n validator: passed with existing non-English fallback warnings
navigation menus and theme switcher: 6 passed
password registration/login/session/cabinet access: 2 passed
cabinet dashboard: 3 passed
```

Note:

```text
One parallel Playwright attempt for the cabinet spec failed because another test server was already using the configured port.
The cabinet spec was rerun separately and passed.
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

No permissions or data visibility rules were changed.

## 9. Remaining Work

The next design implementation slice should be a compact responsive layout pass for the highest-impact functional screens:

```text
/register/
/cabinet/
/team/documents/
/admin/access/
/verify/
```

Recommended priorities:

```text
1. reduce oversized headings;
2. tighten section spacing;
3. standardize card padding and grid behavior;
4. improve mobile and tablet layout density;
5. make the first screen action-focused rather than empty-space-heavy;
6. keep My tasks as the first open card in cabinet/work pages;
7. keep secondary cards collapsed by default where workflow allows.
```

## 10. Final Recommendation

The theme-switcher and dark functional foundation are ready for Project Owner review.

The project can now proceed to Phase 2: compact responsive redesign of the main functional screens using the shared Dark Maritime / Light Work system.
