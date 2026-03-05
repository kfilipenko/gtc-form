# Nginx Apply Success Report — 20260305-163422Z

Status: PASS

Applied actions:
- Removed conflicting include `projects/shared/nginx/gtstor-compat.conf` from active app server config.
- Moved `app.gtstor.com.bak*` files out of `/etc/nginx/sites-enabled` to `/etc/nginx/sites-backup` to avoid wildcard loading.
- Validated config and reloaded nginx.

## ls -1 /etc/nginx/sites-enabled

Exit code: 0
```
agent.gtstor.com
app.gtstor.com
dev
mcpn8n.gtstor.com
pay-gtstor
payment
vs.gtstor.com
```

## ls -1 /etc/nginx/sites-backup

Exit code: 0
```
app.gtstor.com.bak.20260305-162706Z
app.gtstor.com.bak.20260305-162941Z
app.gtstor.com.bak.20260305-163155Z
app.gtstor.com.bak.fix-20260305-163219Z
```

## nginx -t

Exit code: 0
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

## systemctl status nginx --no-pager -n 5

Exit code: 0
```
● nginx.service - A high performance web server and a reverse proxy server
     Loaded: loaded (/lib/systemd/system/nginx.service; enabled; vendor preset: enabled)
     Active: active (running) since Wed 2026-02-25 14:21:32 UTC; 1 week 1 day ago
       Docs: man:nginx(8)
    Process: 1972033 ExecReload=/usr/sbin/nginx -g daemon on; master_process on; -s reload (code=exited, status=0/SUCCESS)
   Main PID: 978 (nginx)
      Tasks: 5 (limit: 19185)
     Memory: 30.6M
        CPU: 1min 22.666s
     CGroup: /system.slice/nginx.service
             ├─    978 "nginx: master process /usr/sbin/nginx -g daemon on; master_process on;"
             ├─1972035 "nginx: worker process" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" ""
             ├─1972036 "nginx: worker process" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" ""
             ├─1972037 "nginx: worker process" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" ""
             └─1972038 "nginx: worker process" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" "" ""

Feb 25 14:21:29 GTC1 systemd[1]: Starting A high performance web server and a reverse proxy server...
Feb 25 14:21:32 GTC1 systemd[1]: Started A high performance web server and a reverse proxy server.
Mar 05 16:33:51 GTC1 systemd[1]: Reloading A high performance web server and a reverse proxy server...
Mar 05 16:33:52 GTC1 systemd[1]: Reloaded A high performance web server and a reverse proxy server.
```
