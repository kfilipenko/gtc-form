# TRAVELGTC-WEB-004 - Reference Typography Alignment

- Project: TravelGTC
- Owner: Project Owner
- Source instruction: Project Owner requested design comparison with the original `inbox/foto` mockups and correction of heading proportions
- Document type: Task
- Version: 0.1
- Date: 2026-07-09
- Status: Implemented

## 1. Purpose

Bring the Travel Network Lab public site typography and hero proportions closer to the original visual references in:

```text
projects/travelgtc/public/assets/images/inbox/foto/
```

The main issue: the current live site used oversized desktop heading ratios compared with the approved mockups.

## 2. Current Context

The public site already has generated production images and HTTPS publication.

The reference mockups show:

1. a full-width photo hero with text over the image;
2. a hero headline around three compact lines, not a giant full-screen headline;
3. section headings visually around medium landing-page scale;
4. compact card headings and process labels;
5. page blocks with dense but readable spacing.

## 3. Scope

This task includes:

1. compare the current CSS proportions with the original mockup direction;
2. reduce H1, H2, H3, page-hero and quote scales;
3. reduce section spacing and page-hero height;
4. convert the home hero image from a right-side card into a full-width hero background;
5. remove the now-redundant hero visual-card markup;
6. deploy the updated public site and run smoke checks.

## 4. Out Of Scope

This task does not include:

1. generating new images;
2. changing text/content strategy;
3. changing DNS/SSL/nginx configuration;
4. backend form handling.

## 5. Source Standards

Relevant standards:

1. `docs/gtc_project_delivery_standard/05_task_definition_and_fixation_standard.md`;
2. `docs/gtc_project_delivery_standard/08_frontend_navigation_and_page_publication_standard.md`;
3. `docs/gtc_project_delivery_standard/09_testing_deploy_and_release_standard.md`.

## 6. Requirements

1. Hero H1 must be visibly smaller and closer to the reference mockup ratio.
2. Section H2 headings must not dominate compact content blocks.
3. Page hero blocks must be shorter and closer to the reference section density.
4. The home hero must use the generated image as a background, matching the reference direction.
5. Verification and deployment must be recorded.

## 7. Acceptance Criteria

The task is complete when:

1. CSS heading/spacing values are adjusted;
2. home hero no longer renders a separate right-side image card;
3. generated hero image is used as the full hero background;
4. source checks pass;
5. deploy script passes;
6. HTTPS smoke checks pass;
7. repository changes are committed.

## 8. Verification Plan

```bash
node --check projects/travelgtc/public/assets/js/site.js
rg -n "font-size: clamp|hero-inner|page-hero" projects/travelgtc/public/assets/css/site.css
projects/travelgtc/scripts/deploy_public_live.sh
curl --resolve travelgtc.com:443:20.91.187.79 https://travelgtc.com/
git diff --check
```

## 9. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-09 | GTC IT / AI Assistant | Initial task |
