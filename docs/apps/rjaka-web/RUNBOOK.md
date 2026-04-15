# RUNBOOK: rjaka-web

## Common Checks
1. Validate domain routing:
   - rjaka.pro serves RJAKA pages
   - app.gtstor.com RJAKA paths are redirects, not content copies
2. Validate static assets under /assets/
3. Validate chat and history routes

## Typical Incident Patterns
- Wrong content on app.gtstor.com/chat due to accidental compat include in app vhost.
- Missing assets caused by alias/path mismatch.

## Escalation Data to Capture
- /var/log/nginx/rjaka.error.log (last lines)
- Output of nginx -t
- HTTP headers for affected routes

## Governance
- Escalation owner: server ops on-call
- Incident severity target: Tier 2 incidents acknowledged within 30 minutes
- Restore drill policy: quarterly sandbox restore verification
- Drill evidence: docs/ops/*restore* or docs/runtime/*
