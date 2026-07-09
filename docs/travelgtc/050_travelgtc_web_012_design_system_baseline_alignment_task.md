# TRAVELGTC-WEB-012 - Design System Baseline Alignment Task

- Project: TravelGTC
- Code: TRAVELGTC-WEB-012
- Date: 2026-07-09
- Status: Implemented

## 1. Context

The Project Owner prepared a dedicated TravelGTC website design-system document and requested that the current public design be corrected against it.

The prepared source file was provided at:

```text
projects/travelgtc/docs/travelgtc/011_travelgtc_design_system.md
```

Because document number `011` is already used in the canonical TravelGTC documentation register, the design system must be saved as:

```text
docs/travelgtc/049_travelgtc_design_system.md
```

## 2. Objective

Fix the design-system document in the canonical project documentation and align the public website baseline with the approved visual direction.

The design must feel like:

```text
premium travel club + digital network + lifestyle community
```

## 3. Scope

In scope:

1. save the design system in canonical project documentation;
2. update the documentation register and memory handoff;
3. align public CSS colors, typography, spacing, border radii and shadows;
4. make the home hero image more visible and closer to the approved reference direction;
5. normalize header brand and menu across public, auth and legal pages;
6. add `О проекте` consistently to header navigation;
7. align the home form title with the fixed design-system wording;
8. expand the home process block into the full funnel:
   `Интерес -> Роль -> Заявка -> Консультация -> Членство -> Участие -> Рекомендации`;
9. keep the existing registration gate, API endpoints, legal links and unique page image assignments intact.

Out of scope:

1. redesigning the CRM backend or database;
2. replacing the approved production WebP image set;
3. changing legal policy substance;
4. making final compensation, membership or parent-network claims.

## 4. Acceptance Criteria

The task is complete when:

1. `docs/travelgtc/049_travelgtc_design_system.md` exists and is registered as the active design standard;
2. the public header uses `TravelGTC` with `Travel Network Lab` subtitle;
3. all header menus include `О проекте`;
4. hero, headings, cards, buttons, section density and footer styling follow the design-system baseline;
5. the home lead form uses the required participation wording;
6. the home process block shows the full seven-step funnel;
7. local and live responsive tests pass;
8. changes are deployed and committed.
