# TRAVELGTC-WEB-039 - Contact Route Removal And Protected Footer Contacts Report

- Project: TravelGTC
- Code: TRAVELGTC-WEB-039
- Date: 2026-07-28
- Status: Implemented

## 1. Summary

The separate `/contacts/` page was removed from the public site because it duplicated the Mira consultation flow and reintroduced a request form.

Direct project contact details now live in the global footer as a compact contact block:

- `Основные каналы:`
- email link for opening the user's mail application;
- project phone link for direct calling.

## 2. Anti-Scraping Approach

The email address and phone number are not stored as ready-made strings in static HTML.

They are stored as separate data attributes and assembled by `projects/travelgtc/public/assets/js/site.js` after page load.

This reduces basic source-code scraping risk. It is not an absolute protection against bots that execute JavaScript or inspect rendered DOM.

## 3. Implementation

Changed:

- removed `projects/travelgtc/public/contacts/index.html`;
- removed `/contacts/` from public navigation;
- replaced footer `Contact` navigation with protected direct contact data;
- redirected old page CTAs that pointed to `/contacts/` toward `/mira/`;
- removed `/contacts/` from deployment smoke routes;
- added Playwright checks for protected footer contact rendering.

## 4. Verification

Expected checks:

```bash
npm run test:travelgtc
git diff --check
projects/travelgtc/scripts/deploy_public_live.sh
```

## 5. Continuation Rule

Do not reintroduce `/contacts/` as a separate request-form page.

Primary consultation flow is `/mira/`.

Direct contact information belongs to the footer and should remain assembled client-side from protected data pieces unless a stronger server-side contact-protection solution is implemented.
