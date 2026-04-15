#!/usr/bin/env bash
set -euo pipefail

ROOT="/var/www"
REPO_ROOT="/var/www/gtc-form"
REPORT_DIR="${REPO_ROOT}/docs/runtime"
TS_UTC="$(date -u +"%Y-%m-%d %H:%M:%S+00")"
TS_FILE="$(date -u +"%Y%m%d-%H%M%SZ")"
REPORT_FILE="${REPORT_DIR}/storage-hygiene-audit-${TS_FILE}.md"

ACTIVE_ROOTS=(
  "gtc-form"
  "html"
)

PATTERNS=(
  "*.bak"
  "*.bak.*"
  "*.backup"
  "*.backup.*"
  "*.old"
)

mkdir -p "${REPORT_DIR}"

collect_matches() {
  local root="$1"
  local cmd=(find "$root" -type f "(")
  local first=1
  local pat
  for pat in "${PATTERNS[@]}"; do
    if [[ $first -eq 0 ]]; then
      cmd+=( -o )
    fi
    cmd+=( -name "$pat" )
    first=0
  done
  cmd+=( ")" -print )
  "${cmd[@]}" | sort
}

map_to_app() {
  local rel="$1"
  if [[ "$rel" == gtc-form/* ]]; then
    echo "gtc-core-web"
    return
  fi
  if [[ "$rel" == html/* ]]; then
    echo "payment-web"
    return
  fi
  echo "unknown"
}

proposed_backup_dir() {
  local app="$1"
  local date_prefix
  date_prefix="$(date -u +"%Y-%m-%d_%H%M%S")"
  echo "/var/www/backups/${app}/${date_prefix}_legacy-cleanup"
}

tmp_file="$(mktemp)"
trap 'rm -f "$tmp_file"' EXIT

: > "$tmp_file"
for active in "${ACTIVE_ROOTS[@]}"; do
  if [[ -d "${ROOT}/${active}" ]]; then
    collect_matches "${ROOT}/${active}" >> "$tmp_file"
  fi
done

total_matches="$(grep -c '.' "$tmp_file" || true)"
status="PASS"
if [[ "$total_matches" != "0" ]]; then
  status="WARN"
fi

{
  echo "# Storage Hygiene Audit Report"
  echo
  echo "- captured_at_utc: ${TS_UTC}"
  echo "- status: ${status}"
  echo "- scope: /var/www/gtc-form, /var/www/html"
  echo "- mode: dry-run (no file move)"
  echo "- matches: ${total_matches}"
  echo
  echo "## Patterns"
  for p in "${PATTERNS[@]}"; do
    echo "- ${p}"
  done
  echo
  echo "## Findings"
  if [[ "$total_matches" == "0" ]]; then
    echo "- No backup-like files found in active roots."
  else
    while IFS= read -r abs; do
      [[ -z "$abs" ]] && continue
      rel="${abs#${ROOT}/}"
      app="$(map_to_app "$rel")"
      dst="$(proposed_backup_dir "$app")"
      echo "- ${rel}"
      echo "  - app: ${app}"
      echo "  - proposed_backup_dir: ${dst}"
    done < "$tmp_file"
  fi
  echo
  echo "## Suggested Actions"
  if [[ "$total_matches" == "0" ]]; then
    echo "- No cleanup action required."
  else
    echo "- Prepare backup folders for listed apps."
    echo "- Move listed files out of active roots."
    echo "- Generate MANIFEST.txt, SHA256SUMS.txt, RESTORE.md in each backup folder."
    echo "- Append operation to /var/www/backups/BACKUP_INDEX.md."
    echo "- Add cleanup execution log in docs/ops/."
  fi
} > "$REPORT_FILE"

echo "[storage-audit] report generated: ${REPORT_FILE}"
echo "[storage-audit] status: ${status}"
if [[ "$status" == "WARN" ]]; then
  exit 2
fi
