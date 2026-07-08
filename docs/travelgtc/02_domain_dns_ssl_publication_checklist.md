# TravelGTC - Domain, DNS, SSL And Publication Checklist

- Project: TravelGTC
- Project code: travelgtc
- Domain: travelgtc.com
- Public base URL: https://travelgtc.com/
- Source root: `/var/www/gtc-form/projects/travelgtc`
- Public source: `/var/www/gtc-form/projects/travelgtc/public`
- Live root: `/var/www/travelgtc.com`
- Version: 0.4
- Date: 2026-07-08
- Status: Server and SSL prepared, DNS cache propagation pending

## 1. Purpose

This checklist tracks the future publication setup for `travelgtc.com`.

No live deployment is confirmed in this document yet. It is a preparation document so domain, SSL, nginx, publication source and rollback rules are not lost when implementation begins.

## 2. Domain Checklist

| Item | Status | Notes |
|---|---|---|
| Domain owner confirmed | Pending | Project Owner to confirm domain registrar and account access. |
| DNS A/AAAA records defined | Done at authoritative DNS | A `@` and `www` point to `20.91.187.79`; previous AAAA is removed at authoritative DNS. |
| `www.travelgtc.com` handling decided | Done | Nginx redirects `www.travelgtc.com` to `https://travelgtc.com`. |
| SSL certificate plan selected | Done | Let's Encrypt certificate issued for `travelgtc.com` and `www.travelgtc.com`. |
| Nginx/server block prepared | Done | `/etc/nginx/sites-available/travelgtc.com.conf` enabled and nginx reloaded. |
| Public root selected | Done | `/var/www/travelgtc.com`. |
| Smoke-test URL list defined | Done | See section 4. |
| Rollback path defined | Pending | Required before go-live. |

## 3. Publication Rules

1. Source files must live under `projects/travelgtc/`.
2. Public web assets must be prepared under `projects/travelgtc/public/`.
3. Raw images go to `projects/travelgtc/public/assets/images/inbox/`.
4. Optimized images approved for publication go to `projects/travelgtc/public/assets/images/processed/`.
5. Public documents, if any, should have one canonical public location under the website document section.
6. No production deployment is performed without a deploy report and smoke-test result.
7. Raw `assets/images/inbox/` must be excluded from live publication.

## 4. Current DNS State

Before Timeweb update, DNS was:

```text
travelgtc.com A      92.53.96.246
www.travelgtc.com A  92.53.96.246
travelgtc.com AAAA   2a03:6f00:1::5c35:60f6
```

Required Timeweb DNS records for publication on this server:

```text
travelgtc.com A      20.91.187.79
www.travelgtc.com A  20.91.187.79
```

Remove the current AAAA record unless a public IPv6 address is confirmed for this server.

After the Timeweb update, authoritative DNS returns:

```text
travelgtc.com A      20.91.187.79
www.travelgtc.com A  20.91.187.79
No authoritative AAAA record
```

Some recursive DNS caches may temporarily keep old values until TTL expiry.

## 5. First Smoke-Test Targets

First prototype routes to smoke-test after publication:

```text
https://travelgtc.com/
https://travelgtc.com/travel-lifestyle/
https://travelgtc.com/club/
https://travelgtc.com/create-trip/
https://travelgtc.com/business-model/
https://travelgtc.com/events/
https://travelgtc.com/about/
https://travelgtc.com/contacts/
```

Server-side Host-header smoke already passed before DNS cutover:

```text
http://127.0.0.1/ with Host travelgtc.com -> HTTP 200
http://20.91.187.79/ with Host travelgtc.com -> HTTP 200
https://travelgtc.com/ with forced DNS 20.91.187.79 -> HTTP 200
```

## 6. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.4 | 2026-07-08 | GTC IT / AI Assistant | Recorded authoritative DNS update and Let's Encrypt SSL completion |
| 0.3 | 2026-07-08 | GTC IT / AI Assistant | Recorded live root, nginx status, current DNS state and required Timeweb DNS changes |
| 0.2 | 2026-07-08 | GTC IT / AI Assistant | Added first public prototype route smoke-test targets |
| 0.1 | 2026-07-08 | GTC IT / AI Assistant | Initial domain and publication checklist for travelgtc.com |
