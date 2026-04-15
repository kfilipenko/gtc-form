# Chat Monitoring Rollout Plan

Status: planned
Created: 2026-03-17
Scope: continuous monitoring for chat routing and RJAKA history SLA

## Goal

Перевести контроль чатов из режима только pre-deploy в режим постоянного наблюдения (nightly + alerts), чтобы быстро выявлять отклонения по маршрутам и отклику.

## Monitoring Targets

1. Routing integrity
- Script: `/var/www/gtc-form/scripts/check_chat_route_matrix.sh`
- Script: `/var/www/gtc-form/scripts/check_chat_routing_lock.sh`

2. RJAKA history SLA
- Script: `/var/www/gtc-form/scripts/check_chat_history_sla.sh`
- Default thresholds:
  - `ERROR_RATE_MAX=0`
  - `TTFB_P95_MAX=0.800`
  - `PROBES=10`

## Execution Model (planned)

1. Schedule
- Nightly run at 02:30 UTC.
- Optional daytime verification run at 10:30 UTC.

2. Runner
- Preferred: systemd timer + oneshot service on production host.
- Alternative: cron entry (if systemd timer is unavailable).

Implementation templates prepared:
- `docs/ops/systemd/chat-monitoring.service`
- `docs/ops/systemd/chat-monitoring.timer`
- Runtime wrapper: `/var/www/gtc-form/scripts/chat_monitoring_run.sh`

3. Output and evidence
- Save each run report to `docs/runtime/` with UTC timestamp.
- Keep last 30 daily reports, then archive to `/var/www/backups/`.

## Alerting Model (planned)

1. Alert condition
- Any script returns non-zero exit code.
- SLA threshold breach in `check_chat_history_sla.sh`.

2. Channels
- Primary: Telegram ops group.
- Secondary: Slack `#ops-alerts` (if configured).

Notifier script prepared:
- `/var/www/gtc-form/scripts/chat_monitoring_notify.sh`

3. Alert payload
- Timestamp (UTC)
- Failed check name
- Endpoint(s)
- Key metrics (HTTP status, p95 TTFB, error rate)
- Last successful run timestamp

## Ownership and Response

RACI for deviations:
1. Accountable: server ops lead
2. Responsible (triage): server ops team (on-duty)
3. Consulted: RJAKA product owner
4. Informed: support team

Response SLO:
1. Acknowledge alert within 15 minutes (business hours) / 60 minutes (off-hours).
2. Start mitigation or rollback decision within 30 minutes after acknowledgement.
3. Publish incident note to `docs/runtime/` for any production-impacting failure.

## Rollout Phases

1. Phase 1 (dry-run, 3 days)
- Nightly scripts run without alerts.
- Validate report format and false-positive rate.

2. Phase 2 (alert pilot, 7 days)
- Enable Telegram alerts.
- Tune thresholds if needed.

3. Phase 3 (operational)
- Enable both Telegram + Slack.
- Make monitoring status a mandatory deploy checklist item.

## Acceptance Criteria

1. Nightly monitor runs automatically without manual start.
2. Failures generate actionable alert with endpoint and metric context.
3. Deviation ownership is explicit and documented.
4. Reports are discoverable in `docs/runtime/`.

## Implementation Checklist (for follow-up task)

1. Create systemd service/timer (or cron fallback).
2. Add notifier script for Telegram/Slack.
3. Add report writer wrapper around existing check scripts.
4. Validate end-to-end alert flow with test failure injection.
5. Update runbooks with final command paths and escalation contacts.

## Environment Configuration Example (planned)

Suggested file: `/etc/default/gtc-chat-monitoring`

```bash
REPORT_DIR=/var/www/gtc-form/docs/runtime
PROBES=10
TTFB_P95_MAX=0.800
ERROR_RATE_MAX=0

# Optional notifications
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
SLACK_WEBHOOK_URL=
```

