# RUNBOOK: payment-web

## Common Checks
1. nginx vhost health:
   - nginx -t
   - verify pay.gtstor.com and pay.agent.gtstor.com server blocks
2. PHP execution path:
   - fastcgi_pass unix socket reachable
3. Functional check:
   - open payment.php and validate response code/content

## Typical Incident Patterns
- 404 on payment endpoints due to missing files in /var/www/html.
- PHP not executing due to php-fpm socket issues.

## Escalation Data to Capture
- Nginx access/error logs for payment domains
- php-fpm service status
- exact failing URL and response

## Governance
- Escalation owner: server ops on-call
- Incident severity target: Tier 1 incidents acknowledged within 15 minutes
- Restore drill policy: monthly sandbox restore verification
- Drill evidence: docs/ops/backup-restore-validation-*.md
