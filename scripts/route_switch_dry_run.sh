#!/usr/bin/env bash
set -euo pipefail

ROOT="/var/www/gtc-form"
cd "$ROOT"

ts_utc="$(date -u +"%Y-%m-%d %H:%M:%S+00")"
ts_file="$(date -u +"%Y%m%d-%H%M%SZ")"
report_dir="docs/runtime"
report_file="${report_dir}/route-switch-dry-run-${ts_file}.md"

mkdir -p "$report_dir"

status="PASS"
results=()

check_exists() {
  local kind="$1"
  local path="$2"
  if [[ -e "$path" ]]; then
    results+=("OK|$kind|$path")
  else
    results+=("MISS|$kind|$path")
    status="FAIL"
  fi
}

# Required contour assets
check_exists "RJAKA web" "projects/rjaka/web/game-chat.html"
check_exists "RJAKA web" "projects/rjaka/web/chat-qa.html"
check_exists "RJAKA api" "projects/rjaka/api/game_chat.php"
check_exists "RJAKA api" "projects/rjaka/api/admin/chat-qa.php"
check_exists "RJAKA api" "projects/rjaka/api/admin/chat-qa-feedback.php"

check_exists "GTSTOR web" "projects/gtstor/web/index.html"
check_exists "GTSTOR web" "projects/gtstor/web/chat/index.html"
check_exists "GTSTOR web" "projects/gtstor/web/chat/internal/index.html"
check_exists "GTSTOR web" "projects/gtstor/web/user/index.html"
check_exists "GTSTOR web" "projects/gtstor/web/news/index.html"
check_exists "GTSTOR api" "projects/gtstor/api/chat_api.php"

# Nginx compatibility templates
check_exists "nginx template" "projects/shared/nginx/rjaka-compat.conf"
check_exists "nginx template" "projects/shared/nginx/gtstor-compat.conf"

# Runtime evidence presence
latest_sync_guard="$(ls -1t docs/runtime/projects-sync-guard-*.md 2>/dev/null | head -n1 || true)"
latest_hard_extract="$(ls -1t docs/runtime/hard-extraction-apply-*.md 2>/dev/null | head -n1 || true)"

if [[ -z "$latest_sync_guard" ]]; then
  results+=("MISS|evidence|docs/runtime/projects-sync-guard-*.md")
  status="FAIL"
else
  results+=("OK|evidence|$latest_sync_guard")
fi

if [[ -z "$latest_hard_extract" ]]; then
  results+=("MISS|evidence|docs/runtime/hard-extraction-apply-*.md")
  status="FAIL"
else
  results+=("OK|evidence|$latest_hard_extract")
fi

{
  echo "# Route Switch Dry-Run Report"
  echo
  echo "- captured_at_utc: ${ts_utc}"
  echo "- mode: non-destructive route switch readiness validation"
  echo "- status: ${status}"
  echo
  echo "## Checks"
  for r in "${results[@]}"; do
    IFS='|' read -r state kind path <<< "$r"
    echo "- ${state} [${kind}] ${path}"
  done
  echo
  echo "## Proposed switch order"
  echo "1. Keep root runtime active."
  echo "2. Include compatibility templates from projects/shared/nginx/*.conf in staging first."
  echo "3. Validate section 4 smoke checks from docs/cutover-checklist.md."
  echo "4. Run cutover_orchestrator postcheck + sync-guard."
  echo "5. Finalize decision note (GO/NO-GO)."
  echo
  echo "## Result"
  if [[ "$status" == "PASS" ]]; then
    echo "- Ready for route-switch planning stage."
  else
    echo "- Not ready. Resolve missing items and rerun this script."
  fi
} > "$report_file"

echo "[route-dry-run] report generated: $report_file"
echo "[route-dry-run] status: $status"

if [[ "$status" != "PASS" ]]; then
  exit 1
fi
