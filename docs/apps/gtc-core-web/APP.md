# APP: gtc-core-web

Status: active
Code root: /var/www/gtc-form

## Purpose
Main user-facing web application for app.gtstor.com, including user portal, chat frontend, shared modules, and API/PHP entrypoints.

## Domains and Entrypoints
- https://app.gtstor.com/
- https://app.gtstor.com/user/
- https://app.gtstor.com/chat/
- https://app.gtstor.com/auth/* (proxied to auth service)
- https://app.gtstor.com/api/* (proxied to PostgREST)

## Canonical Chat Ownership
- Admin chat: https://app.gtstor.com/chat/
- User chat: https://app.gtstor.com/user/
- RJAKA game chat does not belong to this app URL space; it is served from https://rjaka.pro/chat/

## Address Configuration
- Domain routing config: /etc/nginx/sites-enabled/app.gtstor.com
- Route /chat/ maps to frontend in /var/www/gtc-form/chat/
- Route /user/ maps to frontend in /var/www/gtc-form/user/
- Keep role mapping explicit in docs to avoid /chat vs /user inversion errors.

## Owners
- Product/Business: GTC team
- Operations: server ops team

## Dependencies
- nginx vhost: /etc/nginx/sites-enabled/app.gtstor.com
- php-fpm: /run/php/php8.1-fpm.sock
- auth backend: 127.0.0.1:8085
- PostgREST: 127.0.0.1:3100

## Governance
- Service tier: Tier 1
- RTO: 30 minutes
- RPO: 24 hours
- Review cadence: monthly
- last_reviewed_utc: 2026-03-10
- approved_by: server ops lead (acting)

RACI:
- Accountable: product owner (GTC core)
- Responsible: server ops team
- Consulted: auth/backend maintainers
- Informed: support team
