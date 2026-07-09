# TRAVELGTC-WEB-006 - Rejected Image Asset Cleanup

- Project: TravelGTC
- Owner: Project Owner
- Source instruction: Project Owner reported that rejected/incorrect image files still appeared in source control after they were supposed to be removed
- Document type: Task
- Version: 0.1
- Date: 2026-07-09
- Status: Implemented

## 1. Purpose

Remove the rejected generated WebP image set from TravelGTC source and public publication.

The cleanup must avoid broken public pages by removing all active references to the rejected files before deployment.

## 2. Scope

This task includes:

1. remove the rejected generated WebP files from `projects/travelgtc/public/assets/images/processed/`;
2. remove public HTML/CSS references to those files;
3. replace route bitmap blocks with temporary CSS visual panels;
4. update image README and project memory;
5. deploy with `rsync --delete` so removed files disappear from `/var/www/travelgtc.com`;
6. run source, browser and live checks.

## 3. Acceptance Criteria

The task is complete when:

1. rejected WebP files are removed from git;
2. public source no longer references removed image filenames;
3. live root no longer contains removed image files after deploy;
4. public routes return HTTP 200;
5. Playwright responsive tests pass;
6. repository changes are committed.

## 4. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-09 | GTC IT / AI Assistant | Initial task |
