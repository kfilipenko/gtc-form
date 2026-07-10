# TRAVELGTC-WEB-023 - Favicon Publication Task

- Project: TravelGTC
- Code: TRAVELGTC-WEB-023
- Date: 2026-07-10
- Status: Implemented

## 1. Context

The Project Owner provided the favicon source:

```text
projects/travelgtc/public/assets/images/inbox/foto/Favicon TravelGTC.png
```

The site did not yet publish browser/device favicon assets.

## 2. Requirement

TravelGTC must publish a favicon package suitable for common browsers and devices:

1. legacy/browser `favicon.ico`;
2. PNG favicons for 16x16 and 32x32 tabs;
3. Apple touch icon for iOS home-screen usage;
4. Android Chrome icons for install/manifest usage;
5. `site.webmanifest`;
6. HTML `<head>` links on all public pages;
7. `theme-color` metadata.

## 3. Scope

In scope:

1. crop the provided square source for small-icon readability;
2. generate public root favicon files;
3. add favicon and manifest links to all public pages;
4. add responsive tests for favicon links and asset availability;
5. publish and verify on the live domain.

Out of scope:

1. changing the header logo;
2. changing page content, CRM/API or lead forms.

## 4. Acceptance Criteria

The task is complete when:

1. all favicon files are available from the public root;
2. all public HTML pages reference the favicon package;
3. Playwright verifies favicon asset availability and manifest icon entries;
4. local and live checks pass.
