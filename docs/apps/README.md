# Applications Documentation Index

This section contains app-level operational documents.

## Applications

1. gtc-core-web
- APP.md
- DEPLOY.md
- STORAGE.md
- RUNBOOK.md

2. rjaka-web
- APP.md
- DEPLOY.md
- STORAGE.md
- RUNBOOK.md

3. payment-web
- APP.md
- DEPLOY.md
- STORAGE.md
- RUNBOOK.md

## Rule
Any production app must have all four documents before major deployment changes.

## Governance Requirement
Each of the four documents must include governance fields as defined in:
- docs/ops/governance-standard.md

## Chat Routing Governance (mandatory when chat routes are touched)
If a change impacts chat roles, routes, or domain ownership, the same PR must also update:
- docs/chat-docs-index.md
- docs/chat-admin-current.md
- docs/chat-user-current.md
- docs/rjaka-game-chat.md
- docs/apps/gtc-core-web/APP.md and/or docs/apps/rjaka-web/APP.md

Required checks:
1. Role mapping is explicit and consistent:
	- app.gtstor.com/chat = admin
	- app.gtstor.com/user = user
	- rjaka.pro/chat = RJAKA game chat
2. Address configuration references the correct nginx vhost files and compatibility includes.
