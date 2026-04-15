# RUNBOOK: gtc-core-web

## Common Checks
1. nginx config and routing:
   - nginx -t
   - check /etc/nginx/sites-enabled/app.gtstor.com
2. Auth integration:
   - verify /auth/status behavior for guest and logged-in user
3. Chat frontend health:
   - open /user/ and /chat/
   - ensure no blocking JS runtime errors

## Typical Incident Patterns
- 401 on /auth/status for guests is expected.
- 400 on /chat_api.php in guest flow often indicates invalid telemetry payload.
- Route conflicts may come from stale include files or duplicate site configs.

## Escalation Data to Capture
- Last 100 lines of app nginx error log
- Browser console/runtime errors
- Exact failing URL and HTTP status

## Governance
- Escalation owner: server ops on-call
- Incident severity target: Tier 1 incidents acknowledged within 15 minutes
- Restore drill policy: monthly sandbox restore verification
- Drill evidence: docs/ops/backup-restore-validation-*.md
