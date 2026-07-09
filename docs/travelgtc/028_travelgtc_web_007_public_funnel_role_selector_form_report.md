# TRAVELGTC-WEB-007 - Public Funnel Role Selector And Form Report

- Project: TravelGTC
- Source task: `docs/travelgtc/027_travelgtc_web_007_public_funnel_role_selector_form_task.md`
- Document type: Implementation report
- Version: 0.1
- Date: 2026-07-09
- Status: Implemented, local/test funnel verified

## 1. Purpose

This report records the public funnel implementation that connects website forms to the TravelGTC lead capture API in local/test mode.

## 2. Implementation Summary

Implemented:

1. Home page real funnel form with:
   - role selector;
   - contact fields;
   - primary interest;
   - travel format;
   - destination;
   - audience;
   - approximate dates;
   - group size;
   - business-interest level;
   - message;
   - consent checkboxes;
   - consent version.
2. API submit logic in `public/assets/js/site.js`.
3. Automatic tracking payload:
   - landing path;
   - referrer;
   - UTM values;
   - referral code;
   - locale;
   - timezone;
   - `client_event_id`.
4. `/create-trip/` form converted to the same API contract.
5. `/contacts/` form converted to the same API contract.
6. Local e2e funnel test:
   - static site on `127.0.0.1:4174`;
   - API server on `127.0.0.1:4302`;
   - lead capture enabled only for the test process;
   - in-memory store, no PostgreSQL write.
7. Responsive test updated to assert that the home page renders the real lead form.

## 3. API Integration

The public JS submits to:

```text
POST /api/travelgtc/v1/public/leads
```

Local static-test mapping:

```text
http://127.0.0.1:4173 -> http://127.0.0.1:4301
http://127.0.0.1:4174 -> http://127.0.0.1:4302
```

Production expectation:

```text
https://travelgtc.com/api/travelgtc/v1/public/leads
```

Production will require nginx `/api` proxy and a running TravelGTC API service before live lead capture is enabled.

## 4. Runtime Safety

The funnel e2e test creates only temporary test leads in the local in-memory API process.

The live static website was not deployed in this task because the current nginx config does not yet proxy `/api` to the TravelGTC API service.

Deploying the static form before the API runtime/proxy exists would show the form publicly, but submissions would not reach the backend.

## 5. Verification

Commands run:

```bash
node --check projects/travelgtc/public/assets/js/site.js
bash -n projects/travelgtc/scripts/start_funnel_test_servers.sh
npm run check:travelgtc-api
npm run test:travelgtc
npm run test:travelgtc-funnel
git diff --check
```

Results:

```text
PASS: public JS syntax check passed.
PASS: funnel test server script syntax check passed.
PASS: API build/tests passed: 7 tests.
PASS: public responsive Playwright tests passed: 12 tests.
PASS: funnel e2e Playwright test passed: 1 test.
PASS: funnel e2e created a test lead through the local API.
PASS: source diff whitespace check passed.
```

## 6. Files Changed

Main files:

```text
projects/travelgtc/public/index.html
projects/travelgtc/public/create-trip/index.html
projects/travelgtc/public/contacts/index.html
projects/travelgtc/public/assets/js/site.js
projects/travelgtc/public/assets/css/site.css
projects/travelgtc/scripts/start_funnel_test_servers.sh
playwright.travelgtc.funnel.config.ts
tests/travelgtc-funnel.spec.ts
tests/travelgtc-responsive.spec.ts
package.json
```

## 7. Known Gaps

Remaining work:

1. create/configure dedicated TravelGTC PostgreSQL database;
2. run `001_travelgtc_lead_capture.sql` against the safe database;
3. run TravelGTC API as a server process;
4. add nginx `/api` reverse proxy;
5. decide test-vs-production data retention/cleanup;
6. publish static form to live only after runtime path is ready;
7. build CRM board/detail to see captured leads.

## 8. Next Step

Recommended next implementation task:

```text
TRAVELGTC-RUNTIME-001 - Test Database, API Service And Nginx Proxy
```

Then:

```text
TRAVELGTC-CRM-001 - Lead Board And Lead Detail MVP
```

## 9. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-09 | GTC IT / AI Assistant | Initial implementation report |
