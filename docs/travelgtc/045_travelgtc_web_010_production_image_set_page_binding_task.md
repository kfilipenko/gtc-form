# TRAVELGTC-WEB-010 - Production Image Set Page Binding Task

- Project: TravelGTC
- Code: TRAVELGTC-WEB-010
- Date: 2026-07-09
- Status: Implemented

## 1. Context

The Project Owner added a new set of images for TravelGTC design work.

New files were placed in:

```text
projects/travelgtc/public/assets/images/inbox/
```

The earlier generated image set had been removed, but the new files are visually closer to the intended premium travel-club direction.

## 2. Objective

Prepare the new images as production WebP assets and bind them to the public TravelGTC pages so that the website no longer relies on abstract CSS placeholders for the main visual blocks.

## 3. Scope

In scope:

1. inspect the new images;
2. optimize them into WebP files under `processed/`;
3. use the strongest group image as the home hero background;
4. replace route-level visual placeholders with real page-specific images;
5. preserve all existing text, registration, lead forms, API behavior and legal links;
6. verify responsive behavior locally and on the live domain.

Out of scope:

1. changing backend, CRM or authentication logic;
2. changing DNS/nginx/API runtime;
3. rewriting page content or funnel business logic.

## 4. Acceptance Criteria

The task is complete when:

1. the processed image set contains the new optimized WebP assets;
2. the home page uses the new premium travel-club image in the hero;
3. travel lifestyle, club, create-trip, business-model, events and contacts pages show relevant real images;
4. responsive tests pass;
5. changes are documented, deployed and committed.
