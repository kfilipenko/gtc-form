# TRAVELGTC-WEB-021 - Header Logo Branding Report

- Project: TravelGTC
- Code: TRAVELGTC-WEB-021
- Date: 2026-07-10
- Status: Implemented

## 1. Summary

The public header brand was replaced with the Project Owner provided TravelGTC logo.

The separate text subtitle `Travel Network Lab` was removed from the upper header brand because it is now part of the logo itself.

## 2. Implemented Changes

Prepared image asset:

```text
projects/travelgtc/public/assets/images/processed/travelgtc-logo-header.webp
```

Source image:

```text
projects/travelgtc/public/assets/images/inbox/foto/Logo TravelGTC.png
```

Updated public HTML pages:

1. replaced `<strong>TravelGTC</strong><span>Travel Network Lab</span>` in public headers with a logo image;
2. kept footer text branding unchanged;
3. preserved navigation, auth actions and mobile menu controls.

Updated `projects/travelgtc/public/assets/css/site.css`:

1. added `.brand-logo` sizing for the header;
2. set a compact desktop logo width;
3. set a smaller mobile logo width to avoid horizontal overflow.

Updated `tests/travelgtc-responsive.spec.ts`:

1. asserted that the header logo points to `travelgtc-logo-header.webp`;
2. asserted that the old header subtitle span is absent;
3. kept mobile viewport overflow checks for all public routes.

Updated `projects/travelgtc/public/assets/images/README.md`:

1. documented the new processed logo asset;
2. recorded the source PNG from `inbox/foto/`.

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

1. the logo is visible in the header;
2. the separate header subtitle is removed;
3. the header remains compact on desktop and mobile;
4. the mobile menu still opens without horizontal overflow.

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
