#!/usr/bin/env bash
set -euo pipefail

ROOT="/var/www"
REPO_ROOT="/var/www/gtc-form"
REPORT_DIR="${REPO_ROOT}/docs/runtime"
BACKUP_ROOT="/var/www/backups"
CONFIRM_TOKEN="I_UNDERSTAND_STORAGE_MOVE"
MODE="plan"
CONFIRM_VALUE=""
REASON="legacy-cleanup"

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

usage() {
  cat << 'EOF'
Usage:
  bash scripts/storage_hygiene_remediate.sh [--mode plan|execute] [--confirm TOKEN] [--reason TEXT]

Modes:
  --mode plan      Build remediation plan only (default). No file changes.
  --mode execute   Move matched files to structured backup folders.

Safety:
  Execute mode requires:
    --confirm I_UNDERSTAND_STORAGE_MOVE

Examples:
  bash scripts/storage_hygiene_remediate.sh --mode plan
  bash scripts/storage_hygiene_remediate.sh --mode execute --confirm I_UNDERSTAND_STORAGE_MOVE --reason weekly-cleanup
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode)
      MODE="${2:-}"
      shift 2
      ;;
    --confirm)
      CONFIRM_VALUE="${2:-}"
      shift 2
      ;;
    --reason)
      REASON="${2:-}"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ "$MODE" != "plan" && "$MODE" != "execute" ]]; then
  echo "Invalid --mode: $MODE (expected plan|execute)" >&2
  exit 1
fi

mkdir -p "$REPORT_DIR"

TS_UTC="$(date -u +"%Y-%m-%d %H:%M:%S+00")"
TS_FOLDER="$(date -u +"%Y-%m-%d_%H%M%S")"
TS_FILE="$(date -u +"%Y%m%d-%H%M%SZ")"
REPORT_FILE="${REPORT_DIR}/storage-hygiene-remediation-${MODE}-${TS_FILE}.md"

tmp_matches="$(mktemp)"
tmp_by_app="$(mktemp)"
trap 'rm -f "$tmp_matches" "$tmp_by_app"' EXIT

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

build_backup_dir() {
  local app="$1"
  echo "${BACKUP_ROOT}/${app}/${TS_FOLDER}_${REASON}"
}

: > "$tmp_matches"
for active in "${ACTIVE_ROOTS[@]}"; do
  if [[ -d "${ROOT}/${active}" ]]; then
    collect_matches "${ROOT}/${active}" >> "$tmp_matches"
  fi
done

# Normalize and deduplicate as relative paths from /var/www.
sed "s#^${ROOT}/##" "$tmp_matches" | sed '/^$/d' | sort -u > "$tmp_matches.norm"
mv "$tmp_matches.norm" "$tmp_matches"

match_count="$(grep -c '.' "$tmp_matches" || true)"
status="PASS"
if [[ "$match_count" != "0" ]]; then
  status="WARN"
fi

if [[ "$MODE" == "execute" && "$CONFIRM_VALUE" != "$CONFIRM_TOKEN" ]]; then
  status="BLOCKED"
fi

{
  echo "# Storage Hygiene Remediation Report"
  echo
  echo "- captured_at_utc: ${TS_UTC}"
  echo "- mode: ${MODE}"
  echo "- status: ${status}"
  echo "- scope: /var/www/gtc-form, /var/www/html"
  echo "- reason: ${REASON}"
  echo "- matches: ${match_count}"
  echo
  echo "## Patterns"
  for p in "${PATTERNS[@]}"; do
    echo "- ${p}"
  done
  echo
  echo "## Findings"
  if [[ "$match_count" == "0" ]]; then
    echo "- No backup-like files found in active roots."
  else
    while IFS= read -r rel; do
      [[ -z "$rel" ]] && continue
      app="$(map_to_app "$rel")"
      dst="$(build_backup_dir "$app")"
      echo "- ${rel}"
      echo "  - app: ${app}"
      echo "  - target_backup_dir: ${dst}"
    done < "$tmp_matches"
  fi

  if [[ "$MODE" == "execute" && "$status" == "BLOCKED" ]]; then
    echo
    echo "## Safety"
    echo "- Execute mode blocked: missing/invalid confirmation token."
    echo "- Required: --confirm ${CONFIRM_TOKEN}"
  fi
} > "$REPORT_FILE"

if [[ "$MODE" == "plan" ]]; then
  echo "[storage-remediate] report generated: ${REPORT_FILE}"
  echo "[storage-remediate] mode=plan status=${status} matches=${match_count}"
  if [[ "$status" == "WARN" ]]; then
    exit 2
  fi
  exit 0
fi

if [[ "$status" == "BLOCKED" ]]; then
  echo "[storage-remediate] report generated: ${REPORT_FILE}"
  echo "[storage-remediate] execute blocked: missing/invalid --confirm token"
  exit 3
fi

if [[ "$match_count" == "0" ]]; then
  {
    echo
    echo "## Execution"
    echo "- No moves required."
  } >> "$REPORT_FILE"
  echo "[storage-remediate] report generated: ${REPORT_FILE}"
  echo "[storage-remediate] mode=execute status=PASS matches=0"
  exit 0
fi

# Group files by app for per-app backup package metadata.
: > "$tmp_by_app"
while IFS= read -r rel; do
  [[ -z "$rel" ]] && continue
  app="$(map_to_app "$rel")"
  echo "${app}|${rel}" >> "$tmp_by_app"
done < "$tmp_matches"

moved_total=0
apps_touched=""

while IFS='|' read -r app _; do
  [[ -z "$app" ]] && continue
  if [[ " $apps_touched " == *" $app "* ]]; then
    continue
  fi
  apps_touched+=" $app"

  backup_dir="$(build_backup_dir "$app")"
  files_dir="${backup_dir}/files"
  mkdir -p "$files_dir"

  app_list_file="${backup_dir}/moved_files.txt"
  : > "$app_list_file"

  while IFS='|' read -r app2 rel; do
    [[ "$app2" != "$app" ]] && continue
    src="${ROOT}/${rel}"
    if [[ ! -f "$src" ]]; then
      continue
    fi
    mkdir -p "${files_dir}/$(dirname "$rel")"
    mv "$src" "${files_dir}/${rel}"
    echo "$rel" >> "$app_list_file"
    moved_total=$((moved_total + 1))
  done < "$tmp_by_app"

  {
    echo "Backup: ${app} remediation"
    echo "Timestamp (UTC): ${TS_UTC}"
    echo "Mode: execute"
    echo "Reason: ${REASON}"
    echo "Files moved:"
    cat "$app_list_file"
  } > "${backup_dir}/MANIFEST.txt"

  {
    echo "Restore steps for ${app} remediation"
    echo "1) cd /var/www"
    echo "2) while read -r rel; do [ -z \"\$rel\" ] && continue; mkdir -p \"/var/www/\$(dirname \"\$rel\")\"; mv \"${files_dir}/\$rel\" \"/var/www/\$rel\"; done < \"${app_list_file}\""
  } > "${backup_dir}/RESTORE.md"

  ( cd "$files_dir" && find . -type f -print0 | sort -z | xargs -0 sha256sum ) > "${backup_dir}/SHA256SUMS.txt"

  if [[ ! -f "${BACKUP_ROOT}/BACKUP_INDEX.md" ]]; then
    printf "# Backup Index\n\n" > "${BACKUP_ROOT}/BACKUP_INDEX.md"
  fi
  echo "- ${TS_FOLDER}: ${app} remediation (${REASON}) -> ${backup_dir}" >> "${BACKUP_ROOT}/BACKUP_INDEX.md"

done < "$tmp_by_app"

{
  echo
  echo "## Execution"
  echo "- moved_files_total: ${moved_total}"
  for app in $apps_touched; do
    [[ -z "$app" ]] && continue
    echo "- backup_package: $(build_backup_dir "$app")"
  done
} >> "$REPORT_FILE"

echo "[storage-remediate] report generated: ${REPORT_FILE}"
echo "[storage-remediate] mode=execute status=PASS moved=${moved_total}"
