# TRAVELGTC-WEB-017 - Home And Header Deduplication Task

- Project: TravelGTC
- Code: TRAVELGTC-WEB-017
- Date: 2026-07-09
- Status: Implemented

## 1. Context

The Project Owner reviewed the published TravelGTC pages and identified two duplicated UI elements:

1. the header button `Связаться со мной` duplicated the `Контакты` navigation page;
2. the home page four-card benefits band duplicated ideas already presented by the visual opportunity gallery and route CTA.

The home page should stay compact and should move the visitor from the hero directly into the image-led travel opportunity block.

## 2. Requirement

Remove the duplicated elements:

1. remove the `Связаться со мной` CTA button from all public headers;
2. keep the `Контакты` navigation item as the single contact route;
3. change the contacts page hero title from `Свяжитесь со мной` to `Контакты`;
4. remove the home benefits band with the four cards:
   - `Путешествия`;
   - `Сообщество`;
   - `Свои маршруты`;
   - `Бизнес-модель`;
5. keep the visual opportunity gallery and route CTA as the primary post-hero interest block.

## 3. Scope

In scope:

1. public HTML headers;
2. home page HTML;
3. public CSS cleanup;
4. responsive test update;
5. TravelGTC design-system note update;
6. local/live verification and publication.

Out of scope:

1. removing the `/contacts/` route;
2. changing auth, API or CRM behavior;
3. changing the page-to-process roadmap.

## 4. Acceptance Criteria

The task is complete when:

1. no public header contains `Связаться со мной`;
2. no public header contains `.nav-contact`;
3. the home page has no `.benefit-strip` block;
4. the home opportunity gallery remains visible;
5. responsive and funnel checks pass locally and on the live domain.
