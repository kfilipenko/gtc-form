# TRAVELGTC-WEB-018 - Home Network Copy Cleanup Task

- Project: TravelGTC
- Code: TRAVELGTC-WEB-018
- Date: 2026-07-09
- Status: Implemented

## 1. Context

The Project Owner reviewed the home page after the gallery and deduplication updates and requested additional tightening.

The home page should not explain the network model in the first flow. The network topic will be developed in later sections/pages where the visitor is more prepared for it.

The home page should also avoid service labels that do not add meaning for the visitor.

## 2. Requirement

Remove from the home page:

1. the `Новые возможности` eyebrow above the opportunity gallery;
2. the `Короткий запрос` eyebrow above the home lead form;
3. the form helper text:

```text
Выберите потребность и коротко опишите запрос. Контакты для связи берём из профиля аккаунта.
```

4. the full `Современная сеть` section:

```text
Сеть - это не давление. Сеть - это доверие.
Люди всегда путешествовали по рекомендациям...
Современная сетевая модель делает эту рекомендацию частью понятной системы...
```

The home page must keep:

1. hero;
2. opportunity gallery;
3. route CTA;
4. compact authenticated lead form;
5. final CTA.

## 3. Scope

In scope:

1. home page HTML cleanup;
2. small CSS cleanup for removed labels;
3. responsive test assertions to prevent the removed copy from returning;
4. local/live verification and publication.

Out of scope:

1. changing inner page copy about the network model;
2. changing the form API or authenticated registration behavior;
3. removing global `.section.navy` or `.quote` CSS, because other pages still use them.

## 4. Acceptance Criteria

The task is complete when:

1. the removed labels and network copy are absent from the home page;
2. the home page has no direct `main > section.navy` block;
3. the opportunity gallery, route CTA and lead form still render;
4. responsive and funnel checks pass locally and on the live domain.
