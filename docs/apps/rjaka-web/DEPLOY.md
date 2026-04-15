# DEPLOY: rjaka-web

## Standard Deploy
1. Create backup snapshot under /var/www/backups/rjaka-web/<timestamp>_<reason>/.
2. Update required files in /var/www/gtc-form.
3. Validate nginx: nginx -t.
4. Reload nginx: systemctl reload nginx.
5. Smoke checks:
   - rjaka.pro/ returns 200
   - /chat/ and /chat/history/ return expected status
   - static assets under /assets/ return 200
6. SLA checks for history page:
   - run `bash scripts/check_chat_history_sla.sh`
   - verify p95 TTFB and error-rate thresholds are green

## Rollback
1. Restore modified files from backup snapshot.
2. Validate and reload nginx.
3. Repeat smoke checks and verify redirects from app.gtstor.com remain correct.

## Notes
- Keep RJAKA routes isolated from app.gtstor.com.
- Any compatibility include changes require a dedicated smoke run.

## Governance
- Deployment approval role: server ops lead
- Rollback authority: incident commander (ops)
- Mandatory pre-deploy gate:
   - backup snapshot exists
   - nginx -t passes
   - smoke checks pass for rjaka.pro/, /chat/, /chat/history/
   - history SLA check passes (`scripts/check_chat_history_sla.sh`)
- Post-deploy evidence location:
   - docs/runtime/* or docs/ops/* validation record
