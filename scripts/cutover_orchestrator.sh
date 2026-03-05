#!/usr/bin/env bash
set -euo pipefail

cd /var/www/gtc-form

usage() {
  cat <<'EOF'
Usage:
  bash scripts/cutover_orchestrator.sh start
  bash scripts/cutover_orchestrator.sh route-dry-run
  bash scripts/cutover_orchestrator.sh route-plan
  bash scripts/cutover_orchestrator.sh postcheck
  bash scripts/cutover_orchestrator.sh sync-guard
  bash scripts/cutover_orchestrator.sh finalize <GO|NO-GO> [output_file]

Commands:
  start      Run preflight start checks and generate docs/runtime/cutover-session-start-*.md
  route-dry-run Validate route switch readiness and generate docs/runtime/route-switch-dry-run-*.md
  route-plan Build route switch staging-plan artifacts and generate docs/runtime/route-switch-plan-*.md
  postcheck  Run post-cutover capture and generate docs/runtime/cutover-postcheck-*.md
  sync-guard Verify root/project contour file sync and generate docs/runtime/projects-sync-guard-*.md
  finalize   Generate final decision note from pre-final draft

Env vars for finalize (optional):
  DECISION_TIMESTAMP_UTC
  RELEASE_WINDOW
  RELEASE_OWNER
  INCIDENT_CHANNEL
EOF
}

if [[ $# -lt 1 ]]; then
  usage
  exit 2
fi

cmd="$1"
shift || true

case "$cmd" in
  start)
    bash scripts/cutover_session_start.sh
    ;;
  route-dry-run)
    bash scripts/route_switch_dry_run.sh
    ;;
  route-plan)
    bash scripts/route_switch_plan_build.sh
    ;;
  postcheck)
    bash scripts/cutover_postcheck_capture.sh
    ;;
  sync-guard)
    bash scripts/projects_sync_guard.sh
    ;;
  finalize)
    if [[ $# -lt 1 ]]; then
      echo "finalize requires <GO|NO-GO>" >&2
      usage
      exit 2
    fi
    bash scripts/cutover_finalize_note.sh "$@"
    ;;
  help|-h|--help)
    usage
    ;;
  *)
    echo "Unknown command: $cmd" >&2
    usage
    exit 2
    ;;
esac
