# Operations Documentation Index

This folder contains operational architecture and storage governance documents.

## Core Documents

1. server-applications-registry.md
- Unified registry of domains, applications, roots, upstreams, and status.

2. storage-architecture-standard.md
- Canonical storage layout, backup policy, retention, and filesystem hygiene rules.

3. storage-cleanup-log-20260310.md
- Execution log of legacy backup cleanup from active roots.

4. ../apps/README.md
- App-level passports and runbooks for production services.

5. storage-weekly-audit-checklist.md
- Weekly operational checklist for storage hygiene and backup metadata validation.

6. backup-restore-validation-20260310.md
- Evidence log for full-code backup creation and sandbox restore verification.

7. governance-standard.md
- Mandatory governance requirements for APP/DEPLOY/STORAGE/RUNBOOK documents.

8. chat-routing-baseline-lock.md
- Locked baseline for chat route ownership, nginx include order, and pre-merge verification gates.

9. ../rjaka-history-spec.md
- Dedicated architecture/API spec for RJAKA history page (`/chat/history/`).

10. chat-monitoring-rollout-plan.md
- Planned rollout for nightly chat checks, SLA monitoring, and alerting ownership.

## Scripts

- Audit only (dry-run): bash scripts/storage_hygiene_audit.sh
- Remediation plan/execute: bash scripts/storage_hygiene_remediate.sh
- Chat route runtime matrix: bash scripts/check_chat_route_matrix.sh
- Chat route config lock: bash scripts/check_chat_routing_lock.sh
- Chat history SLA probe: bash scripts/check_chat_history_sla.sh
- Chat monitoring wrapper: bash scripts/chat_monitoring_run.sh
- Chat alert notifier: bash scripts/chat_monitoring_notify.sh

## Systemd Templates

- docs/ops/systemd/chat-monitoring.service
- docs/ops/systemd/chat-monitoring.timer

## Usage

- Update server-applications-registry.md in the same change as nginx domain/app updates.
- Follow storage-architecture-standard.md before moving roots, cleaning legacy backups, or changing retention.
- Follow chat-routing-baseline-lock.md before changing chat routes or nginx includes.
