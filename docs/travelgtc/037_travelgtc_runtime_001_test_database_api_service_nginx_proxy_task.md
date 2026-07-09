# TRAVELGTC-RUNTIME-001 - Test Database, API Service And Nginx Proxy

- Project: TravelGTC
- Owner: Project Owner
- Source instruction: continue after frontend registration gate and make the currently non-working site usable for testing
- Depends on: `TRAVELGTC-AUTH-004 - Frontend Registration Gate And Authenticated Lead Form`
- Document type: Task
- Version: 0.1
- Date: 2026-07-09
- Status: Implemented

## 1. Purpose

Bring the TravelGTC API from local-only development into a controlled server runtime so the published website can test registration, login and authenticated lead submission through `travelgtc.com`.

This is a test/staging runtime stage, not final production readiness.

## 2. Accepted Runtime Model

Use an isolated TravelGTC runtime:

```text
PostgreSQL database: travelgtc
PostgreSQL app role: travelgtc_user
API listen address: 127.0.0.1
API port: 4301
Systemd service: travelgtc-api.service
Nginx public proxy path: /api/travelgtc/
Static public root: /var/www/travelgtc.com
```

The API must not expose a direct public port. Public browser calls must go through HTTPS nginx proxy on the same domain.

## 3. Scope

Implement:

1. create a safe TravelGTC PostgreSQL database and app role;
2. apply migrations:
   - `001_travelgtc_lead_capture.sql`;
   - `002_travelgtc_identity_auth.sql`;
3. add a server-side environment file outside git;
4. build the TravelGTC app;
5. add a systemd service template to the repository;
6. install and start the live `travelgtc-api.service`;
7. add nginx `/api/travelgtc/` reverse proxy to the source template;
8. install the updated nginx config;
9. deploy current static public files to `/var/www/travelgtc.com`;
10. verify health, registration and authenticated lead submission through HTTPS.

## 4. Controlled Test Switches

For this runtime stage:

```text
TRAVELGTC_PUBLIC_LEAD_CAPTURE_ENABLED=false
TRAVELGTC_ACCOUNT_LEAD_CAPTURE_ENABLED=true
TRAVELGTC_AGENT_INTAKE_MODE=stub
TRAVELGTC_PARENT_NETWORK_MODE=none
TRAVELGTC_AUTH_EMAIL_VERIFICATION_TEST_MODE=false
```

This means:

1. anonymous lead capture is disabled;
2. authenticated TravelGTC users can submit test leads;
3. AI agent work is still a deterministic stub;
4. parent-network integration is not active;
5. email verification tokens are prepared but not emailed until an email provider is configured.

## 5. Out Of Scope

This task does not include:

1. CRM board UI;
2. production email delivery;
3. password reset;
4. parent-network API integration;
5. payment or membership activation;
6. replacing Intake Agent stub with a live AI agent;
7. final production legal launch.

## 6. Production Caveat

The site may become technically usable for testing, but true production mode remains blocked until:

1. privacy policy is approved;
2. terms/participation disclosures are approved;
3. income/non-guarantee disclaimers are reviewed;
4. email delivery and operational data handling are approved;
5. backup/restore expectations for the TravelGTC database are fixed.

## 7. Acceptance Criteria

The task is complete when:

1. database migrations are applied to `travelgtc`;
2. `travelgtc-api.service` is active;
3. local API health returns `ok`;
4. nginx config test passes;
5. `https://travelgtc.com/api/travelgtc/v1/health` returns `ok`;
6. public `/auth/` registration works through HTTPS;
7. authenticated public form submission creates a lead through HTTPS;
8. source runtime templates and docs are updated;
9. verification commands pass;
10. repository changes are committed.

## 8. Verification Plan

Run:

```bash
npm --prefix projects/travelgtc/app run build
npm run check:travelgtc-api
sudo systemctl status travelgtc-api --no-pager -l
curl -fsS http://127.0.0.1:4301/api/travelgtc/v1/health
sudo nginx -t
curl -fsS https://travelgtc.com/api/travelgtc/v1/health
npm run test:travelgtc
TRAVELGTC_BASE_URL=https://travelgtc.com npm run test:travelgtc
```

For the authenticated live funnel, use a dedicated Playwright test that registers a disposable test account and submits a disposable test lead through `https://travelgtc.com`.

## 9. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-09 | GTC IT / AI Assistant | Initial runtime task |
