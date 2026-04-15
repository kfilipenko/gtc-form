# Staging hardening evidence

Timestamp (UTC): 20260305-170109Z

## Access policy snippet
```nginx
    server_name new-rjaka.gtstor.com;

    root /var/www/gtc-form;

    allow 127.0.0.1;
    allow 10.0.0.0/8;
    deny all;
    index game-chat.html;

    access_log /var/log/nginx/new-rjaka.access.log;
    error_log  /var/log/nginx/new-rjaka.error.log;

    location = / {
        return 302 /game-chat.html;
    }

    include /var/www/gtc-form/projects/shared/nginx/rjaka-compat.conf;

    location /assets/ {
        alias /var/www/gtc-form/assets/;
        expires 1h;
        add_header Cache-Control "public";
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.1-fpm.sock;
    }
```

## Nginx validation
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

## Local smoke
```
IP=10.0.0.4
HTTP/1.1 302 Moved Temporarily
Server: nginx/1.18.0 (Ubuntu)
Date: Thu, 05 Mar 2026 17:01:09 GMT
Content-Type: text/html
Content-Length: 154
---
HTTP/1.1 200 OK
Server: nginx/1.18.0 (Ubuntu)
Date: Thu, 05 Mar 2026 17:01:09 GMT
Content-Type: text/html
Content-Length: 15042
```
