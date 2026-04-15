#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="/var/www/gtc-form"
REPORT_DIR="${REPORT_DIR:-${BASE_DIR}/docs/runtime}"
TS_FILE="$(date -u +"%Y%m%d-%H%M%SZ")"
TS_HUMAN="$(date -u +"%Y-%m-%d %H:%M:%S+00")"
REPORT_FILE="${REPORT_DIR}/chat-monitoring-${TS_FILE}.md"

mkdir -p "$REPORT_DIR"

declare -a CHECKS=(
  "chat_route_matrix|${BASE_DIR}/scripts/check_chat_route_matrix.sh"
  "chat_routing_lock|${BASE_DIR}/scripts/check_chat_routing_lock.sh"
  "chat_history_sla|${BASE_DIR}/scripts/check_chat_history_sla.sh"
)

overall_status="PASS"

{
  echo "# Chat Monitoring Report"
  echo
  echo "- captured_at_utc: ${TS_HUMAN}"
  echo "- host: $(hostname 2>/dev/null || echo unknown-host)"
  echo "- report_version: 1"
  echo
  echo "## Checks"
} >"$REPORT_FILE"

for check in "${CHECKS[@]}"; do
  check_name="${check%%|*}"
  check_cmd="${check#*|}"

  output_file="$(mktemp)"
  if "$check_cmd" >"$output_file" 2>&1; then
    check_status="PASS"
  else
    check_status="FAIL"
    overall_status="FAIL"
  fi

  {
    echo "- ${check_name}: ${check_status}"
  } >>"$REPORT_FILE"

  {
    echo
    echo "## ${check_name} (${check_status})"
    echo
    echo '```text'
    cat "$output_file"
    echo '```'
  } >>"$REPORT_FILE"

  rm -f "$output_file"
done

{
  echo
  echo "## Overall"
  echo
  echo "- status: ${overall_status}"
} >>"$REPORT_FILE"

summary="checks=$(printf '%s,' "${CHECKS[@]}" | sed 's/,$//') overall=${overall_status}"

if [[ "${NO_NOTIFY:-0}" != "1" ]]; then
  "${BASE_DIR}/scripts/chat_monitoring_notify.sh" "$overall_status" "$REPORT_FILE" "$summary" || true
fi

echo "[chat-monitoring] report: ${REPORT_FILE}"
echo "[chat-monitoring] overall: ${overall_status}"

if [[ "$overall_status" != "PASS" ]]; then
  exit 1
fi
