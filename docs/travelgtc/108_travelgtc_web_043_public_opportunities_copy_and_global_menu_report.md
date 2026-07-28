# TRAVELGTC-WEB-043 - Public Opportunities Copy And Global Menu Report

- Project: TravelGTC
- Code: TRAVELGTC-WEB-043
- Date: 2026-07-28
- Status: Implemented

## 1. Objective

Correct the public `Возможности` page and global navigation after the first needs-based accordion release.

Project Owner observations:

1. the phrase `Как Мира ведёт разговор` reveals internal conversation logic and is useful for Mira, not for the visitor;
2. internal public pages still used the older broad project menu with `Путешествия`, `Клуб`, `Создать маршрут`, `Бизнес-модель`, `О проекте`;
3. the site should behave as one membership-first funnel instead of a multi-page travel portal.

## 2. Implemented Changes

Removed all public accordion paragraphs that started with:

```text
Как Мира ведёт разговор
```

The scenario logic remains in Mira knowledge and instruction documents, where it belongs.

All public page headers were aligned to the membership-first menu:

1. `Главная`;
2. `MWR Life`;
3. `Членство`;
4. `Ambassador`;
5. `Возможности`;
6. `Мира`.

The stable historical routes remain available, but they are no longer promoted as the main navigation structure.

## 3. Product Rule

Public pages should show user value, not internal sales-agent mechanics.

Mira may use internal scenario-routing logic, but public text should be written from the visitor's point of view:

1. what this scenario is;
2. who it is useful for;
3. what practical next step the visitor can take.

