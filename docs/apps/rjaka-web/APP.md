# APP: rjaka-web

Status: active
Code root: /var/www/gtc-form

## Purpose
Public RJAKA site and chat/history routes served on dedicated domain.

## Domains and Entrypoints
- https://rjaka.pro/
- https://www.rjaka.pro/
- https://rjaka.pro/chat/
- https://rjaka.pro/chat/history/

## Canonical Chat Ownership
- RJAKA game chat (primary): https://rjaka.pro/chat/
- RJAKA history: https://rjaka.pro/chat/history/
- Legacy aliases only: /game-chat.html and /chat-qa.html
- GTSTOR admin/user chats are out of scope for this app:
	- https://app.gtstor.com/chat/
	- https://app.gtstor.com/user/

## Address Configuration
- Domain routing config: /etc/nginx/sites-enabled/www.rjaka.pro
- Compatibility include: /var/www/gtc-form/projects/shared/nginx/rjaka-compat.conf
- Compat mapping:
	- /chat/ -> /game-chat.html
	- /chat/history/ -> /chat-qa.html
- Documentation must always list /chat and /chat/history as primary public routes.

## Owners
- Product/Business: RJAKA content owners
- Operations: server ops team

## Dependencies
- nginx vhost: /etc/nginx/sites-enabled/www.rjaka.pro
- compatibility include: /var/www/gtc-form/projects/shared/nginx/rjaka-compat.conf
- php-fpm: /run/php/php8.1-fpm.sock
- assets alias: /var/www/gtc-form/assets/

## Governance
- Service tier: Tier 2
- RTO: 2 hours
- RPO: 24 hours
- Review cadence: monthly
- last_reviewed_utc: 2026-03-10
- approved_by: server ops lead (acting)

RACI:
- Accountable: RJAKA product owner
- Responsible: server ops team
- Consulted: frontend/content maintainers
- Informed: support team
