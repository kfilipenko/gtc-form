# TRAVELGTC-WEB-008 - Upper Infographic Navigation Design Task

- Project: TravelGTC
- Code: TRAVELGTC-WEB-008
- Date: 2026-07-09
- Status: Implemented

## 1. Context

The Project Owner requested a parallel visual design adjustment for the public landing page.

The target reference is:

```text
projects/travelgtc/public/assets/images/inbox/foto/a_high_resolution_clean_modern_website_mockup.png
```

The reference shows the site structure as a visible upper-page infographic, not as a secondary footer-like sitemap.

Current approved asset rule:

1. the mockups in `inbox/foto/` are visual references;
2. there are no approved production bitmap assets in `processed/`;
3. rejected generated images must not be restored or reused.

## 2. Objective

Move and restyle the home-page infographic menu so that it supports the first user journey:

```text
interest -> role -> application -> consultation
```

The block must appear near the top of the home page, after the hero and the short benefits band.

## 3. Scope

In scope:

1. move the existing infographic navigation from the lower home page to the upper home page;
2. retitle it as the site structure;
3. keep links to the active public routes;
4. style it closer to the reference mockup with circular icons, a route line and compact flow markers;
5. keep mobile and tablet responsiveness;
6. verify with Playwright responsive tests and screenshots.

Out of scope:

1. adding new production bitmap images;
2. changing API, authentication, database or CRM behavior;
3. changing legal pages;
4. reintroducing rejected generated images.

## 4. Acceptance Criteria

The task is complete when:

1. the home page shows the infographic menu in the upper part of the page;
2. the lower duplicate sitemap block is removed;
3. desktop, tablet and mobile layouts have no horizontal overflow;
4. the public route responsive test suite passes;
5. the changes are documented, deployed and committed.
