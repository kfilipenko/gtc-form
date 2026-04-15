# DEPLOY: payment-web

## Standard Deploy
1. Snapshot /var/www/html into /var/www/backups/payment-web/<timestamp>_<reason>/.
2. Apply file updates in /var/www/html.
3. Validate nginx: nginx -t.
4. Reload nginx: systemctl reload nginx.
5. Smoke checks:
   - /payment.php returns expected content
   - main payment page responds on both domains

## Rollback
1. Restore previous files from backup snapshot.
2. Validate and reload nginx.
3. Re-run smoke checks.

## Notes
- Preserve compatibility with existing payment links.
- Keep backup artifacts out of /var/www/html.

## Governance
- Deployment approval role: server ops lead
- Rollback authority: incident commander (ops)
- Mandatory pre-deploy gate:
   - backup snapshot exists
   - nginx -t passes
   - smoke checks pass for payment domains and /payment.php
- Post-deploy evidence location:
   - docs/runtime/* or docs/ops/* validation record
