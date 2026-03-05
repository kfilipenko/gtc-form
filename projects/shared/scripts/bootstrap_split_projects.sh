#!/usr/bin/env bash
set -euo pipefail

ROOT="/var/www/gtc-form"

require_path() {
  local p="$1"
  if [[ ! -e "$p" ]]; then
    echo "[missing] $p"
    return 1
  fi
  echo "[ok] $p"
}

echo "[split-bootstrap] root: $ROOT"

fail=0
for p in \
  "$ROOT/projects/rjaka/web/game-chat.html" \
  "$ROOT/projects/rjaka/web/chat-qa.html" \
  "$ROOT/projects/rjaka/api/game_chat.php" \
  "$ROOT/projects/gtstor/web/index.html" \
  "$ROOT/projects/gtstor/api/chat_api.php" \
  "$ROOT/projects/shared/docs/split-implementation-manifest.md"; do
  require_path "$p" || fail=1
done

mkdir -p "$ROOT/projects/rjaka/runtime" "$ROOT/projects/gtstor/runtime" "$ROOT/projects/shared/runtime"

echo "[split-bootstrap] runtime dirs prepared under projects/*/runtime"

echo "[split-bootstrap] summary"
if [[ "$fail" -ne 0 ]]; then
  echo "status=FAIL"
  exit 1
fi

echo "status=PASS"
