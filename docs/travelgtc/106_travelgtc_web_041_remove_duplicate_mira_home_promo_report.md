# TRAVELGTC-WEB-041 - Remove Duplicate Mira Home Promo Report

- Project: TravelGTC
- Code: TRAVELGTC-WEB-041
- Date: 2026-07-28
- Status: Implemented

## 1. Summary

The duplicate home page block `Мира TravelGTC / Задайте первый вопрос до консультации` was removed.

The block repeated information already available through:

- the top navigation `Мира` link;
- the three-step process block;
- the dedicated `/mira/` page.

## 2. Implementation

Removed from `projects/travelgtc/public/index.html`:

- the `ai-section` home promo block;
- the repeated explanation of Mira;
- duplicate buttons `Спросить Миру` and `Выбрать первый вопрос`;
- the sample question/answer preview about TravelGTC and the official site.

## 3. Continuation Rule

Do not reintroduce a separate Mira promo/preview block on the home page.

The primary Mira entry points are:

- top navigation `Мира`;
- process card `Диалог с Мирой`;
- direct route `/mira/`.

The home page should avoid repeated explanatory blocks and keep moving the visitor toward the next action.
