# RJAKA staging host setup — 20260305-165846Z

- gtc1_ip: 10.0.0.4

## sudo -n ls -l /etc/nginx/sites-available/new-rjaka.gtstor.com

Exit: 0
```
-rw-r--r-- 1 root root 618 Mar  5 16:58 /etc/nginx/sites-available/new-rjaka.gtstor.com
```

## sudo -n ls -l /etc/nginx/sites-enabled/new-rjaka.gtstor.com

Exit: 0
```
lrwxrwxrwx 1 root root 47 Mar  5 16:58 /etc/nginx/sites-enabled/new-rjaka.gtstor.com -> /etc/nginx/sites-available/new-rjaka.gtstor.com
```

## sudo -n nginx -t

Exit: 0
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

## curl -sS -I --resolve new-rjaka.gtstor.com:80:10.0.0.4 http://new-rjaka.gtstor.com/

Exit: 0
```
HTTP/1.1 302 Moved Temporarily
Server: nginx/1.18.0 (Ubuntu)
Date: Thu, 05 Mar 2026 16:58:46 GMT
Content-Type: text/html
Content-Length: 154
Location: http://new-rjaka.gtstor.com/game-chat.html
Connection: keep-alive
```

## curl -sS -I --resolve new-rjaka.gtstor.com:80:10.0.0.4 http://new-rjaka.gtstor.com/game-chat.html

Exit: 0
```
HTTP/1.1 200 OK
Server: nginx/1.18.0 (Ubuntu)
Date: Thu, 05 Mar 2026 16:58:46 GMT
Content-Type: text/html
Content-Length: 15042
Last-Modified: Thu, 05 Mar 2026 12:34:29 GMT
Connection: keep-alive
ETag: "69a97855-3ac2"
Accept-Ranges: bytes
```

## curl -sS -I --resolve new-rjaka.gtstor.com:80:10.0.0.4 http://new-rjaka.gtstor.com/chat-qa.html

Exit: 0
```
HTTP/1.1 200 OK
Server: nginx/1.18.0 (Ubuntu)
Date: Thu, 05 Mar 2026 16:58:46 GMT
Content-Type: text/html
Content-Length: 21795
Last-Modified: Thu, 05 Mar 2026 11:56:38 GMT
Connection: keep-alive
ETag: "69a96f76-5523"
Accept-Ranges: bytes
```
