# TRAVELGTC-WEB-035 - Main Navigation Mira Routing Report

- Project: TravelGTC
- Code: TRAVELGTC-WEB-035
- Date: 2026-07-28
- Status: Implemented and published
- Scope: Main navigation, dedicated Mira chat routing, responsive tests

## 1. Problem

The membership-first header had redundant actions:

1. `Travel Advantage` pointed to the beginning of the home page and did not add useful navigation value.
2. AI access was visually duplicated between `Вопрос AI` and the Mira entry/button.
3. `Узнать о членстве` repeated the meaning of the `Членство` menu item.

## 2. Fix

The main membership navigation now keeps one clean route to each main action:

1. removed the `Travel Advantage` hash link;
2. renamed the AI menu item to `Мира`;
3. routed `Мира` to `/mira/`;
4. removed the duplicate top `Узнать о членстве` CTA;
5. removed the old embedded floating AI widget from the home page because the chat now has a dedicated public route.

## 3. Verification

Passed:

```text
npm run test:travelgtc
git diff --check
```

The Playwright suite now checks that the home header has no `Travel Advantage` hash link, no duplicate top membership CTA and one `Мира` link to the dedicated chat page.
