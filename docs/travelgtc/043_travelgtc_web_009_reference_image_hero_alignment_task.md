# TRAVELGTC-WEB-009 - Reference Image Hero Alignment Task

- Project: TravelGTC
- Code: TRAVELGTC-WEB-009
- Date: 2026-07-09
- Status: Implemented

## 1. Context

After TRAVELGTC-WEB-008, the home page had the upper infographic navigation, but the first screen still did not match the approved visual reference closely enough because it used only CSS gradients and no actual travel image.

Reference file:

```text
projects/travelgtc/public/assets/images/inbox/foto/a_high_resolution_clean_modern_website_mockup.png
```

Project Owner feedback:

1. the page lacks a picture;
2. the current design has insufficient similarity with the initial reference design.

## 2. Objective

Restore the visual direction of the reference without reusing rejected generated WebP files.

The home page must use approved/processed image assets and a hero composition closer to the reference:

1. large travel image background;
2. dark overlay for readable text;
3. accent headline line;
4. benefits strip over the lower hero area;
5. real image in the first content section.

## 3. Scope

In scope:

1. prepare clean WebP assets from the reference materials placed by the Project Owner;
2. store production-ready assets in `projects/travelgtc/public/assets/images/processed/`;
3. update the home hero composition;
4. update the first content section with a real travel image;
5. keep the public routes and CRM/auth behavior unchanged;
6. verify desktop, tablet and mobile responsiveness.

Out of scope:

1. changing backend/API/database behavior;
2. changing registration or lead form logic;
3. using rejected image files that were previously removed;
4. adding a full new page structure.

## 4. Acceptance Criteria

The task is complete when:

1. the live home page includes a visible travel image in the hero;
2. the page uses production assets from `processed/`;
3. the hero composition is closer to the supplied mockup;
4. all responsive tests pass locally and on the live domain;
5. the changes are documented, deployed and committed.
