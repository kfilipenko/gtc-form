# TRAVELGTC-WEB-001 - First Travel Network Lab Public Prototype

- Project: TravelGTC
- Owner: Project Owner
- Source instruction: Project Owner approved final Travel Network Lab concept and page texts
- Document type: Task
- Version: 0.1
- Date: 2026-07-08
- Status: Implemented

## 1. Purpose

Create the first public static prototype for TravelGTC under the final concept:

```text
Travel Network Lab - travel club / travel network platform
```

The prototype must show the visitor the dream of travel first, then the strength of community, then a calm and legally cautious introduction to the business opportunity.

## 2. Current Context

TravelGTC was initialized as a new project with source files in:

```text
projects/travelgtc/
```

The Project Owner approved the final positioning:

```text
Travel Network Lab: modern travel club where a person can travel, create routes, gather people and develop a partner network.
```

Final visual references are stored in:

```text
projects/travelgtc/public/assets/images/inbox/foto/
```

## 3. Scope

This task includes:

1. create an adaptive public landing page at `/`;
2. create separate public routes for travel lifestyle, club, create trip, business model, events, about and contacts;
3. add a prototype form for creating a travel idea;
4. add contact actions for WhatsApp / MAX placeholder behavior;
5. add common footer disclaimers;
6. optimize approved visual mockups into `processed/` for public use;
7. update TravelGTC documentation, register and memory.

## 4. Out Of Scope

This task does not include:

1. backend form submission or CRM integration;
2. production deployment to `travelgtc.com`;
3. legal policy pages;
4. booking/payment functionality;
5. confirmed official company registration or membership workflow.

## 5. Source Standards

Relevant standards:

1. `docs/gtc_project_delivery_standard/03_project_structure_and_publication_model.md`;
2. `docs/gtc_project_delivery_standard/05_task_definition_and_fixation_standard.md`;
3. `docs/gtc_project_delivery_standard/06_ai_agent_collaboration_standard.md`;
4. `docs/gtc_project_delivery_standard/08_frontend_navigation_and_page_publication_standard.md`;
5. `docs/gtc_project_delivery_standard/09_testing_deploy_and_release_standard.md`.

## 6. Requirements

1. Use the final concept name `Travel Network Lab`.
2. Use the visual palette from the Project Owner brief.
3. Keep the site as a modern travel club with business opportunity, not an aggressive MLM presentation.
4. The main page must contain the three key meanings: travel, community and business opportunity.
5. The primary CTA must be `Создать travel-идею`.
6. Public pages must include readable disclaimers about non-offer status and no guaranteed income.
7. The first implementation must be mobile-friendly and action-first.

## 7. Acceptance Criteria

The task is complete when:

1. `/` and all requested public routes exist under `projects/travelgtc/public/`;
2. navigation links connect the routes;
3. the create-trip form shows a prototype success message;
4. public pages use processed image assets, not raw inbox paths;
5. relevant documentation/registers are updated;
6. verification has been run;
7. generated artifacts are cleaned;
8. repository changes are committed.

## 8. Verification Plan

```bash
node --check projects/travelgtc/public/assets/js/site.js
find projects/travelgtc/public -name '*.html' -print0 | xargs -0 -n1 tidy -qe
git diff --check
```

If `tidy` is unavailable, use route smoke checks through a local static HTTP server.

## 9. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-08 | GTC IT / AI Assistant | Initial task |
