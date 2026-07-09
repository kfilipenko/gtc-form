# TRAVELGTC-AUTH-002 - GTC Identity Database And Auth API MVP

- Project: TravelGTC
- Owner: Project Owner
- Source specification: `docs/travelgtc/030_travelgtc_auth_001_gtc_identity_registration_gate_spec.md`
- Document type: Task
- Version: 0.1
- Date: 2026-07-09
- Status: Implemented

## 1. Purpose

Implement the first backend foundation for shared GTC identity authentication in TravelGTC.

The goal is to let TravelGTC use one shared GTC user account model while keeping TravelGTC roles, CRM leads, travel ideas and consents project-specific.

The accepted product rule:

```text
Existing CrewPortGlobal/GTC user -> login on TravelGTC without duplicate registration
Authenticated user -> TravelGTC role/need form -> TravelGTC project role/context -> CRM lead
```

## 2. Business Purpose

TravelGTC must move from a public anonymous lead form toward a controlled funnel:

1. identify the person through a shared GTC account;
2. avoid duplicate accounts for users from other GTC projects;
3. create TravelGTC role/context only from TravelGTC action;
4. link leads and travel ideas to `user_id`;
5. prepare CRM, referral, consultation and AI follow-up logic on a stable identity.

## 3. Scope

Implement:

1. shared `gtc_identity` database schema migration;
2. optional compatibility backfill from CrewPortGlobal identity/credentials only;
3. auth store abstraction with memory and PostgreSQL implementations;
4. password hashing/verification compatible with PHP `password_hash` bcrypt prefixes;
5. session-token hashing and secure cookie handling;
6. registration endpoint;
7. login endpoint;
8. logout endpoint;
9. current-user endpoint;
10. email verification token endpoints in test/prepared mode;
11. authenticated `account/leads` endpoint;
12. link authenticated lead submissions to `user_id`;
13. focused API tests.

## 4. Out Of Scope

This task does not include:

1. frontend registration/login UI;
2. public header account controls;
3. production email sending;
4. live database migration execution;
5. nginx `/api` proxy configuration;
6. real CRM operator interface;
7. importing maritime documents, seafarer profiles, medical data, employer data, vessel data or contract data into TravelGTC;
8. official parent-network account integration.

## 5. Implementation Requirements

The implementation must:

1. store only password hashes, never raw passwords;
2. store only hashed session tokens;
3. set auth cookies as `HttpOnly` and `SameSite=Lax`;
4. set `Secure` cookies in production mode or when configured;
5. prevent duplicate registration for an existing shared email;
6. allow login for an existing shared identity;
7. create TravelGTC membership/role only when the user submits a TravelGTC lead/action;
8. keep anonymous public browsing available;
9. reject authenticated lead submission without a valid session;
10. keep public lead capture disabled separately from authenticated account lead capture.

## 6. Acceptance Criteria

The task is complete when:

1. `002_gtc_identity_auth.sql` exists and defines shared identity/auth tables;
2. TravelGTC API exposes auth endpoints;
3. existing-account login path is tested;
4. duplicate registration is tested;
5. authenticated lead submission is tested;
6. anonymous account lead submission is rejected;
7. email verification test token path is tested;
8. TypeScript build passes;
9. API tests pass;
10. documentation register and memory are updated;
11. repository changes are committed.

## 7. Verification Plan

Run:

```bash
npm --prefix projects/travelgtc/app run check
git diff --check
```

Review:

```text
projects/travelgtc/app/migrations/002_gtc_identity_auth.sql
projects/travelgtc/app/src/modules/auth/
projects/travelgtc/app/tests/auth.test.ts
```

## 8. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-09 | GTC IT / AI Assistant | Initial implementation task |
