# Split implementation manifest

## Completed
- Created base structure:
  - `projects/rjaka/{web,api/admin,assets,db/migrations,docs}`
  - `projects/gtstor/{web,api,auth,docs,db/migrations}`
  - `projects/shared/{nginx,scripts,docs}`
- Added RJAKA contour wrappers and DB migration mirrors.
- Added GTSTOR contour wrappers for pages and APIs.
- Added split bootstrap artifacts:
  - `projects/README.md`
  - `projects/rjaka/.env.example`
  - `projects/gtstor/.env.example`
  - `projects/shared/scripts/bootstrap_split_projects.sh`
  - `projects/shared/nginx/rjaka-compat.conf`
  - `projects/shared/nginx/gtstor-compat.conf`

## Current strategy
- Native-copy phase completed for core web/api files in `projects/rjaka` and `projects/gtstor`.
- Production root paths remain active until route switch; projects contours now hold native file content.

## Next step
- Keep copied native contours in sync with root paths until route switch freeze.
- Move favicon/assets and long-form docs per ownership matrix.
- Integrate nginx compat templates into host config during staged cutover.
- Run hard extraction dry-run script before controlled copy:
  - `scripts/hard_extraction_dry_run.sh`
  - `docs/hard-extraction-checklist-20260305.md`

## Execution evidence
- `docs/runtime/hard-extraction-apply-20260305-155122Z.md`
- `docs/runtime/hard-extraction-dry-run-20260305-155122Z.md`
