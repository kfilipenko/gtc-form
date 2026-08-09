#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_ROOT="${PROJECT_ROOT}/public"
LIVE_ROOT="${LIVE_ROOT:-/var/www/travelgtc.com}"
LOCK_FILE="${LOCK_FILE:-/tmp/travelgtc-public-deploy.lock}"
PUBLIC_HOST="${PUBLIC_HOST:-travelgtc.com}"
LOCAL_SMOKE_IP="${LOCAL_SMOKE_IP:-127.0.0.1}"
LOCAL_SMOKE_SCHEME="${LOCAL_SMOKE_SCHEME:-https}"
DRY_RUN=0
SKIP_SMOKE=0

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --skip-smoke) SKIP_SMOKE=1 ;;
    *) echo "Unknown argument: $arg" >&2; exit 2 ;;
  esac
done

require_dir() {
  local label="$1"
  local path="$2"
  if [[ ! -d "$path" ]]; then
    echo "Missing ${label}: ${path}" >&2
    exit 1
  fi
}

case "$LIVE_ROOT" in
  /var/www/travelgtc.com|/var/www/travelgtc.com/*) ;;
  *) echo "Unsafe LIVE_ROOT: ${LIVE_ROOT}" >&2; exit 1 ;;
esac

require_dir "source root" "$SOURCE_ROOT"
mkdir -p "$LIVE_ROOT"

if [[ ! -w "$LIVE_ROOT" ]]; then
  echo "LIVE_ROOT is not writable by current user: ${LIVE_ROOT}" >&2
  echo "Create it with suitable ownership before running deploy." >&2
  exit 1
fi

command -v rsync >/dev/null || { echo "rsync is required" >&2; exit 1; }
command -v curl >/dev/null || { echo "curl is required" >&2; exit 1; }

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "Another TravelGTC deploy is already running." >&2
  exit 1
fi

rsync_args=(
  -a
  --delete
  --exclude '/assets/images/inbox/'
)

if [[ "$DRY_RUN" -eq 1 ]]; then
  rsync_args+=(--dry-run --itemize-changes)
fi

rsync "${rsync_args[@]}" "${SOURCE_ROOT}/" "${LIVE_ROOT}/"

if [[ "$DRY_RUN" -eq 1 || "$SKIP_SMOKE" -eq 1 ]]; then
  exit 0
fi

routes=(
  /
  /travel-lifestyle/
  /club/
  /create-trip/
  /business-model/
  /events/
  /about/
  /mira/
)

for route in "${routes[@]}"; do
  code="$(curl -sS -o /tmp/travelgtc-live-smoke.out -w '%{http_code}' --resolve "${PUBLIC_HOST}:443:${LOCAL_SMOKE_IP}" "${LOCAL_SMOKE_SCHEME}://${PUBLIC_HOST}${route}")"
  if [[ "$code" != "200" ]]; then
    echo "Smoke failed for ${route}: HTTP ${code}" >&2
    exit 1
  fi
done

grep -Eq "Travel Advantage|TravelGTC CRM" /tmp/travelgtc-live-smoke.out || {
  echo "Smoke marker not found in last checked route output." >&2
  exit 1
}

echo "TravelGTC public deploy completed: ${LIVE_ROOT}"
