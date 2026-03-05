# Manual Production Execution Attempt — 20260305-161906Z

Status: PARTIAL

| Step | Result | Details |
|---|---|---|
| copy_snippet | BLOCKED | PermissionError: [Errno 13] Permission denied: '/etc/nginx/conf.d/99-split-route-switch.conf' |
| nginx_test | BLOCKED | nginx: [alert] could not open error log file: open() "/var/log/nginx/error.log" failed (13: Permission denied) 2026/03/05 16:19:06 [warn] 1968070#1968070: the "user" directive makes sense only if the master process runs with super-user privileges, ignored in /etc/nginx/nginx.conf:1 2026/03/05 16:19:06 [emerg] 1968070#1968070: "location" directive is not allowed here in /var/www/gtc-form/projects/shared/nginx/rjaka-compat.conf:4 nginx: configuration file /etc/nginx/nginx.conf test failed |
| nginx_reload | BLOCKED | Failed to reload nginx.service: Interactive authentication required. See system logs and 'systemctl status nginx.service' for details. |

## Root-required command block

```bash
sudo cp /var/www/gtc-form/projects/shared/nginx/generated/split-route-switch-20260305-155728Z.conf /etc/nginx/conf.d/99-split-route-switch.conf
sudo nginx -t
sudo systemctl reload nginx
```
