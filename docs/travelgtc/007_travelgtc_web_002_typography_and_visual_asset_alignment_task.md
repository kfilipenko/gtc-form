# TRAVELGTC-WEB-002 - Typography And Visual Asset Alignment

- Project: TravelGTC
- Owner: Project Owner
- Source instruction: Project Owner requested font-size adjustment and replacement of mockup images with real generated images
- Document type: Task
- Version: 0.1
- Date: 2026-07-08
- Status: Implemented

## 1. Purpose

Adjust the Travel Network Lab prototype so the public page uses the uploaded mockups only as design references, not as visible website content.

The site should keep the clean modern travel-club feeling from the references while using balanced type sizes and image slots for future generated production assets.

## 2. Current Context

The first public prototype was implemented and published with optimized WebP versions of the visual mockups in visible page areas.

The Project Owner clarified:

1. the mockups must guide the design only;
2. actual public page images must be different images;
3. typography must better match the visual proportions of the reference mockups;
4. image generation prompts are required.

## 3. Scope

This task includes:

1. reduce oversized heading and section typography;
2. adjust hero height, section spacing, cards and quote scale;
3. remove visible mockup images from public pages;
4. replace mockup image content with temporary visual slots;
5. remove optimized mockup WebP files from public processed assets;
6. create image-generation prompts for production assets;
7. update TravelGTC documentation and deploy the updated static site.

## 4. Out Of Scope

This task does not include:

1. generating final production images;
2. selecting final image files;
3. backend form changes;
4. legal/privacy page implementation;
5. broad redesign of content structure.

## 5. Source Standards

Relevant standards:

1. `docs/gtc_project_delivery_standard/05_task_definition_and_fixation_standard.md`;
2. `docs/gtc_project_delivery_standard/08_frontend_navigation_and_page_publication_standard.md`;
3. `docs/gtc_project_delivery_standard/09_testing_deploy_and_release_standard.md`.

## 6. Requirements

1. Public pages must not display the uploaded mockup images as product images.
2. Mockups remain reference materials in `inbox/foto/`.
3. Public `processed/` images should contain only approved production images.
4. Typography must be calmer and closer to the reference proportions.
5. Prompts must request photorealistic travel visuals without text, logos or UI mockups.

## 7. Acceptance Criteria

The task is complete when:

1. no public HTML references the mockup WebP files;
2. mockup WebP files are removed from `processed/`;
3. typography CSS is adjusted;
4. image-generation prompt document exists;
5. deploy and smoke checks pass;
6. repository changes are committed.

## 8. Verification Plan

```bash
rg -n "travel-network-lab-.*reference|a_tall_clean|a_high_resolution" projects/travelgtc/public
node --check projects/travelgtc/public/assets/js/site.js
projects/travelgtc/scripts/deploy_public_live.sh
curl --resolve travelgtc.com:443:20.91.187.79 https://travelgtc.com/
git diff --check
```

## 9. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-08 | GTC IT / AI Assistant | Initial task |
