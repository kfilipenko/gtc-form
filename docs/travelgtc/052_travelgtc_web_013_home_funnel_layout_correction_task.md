# TRAVELGTC-WEB-013 - Home Funnel Layout Correction Task

- Project: TravelGTC
- Code: TRAVELGTC-WEB-013
- Date: 2026-07-09
- Status: Implemented

## 1. Context

The Project Owner reviewed the live TravelGTC home page and identified that the page still behaved like a set of repeated content sections.

Specific issues:

1. the participation funnel was published twice;
2. the home page did not clearly perform one business-process task;
3. the hero headline occupied too much of the first viewport;
4. the page had too much empty space and inefficient composition;
5. the menu infographic was not explicitly tied to the funnel/business process.

## 2. Home Page Business Task

The home page is the entry point into the TravelGTC business process.

Its task is:

```text
visitor -> interest -> role -> authenticated lead form -> CRM lead -> consultation
```

The full later process remains:

```text
Interest -> Role -> Application -> Consultation -> Membership -> Participation -> Recommendations
```

However, the home page must not repeat this process in multiple visible blocks. It should introduce the process once and then move the visitor toward choosing a role and submitting the form.

## 3. Scope

In scope:

1. remove the duplicated lower funnel block from the home page;
2. replace the decorative funnel repetition with one compact business-process card in the hero;
3. reduce hero height, H1 scale and vertical spacing;
4. relabel the infographic navigation so each page maps to a process role;
5. remove obsolete `path-summary` markup and styles;
6. preserve registration gate, form API behavior, legal links and all existing routes;
7. verify responsive layout and live publication.

Out of scope:

1. changing CRM/database/API behavior;
2. changing page content for all internal routes;
3. changing image assets;
4. changing official legal or partner-model statements.

## 4. Acceptance Criteria

The task is complete when:

1. the home page shows the full participation process only once;
2. hero headline no longer dominates the entire first viewport on desktop;
3. navigation infographic explains the page-to-process mapping;
4. the form remains the primary conversion point;
5. local and live responsive tests pass;
6. changes are documented, deployed and committed.
