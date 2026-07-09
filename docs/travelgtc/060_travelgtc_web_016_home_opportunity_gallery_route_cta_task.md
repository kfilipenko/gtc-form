# TRAVELGTC-WEB-016 - Home Opportunity Gallery And Route CTA Task

- Project: TravelGTC
- Code: TRAVELGTC-WEB-016
- Date: 2026-07-09
- Status: Implemented

## 1. Context

The Project Owner reviewed the home page after removal of the process-declaration block and clarified that the home page still needs a strong visual section that attracts attention and shows new travel opportunities.

The block must not explain the page purpose. It must create desire and move the visitor toward a concrete travel idea.

Reference direction:

1. a compact photo gallery under the hero/benefits area;
2. the headline `Путешествия - это больше, чем отдых`;
3. short visual calls to action for travel, events, recovery, community and remote work;
4. a `Создавайте свои маршруты` block that moves the visitor toward the lead form.

## 2. Requirement

The home page must contain an image-led opportunity section that performs the interest stage of the funnel:

1. show attractive travel scenarios;
2. connect travel with community and business possibility without aggressive selling;
3. keep the layout compact and close to the approved visual reference;
4. lead the visitor to `Создать travel-идею`;
5. preserve the registration-first lead form behavior.

## 3. Scope

In scope:

1. replace the old text-heavy `Путешествия - это больше, чем отдых` block with a five-image gallery;
2. use distinct approved processed images already stored in the project;
3. add a compact `Создавайте свои маршруты` route CTA block;
4. update responsive CSS for desktop, tablet and mobile;
5. update Playwright checks to assert the gallery and route CTA are present;
6. publish and verify the live site.

Out of scope:

1. adding new routes;
2. changing the authentication or API contract;
3. changing the CRM schema;
4. reintroducing the removed page-process/menu infographic block.

## 4. Acceptance Criteria

The task is complete when:

1. the home page has a visible five-card travel opportunity gallery;
2. the gallery uses five distinct images and short calls to action;
3. the route CTA block contains `Создавайте свои маршруты` and links to the lead form;
4. the old `.menu-infographic` block remains absent;
5. responsive and funnel tests pass locally and on the live domain.
