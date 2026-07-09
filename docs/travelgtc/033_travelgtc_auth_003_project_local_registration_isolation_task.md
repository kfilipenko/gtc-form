# TRAVELGTC-AUTH-003 - Project-Local Registration Isolation

- Project: TravelGTC
- Owner: Project Owner
- Source instruction: Project Owner rejected shared cross-project user database because of leakage, migration and portability risks
- Supersedes: shared `gtc_identity` direction in `TRAVELGTC-AUTH-001` and `TRAVELGTC-AUTH-002`
- Document type: Task
- Version: 0.1
- Date: 2026-07-09
- Status: Implemented

## 1. Purpose

Replace the previously planned shared GTC identity approach with a simple project-local TravelGTC registration model.

TravelGTC must have its own user registration database and must not depend on CrewPortGlobal or any other GTC project for login.

The accepted rule:

```text
TravelGTC user registration is local to TravelGTC.
An email that exists in CrewPortGlobal does not affect TravelGTC registration.
TravelGTC role and CRM data are stored only in TravelGTC.
```

## 2. Business Reason

The shared user model creates risks that are not justified at this stage:

1. unclear data boundaries between projects;
2. risk of accidental data transfer from CrewPortGlobal to TravelGTC;
3. harder future project separation to another server;
4. more complex migrations;
5. more complicated consent and privacy explanation;
6. unclear operational benefit for the current TravelGTC funnel.

The safer model is:

```text
one project -> one user database -> one CRM scope -> explicit project consent
```

## 3. Scope

Implement:

1. replace shared `gtc_identity` database schema with local `travelgtc_identity`;
2. remove optional CrewPortGlobal identity/credential backfill;
3. keep existing registration/login/session/email verification mechanics;
4. keep authenticated `account/leads` endpoint;
5. link TravelGTC leads only to local TravelGTC users;
6. update tests and environment defaults;
7. update documentation and memory.

## 4. Out Of Scope

This task does not include:

1. frontend auth UI;
2. database migration execution on a live database;
3. deleting any existing test database schema manually;
4. connecting CrewPortGlobal users to TravelGTC;
5. copying any CrewPortGlobal data;
6. building CRM screens.

## 5. Implementation Requirements

The implementation must:

1. use `travelgtc_identity` as the identity schema;
2. avoid reads from `crewportglobal.*`;
3. avoid writes to `crewportglobal.*`;
4. avoid shared identity backfill;
5. keep duplicate-email blocking only inside TravelGTC's own user table;
6. preserve secure password/session patterns;
7. preserve tests for registration, login, logout, current user, email verification and authenticated lead submission.

## 6. Acceptance Criteria

The task is complete when:

1. runtime code no longer references `gtc_identity`;
2. runtime code no longer references `crewportglobal` backfill;
3. migration creates `travelgtc_identity`;
4. tests pass;
5. docs clearly mark the shared identity direction as superseded;
6. repository changes are committed.

## 7. Verification Plan

Run:

```bash
npm run check:travelgtc-api
rg -n "\\bgtc_identity\\b|crewportglobal|CrewPortGlobal|backfill" projects/travelgtc/app
git diff --check
```

## 8. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-09 | GTC IT / AI Assistant | Initial project-local registration isolation task |
