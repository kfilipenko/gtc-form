#!/usr/bin/env bash
set -euo pipefail

APP_CHAT_URL="https://app.gtstor.com/chat/"
APP_CHAT_INDEX_URL="https://app.gtstor.com/chat/index.html"
RJAKA_CHAT_URL="https://rjaka.pro/chat/"
RJAKA_HISTORY_URL="https://rjaka.pro/chat/history/"
RJAKA_HISTORY_WWW_URL="https://www.rjaka.pro/chat/history/"
RJAKA_HISTORY_NO_SLASH_URL="https://rjaka.pro/chat/history"
RJAKA_HISTORY_WWW_NO_SLASH_URL="https://www.rjaka.pro/chat/history"
RJAKA_LEGACY_GAME_URL="https://rjaka.pro/game-chat.html"
RJAKA_LEGACY_QA_URL="https://rjaka.pro/chat-qa.html"

pass() { printf '[PASS] %s\n' "$1"; }
fail() { printf '[FAIL] %s\n' "$1"; exit 1; }

app_chat_html="$(curl -fsSL "$APP_CHAT_URL")"
if grep -q "GTC • Web Chat" <<<"$app_chat_html"; then
  pass "app /chat/ serves admin chat marker"
else
  fail "app /chat/ does not contain admin marker"
fi

if grep -q "РЖАКА - Ваш помощник в игре" <<<"$app_chat_html"; then
  fail "app /chat/ still contains RJAKA marker"
else
  pass "app /chat/ does not expose RJAKA marker"
fi

index_status="$(curl -fsS -o /dev/null -w '%{http_code}' "$APP_CHAT_INDEX_URL")"
if [[ "$index_status" == "302" || "$index_status" == "301" ]]; then
  pass "app /chat/index.html redirects"
else
  fail "app /chat/index.html is expected to redirect, got HTTP $index_status"
fi

rjaka_chat_html="$(curl -fsSL "$RJAKA_CHAT_URL")"
if grep -q "РЖАКА" <<<"$rjaka_chat_html"; then
  pass "rjaka /chat/ serves RJAKA content"
else
  fail "rjaka /chat/ does not contain RJAKA marker"
fi

rjaka_history_html="$(curl -fsSL "$RJAKA_HISTORY_URL")"
if grep -q "РЖАКА — Вопросы и ответы" <<<"$rjaka_history_html"; then
  pass "rjaka /chat/history/ serves history page marker"
else
  fail "rjaka /chat/history/ does not contain history page marker"
fi

rjaka_history_www_html="$(curl -fsSL "$RJAKA_HISTORY_WWW_URL")"
if grep -q "РЖАКА — Вопросы и ответы" <<<"$rjaka_history_www_html"; then
  pass "www.rjaka /chat/history/ serves history page marker"
else
  fail "www.rjaka /chat/history/ does not contain history page marker"
fi

history_status="$(curl -fsS -o /dev/null -w '%{http_code}' "$RJAKA_HISTORY_NO_SLASH_URL")"
if [[ "$history_status" == "302" || "$history_status" == "301" ]]; then
  pass "rjaka /chat/history redirects to trailing slash"
else
  fail "rjaka /chat/history is expected to redirect, got HTTP $history_status"
fi

history_www_status="$(curl -fsS -o /dev/null -w '%{http_code}' "$RJAKA_HISTORY_WWW_NO_SLASH_URL")"
if [[ "$history_www_status" == "302" || "$history_www_status" == "301" ]]; then
  pass "www.rjaka /chat/history redirects to trailing slash"
else
  fail "www.rjaka /chat/history is expected to redirect, got HTTP $history_www_status"
fi

legacy_game_location="$(curl -fsS -o /dev/null -w '%{redirect_url}' "$RJAKA_LEGACY_GAME_URL")"
if [[ "$legacy_game_location" == "https://rjaka.pro/chat/" || "$legacy_game_location" == "https://www.rjaka.pro/chat/" ]]; then
  pass "legacy /game-chat.html redirects to canonical /chat/"
else
  fail "legacy /game-chat.html is expected to redirect to /chat/, got '$legacy_game_location'"
fi

legacy_qa_location="$(curl -fsS -o /dev/null -w '%{redirect_url}' "$RJAKA_LEGACY_QA_URL")"
if [[ "$legacy_qa_location" == "https://rjaka.pro/chat/history/" || "$legacy_qa_location" == "https://www.rjaka.pro/chat/history/" ]]; then
  pass "legacy /chat-qa.html redirects to canonical /chat/history/"
else
  fail "legacy /chat-qa.html is expected to redirect to /chat/history/, got '$legacy_qa_location'"
fi

printf '\nAll chat route matrix checks passed.\n'
