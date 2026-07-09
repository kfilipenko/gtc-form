# TRAVELGTC-API-001 - Lead Capture API And Database Schema

- Project: TravelGTC
- Owner: Project Owner
- Source MVP requirements: `docs/travelgtc/020_travelgtc_biz_001_funnel_crm_mvp_requirements_spec.md`
- Source roadmap: `docs/travelgtc/022_travelgtc_roadmap_001_site_crm_business_process_mapping_spec.md`
- Source readiness gate: `docs/travelgtc/024_travelgtc_prep_001_implementation_readiness_checklist_spec.md`
- Document type: Task
- Version: 0.1
- Date: 2026-07-09
- Status: Implemented

## 1. Purpose

Create the first TravelGTC backend foundation for structured lead capture.

The task must add:

1. API application skeleton;
2. PostgreSQL schema migration;
3. public lead submission endpoint;
4. validation and consent enforcement;
5. idempotency by `client_event_id`;
6. rate limiting;
7. initial CRM records;
8. Intake Agent stub record;
9. focused API tests.

## 2. Business Purpose

TravelGTC must stop treating forms as isolated page elements and start creating a structured CRM process.

The endpoint must support the first operational sequence:

```text
public form -> contact -> lead -> travel idea -> interaction -> task -> intake agent run -> human review
```

The API must remain production-safe. Public lead capture must be disabled by default until privacy, consent and disclosure pages are approved.

## 3. Scope

In scope:

1. create `projects/travelgtc/app/`;
2. add Node.js/TypeScript backend package;
3. add `GET /api/travelgtc/v1/health`;
4. add `POST /api/travelgtc/v1/public/leads`;
5. add `.env.example`;
6. add SQL migration for first CRM tables;
7. add in-memory test store;
8. add PostgreSQL store for future runtime;
9. add API tests for success, disabled capture, validation, duplicate submission and rate limiting;
10. add root npm scripts for TravelGTC API checks.

## 4. Out Of Scope

Out of scope:

1. public website form wiring;
2. CRM UI;
3. production database provisioning;
4. applying migration to production database;
5. real AI provider integration;
6. parent-network API integration;
7. outbound message sending;
8. production personal-data collection.

## 5. Acceptance Criteria

The task is complete when:

1. `projects/travelgtc/app/` exists with TypeScript backend source;
2. `.env.example` contains no secrets and keeps lead capture disabled by default;
3. migration creates the first CRM tables from MVP requirements;
4. health endpoint is implemented;
5. public lead endpoint validates required fields, enums and consent;
6. disabled capture returns a safe non-persistence response;
7. duplicate `client_event_id` returns `409 duplicate_submission`;
8. rate limit returns `429 rate_limited`;
9. valid submission creates CRM-intake records in the store;
10. Intake Agent stub output requires human review;
11. API tests pass;
12. register, memory and report are updated;
13. repository changes are committed.

## 6. Verification Plan

Minimum verification:

1. `npm --prefix projects/travelgtc/app install`;
2. `npm run check:travelgtc-api`;
3. `node --check projects/travelgtc/public/assets/js/site.js`;
4. `git diff --check`;
5. inspect `git status --short`;
6. commit the implementation.

Database migration application is intentionally excluded until a dedicated TravelGTC database or test database is configured.

## 7. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-09 | GTC IT / AI Assistant | Initial task |
