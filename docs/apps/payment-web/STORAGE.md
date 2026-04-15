# STORAGE: payment-web

## Active Storage
- Code root: /var/www/html
- Main runtime files: payment.php, payment.html

## Backup Policy
- Backups go to /var/www/backups/payment-web/<timestamp>_<reason>/
- Required files:
  - MANIFEST.txt
  - SHA256SUMS.txt
  - RESTORE.md

## Hygiene Rules
- No *.backup/*.bak files inside /var/www/html.
- Move archived payment variants to /var/www/backups/payment-web.

## Governance
- Backup create permission: server ops team
- Production restore permission: server ops lead or incident commander
- Retention accountability: operations owner for payment-web
- Restore drill cadence: monthly (Tier 1)
- Evidence location: docs/ops/backup-restore-validation-*.md
