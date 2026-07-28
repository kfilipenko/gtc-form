# TRAVELGTC-WEB-038 - Mira-First Funnel Report

- Project: TravelGTC
- Code: TRAVELGTC-WEB-038
- Date: 2026-07-28
- Status: Implemented and published
- Scope: home short request form, `/mira/` first-question selector, tests, documentation

## 1. Decision

The old home short request form is no longer the primary conversion mechanism.

The first conversion step is now a dialogue with Mira:

```text
visitor -> first question -> auth gate -> Mira chat -> CRM/AI history -> next step
```

This removes the duplicate form/chat split and keeps user intent inside the conversation history.

## 2. Implementation

Home page:

1. removed the `#lead-form` short request section;
2. removed the `Оставить заявку` CTA;
3. changed the AI section secondary CTA to `/mira/`;
4. renamed the process step from `Заявка` to `Диалог с Мирой`.

Mira page:

1. changed the banner wording to `Спросите / Вашего Агента / Мира:`;
2. removed the old `Перейти к заявке` link;
3. replaced the three starter buttons with a first-question select inside the scrollable chat message flow;
4. moved the old short-form interest options into full first-question prompts;
5. hid the first-question selector after the first question so the dialogue continues without a fixed duplicate selector;
6. kept auth-gated chat behavior: selected question is saved before registration/login and resumed after return.

## 3. First Questions

The first-question selector covers:

1. `Стать участником Travel Advantage`;
2. `Узнать о членстве Travel Advantage`;
3. `Понять MWR Life`;
4. `Роль Lifestyle Ambassador`;
5. `Партнёрская модель`;
6. `События и презентации`;
7. `Получить презентацию`.

## 4. Verification

Passed:

```text
npm run test:travelgtc
git diff --check
```

The Playwright suite now verifies that the home page no longer publishes `#lead-form`, that `/mira/` has the first-question selector in the message flow, that the selector hides after the first question, and that selected questions pass through the auth gate as pending chat questions.
