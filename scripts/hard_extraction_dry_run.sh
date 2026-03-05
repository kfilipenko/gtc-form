#!/usr/bin/env bash
set -euo pipefail

ROOT="/var/www/gtc-form"
cd "$ROOT"

ts_utc="$(date -u +"%Y-%m-%d %H:%M:%S+00")"
ts_file="$(date -u +"%Y%m%d-%H%M%SZ")"
report_dir="docs/runtime"
report_file="${report_dir}/hard-extraction-dry-run-${ts_file}.md"

mkdir -p "$report_dir"

status="PASS"

check_file() {
  local path="$1"
  if [[ -f "$path" ]]; then
    echo "OK|$path"
  else
    echo "MISS|$path"
    status="FAIL"
  fi
}

rjaka_checks=(
  "projects/rjaka/web/game-chat.html"
  "projects/rjaka/web/chat-qa.html"
  "projects/rjaka/api/game_chat.php"
  "projects/rjaka/api/admin/chat-qa.php"
  "projects/rjaka/api/admin/chat-qa-feedback.php"
  "projects/rjaka/db/migrations/20260121_anon_chat.sql"
  "projects/rjaka/db/migrations/20260305_anon_chat_feedback.sql"
  "projects/rjaka/db/migrations/20260305_anon_chat_feedback_votes.sql"
)

gtstor_checks=(
  "projects/gtstor/web/index.html"
  "projects/gtstor/web/chat/index.html"
  "projects/gtstor/web/chat/internal/index.html"
  "projects/gtstor/web/user/index.html"
  "projects/gtstor/web/news/index.html"
  "projects/gtstor/api/chat_api.php"
  "projects/gtstor/api/chat_api2.php"
)

native_targets=(
  "game-chat.html"
  "chat-qa.html"
  "game_chat.php"
  "admin/chat-qa.php"
  "admin/chat-qa-feedback.php"
  "index.html"
  "chat/index.html"
  "chat/internal/index.html"
  "user/index.html"
  "news/index.html"
  "chat_api.php"
  "chat_api2.php"
)

wrapper_refs="$(grep -RInE "require_once __DIR__\s*\.\s*'/\.\./|http-equiv=\"refresh\"" projects/rjaka projects/gtstor || true)"

{
  echo "# Hard Extraction Dry-Run"
  echo
  echo "- captured_at_utc: ${ts_utc}"
  echo "- mode: non-destructive validation"
  echo "- status: ${status} (pre-check; final status below)"
  echo
  echo "## RJAKA contour files"
  for p in "${rjaka_checks[@]}"; do
    check_file "$p"
  done | sed 's/^/- /'
  echo
  echo "## GTSTOR contour files"
  for p in "${gtstor_checks[@]}"; do
    check_file "$p"
  done | sed 's/^/- /'
  echo
  echo "## Native source targets"
  for p in "${native_targets[@]}"; do
    check_file "$p"
  done | sed 's/^/- /'
  echo
  echo "## Wrapper/redirect references"
  if [[ -n "$wrapper_refs" ]]; then
    echo '```'
    echo "$wrapper_refs"
    echo '```'
  else
    echo "- none found"
  fi
  echo
  echo "## Final verdict"
  if [[ "$status" == "PASS" ]]; then
    echo "- status: PASS"
    echo "- result: hard-extraction preparation is structurally ready for controlled copy phase"
  else
    echo "- status: FAIL"
    echo "- result: missing files detected; fix before hard extraction"
  fi
  echo
  echo "## Next actions"
  echo "1. Keep wrappers as active path until controlled copy is executed."
  echo "2. Replace wrapper files in projects/* with native copies in a dedicated extraction window."
  echo "3. Re-run this script and archive report in release ticket."
} > "$report_file"

echo "[hard-extraction] report generated: $report_file"
if [[ "$status" == "PASS" ]]; then
  echo "[hard-extraction] status: PASS"
  exit 0
fi

echo "[hard-extraction] status: FAIL"
exit 1
