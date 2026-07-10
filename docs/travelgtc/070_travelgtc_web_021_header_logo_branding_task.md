# TRAVELGTC-WEB-021 - Header Logo Branding Task

- Project: TravelGTC
- Code: TRAVELGTC-WEB-021
- Date: 2026-07-10
- Status: Implemented

## 1. Context

The Project Owner provided the final TravelGTC logo source:

```text
projects/travelgtc/public/assets/images/inbox/foto/Logo TravelGTC.png
```

The public header previously used a text brand:

```text
TravelGTC
Travel Network Lab
```

Because the logo already contains both the TravelGTC name and the Travel Network Lab subtitle, the visible text subtitle in the top header should be removed.

## 2. Requirement

The public website header must:

1. use the provided TravelGTC logo;
2. use an optimized public WebP asset from `processed/`;
3. remove the separate `Travel Network Lab` text line from the upper header brand;
4. keep the existing navigation, auth controls and mobile menu behavior;
5. remain responsive on desktop, tablet and mobile.

## 3. Scope

In scope:

1. prepare a compact header logo asset;
2. replace the header brand markup across public pages;
3. adjust CSS for desktop and mobile logo sizing;
4. update responsive tests to verify the logo and removed subtitle.

Out of scope:

1. changing footer branding;
2. changing page titles, legal copy or content references to Travel Network Lab;
3. changing the navigation structure.

## 4. Acceptance Criteria

The task is complete when:

1. every public header uses `travelgtc-logo-header.webp`;
2. the top header brand no longer contains a separate `Travel Network Lab` span;
3. desktop, tablet and mobile responsive tests pass;
4. the live site is published and verified.
