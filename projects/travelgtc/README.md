# TravelGTC Project Source

- Project: TravelGTC
- Project code: travelgtc
- Domain: travelgtc.com
- Status: Live test runtime active for authenticated registration and lead funnel

## Purpose

This folder contains source files for the TravelGTC website project.

The project now contains the first static public prototype for the final concept:

```text
Travel Network Lab
```

## Current Layout

```text
projects/travelgtc/
  app/
    src/
    migrations/
    tests/
  public/
    index.html
    travel-lifestyle/
    club/
    create-trip/
    business-model/
    events/
    about/
    contacts/
    assets/
      images/
        inbox/
        processed/
    legal/
  deploy/
    nginx/
    systemd/
  scripts/
```

## Image Workflow

1. Put raw images in `public/assets/images/inbox/`.
2. Keep original filenames readable where possible.
3. After review and optimization, approved web images should be placed in `public/assets/images/processed/`.
4. Public pages should reference only processed/approved images.

## Prototype Routes

```text
/
/travel-lifestyle/
/club/
/create-trip/
/business-model/
/events/
/about/
/contacts/
/auth/
```

## API Application

The first backend application lives in:

```text
projects/travelgtc/app/
```

It provides:

```text
GET  /api/travelgtc/v1/health
POST /api/travelgtc/v1/public/leads
POST /api/travelgtc/v1/auth/register
POST /api/travelgtc/v1/auth/login
POST /api/travelgtc/v1/auth/logout
GET  /api/travelgtc/v1/auth/me
POST /api/travelgtc/v1/account/leads
```

By default anonymous public lead capture is disabled. Live test runtime enables authenticated account lead capture:

```text
TRAVELGTC_PUBLIC_LEAD_CAPTURE_ENABLED=false
TRAVELGTC_ACCOUNT_LEAD_CAPTURE_ENABLED=true
```

Run local API checks:

```bash
npm run check:travelgtc-api
```

Run public funnel e2e with a local static server and local in-memory API:

```bash
npm run test:travelgtc-funnel
```

Live API submissions require a running TravelGTC API service and nginx `/api` proxy.

## Runtime

Current server runtime:

```text
Database: travelgtc
Database app role: travelgtc_user
API service: travelgtc-api.service
API bind: 127.0.0.1:4301
Runtime env file: /etc/travelgtc/travelgtc-api.env
HTTPS proxy: https://travelgtc.com/api/travelgtc/
Systemd template: projects/travelgtc/deploy/systemd/travelgtc-api.service
```

Common checks:

```bash
sudo systemctl status travelgtc-api --no-pager -l
curl -fsS http://127.0.0.1:4301/api/travelgtc/v1/health
curl -fsS https://travelgtc.com/api/travelgtc/v1/health
TRAVELGTC_FUNNEL_BASE_URL=https://travelgtc.com npm run test:travelgtc-funnel
TRAVELGTC_BASE_URL=https://travelgtc.com npm run test:travelgtc
```

The current live database may contain disposable test records from verification. Clear or archive them before a public launch announcement.

## Publication

Server-side publication uses:

```text
Live root: /var/www/travelgtc.com
Deploy script: projects/travelgtc/scripts/deploy_public_live.sh
Nginx template: projects/travelgtc/deploy/nginx/travelgtc.com.conf
Installed nginx config: /etc/nginx/sites-available/travelgtc.com.conf
Installed API service: /etc/systemd/system/travelgtc-api.service
```

Run publication sync:

```bash
projects/travelgtc/scripts/deploy_public_live.sh
```

The deploy script excludes raw `public/assets/images/inbox/` files from the live root.

Authoritative Timeweb DNS points `travelgtc.com` and `www.travelgtc.com` to `20.91.187.79`, Let's Encrypt SSL is issued for both names, and nginx proxies `/api/travelgtc/` to the local TravelGTC API service.

## Related Documentation

```text
docs/travelgtc/00_documentation_register.md
docs/travelgtc/01_project_scope_and_positioning.md
docs/travelgtc/02_domain_dns_ssl_publication_checklist.md
docs/travelgtc/03_visual_reference_and_product_direction.md
docs/travelgtc/05_project_memory_handoff.md
```
