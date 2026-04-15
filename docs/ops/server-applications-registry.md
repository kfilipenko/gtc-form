# Server Applications Registry

Updated: 2026-04-04
Scope: production host layout under /var/www and active nginx virtual hosts.

## Purpose
This document is the single source of truth for deployed applications, domains, entrypoints, and storage ownership.

## Host-Level Storage Map

| Path | Role | Notes |
|---|---|---|
| /var/www/gtc-form | Main web monorepo (static, PHP, chat/user frontends, docs) | Primary application root for app.gtstor.com and rjaka.pro |
| /var/www/html | Payment PHP site root | Used by pay.gtstor.com and pay.agent.gtstor.com |
| /var/www/backups | Operational backups and archives | Keep immutable dated snapshots |
| /var/www/test-results | Shared test artifacts | Prefer short retention |

## Active Domain Registry

| Domain | Nginx Config | Runtime Type | Upstream/Root | Primary Purpose |
|---|---|---|---|---|
| app.gtstor.com | /etc/nginx/sites-enabled/app.gtstor.com | Static + PHP + reverse proxy | root /var/www/gtc-form; /auth -> 127.0.0.1:8085; /api -> 127.0.0.1:3100 | Main GTC app shell, user portal, shared frontend modules |
| rjaka.pro, www.rjaka.pro | /etc/nginx/sites-enabled/www.rjaka.pro | Static + PHP | root /var/www/gtc-form | RJAKA site/chat routes (compat include enabled) |
| new-rjaka.gtstor.com | /etc/nginx/sites-enabled/new-rjaka.gtstor.com | Static + PHP (IP restricted) | root /var/www/gtc-form | Internal RJAKA staging/preview |
| pay.gtstor.com | /etc/nginx/sites-enabled/pay-gtstor | PHP | root /var/www/html | Public payment pages for Telegram payment_tg.php and web payment.php |
| pay.agent.gtstor.com | /etc/nginx/sites-enabled/payment | PHP | root /var/www/html | Agent payment endpoint |
| agent.gtstor.com | /etc/nginx/sites-enabled/agent.gtstor.com | Reverse proxy | 127.0.0.1:5678 | n8n/webhook service |
| mcpn8n.gtstor.com | /etc/nginx/sites-enabled/mcpn8n.gtstor.com | Reverse proxy | 127.0.0.1:3333 | MCP/n8n adjacent service |
| dev.gtstor.com | /etc/nginx/sites-enabled/dev | Reverse proxy | 127.0.0.1:3001 | Development environment |
| vs.gtstor.com | /etc/nginx/sites-enabled/vs.gtstor.com | Reverse proxy | 127.0.0.1:8080 | VS/IDE web endpoint |

## Application Ownership Matrix

| App ID | Code Root | Public Entrypoints | Infra Dependencies |
|---|---|---|---|
| gtc-core-web | /var/www/gtc-form | /user/, /chat/, /news/, /buy/, /auth/* (proxied) | nginx, php8.1-fpm, auth service :8085, PostgREST :3100 |
| rjaka-web | /var/www/gtc-form | rjaka.pro/, /chat/, /chat/history/ | nginx, php8.1-fpm, shared assets |
| payment-web | /var/www/html | /payment_tg.php, /payment.php, /payment.html | nginx, php8.1-fpm, Stripe API, host-level php-fpm env wiring for PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD/STRIPE_SECRET_KEY |
| n8n-agent | external process | agent.gtstor.com/* | nginx proxy, process on :5678 |
| mcpn8n | external process | mcpn8n.gtstor.com/* | nginx proxy, process on :3333 |

## Canonical Chat Route Ownership

| Chat Purpose | Public URL | Owning App | Nginx Config | Notes |
|---|---|---|---|---|
| GTC admin chat | https://app.gtstor.com/chat/ | gtc-core-web | /etc/nginx/sites-enabled/app.gtstor.com | Primary admin route |
| GTC user chat | https://app.gtstor.com/user/ | gtc-core-web | /etc/nginx/sites-enabled/app.gtstor.com | Primary end-user route |
| RJAKA game chat | https://rjaka.pro/chat/ | rjaka-web | /etc/nginx/sites-enabled/www.rjaka.pro | Primary RJAKA route |
| RJAKA history | https://rjaka.pro/chat/history/ | rjaka-web | /etc/nginx/sites-enabled/www.rjaka.pro | History route |

Compatibility aliases (RJAKA, non-primary):
- /game-chat.html -> /chat/
- /chat-qa.html -> /chat/history/
- configured in /var/www/gtc-form/projects/shared/nginx/rjaka-compat.conf

## Logging Map

| Component | Access Log | Error Log |
|---|---|---|
| app.gtstor.com | /var/log/nginx/app.gtstor.access.log | /var/log/nginx/app.gtstor.error.log |
| rjaka.pro | /var/log/nginx/rjaka.access.log | /var/log/nginx/rjaka.error.log |
| new-rjaka.gtstor.com | /var/log/nginx/new-rjaka.access.log | /var/log/nginx/new-rjaka.error.log |

## Change Control Rules

1. Any new domain must be added here in the same pull request as nginx changes.
2. Any new app root under /var/www must be documented here before first deploy.
3. Compatibility includes (for example legacy route includes) must be listed with owner and expiry target in the related app docs.
4. Backup location and restore command must be defined for each app before production cutover.

## Lifecycle Status

| Status | Meaning |
|---|---|
| active | User-facing production service |
| internal | Internal-only service or IP restricted |
| legacy | Supported only for redirect/compatibility |
| planned | Declared but not deployed |

Current assignments:
- app.gtstor.com: active
- rjaka.pro: active
- new-rjaka.gtstor.com: internal
- pay.gtstor.com: active
- pay.agent.gtstor.com: active
- dev.gtstor.com: internal
- agent.gtstor.com: active
- mcpn8n.gtstor.com: active
- vs.gtstor.com: internal
