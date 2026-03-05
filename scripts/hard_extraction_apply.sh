#!/usr/bin/env bash
set -euo pipefail

ROOT="/var/www/gtc-form"
cd "$ROOT"

ts_utc="$(date -u +"%Y-%m-%d %H:%M:%S+00")"
ts_file="$(date -u +"%Y%m%d-%H%M%SZ")"
report_dir="docs/runtime"
report_file="${report_dir}/hard-extraction-apply-${ts_file}.md"

mkdir -p "$report_dir"

mappings=(
  "game-chat.html|projects/rjaka/web/game-chat.html"
  "chat-qa.html|projects/rjaka/web/chat-qa.html"
  "game_chat.php|projects/rjaka/api/game_chat.php"
  "admin/chat-qa.php|projects/rjaka/api/admin/chat-qa.php"
  "admin/chat-qa-feedback.php|projects/rjaka/api/admin/chat-qa-feedback.php"
  "index.html|projects/gtstor/web/index.html"
  "chat/index.html|projects/gtstor/web/chat/index.html"
  "chat/internal/index.html|projects/gtstor/web/chat/internal/index.html"
  "user/index.html|projects/gtstor/web/user/index.html"
  "news/index.html|projects/gtstor/web/news/index.html"
  "chat_api.php|projects/gtstor/api/chat_api.php"
  "chat_api2.php|projects/gtstor/api/chat_api2.php"
)

status="PASS"
results=()

for map in "${mappings[@]}"; do
  src="${map%%|*}"
  dst="${map##*|}"

  if [[ ! -f "$src" ]]; then
    results+=("MISS_SRC|$src|$dst")
    status="FAIL"
    continue
  fi

  mkdir -p "$(dirname "$dst")"
  cp "$src" "$dst"

  src_sha="$(sha256sum "$src" | awk '{print $1}')"
  dst_sha="$(sha256sum "$dst" | awk '{print $1}')"

  if [[ "$src_sha" == "$dst_sha" ]]; then
    results+=("COPIED_OK|$src|$dst|$src_sha")
  else
    results+=("COPIED_MISMATCH|$src|$dst|$src_sha|$dst_sha")
    status="FAIL"
  fi
done

{
  echo "# Hard Extraction Apply Report"
  echo
  echo "- applied_at_utc: ${ts_utc}"
  echo "- mode: controlled native copy into projects/*"
  echo "- status: ${status}"
  echo
  echo "## File mapping results"
  for row in "${results[@]}"; do
    IFS='|' read -r a b c d e <<< "$row"
    case "$a" in
      COPIED_OK)
        echo "- ${a}: ${b} -> ${c} (${d})"
        ;;
      COPIED_MISMATCH)
        echo "- ${a}: ${b} -> ${c} (src=${d}, dst=${e})"
        ;;
      MISS_SRC)
        echo "- ${a}: ${b} -> ${c}"
        ;;
    esac
  done
  echo
  echo "## Next"
  echo "1. Run bash scripts/hard_extraction_dry_run.sh"
  echo "2. Validate PHP syntax for copied API files"
  echo "3. Archive this report in release ticket"
} > "$report_file"

echo "[hard-extraction-apply] report generated: $report_file"
echo "[hard-extraction-apply] status: $status"

if [[ "$status" != "PASS" ]]; then
  exit 1
fi
