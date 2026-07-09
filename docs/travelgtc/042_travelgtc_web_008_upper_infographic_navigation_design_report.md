# TRAVELGTC-WEB-008 - Upper Infographic Navigation Design Report

- Project: TravelGTC
- Code: TRAVELGTC-WEB-008
- Date: 2026-07-09
- Status: Implemented

## 1. Summary

The home-page infographic navigation was moved from the lower part of the landing page to the upper page area directly after the hero and benefits band.

The block now acts as an early visual menu and supports the funnel sequence:

```text
interest -> role -> application -> consultation
```

## 2. Implemented Changes

Updated:

```text
projects/travelgtc/public/index.html
projects/travelgtc/public/assets/css/site.css
```

Changes:

1. renamed the block to `Struktura saita` in the UI;
2. moved the block above the first content section;
3. removed the lower duplicate sitemap placement;
4. increased desktop visual weight for the infographic icons and labels;
5. added a compact reference-style accent line under the section heading;
6. preserved the route links for home, travel lifestyle, club, create trip, business model, events, about and contacts;
7. updated the flow summary to the business funnel logic: interest, role, application, consultation;
8. kept tablet and mobile responsive layouts.

## 3. Verification

Local verification:

```bash
node --check projects/travelgtc/public/assets/js/site.js
npm run test:travelgtc
```

Result:

```text
17 passed
```

Live verification:

```bash
TRAVELGTC_BASE_URL=https://travelgtc.com npm run test:travelgtc
curl -fsS https://travelgtc.com/ | rg -n "Структура сайта|Маршрут к вашей travel-идее|Интерес|Консультация"
```

Result:

```text
17 passed
Live HTML contains the updated upper site-structure block.
```

Generated responsive screenshots:

```text
projects/travelgtc/test-artifacts/screenshots/travelgtc-home-desktop.png
projects/travelgtc/test-artifacts/screenshots/travelgtc-home-tablet.png
projects/travelgtc/test-artifacts/screenshots/travelgtc-home-mobile.png
```

Visual review:

1. the infographic menu is visible in the upper home page;
2. mobile layout uses two columns without horizontal overflow;
3. no rejected generated image files were restored.

## 4. Publication

The updated static public files were published through:

```bash
projects/travelgtc/scripts/deploy_public_live.sh
```

Live root:

```text
/var/www/travelgtc.com
```

## 5. Remaining Notes

The site still uses CSS-based visual panels and layout styling because no approved production bitmap image set exists in `projects/travelgtc/public/assets/images/processed/`.
