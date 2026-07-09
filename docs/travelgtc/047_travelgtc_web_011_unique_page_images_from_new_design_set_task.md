# TRAVELGTC-WEB-011 - Unique Page Images From New Design Set Task

- Project: TravelGTC
- Code: TRAVELGTC-WEB-011
- Date: 2026-07-09
- Status: Implemented

## 1. Context

The Project Owner added additional design mockups and photo assets for TravelGTC.

New files were placed in:

```text
projects/travelgtc/public/assets/images/inbox/foto/
```

The Project Owner requested:

1. use the new images for the site;
2. do not use the same image on different site pages.

## 2. Objective

Use the new photo set to improve the visual design of the public site while keeping each main page visually distinct.

Design mockups are used as visual references. Real photo assets are optimized and connected to pages.

## 3. Scope

In scope:

1. inspect new design and photo files;
2. create optimized WebP assets in `processed/`;
3. assign unique images to the home page and each main public route;
4. add an image block to `/about/`;
5. preserve current funnel, registration, API and legal behavior;
6. verify responsive behavior and image loading.

Out of scope:

1. changing backend, CRM, database or auth behavior;
2. using page-design mockups as direct page content screenshots;
3. changing legal text or consent logic.

## 4. Acceptance Criteria

The task is complete when:

1. every main public page uses a unique image assignment;
2. the home hero and home content image are not reused on other pages;
3. `/travel-lifestyle/`, `/club/`, `/create-trip/`, `/business-model/`, `/events/`, `/contacts/` and `/about/` each use different images;
4. responsive tests pass locally and on the live domain;
5. changes are documented, deployed and committed.
