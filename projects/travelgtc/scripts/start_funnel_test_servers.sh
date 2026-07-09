#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
API_PORT="${TRAVELGTC_TEST_API_PORT:-4302}"
WEB_PORT="${TRAVELGTC_TEST_WEB_PORT:-4174}"

cleanup() {
  if [[ -n "${API_PID:-}" ]]; then
    kill "${API_PID}" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

(
  cd "${REPO_ROOT}"
  unset TRAVELGTC_DATABASE_URL
  TRAVELGTC_APP_ENV=test \
  TRAVELGTC_API_HOST=127.0.0.1 \
  TRAVELGTC_API_PORT="${API_PORT}" \
  TRAVELGTC_PUBLIC_LEAD_CAPTURE_ENABLED=false \
  TRAVELGTC_ACCOUNT_LEAD_CAPTURE_ENABLED=true \
  TRAVELGTC_AGENT_INTAKE_MODE=stub \
  TRAVELGTC_PARENT_NETWORK_MODE=none \
  npm --prefix projects/travelgtc/app run dev
) &
API_PID=$!

python3 -m http.server "${WEB_PORT}" --bind 127.0.0.1 --directory "${REPO_ROOT}/projects/travelgtc/public"
