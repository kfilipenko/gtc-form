# RJAKA webhook probe

Timestamp (UTC): 20260305-170506Z

## Endpoint
`https://agent.gtstor.com/webhook/game-chat`

## Request payload
```json
{"chat_id":"stage-check-20260305","user_id":"stage-check-20260305","message":"Тест прямого webhook","session_id":"stage-check-20260305","channel":"web_support","client":{"full_name":null,"email":null,"gtc_user_id":null},"metadata":{"request_id":"stage-direct-20260305","page":"/game-chat.html"}}
```

## Response headers
```
HTTP/1.1 200 OK
Server: nginx/1.18.0 (Ubuntu)
Date: Thu, 05 Mar 2026 17:04:47 GMT
Content-Type: application/json; charset=utf-8
Transfer-Encoding: chunked
Connection: keep-alive
Vary: Accept-Encoding

```

## Response body size
```
0 /tmp/n8n-direct-body.txt
```
