# CrewPortGlobal Backend DB

## Scope

This directory contains database migration artifacts for implementation tasks in the CrewPortGlobal backend.

Current step:

- CPG-BE-001: registration database foundation
- CPG-MKT-002: reviewed vacancy request foundation
- CPG-MKT-003: reviewed vacancy application foundation
- CPG-EMP-008: employer shortlist action fields for presented applications
- CPG-ACCESS-001: access-control foundation draft only

## Migration Files

- migrations/001_create_registration_foundation.sql
- migrations/002_extend_seafarer_profiles_practical_fields.sql
- migrations/003_create_vacancy_requests.sql
- migrations/004_create_vacancy_applications.sql
- migrations/005_extend_vacancy_applications_employer_shortlist.sql
- migrations/006_access_control_foundation_draft.sql

Migration `006_access_control_foundation_draft.sql` is a draft-only access-control package. It must not be applied to production until separately reviewed and approved.

## Objects Created by 001

Schema:

- crewportglobal

Tables:

- crewportglobal.users
- crewportglobal.user_auth_identities
- crewportglobal.user_roles
- crewportglobal.seafarer_profiles
- crewportglobal.employer_companies
- crewportglobal.company_users
- crewportglobal.vessels
- crewportglobal.registration_audit_events

Additional marketplace table:

- crewportglobal.vacancy_requests
- crewportglobal.vacancy_applications

## Apply Migration

Example command:

```bash
PGUSER=<user> PGPASSWORD=<password> PGDATABASE=<db> psql -v ON_ERROR_STOP=1 -f projects/crewportglobal/app/backend/db/migrations/001_create_registration_foundation.sql
PGUSER=<user> PGPASSWORD=<password> PGDATABASE=<db> psql -v ON_ERROR_STOP=1 -f projects/crewportglobal/app/backend/db/migrations/002_extend_seafarer_profiles_practical_fields.sql
PGUSER=<user> PGPASSWORD=<password> PGDATABASE=<db> psql -v ON_ERROR_STOP=1 -f projects/crewportglobal/app/backend/db/migrations/003_create_vacancy_requests.sql
PGUSER=<user> PGPASSWORD=<password> PGDATABASE=<db> psql -v ON_ERROR_STOP=1 -f projects/crewportglobal/app/backend/db/migrations/004_create_vacancy_applications.sql
PGUSER=<user> PGPASSWORD=<password> PGDATABASE=<db> psql -v ON_ERROR_STOP=1 -f projects/crewportglobal/app/backend/db/migrations/005_extend_vacancy_applications_employer_shortlist.sql
```

Do not include `006_access_control_foundation_draft.sql` in normal apply commands until the access-control review package is approved for a non-production target.

Static draft validation without a database connection:

```bash
php projects/crewportglobal/app/backend/api/tests/access_control_migration_draft_test.php
```

## Idempotency

Migration 001 is written to be re-runnable:

- CREATE SCHEMA IF NOT EXISTS
- CREATE EXTENSION IF NOT EXISTS
- CREATE TABLE IF NOT EXISTS
- CREATE INDEX IF NOT EXISTS
- trigger recreation via DROP TRIGGER IF EXISTS + CREATE TRIGGER

## Out of Scope for CPG-BE-001

- API handlers
- frontend form submission wiring
- password hashing
- login sessions
- deployment changes
- nginx/Stripe/OpenClaw changes
