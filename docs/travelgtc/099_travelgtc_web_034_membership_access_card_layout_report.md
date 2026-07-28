# TRAVELGTC-WEB-034 - Membership Access Card Layout Report

- Project: TravelGTC
- Code: TRAVELGTC-WEB-034
- Date: 2026-07-28
- Status: Implemented and published
- Scope: Home page Membership section, responsive CSS, Playwright guard

## 1. Problem

On the home page, the `Официальные входы Travel Advantage` card could collapse its text column into vertical letters on desktop widths. The cause was a two-column card layout:

```text
text column + auto action column
```

Long CTA labels in the action column consumed too much horizontal space.

## 2. Fix

The access card now uses a single-column layout:

1. heading and explanatory text;
2. CTA buttons below the text;
3. flexible button widths with wrapping.

This keeps the content readable and prevents long button labels from squeezing text.

## 3. Verification

Passed:

```text
npm run test:travelgtc
git diff --check
```

The Playwright suite now includes a guard that checks the access-card heading width and height so the heading cannot silently regress into vertical text.
