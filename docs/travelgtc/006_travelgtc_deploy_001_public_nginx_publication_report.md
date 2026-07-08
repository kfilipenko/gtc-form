# TRAVELGTC-DEPLOY-001 - Public Nginx Publication Report

- Project: TravelGTC
- Environment: GTC1 server
- Public base URL: `https://travelgtc.com/`
- Document type: Deploy/release report
- Version: 0.1
- Date: 2026-07-08
- Status: Server-side publication completed, Timeweb DNS switch pending

## 1. Purpose

This report fixes the server-side publication of the first Travel Network Lab prototype.

The site is deployed on this server and ready for DNS cutover. The public domain is not yet serving it because Timeweb DNS still points to `92.53.96.246`.

## 2. Release Scope

1. Added TravelGTC nginx vhost template.
2. Added repeatable public deploy script.
3. Created live root `/var/www/travelgtc.com`.
4. Synced `projects/travelgtc/public/` to live root.
5. Excluded `assets/images/inbox/` from live publication.
6. Installed nginx config to `/etc/nginx/sites-available/travelgtc.com.conf`.
7. Enabled nginx site through `/etc/nginx/sites-enabled/travelgtc.com.conf`.
8. Reloaded nginx.

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
travelgtc.com -> 92.53.96.246
www.travelgtc.com -> 92.53.96.246
External HTTP to current DNS target timed out.
```

## 6. Required Timeweb DNS Changes

In the Timeweb DNS zone for `travelgtc.com`, set:

| Record | Type | Value |
|---|---|---|
| `@` / `travelgtc.com` | A | `20.91.187.79` |
| `www` / `www.travelgtc.com` | A | `20.91.187.79` |

Remove or replace the current IPv6 AAAA record unless this server receives a confirmed public IPv6 address for the site:

```text
travelgtc.com AAAA 2a03:6f00:1::5c35:60f6
```

After DNS propagation, issue SSL:

```bash
sudo certbot --nginx -d travelgtc.com -d www.travelgtc.com
```

Then run live smoke checks against:

```text
https://travelgtc.com/
https://travelgtc.com/create-trip/
https://travelgtc.com/contacts/
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
The site is available through nginx on this server when requested with Host travelgtc.com.
Public domain cutover is pending Timeweb DNS update from 92.53.96.246 to 20.91.187.79.
SSL is pending DNS propagation.
```

## 9. Revision History

| Version | Date | Author | Changes |
|---|---|---|
| 0.1 | 2026-07-08 | GTC IT / AI Assistant | Initial deploy/release report |
