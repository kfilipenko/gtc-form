# TRAVELGTC-WEB-012 - Design System Baseline Alignment Report

- Project: TravelGTC
- Code: TRAVELGTC-WEB-012
- Date: 2026-07-09
- Status: Implemented

## 1. Summary

The Project Owner design-system draft was saved into the canonical TravelGTC documentation and used as the baseline for the public-site design correction.

Canonical design-system document:

```text
docs/travelgtc/049_travelgtc_design_system.md
```

Project Owner source draft retained for traceability:

```text
projects/travelgtc/docs/travelgtc/011_travelgtc_design_system.md
```

The canonical document uses number `049` because number `011` was already occupied by an earlier registered TravelGTC task.

## 2. Implemented Design Alignment

Updated the public design baseline:

1. changed the active color tokens to the fixed design-system palette;
2. made Manrope the primary public-site font and loaded its regular/semibold weights;
3. widened the public content container to the approved 1280px baseline;
4. increased hero headline scale and corrected the second/third line accents;
5. made the home hero photo more visible through a lighter right-side overlay;
6. aligned buttons, cards, image panels, form cards and menu nodes to the 14px/18px radius system;
7. reduced section and footer looseness for a denser premium travel-club composition;
8. corrected mobile page-hero heading behavior and long-word wrapping;
9. fixed consent-label rendering so checkbox text and links flow normally.

## 3. Navigation And Funnel Changes

Updated public HTML:

1. header brand is now `TravelGTC` with `Travel Network Lab` subtitle;
2. `О проекте` is present in public, auth and legal header menus;
3. legal pages no longer show the old header brand text;
4. home path summary now shows:
   `Интерес -> Роль -> Заявка -> Консультация -> Членство -> Участие -> Рекомендации`;
5. home form heading now uses:
   `Выберите, как вам интересно участвовать в TravelGTC`;
6. home process block now uses:
   `Как вы становитесь частью сообщества`.

## 4. Code And Documentation Changes

Updated:

```text
docs/travelgtc/00_documentation_register.md
docs/travelgtc/05_project_memory_handoff.md
docs/travelgtc/049_travelgtc_design_system.md
docs/travelgtc/050_travelgtc_web_012_design_system_baseline_alignment_task.md
docs/travelgtc/051_travelgtc_web_012_design_system_baseline_alignment_report.md
projects/travelgtc/docs/travelgtc/011_travelgtc_design_system.md
projects/travelgtc/public/assets/css/site.css
projects/travelgtc/public/index.html
projects/travelgtc/public/*/index.html
projects/travelgtc/public/legal/*/index.html
```

## 5. Verification

Local verification:

```bash
node --check projects/travelgtc/public/assets/js/site.js
npm run test:travelgtc
```

Result:

```text
17 passed
```

Visual review:

```text
projects/travelgtc/test-artifacts/screenshots/travelgtc-home-desktop.png
projects/travelgtc/test-artifacts/screenshots/travelgtc-home-mobile.png
```

Reviewed focus:

1. hero image visibility;
2. hero headline scale and accent colors;
3. upper infographic navigation;
4. form title and checkbox consent text;
5. seven-step funnel section;
6. compact footer;
7. mobile no-horizontal-overflow behavior.

Live verification:

```bash
TRAVELGTC_BASE_URL=https://travelgtc.com npm run test:travelgtc
curl -fsS https://travelgtc.com/ | rg -n 'TravelGTC|Выберите, как вам интересно участвовать|Как вы становитесь частью сообщества|Рекомендации|О проекте'
curl -fsS https://travelgtc.com/assets/css/site.css | rg -n '#061a28|#00c7d9|--radius: 18px|grid-template-columns: repeat\(7|page-hero h1'
```

Result:

```text
17 passed
Live HTML contains the updated brand, about link, form heading, process heading and recommendations step.
Live CSS contains the fixed design-system tokens, radius, seven-step process grid and mobile page-hero rule.
```

## 6. Publication

Published through:

```bash
projects/travelgtc/scripts/deploy_public_live.sh
```

Live root:

```text
/var/www/travelgtc.com
```
