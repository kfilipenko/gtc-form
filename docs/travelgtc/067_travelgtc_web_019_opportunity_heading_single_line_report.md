# TRAVELGTC-WEB-019 - Opportunity Heading Single-Line Alignment Report

- Project: TravelGTC
- Code: TRAVELGTC-WEB-019
- Date: 2026-07-10
- Status: Implemented

## 1. Summary

The home opportunity gallery heading now stays in one line on desktop and tablet viewports.

On narrow mobile screens the heading is allowed to wrap normally so the page remains responsive and avoids horizontal scrolling.

## 2. Implemented Changes

Updated `projects/travelgtc/public/assets/css/site.css`:

1. expanded `.opportunities-head` to full section width instead of the default section heading max width;
2. set `.opportunities-head h2` to `white-space: nowrap`;
3. added a tablet-specific heading size;
4. restored `white-space: normal` in the mobile media rule.

Updated `tests/travelgtc-responsive.spec.ts`:

1. added a desktop/tablet check for `white-space: nowrap`;
2. added a height check to ensure the heading occupies no more than one text line.

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

1. desktop heading is one line;
2. tablet heading is one line;
3. mobile layout remains without horizontal overflow.

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
