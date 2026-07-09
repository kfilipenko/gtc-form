# TRAVELGTC-RUNTIME-001 - Test Database, API Service And Nginx Proxy Report

- Project: TravelGTC
- Source task: `docs/travelgtc/037_travelgtc_runtime_001_test_database_api_service_nginx_proxy_task.md`
- Document type: Implementation report
- Version: 0.1
- Date: 2026-07-09
- Status: Implemented, live HTTPS test funnel verified

## 1. Purpose

This report records the first server runtime for TravelGTC registration and authenticated lead submission.

The public site at `https://travelgtc.com` can now test:

1. `/auth/` registration;
2. login/session cookie;
3. authenticated travel-idea form submission;
4. lead persistence in the TravelGTC PostgreSQL database.

## 2. Runtime Installed

Server runtime:

```text
Database: travelgtc
Database app role: travelgtc_user
Runtime env file: /etc/travelgtc/travelgtc-api.env
Systemd service: travelgtc-api.service
API listen: 127.0.0.1:4301
Nginx public proxy: https://travelgtc.com/api/travelgtc/
Static live root: /var/www/travelgtc.com
```

The env file is intentionally outside git and has restricted permissions.

## 3. Runtime Switches

Current server settings:

```text
TRAVELGTC_APP_ENV=production
TRAVELGTC_API_HOST=127.0.0.1
TRAVELGTC_API_PORT=4301
TRAVELGTC_PUBLIC_LEAD_CAPTURE_ENABLED=false
TRAVELGTC_ACCOUNT_LEAD_CAPTURE_ENABLED=true
TRAVELGTC_AGENT_INTAKE_MODE=stub
TRAVELGTC_PARENT_NETWORK_MODE=none
TRAVELGTC_AUTH_SECURE_COOKIES=true
TRAVELGTC_AUTH_EMAIL_VERIFICATION_TEST_MODE=false
```

Meaning:

1. anonymous lead capture is still off;
2. authenticated account leads are enabled for testing;
3. cookies are HTTPS-secure;
4. AI intake remains a deterministic stub;
5. parent-network integration is not active;
6. email verification tokens are prepared but no email provider is connected.

## 4. Database

Created:

```text
PostgreSQL database: travelgtc
PostgreSQL role: travelgtc_user
```

Applied migrations:

```text
projects/travelgtc/app/migrations/001_travelgtc_lead_capture.sql
projects/travelgtc/app/migrations/002_travelgtc_identity_auth.sql
```

Live test data after verification:

```text
users=1
contacts=1
leads=1
sessions=1
```

These are disposable test records and may be cleared before production launch.

## 5. Nginx

Updated source template:

```text
projects/travelgtc/deploy/nginx/travelgtc.com.conf
```

Installed config:

```text
/etc/nginx/sites-available/travelgtc.com.conf
```

Added HTTPS proxy:

```text
location ^~ /api/travelgtc/ -> http://127.0.0.1:4301
```

The API direct port is local-only. Browser traffic uses the same public HTTPS origin as the static site.

## 6. Systemd

Added source service template:

```text
projects/travelgtc/deploy/systemd/travelgtc-api.service
```

Installed service:

```text
/etc/systemd/system/travelgtc-api.service
```

Status after installation:

```text
active (running)
enabled
```

## 7. Static Publication

The current public source was deployed to:

```text
/var/www/travelgtc.com
```

This published `/auth/` and the frontend auth-gate JavaScript to the live domain.

## 8. Verification

Commands run:

```bash
npm --prefix projects/travelgtc/app run build
npm run check:travelgtc-api
curl -fsS http://127.0.0.1:4301/api/travelgtc/v1/health
sudo nginx -t
curl -fsS https://travelgtc.com/api/travelgtc/v1/health
projects/travelgtc/scripts/deploy_public_live.sh
TRAVELGTC_FUNNEL_BASE_URL=https://travelgtc.com npm run test:travelgtc-funnel
TRAVELGTC_BASE_URL=https://travelgtc.com npm run test:travelgtc
```

Results:

```text
PASS: app build.
PASS: API check: 15 tests passed in 2 files.
PASS: local API health returned ok.
PASS: nginx config test.
PASS: HTTPS API health returned ok.
PASS: public static deploy completed.
PASS: live authenticated funnel: 1 Playwright test passed.
PASS: live responsive suite: 13 Playwright tests passed.
PASS: service remained active after live funnel test.
```

Live health body:

```json
{
  "ok": true,
  "service": "travelgtc-api",
  "env": "production",
  "lead_capture_enabled": false,
  "account_lead_capture_enabled": true,
  "agent_intake_mode": "stub",
  "parent_network_mode": "none"
}
```

## 9. Remaining Production Gates

Technically the TravelGTC test funnel is live.

Full production launch still requires:

1. privacy policy page;
2. terms/participation disclosure page;
3. explicit income/non-guarantee disclosure review;
4. email delivery provider or a clear no-email-verification flow;
5. backup/restore policy for `travelgtc`;
6. administrative CRM access control;
7. test-data cleanup before public launch announcement.

## 10. Next Step

Recommended next implementation task:

```text
TRAVELGTC-LEGAL-001 - Privacy, Consent And Public Disclosure Pages
```

Then:

```text
TRAVELGTC-CRM-001 - Lead Board And Lead Detail MVP
```

## 11. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-09 | GTC IT / AI Assistant | Initial runtime implementation report |
