#!/usr/bin/env bash
set -euo pipefail

STATUS="${1:-unknown}"
REPORT_PATH="${2:-}"
SUMMARY="${3:-}"

HOSTNAME_VALUE="$(hostname 2>/dev/null || echo unknown-host)"
TS_UTC="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

if [[ -z "$SUMMARY" ]]; then
  SUMMARY="Chat monitoring status: ${STATUS}"
fi

MESSAGE="[chat-monitoring] status=${STATUS}\nhost=${HOSTNAME_VALUE}\nutc=${TS_UTC}\n${SUMMARY}"
if [[ -n "$REPORT_PATH" ]]; then
  MESSAGE+="\nreport=${REPORT_PATH}"
fi

send_telegram() {
  if [[ -z "${TELEGRAM_BOT_TOKEN:-}" || -z "${TELEGRAM_CHAT_ID:-}" ]]; then
    return 0
  fi

  curl -fsS -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d "chat_id=${TELEGRAM_CHAT_ID}" \
    --data-urlencode "text=${MESSAGE}" >/dev/null
}

send_slack() {
  if [[ -z "${SLACK_WEBHOOK_URL:-}" ]]; then
    return 0
  fi

  escaped_message="$(printf '%s' "$MESSAGE" | sed 's/"/\\"/g')"
  curl -fsS -X POST "${SLACK_WEBHOOK_URL}" \
    -H "Content-Type: application/json" \
    -d "{\"text\":\"${escaped_message}\"}" >/dev/null
}

send_telegram || true
send_slack || true
