# TRAVELGTC-WEB-009 - Reference Image Hero Alignment Report

- Project: TravelGTC
- Code: TRAVELGTC-WEB-009
- Date: 2026-07-09
- Status: Implemented

## 1. Summary

The home page was updated to include real travel imagery and a stronger first-screen composition based on the supplied visual reference.

The previous CSS-only hero was replaced with a photographic hero background, dark overlay and accent headline line.

## 2. Implemented Changes

Updated:

```text
projects/travelgtc/public/index.html
projects/travelgtc/public/assets/css/site.css
```

Added processed image assets:

```text
projects/travelgtc/public/assets/images/processed/travelgtc-hero-group-sunset.webp
projects/travelgtc/public/assets/images/processed/travelgtc-bay-view.webp
```

Changes:

1. prepared clean WebP assets from Project Owner reference materials;
2. added a full hero background image with dark readability overlays;
3. changed the home headline into three visual lines with a turquoise accent line;
4. reshaped the lower hero curve and benefits strip to better match the reference;
5. added a real travel image to the first content block;
6. kept registration, lead forms, API calls and legal links unchanged;
7. fixed a mobile heading regression by scoping the larger mobile H1 size only to the home hero.

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
curl -I -fsS https://travelgtc.com/assets/images/processed/travelgtc-hero-group-sunset.webp
```

Result:

```text
17 passed
Hero WebP asset is served with HTTP 200 and content-type image/webp.
```

Screenshots reviewed:

```text
projects/travelgtc/test-artifacts/screenshots/travelgtc-home-desktop.png
projects/travelgtc/test-artifacts/screenshots/travelgtc-home-mobile.png
```

Confirmed:

1. hero image is visible;
2. no horizontal overflow on mobile routes;
3. rejected old generated image set was not restored.

## 4. Publication

The updated static site was published through the existing deployment script:

```bash
projects/travelgtc/scripts/deploy_public_live.sh
```

Live root:

```text
/var/www/travelgtc.com
```
