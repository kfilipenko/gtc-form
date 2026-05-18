#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${ROOT_DIR:-/var/www/gtc-form}"
PUBLIC_SOURCE="${PUBLIC_SOURCE:-projects/crewportglobal/public}"
LIVE_ROOT="${LIVE_ROOT:-/var/www/crewportglobal.com}"
PUBLIC_BASE_URL="${PUBLIC_BASE_URL:-https://crewportglobal.com}"
LOCK_FILE="${LOCK_FILE:-/tmp/crewportglobal-public-deploy.lock}"

CPG_DEPLOY_GIT_PULL="${CPG_DEPLOY_GIT_PULL:-0}"
CPG_DEPLOY_RUN_I18N_CHECK="${CPG_DEPLOY_RUN_I18N_CHECK:-1}"
CPG_DEPLOY_RUN_SMOKE_CHECKS="${CPG_DEPLOY_RUN_SMOKE_CHECKS:-1}"
CPG_DEPLOY_DELETE_STALE="${CPG_DEPLOY_DELETE_STALE:-1}"
CPG_ALLOW_CREATE_LIVE_ROOT="${CPG_ALLOW_CREATE_LIVE_ROOT:-0}"

DRY_RUN=0

usage() {
  cat <<'USAGE'
CrewPortGlobal public/live deploy

Usage:
  projects/crewportglobal/scripts/deploy_public_live.sh [options]

Options:
  --dry-run        Show rsync changes without writing to live root.
  --git-pull       Run git pull --ff-only origin main before sync.
  --no-i18n        Skip public i18n validator.
  --no-smoke       Skip live HTTP smoke checks.
  --no-delete      Do not delete stale files from live root.
  -h, --help       Show this help.

Environment:
  ROOT_DIR                         Default: /var/www/gtc-form
  PUBLIC_SOURCE                    Default: projects/crewportglobal/public
  LIVE_ROOT                        Default: /var/www/crewportglobal.com
  PUBLIC_BASE_URL                  Default: https://crewportglobal.com
  CPG_DEPLOY_GIT_PULL              1 to pull before sync
  CPG_DEPLOY_RUN_I18N_CHECK        0 to skip i18n validation
  CPG_DEPLOY_RUN_SMOKE_CHECKS      0 to skip live smoke checks
  CPG_DEPLOY_DELETE_STALE          0 to avoid rsync --delete
  CPG_ALLOW_CREATE_LIVE_ROOT       1 to create missing live root

Scope:
  This script syncs only projects/crewportglobal/public/ to the live web root.
  It does not apply migrations, change backend code, reload nginx, or touch secrets.
USAGE
}

log() {
  printf '[cpg-public-deploy] %s\n' "$*"
}

fail() {
  printf '[cpg-public-deploy] ERROR: %s\n' "$*" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      ;;
    --git-pull)
      CPG_DEPLOY_GIT_PULL=1
      ;;
    --no-i18n)
      CPG_DEPLOY_RUN_I18N_CHECK=0
      ;;
    --no-smoke)
      CPG_DEPLOY_RUN_SMOKE_CHECKS=0
      ;;
    --no-delete)
      CPG_DEPLOY_DELETE_STALE=0
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      fail "unknown option: $1"
      ;;
  esac
  shift
done

command -v rsync >/dev/null 2>&1 || fail "rsync is required"
command -v curl >/dev/null 2>&1 || fail "curl is required"
command -v flock >/dev/null 2>&1 || fail "flock is required"

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  fail "another public deploy is already running"
fi

[[ -d "$ROOT_DIR" ]] || fail "ROOT_DIR does not exist: $ROOT_DIR"
cd "$ROOT_DIR"

SOURCE_PATH="$ROOT_DIR/$PUBLIC_SOURCE"
[[ -d "$SOURCE_PATH" ]] || fail "public source does not exist: $SOURCE_PATH"
[[ -f "$SOURCE_PATH/index.html" ]] || fail "public source is missing index.html"
[[ -f "$SOURCE_PATH/assets/crewportglobal-navigation.js" ]] || fail "public source is missing shared navigation asset"

case "$LIVE_ROOT" in
  ""|"/"|"/var"|"/var/www")
    fail "unsafe LIVE_ROOT: $LIVE_ROOT"
    ;;
esac

if [[ ! -d "$LIVE_ROOT" ]]; then
  if [[ "$CPG_ALLOW_CREATE_LIVE_ROOT" == "1" ]]; then
    mkdir -p "$LIVE_ROOT"
  else
    fail "LIVE_ROOT does not exist: $LIVE_ROOT"
  fi
fi

LIVE_REAL="$(realpath "$LIVE_ROOT")"
SOURCE_REAL="$(realpath "$SOURCE_PATH")"
[[ "$LIVE_REAL" != "$SOURCE_REAL" ]] || fail "LIVE_ROOT and PUBLIC_SOURCE must be different directories"

if [[ "$CPG_DEPLOY_GIT_PULL" == "1" ]]; then
  log "pulling latest main with fast-forward only"
  git pull --ff-only origin main
fi

if [[ "$CPG_DEPLOY_RUN_I18N_CHECK" == "1" ]]; then
  if command -v node >/dev/null 2>&1 && [[ -f projects/crewportglobal/scripts/check_public_i18n.js ]]; then
    log "running public i18n validator"
    node projects/crewportglobal/scripts/check_public_i18n.js
  else
    log "skipping i18n validator because node or validator script is unavailable"
  fi
fi

RSYNC_ARGS=(-av --exclude='.well-known/')
if [[ "$CPG_DEPLOY_DELETE_STALE" == "1" ]]; then
  RSYNC_ARGS+=(--delete)
fi
if [[ "$DRY_RUN" == "1" ]]; then
  RSYNC_ARGS+=(--dry-run)
fi

log "syncing public source to live root"
log "source: $SOURCE_REAL/"
log "live:   $LIVE_REAL/"
rsync "${RSYNC_ARGS[@]}" "$SOURCE_REAL"/ "$LIVE_REAL"/

if [[ "$DRY_RUN" == "1" ]]; then
  log "dry run completed; live root was not changed"
  exit 0
fi

if [[ "$CPG_DEPLOY_RUN_SMOKE_CHECKS" == "1" ]]; then
  log "running live smoke checks"
  curl -fsS "$PUBLIC_BASE_URL/api/v1/health" >/dev/null
  curl -fsSI "$PUBLIC_BASE_URL/" >/dev/null
  curl -fsSI "$PUBLIC_BASE_URL/register/" >/dev/null
  curl -fsSI "$PUBLIC_BASE_URL/cabinet/" >/dev/null
  curl -fsSL "$PUBLIC_BASE_URL/assets/crewportglobal-navigation.js" | grep -F "Account / Login" >/dev/null
  curl -fsSL "$PUBLIC_BASE_URL/register/" | grep -F "Create account and open cabinet" >/dev/null
fi

log "public live deploy completed"
