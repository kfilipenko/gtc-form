# TRAVELGTC-WEB-007 - Public Funnel Role Selector And Form

- Project: TravelGTC
- Owner: Project Owner
- Source roadmap: `docs/travelgtc/022_travelgtc_roadmap_001_site_crm_business_process_mapping_spec.md`
- Source API implementation: `docs/travelgtc/026_travelgtc_api_001_lead_capture_api_database_schema_report.md`
- Document type: Task
- Version: 0.1
- Date: 2026-07-09
- Status: Implemented

## 1. Purpose

Connect the public TravelGTC website to the lead capture API through a real funnel form.

The public website must move from prototype-only forms to a working sequence:

```text
role selection -> structured form -> API payload -> test lead creation -> confirmation
```

## 2. Business Purpose

The site should guide the user from travel/community interest into a clear next action.

The form must start from the user's need:

1. travel more;
2. create a trip;
3. gather people;
4. organize an event;
5. understand the club or partner model calmly.

The form must not push the user directly into a business opportunity.

## 3. Scope

In scope:

1. add role selector to the home funnel form;
2. add unified lead form fields matching `POST /api/travelgtc/v1/public/leads`;
3. add consent checkboxes and consent version;
4. connect public JS to the API endpoint;
5. map UTM/referral/source fields into tracking payload;
6. convert `/create-trip/` form to the API contract;
7. convert `/contacts/` form to the API contract;
8. add local funnel e2e test with local static server and local API server;
9. keep live deployment blocked until API runtime/proxy exists.

## 4. Out Of Scope

Out of scope:

1. production API service installation;
2. nginx `/api` reverse proxy;
3. PostgreSQL test/production database creation;
4. CRM UI;
5. live lead collection;
6. parent-network integration;
7. outbound messaging.

## 5. Acceptance Criteria

The task is complete when:

1. home page contains `form[data-travelgtc-lead-form]`;
2. role selector writes `declared_role`;
3. form sends payload to `/api/travelgtc/v1/public/leads`;
4. local test mode sends a test lead through the API;
5. `/create-trip/` and `/contacts/` use the same API contract;
6. validation and API errors are visible to the user;
7. responsive tests still pass;
8. documentation register and memory are updated;
9. repository changes are committed.

## 6. Verification Plan

Minimum verification:

1. `node --check projects/travelgtc/public/assets/js/site.js`;
2. `bash -n projects/travelgtc/scripts/start_funnel_test_servers.sh`;
3. `npm run check:travelgtc-api`;
4. `npm run test:travelgtc`;
5. `npm run test:travelgtc-funnel`;
6. `git diff --check`;
7. inspect `git status --short`;
8. commit the implementation.

## 7. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-09 | GTC IT / AI Assistant | Initial task |
