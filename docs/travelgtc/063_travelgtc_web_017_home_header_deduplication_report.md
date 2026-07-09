# TRAVELGTC-WEB-017 - Home And Header Deduplication Report

- Project: TravelGTC
- Code: TRAVELGTC-WEB-017
- Date: 2026-07-09
- Status: Implemented

## 1. Summary

The public header and home page were simplified to remove duplicated navigation and repeated content.

The header now uses `Контакты` as the single contact route. The home page now moves from the hero directly into the visual opportunity gallery and route CTA.

## 2. Implemented Changes

Updated public HTML:

1. removed the `Связаться со мной` button from all public headers;
2. kept `Контакты` in the main navigation;
3. changed the contacts page hero H1 from `Свяжитесь со мной` to `Контакты`;
4. removed the home `benefits-band` / `benefit-strip` section.

Updated CSS:

1. removed obsolete `.benefits-band` and `.benefit-strip` styles;
2. removed responsive rules that only existed for the deleted benefits band;
3. removed the obsolete `.nav-contact` responsive rule.

Updated tests:

1. changed the home responsive check so `.benefit-strip` must be absent;
2. kept checks for `.opportunity-gallery`, five `.opportunity-card` items and `.route-promo`;
3. kept the guard that `.menu-infographic` remains absent.

Updated design notes:

1. `docs/travelgtc/049_travelgtc_design_system.md`;
2. `projects/travelgtc/docs/travelgtc/011_travelgtc_design_system.md`.

The design standard now states that contact navigation belongs to the `Контакты` menu item and should not be duplicated by a separate `Связаться со мной` header button.

## 3. Verification

Local verification:

```bash
npm run test:travelgtc
npm run test:travelgtc-funnel
```

Result:

```text
TravelGTC responsive: 17 passed.
TravelGTC funnel: 1 passed.
```

Visual review:

```text
projects/travelgtc/test-artifacts/screenshots/travelgtc-home-desktop.png
projects/travelgtc/test-artifacts/screenshots/travelgtc-home-mobile.png
```

Reviewed focus:

1. the hero moves directly into the opportunity gallery;
2. the deleted four-card benefits block is absent;
3. the header no longer has the duplicate contact CTA;
4. mobile layout has no horizontal overflow.

## 4. Publication

Published through:

```bash
projects/travelgtc/scripts/deploy_public_live.sh
```

Live verification:

```bash
TRAVELGTC_BASE_URL=https://travelgtc.com npm run test:travelgtc
TRAVELGTC_FUNNEL_BASE_URL=https://travelgtc.com npm run test:travelgtc-funnel
```

Result:

```text
TravelGTC live responsive: 17 passed.
TravelGTC live funnel: 1 passed.
```
