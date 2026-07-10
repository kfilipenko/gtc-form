# TRAVELGTC-WEB-020 - Route Promo Design And Map Image Report

- Project: TravelGTC
- Code: TRAVELGTC-WEB-020
- Date: 2026-07-10
- Status: Implemented

## 1. Summary

The home `Создавайте свои маршруты` block was updated to better match the approved design direction.

The block now uses a handwritten-style title, icon-based route formats and a new map-planning photo.

## 2. Implemented Changes

Prepared image asset:

```text
projects/travelgtc/public/assets/images/processed/travelgtc-route-map-planning-coast.webp
```

Source image:

```text
projects/travelgtc/public/assets/images/inbox/foto/ChatGPT Image 9 июл. 2026 г., 15_56_48 (4).png
```

Updated `projects/travelgtc/public/index.html`:

1. added `Caveat` to the home page Google Fonts request;
2. replaced numeric route badges with five inline SVG infographic icons;
3. replaced the route visual image with `travelgtc-route-map-planning-coast.webp`;
4. updated image alt text to describe route planning with a map.

Updated `projects/travelgtc/public/assets/css/site.css`:

1. changed `.route-script` to use `Caveat`;
2. increased the handwritten title scale;
3. styled route option SVG icons as compact turquoise line icons;
4. removed the previous numeric `data-code` badge styling.

Updated `tests/travelgtc-responsive.spec.ts`:

1. asserted that five route SVG icons are present;
2. asserted that old `data-code` badges are absent;
3. asserted that the route image points to the new WebP;
4. asserted that the route heading font includes `Caveat`.

Updated `projects/travelgtc/public/assets/images/README.md`:

1. documented the new processed route-map image;
2. recorded the source file from `inbox/foto/`.

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
projects/travelgtc/test-artifacts/screenshots/travelgtc-home-tablet.png
projects/travelgtc/test-artifacts/screenshots/travelgtc-home-mobile.png
```

Reviewed focus:

1. handwritten title is visible;
2. route options use icons instead of numbers;
3. map-planning image is visible;
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
