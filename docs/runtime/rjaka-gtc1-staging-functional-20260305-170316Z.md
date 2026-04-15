# RJAKA staging functional check

Timestamp (UTC): 20260305-170316Z

## Request payload
```json
{"message":"Тест staging validate","chat_id":"stage-check-20260305","page":"/game-chat.html"}

```

## API response
```json
{"success":false,"error":"webhook_empty_response","message":"Webhook returned HTTP 200 with an empty body after retries."}
```

## Access log tail
```
10.0.0.4 - - [05/Mar/2026:16:58:32 +0000] "HEAD / HTTP/1.1" 302 0 "-" "curl/7.81.0"
10.0.0.4 - - [05/Mar/2026:16:58:32 +0000] "HEAD /game-chat.html HTTP/1.1" 200 0 "-" "curl/7.81.0"
10.0.0.4 - - [05/Mar/2026:16:58:32 +0000] "HEAD /chat-qa.html HTTP/1.1" 200 0 "-" "curl/7.81.0"
10.0.0.4 - - [05/Mar/2026:16:58:46 +0000] "HEAD / HTTP/1.1" 302 0 "-" "curl/7.81.0"
10.0.0.4 - - [05/Mar/2026:16:58:46 +0000] "HEAD /game-chat.html HTTP/1.1" 200 0 "-" "curl/7.81.0"
10.0.0.4 - - [05/Mar/2026:16:58:46 +0000] "HEAD /chat-qa.html HTTP/1.1" 200 0 "-" "curl/7.81.0"
10.0.0.4 - - [05/Mar/2026:17:00:56 +0000] "HEAD / HTTP/1.1" 302 0 "-" "curl/7.81.0"
10.0.0.4 - - [05/Mar/2026:17:00:56 +0000] "HEAD /game-chat.html HTTP/1.1" 200 0 "-" "curl/7.81.0"
10.0.0.4 - - [05/Mar/2026:17:01:09 +0000] "HEAD / HTTP/1.1" 302 0 "-" "curl/7.81.0"
10.0.0.4 - - [05/Mar/2026:17:01:09 +0000] "HEAD /game-chat.html HTTP/1.1" 200 0 "-" "curl/7.81.0"
10.0.0.4 - - [05/Mar/2026:17:02:49 +0000] "POST /game_chat.php HTTP/1.1" 502 133 "-" "curl/7.81.0"
10.0.0.4 - - [05/Mar/2026:17:02:49 +0000] "HEAD /game_chat.php HTTP/1.1" 405 0 "-" "curl/7.81.0"
```

## Error logs tail
```
[new-rjaka.error.log]

[nginx error.log]
2026/03/05 10:47:43 [error] 1886273#1886273: *82917 connect() failed (111: Unknown error) while connecting to upstream, client: 20.151.11.236, server: dev.gtstor.com, request: "GET /gettest.php HTTP/1.1", upstream: "http://127.0.0.1:3001/gettest.php", host: "dev.gtstor.com"
2026/03/05 10:47:43 [error] 1886273#1886273: *82917 connect() failed (111: Unknown error) while connecting to upstream, client: 20.151.11.236, server: dev.gtstor.com, request: "GET /acp.php HTTP/1.1", upstream: "http://127.0.0.1:3001/acp.php", host: "dev.gtstor.com"
2026/03/05 10:47:43 [error] 1886273#1886273: *82917 connect() failed (111: Unknown error) while connecting to upstream, client: 20.151.11.236, server: dev.gtstor.com, request: "GET /database.php HTTP/1.1", upstream: "http://127.0.0.1:3001/database.php", host: "dev.gtstor.com"
2026/03/05 10:51:50 [error] 1886273#1886273: *82997 directory index of "/var/www/html/" is forbidden, client: 43.128.149.102, server: pay.gtstor.com, request: "GET / HTTP/1.1", host: "pay.gtstor.com", referrer: "http://pay.gtstor.com"
2026/03/05 12:22:42 [error] 1886273#1886273: *83407 upstream sent no valid HTTP/1.0 header while reading response header from upstream, client: 3.233.59.216, server: mcpn8n.gtstor.com, request: "GET / HTTP/1.1", upstream: "http://127.0.0.1:3333/", host: "mcpn8n.gtstor.com"
2026/03/05 13:12:18 [crit] 1886273#1886273: *83594 SSL_do_handshake() failed (SSL: error:0A00006C:SSL routines::bad key share) while SSL handshaking, client: 188.166.20.18, server: 0.0.0.0:443
2026/03/05 13:46:28 [crit] 1886273#1886273: *83731 SSL_do_handshake() failed (SSL: error:0A00006C:SSL routines::bad key share) while SSL handshaking, client: 64.227.33.79, server: 0.0.0.0:443
2026/03/05 14:51:28 [notice] 1949501#1949501: signal process started
2026/03/05 14:51:34 [notice] 1949562#1949562: signal process started
2026/03/05 16:27:06 [emerg] 1969941#1969941: duplicate location "/chat/" in /var/www/gtc-form/docs/nginx/chat-block-public.conf:4
2026/03/05 16:29:41 [emerg] 1970901#1970901: duplicate location "/chat/" in /var/www/gtc-form/docs/nginx/chat-block-public.conf:4
2026/03/05 16:31:55 [emerg] 1971329#1971329: duplicate location "/chat/" in /var/www/gtc-form/docs/nginx/chat-block-public.conf:4
2026/03/05 16:32:19 [emerg] 1971486#1971486: duplicate location "/chat/" in /var/www/gtc-form/docs/nginx/chat-block-public.conf:4
2026/03/05 16:32:57 [emerg] 1971740#1971740: duplicate location "/chat/" in /var/www/gtc-form/docs/nginx/chat-block-public.conf:4
2026/03/05 16:33:51 [notice] 1972033#1972033: signal process started
2026/03/05 16:47:31 [error] 1972036#1972036: *84239 upstream sent no valid HTTP/1.0 header while reading response header from upstream, client: 185.193.156.153, server: mcpn8n.gtstor.com, request: "GET / HTTP/1.1", upstream: "http://127.0.0.1:3333/", host: "mcpn8n.gtstor.com"
2026/03/05 16:48:31 [error] 1972036#1972036: *84242 upstream sent no valid HTTP/1.0 header while reading response header from upstream, client: 185.193.156.153, server: mcpn8n.gtstor.com, request: "GET //wp-includes/wlwmanifest.xml HTTP/1.1", upstream: "http://127.0.0.1:3333//wp-includes/wlwmanifest.xml", host: "mcpn8n.gtstor.com"
2026/03/05 16:49:06 [crit] 1972036#1972036: *84274 SSL_do_handshake() failed (SSL: error:0A00006C:SSL routines::bad key share) while SSL handshaking, client: 178.128.230.160, server: 0.0.0.0:443
2026/03/05 16:58:24 [notice] 1977556#1977556: signal process started
2026/03/05 17:00:56 [notice] 1978209#1978209: signal process started
```
