#!/usr/bin/env bash
set -euo pipefail

APP_VHOST="/etc/nginx/sites-enabled/app.gtstor.com"
RJAKA_VHOST="/etc/nginx/sites-enabled/www.rjaka.pro"

pass() { printf '[PASS] %s\n' "$1"; }
fail() { printf '[FAIL] %s\n' "$1"; exit 1; }

read_file() {
  local path="$1"
  if [[ -r "$path" ]]; then
    cat "$path"
    return 0
  fi

  if command -v sudo >/dev/null 2>&1; then
    sudo cat "$path"
    return 0
  fi

  return 1
}

app_cfg="$(read_file "$APP_VHOST")" || fail "cannot read $APP_VHOST"
rjaka_cfg="$(read_file "$RJAKA_VHOST")" || fail "cannot read $RJAKA_VHOST"

if grep -q "include /var/www/gtc-form/docs/nginx/chat-internal.conf;" <<<"$app_cfg"; then
  pass "app vhost includes chat-internal.conf"
else
  fail "app vhost does not include chat-internal.conf"
fi

if grep -q "include /var/www/gtc-form/docs/nginx/chat-block-public.conf;" <<<"$app_cfg"; then
  pass "app vhost includes chat-block-public.conf"
else
  fail "app vhost does not include chat-block-public.conf"
fi

line_internal="$(grep -n "include /var/www/gtc-form/docs/nginx/chat-internal.conf;" <<<"$app_cfg" | head -n1 | cut -d: -f1)"
line_public="$(grep -n "include /var/www/gtc-form/docs/nginx/chat-block-public.conf;" <<<"$app_cfg" | head -n1 | cut -d: -f1)"
if [[ -n "$line_internal" && -n "$line_public" && "$line_internal" -lt "$line_public" ]]; then
  pass "app include order is correct (internal before public block)"
else
  fail "app include order is invalid (expected internal include before public include)"
fi

if grep -q "include /var/www/gtc-form/projects/shared/nginx/rjaka-compat.conf;" <<<"$rjaka_cfg"; then
  pass "rjaka vhost includes rjaka-compat.conf"
else
  fail "rjaka vhost does not include rjaka-compat.conf"
fi

if /var/www/gtc-form/scripts/check_chat_route_matrix.sh >/tmp/chat_route_matrix.out 2>&1; then
  pass "chat route matrix check passed"
else
  cat /tmp/chat_route_matrix.out
  fail "chat route matrix check failed"
fi

printf '\nChat routing lock check passed.\n'
