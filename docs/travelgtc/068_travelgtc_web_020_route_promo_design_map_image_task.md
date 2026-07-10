# TRAVELGTC-WEB-020 - Route Promo Design And Map Image Task

- Project: TravelGTC
- Code: TRAVELGTC-WEB-020
- Date: 2026-07-10
- Status: Implemented

## 1. Context

The Project Owner requested that the home `Создавайте свои маршруты` block better match the approved design reference:

1. use a handwritten-style heading;
2. replace number badges with infographic icons;
3. replace the route image with a photo where people plan a route using a map.

The Project Owner provided the source image:

```text
projects/travelgtc/public/assets/images/inbox/foto/ChatGPT Image 9 июл. 2026 г., 15_56_48 (4).png
```

## 2. Requirement

The home route CTA block must:

1. use a handwritten font for `Создавайте свои маршруты`;
2. show icons instead of numeric badges for route formats;
3. use an optimized WebP image with a route map planning scene;
4. remain responsive on desktop, tablet and mobile;
5. keep the existing lead-form CTA behavior.

## 3. Scope

In scope:

1. optimize the provided image into `processed/`;
2. update the home page route CTA markup;
3. update CSS for handwritten typography and infographic icons;
4. update responsive tests;
5. publish and verify the live site.

Out of scope:

1. changing the lead form fields or API;
2. changing the main gallery above the route CTA;
3. changing inner route pages.

## 4. Acceptance Criteria

The task is complete when:

1. the route title uses a handwritten-style font;
2. route options use five icons and no numeric `data-code` badges;
3. the route image references `travelgtc-route-map-planning-coast.webp`;
4. responsive and funnel checks pass locally and on the live domain.
