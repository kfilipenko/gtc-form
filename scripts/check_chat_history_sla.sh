#!/usr/bin/env bash
set -euo pipefail

PROBES="${PROBES:-10}"
TTFB_P95_MAX="${TTFB_P95_MAX:-0.800}"
ERROR_RATE_MAX="${ERROR_RATE_MAX:-0}"

URLS=(
  "https://rjaka.pro/chat/history/"
  "https://www.rjaka.pro/chat/history/"
)

pass() { printf '[PASS] %s\n' "$1"; }
fail() { printf '[FAIL] %s\n' "$1"; exit 1; }

calc_p95() {
  awk '
    {
      values[count++] = $1
    }
    END {
      if (count == 0) {
        print "nan"
        exit
      }
      asort(values)
      idx = int((count * 95 + 99) / 100)
      if (idx < 1) idx = 1
      if (idx > count) idx = count
      printf "%.6f", values[idx]
    }
  '
}

for url in "${URLS[@]}"; do
  printf 'URL=%s\n' "$url"

  tmp_file="$(mktemp)"
  trap 'rm -f "$tmp_file"' EXIT

  for _ in $(seq 1 "$PROBES"); do
    line="$(curl -k -sS -o /dev/null -w '%{http_code} %{time_starttransfer} %{time_total}' "$url")"
    printf '%s\n' "$line" >> "$tmp_file"
  done

  failures="$(awk '$1 != 200 { c++ } END { print c + 0 }' "$tmp_file")"
  error_rate="$(awk -v f="$failures" -v n="$PROBES" 'BEGIN { if (n==0) print 100; else printf "%.2f", (f*100)/n }')"
  avg_ttfb="$(awk '{ s += $2 } END { if (NR==0) print "nan"; else printf "%.6f", s/NR }' "$tmp_file")"
  p95_ttfb="$(awk '{ print $2 }' "$tmp_file" | calc_p95)"
  avg_total="$(awk '{ s += $3 } END { if (NR==0) print "nan"; else printf "%.6f", s/NR }' "$tmp_file")"

  printf 'probes=%s failures=%s error_rate=%s%% avg_ttfb=%ss p95_ttfb=%ss avg_total=%ss\n' \
    "$PROBES" "$failures" "$error_rate" "$avg_ttfb" "$p95_ttfb" "$avg_total"

  awk -v p95="$p95_ttfb" -v max="$TTFB_P95_MAX" 'BEGIN { if (p95+0 > max+0) exit 1 }' || fail "p95 TTFB exceeds threshold for $url (p95=${p95_ttfb}s, max=${TTFB_P95_MAX}s)"
  awk -v err="$error_rate" -v max="$ERROR_RATE_MAX" 'BEGIN { if (err+0 > max+0) exit 1 }' || fail "error rate exceeds threshold for $url (err=${error_rate}%, max=${ERROR_RATE_MAX}%)"

  pass "SLA checks passed for $url"
  rm -f "$tmp_file"
  trap - EXIT
  echo
done

echo "Chat history SLA checks passed."
