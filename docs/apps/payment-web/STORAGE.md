# STORAGE: payment-web

## Active Storage
- Code root: /var/www/html
- Main runtime files: payment_tg.php, payment.php, payment.html

## Operational Config Outside Repo
- payment_tg.php depends on host-managed php-fpm pool env wiring outside the repository.
- Required runtime variables: PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD, STRIPE_SECRET_KEY.
- Secret values must not be stored under /var/www/html or in repository documentation.

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
