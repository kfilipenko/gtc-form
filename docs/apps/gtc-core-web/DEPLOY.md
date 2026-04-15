# DEPLOY: gtc-core-web

## Standard Deploy
1. Prepare backup snapshot under /var/www/backups/gtc-core-web/<timestamp>_<reason>/.
2. Apply code changes in /var/www/gtc-form.
3. Validate config: nginx -t.
4. Reload nginx: systemctl reload nginx.
5. Run smoke checks:
   - / returns 200
   - /user/ returns 200
   - /chat/ returns expected access status
   - /auth/status returns expected auth status

## Rollback
1. Restore files from the backup snapshot.
2. Validate: nginx -t.
3. Reload nginx.
4. Repeat smoke checks and compare logs.

## Notes
- Do not store *.bak files in active root.
- Route-level changes must also update docs/ops/server-applications-registry.md.

## Governance
- Deployment approval role: server ops lead
- Rollback authority: incident commander (ops)
- Mandatory pre-deploy gate:
   - backup snapshot exists
   - nginx -t passes
   - smoke checks pass on /, /user/, /chat/, /auth/status
- Post-deploy evidence location:
   - docs/runtime/* or docs/ops/* validation record
