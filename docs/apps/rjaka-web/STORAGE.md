# STORAGE: rjaka-web

## Active Storage
- Shared code root: /var/www/gtc-form
- Primary asset path: /var/www/gtc-form/assets/
- Route compatibility include: /var/www/gtc-form/projects/shared/nginx/rjaka-compat.conf

## Backup Policy
- Backups go to /var/www/backups/rjaka-web/<timestamp>_<reason>/
- Required files:
  - MANIFEST.txt
  - SHA256SUMS.txt
  - RESTORE.md

## Hygiene Rules
- No backup artifacts in active web folders.
- Keep historical exports and drafts in /var/www/backups/rjaka-web.

## Governance
- Backup create permission: server ops team
- Production restore permission: server ops lead or incident commander
- Retention accountability: operations owner for rjaka-web
- Restore drill cadence: quarterly (Tier 2)
- Evidence location: docs/ops/*restore* or docs/runtime/*
