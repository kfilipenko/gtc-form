# APP: payment-web

Status: active
Code root: /var/www/html

## Purpose
Payment pages and PHP payment flow for pay.gtstor.com and pay.agent.gtstor.com.
Current runtime distinguishes a Telegram payment entrypoint and a separate web payment entrypoint.

## Domains and Entrypoints
- https://pay.gtstor.com/
- https://pay.gtstor.com/payment_tg.php - current Telegram runtime payment entrypoint, gtc_user_id-first
- https://pay.gtstor.com/payment.php - current web payment entrypoint
- https://pay.agent.gtstor.com/

## Current Billing Runtime
- Telegram payment entrypoint: /var/www/html/payment_tg.php
- Web payment entrypoint: /var/www/html/payment.php
- Telegram runtime now resolves gtc_user_id -> stripe_customer_id -> Stripe Customer Session -> Pricing Table / Checkout
- Telegram runtime binds Stripe Pricing Table through customer-session-client-secret
- client_reference_id and metadata.gtc_user_id remain mandatory compatibility fields
- metadata.gtc_email may still exist as optional billing/contact metadata
- customer-email and customer_email are no longer the Telegram identity mechanism
- payment.php and the web payment flow remained unchanged in this implementation
- Telegram and Web account models may still remain separate

## Implementation Note: Telegram-first Stripe Fix (2026-04-04)
- Runtime validation on 2026-04-04 confirmed that a Telegram user completed subscription checkout successfully, a trial subscription was created, access was granted, and reuse of the same email no longer triggered an email-based "already subscribed" block in the Telegram flow.
- Downstream webhook compatibility was preserved through client_reference_id = gtc_user_id and metadata.gtc_user_id.

## Owners
- Product/Business: Billing team
- Operations: server ops team

## Dependencies
- nginx vhosts: /etc/nginx/sites-enabled/pay-gtstor and /etc/nginx/sites-enabled/payment
- php-fpm: /var/run/php/php8.1-fpm.sock
- host-level php-fpm env wiring for PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD, and STRIPE_SECRET_KEY
- Stripe API for Customer and Customer Session bootstrap in payment_tg.php

## Governance
- Service tier: Tier 1
- RTO: 30 minutes
- RPO: 12 hours
- Review cadence: monthly
- last_reviewed_utc: 2026-04-04
- approved_by: server ops lead (acting)

RACI:
- Accountable: billing product owner
- Responsible: server ops team
- Consulted: payment integration maintainers
- Informed: support team
