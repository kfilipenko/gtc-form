# TRAVELGTC-WEB-003 - Generated Production Visual Assets

- Project: TravelGTC
- Owner: Project Owner
- Source instruction: Project Owner asked whether the agent can generate the required files after the previous image set was rejected
- Document type: Task
- Version: 0.1
- Date: 2026-07-09
- Status: Implemented

## 1. Purpose

Generate and publish a new set of production images for the Travel Network Lab website.

The generated files must be real public website assets, not uploaded mockup references.

## 2. Current Context

The previous generated image fixation was reverted:

```text
046713d Revert "Align TravelGTC typography and image prompts"
```

The public site still needed real images for:

1. main hero;
2. travel lifestyle page;
3. club/community page;
4. create-trip page;
5. events page;
6. business-model page;
7. contacts page.

## 3. Scope

This task includes:

1. generate seven photorealistic travel-club images;
2. optimize generated PNG outputs into WebP;
3. save approved web assets into `projects/travelgtc/public/assets/images/processed/`;
4. remove public use of mockup-reference WebP assets;
5. connect generated assets to public routes;
6. update image documentation and project memory;
7. deploy and smoke-test the updated public site.

## 4. Out Of Scope

This task does not include:

1. editing Timeweb DNS;
2. changing SSL/nginx configuration;
3. backend form handling;
4. legal/privacy page creation;
5. using the uploaded mockup images as visible site content.

## 5. Source Standards

Relevant standards:

1. `docs/gtc_project_delivery_standard/05_task_definition_and_fixation_standard.md`;
2. `docs/gtc_project_delivery_standard/08_frontend_navigation_and_page_publication_standard.md`;
3. `docs/gtc_project_delivery_standard/09_testing_deploy_and_release_standard.md`.

## 6. Requirements

1. Images must be photorealistic, travel/community oriented and calm.
2. Images must not contain text, logos, watermarks or UI mockups.
3. Images must be optimized before public use.
4. Public pages must reference `processed/` assets only.
5. Generated source images may remain in Codex generated image storage; project uses optimized copies.

## 7. Acceptance Criteria

The task is complete when:

1. seven WebP files exist in `processed/`;
2. public HTML pages reference the generated WebP assets;
3. old mockup WebP assets are not referenced by public HTML;
4. deploy script passes;
5. HTTPS smoke checks pass;
6. repository changes are committed.

## 8. Verification Plan

```bash
identify projects/travelgtc/public/assets/images/processed/*.webp
rg -n "travel-network-lab-.*reference|a_tall_clean|a_high_resolution" projects/travelgtc/public
node --check projects/travelgtc/public/assets/js/site.js
projects/travelgtc/scripts/deploy_public_live.sh
curl --resolve travelgtc.com:443:20.91.187.79 https://travelgtc.com/
git diff --check
```

## 9. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-09 | GTC IT / AI Assistant | Initial task |
