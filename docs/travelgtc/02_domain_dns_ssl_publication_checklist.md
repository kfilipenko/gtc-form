# TravelGTC - Domain, DNS, SSL And Publication Checklist

- Project: TravelGTC
- Project code: travelgtc
- Domain: travelgtc.com
- Public base URL: https://travelgtc.com/
- Source root: `/var/www/gtc-form/projects/travelgtc`
- Public source: `/var/www/gtc-form/projects/travelgtc/public`
- Live root: to be confirmed
- Version: 0.2
- Date: 2026-07-08
- Status: Draft, first public prototype routes defined

## 1. Purpose

This checklist tracks the future publication setup for `travelgtc.com`.

No live deployment is confirmed in this document yet. It is a preparation document so domain, SSL, nginx, publication source and rollback rules are not lost when implementation begins.

## 2. Domain Checklist

| Item | Status | Notes |
|---|---|---|
| Domain owner confirmed | Pending | Project Owner to confirm domain registrar and account access. |
| DNS A/AAAA records defined | Pending | To be configured after live server target is selected. |
| `www.travelgtc.com` handling decided | Pending | Redirect or separate host to be confirmed. |
| SSL certificate plan selected | Pending | Usually Let's Encrypt unless another provider is required. |
| Nginx/server block prepared | Pending | Create after live root and deployment model are confirmed. |
| Public root selected | Pending | Must match deploy strategy. |
| Smoke-test URL list defined | Pending | Required before go-live. |
| Rollback path defined | Pending | Required before go-live. |

## 3. Publication Rules

1. Source files must live under `projects/travelgtc/`.
2. Public web assets must be prepared under `projects/travelgtc/public/`.
3. Raw images go to `projects/travelgtc/public/assets/images/inbox/`.
4. Optimized images approved for publication go to `projects/travelgtc/public/assets/images/processed/`.
5. Public documents, if any, should have one canonical public location under the website document section.
6. No production deployment is performed without a deploy report and smoke-test result.

## 4. First Smoke-Test Targets

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

## 5. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.2 | 2026-07-08 | GTC IT / AI Assistant | Added first public prototype route smoke-test targets |
| 0.1 | 2026-07-08 | GTC IT / AI Assistant | Initial domain and publication checklist for travelgtc.com |
