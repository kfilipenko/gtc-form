# TRAVELGTC-WEB-015 - Remove Home Process Declaration Block Report

- Project: TravelGTC
- Code: TRAVELGTC-WEB-015
- Date: 2026-07-09
- Status: Implemented

## 1. Summary

The home page no longer contains the standalone `Страницы и процесс` / `Каждый раздел ведёт к следующему действию` section.

The home page now moves directly from hero and short benefits into the travel-content block, so the page performs the funnel instead of explaining it.

## 2. Implemented Changes

Updated `projects/travelgtc/public/index.html`:

1. removed the `site-map-section upper-map` section;
2. removed the repeated `menu-infographic` navigation from the page body;
3. updated the home request text to say that contacts are taken from the account profile.

Updated `projects/travelgtc/public/assets/css/site.css`:

1. removed obsolete `site-map-section`, `menu-infographic`, `menu-node` and `menu-icon` styles;
2. added compact process markers to the top navigation with stage labels:
   interest, need, environment, application, membership, participation, trust and consultation.

Updated `tests/travelgtc-responsive.spec.ts`:

1. removed the expectation that `.menu-infographic` exists;
2. added an assertion that `.menu-infographic` is absent from the home page.

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

1. the removed page-process block is gone;
2. the first page flow is shorter and action-first;
3. top navigation contains compact process hints;
4. there is no horizontal overflow on mobile or desktop.

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
