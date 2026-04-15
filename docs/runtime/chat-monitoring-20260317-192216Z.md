# Chat Monitoring Report

- captured_at_utc: 2026-03-17 19:22:16+00
- host: GTC1
- report_version: 1

## Checks
- chat_route_matrix: PASS

## chat_route_matrix (PASS)

```text
[PASS] app /chat/ serves admin chat marker
[PASS] app /chat/ does not expose RJAKA marker
[PASS] app /chat/index.html redirects
[PASS] rjaka /chat/ serves RJAKA content
[PASS] rjaka /chat/history/ serves history page marker
[PASS] www.rjaka /chat/history/ serves history page marker
[PASS] rjaka /chat/history redirects to trailing slash
[PASS] www.rjaka /chat/history redirects to trailing slash
[PASS] legacy /game-chat.html redirects to canonical /chat/
[PASS] legacy /chat-qa.html redirects to canonical /chat/history/

All chat route matrix checks passed.
```
- chat_routing_lock: PASS

## chat_routing_lock (PASS)

```text
[PASS] app vhost includes chat-internal.conf
[PASS] app vhost includes chat-block-public.conf
[PASS] app include order is correct (internal before public block)
[PASS] rjaka vhost includes rjaka-compat.conf
[PASS] chat route matrix check passed

Chat routing lock check passed.
```
- chat_history_sla: PASS

## chat_history_sla (PASS)

```text
URL=https://rjaka.pro/chat/history/
probes=10 failures=0 error_rate=0.00% avg_ttfb=0.030639s p95_ttfb=0.058734s avg_total=0.030697s
[PASS] SLA checks passed for https://rjaka.pro/chat/history/

URL=https://www.rjaka.pro/chat/history/
probes=10 failures=0 error_rate=0.00% avg_ttfb=0.017951s p95_ttfb=0.043750s avg_total=0.018015s
[PASS] SLA checks passed for https://www.rjaka.pro/chat/history/

Chat history SLA checks passed.
```

## Overall

- status: PASS
