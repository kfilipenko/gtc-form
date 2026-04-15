# DEPLOY: payment-web

## Standard Deploy
1. Snapshot /var/www/html into /var/www/backups/payment-web/<timestamp>_<reason>/.
2. Apply file updates in /var/www/html.
3. If the change touches payment_tg.php runtime wiring or php-fpm pool config, validate PHP-FPM syntax: php-fpm8.1 -t.
4. Reload php8.1-fpm only when PHP-FPM pool config or env wiring changed.
5. Validate nginx: nginx -t.
6. Reload nginx: systemctl reload nginx.
7. Smoke checks:
   - /payment_tg.php returns expected content
   - /payment_tg.php uses customer-session-client-secret and does not fall back to an email-bound Telegram identity path
   - /payment.php returns expected content
   - main payment pages respond on both domains where applicable

## Rollback
1. Restore previous files from backup snapshot.
2. Validate and reload php8.1-fpm if rollback also restores pool config or env wiring.
3. Validate and reload nginx.
4. Re-run smoke checks.

## Notes
- Preserve compatibility with existing payment links.
- Keep backup artifacts out of /var/www/html.
- payment_tg.php requires host-level php-fpm env exposure for PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD, and STRIPE_SECRET_KEY.
- Do not place secret values in repository files, deploy notes, or backup manifests.
- Validated runtime baseline as of 2026-04-04: Telegram checkout completed successfully, trial subscription was created, access was granted, and reuse of the same email no longer caused an email-based Stripe block in the Telegram flow.

## Governance
- Deployment approval role: server ops lead
- Rollback authority: incident commander (ops)
- Mandatory pre-deploy gate:
   - backup snapshot exists
   - php-fpm8.1 -t passes when payment_tg.php env wiring changed
   - nginx -t passes
   - smoke checks pass for payment domains, /payment_tg.php, and /payment.php
- Post-deploy evidence location:
   - docs/runtime/* or docs/ops/* validation record
