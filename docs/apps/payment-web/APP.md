# APP: payment-web

Status: active
Code root: /var/www/html

## Purpose
Payment pages and PHP payment flow for pay.gtstor.com and pay.agent.gtstor.com.

## Domains and Entrypoints
- https://pay.gtstor.com/
- https://pay.gtstor.com/payment.php
- https://pay.agent.gtstor.com/

## Owners
- Product/Business: Billing team
- Operations: server ops team

## Dependencies
- nginx vhosts: /etc/nginx/sites-enabled/pay-gtstor and /etc/nginx/sites-enabled/payment
- php-fpm: /var/run/php/php8.1-fpm.sock

## Governance
- Service tier: Tier 1
- RTO: 30 minutes
- RPO: 12 hours
- Review cadence: monthly
- last_reviewed_utc: 2026-03-10
- approved_by: server ops lead (acting)

RACI:
- Accountable: billing product owner
- Responsible: server ops team
- Consulted: payment integration maintainers
- Informed: support team
