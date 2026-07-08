# TRAVELGTC-DEPLOY-001 - Public Nginx Publication Report

- Project: TravelGTC
- Environment: GTC1 server
- Public base URL: `https://travelgtc.com/`
- Document type: Deploy/release report
- Version: 0.1
- Date: 2026-07-08
- Status: Server-side publication and SSL completed, DNS cache propagation pending

## 1. Purpose

This report fixes the server-side publication of the first Travel Network Lab prototype.

The site is deployed on this server and has a valid Let's Encrypt certificate. Timeweb authoritative DNS now points to this server, but some public recursive DNS caches may temporarily keep old `A` / `AAAA` values.

## 2. Release Scope

1. Added TravelGTC nginx vhost template.
2. Added repeatable public deploy script.
3. Created live root `/var/www/travelgtc.com`.
4. Synced `projects/travelgtc/public/` to live root.
5. Excluded `assets/images/inbox/` from live publication.
6. Installed nginx config to `/etc/nginx/sites-available/travelgtc.com.conf`.
7. Enabled nginx site through `/etc/nginx/sites-enabled/travelgtc.com.conf`.
8. Issued Let's Encrypt certificate for `travelgtc.com` and `www.travelgtc.com`.
9. Reloaded nginx with HTTPS redirects and canonical `www` to root redirect.

## 3. Deploy Command

```bash
projects/travelgtc/scripts/deploy_public_live.sh
```

System install commands applied:

```bash
sudo install -d -o kfilipenko -g www-data -m 2775 /var/www/travelgtc.com
sudo install -m 0644 projects/travelgtc/deploy/nginx/travelgtc.com.conf /etc/nginx/sites-available/travelgtc.com.conf
sudo ln -sfn /etc/nginx/sites-available/travelgtc.com.conf /etc/nginx/sites-enabled/travelgtc.com.conf
sudo nginx -t
sudo systemctl reload nginx
sudo certbot certonly --webroot -w /var/www/travelgtc.com -d travelgtc.com -d www.travelgtc.com --non-interactive --agree-tos
```

## 4. Pre-Deploy Checks

```bash
bash -n projects/travelgtc/scripts/deploy_public_live.sh
sudo nginx -t
```

Result:

```text
PASS: deploy script syntax check passed.
PASS: nginx configuration syntax is ok.
PASS: nginx configuration test is successful.
PASS: Let's Encrypt certificate issued for `travelgtc.com` and `www.travelgtc.com`.
```

## 5. Live Smoke Checks

Local nginx Host-header routes:

```bash
curl -H 'Host: travelgtc.com' http://127.0.0.1/
curl -H 'Host: travelgtc.com' http://127.0.0.1/travel-lifestyle/
curl -H 'Host: travelgtc.com' http://127.0.0.1/club/
curl -H 'Host: travelgtc.com' http://127.0.0.1/create-trip/
curl -H 'Host: travelgtc.com' http://127.0.0.1/business-model/
curl -H 'Host: travelgtc.com' http://127.0.0.1/events/
curl -H 'Host: travelgtc.com' http://127.0.0.1/about/
curl -H 'Host: travelgtc.com' http://127.0.0.1/contacts/
```

Result:

```text
PASS: all local Host-header route checks returned HTTP 200.
PASS: public-IP Host-header check returned HTTP 200 at http://20.91.187.79/ with Host travelgtc.com.
PASS: HTTPS checks with forced DNS to `20.91.187.79` returned HTTP 200 for all prototype routes.
PASS: `http://travelgtc.com/` redirects to `https://travelgtc.com/`.
PASS: `http://www.travelgtc.com/` and `https://www.travelgtc.com/` redirect to `https://travelgtc.com/`.
PASS: expected markers `Travel Network Lab`, `Создавайте путешествия`, `Создайте собственный маршрут` and footer disclaimer text are present in live root.
PASS: `/var/www/travelgtc.com/assets/images/inbox/` is not present in live root.
```

External DNS check:

```bash
dig +short travelgtc.com A
dig +short www.travelgtc.com A
curl -I --max-time 8 http://travelgtc.com/
```

Result:

```text
Timeweb authoritative DNS now returns `20.91.187.79` for `travelgtc.com` and `www.travelgtc.com`.
Public recursive DNS caches may temporarily keep old values, including the removed Timeweb IPv6 AAAA record.
```

## 6. Timeweb DNS Changes

The required Timeweb DNS values are:

| Record | Type | Value |
|---|---|---|
| `@` / `travelgtc.com` | A | `20.91.187.79` |
| `www` / `www.travelgtc.com` | A | `20.91.187.79` |

The previous IPv6 AAAA record should stay removed unless this server receives a confirmed public IPv6 address for the site:

```text
travelgtc.com AAAA 2a03:6f00:1::5c35:60f6
```

Certificate issued:

```text
Certificate: /etc/letsencrypt/live/travelgtc.com/fullchain.pem
Key: /etc/letsencrypt/live/travelgtc.com/privkey.pem
Domains: travelgtc.com www.travelgtc.com
Expires: 2026-10-06
```

## 7. Rollback

| Item | Value |
|---|---|
| Backup path | Current repository source remains in `projects/travelgtc/public/`; live root can be re-synced from the previous commit if needed. |
| Rollback command | `git checkout <previous_commit> -- projects/travelgtc && projects/travelgtc/scripts/deploy_public_live.sh` |
| Rollback authority | Project Owner / GTC IT |

## 8. Result

```text
Server-side publication completed.
HTTPS is configured with a valid Let's Encrypt certificate.
The site is available through nginx on this server for `travelgtc.com`.
Public availability depends on recursive DNS cache propagation after the Timeweb DNS switch.
```

## 9. Revision History

| Version | Date | Author | Changes |
|---|---|---|
| 0.1 | 2026-07-08 | GTC IT / AI Assistant | Initial deploy/release report |
