# TRAVELGTC-WEB-019 - Opportunity Heading Single-Line Alignment Task

- Project: TravelGTC
- Code: TRAVELGTC-WEB-019
- Date: 2026-07-10
- Status: Implemented

## 1. Context

The Project Owner reviewed the home page and requested that the opportunity gallery heading:

```text
Путешествия - это больше, чем отдых
```

be displayed in one line on wide screens.

## 2. Requirement

The home opportunity heading must:

1. stay on one line on desktop and tablet viewports;
2. remain centered above the gallery;
3. keep the turquoise underline;
4. avoid horizontal overflow;
5. continue to wrap naturally on narrow mobile screens when needed.

## 3. Scope

In scope:

1. home opportunity heading CSS;
2. responsive tablet/mobile heading rules;
3. Playwright assertion for one-line desktop/tablet rendering;
4. local/live verification and publication.

Out of scope:

1. changing the heading text;
2. changing gallery images or cards;
3. changing the lead form or API.

## 4. Acceptance Criteria

The task is complete when:

1. the heading renders as one line on desktop/tablet;
2. mobile has no horizontal overflow;
3. responsive and funnel checks pass locally and on the live domain.
