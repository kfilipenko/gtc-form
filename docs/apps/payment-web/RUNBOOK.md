# RUNBOOK: payment-web

## Common Checks
1. nginx vhost health:
   - nginx -t
   - verify pay.gtstor.com and pay.agent.gtstor.com server blocks
2. PHP execution path:
   - fastcgi_pass unix socket reachable
   - if payment_tg.php fails while payment.php works, verify php-fpm pool env wiring for PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD, and STRIPE_SECRET_KEY
3. Functional check:
   - open payment_tg.php and validate response code/content
   - confirm Telegram flow renders pricing table through customer-session-client-secret
   - open payment.php and validate response code/content
4. Runtime evidence:
   - confirm the current Telegram billing path remains gtc_user_id-first and not email-bound
   - when checking a recent success path, confirm downstream result: checkout succeeded, trial subscription exists, and access was granted

## Typical Incident Patterns
- 404 on payment endpoints due to missing files in /var/www/html.
- PHP not executing due to php-fpm socket issues.
- payment_tg.php can fail closed with a billing bootstrap error when php-fpm does not expose PG* vars or STRIPE_SECRET_KEY to the pool.
- payment_tg.php can fail while payment.php remains healthy, because the Telegram flow now depends on server-side Stripe Customer and Customer Session bootstrap.

## Escalation Data to Capture
- Nginx access/error logs for payment domains
- php-fpm service status
- php-fpm pool env wiring status for PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD, and STRIPE_SECRET_KEY
- exact failing URL and response
- whether the failure is Telegram-only or affects both Telegram and web payment flows

## Governance
- Escalation owner: server ops on-call
- Incident severity target: Tier 1 incidents acknowledged within 15 minutes
- Restore drill policy: monthly sandbox restore verification
- Drill evidence: docs/ops/backup-restore-validation-*.md
