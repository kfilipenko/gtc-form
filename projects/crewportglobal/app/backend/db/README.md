# CrewPortGlobal Backend DB

## Scope

This directory contains database migration artifacts for implementation tasks in the CrewPortGlobal backend.

Current step:

- CPG-BE-001: registration database foundation

## Migration Files

- migrations/001_create_registration_foundation.sql

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

## Apply Migration

Example command:

```bash
PGUSER=<user> PGPASSWORD=<password> PGDATABASE=<db> psql -v ON_ERROR_STOP=1 -f projects/crewportglobal/app/backend/db/migrations/001_create_registration_foundation.sql
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
