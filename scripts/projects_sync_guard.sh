#!/usr/bin/env bash
set -euo pipefail

ROOT="/var/www/gtc-form"
cd "$ROOT"

ts_utc="$(date -u +"%Y-%m-%d %H:%M:%S+00")"
ts_file="$(date -u +"%Y%m%d-%H%M%SZ")"
report_dir="docs/runtime"
report_file="${report_dir}/projects-sync-guard-${ts_file}.md"

mkdir -p "$report_dir"

status="PASS"
results=()

pairs=(
  "game-chat.html|projects/rjaka/web/game-chat.html|RJAKA"
  "chat-qa.html|projects/rjaka/web/chat-qa.html|RJAKA"
  "game_chat.php|projects/rjaka/api/game_chat.php|RJAKA"
  "admin/chat-qa.php|projects/rjaka/api/admin/chat-qa.php|RJAKA"
  "admin/chat-qa-feedback.php|projects/rjaka/api/admin/chat-qa-feedback.php|RJAKA"
  "index.html|projects/gtstor/web/index.html|GTSTOR"
  "chat/index.html|projects/gtstor/web/chat/index.html|GTSTOR"
  "chat/internal/index.html|projects/gtstor/web/chat/internal/index.html|GTSTOR"
  "user/index.html|projects/gtstor/web/user/index.html|GTSTOR"
  "news/index.html|projects/gtstor/web/news/index.html|GTSTOR"
  "chat_api.php|projects/gtstor/api/chat_api.php|GTSTOR"
  "chat_api2.php|projects/gtstor/api/chat_api2.php|GTSTOR"
)

for row in "${pairs[@]}"; do
  src="${row%%|*}"
  rest="${row#*|}"
  dst="${rest%%|*}"
  scope="${rest##*|}"

  if [[ ! -f "$src" ]]; then
    results+=("MISS_SRC|$scope|$src|$dst")
    status="FAIL"
    continue
  fi
  if [[ ! -f "$dst" ]]; then
    results+=("MISS_DST|$scope|$src|$dst")
    status="FAIL"
    continue
  fi

  src_sha="$(sha256sum "$src" | awk '{print $1}')"
  dst_sha="$(sha256sum "$dst" | awk '{print $1}')"
  if [[ "$src_sha" == "$dst_sha" ]]; then
    results+=("IN_SYNC|$scope|$src|$dst|$src_sha")
  else
    results+=("DRIFT|$scope|$src|$dst|$src_sha|$dst_sha")
    status="FAIL"
  fi
done

{
  echo "# Projects Sync Guard Report"
  echo
  echo "- captured_at_utc: ${ts_utc}"
  echo "- check_scope: root files vs projects contours"
  echo "- status: ${status}"
  echo
  echo "## Results"
  for r in "${results[@]}"; do
    IFS='|' read -r kind scope src dst sha1 sha2 <<< "$r"
    case "$kind" in
      IN_SYNC)
        echo "- IN_SYNC [${scope}] ${src} == ${dst} (${sha1})"
        ;;
      DRIFT)
        echo "- DRIFT [${scope}] ${src} != ${dst} (src=${sha1}, dst=${sha2})"
        ;;
      MISS_SRC)
        echo "- MISS_SRC [${scope}] ${src} (target ${dst})"
        ;;
      MISS_DST)
        echo "- MISS_DST [${scope}] ${dst} (source ${src})"
        ;;
    esac
  done
  echo
  echo "## Next"
  if [[ "$status" == "PASS" ]]; then
    echo "- No drift detected; safe to continue route-switch planning."
  else
    echo "- Drift detected; run controlled copy before cutover."
    echo "- Command: bash scripts/hard_extraction_apply.sh"
  fi
} > "$report_file"

echo "[sync-guard] report generated: $report_file"
echo "[sync-guard] status: $status"

if [[ "$status" != "PASS" ]]; then
  exit 1
fi
