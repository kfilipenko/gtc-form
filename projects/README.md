# Projects Split Workspace

This folder contains non-destructive split contours for RJAKA and GTSTOR.

## Contours
- `projects/rjaka` — game chat domain (`anon_*` data model)
- `projects/gtstor` — platform chat domain (`chat*` data model)
- `projects/shared` — shared operational templates/scripts for split rollout

## Current mode
- Compatibility mode (wrappers + redirects), production paths remain unchanged.
- Safe for iterative migration and cutover rehearsals.

## Quick start
1. `cd /var/www/gtc-form`
2. `bash projects/shared/scripts/bootstrap_split_projects.sh`
3. Review bootstrap output and resolve any missing paths before moving to hard extraction.

## Hard extraction prep
1. `cd /var/www/gtc-form`
2. `bash scripts/hard_extraction_dry_run.sh`
3. Follow [docs/hard-extraction-checklist-20260305.md](docs/hard-extraction-checklist-20260305.md)

## Notes
- Do not run destructive file moves from this folder directly.
- Use main cutover flow from docs (`docs/cutover-checklist.md`) for production operations.
