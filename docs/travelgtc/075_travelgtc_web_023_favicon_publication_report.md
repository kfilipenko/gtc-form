# TRAVELGTC-WEB-023 - Favicon Publication Report

- Project: TravelGTC
- Code: TRAVELGTC-WEB-023
- Date: 2026-07-10
- Status: Implemented

## 1. Summary

TravelGTC now publishes a complete favicon package for browser tabs, legacy browser fallback, Apple touch icons and Android/manifest usage.

The icons were generated from the Project Owner source image.

## 2. Implemented Changes

Source image:

```text
projects/travelgtc/public/assets/images/inbox/foto/Favicon TravelGTC.png
```

Published root assets:

```text
projects/travelgtc/public/favicon.ico
projects/travelgtc/public/favicon-16x16.png
projects/travelgtc/public/favicon-32x32.png
projects/travelgtc/public/apple-touch-icon.png
projects/travelgtc/public/android-chrome-192x192.png
projects/travelgtc/public/android-chrome-512x512.png
projects/travelgtc/public/site.webmanifest
```

The source image was cropped around the globe/airplane mark before resizing so the favicon remains readable at 16x16 and 32x32.

Updated all public HTML pages:

1. added `theme-color` metadata;
2. added `favicon.ico` link;
3. added 32x32 and 16x16 PNG icon links;
4. added Apple touch icon link;
5. added web manifest link.

Updated `tests/travelgtc-responsive.spec.ts`:

1. verifies the home page favicon links and theme color;
2. verifies favicon, Apple icon, Android icons and manifest are available;
3. verifies manifest icon entries for 192x192 and 512x512;
4. verifies the manifest is served as `application/manifest+json`.

Updated nginx publication config:

```text
projects/travelgtc/deploy/nginx/travelgtc.com.conf
```

The installed nginx config was also updated and reloaded so `/site.webmanifest` is served as `application/manifest+json` while `X-Content-Type-Options: nosniff` remains enabled.

Updated `projects/travelgtc/public/assets/images/README.md` with the favicon source and generated asset list.

## 3. Verification

Local verification:

```bash
npm run test:travelgtc
npm run test:travelgtc-funnel
```

Result:

```text
TravelGTC responsive: 18 passed.
TravelGTC funnel: 1 passed.
```

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
TravelGTC live responsive: 18 passed.
TravelGTC live funnel: 1 passed.
```

Live MIME check:

```text
https://travelgtc.com/site.webmanifest -> application/manifest+json
https://travelgtc.com/favicon.ico -> image/x-icon
https://travelgtc.com/apple-touch-icon.png -> image/png
```
