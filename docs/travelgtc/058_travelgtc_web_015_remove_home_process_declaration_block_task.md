# TRAVELGTC-WEB-015 - Remove Home Process Declaration Block Task

- Project: TravelGTC
- Code: TRAVELGTC-WEB-015
- Date: 2026-07-09
- Status: Implemented

## 1. Context

The Project Owner reviewed the home page and identified that the `Страницы и процесс` block still declared the page's purpose instead of letting the page perform its business function.

The removed block included:

```text
Каждый раздел ведёт к следующему действию
Главная собирает интерес...
```

This repeated the site menu inside the page and weakened the action-first funnel.

## 2. Requirement

The home page must not explain its own purpose as a visible content block.

The page should perform the funnel task through:

1. hero promise and CTA;
2. short benefits;
3. content that builds travel/community/business interest;
4. authenticated request form;
5. consultation CTA.

Navigation/process hints may live in the header menu, but not as a repeated standalone section on the home page.

## 3. Scope

In scope:

1. remove the `site-map-section` / `menu-infographic` block from the home page;
2. remove obsolete CSS for that repeated page menu;
3. add compact process markers to the top navigation;
4. update responsive tests so they fail if the old menu-infographic block returns;
5. keep the authenticated lead form and all public routes working.

Out of scope:

1. changing the full business-process documentation;
2. changing page routes;
3. redesigning every inner page hero.

## 4. Acceptance Criteria

The task is complete when:

1. the home page has no `Страницы и процесс` block;
2. `.menu-infographic` is absent from the home page;
3. top navigation carries compact process cues;
4. responsive and funnel checks pass;
5. live site is deployed and verified.
