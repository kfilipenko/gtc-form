# Operations Governance Standard

Updated: 2026-03-10
Scope: governance requirements for all application operational documents.

## Purpose
Define mandatory governance fields so APP/DEPLOY/STORAGE/RUNBOOK are not only descriptive, but operationally accountable.

## Mandatory Governance Fields

Every app documentation set must include:

1. Service criticality tier
- Tier 1: business-critical user/payment/auth path
- Tier 2: important but non-blocking service
- Tier 3: internal/supporting tooling

2. Recovery objectives
- RTO (Recovery Time Objective)
- RPO (Recovery Point Objective)

3. Ownership model (RACI minimum)
- Accountable owner (single role)
- Responsible team (execution)
- Consulted stakeholders
- Informed stakeholders

4. Change governance
- Deployment approval role
- Rollback authority role
- Required pre-deploy checks

5. Backup and restore access policy
- Who can create backups
- Who can execute restore in production
- Where evidence is logged

6. Document lifecycle
- Review cadence (monthly/quarterly)
- last_reviewed_utc
- approved_by

7. Restore drill cadence
- Frequency target (for example monthly for Tier 1)
- Evidence location in docs/ops or docs/runtime

8. Chat route and ownership governance (required for chat-enabled apps)
- Canonical chat matrix must be explicit in docs and kept consistent:
	- `https://app.gtstor.com/chat/` = admin chat (gtc-core-web)
	- `https://app.gtstor.com/user/` = user chat (gtc-core-web)
	- `https://rjaka.pro/chat/` = RJAKA game chat (rjaka-web)
- Address configuration must declare:
	- nginx vhost file
	- project ownership
	- primary route vs compatibility aliases

## Required Placement

- APP.md: tier, RTO/RPO, RACI, review metadata
- DEPLOY.md: approval and rollback authority
- STORAGE.md: backup access policy and retention accountability
- RUNBOOK.md: escalation ownership and restore drill policy

For chat-enabled apps, update in the same PR:
- docs/chat-admin-current.md
- docs/chat-user-current.md
- docs/rjaka-game-chat.md
- docs/chat-docs-index.md
- relevant APP.md files in docs/apps/

## Governance Defaults

If app-specific values are not yet formalized, use temporary defaults and mark for review:
- Tier: Tier 2
- RTO: 4h
- RPO: 24h
- Review cadence: monthly
