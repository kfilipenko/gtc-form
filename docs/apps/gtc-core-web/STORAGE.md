# STORAGE: gtc-core-web

## Active Storage
- Code root: /var/www/gtc-form
- Nginx include docs: /var/www/gtc-form/docs/nginx
- Shared frontend modules: /var/www/gtc-form/shared

## Runtime/Generated Artifacts
- Chat transaction log: /var/www/gtc-form/chat_transactions.log
- Test reports (if generated): /var/www/gtc-form/playwright-report, /var/www/gtc-form/test-results

## Backup Policy
- Backups go to /var/www/backups/gtc-core-web/<timestamp>_<reason>/
- Required files in each backup folder:
  - MANIFEST.txt
  - SHA256SUMS.txt
  - RESTORE.md

## Hygiene Rules
- No *.bak/*.backup files inside /var/www/gtc-form.
- Move legacy snapshots to /var/www/backups/gtc-core-web.

## Governance
- Backup create permission: server ops team
- Production restore permission: server ops lead or incident commander
- Retention accountability: operations owner for gtc-core-web
- Restore drill cadence: monthly (Tier 1)
- Evidence location: docs/ops/backup-restore-validation-*.md
