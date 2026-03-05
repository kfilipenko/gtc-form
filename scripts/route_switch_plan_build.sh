#!/usr/bin/env bash
set -euo pipefail

ROOT="/var/www/gtc-form"
cd "$ROOT"

ts_utc="$(date -u +"%Y-%m-%d %H:%M:%S+00")"
ts_file="$(date -u +"%Y%m%d-%H%M%SZ")"
report_dir="docs/runtime"
gen_dir="projects/shared/nginx/generated"
report_file="${report_dir}/route-switch-plan-${ts_file}.md"
snippet_file="${gen_dir}/split-route-switch-${ts_file}.conf"

mkdir -p "$report_dir" "$gen_dir"

status="PASS"
for p in \
  "projects/shared/nginx/rjaka-compat.conf" \
  "projects/shared/nginx/gtstor-compat.conf" \
  "projects/rjaka/web/game-chat.html" \
  "projects/gtstor/web/index.html"; do
  if [[ ! -e "$p" ]]; then
    status="FAIL"
  fi
done

cat > "$snippet_file" <<EOF
# Generated route switch include snippet
# generated_at_utc: ${ts_utc}
# mode: dry-plan (do not apply directly in production without review)

# RJAKA compatibility include
include /var/www/gtc-form/projects/shared/nginx/rjaka-compat.conf;

# GTSTOR compatibility include
include /var/www/gtc-form/projects/shared/nginx/gtstor-compat.conf;
EOF

latest_sync_guard="$(ls -1t docs/runtime/projects-sync-guard-*.md 2>/dev/null | head -n1 || true)"
latest_route_dry="$(ls -1t docs/runtime/route-switch-dry-run-*.md 2>/dev/null | head -n1 || true)"

if [[ -z "$latest_sync_guard" || -z "$latest_route_dry" ]]; then
  status="FAIL"
fi

{
  echo "# Route Switch Plan Build"
  echo
  echo "- built_at_utc: ${ts_utc}"
  echo "- status: ${status}"
  echo "- generated_snippet: ${snippet_file}"
  echo
  echo "## Inputs"
  echo "- RJAKA nginx template: projects/shared/nginx/rjaka-compat.conf"
  echo "- GTSTOR nginx template: projects/shared/nginx/gtstor-compat.conf"
  echo "- latest sync-guard: ${latest_sync_guard:-missing}"
  echo "- latest route-dry-run: ${latest_route_dry:-missing}"
  echo
  echo "## Planned sequence"
  echo "1. Review generated snippet and templates."
  echo "2. Apply in staging nginx include chain only."
  echo "3. Run section 4 smoke checks from docs/cutover-checklist.md."
  echo "4. Execute orchestrator postcheck + sync-guard."
  echo "5. Finalize GO/NO-GO note."
  echo
  echo "## Result"
  if [[ "$status" == "PASS" ]]; then
    echo "- Route switch plan artifact is ready for staging review."
  else
    echo "- Missing prerequisites; resolve before staging apply."
  fi
} > "$report_file"

echo "[route-plan] report generated: $report_file"
echo "[route-plan] snippet generated: $snippet_file"
echo "[route-plan] status: $status"

if [[ "$status" != "PASS" ]]; then
  exit 1
fi
